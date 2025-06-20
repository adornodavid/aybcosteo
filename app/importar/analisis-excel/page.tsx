"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet, CheckCircle, AlertCircle, Database, Eye, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import * as XLSX from "xlsx"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface AnalisisResultado {
  totalFilas: number
  columnas: string[]
  categorias: Set<string>
  tipos: Set<string>
  metricas: Set<string>
  metricasConversion: Set<string>
  muestras: any[]
  errores: string[]
}

export default function AnalisisExcelPage() {
  const [loading, setLoading] = useState(false)
  const [analizando, setAnalizando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultado, setResultado] = useState<AnalisisResultado | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [importResults, setImportResults] = useState<{
    categorias: number
    ingredientes: number
    precios: number
    errores: string[]
  }>({
    categorias: 0,
    ingredientes: 0,
    precios: 0,
    errores: [],
  })
  const { toast } = useToast()

  // ID del restaurante Montana iStay
  const MONTANA_ISTAY_ID = "eb492bec-f87a-4bda-917f-4e8109ec914c"

  // URL del archivo Excel
  const EXCEL_URL =
    "https://tjbnbfcowjkfnqifspcu.supabase.co/storage/v1/object/sign/filescosteo/Costo%20Montana%20istay.xlsx?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hNWQxZGI4OS04MGU2LTQ0MDAtYWYwMS1mZTNjMGUwZWM2ZmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmaWxlc2Nvc3Rlby9Db3N0byBNb250YW5hIGlzdGF5Lnhsc3giLCJpYXQiOjE3NDg5NzIwNTUsImV4cCI6MTc4MDUwODA1NX0.2z71BG-LqWKrKUjZTYAqDKDzkhAEGg80FNmBnsJAmqA"

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const analizarExcel = async () => {
    try {
      setAnalizando(true)
      setLoading(true)
      setProgress(10)
      addLog("Descargando archivo Excel...")

      const response = await fetch(EXCEL_URL)
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      setProgress(30)
      addLog("Archivo descargado, analizando estructura...")

      // Procesar Excel
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false })

      if (!jsonData || jsonData.length === 0) {
        throw new Error("No se encontraron datos en el archivo")
      }

      addLog(`Datos encontrados: ${jsonData.length} filas`)
      setProgress(50)

      // Filtrar filas vacías
      const validData = jsonData.filter((row: any) => {
        return Object.values(row).some((val) => val !== null && val !== undefined && val !== "")
      })

      // Analizar estructura
      const columnas = Object.keys(validData[0] || {})
      const categorias = new Set<string>()
      const tipos = new Set<string>()
      const metricas = new Set<string>()
      const metricasConversion = new Set<string>()
      const errores: string[] = []

      validData.forEach((row: any) => {
        if (row["Categoria"]) categorias.add(row["Categoria"])
        if (row["Tipo"]) tipos.add(row["Tipo"])
        if (row["Metrica"]) metricas.add(row["Metrica"])
        if (row["Metrica conversion"]) metricasConversion.add(row["Metrica conversion"])
      })

      setResultado({
        totalFilas: validData.length,
        columnas,
        categorias,
        tipos,
        metricas,
        metricasConversion,
        muestras: validData.slice(0, 10),
        errores,
      })

      setProgress(100)
      addLog("Análisis completado con éxito")

      toast({
        title: "Análisis completado",
        description: `Se analizaron ${validData.length} filas de datos`,
      })
    } catch (error: any) {
      addLog(`Error: ${error.message}`)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setAnalizando(false)
    }
  }

  const importarDatos = async () => {
    if (!resultado) {
      toast({
        title: "Error",
        description: "Primero debes analizar el archivo",
        variant: "destructive",
      })
      return
    }

    try {
      setImportando(true)
      setLoading(true)
      setImportStatus("processing")
      setProgress(0)
      addLog("Iniciando importación de datos...")

      // Descargar nuevamente el archivo para procesarlo
      const response = await fetch(EXCEL_URL)
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      setProgress(10)
      addLog("Archivo descargado, procesando datos...")

      // Procesar Excel
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false })

      // Filtrar filas vacías
      const validData = jsonData.filter((row: any) => {
        return Object.values(row).some((val) => val !== null && val !== undefined && val !== "")
      })

      setProgress(20)
      addLog(`Procesando ${validData.length} filas...`)

      // Extraer categorías únicas
      const categoriasUnicas = [
        ...new Set(
          validData
            .map((row: any) => row["Categoria"])
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
            .eq("restaurante_id", MONTANA_ISTAY_ID)
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
                  restaurante_id: MONTANA_ISTAY_ID,
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

      setProgress(40)
      addLog("Procesando ingredientes...")

      // Procesar ingredientes
      let successfulIngredientes = 0
      let successfulPrecios = 0
      const errores: string[] = []

      // Procesar en lotes para evitar sobrecarga
      const batchSize = 20
      const totalBatches = Math.ceil(validData.length / batchSize)

      for (let i = 0; i < totalBatches; i++) {
        const batch = validData.slice(i * batchSize, (i + 1) * batchSize)

        for (const row of batch) {
          try {
            // Validar datos requeridos
            if (!row["descripcion"]) {
              errores.push(`Fila sin descripción: ${row["id"] || "Sin ID"}`)
              continue
            }

            // Preparar datos del ingrediente para tabla ingredientes
            const ingredienteData = {
              restaurante_id: MONTANA_ISTAY_ID,
              id_excel: row["id"] ? String(row["id"]).trim() : null,
              descripcion: String(row["descripcion"]).trim(),
              categoria: row["Categoria"] ? String(row["Categoria"]).trim() : null,
              ingrediente: row["Ingrediente"] ? String(row["Ingrediente"]).trim() : null,
              tipo: row["Tipo"] ? String(row["Tipo"]).trim() : null,
              metrica: row["Metrica"] ? String(row["Metrica"]).trim() : null,
              cantidad: row["Cantidad"] ? Number.parseFloat(String(row["Cantidad"]).replace(/,/g, "")) : null,
              conversion: row["Conversion"] ? Number.parseFloat(String(row["Conversion"]).replace(/,/g, "")) : null,
              metrica_conversion: row["Metrica conversion"] ? String(row["Metrica conversion"]).trim() : null,
              cantidad_conversion: row["Cantidad Conversion"]
                ? Number.parseFloat(String(row["Cantidad Conversion"]).replace(/,/g, ""))
                : null,
              precio_unitario: row["Precio Unitario"]
                ? Number.parseFloat(String(row["Precio Unitario"]).replace(/,/g, ""))
                : null,
            }

            // Verificar si el ingrediente existe para este restaurante (por descripción)
            const { data: existingIngrediente } = await supabase
              .from("ingredientes")
              .select("id")
              .eq("restaurante_id", MONTANA_ISTAY_ID)
              .eq("descripcion", ingredienteData.descripcion)
              .single()

            let ingredienteId: string

            if (existingIngrediente) {
              // Actualizar ingrediente existente
              const { error } = await supabase
                .from("ingredientes")
                .update({
                  ...ingredienteData,
                })
                .eq("id", existingIngrediente.id)

              if (error) throw error
              ingredienteId = existingIngrediente.id
              addLog(`Ingrediente actualizado: ${ingredienteData.descripcion}`)
            } else {
              // Crear nuevo ingrediente
              const { data: newIngrediente, error } = await supabase
                .from("ingredientes")
                .insert([ingredienteData])
                .select("id")
                .single()

              if (error) throw error
              if (newIngrediente) {
                ingredienteId = newIngrediente.id
                successfulIngredientes++
                addLog(`Nuevo ingrediente creado: ${ingredienteData.descripcion}`)
              } else {
                throw new Error("No se pudo crear el ingrediente")
              }
            }

            // Crear precio en tabla historial_precios_ingredientes
            const precioTotal = row["Precio total"]
              ? Number.parseFloat(String(row["Precio total"]).replace(/,/g, ""))
              : null

            if (precioTotal && precioTotal > 0) {
              // Cerrar precio anterior si existe
              const { error: closeError } = await supabase
                .from("historial_precios_ingredientes")
                .update({ fecha_fin: new Date().toISOString().split("T")[0] })
                .eq("ingrediente_id", ingredienteId)
                .is("fecha_fin", null)

              if (closeError) {
                addLog(`Advertencia cerrando precio anterior: ${closeError.message}`)
              }

              // Crear nuevo precio
              const precioData = {
                ingrediente_id: ingredienteId,
                precio: precioTotal,
                fecha_inicio: new Date().toISOString().split("T")[0],
                fecha_fin: null,
                notas: `Importado desde Excel - ${new Date().toLocaleString()}`,
              }

              const { error: precioError } = await supabase.from("historial_precios_ingredientes").insert([precioData])

              if (precioError) throw precioError
              successfulPrecios++
              addLog(`Precio creado para: ${ingredienteData.descripcion}`)
            }
          } catch (error: any) {
            const errorMsg = `Error procesando ingrediente ${row["descripcion"] || row["id"]}: ${error.message}`
            errores.push(errorMsg)
            addLog(errorMsg)
          }
        }

        // Actualizar progreso
        const currentProgress = Math.floor(40 + ((i + 1) / totalBatches) * 60)
        setProgress(currentProgress)
        addLog(`Procesado lote ${i + 1} de ${totalBatches} (${currentProgress}%)`)
      }

      setImportResults({
        categorias: categoriaMap.size,
        ingredientes: successfulIngredientes,
        precios: successfulPrecios,
        errores,
      })

      setProgress(100)
      setImportStatus("success")
      addLog(`Importación completada: ${successfulIngredientes} ingredientes, ${successfulPrecios} precios`)

      toast({
        title: "Importación completada",
        description: `Se importaron ${successfulIngredientes} ingredientes y ${successfulPrecios} precios`,
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
      setImportando(false)
    }
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Análisis e Importación de Excel - Montana iStay</h1>

      <Tabs defaultValue="analisis">
        <TabsList className="mb-4">
          <TabsTrigger value="analisis">Análisis de Datos</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="analisis">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel principal */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Archivo Excel - Montana iStay</CardTitle>
                  <CardDescription>
                    Análisis e importación del archivo de ingredientes para Montana iStay
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={analizarExcel} disabled={loading} variant="outline">
                      {analizando ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Analizar Estructura
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={importarDatos}
                      disabled={loading || !resultado}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {importando ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          Importar Datos
                        </>
                      )}
                    </Button>
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

              {/* Resultados del análisis */}
              {resultado && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Estructura del Archivo
                    </CardTitle>
                    <CardDescription>
                      Se encontraron {resultado.totalFilas} filas de datos con {resultado.columnas.length} columnas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Columnas Detectadas:</h3>
                        <div className="flex flex-wrap gap-1">
                          {resultado.columnas.map((col) => (
                            <Badge key={col} variant="outline">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Categorías ({Array.from(resultado.categorias).length}):
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(resultado.categorias)
                            .slice(0, 10)
                            .map((cat) => (
                              <Badge key={cat} variant="secondary">
                                {cat}
                              </Badge>
                            ))}
                          {Array.from(resultado.categorias).length > 10 && (
                            <Badge variant="secondary">+{Array.from(resultado.categorias).length - 10} más</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Tipos ({Array.from(resultado.tipos).length}):</h3>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(resultado.tipos)
                            .slice(0, 10)
                            .map((tipo) => (
                              <Badge key={tipo} variant="outline">
                                {tipo}
                              </Badge>
                            ))}
                          {Array.from(resultado.tipos).length > 10 && (
                            <Badge variant="outline">+{Array.from(resultado.tipos).length - 10} más</Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Métricas ({Array.from(resultado.metricas).length}):
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(resultado.metricas)
                            .slice(0, 10)
                            .map((metrica) => (
                              <Badge key={metrica} variant="outline">
                                {metrica}
                              </Badge>
                            ))}
                          {Array.from(resultado.metricas).length > 10 && (
                            <Badge variant="outline">+{Array.from(resultado.metricas).length - 10} más</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Muestra de Datos:</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {resultado.columnas.slice(0, 6).map((column) => (
                                <TableHead key={column} className="min-w-[120px]">
                                  {column}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {resultado.muestras.slice(0, 5).map((row, index) => (
                              <TableRow key={index}>
                                {resultado.columnas.slice(0, 6).map((column) => (
                                  <TableCell key={column} className="max-w-[200px] truncate">
                                    {String(row[column] || "")}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{importResults.categorias}</div>
                        <div className="text-sm text-muted-foreground">Categorías</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{importResults.ingredientes}</div>
                        <div className="text-sm text-muted-foreground">Ingredientes</div>
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
                          <ul className="list-disc list-inside space-y-1 mt-2">
                            {importResults.errores.slice(0, 5).map((error, index) => (
                              <li key={index} className="text-sm">
                                {error}
                              </li>
                            ))}
                            {importResults.errores.length > 5 && (
                              <li className="text-sm">... y {importResults.errores.length - 5} errores más</li>
                            )}
                          </ul>
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

            {/* Panel lateral */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Restaurante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-800 mb-2">Montana iStay</h3>
                    <p className="text-sm text-blue-700">ID: {MONTANA_ISTAY_ID}</p>
                    <p className="text-sm text-blue-700 mt-2">
                      Los datos serán importados exclusivamente para este restaurante.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Proceso de Importación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                        1
                      </div>
                      <span>Analizar estructura del archivo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                        2
                      </div>
                      <span>Revisar categorías y métricas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">
                        3
                      </div>
                      <span>Importar datos a la base de datos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">
                        4
                      </div>
                      <span>Verificar resultados</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <h4 className="font-medium text-blue-900 mb-1">Tablas Utilizadas:</h4>
                    <ul className="text-xs text-blue-700">
                      <li>
                        • <strong>ingredientes:</strong> Datos del producto
                      </li>
                      <li>
                        • <strong>historial_precios_ingredientes:</strong> Historial de precios
                      </li>
                      <li>
                        • <strong>categorias:</strong> Clasificaciones
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Importación</CardTitle>
              <CardDescription>Registro detallado del proceso de importación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded h-[400px] overflow-y-auto font-mono text-xs">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
