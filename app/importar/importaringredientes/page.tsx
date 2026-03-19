"use client"

import { useState, useRef } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, Download, Upload, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import * as XLSX from "xlsx"
import { importarIngredientesAction, verificarYObtenerConteo, limpiarCargaIngredientes, buscarIngredientesExistentes, buscarRecetasAfectadas, obtenerSumaCostoParcial } from "@/app/actions/importar"

export default function ImportarIngredientesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [columnas, setColumnas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [jsonData, setJsonData] = useState<any[]>([])
  const [loadingImport, setLoadingImport] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [activeTab, setActiveTab] = useState<"preview" | "conversion" | "visualizar">("preview")
  const [conversionEnabled, setConversionEnabled] = useState(false)
  const [conversionData, setConversionData] = useState<any[]>([])
  const [conversionColumnas, setConversionColumnas] = useState<string[]>([])
  const [sortConfigConversion, setSortConfigConversion] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [duplicadosSet, setDuplicadosSet] = useState<Set<string>>(new Set())
  const [cambiosCount, setCambiosCount] = useState(0)
  const [cambiosCriticosCount, setCambiosCriticosCount] = useState(0)
  const [cambiosManualCount, setCambiosManualCount] = useState(0)
  const [visualizarEnabled, setVisualizarEnabled] = useState(false)
  const [visualizarData, setVisualizarData] = useState<any[]>([])
  const [visualizarColumnas, setVisualizarColumnas] = useState<string[]>([])
  const [sortConfigVisualizar, setSortConfigVisualizar] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [loadingVisualizar, setLoadingVisualizar] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const EXAMPLE_FILE_URL =
    "https://tjbnbfcowjkfnqifspcu.supabase.co/storage/v1/object/sign/filescosteo/Plantilla_Importacion_Ingredientes_Muestra.xlsx?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hNWQxZGI4OS04MGU2LTQ0MDAtYWYwMS1mZTNjMGUwZWM2ZmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmaWxlc2Nvc3Rlby9QbGFudGlsbGFfSW1wb3J0YWNpb25fSW5ncmVkaWVudGVzX011ZXN0cmEueGxzeCIsImlhdCI6MTc0ODk3NDQ3OCwiZXhwIjoxNzgwNTEwNDc4fQ.Ie0a4cEXwQsDYmHnR2e8qXmZ7kJyqKrUChk9x12w5mI"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        setFile(selectedFile)
      } else {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo Excel (.xlsx o .xls)",
          variant: "destructive",
        })
      }
    }
  }

  const handleLoadFile = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonDataTemp = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

      if (jsonDataTemp.length === 0) {
        throw new Error("El archivo no contiene datos")
      }

      // Validación: Deduplicar registros por codigorapsodia y articulo
      const seenCombinations = new Set<string>()
      const dataDeduplicated = jsonDataTemp.filter((row: any) => {
        const codigorapsodia = row.codigorapsodia || row.Codigorapsodia || row.CodigoRapsodia || ""
        const articulo = row.articulo || row.Articulo || row.ARTICULO || ""
        const key = `${codigorapsodia}|${articulo}`

        if (seenCombinations.has(key)) {
          return false // Filtrar registros duplicados
        }

        seenCombinations.add(key)
        return true // Mantener el primer registro
      })

      const columns = Object.keys(jsonDataTemp[0])
      setColumnas(columns)
      setPreviewData(dataDeduplicated)
      setJsonData(dataDeduplicated)
      setScrollPosition(0)

      toast({
        title: "Éxito",
        description: `Se cargaron ${dataDeduplicated.length} filas del archivo (${jsonDataTemp.length - dataDeduplicated.length} duplicados removidos)`,
      })
    } catch (error: any) {
      toast({
        title: "Error al procesar el archivo",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    window.open(EXAMPLE_FILE_URL, "_blank")
  }

  const handleSortConversion = (column: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfigConversion && sortConfigConversion.key === column && sortConfigConversion.direction === "asc") {
      direction = "desc"
    }
    setSortConfigConversion({ key: column, direction })

    const sorted = [...conversionData].sort((a, b) => {
      const valA = a[column] ?? ""
      const valB = b[column] ?? ""
      const numA = Number(valA)
      const numB = Number(valB)
      if (!isNaN(numA) && !isNaN(numB) && String(valA).trim() !== "" && String(valB).trim() !== "") {
        return direction === "asc" ? numA - numB : numB - numA
      }
      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      if (strA < strB) return direction === "asc" ? -1 : 1
      if (strA > strB) return direction === "asc" ? 1 : -1
      return 0
    })

    setConversionData(sorted)
  }

  const handleGenerarConversion = async () => {
    if (jsonData.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para procesar. Primero carga un archivo Excel.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoadingImport(true)
      const resultado = await buscarIngredientesExistentes(jsonData)

      if (resultado.success) {
        if (resultado.data.length > 0) {
          // Columnas a excluir
          const columnasExcluidas = new Set(["fechacreacion", "fechamodificacion", "categoria", "activo", "categoriaid", "cambio"])

          // Construir mapa de precio desde la vista previa: codigorapsodia -> precio
          const precioMap: Record<string, string> = {}
          jsonData.forEach((fila: any) => {
            // Buscar el código en cualquier variante de nombre de columna
            const codigoKey = Object.keys(fila).find(k =>
              k.toLowerCase() === "codigorapsodia" || k.toLowerCase() === "codigo"
            )
            const precioKey = Object.keys(fila).find(k =>
              k.toLowerCase() === "precio" || k.toLowerCase() === "costounitario"
            )
            const codigo = codigoKey ? String(fila[codigoKey]).trim() : ""
            const precio = precioKey ? String(fila[precioKey]).trim() : ""
            if (codigo) precioMap[codigo] = precio
          })

          // Filtrar columnas, excluir 'costo' original (se reinserta como 'costo(actual)')
          const colsOriginal = Object.keys(resultado.data[0]).filter(c =>
            !columnasExcluidas.has(c.toLowerCase()) && c.toLowerCase() !== "costo"
          )
          const cols = [...colsOriginal, "precio", "costo(actual)", "costounitario", "Cambio"]

          // Detectar codigorapsodia duplicados
          const conteo: Record<string, number> = {}
          resultado.data.forEach((row: any) => {
            const cr = String(row.codigorapsodia || "").trim()
            if (cr) conteo[cr] = (conteo[cr] || 0) + 1
          })
          const dupes = new Set<string>(Object.entries(conteo).filter(([, c]) => c > 1).map(([k]) => k))
          setDuplicadosSet(dupes)

          // Agregar precio y costounitario a cada registro
          const dataConPrecio = resultado.data.map((row: any) => {
            const filtrado: any = {}
            colsOriginal.forEach(col => { filtrado[col] = row[col] })
            const precioStr = precioMap[String(row.codigorapsodia || "").trim()] || ""
            filtrado.precio = precioStr
            filtrado["costo(actual)"] = row.costo ?? ""

            // Calcular costounitario
            const precio = parseFloat(precioStr)
            const conversion = parseFloat(String(row.conversion ?? ""))
            const porcentajemerma = parseFloat(String(row.porcentajemerma ?? ""))

            if (!isNaN(precio) && !isNaN(conversion) && conversion !== 0) {
              if (!isNaN(porcentajemerma) && porcentajemerma !== 0) {
                filtrado.costounitario = (precio / (conversion * (1 - porcentajemerma))).toFixed(6)
              } else {
                filtrado.costounitario = (precio / conversion).toFixed(6)
              }
            } else {
              filtrado.costounitario = ""
            }

            // Guardar valor original calculado para detectar ediciones manuales
            filtrado._costounitarioOriginal = filtrado.costounitario

            // Comparar costo(actual) vs costounitario a 3 decimales
            const costoActual = parseFloat(String(filtrado["costo(actual)"] ?? ""))
            const costoUnit = parseFloat(String(filtrado.costounitario ?? ""))
            if (!isNaN(costoActual) && !isNaN(costoUnit)) {
              if (costoActual.toFixed(3) === costoUnit.toFixed(3)) {
                filtrado.Cambio = ""
              } else if (Math.abs(costoActual - costoUnit) > 5) {
                filtrado.Cambio = "critico"
              } else {
                filtrado.Cambio = "cambio"
              }
            } else {
              filtrado.Cambio = ""
            }

            return filtrado
          })

          // Contar registros con cambio de costo
          const totalCambios = dataConPrecio.filter((r: any) => r.Cambio === "cambio").length
          const totalCriticos = dataConPrecio.filter((r: any) => r.Cambio === "critico").length
          setCambiosCount(totalCambios)
          setCambiosCriticosCount(totalCriticos)

          setConversionColumnas(cols)
          setConversionData(dataConPrecio)
        } else {
          setConversionColumnas([])
          setConversionData([])
          setDuplicadosSet(new Set())
        }
        setConversionEnabled(true)
        setActiveTab("conversion")
        toast({
          title: "Conversión generada",
          description: resultado.message,
        })
      } else {
        toast({
          title: "Error",
          description: resultado.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al generar conversión",
        variant: "destructive",
      })
    } finally {
      setLoadingImport(false)
    }
  }

  const handleCargarInformacion = async () => {
    if (jsonData.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para cargar. Primero carga un archivo Excel.",
        variant: "destructive",
      })
      return
    }

    const verificacion = await verificarYObtenerConteo()
    if (verificacion.hasData) {
      setShowConfirmDialog(true)
    } else {
      await realizarImportacion()
    }
  }

  const realizarImportacion = async () => {
    try {
      setLoadingImport(true)
      const resultado = await importarIngredientesAction(jsonData)

      if (resultado.success) {
        setShowSuccessDialog(true)
        // Limpiar los datos después de importar exitosamente
        setFile(null)
        setPreviewData([])
        setColumnas([])
        setJsonData([])
      } else {
        toast({
          title: "Error",
          description: resultado.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar la información",
        variant: "destructive",
      })
    } finally {
      setLoadingImport(false)
    }
  }

  const handleAceptarLimpieza = async () => {
    setShowConfirmDialog(false)
    try {
      setLoadingImport(true)
      // Limpiar la tabla
      const limpiezaResult = await limpiarCargaIngredientes()
      if (limpiezaResult.success) {
        // Proceder con la importación
        await realizarImportacion()
      } else {
        toast({
          title: "Error",
          description: limpiezaResult.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al limpiar los datos anteriores",
        variant: "destructive",
      })
    } finally {
      setLoadingImport(false)
    }
  }

  const handleSort = (column: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === column && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key: column, direction })

    const sorted = [...previewData].sort((a, b) => {
      const valA = a[column] ?? ""
      const valB = b[column] ?? ""

      // Try numeric comparison
      const numA = Number(valA)
      const numB = Number(valB)
      if (!isNaN(numA) && !isNaN(numB) && String(valA).trim() !== "" && String(valB).trim() !== "") {
        return direction === "asc" ? numA - numB : numB - numA
      }

      // String comparison
      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      if (strA < strB) return direction === "asc" ? -1 : 1
      if (strA > strB) return direction === "asc" ? 1 : -1
      return 0
    })

    setPreviewData(sorted)
  }

  const handleSortVisualizar = (column: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfigVisualizar && sortConfigVisualizar.key === column && sortConfigVisualizar.direction === "asc") {
      direction = "desc"
    }
    setSortConfigVisualizar({ key: column, direction })
    const sorted = [...visualizarData].sort((a, b) => {
      const valA = a[column] ?? ""
      const valB = b[column] ?? ""
      const numA = Number(valA)
      const numB = Number(valB)
      if (!isNaN(numA) && !isNaN(numB) && String(valA).trim() !== "" && String(valB).trim() !== "") {
        return direction === "asc" ? numA - numB : numB - numA
      }
      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      if (strA < strB) return direction === "asc" ? -1 : 1
      if (strA > strB) return direction === "asc" ? 1 : -1
      return 0
    })
    setVisualizarData(sorted)
  }

  const handleActualizarInsumos = async () => {
    // Obtener IDs de ingredientes con cambios (cambio, critico o manual)
    const idsConCambios = conversionData
      .filter((r: any) => r.Cambio === "cambio" || r.Cambio === "critico" || r.Cambio === "manual")
      .map((r: any) => r.id)
      .filter((id: any) => id !== undefined && id !== null)

    if (idsConCambios.length === 0) {
      toast({
        title: "Sin cambios",
        description: "No se detectaron cambios de costo en ningún registro.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoadingVisualizar(true)
      const resultado = await buscarRecetasAfectadas(idsConCambios)

      if (resultado.success) {
        if (resultado.data.length > 0) {
          // Mapa ingredienteid -> costounitario desde pestaña 2
          const costoUnitMap: Record<number, string> = {}
          conversionData
            .filter((r: any) => r.Cambio === "cambio" || r.Cambio === "critico" || r.Cambio === "manual")
            .forEach((r: any) => {
              if (r.id !== undefined) costoUnitMap[r.id] = String(r.costounitario ?? "")
            })

          const colsExcluidas = new Set(["hotelid"])
          const allCols = Object.keys(resultado.data[0]).filter(c => !colsExcluidas.has(c))

          // Insertar costounitario entre hotel y cantidad
          const hotelIdx = allCols.indexOf("hotel")
          const ordenadas = [...allCols]
          if (hotelIdx !== -1) {
            ordenadas.splice(hotelIdx + 1, 0, "costounitario")
          } else {
            ordenadas.push("costounitario")
          }
          const cols = [...ordenadas, "costoparcial(nuevo)", "costototal(nuevo)"]

          // Obtener sumas de costoparcial excluyendo ingrediente que cambia
          const pares = resultado.data.map((row: any) => ({
            recetaid: row.recetaid,
            ingredienteid: row.ingredienteid,
          }))
          const sumasResult = await obtenerSumaCostoParcial(pares)
          const sumasMap = sumasResult.success ? sumasResult.data : {}

          const dataConCols = resultado.data.map((row: any) => {
            const filtrado: any = {}
            allCols.forEach(col => { filtrado[col] = row[col] })
            const cu = costoUnitMap[row.ingredienteid] || ""
            filtrado.costounitario = cu
            const cantidad = parseFloat(String(row.cantidad ?? ""))
            const cuNum = parseFloat(cu)
            const costoParcialNuevo = (!isNaN(cantidad) && !isNaN(cuNum)) ? cantidad * cuNum : 0
            filtrado["costoparcial(nuevo)"] = costoParcialNuevo ? costoParcialNuevo.toFixed(6) : ""

            // costototal(nuevo) = suma costoparcial otros ingredientes + costoparcial(nuevo)
            const key = `${row.recetaid}_${row.ingredienteid}`
            const sumaOtros = (sumasMap as Record<string, number>)[key] ?? 0
            filtrado["costototal(nuevo)"] = costoParcialNuevo ? (sumaOtros + costoParcialNuevo).toFixed(6) : ""

            return filtrado
          })

          setVisualizarColumnas(cols)
          setVisualizarData(dataConCols)
        } else {
          setVisualizarColumnas([])
          setVisualizarData([])
        }
        setVisualizarEnabled(true)
        setActiveTab("visualizar")
        toast({
          title: "Visualización generada",
          description: resultado.message,
        })
      } else {
        toast({
          title: "Error",
          description: resultado.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al buscar recetas afectadas",
        variant: "destructive",
      })
    } finally {
      setLoadingVisualizar(false)
    }
  }

  const handleScroll = (direction: "left" | "right") => {
    if (tableContainerRef.current) {
      const scrollAmount = 300
      if (direction === "left") {
        tableContainerRef.current.scrollLeft -= scrollAmount
      } else {
        tableContainerRef.current.scrollLeft += scrollAmount
      }
      setScrollPosition(tableContainerRef.current.scrollLeft)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Importar Ingredientes</h1>
          <p className="text-lg text-slate-600">Carga de datos masivo</p>
        </div>

        {/* Sección de Carga y Descarga */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Cargar Archivo - Columna 1 */}
          <div className="lg:col-span-2">
            <Card className="h-full bg-white/95 backdrop-blur border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Cargar Archivo Excel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {file && (
                      <p className="text-sm text-slate-600 mt-2">
                        Archivo: <span className="font-semibold">{file.name}</span>
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleLoadFile}
                    disabled={!file || loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? "Cargando..." : "Cargar Archivo"}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Formatos soportados: .xlsx, .xls
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Descargar Plantilla - Columna 2 */}
          <div>
            <Card className="h-full bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur border-2 border-green-200 hover:border-green-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 text-base">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Descargar Plantilla
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Descarga la plantilla requerida para cargar los ingredientes correctamente.
                </p>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabla de Vista Previa con Pestañas */}
        {previewData.length > 0 && (
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-1 border-b border-slate-200">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === "preview"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Vista Previa ({previewData.length} filas)
                </button>
                <button
                  onClick={() => conversionEnabled && setActiveTab("conversion")}
                  disabled={!conversionEnabled}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === "conversion"
                      ? "border-blue-600 text-blue-600"
                      : conversionEnabled
                        ? "border-transparent text-slate-500 hover:text-slate-700"
                        : "border-transparent text-slate-300 cursor-not-allowed"
                  }`}
                >
                  Conversión {conversionEnabled && `(${conversionData.length} filas)`}
                </button>
                <button
                  onClick={() => visualizarEnabled && setActiveTab("visualizar")}
                  disabled={!visualizarEnabled}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === "visualizar"
                      ? "border-blue-600 text-blue-600"
                      : visualizarEnabled
                        ? "border-transparent text-slate-500 hover:text-slate-700"
                        : "border-transparent text-slate-300 cursor-not-allowed"
                  }`}
                >
                  Visualizar Cambios {visualizarEnabled && `(${visualizarData.length} filas)`}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pestaña Vista Previa */}
              {activeTab === "preview" && (
                <>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleScroll("left")}
                      className="p-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div
                      ref={tableContainerRef}
                      className="flex-1 overflow-x-auto h-[80vh] overflow-y-auto rounded-lg border border-slate-200"
                    >
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-slate-900 text-white z-10">
                          <tr>
                            <th className="px-2 py-1 text-left text-xs font-semibold whitespace-nowrap w-12">
                              #
                            </th>
                            {columnas.map((col) => (
                              <th
                                key={col}
                                className="px-2 py-1 text-left text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-700 transition-colors select-none"
                                onClick={() => handleSort(col)}
                              >
                                <div className="flex items-center gap-1">
                                  {col}
                                  {sortConfig?.key === col ? (
                                    sortConfig.direction === "asc" ? (
                                      <ArrowUp className="h-3 w-3" />
                                    ) : (
                                      <ArrowDown className="h-3 w-3" />
                                    )
                                  ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className={`border-b border-slate-200 ${
                                rowIndex % 2 === 0 ? "bg-slate-50" : "bg-white"
                              } hover:bg-blue-50 transition-colors`}
                            >
                              <td className="px-2 py-1 text-xs whitespace-nowrap font-semibold text-slate-500 w-12">
                                {rowIndex + 1}
                              </td>
                              {columnas.map((col) => (
                                <td
                                  key={`${rowIndex}-${col}`}
                                  className="px-2 py-1 text-xs text-slate-700 whitespace-nowrap"
                                >
                                  {String(row[col] || "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleScroll("right")}
                      className="p-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Botón Generar Conversión */}
                  <div className="flex justify-end pt-4 border-t border-slate-200">
                    <Button
                      onClick={handleGenerarConversion}
                      disabled={loadingImport || jsonData.length === 0}
                      className="bg-green-600 hover:bg-green-700 text-white px-8"
                    >
                      {loadingImport ? "Generando..." : "Generar Conversión"}
                    </Button>
                  </div>
                </>
              )}

              {/* Pestaña Conversión */}
              {activeTab === "conversion" && conversionEnabled && (
                  conversionData.length > 0 ? (
                    <>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScroll("left")}
                        className="p-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div
                        ref={tableContainerRef}
                        className="flex-1 overflow-x-auto h-[80vh] overflow-y-auto rounded-lg border border-slate-200"
                      >
                        <table className="w-full border-collapse">
                          <thead className="sticky top-0 z-20">
                            <tr>
                              <th className="px-2 py-1 text-left text-xs font-semibold whitespace-nowrap w-12 bg-slate-900 text-white sticky left-0 z-30">
                                #
                              </th>
                              {conversionColumnas.map((col, colIndex) => {
                                const stickyColumns = ["id", "codigo", "nombre"]
                                const stickyIndex = stickyColumns.indexOf(col.toLowerCase())
                                const isSticky = stickyIndex !== -1
                                // Approximate left offsets: # = 48px, id ~= 80px, codigo ~= 160px
                                const stickyLeftValues = [48, 108, 208]
                                const isGreen = col === "costounitario"

                                return (
                                <th
                                  key={col}
                                  className={`px-2 py-1 text-left text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors select-none ${
                                    isGreen ? "bg-green-700 hover:bg-green-600 text-white" : "bg-slate-900 text-white hover:bg-slate-700"
                                  } ${isSticky ? "sticky z-30" : ""}`}
                                  style={isSticky ? { left: `${stickyLeftValues[stickyIndex]}px` } : undefined}
                                  onClick={() => handleSortConversion(col)}
                                >
                                  <div className="flex items-center gap-1">
                                    {col}
                                    {sortConfigConversion?.key === col ? (
                                      sortConfigConversion.direction === "asc" ? (
                                        <ArrowUp className="h-3 w-3" />
                                      ) : (
                                        <ArrowDown className="h-3 w-3" />
                                      )
                                    ) : (
                                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                                    )}
                                  </div>
                                </th>
                                )
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {conversionData.map((row, rowIndex) => {
                              const esDuplicado = duplicadosSet.has(String(row.codigorapsodia || "").trim())
                              const rowBg = esDuplicado
                                ? "bg-red-100"
                                : rowIndex % 2 === 0 ? "bg-slate-50" : "bg-white"
                              return (
                              <tr
                                key={rowIndex}
                                className={`border-b border-slate-200 ${
                                  esDuplicado
                                    ? "bg-red-100 hover:bg-red-200"
                                    : rowIndex % 2 === 0 ? "bg-slate-50 hover:bg-blue-50" : "bg-white hover:bg-blue-50"
                                } transition-colors`}
                              >
                                <td className={`px-2 py-1 text-xs whitespace-nowrap font-semibold w-12 sticky left-0 z-10 ${esDuplicado ? "text-red-700 bg-red-100" : "text-slate-500 " + rowBg}`}>
                                  {rowIndex + 1}
                                </td>
                                {conversionColumnas.map((col) => {
                                  const stickyColumns = ["id", "codigo", "nombre"]
                                  const stickyIndex = stickyColumns.indexOf(col.toLowerCase())
                                  const isSticky = stickyIndex !== -1
                                  const stickyLeftValues = [48, 108, 208]
                                  const isGreen = col === "costounitario"

                                  const isCambio = col === "Cambio"

                                  return (
                                  <td
                                    key={`${rowIndex}-${col}`}
                                    className={`px-2 py-1 text-xs whitespace-nowrap ${
                                      isGreen ? "bg-green-50 text-green-800 font-semibold"
                                      : isCambio ? "text-center"
                                      : isSticky ? (esDuplicado ? "bg-red-100" : rowBg) + " font-medium"
                                      : "text-slate-700"
                                    } ${isSticky ? "sticky z-10" : ""}`}
                                    style={isSticky ? { left: `${stickyLeftValues[stickyIndex]}px` } : undefined}
                                  >
                                    {isCambio
                                      ? (row[col] === "critico"
                                        ? <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                                        : row[col] === "manual"
                                          ? <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                                          : row[col] === "cambio"
                                            ? <span className="inline-block w-3 h-3 rounded-full bg-orange-400" />
                                            : null)
                                      : isGreen
                                        ? (
                                          <input
                                            type="text"
                                            value={String(row[col] ?? "")}
                                            onChange={(e) => {
                                              const newData = [...conversionData]
                                              const updatedRow = { ...newData[rowIndex], costounitario: e.target.value }
                                              const costoAct = parseFloat(String(updatedRow["costo(actual)"] ?? ""))
                                              const costoNew = parseFloat(e.target.value)
                                              const original = String(updatedRow._costounitarioOriginal ?? "")
                                              const esEdicionManual = e.target.value !== original

                                              if (!isNaN(costoAct) && !isNaN(costoNew)) {
                                                if (costoAct.toFixed(3) === costoNew.toFixed(3)) {
                                                  // Valor igual al costo actual → sin cambio
                                                  updatedRow.Cambio = ""
                                                } else if (esEdicionManual) {
                                                  // Editado manualmente y difiere del costo actual → azul
                                                  updatedRow.Cambio = "manual"
                                                } else if (Math.abs(costoAct - costoNew) > 5) {
                                                  updatedRow.Cambio = "critico"
                                                } else {
                                                  updatedRow.Cambio = "cambio"
                                                }
                                              } else {
                                                updatedRow.Cambio = esEdicionManual ? "manual" : ""
                                              }

                                              // Si se restauró al valor original, recalcular como si no hubiera edición
                                              if (!esEdicionManual) {
                                                if (!isNaN(costoAct) && !isNaN(costoNew)) {
                                                  if (costoAct.toFixed(3) === costoNew.toFixed(3)) {
                                                    updatedRow.Cambio = ""
                                                  } else if (Math.abs(costoAct - costoNew) > 5) {
                                                    updatedRow.Cambio = "critico"
                                                  } else {
                                                    updatedRow.Cambio = "cambio"
                                                  }
                                                } else {
                                                  updatedRow.Cambio = ""
                                                }
                                              }

                                              newData[rowIndex] = updatedRow
                                              setConversionData(newData)
                                              setCambiosCount(newData.filter((r: any) => r.Cambio === "cambio").length)
                                              setCambiosCriticosCount(newData.filter((r: any) => r.Cambio === "critico").length)
                                              setCambiosManualCount(newData.filter((r: any) => r.Cambio === "manual").length)
                                            }}
                                            className="w-full bg-transparent border-b border-green-300 focus:border-green-600 focus:outline-none text-xs text-green-800 font-semibold px-0 py-0"
                                          />
                                        )
                                        : String(row[col] ?? "")
                                    }
                                  </td>
                                  )
                                })}
                              </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScroll("right")}
                        className="p-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    {(duplicadosSet.size > 0 || cambiosCount > 0 || cambiosCriticosCount > 0 || cambiosManualCount > 0) && (
                      <div className="flex flex-wrap gap-6 mt-2">
                        {duplicadosSet.size > 0 && (
                          <div className="text-sm text-red-600 font-medium">
                            {duplicadosSet.size} código(s) duplicado(s) detectado(s) — resaltados en rojo
                          </div>
                        )}
                        {cambiosCount > 0 && (
                          <div className="text-sm text-orange-600 font-medium flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-full bg-orange-400" />
                            {cambiosCount} registro(s) con cambio de costo
                          </div>
                        )}
                        {cambiosCriticosCount > 0 && (
                          <div className="text-sm text-red-600 font-medium flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                            {cambiosCriticosCount} registro(s) con cambio de costo mayor a 5
                          </div>
                        )}
                        {cambiosManualCount > 0 && (
                          <div className="text-sm text-blue-600 font-medium flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                            {cambiosManualCount} registro(s) editado(s) manualmente
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
                      <Button
                        onClick={handleActualizarInsumos}
                        disabled={loadingVisualizar}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                      >
                        {loadingVisualizar ? "Buscando recetas..." : "Actualizar insumos"}
                      </Button>
                    </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-slate-500">
                      No se encontraron ingredientes existentes que coincidan con los datos cargados.
                    </div>
                  )
              )}

              {/* Pestaña Visualizar Cambios */}
              {activeTab === "visualizar" && visualizarEnabled && (
                visualizarData.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleScroll("left")} className="p-2">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div ref={tableContainerRef} className="flex-1 overflow-x-auto h-[80vh] overflow-y-auto rounded-lg border border-slate-200">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-slate-900 text-white z-10">
                          <tr>
                            <th className="px-2 py-1 text-left text-xs font-semibold whitespace-nowrap w-12">#</th>
                            {visualizarColumnas.map((col) => (
                              <th key={col} className={`px-2 py-1 text-left text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors select-none ${col === "costoparcial(nuevo)" || col === "costototal(nuevo)" ? "bg-green-700 hover:bg-green-600" : col === "ingredientecostoparcial" ? "bg-orange-400 hover:bg-orange-300 text-slate-900" : "hover:bg-slate-700"}`} onClick={() => handleSortVisualizar(col)}>
                                <div className="flex items-center gap-1">
                                  {col}
                                  {sortConfigVisualizar?.key === col ? (sortConfigVisualizar.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visualizarData.map((row, rowIndex) => (
                            <tr key={rowIndex} className={`border-b border-slate-200 ${rowIndex % 2 === 0 ? "bg-slate-50" : "bg-white"} hover:bg-blue-50 transition-colors`}>
                              <td className="px-2 py-1 text-xs whitespace-nowrap font-semibold text-slate-500 w-12">{rowIndex + 1}</td>
                              {visualizarColumnas.map((col) => (
                                <td key={`${rowIndex}-${col}`} className={`px-2 py-1 text-xs whitespace-nowrap ${col === "costoparcial(nuevo)" || col === "costototal(nuevo)" ? "bg-green-50 text-green-800 font-semibold" : col === "ingredientecostoparcial" ? "bg-orange-50 text-orange-800 font-semibold" : "text-slate-700"}`}>{String(row[col] ?? "")}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleScroll("right")} className="p-2">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-slate-500">
                    No se encontraron recetas afectadas por los cambios de costo.
                  </div>
                )
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal de Confirmación */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Datos Existentes Detectados</AlertDialogTitle>
              <AlertDialogDescription>
                Ya existe información previamente cargada en el sistema. ¿Deseas reemplazarla con los nuevos datos? 
                Se eliminarán todos los registros anteriores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleAceptarLimpieza} className="bg-green-600 hover:bg-green-700">
                Aceptar y Continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Éxito */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¡Éxito!</AlertDialogTitle>
              <AlertDialogDescription>
                La información ha sido generada exitosamente. Los datos han sido cargados en el sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowSuccessDialog(false)} className="bg-blue-600 hover:bg-blue-700">
                Aceptar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
