"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, CheckCircle, AlertCircle, Database, Eye, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import * as XLSX from "xlsx"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface ImportResults {
  categorias: number
  ingredientes: number
  actualizados: number
  precios: number
  errores: string[]
}

interface Restaurante {
  id: string
  nombre: string
}

interface ExcelRow {
  [key: string]: any
}

export default function ImportarExcelCorrectoPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [importResults, setImportResults] = useState<ImportResults>({
    categorias: 0,
    ingredientes: 0,
    actualizados: 0,
    precios: 0,
    errores: [],
  })
  const [previewData, setPreviewData] = useState<ExcelRow[]>([])
  const [allData, setAllData] = useState<ExcelRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [selectedRestaurante, setSelectedRestaurante] = useState<string>("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({})
  const [precioColumns, setPrecioColumns] = useState<string[]>([])
  const { toast } = useToast()

  // Orden exacto de las columnas según el Excel
  const expectedColumnOrder = [
    "Clave Innsist",
    "Clave Rapsodia",
    "Descripción del artículo",
    "Categoria",
    "Ingrediente",
    "Tipo",
    "Metrica",
    "Cantidad",
    "Precio total",
    "Metrica Convertida",
    "Conversion",
    "GR/ML/PZA",
    "Unitario",
  ]

  // Cargar restaurantes al montar el componente
  useEffect(() => {
    const cargarRestaurantes = async () => {
      try {
        const { data, error } = await supabase.from("restaurantes").select("id, nombre").order("nombre")

        if (error) throw error
        setRestaurantes(data || [])

        // Si hay restaurantes, seleccionar el primero por defecto
        if (data && data.length > 0) {
          setSelectedRestaurante(data[0].id)
          addLog(`Restaurante seleccionado automáticamente: ${data[0].nombre} (${data[0].id})`)
        }
      } catch (error) {
        console.error("Error cargando restaurantes:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los restaurantes",
          variant: "destructive",
        })
      }
    }

    cargarRestaurantes()
  }, [toast])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    if (!selectedRestaurante) {
      toast({
        title: "Error",
        description: "Debes seleccionar un restaurante antes de cargar un archivo",
        variant: "destructive",
      })
      return
    }

    if (
      selectedFile &&
      (selectedFile.type.includes("spreadsheet") ||
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls"))
    ) {
      setFile(selectedFile)
      setImportStatus("idle")
      setPreviewData([])
      setShowPreview(false)
      setLogs([])
      addLog(`Archivo seleccionado: ${selectedFile.name}`)

      // Procesar automáticamente el archivo al seleccionarlo
      await processFileUpload(selectedFile)
    } else if (selectedFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo Excel (.xlsx, .xls)",
        variant: "destructive",
      })
    }
  }

  const processFileUpload = async (fileToProcess = file) => {
    if (!fileToProcess) return

    try {
      setLoading(true)
      setImportStatus("processing")
      setProgress(0)
      addLog(`Procesando archivo: ${fileToProcess.name}`)

      const data = await fileToProcess.arrayBuffer()
      setProgress(20)
      addLog(`Archivo leído: ${data.byteLength} bytes`)

      await processFileData(data)
    } catch (error: any) {
      setImportStatus("error")
      addLog(`Error: ${error.message}`)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processFileData = async (data: ArrayBuffer) => {
    try {
      setProgress(40)
      addLog("Procesando archivo Excel...")

      // Procesar Excel
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false })

      if (!jsonData || jsonData.length === 0) {
        throw new Error("No se encontraron datos en el archivo")
      }

      addLog(`Datos encontrados: ${jsonData.length} filas`)
      setProgress(50)

      // Filtrar filas vacías
      const validData = jsonData.filter((row: ExcelRow) => {
        return Object.values(row).some((val) => val !== null && val !== undefined && val !== "")
      })

      addLog(`Filas válidas: ${validData.length}`)

      // Obtener columnas disponibles y ordenarlas según el orden esperado
      const firstRow = validData[0] || {}
      const detectedColumns = Object.keys(firstRow)

      // Ordenar las columnas según el orden esperado
      const orderedColumns = expectedColumnOrder.filter((col) => detectedColumns.includes(col))
      const remainingColumns = detectedColumns.filter((col) => !expectedColumnOrder.includes(col))
      const finalColumnOrder = [...orderedColumns, ...remainingColumns]

      setAvailableColumns(finalColumnOrder)

      // Mapeo automático de columnas con nombres exactos
      const autoMapping: { [key: string]: string } = {
        clave_innsist: "Clave Innsist",
        clave_rapsodia: "Clave Rapsodia",
        descripcion: "Descripción del artículo",
        categoria: "Categoria",
        ingrediente: "Ingrediente",
        tipo: "Tipo",
        metrica: "Metrica",
        cantidad: "Cantidad",
        precio_total: "Precio total",
        metrica_conversion: "Metrica Convertida",
        conversion: "Conversion",
        cantidad_conversion: "GR/ML/PZA",
        precio_unitario: "Unitario",
      }

      setColumnMapping(autoMapping)

      // Detectar columnas de precio específicas
      const detectedPrecioColumns = ["Precio total", "Unitario"].filter((col) => detectedColumns.includes(col))
      setPrecioColumns(detectedPrecioColumns)

      addLog(`Columnas detectadas en orden: ${finalColumnOrder.join(", ")}`)
      addLog(`Mapeo automático: ${JSON.stringify(autoMapping, null, 2)}`)
      addLog(`Columnas de precio detectadas: ${detectedPrecioColumns.join(", ")}`)

      // Analizar datos de precio en las primeras filas
      const samplePrices = validData.slice(0, 5).map((row, index) => {
        const prices: any = {}
        detectedPrecioColumns.forEach((col) => {
          const value = row[col]
          if (value && !isNaN(Number(String(value).replace(/[,$]/g, "")))) {
            prices[col] = Number(String(value).replace(/[,$]/g, ""))
          }
        })
        return `Fila ${index + 1}: ${JSON.stringify(prices)}`
      })
      addLog(`Muestra de precios detectados: ${samplePrices.join(" | ")}`)

      // Diagnóstico detallado de los primeros 3 ingredientes
      addLog("=== DIAGNÓSTICO DETALLADO ===")
      validData.slice(0, 3).forEach((row, index) => {
        const descripcion = row["Descripción del artículo"] || "Sin descripción"
        const precioTotal = row["Precio total"]
        const precioUnitario = row["Unitario"]
        const metrica = row["Metrica"]
        const conversion = row["Conversion"]
        const metricaConversion = row["Metrica Convertida"]

        addLog(`Ingrediente ${index + 1}: ${descripcion}`)
        addLog(`  - Precio total (Excel): "${precioTotal}" (tipo: ${typeof precioTotal})`)
        addLog(`  - Precio unitario (Excel): "${precioUnitario}" (tipo: ${typeof precioUnitario})`)
        addLog(`  - Métrica: "${metrica}" → Conversión: "${conversion}" → Métrica convertida: "${metricaConversion}"`)

        // Procesar valores
        const totalProcessed = precioTotal ? String(precioTotal).replace(/[,$\s]/g, "") : "N/A"
        const unitarioProcessed = precioUnitario ? String(precioUnitario).replace(/[,$\s]/g, "") : "N/A"

        addLog(`  - Precio total procesado: "${totalProcessed}"`)
        addLog(`  - Precio unitario procesado: "${unitarioProcessed}"`)
        addLog(
          `  - Cálculo esperado: ${unitarioProcessed} × ${conversion} = ${Number(unitarioProcessed) * Number(conversion)}`,
        )
        addLog("---")
      })

      setAllData(validData)
      setPreviewData(validData.slice(0, 10))
      setShowPreview(true)
      setProgress(60)

      toast({
        title: "Archivo procesado",
        description: `Se encontraron ${validData.length} filas de datos con ${finalColumnOrder.length} columnas`,
      })
    } catch (error: any) {
      addLog(`Error procesando archivo: ${error.message}`)
      throw new Error(`Error procesando archivo: ${error.message}`)
    }
  }

  const importData = async () => {
    if (!allData.length) {
      toast({
        title: "Error",
        description: "No hay datos para importar",
        variant: "destructive",
      })
      return
    }

    if (!selectedRestaurante) {
      toast({
        title: "Error",
        description: "Debes seleccionar un restaurante",
        variant: "destructive",
      })
      return
    }

    setShowConfirmDialog(true)
  }

  const confirmImport = async () => {
    setShowConfirmDialog(false)

    try {
      setLoading(true)
      setImportStatus("processing")
      setProgress(70)
      setImportResults({ categorias: 0, ingredientes: 0, actualizados: 0, precios: 0, errores: [] })

      const restauranteNombre = restaurantes.find((r) => r.id === selectedRestaurante)?.nombre || "Desconocido"
      addLog(`Iniciando importación a la base de datos para: ${restauranteNombre} (ID: ${selectedRestaurante})`)

      // Extraer categorías únicas
      const categoriasUnicas = [
        ...new Set(
          allData
            .map((row) => row["Categoria"])
            .filter(Boolean)
            .filter((cat) => typeof cat === "string" && cat.trim() !== ""),
        ),
      ]

      addLog(`Categorías únicas encontradas: ${categoriasUnicas.length}`)
      const categoriaMap = new Map<string, string>()

      // Crear/obtener categorías
      for (const categoriaNombre of categoriasUnicas) {
        try {
          const { data: existingCategoria } = await supabase
            .from("categorias")
            .select("id")
            .eq("nombre", categoriaNombre)
            .eq("restaurante_id", selectedRestaurante)
            .single()

          if (existingCategoria) {
            categoriaMap.set(categoriaNombre, existingCategoria.id)
            addLog(`Categoría existente: ${categoriaNombre}`)
          } else {
            const { data: newCategoria, error } = await supabase
              .from("categorias")
              .insert([
                {
                  nombre: categoriaNombre,
                  restaurante_id: selectedRestaurante,
                },
              ])
              .select("id")
              .single()

            if (error) throw error
            if (newCategoria) {
              categoriaMap.set(categoriaNombre, newCategoria.id)
              setImportResults((prev) => ({ ...prev, categorias: prev.categorias + 1 }))
              addLog(`Nueva categoría creada: ${categoriaNombre}`)
            }
          }
        } catch (error: any) {
          addLog(`Error con categoría ${categoriaNombre}: ${error.message}`)
        }
      }

      setProgress(80)
      addLog("Procesando ingredientes...")

      // Procesar ingredientes en lotes para evitar timeout
      const batchSize = 50
      const totalBatches = Math.ceil(allData.length / batchSize)

      // Contadores para resultados
      let successfulIngredientes = 0
      let successfulActualizados = 0
      let successfulPrecios = 0
      const errores: string[] = []

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIdx = batchIndex * batchSize
        const endIdx = Math.min((batchIndex + 1) * batchSize, allData.length)
        const batch = allData.slice(startIdx, endIdx)

        addLog(`Procesando lote ${batchIndex + 1}/${totalBatches} (filas ${startIdx + 1}-${endIdx})`)

        // Actualizar progreso
        const progressValue = 80 + ((batchIndex + 1) / totalBatches) * 20
        setProgress(progressValue)

        // Procesar cada ingrediente en el lote
        for (const row of batch) {
          try {
            // Obtener valores usando los nombres exactos de las columnas
            const descripcion = row["Descripción del artículo"]
            if (!descripcion) {
              errores.push(`Fila sin descripción: ${row["Clave Innsist"] || "Sin clave"}`)
              continue
            }

            // Preparar datos del ingrediente usando los nombres exactos
            const ingredienteData = {
              restaurante_id: selectedRestaurante,
              clave_innsist: row["Clave Innsist"] ? String(row["Clave Innsist"]).trim() : null,
              clave_rapsodia: row["Clave Rapsodia"] ? String(row["Clave Rapsodia"]).trim() : null,
              descripcion: String(descripcion).trim(),
              categoria_id: row["Categoria"] ? categoriaMap.get(String(row["Categoria"]).trim()) : null,
              ingrediente: row["Ingrediente"] ? String(row["Ingrediente"]).trim() : null,
              tipo: row["Tipo"] ? String(row["Tipo"]).trim() : null,
              metrica: row["Metrica"] ? String(row["Metrica"]).trim() : null,
              cantidad: row["Cantidad"] ? Number.parseFloat(String(row["Cantidad"]).replace(/[,$]/g, "")) : null,
              metrica_conversion: row["Metrica Convertida"] ? String(row["Metrica Convertida"]).trim() : null,
              conversion: row["Conversion"] ? Number.parseFloat(String(row["Conversion"]).replace(/[,$]/g, "")) : null,
              cantidad_conversion: row["GR/ML/PZA"]
                ? Number.parseFloat(String(row["GR/ML/PZA"]).replace(/[,$]/g, ""))
                : null,
              status: "activo" as const,
            }

            // Buscar ingrediente existente por claves o descripción
            let existingIngrediente = null

            // Primero buscar por Clave Innsist si existe
            if (ingredienteData.clave_innsist) {
              const { data } = await supabase
                .from("ingredientes_restaurante")
                .select("id")
                .eq("restaurante_id", selectedRestaurante)
                .eq("clave_innsist", ingredienteData.clave_innsist)
                .single()
              existingIngrediente = data
            }

            // Si no se encuentra por Clave Innsist, buscar por Clave Rapsodia
            if (!existingIngrediente && ingredienteData.clave_rapsodia) {
              const { data } = await supabase
                .from("ingredientes_restaurante")
                .select("id")
                .eq("restaurante_id", selectedRestaurante)
                .eq("clave_rapsodia", ingredienteData.clave_rapsodia)
                .single()
              existingIngrediente = data
            }

            // Si no se encuentra por claves, buscar por descripción
            if (!existingIngrediente) {
              const { data } = await supabase
                .from("ingredientes_restaurante")
                .select("id")
                .eq("restaurante_id", selectedRestaurante)
                .eq("descripcion", ingredienteData.descripcion)
                .single()
              existingIngrediente = data
            }

            let ingredienteId: string

            if (existingIngrediente) {
              // Actualizar ingrediente existente
              const { error } = await supabase
                .from("ingredientes_restaurante")
                .update(ingredienteData)
                .eq("id", existingIngrediente.id)

              if (error) throw error
              ingredienteId = existingIngrediente.id
              successfulActualizados++
            } else {
              // Crear nuevo ingrediente
              const { data: newIngrediente, error } = await supabase
                .from("ingredientes_restaurante")
                .insert([ingredienteData])
                .select("id")
                .single()

              if (error) throw error
              if (newIngrediente) {
                ingredienteId = newIngrediente.id
                successfulIngredientes++
              } else {
                throw new Error("No se pudo crear el ingrediente")
              }
            }

            // Buscar precios en las columnas específicas - CORREGIDO
            let precioTotal: number | null = null
            let precioUnitario: number | null = null

            // Precio total - leer directamente de la columna "Precio total"
            if (row["Precio total"]) {
              const value = String(row["Precio total"]).replace(/[,$\\s]/g, "")
              if (!isNaN(Number(value)) && Number(value) > 0) {
                precioTotal = Number.parseFloat(value)
                addLog(`✓ Precio total leído: ${precioTotal} para ${ingredienteData.descripcion}`)
              }
            }

            // Precio unitario - leer directamente de la columna "Unitario"
            if (row["Unitario"]) {
              const value = String(row["Unitario"]).replace(/[,$\\s]/g, "")
              if (!isNaN(Number(value)) && Number(value) > 0) {
                precioUnitario = Number.parseFloat(value)
                addLog(`✓ Precio unitario leído: ${precioUnitario} para ${ingredienteData.descripcion}`)
              }
            }

            // Validación de consistencia
            if (precioTotal && precioUnitario && ingredienteData.conversion) {
              const calculatedTotal = precioUnitario * ingredienteData.conversion
              const difference = Math.abs(precioTotal - calculatedTotal)
              const tolerance = precioTotal * 0.01 // 1% de tolerancia

              if (difference > tolerance) {
                addLog(`⚠ Inconsistencia detectada en ${ingredienteData.descripcion}:`)
                addLog(`   Precio total leído: ${precioTotal}`)
                addLog(`   Precio calculado: ${calculatedTotal} (${precioUnitario} × ${ingredienteData.conversion})`)
                addLog(`   Diferencia: ${difference}`)
              }
            }

            // Si encontramos algún precio, crear el registro
            if ((precioTotal && precioTotal > 0) || (precioUnitario && precioUnitario > 0)) {
              try {
                // Cerrar precio anterior si existe
                await supabase
                  .from("precios_unitarios")
                  .update({ fecha_fin: new Date().toISOString().split("T")[0] })
                  .eq("ingrediente_id", ingredienteId)
                  .is("fecha_fin", null)

                // Crear nuevo precio con los valores exactos del Excel
                const precioData = {
                  ingrediente_id: ingredienteId,
                  precio_total: precioTotal || 0,
                  precio_unitario: precioUnitario || 0,
                  unidad: ingredienteData.metrica_conversion || ingredienteData.metrica || "unidad",
                  fecha_inicio: new Date().toISOString().split("T")[0],
                  fecha_fin: null,
                }

                const { error: precioError } = await supabase.from("precios_unitarios").insert([precioData])

                if (precioError) {
                  addLog(`Error creando precio para ${ingredienteData.descripcion}: ${precioError.message}`)
                  errores.push(`Error creando precio para ${ingredienteData.descripcion}: ${precioError.message}`)
                } else {
                  successfulPrecios++
                  addLog(`✓ Precio guardado para: ${ingredienteData.descripcion}`)
                  addLog(`   - Precio total: $${precioTotal || 0}`)
                  addLog(`   - Precio unitario: $${precioUnitario || 0}`)
                  addLog(`   - Unidad: ${precioData.unidad}`)
                }
              } catch (precioError: any) {
                addLog(`Error en precio para ${ingredienteData.descripcion}: ${precioError.message}`)
                errores.push(`Error en precio para ${ingredienteData.descripcion}: ${precioError.message}`)
              }
            } else {
              addLog(`⚠ Sin precio válido para: ${ingredienteData.descripcion}`)
            }
          } catch (error: any) {
            const errorMsg = `Error procesando ingrediente ${row["Descripción del artículo"] || row["Clave Innsist"]}: ${error.message}`
            errores.push(errorMsg)
            addLog(errorMsg)
          }
        }
      }

      setImportResults({
        categorias: categoriaMap.size,
        ingredientes: successfulIngredientes,
        actualizados: successfulActualizados,
        precios: successfulPrecios,
        errores,
      })

      setProgress(100)
      setImportStatus("success")
      addLog(
        `Importación completada: ${successfulIngredientes} nuevos, ${successfulActualizados} actualizados, ${successfulPrecios} precios`,
      )

      toast({
        title: "Importación completada",
        description: `Se procesaron ${successfulIngredientes + successfulActualizados} ingredientes y ${successfulPrecios} precios`,
      })
    } catch (error: any) {
      console.error("Error en la importación:", error)
      setImportStatus("error")
      addLog(`Error fatal: ${error.message}`)
      toast({
        title: "Error en la importación",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Importación con Orden Correcto de Columnas</h1>

      <Tabs defaultValue="importar">
        <TabsList className="mb-4">
          <TabsTrigger value="importar">Importar Datos</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="mapeo">Mapeo de Columnas</TabsTrigger>
        </TabsList>

        <TabsContent value="importar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selección de restaurante */}
              <Card>
                <CardHeader>
                  <CardTitle>Seleccionar Restaurante</CardTitle>
                  <CardDescription>Elige el restaurante para el cual importar los ingredientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedRestaurante} onValueChange={setSelectedRestaurante}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un restaurante" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurantes.map((restaurante) => (
                        <SelectItem key={restaurante.id} value={restaurante.id}>
                          {restaurante.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Subir archivo */}
              <Card>
                <CardHeader>
                  <CardTitle>Subir Archivo Excel</CardTitle>
                  <CardDescription>
                    Sube un archivo Excel con la estructura correcta para importar ingredientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={loading || !selectedRestaurante}
                    />
                    {file && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>{file.name}</span>
                        <span>({(file.size / 1024).toFixed(2)} KB)</span>
                      </div>
                    )}
                  </div>

                  {loading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Procesando...</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vista previa de datos - ORDEN CORRECTO */}
              {showPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Vista Previa en Orden Correcto
                    </CardTitle>
                    <CardDescription>
                      Primeras 10 filas del archivo mostrando las {availableColumns.length} columnas en el orden
                      correcto. Total: {allData.length} filas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-3 bg-blue-50 rounded">
                      <h4 className="font-medium text-blue-900 mb-2">Columnas de Precio Detectadas:</h4>
                      <div className="flex flex-wrap gap-1">
                        {precioColumns.map((col) => (
                          <Badge key={col} variant="default" className="bg-green-600">
                            {col}
                          </Badge>
                        ))}
                        {precioColumns.length === 0 && (
                          <Badge variant="destructive">No se detectaron columnas de precio</Badge>
                        )}
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">📋 Orden de Columnas Esperado:</h4>
                      <div className="text-green-800 text-sm grid grid-cols-2 gap-1">
                        {expectedColumnOrder.map((col, index) => (
                          <div key={col} className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-green-200 px-1 rounded">{index + 1}</span>
                            <span>{col}</span>
                            {availableColumns.includes(col) && <span className="text-green-600">✓</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <ScrollArea className="h-[500px] w-full">
                      <div className="overflow-x-auto">
                        <div className="min-w-max">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {availableColumns.map((column, index) => (
                                  <TableHead key={column} className="min-w-[120px] whitespace-nowrap sticky-header">
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1">
                                        <span className="font-mono text-xs bg-gray-200 px-1 rounded">{index + 1}</span>
                                        <span className="font-medium">{column}</span>
                                      </div>
                                      {precioColumns.includes(column) && (
                                        <Badge variant="default" className="text-xs mt-1 bg-green-600 w-fit">
                                          Precio
                                        </Badge>
                                      )}
                                    </div>
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {previewData.map((row, index) => (
                                <TableRow key={index}>
                                  {availableColumns.map((column) => (
                                    <TableCell key={column} className="min-w-[120px] whitespace-nowrap">
                                      <div className="flex flex-col">
                                        <span className="text-sm">{String(row[column] || "")}</span>
                                        {precioColumns.includes(column) && row[column] && (
                                          <Badge variant="outline" className="text-xs mt-1 w-fit">
                                            ${row[column]}
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </ScrollArea>

                    <div className="mt-4">
                      <Button
                        onClick={importData}
                        disabled={loading || !selectedRestaurante}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <Database className="mr-2 h-4 w-4" />
                            Importar {allData.length} Ingredientes
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resultados de importación */}
              {importStatus === "success" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      Importación Exitosa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{importResults.categorias}</div>
                        <div className="text-sm text-muted-foreground">Categorías</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{importResults.ingredientes}</div>
                        <div className="text-sm text-muted-foreground">Nuevos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{importResults.actualizados}</div>
                        <div className="text-sm text-muted-foreground">Actualizados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{importResults.precios}</div>
                        <div className="text-sm text-muted-foreground">Precios</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{importResults.errores.length}</div>
                        <div className="text-sm text-muted-foreground">Errores</div>
                      </div>
                    </div>

                    {importResults.errores.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Errores encontrados</AlertTitle>
                        <AlertDescription>
                          <ScrollArea className="h-[200px] mt-2">
                            <ul className="list-disc list-inside space-y-1">
                              {importResults.errores.map((error, index) => (
                                <li key={index} className="text-sm">
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </ScrollArea>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {importStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error en la importación</AlertTitle>
                  <AlertDescription>
                    Ocurrió un error al procesar los datos. Por favor verifica el formato del archivo.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Panel lateral con instrucciones */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Orden Correcto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="bg-green-50 p-3 rounded">
                    <h3 className="font-medium text-green-900 mb-2">Columnas Esperadas:</h3>
                    <ul className="text-green-700 space-y-1 text-xs">
                      {expectedColumnOrder.map((col, index) => (
                        <li key={col} className="flex items-center gap-2">
                          <span className="font-mono bg-green-200 px-1 rounded">{index + 1}</span>
                          <span>{col}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Columnas de Precio</h3>
                    <div className="bg-blue-50 p-3 rounded text-xs">
                      <ul className="list-disc list-inside text-blue-700 space-y-1">
                        <li>
                          <strong>Precio total:</strong> Precio por presentación completa
                        </li>
                        <li>
                          <strong>Unitario:</strong> Precio por unidad de conversión
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Ejemplo de Conversión</h3>
                    <div className="bg-amber-50 p-3 rounded text-xs">
                      <p className="text-amber-800 mb-2">Si tienes:</p>
                      <ul className="list-disc list-inside text-amber-700 space-y-1">
                        <li>Métrica: Litro</li>
                        <li>Precio total: $50</li>
                        <li>Métrica Convertida: Mililitro</li>
                        <li>Conversión: 1000</li>
                        <li>Unitario: $0.05</li>
                      </ul>
                      <p className="text-amber-800 mt-2">Significa: 1 litro = $50, 1 ml = $0.05</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mapeo">
          <Card>
            <CardHeader>
              <CardTitle>Mapeo de Columnas Excel</CardTitle>
              <CardDescription>Correspondencia entre columnas del Excel y campos de la base de datos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-3">Mapeo de Campos</h3>
                  {Object.entries(columnMapping).map(([campo, columna]) => (
                    <div key={campo} className="flex justify-between items-center p-3 bg-muted rounded mb-2">
                      <span className="font-medium">{campo}:</span>
                      <Badge variant="outline">{columna}</Badge>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-medium mb-3">Columnas de Precio</h3>
                  {precioColumns.map((col) => (
                    <div key={col} className="flex justify-between items-center p-3 bg-green-50 rounded mb-2">
                      <span className="font-medium">{col}</span>
                      <Badge variant="default" className="bg-green-600">
                        Precio
                      </Badge>
                    </div>
                  ))}
                  {precioColumns.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No se detectaron columnas de precio</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Importación</CardTitle>
              <CardDescription>Registro detallado del proceso de importación</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="bg-muted p-4 rounded font-mono text-xs">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground">No hay logs disponibles</p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="pb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Importación</DialogTitle>
            <div className="text-sm text-muted-foreground">
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-sm text-yellow-800">
                  <strong>¿Estás seguro de que deseas importar {allData.length} ingredientes?</strong>
                </div>
                <div className="text-xs text-yellow-700 mt-1">
                  Se detectaron {precioColumns.length} columnas de precio. Los ingredientes existentes serán
                  actualizados automáticamente.
                </div>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmImport} className="bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                "Confirmar Importación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
