"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, Download, Upload, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, AlertCircle, Search, X, Loader2, Trash2, FileUp, CheckCircle2, AlertTriangle } from "lucide-react"
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
import { importarIngredientesAction, verificarYObtenerConteo, limpiarCargaIngredientes, buscarIngredientesExistentes, buscarRecetasAfectadas, obtenerSumaCostoParcial, guardarExcelCargaNuevo, eliminarExcelCargaNuevoById, eliminarExcelCargaNuevoByIngrediente, actualizarCostoUnitarioMasivo, obtenerHotelesActivos, obtenerExcelCargaNuevoPorHotel, actualizarHistoricoIngredientes, actualizarIngredientesDesdeConversion, respaldarHistoricoRecetas, recalcularCostosCascada, registrarInsumosNuevos, type ActualizarHistoricoResult, type ActualizarIngredientesResult, type RespaldarHistoricoResult, type RecalcularCostosCascadaResult } from "@/app/actions/importar"

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
  const [conversionNotFoundData, setConversionNotFoundData] = useState<any[]>([])
  const [conversionSubTab, setConversionSubTab] = useState<"encontrados" | "noencontrados">("encontrados")
  const [busquedaConversion, setBusquedaConversion] = useState<string>("")
  const [sortConfigConversion, setSortConfigConversion] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [duplicadosSet, setDuplicadosSet] = useState<Set<string>>(new Set())
  const [cambiosCount, setCambiosCount] = useState(0)
  const [cambiosCriticosCount, setCambiosCriticosCount] = useState(0)
  const [cambiosManualCount, setCambiosManualCount] = useState(0)
  const [visualizarEnabled, setVisualizarEnabled] = useState(false)
  const [visualizarData, setVisualizarData] = useState<any[]>([])
  const [visualizarCascading, setVisualizarCascading] = useState<any[]>([])
  const [visualizarCascadingPlatillos, setVisualizarCascadingPlatillos] = useState<any[]>([])
  const [visualizarDirectPlatillos, setVisualizarDirectPlatillos] = useState<any[]>([])
  const [sinCambiosDetectados, setSinCambiosDetectados] = useState(false)
  const [visualizarColumnas, setVisualizarColumnas] = useState<string[]>([])
  const [sortConfigVisualizar, setSortConfigVisualizar] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [loadingVisualizar, setLoadingVisualizar] = useState(false)
  const [visualizarSubTab, setVisualizarSubTab] = useState<"recetas" | "subrecetas">("recetas")
  const [busquedaReceta, setBusquedaReceta] = useState<string>("")
  const [ordenVariacion, setOrdenVariacion] = useState<string>("nombre")
  const [confirmacionEliminar, setConfirmacionEliminar] = useState<
    | { tipo: "preview"; rowIndex: number; id: number; descripcion: string }
    | { tipo: "conversion"; originalIndex: number; hotelid: number; codigorapsodia: string; descripcion: string }
    | null
  >(null)
  const [eliminandoRegistro, setEliminandoRegistro] = useState(false)
  const [etapaCarga, setEtapaCarga] = useState<"validando" | "guardando" | "obteniendo" | "buscando" | "calculando" | null>(null)
  const [cargaTipo, setCargaTipo] = useState<"archivo" | "hotel" | null>(null)
  const [hotelesList, setHotelesList] = useState<{ id: number; acronimo: string; nombre: string }[]>([])
  const [hotelSeleccionadoId, setHotelSeleccionadoId] = useState<string>("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [missingColumns, setMissingColumns] = useState<string[]>([])
  const [filtroCambio, setFiltroCambio] = useState<string>("todos")
  const [showHistoricoConfirm, setShowHistoricoConfirm] = useState(false)
  const [showHistoricoResult, setShowHistoricoResult] = useState(false)
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [historicoResult, setHistoricoResult] = useState<ActualizarHistoricoResult | null>(null)
  const [ingredientesResult, setIngredientesResult] = useState<ActualizarIngredientesResult | null>(null)
  const [respaldoResult, setRespaldoResult] = useState<RespaldarHistoricoResult | null>(null)
  const [recalcularResult, setRecalcularResult] = useState<RecalcularCostosCascadaResult | null>(null)
  useEffect(() => {
    obtenerHotelesActivos().then((res) => {
      if (res.success) setHotelesList(res.data as any[])
    })
  }, [])

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const costoUpdateTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const { toast } = useToast()

  // Subfamilias a omitir tanto en carga de archivo como en búsqueda por hotel.
  // Se compara normalizado (sin acentos, lowercase, trim) para tolerar variantes
  // como "Huéspedes" vs "Huespedes".
  const SUBFAMILIAS_EXCLUIDAS = [
    "Suministros Cocina",
    "Suministros Otros",
    "Suministros Limpieza",
    "Suministros Huespedes",
    "Suministros Centros de Consumo",
    "Papeleria y Articulos de Of.",
    "Papeleria Otros",
    "Papeleria Impresa",
  ]
  const normalizarSubfamilia = (v: any): string =>
    String(v ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
  const SUBFAMILIAS_EXCLUIDAS_SET = new Set(
    SUBFAMILIAS_EXCLUIDAS.map((s) => normalizarSubfamilia(s)),
  )
  // Lee el campo subfamilia tolerando variaciones de mayúsculas en headers
  // (Excel suele venir con "Subfamilia" o "SubFamilia").
  const getSubfamiliaValue = (row: any): string => {
    if (!row) return ""
    const key = Object.keys(row).find((k) => k.toLowerCase().trim() === "subfamilia")
    return key ? String(row[key] ?? "") : ""
  }
  const isSubfamiliaExcluida = (row: any): boolean =>
    SUBFAMILIAS_EXCLUIDAS_SET.has(normalizarSubfamilia(getSubfamiliaValue(row)))

  // Para filas "Nuevos / No encontrados" la columna codigosecundario se
  // autocompleta tomando los últimos 7 caracteres del `codigo` (rapsodia largo)
  // y agregando "0" al final. El usuario puede sobrescribirlo manualmente desde
  // la tabla si hace falta — solo se rellena cuando viene vacío.
  const deriveCodigoSecundarioFromCodigo = (codigo: any): string => {
    const s = String(codigo ?? "").trim()
    if (!s) return ""
    return s.slice(-7) + "0"
  }
  const procesarFilasNotFound = (rows: any[]): any[] =>
    rows.map((row: any) => {
      const csExistente = String(row.codigosecundario ?? "").trim()
      const cs = csExistente || deriveCodigoSecundarioFromCodigo(row.codigo)
      const next: any = { ...row, codigosecundario: cs }
      const conv = parseFloat(String(next.conversion ?? ""))
      const cu = parseFloat(String(next.costounitario ?? ""))
      if (cs && Number.isFinite(conv) && conv > 0 && Number.isFinite(cu) && cu >= 0) {
        next._pendiente = true
      }
      return next
    })

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
      setCargaTipo("archivo")
      setEtapaCarga("validando")
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonDataTemp = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

      if (jsonDataTemp.length === 0) {
        throw new Error("El archivo no contiene datos")
      }

      // Validación: columnas obligatorias (case-insensitive, acepta alias documentados)
      const REQUIRED_COLUMNS: { display: string; aliases: string[] }[] = [
        { display: "hotel", aliases: ["hotel"] },
        { display: "articulo", aliases: ["articulo"] },
        { display: "codigo", aliases: ["codigo", "codigosecundario"] },
        { display: "year", aliases: ["year"] },
        { display: "mes", aliases: ["mes"] },
        { display: "cantidad", aliases: ["cantidad"] },
        { display: "precio", aliases: ["precio"] },
      ]
      const headersNormalized = Object.keys(jsonDataTemp[0]).map((k) => k.toLowerCase().trim())
      const missing = REQUIRED_COLUMNS
        .filter((col) => !col.aliases.some((alias) => headersNormalized.includes(alias)))
        .map((col) => col.display)

      if (missing.length > 0) {
        setMissingColumns(missing)
        setShowValidationDialog(true)
        setPreviewData([])
        setJsonData([])
        setColumnas([])
        setConversionEnabled(false)
        setConversionData([])
        setVisualizarEnabled(false)
        setVisualizarData([])
        return
      }

      // Filtro: omitir filas cuya subfamilia esté en la lista de exclusión
      // (suministros y papelería). Se hace antes de deduplicar para no
      // contaminar el dedupe con filas que igualmente vamos a descartar.
      const totalAntesSubfam = jsonDataTemp.length
      const dataSinSubfamExcluidas = jsonDataTemp.filter((row: any) => !isSubfamiliaExcluida(row))
      const omitidasPorSubfam = totalAntesSubfam - dataSinSubfamExcluidas.length

      // Validación: Deduplicar registros por codigorapsodia y articulo
      const seenCombinations = new Set<string>()
      const dataDeduplicated = dataSinSubfamExcluidas.filter((row: any) => {
        const codigo = row.codigosecundario || row.Codigosecundario || row.CodigoSecundario || row.codigo || row.Codigo || row.CODIGO || ""
        const articulo = row.articulo || row.Articulo || row.ARTICULO || ""
        const key = `${codigo}|${articulo}`

        if (seenCombinations.has(key)) {
          return false // Filtrar registros duplicados
        }

        seenCombinations.add(key)
        return true // Mantener el primer registro
      })

      // Guardar en BD (excel_carga_nuevo) y luego usar los registros guardados como fuente
      setEtapaCarga("guardando")
      const guardado = await guardarExcelCargaNuevo(dataDeduplicated)
      if (!guardado.success) {
        toast({
          title: "Error guardando en base de datos",
          description: guardado.message,
          variant: "destructive",
        })
        return
      }
      const filasBD = guardado.data
      if (!filasBD || filasBD.length === 0) {
        toast({
          title: "Sin datos guardados",
          description: "No se guardaron registros en la base de datos.",
          variant: "destructive",
        })
        return
      }

      // Las columnas mostradas son las de excel_carga_nuevo (incluye id, fechacarga, etc.)
      const columns = Object.keys(filasBD[0])
      setColumnas(columns)
      setPreviewData(filasBD)
      setJsonData(filasBD)
      setScrollPosition(0)

      const deleted = ((guardado as any).deletedCount as number) || 0
      const dupes = dataSinSubfamExcluidas.length - dataDeduplicated.length

      // Encadenar conversión automáticamente
      setEtapaCarga("buscando")
      const conversionOk = await runGenerarConversion(filasBD, { silent: true, skipSync: false })
      setEtapaCarga("calculando")
      // pequeña pausa para que el usuario vea la última etapa antes de cerrar el modal
      await new Promise((r) => setTimeout(r, 300))

      if (conversionOk) {
        setActiveTab("conversion")
      }

      const sufijoExtras = [
        dupes > 0 ? `${dupes} duplicado(s) removido(s)` : "",
        omitidasPorSubfam > 0 ? `${omitidasPorSubfam} omitida(s) por subfamilia` : "",
        conversionOk ? "Conversión generada" : "",
      ].filter(Boolean).join(". ")

      toast({
        title: "Carga completada",
        description: deleted > 0
          ? `Se reemplazaron ${deleted} registros previos. Total guardados: ${filasBD.length}.${sufijoExtras ? ` ${sufijoExtras}.` : ""}`
          : `Se guardaron ${filasBD.length} registros.${sufijoExtras ? ` ${sufijoExtras}.` : ""}`,
      })
    } catch (error: any) {
      toast({
        title: "Error al procesar el archivo",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setEtapaCarga(null)
      setCargaTipo(null)
    }
  }

  const handleBuscarPorHotel = async () => {
    const hid = parseInt(hotelSeleccionadoId)
    if (!hid) {
      toast({
        title: "Selecciona un hotel",
        description: "Debes elegir un hotel del listado.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setCargaTipo("hotel")
      setEtapaCarga("obteniendo")

      const res = await obtenerExcelCargaNuevoPorHotel(hid)
      if (!res.success) {
        toast({
          title: "Error consultando registros",
          description: res.message,
          variant: "destructive",
        })
        return
      }

      const filasBDRaw = res.data
      if (!filasBDRaw || filasBDRaw.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay datos guardados para el hotel seleccionado.",
          variant: "destructive",
        })
        return
      }

      // Filtro: omitir registros con subfamilia en la lista de exclusión
      // (suministros y papelería) — mismo criterio que en carga de archivo.
      const filasBD = filasBDRaw.filter((row: any) => !isSubfamiliaExcluida(row))
      const omitidasPorSubfam = filasBDRaw.length - filasBD.length

      if (filasBD.length === 0) {
        toast({
          title: "Sin registros utilizables",
          description: `Los ${filasBDRaw.length} registros del hotel pertenecen a subfamilias excluidas (suministros / papelería).`,
          variant: "destructive",
        })
        return
      }

      const columns = Object.keys(filasBD[0])
      setColumnas(columns)
      setPreviewData(filasBD)
      setJsonData(filasBD)
      setScrollPosition(0)

      setEtapaCarga("buscando")
      const conversionOk = await runGenerarConversion(filasBD, { silent: true, skipSync: true })
      setEtapaCarga("calculando")
      await new Promise((r) => setTimeout(r, 300))

      if (conversionOk) {
        setActiveTab("conversion")
      }

      const hotelLabel = hotelesList.find((h) => h.id === hid)
      const extras = [
        omitidasPorSubfam > 0 ? `${omitidasPorSubfam} omitida(s) por subfamilia` : "",
        conversionOk ? "Conversión generada" : "",
      ].filter(Boolean).join(". ")
      toast({
        title: "Búsqueda completada",
        description: `${filasBD.length} registros cargados${hotelLabel ? ` para ${hotelLabel.acronimo}` : ""}.${extras ? ` ${extras}.` : ""}`,
      })
    } catch (err: any) {
      toast({
        title: "Error en la búsqueda",
        description: err?.message || "Error inesperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setEtapaCarga(null)
      setCargaTipo(null)
    }
  }

  const solicitarEliminarFila = (rowIndex: number) => {
    const fila = previewData[rowIndex]
    if (!fila) return
    const id = Number(fila.id)
    if (!id) {
      toast({
        title: "No se puede eliminar",
        description: "Esta fila no tiene ID en BD.",
        variant: "destructive",
      })
      return
    }
    const articulo = String(fila.articulo ?? "").trim()
    const codigo = String(fila.codigo ?? fila.codigosecundario ?? fila.codigorapsodia ?? "").trim()
    setConfirmacionEliminar({
      tipo: "preview",
      rowIndex,
      id,
      descripcion: codigo || articulo
        ? `${codigo}${codigo && articulo ? " — " : ""}${articulo}`
        : `Registro ID ${id}`,
    })
  }

  const solicitarEliminarFilaConversion = (originalIndex: number) => {
    const fila = conversionData[originalIndex]
    if (!fila) return
    const hotelid = Number(fila.hotelid)
    const codigorapsodia = String(fila.codigorapsodia ?? "").trim()
    if (!hotelid || !codigorapsodia) {
      toast({
        title: "No se puede eliminar",
        description: "Faltan hotelid o codigorapsodia para ubicar el registro en BD.",
        variant: "destructive",
      })
      return
    }
    const codigo = String(fila.codigorapsodia || fila.codigo || "").trim()
    const nombre = String(fila.nombre ?? "").trim()
    setConfirmacionEliminar({
      tipo: "conversion",
      originalIndex,
      hotelid,
      codigorapsodia,
      descripcion: codigo || nombre
        ? `${codigo}${codigo && nombre ? " — " : ""}${nombre}`
        : "Registro",
    })
  }

  const confirmarEliminarRegistro = async () => {
    if (!confirmacionEliminar) return
    try {
      setEliminandoRegistro(true)

      if (confirmacionEliminar.tipo === "preview") {
        const result = await eliminarExcelCargaNuevoById(confirmacionEliminar.id)
        if (!result.success) {
          toast({ title: "Error eliminando en BD", description: result.message, variant: "destructive" })
          return
        }
        const filaToDelete = previewData[confirmacionEliminar.rowIndex]
        setPreviewData((prev) => prev.filter((r) => r !== filaToDelete))
        setJsonData((prev) => prev.filter((r) => r !== filaToDelete))
        // Invalidar pestañas siguientes
        setConversionEnabled(false)
        setConversionData([])
        setVisualizarEnabled(false)
        setVisualizarData([])
        setVisualizarCascading([])
        setVisualizarCascadingPlatillos([])
        toast({
          title: "Registro eliminado",
          description: `${confirmacionEliminar.descripcion} — eliminado de BD.`,
        })
      } else {
        const result = await eliminarExcelCargaNuevoByIngrediente(
          confirmacionEliminar.hotelid,
          confirmacionEliminar.codigorapsodia
        )
        if (!result.success) {
          toast({ title: "Error eliminando en BD", description: result.message, variant: "destructive" })
          return
        }
        const newData = conversionData.filter((_, i) => i !== confirmacionEliminar.originalIndex)
        // Recalcular duplicados con clave compuesta (codigorapsodia + codigosecundario)
        const conteo: Record<string, number> = {}
        newData.forEach((row: any) => {
          const cr = String(row.codigorapsodia || "").trim()
          const cs = String(row.codigosecundario || "").trim()
          if (cr) {
            const key = `${cr}|${cs}`
            conteo[key] = (conteo[key] || 0) + 1
          }
        })
        const dupes = new Set<string>(Object.entries(conteo).filter(([, c]) => c > 1).map(([k]) => k))
        setConversionData(newData)
        setDuplicadosSet(dupes)
        setCambiosCount(newData.filter((r: any) => r.Cambio === "cambio").length)
        setCambiosCriticosCount(newData.filter((r: any) => r.Cambio === "critico").length)
        setCambiosManualCount(newData.filter((r: any) => r.Cambio === "manual").length)
        // Invalidar visualizar
        setVisualizarEnabled(false)
        setVisualizarData([])
        setVisualizarCascading([])
        setVisualizarCascadingPlatillos([])
        toast({
          title: "Registro eliminado",
          description: `${confirmacionEliminar.descripcion} — ${result.count} fila(s) eliminadas.`,
        })
      }
      setConfirmacionEliminar(null)
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error inesperado", variant: "destructive" })
    } finally {
      setEliminandoRegistro(false)
    }
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

  // Lógica reusable de "Generar Conversión" — recibe el dataset directamente
  // (no depende del estado jsonData) y un flag silent para suprimir el toast/cambio
  // de tab cuando se invoca encadenado (ej: tras cargar archivo).
  const runGenerarConversion = async (dataParam: any[], opts: { silent?: boolean; skipSync?: boolean } = {}): Promise<boolean> => {
    if (!dataParam || dataParam.length === 0) {
      if (!opts.silent) {
        toast({
          title: "Error",
          description: "No hay datos para procesar. Primero carga un archivo Excel.",
          variant: "destructive",
        })
      }
      return false
    }

    try {
      if (!opts.silent) setLoadingImport(true)
      const resultado = await buscarIngredientesExistentes(dataParam)

      if (resultado.success) {
        if (resultado.data.length > 0) {
          // Columnas a excluir
          const columnasExcluidas = new Set(["fechacreacion", "fechamodificacion", "categoria", "activo", "categoriaid", "cambio"])

          // Construir mapa de precio desde la vista previa: codigorapsodia -> precio
          // Headers del Excel pueden venir con espacios (" precio "), por eso .trim() en el find
          const precioMap: Record<string, string> = {}
          // Mapa de year/mes desde la fuente actual (Excel para "cargar archivo" o
          // excel_carga_nuevo para "buscar por hotel"). En ambos casos las columnas
          // se llaman igual (year, mes), pero en Excel pueden venir con espacios.
          const yearMesMap: Record<string, { year: any; mes: any }> = {}
          dataParam.forEach((fila: any) => {
            // Priorizar "codigo" (donde está el rapsodia) sobre "codigosecundario" (corto)
            const codigoKey = Object.keys(fila).find(k =>
              k.toLowerCase().trim() === "codigo"
            ) || Object.keys(fila).find(k =>
              k.toLowerCase().trim() === "codigosecundario"
            )
            const precioKey = Object.keys(fila).find(k =>
              k.toLowerCase().trim() === "precio" || k.toLowerCase().trim() === "costounitario"
            )
            const yearKey = Object.keys(fila).find(k => k.toLowerCase().trim() === "year")
            const mesKey = Object.keys(fila).find(k => k.toLowerCase().trim() === "mes")
            const codigo = codigoKey ? String(fila[codigoKey]).trim() : ""
            const precio = precioKey ? String(fila[precioKey]).trim() : ""
            if (codigo) {
              precioMap[codigo] = precio
              yearMesMap[codigo] = {
                year: yearKey !== undefined ? fila[yearKey] : null,
                mes: mesKey !== undefined ? fila[mesKey] : null,
              }
            }
          })

          // Filtrar columnas, excluir 'costo' original (se reinserta como 'costo(actual)')
          // y ocultar 'codigorapsodia' del display (sus valores ahora se muestran en 'codigo')
          const colsOriginal = Object.keys(resultado.data[0]).filter(c =>
            !columnasExcluidas.has(c.toLowerCase()) && c.toLowerCase() !== "costo"
          )
          const colsDisplay = colsOriginal.filter(c => c.toLowerCase() !== "codigorapsodia")
          // Insertar codigosecundario inmediatamente después de nombre
          const idxNombreDisplay = colsDisplay.findIndex(c => c.toLowerCase() === "nombre")
          const colsDisplayConSec = [...colsDisplay]
          if (idxNombreDisplay !== -1) {
            colsDisplayConSec.splice(idxNombreDisplay + 1, 0, "codigosecundario")
          } else {
            colsDisplayConSec.push("codigosecundario")
          }
          const cols = [...colsDisplayConSec, "precio", "costo(actual)", "costounitario", "Cambio"]

          // Duplicidad REAL: misma combinación (codigorapsodia + codigosecundario).
          // Si codigorapsodia repite con codigosecundario distinto NO es duplicado (es cascade legítimo).
          const conteo: Record<string, number> = {}
          resultado.data.forEach((row: any) => {
            const cr = String(row.codigorapsodia || "").trim()
            const cs = String(row.codigo || "").trim()
            if (cr) {
              const key = `${cr}|${cs}`
              conteo[key] = (conteo[key] || 0) + 1
            }
          })
          const dupes = new Set<string>(Object.entries(conteo).filter(([, c]) => c > 1).map(([k]) => k))
          setDuplicadosSet(dupes)

          // Agregar precio y costounitario a cada registro
          const dataConPrecio = resultado.data.map((row: any) => {
            const filtrado: any = {}
            const cr = String(row.codigorapsodia || "").trim()
            const ymOverride = yearMesMap[cr]
            colsOriginal.forEach(col => {
              const colLow = col.toLowerCase()
              if (colLow === "codigo") {
                // Display: la columna "codigo" ahora muestra el valor rapsodia (= excel.codigo)
                filtrado[col] = row.codigorapsodia ?? ""
              } else if (colLow === "year" && ymOverride) {
                filtrado[col] = ymOverride.year ?? ""
              } else if (colLow === "mes" && ymOverride) {
                filtrado[col] = ymOverride.mes ?? ""
              } else {
                filtrado[col] = row[col]
              }
            })
            // Nueva columna codigosecundario = ingredientes.codigo (código corto interno)
            filtrado.codigosecundario = row.codigo ?? ""
            // Mantener codigorapsodia en la fila para uso interno (matching, dupes, eliminar, edit)
            filtrado.codigorapsodia = row.codigorapsodia
            const precioStr = precioMap[cr] || ""
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
          // Insumos del input que no matchean ningún ingrediente del catálogo —
          // se muestran en sub-pestaña separada para que el usuario los identifique
          // como potenciales nuevos insumos. procesarFilasNotFound autocompleta
          // codigosecundario (últimos 7 chars de codigo + "0") en cada fila.
          setConversionNotFoundData(procesarFilasNotFound(((resultado as any).notFound as any[]) || []))
          setConversionSubTab("encontrados")

          // Persistir costounitario calculado en excel_carga_nuevo (no bloqueante para la UI;
          // si falla, la tabla local ya está poblada y el usuario puede continuar).
          // Se omite cuando los datos vienen ya desde BD (buscar por hotel) — no hay nada que sincronizar.
          let nuevasFilasInsertadas: any[] = []
          if (!opts.skipSync) {
            const updates = dataConPrecio
              .filter((r: any) => r.hotelid && r.codigorapsodia)
              .map((r: any) => {
                const num = parseFloat(String(r.costounitario ?? ""))
                const conv = parseFloat(String(r.conversion ?? ""))
                const merma = parseFloat(String(r.porcentajemerma ?? ""))
                return {
                  hotelid: Number(r.hotelid),
                  codigorapsodia: String(r.codigorapsodia).trim(), // valor matching (excel_carga_nuevo.codigo)
                  codigosecundario: String(r.codigosecundario ?? ""), // ingredientes.codigo (corto)
                  costounitario: isNaN(num) ? null : num,
                  conversion: isNaN(conv) ? null : conv,
                  porcentajemerma: isNaN(merma) ? null : merma,
                }
              })
            if (updates.length > 0) {
              const sync = await actualizarCostoUnitarioMasivo(updates)
              if (!sync.success) {
                toast({
                  title: "Aviso: no se pudo sincronizar BD",
                  description: sync.message,
                  variant: "destructive",
                })
              } else if (sync.insertedRows && sync.insertedRows.length > 0) {
                nuevasFilasInsertadas = sync.insertedRows
                console.log(`[DEBUG] ${sync.insertedRows.length} filas clonadas por duplicidad de codigosecundario`)
              }
            }
          }

          // Enriquecer las filas existentes de Vista Previa con codigosecundario, conversion y
          // porcentajemerma del primer ingrediente matcheado (los duplicados se appendean abajo).
          const ingMap: Record<string, { codigo: string; conversion: any; porcentajemerma: any }> = {}
          resultado.data.forEach((ing: any) => {
            const cr = String(ing.codigorapsodia ?? "").trim()
            if (cr && ingMap[cr] === undefined) {
              ingMap[cr] = {
                codigo: String(ing.codigo ?? ""),
                conversion: ing.conversion,
                porcentajemerma: ing.porcentajemerma,
              }
            }
          })
          const enrichedRows = dataParam.map((row: any) => {
            const rapsodiaCode = String(row.codigo ?? "").trim()
            const matched = ingMap[rapsodiaCode]
            if (matched) {
              return {
                ...row,
                codigosecundario: matched.codigo,
                conversion: matched.conversion,
                porcentajemerma: matched.porcentajemerma,
              }
            }
            return row
          })
          // Append las filas clonadas (los codigosecundario adicionales) al final
          const finalRows = nuevasFilasInsertadas.length > 0
            ? [...enrichedRows, ...nuevasFilasInsertadas]
            : enrichedRows
          setPreviewData(finalRows)
          setJsonData(finalRows)
        } else {
          setConversionColumnas([])
          setConversionData([])
          setDuplicadosSet(new Set())
          const nf = procesarFilasNotFound(((resultado as any).notFound as any[]) || [])
          setConversionNotFoundData(nf)
          // Si no hay encontrados pero sí no-encontrados, mostrar la sub-pestaña
          // de no-encontrados por defecto.
          setConversionSubTab(nf.length > 0 ? "noencontrados" : "encontrados")
        }
        setConversionEnabled(true)
        if (!opts.silent) {
          setActiveTab("conversion")
          toast({
            title: "Conversión generada",
            description: resultado.message,
          })
        }
        return true
      } else {
        if (!opts.silent) {
          toast({
            title: "Error",
            description: resultado.message,
            variant: "destructive",
          })
        } else {
          // En modo silent, igual logueamos el error a consola y mostramos toast suave
          toast({
            title: "Error generando conversión",
            description: resultado.message,
            variant: "destructive",
          })
        }
        return false
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al generar conversión",
        variant: "destructive",
      })
      return false
    } finally {
      if (!opts.silent) setLoadingImport(false)
    }
  }

  const handleGenerarConversion = async () => {
    await runGenerarConversion(jsonData)
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
    const filasConCambio = conversionData.filter(
      (r: any) => r.Cambio === "cambio" || r.Cambio === "critico" || r.Cambio === "manual"
    )
    const idsConCambios = filasConCambio
      .map((r: any) => r.id)
      .filter((id: any) => id !== undefined && id !== null)

    // Hoteles afectados: derivados del propio ingrediente en BD (cada ingrediente
    // pertenece a un hotelid). Esto acota la búsqueda de recetas/cascade al ámbito
    // del hotel cuyos insumos se están actualizando.
    const hotelIdsAfectados = [...new Set(
      filasConCambio
        .map((r: any) => r.hotelid)
        .filter((h: any) => h !== undefined && h !== null)
    )] as number[]

    if (idsConCambios.length === 0) {
      // Sin cambios: navegar a pestaña 3 con mensaje informativo en vez de abortar.
      setVisualizarColumnas([])
      setVisualizarData([])
      setVisualizarCascading([])
      setVisualizarCascadingPlatillos([])
      setVisualizarDirectPlatillos([])
      setSinCambiosDetectados(true)
      setVisualizarEnabled(true)
      setVisualizarSubTab("recetas")
      setActiveTab("visualizar")
      return
    }

    // Hay cambios: limpiar el flag por si venía de una corrida previa sin cambios.
    setSinCambiosDetectados(false)

    try {
      setLoadingVisualizar(true)
      const resultado = await buscarRecetasAfectadas(idsConCambios, hotelIdsAfectados)

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

          // Enriquecer directPlatillos con costounitario calculado y costoparcial(nuevo)
          const directPlatillosRaw = ((resultado as any).directPlatillos as any[]) || []
          const directPlatillosEnriched = directPlatillosRaw.map((row: any) => {
            const cu = costoUnitMap[row.ingredienteid] || ""
            const cantidad = parseFloat(String(row.cantidad ?? ""))
            const cuNum = parseFloat(cu)
            const costoParcialNuevo = (!isNaN(cantidad) && !isNaN(cuNum)) ? cantidad * cuNum : 0
            return {
              ...row,
              costounitario: cu,
              "costoparcial(nuevo)": costoParcialNuevo ? costoParcialNuevo.toFixed(6) : "",
            }
          })

          setVisualizarColumnas(cols)
          setVisualizarData(dataConCols)
          setVisualizarCascading(((resultado as any).cascading as any[]) || [])
          setVisualizarCascadingPlatillos(((resultado as any).cascadingPlatillos as any[]) || [])
          setVisualizarDirectPlatillos(directPlatillosEnriched)
        } else {
          // Aún sin subrecetas, puede haber platillos directos que mostrar
          const directPlatillosRaw = ((resultado as any).directPlatillos as any[]) || []
          const costoUnitMapEmpty: Record<number, string> = {}
          conversionData
            .filter((r: any) => r.Cambio === "cambio" || r.Cambio === "critico" || r.Cambio === "manual")
            .forEach((r: any) => {
              if (r.id !== undefined) costoUnitMapEmpty[r.id] = String(r.costounitario ?? "")
            })
          const directPlatillosEnriched = directPlatillosRaw.map((row: any) => {
            const cu = costoUnitMapEmpty[row.ingredienteid] || ""
            const cantidad = parseFloat(String(row.cantidad ?? ""))
            const cuNum = parseFloat(cu)
            const costoParcialNuevo = (!isNaN(cantidad) && !isNaN(cuNum)) ? cantidad * cuNum : 0
            return {
              ...row,
              costounitario: cu,
              "costoparcial(nuevo)": costoParcialNuevo ? costoParcialNuevo.toFixed(6) : "",
            }
          })
          setVisualizarColumnas([])
          setVisualizarData([])
          setVisualizarCascading([])
          setVisualizarCascadingPlatillos([])
          setVisualizarDirectPlatillos(directPlatillosEnriched)
        }
        setVisualizarEnabled(true)
        setVisualizarSubTab("recetas")
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

  // Hoteles afectados por la carga actual: derivados de conversionData (tanto si
  // entró por dropdown como por archivo, esa tabla refleja lo que se está procesando).
  const hotelesAfectadosActuales = (): number[] => {
    if (cargaTipo === "hotel" && hotelSeleccionadoId) {
      const hid = parseInt(hotelSeleccionadoId)
      return Number.isFinite(hid) ? [hid] : []
    }
    return [...new Set(
      conversionData
        .map((r: any) => Number(r.hotelid))
        .filter((h: number) => Number.isFinite(h) && h > 0)
    )]
  }

  const [registrandoInsumos, setRegistrandoInsumos] = useState(false)
  const [pendientesPreflightOpen, setPendientesPreflightOpen] = useState(false)
  const [pendientesPreflightTarget, setPendientesPreflightTarget] = useState<"costos" | "visualizar">("costos")

  // Una fila se considera "pendiente de registrar" cuando los 3 campos
  // requeridos están completos y válidos: codigosecundario (texto no vacío),
  // conversion (> 0) y costounitario (>= 0). costounitario ya no se edita
  // a mano: se calcula a partir de precio, conversion y porcentajemerma.
  const isFilaCompletaParaRegistrar = (row: any): boolean => {
    const cs = String(row.codigosecundario ?? "").trim()
    const conv = parseFloat(String(row.conversion ?? ""))
    const cu = parseFloat(String(row.costounitario ?? ""))
    if (!cs) return false
    if (!Number.isFinite(conv) || conv <= 0) return false
    if (!Number.isFinite(cu) || cu < 0) return false
    return true
  }

  // Replica la fórmula de runGenerarConversion para "Nuevos / No encontrados":
  //   costounitario = precio / (conversion * (1 - porcentajemerma))   si merma > 0
  //   costounitario = precio / conversion                              si no
  // Devuelve "" cuando faltan datos para calcular.
  const calcularCostoUnitarioFila = (row: any): string => {
    const precio = parseFloat(String(row.precio ?? ""))
    const conversion = parseFloat(String(row.conversion ?? ""))
    const porcentajemerma = parseFloat(String(row.porcentajemerma ?? ""))
    if (isNaN(precio) || isNaN(conversion) || conversion === 0) return ""
    if (!isNaN(porcentajemerma) && porcentajemerma !== 0) {
      return (precio / (conversion * (1 - porcentajemerma))).toFixed(6)
    }
    return (precio / conversion).toFixed(6)
  }

  // Editar campo en una fila no-encontrada (codigosecundario / conversion /
  // porcentajemerma). costounitario NO es editable: se recalcula automaticamente
  // cuando cambian conversion o porcentajemerma. Tras aplicar el cambio, también
  // se recalcula el flag _pendiente.
  const handleEditarCampoNotFound = (idx: number, campo: string, valor: string) => {
    setConversionNotFoundData((prev) => {
      const next = [...prev]
      const updated = { ...next[idx], [campo]: valor }
      // Recalcular costounitario si cambió un input de la fórmula.
      const campoLow = campo.toLowerCase()
      if (campoLow === "conversion" || campoLow === "porcentajemerma" || campoLow === "precio") {
        updated.costounitario = calcularCostoUnitarioFila(updated)
      }
      if (isFilaCompletaParaRegistrar(updated)) {
        updated._pendiente = true
      } else {
        delete updated._pendiente
      }
      next[idx] = updated
      return next
    })
  }

  const handleRegistrarInsumos = async (): Promise<boolean> => {
    const pendientes = conversionNotFoundData
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => row._pendiente)

    if (pendientes.length === 0) {
      toast({
        title: "Sin insumos pendientes",
        description: "Completa codigosecundario, conversion y costounitario en las filas que quieras dar de alta.",
        variant: "destructive",
      })
      return false
    }

    // Construir payload validando hotelid resuelto.
    const filas: any[] = []
    const errores: string[] = []
    pendientes.forEach(({ row }) => {
      const hotelid = Number(row._hotelid)
      if (!Number.isFinite(hotelid) || hotelid <= 0) {
        errores.push(`Hotel "${row.hotel ?? ""}" no resuelto para "${row.articulo ?? row.codigo ?? ""}"`)
        return
      }
      const conv = parseFloat(String(row.conversion ?? ""))
      const cu = parseFloat(String(row.costounitario ?? ""))
      const merma = parseFloat(String(row.porcentajemerma ?? ""))
      const y = parseInt(String(row.year ?? ""), 10)
      const m = parseInt(String(row.mes ?? ""), 10)
      filas.push({
        hotelid,
        codigo: String(row.codigosecundario ?? "").trim(),
        nombre: String(row.articulo ?? "").trim(),
        codigorapsodia: String(row.codigo ?? "").trim(),
        costo: Number.isFinite(cu) ? cu : null,
        conversion: Number.isFinite(conv) ? conv : null,
        porcentajemerma: Number.isFinite(merma) ? merma : null,
        year: Number.isFinite(y) ? y : null,
        mes: Number.isFinite(m) ? m : null,
      })
    })

    if (filas.length === 0) {
      toast({
        title: "Sin filas válidas",
        description: errores.join("; ") || "Ninguna fila pendiente cumple los requisitos.",
        variant: "destructive",
      })
      return false
    }

    try {
      setRegistrandoInsumos(true)
      const resultado = await registrarInsumosNuevos(filas)
      if (!resultado.success) {
        toast({
          title: "Error al registrar insumos",
          description: resultado.errorMessages.join("; ") || "Error desconocido",
          variant: "destructive",
        })
        return false
      }

      toast({
        title: "Insumos registrados",
        description: `${resultado.inserted} insumo(s) insertados correctamente. Refrescando catálogo…`,
      })

      // Re-ejecutar runGenerarConversion con el dataset actual para que ambas
      // sub-pestañas reflejen el nuevo estado del catálogo (los recién
      // insertados ahora aparecen en "Encontrados" en vez de "Nuevos").
      await runGenerarConversion(jsonData, { silent: true, skipSync: true })
      return true
    } catch (e: any) {
      toast({
        title: "Error inesperado",
        description: e?.message || "No se pudo completar el registro.",
        variant: "destructive",
      })
      return false
    } finally {
      setRegistrandoInsumos(false)
    }
  }

  // Wrappers invocados desde "Actualizar nuevos costos" y "Visualizar cambios".
  // Ambos verifican pendientes en sub-pestaña Nuevos antes de continuar; si hay,
  // abren modal de pre-validación (registrar / descartar / cancelar).
  const proseguirSegunTarget = (target: "costos" | "visualizar") => {
    if (target === "costos") setShowHistoricoConfirm(true)
    else handleActualizarInsumos()
  }

  const handleClickActualizarNuevosCostos = () => {
    const hayPendientes = conversionNotFoundData.some((r) => r._pendiente)
    if (hayPendientes) {
      setPendientesPreflightTarget("costos")
      setPendientesPreflightOpen(true)
    } else {
      setShowHistoricoConfirm(true)
    }
  }

  const handleClickVisualizarCambios = () => {
    const hayPendientes = conversionNotFoundData.some((r) => r._pendiente)
    if (hayPendientes) {
      setPendientesPreflightTarget("visualizar")
      setPendientesPreflightOpen(true)
    } else {
      handleActualizarInsumos()
    }
  }

  const handleRegistrarYContinuarConCostos = async () => {
    setPendientesPreflightOpen(false)
    const ok = await handleRegistrarInsumos()
    if (ok) proseguirSegunTarget(pendientesPreflightTarget)
  }

  const handleDescartarPendientesYContinuar = () => {
    setConversionNotFoundData((prev) => prev.map((r) => {
      if (!r._pendiente) return r
      const { _pendiente, ...rest } = r
      return rest
    }))
    setPendientesPreflightOpen(false)
    proseguirSegunTarget(pendientesPreflightTarget)
  }

  const handleActualizarNuevosCostos = async () => {
    setShowHistoricoConfirm(false)
    const hotelIds = hotelesAfectadosActuales()
    if (hotelIds.length === 0) {
      toast({
        title: "Sin hoteles",
        description: "No se pudo determinar el hotel de la carga actual.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoadingHistorico(true)

      // Paso 1: snapshot de ingredientes a historicoingredientes.
      const histResultado = await actualizarHistoricoIngredientes(hotelIds)
      setHistoricoResult(histResultado)

      if (!histResultado.success) {
        setIngredientesResult(null)
        setShowHistoricoResult(true)
        return
      }

      // Paso 2: actualizar ingredientes (costo, year, mes) usando la pestaña 2.
      const filasUpdate = conversionData
        .filter((r: any) => Number.isFinite(Number(r.id)) && Number(r.id) > 0)
        .map((r: any) => {
          const cu = parseFloat(String(r.costounitario ?? ""))
          const y = parseInt(String(r.year ?? ""), 10)
          const m = parseInt(String(r.mes ?? ""), 10)
          return {
            id: Number(r.id),
            costounitario: isNaN(cu) ? null : cu,
            year: isNaN(y) ? null : y,
            mes: isNaN(m) ? null : m,
          }
        })

      const ingResultado = await actualizarIngredientesDesdeConversion(filasUpdate)
      setIngredientesResult(ingResultado)

      // Si el UPDATE de ingredientes falló, no avanzar al respaldo de recetas
      // (sería respaldar costos sobre un estado inconsistente).
      if (!ingResultado.success) {
        setRespaldoResult(null)
        setShowHistoricoResult(true)
        return
      }

      // Paso 3: respaldar composición actual de platillos y subrecetas en `historico`
      // antes de tocar sus costos en pasos posteriores.
      const respResultado = await respaldarHistoricoRecetas(hotelIds)
      setRespaldoResult(respResultado)

      // Si paso 3 falló, no avanzar al paso 4 (no recalcular costos sobre estado
      // inconsistente, y mantener el respaldo coherente con lo que está en BD).
      if (!respResultado.success) {
        setRecalcularResult(null)
        setShowHistoricoResult(true)
        return
      }

      // Paso 4: recalcular costos en cascada (ingredientesxreceta → recetas →
      // recetasxplatillo → ingredientesxplatillo → platillos).
      const cambios = conversionData
        .filter((r: any) => Number.isFinite(Number(r.id)) && Number(r.id) > 0)
        .map((r: any) => {
          const idNum = Number(r.id)
          const oldCosto = parseFloat(String(r["costo(actual)"] ?? ""))
          const newCosto = parseFloat(String(r.costounitario ?? ""))
          return { ingredienteid: idNum, oldCosto, newCosto }
        })
        .filter((c: any) => Number.isFinite(c.oldCosto) && Number.isFinite(c.newCosto))

      const recalcResultado = await recalcularCostosCascada(cambios, hotelIds)
      setRecalcularResult(recalcResultado)
      setShowHistoricoResult(true)
    } catch (e: any) {
      setHistoricoResult({
        success: false,
        hotelesProcesados: 0,
        totalInsertados: 0,
        totalEliminados: 0,
        periodos: [],
        error: e?.message || "Error inesperado",
      })
      setIngredientesResult(null)
      setRespaldoResult(null)
      setRecalcularResult(null)
      setShowHistoricoResult(true)
    } finally {
      setLoadingHistorico(false)
    }
  }

  const descargarReporteVisualizar = (items: any[], subtab: "recetas" | "subrecetas") => {
    if (items.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay registros para exportar.",
        variant: "destructive",
      })
      return
    }

    const rows: any[] = []
    items.forEach((g: any) => {
      const tipoLabel = g.tipo === "subreceta" ? "Subreceta" : "Receta"
      const causas: any[] = []
      g.ingredientes.forEach((ing: any) => {
        causas.push({
          tipo: "Ingrediente",
          nombre: ing.ingrediente,
          parcialActual: ing.actual,
          parcialNuevo: ing.nuevo,
        })
      })
      g.subrecetasCascade.forEach((c: any) => {
        causas.push({
          tipo: "Subreceta (cascade)",
          nombre: c.subreceta,
          parcialActual: c.actualEnPadre,
          parcialNuevo: c.nuevoEnPadre,
        })
      })

      // Si por alguna razón no hay causas, igual incluir una fila resumen
      if (causas.length === 0) {
        rows.push({
          "Tipo": tipoLabel,
          "ID": g.id,
          "Nombre": g.nombre,
          "Hotel": g.hotel,
          "Costo actual": Number(g.costoTotal.toFixed(4)),
          "Costo nuevo": Number(g.totalNuevo.toFixed(4)),
          "Variación $": Number(g.delta.toFixed(4)),
          "Variación %": Number(g.deltaPct.toFixed(2)),
          "Causa tipo": "",
          "Causa nombre": "",
          "Parcial actual": "",
          "Parcial nuevo": "",
          "Variación parcial": "",
        })
        return
      }

      causas.forEach((causa) => {
        // Cada fila incluye TODOS los datos del grupo — para que el reporte sea
        // filtrable/ordenable/pivotable sin celdas vacías.
        rows.push({
          "Tipo": tipoLabel,
          "ID": g.id,
          "Nombre": g.nombre,
          "Hotel": g.hotel,
          "Costo actual": Number(g.costoTotal.toFixed(4)),
          "Costo nuevo": Number(g.totalNuevo.toFixed(4)),
          "Variación $": Number(g.delta.toFixed(4)),
          "Variación %": Number(g.deltaPct.toFixed(2)),
          "Causa tipo": causa.tipo,
          "Causa nombre": causa.nombre,
          "Parcial actual": Number(causa.parcialActual.toFixed(4)),
          "Parcial nuevo": Number(causa.parcialNuevo.toFixed(4)),
          "Variación parcial": Number((causa.parcialNuevo - causa.parcialActual).toFixed(4)),
        })
      })
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    // Anchos de columna
    ws["!cols"] = [
      { wch: 12 }, { wch: 8 }, { wch: 42 }, { wch: 18 },
      { wch: 14 }, { wch: 14 }, { wch: 13 }, { wch: 12 },
      { wch: 20 }, { wch: 42 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    ]
    // Freeze header row
    ws["!freeze"] = { xSplit: 0, ySplit: 1 } as any

    const wb = XLSX.utils.book_new()
    const sheetName = subtab === "recetas" ? "Recetas afectadas" : "Subrecetas afectadas"
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    const fecha = new Date().toISOString().slice(0, 10)
    const filename = `reporte-${subtab}-${fecha}.xlsx`
    XLSX.writeFile(wb, filename)

    toast({
      title: "Reporte generado",
      description: `${items.length} ${subtab === "recetas" ? "receta(s)" : "subreceta(s)"} exportada(s) a ${filename}`,
    })
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

        {/* Sección de Carga (Buscar por Hotel | Cargar Archivo con plantilla integrada) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Buscar por Hotel - Columna 1 (más ancha) */}
          <Card className="lg:col-span-2 bg-white/95 backdrop-blur border-2 border-amber-100 hover:border-amber-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Search className="h-5 w-5 text-amber-600" />
                Buscar por Hotel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500">
                Consulta la información previamente guardada para el hotel seleccionado, sin necesidad de subir un archivo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label htmlFor="hotelSelect" className="block text-sm font-medium text-slate-700 mb-1">
                    Hotel
                  </label>
                  <select
                    id="hotelSelect"
                    value={hotelSeleccionadoId}
                    onChange={(e) => setHotelSeleccionadoId(e.target.value)}
                    disabled={loading || hotelesList.length === 0}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">— Selecciona un hotel —</option>
                    {hotelesList.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.acronimo} — {h.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleBuscarPorHotel}
                  disabled={loading || !hotelSeleccionadoId}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
              {hotelesList.length === 0 && (
                <p className="text-xs text-amber-700">Cargando lista de hoteles…</p>
              )}
            </CardContent>
          </Card>

          {/* Cargar Archivo - Columna 2 */}
          <Card className="bg-white/95 backdrop-blur border-2 border-blue-100 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Upload className="h-5 w-5 text-blue-600" />
                Cargar Archivo Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                            <th className="px-2 py-1 text-center text-xs font-semibold whitespace-nowrap w-16">
                              Acción
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
                              <td className="px-2 py-1 whitespace-nowrap w-16 text-center">
                                <button
                                  onClick={() => solicitarEliminarFila(rowIndex)}
                                  disabled={loadingImport || loadingVisualizar || eliminandoRegistro}
                                  title="Eliminar este registro"
                                  className="inline-flex items-center justify-center h-6 w-6 rounded text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Eliminar fila"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
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

                </>
              )}

              {/* Pestaña Conversión */}
              {activeTab === "conversion" && conversionEnabled && (
                <>
                  {/* Buscador (filtra ambos sub-tabs por nombre/articulo o codigo) */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1 max-w-md">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      <Input
                        type="text"
                        placeholder="Buscar por nombre o código…"
                        value={busquedaConversion}
                        onChange={(e) => setBusquedaConversion(e.target.value)}
                        className="pl-8 pr-8 h-9 text-sm"
                      />
                      {busquedaConversion && (
                        <button
                          type="button"
                          onClick={() => setBusquedaConversion("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          aria-label="Limpiar búsqueda"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Sub-tabs: Encontrados vs Nuevos (no encontrados en catálogo) */}
                  <div className="flex border-b border-slate-200 mb-3">
                    <button
                      type="button"
                      onClick={() => setConversionSubTab("encontrados")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        conversionSubTab === "encontrados"
                          ? "border-b-2 border-blue-600 text-blue-700"
                          : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
                      }`}
                    >
                      Encontrados <span className="ml-1 text-xs opacity-70">({conversionData.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConversionSubTab("noencontrados")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        conversionSubTab === "noencontrados"
                          ? "border-b-2 border-amber-600 text-amber-700"
                          : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
                      }`}
                    >
                      Nuevos / No encontrados <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold ${conversionNotFoundData.length > 0 ? "bg-amber-100 text-amber-800" : "opacity-70"}`}>{conversionNotFoundData.length}</span>
                    </button>
                  </div>

                  {conversionSubTab === "encontrados" && (
                    conversionData.length > 0 ? (
                    <>
                    {/* Filtro por estado de Cambio */}
                    <div className="flex items-center justify-between gap-3 pb-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor="filtroCambio" className="text-sm font-medium text-slate-700">
                          Filtrar por cambio:
                        </label>
                        <select
                          id="filtroCambio"
                          value={filtroCambio}
                          onChange={(e) => setFiltroCambio(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="todos">Todos</option>
                          <option value="cambio">🟠 Naranjas (cambio)</option>
                          <option value="critico">🔴 Rojos (crítico)</option>
                          <option value="manual">🔵 Azules (manual)</option>
                        </select>
                      </div>
                      {filtroCambio !== "todos" && (
                        <span className="text-xs text-slate-500">
                          Mostrando {conversionData.filter((r: any) => r.Cambio === filtroCambio).length} de {conversionData.length}
                        </span>
                      )}
                    </div>
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
                        <table className="border-collapse" style={{ tableLayout: "fixed", width: "max-content" }}>
                          <colgroup>
                            <col style={{ width: "48px" }} />
                            {conversionColumnas.map((col) => {
                              const stickyColumns = ["id", "codigo", "nombre"]
                              const stickyIndex = stickyColumns.indexOf(col.toLowerCase())
                              const stickyWidthValues = [60, 100, 240]
                              if (stickyIndex !== -1) {
                                return <col key={col} style={{ width: `${stickyWidthValues[stickyIndex]}px` }} />
                              }
                              return <col key={col} style={{ width: "140px" }} />
                            })}
                            <col style={{ width: "64px" }} />
                          </colgroup>
                          <thead className="sticky top-0 z-20">
                            <tr>
                              <th className="px-2 py-1 text-left text-xs font-semibold whitespace-nowrap bg-slate-900 text-white sticky left-0 z-30" style={{ width: "48px" }}>
                                #
                              </th>
                              {conversionColumnas.map((col, colIndex) => {
                                const stickyColumns = ["id", "codigo", "nombre"]
                                const stickyIndex = stickyColumns.indexOf(col.toLowerCase())
                                const isSticky = stickyIndex !== -1
                                const stickyLeftValues = [48, 108, 208]
                                const stickyWidthValues = [60, 100, 240]
                                const isLastSticky = isSticky && stickyIndex === stickyColumns.length - 1
                                const isGreen = col === "costounitario"

                                return (
                                <th
                                  key={col}
                                  className={`px-0 py-0 text-left text-xs font-semibold cursor-pointer transition-colors select-none ${
                                    isGreen ? "bg-green-700 hover:bg-green-600 text-white" : "bg-slate-900 text-white hover:bg-slate-700"
                                  } ${isSticky ? "sticky z-30" : ""} ${!isSticky ? "whitespace-nowrap px-2 py-1" : ""}`}
                                  style={isSticky ? {
                                    left: `${stickyLeftValues[stickyIndex]}px`,
                                    width: `${stickyWidthValues[stickyIndex]}px`,
                                    minWidth: `${stickyWidthValues[stickyIndex]}px`,
                                    maxWidth: `${stickyWidthValues[stickyIndex]}px`,
                                    ...(isLastSticky ? { borderRight: "2px solid #94a3b8" } : {}),
                                  } : undefined}
                                  onClick={() => handleSortConversion(col)}
                                >
                                  {isSticky ? (
                                    <div
                                      className="flex items-center gap-1 overflow-hidden whitespace-nowrap px-2 py-1"
                                      style={{ width: `${stickyWidthValues[stickyIndex]}px` }}
                                    >
                                      <span className="truncate">{col}</span>
                                      {sortConfigConversion?.key === col ? (
                                        sortConfigConversion.direction === "asc" ? (
                                          <ArrowUp className="h-3 w-3 flex-shrink-0" />
                                        ) : (
                                          <ArrowDown className="h-3 w-3 flex-shrink-0" />
                                        )
                                      ) : (
                                        <ArrowUpDown className="h-3 w-3 opacity-40 flex-shrink-0" />
                                      )}
                                    </div>
                                  ) : (
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
                                  )}
                                </th>
                                )
                              })}
                              <th className="px-2 py-1 text-center text-xs font-semibold whitespace-nowrap w-16 bg-slate-900 text-white">
                                Acción
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {conversionData
                              .map((row, originalIndex) => ({ row, originalIndex }))
                              .filter(({ row }) =>
                                filtroCambio === "todos" ? true : row.Cambio === filtroCambio
                              )
                              .filter(({ row }) => {
                                const q = busquedaConversion.trim().toLowerCase()
                                if (!q) return true
                                const fields = [row.nombre, row.codigo, row.codigorapsodia, row.codigosecundario]
                                return fields.some((f: any) => f != null && String(f).toLowerCase().includes(q))
                              })
                              .map(({ row, originalIndex }, displayIndex) => {
                              const esDuplicado = duplicadosSet.has(`${String(row.codigorapsodia || "").trim()}|${String(row.codigosecundario || "").trim()}`)
                              const rowBg = esDuplicado
                                ? "bg-red-100"
                                : displayIndex % 2 === 0 ? "bg-slate-50" : "bg-white"
                              return (
                              <tr
                                key={originalIndex}
                                className={`border-b border-slate-200 ${
                                  esDuplicado
                                    ? "bg-red-100 hover:bg-red-200"
                                    : displayIndex % 2 === 0 ? "bg-slate-50 hover:bg-blue-50" : "bg-white hover:bg-blue-50"
                                } transition-colors`}
                              >
                                <td className={`px-2 py-1 text-xs whitespace-nowrap font-semibold w-12 sticky left-0 z-10 ${esDuplicado ? "text-red-700 bg-red-100" : "text-slate-500 " + rowBg}`}>
                                  {displayIndex + 1}
                                </td>
                                {conversionColumnas.map((col) => {
                                  const stickyColumns = ["id", "codigo", "nombre"]
                                  const stickyIndex = stickyColumns.indexOf(col.toLowerCase())
                                  const isSticky = stickyIndex !== -1
                                  const stickyLeftValues = [48, 108, 208]
                                  const stickyWidthValues = [60, 100, 240]
                                  const isLastSticky = isSticky && stickyIndex === stickyColumns.length - 1
                                  const isGreen = col === "costounitario"

                                  const isCambio = col === "Cambio"

                                  return (
                                  <td
                                    key={`${originalIndex}-${col}`}
                                    title={isSticky ? String(row[col] ?? "") : undefined}
                                    className={`text-xs ${!isSticky ? "px-2 py-1 whitespace-nowrap" : ""} ${
                                      isGreen ? "bg-green-50 text-green-800 font-semibold"
                                      : isCambio ? "text-center"
                                      : isSticky ? (esDuplicado ? "bg-red-100" : rowBg) + " font-medium"
                                      : "text-slate-700"
                                    } ${isSticky ? "sticky z-10" : ""}`}
                                    style={isSticky ? {
                                      left: `${stickyLeftValues[stickyIndex]}px`,
                                      width: `${stickyWidthValues[stickyIndex]}px`,
                                      minWidth: `${stickyWidthValues[stickyIndex]}px`,
                                      maxWidth: `${stickyWidthValues[stickyIndex]}px`,
                                      ...(isLastSticky ? { borderRight: "2px solid #94a3b8" } : {}),
                                    } : undefined}
                                  >
                                    {isSticky ? (
                                      <div
                                        className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1"
                                        style={{ width: `${stickyWidthValues[stickyIndex]}px` }}
                                      >
                                        {String(row[col] ?? "")}
                                      </div>
                                    ) : isCambio
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
                                              const updatedRow = { ...newData[originalIndex], costounitario: e.target.value }
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

                                              newData[originalIndex] = updatedRow
                                              setConversionData(newData)
                                              setCambiosCount(newData.filter((r: any) => r.Cambio === "cambio").length)
                                              setCambiosCriticosCount(newData.filter((r: any) => r.Cambio === "critico").length)
                                              setCambiosManualCount(newData.filter((r: any) => r.Cambio === "manual").length)

                                              // Debounce: persistir el nuevo costounitario en excel_carga_nuevo
                                              const ingredId = Number(updatedRow.id)
                                              const hotelid = Number(updatedRow.hotelid)
                                              const codigorapsodia = String(updatedRow.codigorapsodia ?? "").trim()
                                              const valorActual = e.target.value
                                              if (ingredId && hotelid && codigorapsodia) {
                                                if (costoUpdateTimersRef.current[ingredId]) {
                                                  clearTimeout(costoUpdateTimersRef.current[ingredId])
                                                }
                                                costoUpdateTimersRef.current[ingredId] = setTimeout(async () => {
                                                  const num = parseFloat(valorActual)
                                                  const result = await actualizarCostoUnitarioMasivo([{
                                                    hotelid,
                                                    codigorapsodia,
                                                    costounitario: isNaN(num) ? null : num,
                                                  }])
                                                  if (!result.success) {
                                                    toast({
                                                      title: "No se pudo guardar en BD",
                                                      description: result.message,
                                                      variant: "destructive",
                                                    })
                                                  }
                                                  delete costoUpdateTimersRef.current[ingredId]
                                                }, 600)
                                              }
                                            }}
                                            className="w-full bg-transparent border-b border-green-300 focus:border-green-600 focus:outline-none text-xs text-green-800 font-semibold px-0 py-0"
                                          />
                                        )
                                        : String(row[col] ?? "")
                                    }
                                  </td>
                                  )
                                })}
                                <td className="px-2 py-1 whitespace-nowrap w-16 text-center">
                                  <button
                                    onClick={() => solicitarEliminarFilaConversion(originalIndex)}
                                    disabled={loadingImport || loadingVisualizar || eliminandoRegistro}
                                    title="Eliminar este registro"
                                    className="inline-flex items-center justify-center h-6 w-6 rounded text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Eliminar registro"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
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
                        onClick={handleClickVisualizarCambios}
                        disabled={loadingVisualizar}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                      >
                        {loadingVisualizar ? "Buscando recetas..." : "Visualizar cambios"}
                      </Button>
                    </div>
                    </>
                    ) : (
                    <div className="flex items-center justify-center h-40 text-slate-500">
                      No se encontraron ingredientes existentes que coincidan con los datos cargados.
                    </div>
                    )
                  )}

                  {conversionSubTab === "noencontrados" && (
                    conversionNotFoundData.length > 0 ? (() => {
                    const q = busquedaConversion.trim().toLowerCase()
                    const filteredNotFound = q
                      ? conversionNotFoundData.filter((row) => {
                          const fields = [row.articulo, row.codigo, row.codigorapsodia, row.codigosecundario]
                          return fields.some((f: any) => f != null && String(f).toLowerCase().includes(q))
                        })
                      : conversionNotFoundData
                    const pendientesCount = conversionNotFoundData.filter((r) => r._pendiente).length
                    return (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex-1">
                          <p className="text-xs text-amber-900">
                            <span className="font-semibold">{conversionNotFoundData.length}</span> insumo(s) cargados no se encontraron en el catálogo. Completa <code className="bg-amber-100 px-1 rounded">codigosecundario</code> y <code className="bg-amber-100 px-1 rounded">conversion</code> (opcional <code className="bg-amber-100 px-1 rounded">porcentajemerma</code>); el <code className="bg-amber-100 px-1 rounded">costounitario</code> se calcula automáticamente como <code className="bg-amber-100 px-1 rounded">precio / (conversion · (1 - merma))</code>. La fila se marcará en verde cuando esté lista para registrar.
                            {q && (
                              <span className="ml-2 text-amber-800 font-medium">
                                · Filtrando: {filteredNotFound.length} de {conversionNotFoundData.length}
                              </span>
                            )}
                            {pendientesCount > 0 && (
                              <span className="ml-2 text-emerald-700 font-semibold">
                                · {pendientesCount} pendiente(s) por registrar
                              </span>
                            )}
                          </p>
                        </div>
                        <Button
                          onClick={handleRegistrarInsumos}
                          disabled={pendientesCount === 0 || registrandoInsumos}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                        >
                          {registrandoInsumos ? "Registrando…" : `Registrar insumos${pendientesCount > 0 ? ` (${pendientesCount})` : ""}`}
                        </Button>
                      </div>
                      <div className="overflow-x-auto h-[70vh] overflow-y-auto rounded-lg border border-slate-200">
                        {(() => {
                          const NOT_FOUND_HIDDEN_COLS = new Set([
                            "categoria", "unidad", "fechacarga", "familia", "activo",
                          ])
                          const isVisibleCol = (k: string) =>
                            !k.startsWith("_") && !NOT_FOUND_HIDDEN_COLS.has(k.toLowerCase())
                          // Anchos por columna (heurística según contenido típico).
                          // Si una columna no está mapeada, usa DEFAULT_WIDTH.
                          const COL_WIDTHS: Record<string, number> = {
                            id: 60,
                            codigo: 130,
                            codigorapsodia: 130,
                            codigosecundario: 110,
                            hotel: 70,
                            articulo: 220,
                            year: 60,
                            mes: 50,
                            cantidad: 75,
                            precio: 80,
                            unidadbase: 100,
                            conversion: 90,
                            costounitario: 110,
                            porcentajemerma: 110,
                            subfamilia: 130,
                          }
                          const DEFAULT_WIDTH = 110
                          const widthOf = (col: string) => COL_WIDTHS[col.toLowerCase()] ?? DEFAULT_WIDTH
                          const rawCols = Object.keys(conversionNotFoundData[0] || {}).filter(isVisibleCol)
                          // Intercambiar articulo <-> codigosecundario para que articulo
                          // quede antes (más útil visualmente: el nombre del insumo es
                          // más distintivo que el código secundario).
                          const visibleCols = [...rawCols]
                          const idxArt = visibleCols.findIndex((c) => c.toLowerCase() === "articulo")
                          const idxCs = visibleCols.findIndex((c) => c.toLowerCase() === "codigosecundario")
                          if (idxArt !== -1 && idxCs !== -1) {
                            const a = visibleCols[idxArt]
                            visibleCols[idxArt] = visibleCols[idxCs]
                            visibleCols[idxCs] = a
                          }
                          // Mover `hotel` entre codigosecundario y year (después del swap).
                          // Resultado deseado: codigo | articulo | codigosecundario | hotel | year | ...
                          {
                            const idxHotel = visibleCols.findIndex((c) => c.toLowerCase() === "hotel")
                            const idxCs2 = visibleCols.findIndex((c) => c.toLowerCase() === "codigosecundario")
                            if (idxHotel !== -1 && idxCs2 !== -1 && idxHotel !== idxCs2 + 1) {
                              const [hotelCol] = visibleCols.splice(idxHotel, 1)
                              const newIdxCs = visibleCols.findIndex((c) => c.toLowerCase() === "codigosecundario")
                              visibleCols.splice(newIdxCs + 1, 0, hotelCol)
                            }
                          }
                          // Mover `subfamilia` entre mes y cantidad.
                          // Resultado: ... | year | mes | subfamilia | cantidad | precio | ...
                          {
                            const idxSubfam = visibleCols.findIndex((c) => c.toLowerCase() === "subfamilia")
                            const idxMes = visibleCols.findIndex((c) => c.toLowerCase() === "mes")
                            if (idxSubfam !== -1 && idxMes !== -1 && idxSubfam !== idxMes + 1) {
                              const [subfamCol] = visibleCols.splice(idxSubfam, 1)
                              const newIdxMes = visibleCols.findIndex((c) => c.toLowerCase() === "mes")
                              visibleCols.splice(newIdxMes + 1, 0, subfamCol)
                            }
                          }
                          // Mover `codigosecundario` justo a la derecha de `unidadbase`.
                          // Resultado: ... | precio | unidadbase | codigosecundario | conversion | costounitario | porcentajemerma | ...
                          {
                            const idxCsFinal = visibleCols.findIndex((c) => c.toLowerCase() === "codigosecundario")
                            const idxUnidad = visibleCols.findIndex((c) => c.toLowerCase() === "unidadbase")
                            if (idxCsFinal !== -1 && idxUnidad !== -1 && idxCsFinal !== idxUnidad + 1) {
                              const [csCol] = visibleCols.splice(idxCsFinal, 1)
                              const newIdxUnidad = visibleCols.findIndex((c) => c.toLowerCase() === "unidadbase")
                              visibleCols.splice(newIdxUnidad + 1, 0, csCol)
                            }
                          }
                          // Columnas sticky en pestaña Nuevos: id, codigo, articulo
                          // (hotel ya no es sticky — queda en zona scrollable junto a year).
                          const STICKY_COLS = new Set(["id", "codigo", "articulo"])
                          const isStickyCol = (c: string) => STICKY_COLS.has(c.toLowerCase())
                          const leftOffsets: Record<string, number> = {}
                          {
                            let acc = 40 // ancho de la columna #
                            visibleCols.forEach((col) => {
                              leftOffsets[col] = acc
                              acc += widthOf(col)
                            })
                          }
                          // Última columna sticky en orden visual (para el borde separador).
                          let lastStickyCol = ""
                          for (let i = visibleCols.length - 1; i >= 0; i--) {
                            if (isStickyCol(visibleCols[i])) { lastStickyCol = visibleCols[i]; break }
                          }
                          // costounitario NO es editable: se calcula a partir de
                          // precio, conversion y porcentajemerma.
                          const EDITABLE_COLS = new Set(["codigosecundario", "conversion", "porcentajemerma"])
                          const isEditableCol = (c: string) => EDITABLE_COLS.has(c.toLowerCase())
                          // Texto vs número según la columna (codigosecundario es texto;
                          // conversion/porcentajemerma son numéricos).
                          const editableType = (c: string) =>
                            c.toLowerCase() === "codigosecundario" ? "text" : "number"
                          const isCalculatedCol = (c: string) => c.toLowerCase() === "costounitario"
                          // codigosecundario es la columna "ancla" que el usuario debe
                          // capturar manualmente — la diferenciamos visualmente del resto.
                          const isCodigoSecCol = (c: string) => c.toLowerCase() === "codigosecundario"
                          return (
                          <table className="border-collapse" style={{ tableLayout: "fixed", width: "max-content" }}>
                            <thead className="sticky top-0 z-20">
                              <tr>
                                <th className="px-2 py-1.5 text-left text-xs font-semibold whitespace-nowrap bg-amber-700 text-white sticky left-0 z-30" style={{ width: "40px" }}>#</th>
                                {visibleCols.map((col) => {
                                  const sticky = isStickyCol(col)
                                  const isLastSticky = col === lastStickyCol
                                  const isCs = isCodigoSecCol(col)
                                  return (
                                    <th
                                      key={col}
                                      className={`px-2 py-1.5 text-left text-xs font-semibold whitespace-nowrap text-white ${isCs ? "bg-sky-700" : "bg-amber-700"} ${sticky ? "sticky z-30" : ""}`}
                                      style={{
                                        width: `${widthOf(col)}px`,
                                        ...(sticky ? { left: `${leftOffsets[col]}px` } : {}),
                                        ...(isLastSticky ? { borderRight: "2px solid #78350f" } : {}),
                                        ...(isCs ? { borderLeft: "2px solid #0c4a6e", borderRight: "2px solid #0c4a6e" } : {}),
                                      }}
                                    >
                                      {col}
                                    </th>
                                  )
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredNotFound.map((row) => {
                                // Buscar el índice REAL en conversionNotFoundData (no el filtrado)
                                // para que las ediciones se apliquen al row correcto cuando hay
                                // búsqueda activa.
                                const realIdx = conversionNotFoundData.indexOf(row)
                                const isPendiente = !!row._pendiente
                                const baseRowBg = realIdx % 2 === 0 ? "bg-amber-50" : "bg-white"
                                const rowBg = isPendiente ? "bg-emerald-100" : baseRowBg
                                return (
                                <tr key={realIdx} className={`border-b border-slate-200 ${rowBg} ${isPendiente ? "hover:bg-emerald-200" : "hover:bg-amber-100/50"} transition-colors`}>
                                  <td className={`px-2 py-1 text-xs whitespace-nowrap font-semibold sticky left-0 z-10 ${rowBg} ${isPendiente ? "text-emerald-700" : "text-slate-500"}`} style={{ width: "40px" }}>{realIdx + 1}</td>
                                  {visibleCols.map((col) => {
                                    const sticky = isStickyCol(col)
                                    const isLastSticky = col === lastStickyCol
                                    const editable = isEditableCol(col)
                                    const calculated = isCalculatedCol(col)
                                    const isCs = isCodigoSecCol(col)
                                    const calcValue = calculated ? String(row[col] ?? "") : ""
                                    // Tinte de fondo para codigosecundario: si la fila ya está
                                    // pendiente (verde), no lo aplicamos para no romper el feedback.
                                    const csBg = isCs && !isPendiente ? "bg-sky-50" : ""
                                    return (
                                      <td
                                        key={col}
                                        className={`px-2 py-1 text-xs ${editable ? "" : "overflow-hidden text-ellipsis whitespace-nowrap"} ${calculated ? "text-emerald-700 font-semibold italic" : (editable ? "" : "text-slate-700")} ${csBg} ${sticky ? `sticky z-10 ${rowBg}` : ""}`}
                                        title={editable ? undefined : (calculated ? (calcValue ? `Calculado: precio / (conversion · (1 - merma))` : "Falta precio o conversion para calcular") : String(row[col] ?? ""))}
                                        style={{
                                          width: `${widthOf(col)}px`,
                                          ...(sticky ? { left: `${leftOffsets[col]}px` } : {}),
                                          ...(isLastSticky ? { borderRight: "2px solid #d97706" } : {}),
                                          ...(isCs ? { borderLeft: "2px solid #0ea5e9", borderRight: "2px solid #0ea5e9" } : {}),
                                        }}
                                      >
                                        {editable ? (
                                          <input
                                            type={editableType(col)}
                                            step={editableType(col) === "number" ? "any" : undefined}
                                            value={String(row[col] ?? "")}
                                            onChange={(e) => handleEditarCampoNotFound(realIdx, col, e.target.value)}
                                            className={`w-full bg-transparent border-b focus:outline-none text-xs font-semibold px-0 py-0 ${isCs ? "border-sky-400 focus:border-sky-700 text-sky-900" : "border-amber-300 focus:border-amber-600 text-amber-900"}`}
                                          />
                                        ) : calculated ? (
                                          calcValue || <span className="text-slate-400 not-italic font-normal">—</span>
                                        ) : (
                                          String(row[col] ?? "")
                                        )}
                                      </td>
                                    )
                                  })}
                                </tr>
                                )
                              })}
                            </tbody>
                          </table>
                          )
                        })()}
                      </div>
                    </div>
                    )
                    })() : (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-500">
                      <p className="text-sm">Todos los insumos cargados existen en el catálogo.</p>
                      <p className="text-xs">No hay insumos nuevos por revisar.</p>
                    </div>
                    )
                  )}
                </>
              )}

              {/* Pestaña Visualizar Cambios — sub-tabs Recetas / Subrecetas + cascade */}
              {activeTab === "visualizar" && visualizarEnabled && (
                (visualizarData.length > 0 || visualizarCascadingPlatillos.length > 0 || visualizarDirectPlatillos.length > 0) ? (() => {
                  type Ingrediente = { ingrediente: string; cantidad: number; actual: number; nuevo: number }
                  type SubrecetaCascade = {
                    subrecetaid: number; subreceta: string;
                    subActual: number; subNuevo: number;
                    actualEnPadre: number; nuevoEnPadre: number;
                  }
                  type TipoGrupo = "receta" | "subreceta" | "platillo"
                  type Grupo = {
                    id: number;
                    tipo: TipoGrupo;
                    nombre: string;
                    hotel: string;
                    costoTotal: number;
                    ingredientes: Ingrediente[];
                    subrecetasCascade: SubrecetaCascade[];
                    totalNuevo: number; delta: number; deltaPct: number;
                  }

                  // Key compuesta para evitar colisión recetaid vs platilloid
                  const key = (tipo: TipoGrupo, id: number) => `${tipo === "platillo" ? "p" : "r"}:${id}`
                  const grupos: Record<string, Grupo> = {}

                  // Step 1: cambios DIRECTOS por receta (visualizarData)
                  visualizarData.forEach((row: any) => {
                    const id = row.recetaid
                    const tipo: TipoGrupo = row.essubreceta ? "subreceta" : "receta"
                    const k = key(tipo, id)
                    if (!grupos[k]) {
                      grupos[k] = {
                        id,
                        tipo,
                        nombre: String(row.receta ?? ""),
                        hotel: String(row.hotel ?? ""),
                        costoTotal: parseFloat(String(row.costoreceta ?? "")) || 0,
                        ingredientes: [],
                        subrecetasCascade: [],
                        totalNuevo: 0, delta: 0, deltaPct: 0,
                      }
                    }
                    grupos[k].ingredientes.push({
                      ingrediente: String(row.ingrediente ?? ""),
                      cantidad: parseFloat(String(row.cantidad ?? "")) || 0,
                      actual: parseFloat(String(row.ingredientecostoparcial ?? "")) || 0,
                      nuevo: parseFloat(String(row["costoparcial(nuevo)"] ?? "")) || 0,
                    })
                  })

                  // Step 1b: cambios DIRECTOS por platillo (visualizarDirectPlatillos)
                  // Ingredientes que están directamente en un platillo (no via subreceta).
                  visualizarDirectPlatillos.forEach((row: any) => {
                    const id = row.platilloid
                    const k = key("platillo", id)
                    if (!grupos[k]) {
                      grupos[k] = {
                        id,
                        tipo: "platillo",
                        nombre: String(row.platillo ?? ""),
                        hotel: String(row.hotel ?? ""),
                        costoTotal: parseFloat(String(row.costototal ?? "")) || 0,
                        ingredientes: [],
                        subrecetasCascade: [],
                        totalNuevo: 0, delta: 0, deltaPct: 0,
                      }
                    }
                    grupos[k].ingredientes.push({
                      ingrediente: String(row.ingrediente ?? ""),
                      cantidad: parseFloat(String(row.cantidad ?? "")) || 0,
                      actual: parseFloat(String(row.ingredientecostoparcial ?? "")) || 0,
                      nuevo: parseFloat(String(row["costoparcial(nuevo)"] ?? "")) || 0,
                    })
                  })

                  // Step 2: nuevo costo total de cada subreceta (para usarlo en cascade)
                  const subTotals: Record<number, { actual: number; nuevo: number }> = {}
                  Object.values(grupos).forEach(g => {
                    if (g.tipo === "subreceta") {
                      const sumActual = g.ingredientes.reduce((s, i) => s + i.actual, 0)
                      const sumNuevo = g.ingredientes.reduce((s, i) => s + i.nuevo, 0)
                      subTotals[g.id] = {
                        actual: g.costoTotal,
                        nuevo: g.costoTotal - sumActual + sumNuevo,
                      }
                    }
                  })

                  // Step 3a: cascade hacia recetas padre (vía ingredientesxreceta segmentoid=2)
                  visualizarCascading.forEach((c: any) => {
                    const sub = subTotals[c.subrecetaid]
                    if (!sub) return
                    const tipo: TipoGrupo = c.padreEsSubreceta ? "subreceta" : "receta"
                    const k = key(tipo, c.recetaid)
                    if (!grupos[k]) {
                      grupos[k] = {
                        id: c.recetaid,
                        tipo,
                        nombre: String(c.receta ?? ""),
                        hotel: String(c.hotel ?? ""),
                        costoTotal: parseFloat(String(c.costoreceta ?? "")) || 0,
                        ingredientes: [],
                        subrecetasCascade: [],
                        totalNuevo: 0, delta: 0, deltaPct: 0,
                      }
                    }
                    const subBase = parseFloat(String(c.subrecetaBaseCantidad ?? "")) || 0
                    const cantPadre = parseFloat(String(c.cantidadEnPadre ?? "")) || 0
                    const actualEnPadre = parseFloat(String(c.costoparcialActualEnPadre ?? "")) || 0
                    const ratio = subBase > 0 ? cantPadre / subBase : 0
                    const nuevoEnPadre = ratio * sub.nuevo
                    grupos[k].subrecetasCascade.push({
                      subrecetaid: c.subrecetaid,
                      subreceta: String(c.subreceta ?? ""),
                      subActual: sub.actual,
                      subNuevo: sub.nuevo,
                      actualEnPadre,
                      nuevoEnPadre,
                    })
                  })

                  // Step 3b: cascade hacia PLATILLOS (vía recetasxplatillo)
                  visualizarCascadingPlatillos.forEach((c: any) => {
                    const sub = subTotals[c.subrecetaid]
                    if (!sub) return
                    const k = key("platillo", c.platilloid)
                    if (!grupos[k]) {
                      grupos[k] = {
                        id: c.platilloid,
                        tipo: "platillo",
                        nombre: String(c.platillo ?? ""),
                        hotel: String(c.hotel ?? ""),
                        costoTotal: parseFloat(String(c.costototal ?? "")) || 0,
                        ingredientes: [],
                        subrecetasCascade: [],
                        totalNuevo: 0, delta: 0, deltaPct: 0,
                      }
                    }
                    const subBase = parseFloat(String(c.subrecetaBaseCantidad ?? "")) || 0
                    const cantPlat = parseFloat(String(c.cantidadEnPlatillo ?? "")) || 0
                    const actualEnPlat = parseFloat(String(c.costoparcialActualEnPlatillo ?? "")) || 0
                    const ratio = subBase > 0 ? cantPlat / subBase : 0
                    const nuevoEnPlat = ratio * sub.nuevo
                    grupos[k].subrecetasCascade.push({
                      subrecetaid: c.subrecetaid,
                      subreceta: String(c.subreceta ?? ""),
                      subActual: sub.actual,
                      subNuevo: sub.nuevo,
                      actualEnPadre: actualEnPlat,
                      nuevoEnPadre: nuevoEnPlat,
                    })
                  })

                  // Step 4: totales por grupo
                  const lista: Grupo[] = Object.values(grupos).map(g => {
                    const sumIngA = g.ingredientes.reduce((s, i) => s + i.actual, 0)
                    const sumIngN = g.ingredientes.reduce((s, i) => s + i.nuevo, 0)
                    const sumSubA = g.subrecetasCascade.reduce((s, c) => s + c.actualEnPadre, 0)
                    const sumSubN = g.subrecetasCascade.reduce((s, c) => s + c.nuevoEnPadre, 0)
                    const totalNuevo = g.costoTotal - sumIngA - sumSubA + sumIngN + sumSubN
                    const delta = totalNuevo - g.costoTotal
                    const deltaPct = g.costoTotal > 0 ? (delta / g.costoTotal) * 100 : 0
                    return { ...g, totalNuevo, delta, deltaPct }
                  })
                  // Tab Recetas = todo lo top-level (recetas + platillos, conceptualmente lo mismo).
                  // Tab Subrecetas = componentes usados dentro de recetas/platillos.
                  const recetas = lista.filter(g => g.tipo !== "subreceta")
                  const subrecetas = lista.filter(g => g.tipo === "subreceta")

                  const renderCard = (g: Grupo) => {
                    const tieneIng = g.ingredientes.length > 0
                    const tieneCascade = g.subrecetasCascade.length > 0
                    // receta y platillo son lo mismo conceptualmente → mismo color y label
                    const headerStyle = g.tipo === "subreceta"
                      ? "bg-gradient-to-r from-purple-700 to-purple-900"
                      : "bg-gradient-to-r from-blue-700 to-blue-900"
                    const tipoLabel = g.tipo === "subreceta" ? "SUBRECETA" : "RECETA"
                    return (
                    <div key={`${g.tipo}-${g.id}`} className="border border-slate-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                      <div className={`px-3 py-2 ${headerStyle}`}>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-white font-semibold text-sm leading-tight truncate flex-1" title={g.nombre}>{g.nombre || "(sin nombre)"}</h4>
                          <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                            {tipoLabel}
                          </span>
                        </div>
                        <p className="text-white/70 text-xs mt-0.5 flex items-center gap-2">
                          <span>ID: {g.id}</span>
                          {g.hotel && <><span className="opacity-50">·</span><span className="truncate">{g.hotel}</span></>}
                          {tieneCascade && (
                            <span className="ml-auto bg-amber-400/90 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                              cascade
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="p-3 space-y-3 flex-1">
                        {tieneIng && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                              {g.ingredientes.length} ingrediente{g.ingredientes.length !== 1 ? "s" : ""} con cambio directo
                            </p>
                            {g.ingredientes.map((ing, idx) => {
                              const sube = ing.nuevo > ing.actual
                              // Costo unitario nuevo derivado: nuevo / cantidad.
                              // Permite mostrar el desglose "unitario × cantidad = parcial"
                              // para que el usuario vea cómo se llegó al nuevo costo.
                              const unitarioNuevo = ing.cantidad > 0 ? ing.nuevo / ing.cantidad : 0
                              return (
                                <div key={idx} className="border-l-2 border-slate-300 pl-2 py-0.5">
                                  <p className="text-xs font-medium text-slate-800 truncate" title={ing.ingrediente}>{ing.ingrediente}</p>
                                  <div className="flex items-center gap-1.5 text-[11px] mt-0.5 font-mono">
                                    <span className="text-slate-500">{ing.actual.toFixed(4)}</span>
                                    <span className="text-slate-400">→</span>
                                    <span className={`font-semibold ${sube ? "text-red-600" : ing.nuevo < ing.actual ? "text-green-600" : "text-slate-700"}`}>
                                      {ing.nuevo.toFixed(4)}
                                    </span>
                                  </div>
                                  {ing.cantidad > 0 && (
                                    <div className="inline-block text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 mt-1 font-mono leading-tight font-semibold" title={`${unitarioNuevo} × ${ing.cantidad} = ${ing.nuevo}`}>
                                      {unitarioNuevo.toFixed(4)} × {ing.cantidad} = {ing.nuevo.toFixed(4)}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {tieneCascade && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {g.subrecetasCascade.length} subreceta{g.subrecetasCascade.length !== 1 ? "s" : ""} afectada{g.subrecetasCascade.length !== 1 ? "s" : ""}
                            </p>
                            {g.subrecetasCascade.map((c, idx) => {
                              const subeSub = c.subNuevo > c.subActual
                              const subeAporte = c.nuevoEnPadre > c.actualEnPadre
                              // Cantidad usada en el padre: aporte / costo_unitario.
                              // Se deriva del par (subNuevo, nuevoEnPadre) cuando es posible
                              // y si no, del par actual. Permite mostrar "subNuevo × cantidad = aporte".
                              const cantidadEnPadre =
                                c.subNuevo > 0 ? c.nuevoEnPadre / c.subNuevo
                                : c.subActual > 0 ? c.actualEnPadre / c.subActual
                                : 0
                              return (
                                <div key={idx} className="border-l-2 border-amber-400 pl-2 py-0.5 bg-amber-50/50 rounded-r">
                                  <p className="text-xs font-medium text-slate-800 truncate" title={c.subreceta}>↳ {c.subreceta}</p>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    costo subreceta:{" "}
                                    <span className="font-mono">{c.subActual.toFixed(4)}</span>
                                    <span className="text-slate-400 mx-1">→</span>
                                    <span className={`font-mono font-semibold ${subeSub ? "text-red-600" : c.subNuevo < c.subActual ? "text-green-600" : "text-slate-700"}`}>{c.subNuevo.toFixed(4)}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    aporte aquí:{" "}
                                    <span className="font-mono">{c.actualEnPadre.toFixed(4)}</span>
                                    <span className="text-slate-400 mx-1">→</span>
                                    <span className={`font-mono font-semibold ${subeAporte ? "text-red-600" : c.nuevoEnPadre < c.actualEnPadre ? "text-green-600" : "text-slate-700"}`}>{c.nuevoEnPadre.toFixed(4)}</span>
                                  </div>
                                  {cantidadEnPadre > 0 && (
                                    <div className="inline-block text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 mt-1 font-mono leading-tight font-semibold" title={`${c.subNuevo} × ${cantidadEnPadre} = ${c.nuevoEnPadre}`}>
                                      {c.subNuevo.toFixed(4)} × {cantidadEnPadre.toFixed(4)} = {c.nuevoEnPadre.toFixed(4)}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <div className="bg-slate-50 border-t border-slate-200 px-3 py-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium uppercase tracking-wide text-[10px]">Costo total</span>
                            {Math.abs(g.delta) > 0.0001 ? (
                              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                Con cambios
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-300">
                                Sin cambios
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-slate-600">{g.costoTotal.toFixed(4)}</span>
                            <span className="text-slate-400">→</span>
                            <span className={`font-bold ${g.delta > 0.0001 ? "text-red-600" : g.delta < -0.0001 ? "text-green-600" : "text-slate-700"}`}>
                              {g.totalNuevo.toFixed(4)}
                            </span>
                          </div>
                        </div>
                        {Math.abs(g.delta) > 0.0001 && (
                          <div className={`text-[10px] text-right mt-0.5 font-semibold ${g.delta > 0 ? "text-red-600" : "text-green-600"}`}>
                            {g.delta > 0 ? "+" : ""}{g.delta.toFixed(2)} ({g.deltaPct > 0 ? "+" : ""}{g.deltaPct.toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  const itemsActivos = visualizarSubTab === "recetas" ? recetas : subrecetas
                  const queryNorm = busquedaReceta.trim().toLowerCase()
                  const itemsFiltrados = queryNorm
                    ? itemsActivos.filter(g => g.nombre.toLowerCase().includes(queryNorm))
                    : itemsActivos

                  // Aplicar ordenamiento por variación de costo
                  const itemsOrdenados = [...itemsFiltrados].sort((a, b) => {
                    switch (ordenVariacion) {
                      case "mayor_inc": return b.delta - a.delta            // más positivo primero (subió más)
                      case "mayor_red": return a.delta - b.delta            // más negativo primero (bajó más)
                      case "mayor_abs": return Math.abs(b.delta) - Math.abs(a.delta)  // mayor magnitud, sin importar signo
                      case "menor_abs": return Math.abs(a.delta) - Math.abs(b.delta)  // menor magnitud
                      default: return a.nombre.localeCompare(b.nombre)
                    }
                  })

                  return (
                    <div className="space-y-4">
                      {/* Sub-tabs + buscador */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setVisualizarSubTab("recetas")}
                            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                              visualizarSubTab === "recetas"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                            Recetas afectadas
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              visualizarSubTab === "recetas" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {recetas.length}
                            </span>
                          </button>
                          <button
                            onClick={() => setVisualizarSubTab("subrecetas")}
                            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                              visualizarSubTab === "subrecetas"
                                ? "border-purple-600 text-purple-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            <span className="inline-block w-2 h-2 rounded-full bg-purple-600" />
                            Subrecetas afectadas
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              visualizarSubTab === "subrecetas" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {subrecetas.length}
                            </span>
                          </button>
                        </div>
                        <div className="relative pb-2 sm:pb-0">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            value={busquedaReceta}
                            onChange={(e) => setBusquedaReceta(e.target.value)}
                            placeholder="Buscar por nombre…"
                            className="pl-8 pr-8 py-1.5 text-sm border border-slate-300 rounded-md bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                          />
                          {busquedaReceta && (
                            <button
                              onClick={() => setBusquedaReceta("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                              aria-label="Limpiar búsqueda"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <select
                          value={ordenVariacion}
                          onChange={(e) => setOrdenVariacion(e.target.value)}
                          title="Ordenar por variación de costo"
                          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pb-2 sm:pb-0"
                        >
                          <option value="nombre">Nombre (A-Z)</option>
                          <option value="mayor_inc">▲ Mayor incremento</option>
                          <option value="mayor_red">▼ Mayor reducción</option>
                          <option value="mayor_abs">↕ Mayor variación absoluta</option>
                          <option value="menor_abs">≈ Menor variación absoluta</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={() => descargarReporteVisualizar(itemsOrdenados, visualizarSubTab)}
                          disabled={itemsOrdenados.length === 0}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white pb-2 sm:pb-0 h-auto py-1.5"
                          title="Descargar reporte XLSX de los registros mostrados"
                        >
                          <Download className="h-4 w-4 mr-1.5" />
                          Descargar Reporte
                        </Button>
                      </div>

                      {/* Indicador de filtro activo */}
                      {queryNorm && (
                        <div className="text-xs text-slate-500">
                          Mostrando <span className="font-semibold text-slate-700">{itemsFiltrados.length}</span> de{" "}
                          <span className="font-semibold text-slate-700">{itemsActivos.length}</span>{" "}
                          {visualizarSubTab === "recetas" ? "receta(s)" : "subreceta(s)"} que coinciden con "{busquedaReceta}"
                        </div>
                      )}

                      {/* Contenido del sub-tab */}
                      {itemsOrdenados.length > 0 ? (
                        <>
                        <div className="h-[80vh] overflow-y-auto rounded-lg border border-slate-200 p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {itemsOrdenados.map(renderCard)}
                          </div>
                        </div>
                        <div className="flex justify-end pt-3 border-t border-slate-200">
                          <Button
                            onClick={handleClickActualizarNuevosCostos}
                            disabled={loadingHistorico || conversionData.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <FileUp className="h-4 w-4 mr-2" />
                            {loadingHistorico ? "Actualizando..." : "Actualizar nuevos costos"}
                          </Button>
                        </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-1">
                          {queryNorm ? (
                            <>
                              <p>Ningún resultado para "<span className="font-semibold">{busquedaReceta}</span>".</p>
                              <button
                                onClick={() => setBusquedaReceta("")}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Limpiar búsqueda
                              </button>
                            </>
                          ) : (
                            <p>No hay {visualizarSubTab === "recetas" ? "recetas" : "subrecetas"} con cambios para mostrar.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })() : (
                  sinCambiosDetectados ? (
                    <div className="flex flex-col items-center justify-center h-60 gap-3 px-6 text-center">
                      <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-emerald-600">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <p className="text-base font-semibold text-slate-800">
                        De momento no existe ningún cambio
                      </p>
                      <p className="text-sm text-slate-500 max-w-md">
                        Los costos se encuentran actualizados. No hay registros con diferencia respecto a su costo actual.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-slate-500">
                      No se encontraron recetas afectadas por los cambios de costo.
                    </div>
                  )
                )
              )}
            </CardContent>
          </Card>
        )}

        {/* Overlay de carga — Cargar Archivo (con encadenado a Generar Conversión) */}
        {etapaCarga !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 animate-pulse" />
              <div className="p-7 flex flex-col items-center text-center space-y-5">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-[5px] border-slate-100" />
                  <div className="absolute inset-0 rounded-full border-[5px] border-blue-600 border-t-transparent border-r-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Upload className="h-7 w-7 text-blue-600" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {cargaTipo === "hotel" ? "Buscando por hotel" : "Cargando archivo"}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {cargaTipo === "hotel"
                      ? "Obteniendo registros guardados y generando la conversión."
                      : "Procesando el archivo, guardando en base de datos y generando la conversión."}
                  </p>
                </div>

                {/* Pasos con estado activo / completado / pendiente */}
                <div className="w-full space-y-1 text-left bg-slate-50 rounded-lg p-3 border border-slate-100">
                  {(() => {
                    const ordenArchivo = ["validando", "guardando", "buscando", "calculando"] as const
                    const ordenHotel = ["obteniendo", "buscando", "calculando"] as const
                    const orden = (cargaTipo === "hotel" ? ordenHotel : ordenArchivo) as readonly string[]
                    const labels: Record<string, string> = {
                      validando: "Validando estructura del Excel",
                      guardando: "Guardando información",
                      obteniendo: "Obteniendo registros del hotel",
                      buscando: "Buscando ingredientes en BD",
                      calculando: "Generando conversión y costos",
                    }
                    const idxActual = orden.indexOf(etapaCarga as any)
                    return orden.map((step, i) => {
                      const completado = i < idxActual
                      const activo = i === idxActual
                      return (
                        <div key={step} className="flex items-center gap-2.5 text-xs py-0.5">
                          {completado ? (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                          ) : activo ? (
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border-2 border-slate-300" />
                          )}
                          <span className={`font-medium ${
                            completado ? "text-slate-400 line-through"
                            : activo ? "text-blue-700"
                            : "text-slate-500"
                          }`}>
                            {labels[step]}
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>

                <p className="text-[11px] text-slate-400 italic">No cierres ni recargues la página</p>
              </div>
            </div>
          </div>
        )}

        {/* Overlay de carga — Actualizar insumos */}
        {loadingVisualizar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
              {/* Banda superior con gradiente */}
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 animate-pulse" />

              <div className="p-7 flex flex-col items-center text-center space-y-5">
                {/* Spinner doble: anillo estático + arco animado */}
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-[5px] border-slate-100" />
                  <div className="absolute inset-0 rounded-full border-[5px] border-blue-600 border-t-transparent border-r-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 text-blue-600 animate-spin" style={{ animationDuration: "2s" }} />
                  </div>
                </div>

                {/* Texto principal */}
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold text-slate-900">Procesando cambios</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Buscando recetas y platillos afectados por los cambios de costo. Esto puede tomar unos segundos según el volumen.
                  </p>
                </div>

                {/* Pasos con dots de colores pulsantes */}
                <div className="w-full space-y-2 text-left bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "0ms", animationDuration: "1.5s" }} />
                    <span className="text-slate-700 font-medium">Identificando subrecetas con cambio</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: "300ms", animationDuration: "1.5s" }} />
                    <span className="text-slate-700 font-medium">Buscando platillos en cascada</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: "600ms", animationDuration: "1.5s" }} />
                    <span className="text-slate-700 font-medium">Calculando totales nuevos</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">No cierres ni recargues la página</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        <AlertDialog
          open={!!confirmacionEliminar}
          onOpenChange={(open) => { if (!open && !eliminandoRegistro) setConfirmacionEliminar(null) }}
        >
          <AlertDialogContent className="border-2 border-red-200">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <AlertDialogTitle className="text-red-900 text-lg">
                  ¿Eliminar registro?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-slate-700">
                    Estás por eliminar permanentemente el siguiente registro:
                  </p>
                  <div className="rounded-md bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-900 font-mono break-words">
                      {confirmacionEliminar?.descripcion || "—"}
                    </p>
                    {confirmacionEliminar?.tipo === "conversion" && (
                      <p className="text-xs text-red-700 mt-1.5">
                        Se borrarán <span className="font-bold">todas</span> las filas con
                        ese código y hotel en la tabla.
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 italic">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={eliminandoRegistro}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); confirmarEliminarRegistro() }}
                disabled={eliminandoRegistro}
                className="bg-red-600 hover:bg-red-700"
              >
                {eliminandoRegistro ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Eliminando…
                  </span>
                ) : (
                  "Sí, eliminar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Validación de Columnas */}
        <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
          <AlertDialogContent className="border-2 border-red-200">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <AlertDialogTitle className="text-red-900 text-lg">
                  Formato de archivo incorrecto
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-slate-700">
                    El archivo que estás intentando cargar no presenta el formato esperado.
                    Faltan las siguientes columnas obligatorias:
                  </p>
                  <div className="rounded-md bg-red-50 border border-red-200 p-3">
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {missingColumns.map((col) => (
                        <li
                          key={col}
                          className="text-sm text-red-800 font-mono flex items-center gap-2"
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                          {col}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-slate-500">
                    Verifica los encabezados del archivo o descarga la plantilla oficial e
                    inténtalo nuevamente.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => setShowValidationDialog(false)}
                className="bg-red-600 hover:bg-red-700"
              >
                Entendido
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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

        {/* Confirmación: Actualizar nuevos costos en historicoingredientes */}
        <AlertDialog open={showHistoricoConfirm} onOpenChange={(open) => { if (!loadingHistorico) setShowHistoricoConfirm(open) }}>
          <AlertDialogContent className="border-2 border-amber-200">
            <AlertDialogHeader>
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 -m-6 mb-3 px-6 py-4 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40">
                    <FileUp className="h-5 w-5 text-white" />
                  </div>
                  <AlertDialogTitle className="text-white text-lg">
                    Actualizar nuevos costos
                  </AlertDialogTitle>
                </div>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-slate-700">
                    ¿Deseas realizar la carga de actualización de insumos?
                  </p>
                  <p className="text-sm text-slate-600">
                    Esta acción afectará a las recetas y subrecetas asociadas que se muestran en el listado.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loadingHistorico}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleActualizarNuevosCostos() }}
                disabled={loadingHistorico || hotelesAfectadosActuales().length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Actualizar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Overlay de carga: Actualizar histórico */}
        {loadingHistorico && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 animate-pulse" />
              <div className="p-7 flex flex-col items-center text-center space-y-5">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-[5px] border-slate-100" />
                  <div className="absolute inset-0 rounded-full border-[5px] border-emerald-600 border-t-transparent border-r-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileUp className="h-7 w-7 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold text-slate-900">Actualizando histórico</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Tomando snapshot de ingredientes y reemplazando periodos previos.
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 italic">No cierres ni recargues la página</p>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={pendientesPreflightOpen} onOpenChange={setPendientesPreflightOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-amber-600">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
                Insumos pendientes de registrar
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-slate-700">
                    Tienes{" "}
                    <span className="font-bold text-amber-900">
                      {conversionNotFoundData.filter((r) => r._pendiente).length}
                    </span>{" "}
                    insumo(s) marcados como pendientes en la sub-pestaña{" "}
                    <span className="font-semibold">"Nuevos / No encontrados"</span> que aún no han sido registrados en el catálogo.
                  </p>
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                    <p className="font-semibold mb-1">¿Qué hacer con ellos?</p>
                    <ul className="space-y-1.5 ml-2">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-emerald-700">Registrar y continuar:</span>
                        <span>Inserta los pendientes en <code className="bg-amber-100 px-1 rounded">ingredientes</code> y luego procede con {pendientesPreflightTarget === "costos" ? "la actualización de costos" : "la visualización de cambios"}.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-rose-700">Descartar y continuar:</span>
                        <span>Quita la marca de pendiente (los insumos se quedan en sub-pestaña "Nuevos" sin insertarse) y procede con {pendientesPreflightTarget === "costos" ? "la actualización" : "la visualización"}.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-slate-600">Cancelar:</span>
                        <span>Vuelve a la pestaña actual sin {pendientesPreflightTarget === "costos" ? "actualizar" : "visualizar"} nada.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setPendientesPreflightOpen(false)}
                className="sm:mr-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDescartarPendientesYContinuar}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Descartar y continuar
              </Button>
              <Button
                onClick={handleRegistrarYContinuarConCostos}
                disabled={registrandoInsumos}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {registrandoInsumos ? "Registrando…" : "Registrar y continuar"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showHistoricoResult} onOpenChange={setShowHistoricoResult}>
          <AlertDialogContent className={`border-2 ${historicoResult?.success ? "border-emerald-200" : "border-red-200"}`}>
            <AlertDialogHeader>
              <div className={`-m-6 mb-3 px-6 py-4 rounded-t-lg ${
                historicoResult?.success
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-red-500 to-rose-600"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40">
                    {historicoResult?.success ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <AlertDialogTitle className="text-white text-lg">
                    {historicoResult?.success ? "Actualización completada" : "Error al actualizar"}
                  </AlertDialogTitle>
                </div>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-3 pt-2">
                  {historicoResult?.success ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold">Hoteles</p>
                          <p className="text-2xl font-bold text-emerald-900 mt-0.5">{historicoResult.hotelesProcesados}</p>
                        </div>
                        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wide text-blue-700 font-semibold">Respaldados</p>
                          <p className="text-2xl font-bold text-blue-900 mt-0.5">{historicoResult.totalInsertados}</p>
                        </div>
                        <div className="rounded-md bg-orange-50 border border-orange-200 p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wide text-orange-700 font-semibold">Sustituidos</p>
                          <p className="text-2xl font-bold text-orange-900 mt-0.5">{historicoResult.totalEliminados}</p>
                        </div>
                        <div className="rounded-md bg-teal-50 border border-teal-200 p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wide text-teal-700 font-semibold">Actualizados</p>
                          <p className="text-2xl font-bold text-teal-900 mt-0.5">{ingredientesResult?.totalActualizados ?? 0}</p>
                        </div>
                      </div>
                      {ingredientesResult && ingredientesResult.totalErrores > 0 && (
                        <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                          <p className="text-xs font-semibold text-amber-900 mb-0.5">
                            {ingredientesResult.totalErrores} actualización(es) fallaron
                          </p>
                          {ingredientesResult.error && (
                            <p className="text-[11px] text-amber-700 break-words">
                              {ingredientesResult.error}
                            </p>
                          )}
                        </div>
                      )}
                      {respaldoResult && respaldoResult.success && (
                        <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-indigo-700 font-semibold mb-1">
                            Respaldo de recetas y subrecetas
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-indigo-900">
                            <div className="flex justify-between">
                              <span className="text-indigo-600">Recetas:</span>
                              <span className="font-bold">{respaldoResult.totalPlatillos}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-indigo-600">Subrecetas:</span>
                              <span className="font-bold">{respaldoResult.totalRecetas}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-indigo-600">Filas insertadas:</span>
                              <span className="font-bold">{respaldoResult.totalRowsInsertados}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-indigo-600">Filas sustituidas:</span>
                              <span className="font-bold">{respaldoResult.totalRowsEliminados}</span>
                            </div>
                          </div>
                          {respaldoResult.saltados > 0 && (
                            <p className="text-[11px] text-indigo-600 mt-1 italic">
                              {respaldoResult.saltados} sin componentes o sin fecha (saltados).
                            </p>
                          )}
                        </div>
                      )}
                      {respaldoResult && !respaldoResult.success && (
                        <div className="rounded-md bg-red-50 border border-red-200 p-3">
                          <p className="text-xs font-semibold text-red-900 mb-0.5">
                            Falló el respaldo de recetas
                          </p>
                          {respaldoResult.error && (
                            <p className="text-[11px] text-red-700 break-words">
                              {respaldoResult.error}
                            </p>
                          )}
                        </div>
                      )}
                      {recalcularResult && recalcularResult.success && (
                        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold mb-2">
                            Pasos 4 y 5 — Recálculo en cascada + costo administrativo
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-emerald-800">Ingredientes en subrecetas:</span>
                              <span className="font-bold">{recalcularResult.ingredientesXRecetaUpdated}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-800">Ingredientes en platillos:</span>
                              <span className="font-bold">{recalcularResult.ingredientesXPlatilloUpdated}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-800">Subrecetas (costo):</span>
                              <span className="font-bold">{recalcularResult.recetasUpdated}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-800">Subrecetas en platillos:</span>
                              <span className="font-bold">{recalcularResult.recetasXPlatilloUpdated}</span>
                            </div>
                            <div className="flex justify-between col-span-2">
                              <span className="text-emerald-800">Platillos (costototal + costoadministrativo ×1.05):</span>
                              <span className="font-bold">{recalcularResult.platillosUpdated}</span>
                            </div>
                          </div>
                          {recalcularResult.saltados > 0 && (
                            <p className="text-[11px] text-amber-700 mt-2">
                              {recalcularResult.saltados} ingrediente(s) saltados (costo nuevo no numérico).
                            </p>
                          )}
                        </div>
                      )}
                      {recalcularResult && !recalcularResult.success && (
                        <div className="rounded-md bg-red-50 border border-red-200 p-3">
                          <p className="text-xs font-semibold text-red-900 mb-0.5">
                            Falló el recálculo de costos en cascada
                          </p>
                          {recalcularResult.error && (
                            <p className="text-[11px] text-red-700 break-words">
                              {recalcularResult.error}
                            </p>
                          )}
                        </div>
                      )}
                      {historicoResult.periodos.length > 0 && (
                        <div className="rounded-md bg-slate-50 border border-slate-200 p-3 max-h-40 overflow-y-auto">
                          <p className="text-[10px] uppercase tracking-wide text-slate-600 font-semibold mb-1.5">
                            Periodos cargados
                          </p>
                          <ul className="text-xs text-slate-700 space-y-0.5 font-mono">
                            {historicoResult.periodos.map((p, i) => {
                              const h = hotelesList.find((x) => x.id === p.hotelid)
                              return (
                                <li key={i} className="flex justify-between gap-2">
                                  <span>{h ? h.acronimo : `Hotel ${p.hotelid}`} · {p.year}-{String(p.mes).padStart(2, "0")}</span>
                                  <span className="text-slate-500">{p.count} reg.</span>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-900 break-words">
                        {historicoResult?.error || "Ocurrió un error inesperado."}
                      </p>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  setShowHistoricoResult(false)
                  // Volver al estado inicial de la página (catálogo limpio,
                  // sin pestaña 2/3 cargadas, file input vacío). Recarga dura
                  // garantiza un reset completo sin tener que enumerar
                  // manualmente cada state.
                  window.location.reload()
                }}
                className={historicoResult?.success ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
              >
                Aceptar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
