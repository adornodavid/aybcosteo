"use client"

/* ==================================================
  Imports
================================================== */
import type React from "react"

import { CardDescription } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle, Database, Eye, Loader2, Upload, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import * as XLSX from "xlsx"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast as useCustomToast } from "@/hooks/use-toast"

/* ==================================================
  Interfaces, tipados, clases
================================================== */
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
  const { toast } = useCustomToast()

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    } else {
      setFile(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un archivo Excel para importar.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setImportResults({ categorias: 0, ingredientes: 0, actualizados: 0, precios: 0, errores: [] })

    const formData = new FormData()
    formData.append("file", file)
    formData.append("restaurante_id", selectedRestaurante)

    try {
      const response = await fetch("/api/import-excel", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setImportResults(result.data)
        toast({
          title: "Importación exitosa",
          description: "El archivo Excel ha sido importado correctamente.",
        })
      } else {
        toast({
          title: "Error en la importación",
          description: result.error || "Ocurrió un error al importar el archivo Excel.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error importing Excel file:", error)
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor para importar el archivo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold">Importación de Datos (Excel)</h1>
      <p className="text-lg text-muted-foreground">Carga tus datos masivamente desde un archivo Excel.</p>

      <Card>
        <CardHeader>
          <CardTitle>Paso 1: Descargar Plantilla</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Descarga la plantilla de Excel para asegurarte de que tus datos tengan el formato correcto.
          </p>
          <Button variant="outline" className="w-fit bg-transparent">
            <FileText className="mr-2 h-4 w-4" />
            Descargar Plantilla de Ingredientes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paso 2: Cargar Archivo Excel</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="excel-file">Selecciona tu archivo Excel (.xlsx)</Label>
            <Input id="excel-file" type="file" accept=".xlsx" onChange={handleFileChange} required />
          </div>
          <Button className="w-fit" onClick={processFileUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Cargar y Procesar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados de la Última Importación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {importStatus === "success" && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm font-medium">¡Importación completada con éxito!</p>
            </div>
          )}
          {importStatus === "success" && (
            <p className="text-sm text-muted-foreground">
              Se procesaron {importResults.categorias + importResults.ingredientes + importResults.actualizados}{" "}
              registros. Puedes ver el detalle en la sección de Análisis de Importación.
            </p>
          )}
          {importStatus === "success" && (
            <Button variant="outline" className="w-fit bg-transparent">
              Ver Análisis Detallado
            </Button>
          )}
          {importStatus !== "success" && (
            <p className="text-sm text-muted-foreground">No hay resultados disponibles para mostrar.</p>
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
              Primeras 10 filas del archivo mostrando las {availableColumns.length} columnas en el orden correcto.
              Total: {allData.length} filas
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
                {precioColumns.length === 0 && <Badge variant="destructive">No se detectaron columnas de precio</Badge>}
              </div>
            </div>

            <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">📋 Orden de Columnas Esperado:</h4>
              <div className="text-green-800 text-sm grid grid-cols-2 gap-1">
                {expectedColumnOrder.map((col, index) => (
                  <div key={col} className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-gray-200 px-1 rounded">{index + 1}</span>
                    <span className="font-medium">{col}</span>
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
                onClick={handleSubmit}
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
  )
}
