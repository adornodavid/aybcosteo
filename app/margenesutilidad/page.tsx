"use client"

/* ==================================================
  Imports
================================================== */
import { useState, useEffect, useMemo } from "react"
import {
  getMenusForDropdown,
  getPlatillosForDropdown,
  getPlatilloCostHistory,
  getPlatillosWithMargins,
  getPlatilloComparisonData, // Importar la nueva acción
  obtenerReporteRecetas, // Nueva función para el reporte
  obtenerIngredientesAumentoPrecio, // Nueva función agregada
  obtenerCambiosCostosPlatillos, // Declaración de la variable
  type PlatilloMargin,
  type PlatilloComparisonData, // Importar la nueva interfaz
} from "@/app/actions/margenes-actions"
import {
  obtenerCambiosCostosRecetas,
  obtenerIngredientesDisminucionPrecio,
  obtenerHotelesPorRol,
  obtenerDetallesPlatilloTooltip,
  obtenerDetallesRecetaTooltip,
} from "@/app/actions/dashboard-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { HelpCircle, FileText, Download, ChevronUp, ChevronDown } from "lucide-react"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getTopMarginPlatillos,
  getBottomMarginPlatillos,
  getPlatilloDetailsForTooltip,
  type MarginPlatilloSummary,
  type PlatilloDetail,
} from "@/app/actions/margenes-actions"

interface MenuOption {
  id: number
  nombre: string
}

interface PlatilloOption {
  id: number
  nombre: string
}

interface CostHistoryItem {
  fechacreacion: string
  costo: number
}

interface CambioCosto {
  id?: number
  nombre: string
  costo_inicial: number
  costo_actual: number
  variacion_porcentaje: number
}

interface CambioIngrediente {
  codigo: string
  nombre: string
  costo_inicial: number
  costo_actual: number
  aumento_porcentaje?: number
  disminucion_porcentaje?: number
}

interface OpcionSelect {
  id: number
  nombre: string
}

interface DetallesPlatilloTooltip {
  id: number
  imgurl?: string
  nombre: string
  costototal: number
  costoadministrativo: number
}

interface DetallesRecetaTooltip {
  id: number
  imgurl?: string
  hotel: string
  nombre: string
  costo: number
  cantidad: number
  unidadbase: string
}

const mesesDelAño = [
  { id: 1, nombre: "Enero" },
  { id: 2, nombre: "Febrero" },
  { id: 3, nombre: "Marzo" },
  { id: 4, nombre: "Abril" },
  { id: 5, nombre: "Mayo" },
  { id: 6, nombre: "Junio" },
  { id: 7, nombre: "Julio" },
  { id: 8, nombre: "Agosto" },
  { id: 9, nombre: "Septiembre" },
]

const añosDisponibles = [{ id: 2025, nombre: "2025" }]

const ITEMS_PER_PAGE = 20

export default function MargenesUtilidadPage() {
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([])
  const [selectedMenuId, setSelectedMenuId] = useState<string>("-1")
  const [platilloSearchTerm, setPlatilloSearchTerm] = useState<string>("")
  const [platilloOptions, setPlatilloOptions] = useState<PlatilloOption[]>([])
  const [selectedPlatilloId, setSelectedPlatilloId] = useState<number | null>(null)
  const [selectedPlatilloName, setSelectedPlatilloName] = useState<string>("")
  const [fechaInicial, setFechaInicial] = useState<Date | undefined>(undefined)
  const [fechaFinal, setFechaFinal] = useState<Date | undefined>(undefined)
  const [costHistoryData, setCostHistoryData] = useState<CostHistoryItem[]>([])
  const [platillosWithMargins, setPlatillosWithMargins] = useState<PlatilloMargin[]>([])
  // Nuevo estado para los datos del gráfico de barras
  const [platilloComparisonData, setPlatilloComparisonData] = useState<PlatilloComparisonData | null>(null)

  const [isLoadingMenus, setIsLoadingMenus] = useState(true)
  const [isLoadingPlatillosDropdown, setIsLoadingPlatillosDropdown] = useState(false)
  const [isLoadingChartData, setIsLoadingChartData] = useState(false)
  const [isLoadingMargins, setIsLoadingMargins] = useState(false)
  // Nuevo estado de carga para el gráfico de barras
  const [isLoadingComparisonChart, setIsLoadingComparisonChart] = useState(false)
  const [isPlatilloPopoverOpen, setIsPlatilloPopoverOpen] = useState(false)

  const [topMargins, setTopMargins] = useState<MarginPlatilloSummary[]>([])
  const [bottomMargins, setBottomMargins] = useState<MarginPlatilloSummary[]>([])
  const [isLoadingTopMargins, setIsLoadingTopMargins] = useState(true)
  const [isLoadingBottomMargins, setIsLoadingBottomMargins] = useState(true)
  const [tooltipContent, setTooltipContent] = useState<PlatilloDetail | null>(null)
  const [isTooltipLoading, setIsTooltipLoading] = useState(false)
  const [activeTooltipPlatilloId, setActiveTooltipPlatilloId] = useState<number | null>(null)
  const [activeTooltipMenuId, setActiveTooltipMenuId] = useState<number | null>(null)

  // Estados para la nueva sección de Variación de Costos
  const [cambiosPlatillos, setCambiosPlatillos] = useState<CambioCosto[]>([])
  const [cambiosRecetas, setCambiosRecetas] = useState<CambioCosto[]>([])
  const [ingredientesAumento, setIngredientesAumento] = useState<CambioIngrediente[]>([])
  const [ingredientesDisminucion, setIngredientesDisminucion] = useState<CambioIngrediente[]>([])
  const [hoteles, setHoteles] = useState<OpcionSelect[]>([])
  const [hotelSeleccionado, setHotelSeleccionado] = useState<string>("")
  const [mesSeleccionado, setMesSeleccionado] = useState<string>("7")
  const [añoSeleccionado, setAñoSeleccionado] = useState<string>("2025")

  // Estados para tooltips
  const [detallesPlatilloTooltip, setDetallesPlatilloTooltip] = useState<DetallesPlatilloTooltip | null>(null)
  const [detallesRecetaTooltip, setDetallesRecetaTooltip] = useState<DetallesRecetaTooltip | null>(null)
  const [loadingTooltip, setLoadingTooltip] = useState(false)

  // Estados para el nuevo reporte de recetas
  const [reporteRecetas, setReporteRecetas] = useState<any[]>([])
  const [isLoadingReporte, setIsLoadingReporte] = useState(false)

  // Estados para paginación del reporte de recetas
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)

  // Estados para paginación de variación de costos
  const [currentPageVariacion, setCurrentPageVariacion] = useState(1)

  // Estados para paginación de ingredientes aumento
  const [currentPageIngredientes, setCurrentPageIngredientes] = useState(1)

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState("reporte-recetas")

  // Estado para el ordenamiento
  const [sortConfig, setSortConfig] = useState<{
    key: string | null
    direction: "asc" | "desc"
  }>({ key: null, direction: "asc" })

  useEffect(() => {
    async function loadMenus() {
      setIsLoadingMenus(true)
      const menus = await getMenusForDropdown()
      setMenuOptions(menus)
      if (menus.length > 0) {
        setSelectedMenuId(menus[0].id.toString())
      }
      setIsLoadingMenus(false)
    }
    loadMenus()
  }, [])

  useEffect(() => {
    async function loadMargins() {
      setIsLoadingTopMargins(true)
      setIsLoadingBottomMargins(true)
      const top = await getTopMarginPlatillos()
      const bottom = await getBottomMarginPlatillos()
      setTopMargins(top)
      setBottomMargins(bottom)
      setIsLoadingTopMargins(false)
      setIsLoadingBottomMargins(false)
    }
    loadMargins()
  }, [])

  // Cargar hoteles al inicializar
  useEffect(() => {
    async function loadHoteles() {
      const hotelesData = await obtenerHotelesPorRol()
      if (hotelesData.success) {
        setHoteles(hotelesData.data)
        if (hotelesData.data.length > 0) {
          setHotelSeleccionado(hotelesData.data[0].id.toString())
        }
      }
    }
    loadHoteles()
  }, [])

  // Cargar datos de variación de costos cuando cambien los filtros
  useEffect(() => {
    async function loadVariacionCostos() {
      if (hotelSeleccionado && mesSeleccionado && añoSeleccionado) {
        const [cambiosPlatillosData, cambiosRecetasData, ingredientesAumentoData, ingredientesDisminucionData] =
          await Promise.all([
            obtenerCambiosCostosPlatillos(
              Number.parseInt(mesSeleccionado),
              Number.parseInt(añoSeleccionado),
              Number.parseInt(hotelSeleccionado),
            ),
            obtenerCambiosCostosRecetas(
              Number.parseInt(mesSeleccionado),
              Number.parseInt(añoSeleccionado),
              Number.parseInt(hotelSeleccionado),
            ),
            obtenerIngredientesAumentoPrecio(
              Number.parseInt(mesSeleccionado),
              Number.parseInt(añoSeleccionado),
              Number.parseInt(hotelSeleccionado),
            ),
            obtenerIngredientesDisminucionPrecio(
              Number.parseInt(mesSeleccionado),
              Number.parseInt(añoSeleccionado),
              Number.parseInt(hotelSeleccionado),
            ),
          ])

        if (cambiosPlatillosData.success) setCambiosPlatillos(cambiosPlatillosData.data)
        if (cambiosRecetasData.success) setCambiosRecetas(cambiosRecetasData.data)
        if (ingredientesAumentoData.success) setIngredientesAumento(ingredientesAumentoData.data)
        if (ingredientesDisminucionData.success) setIngredientesDisminucion(ingredientesDisminucionData.data)

        // Reset páginas cuando cambien los filtros
        setCurrentPageVariacion(1)
        setCurrentPageIngredientes(1)
      }
    }
    loadVariacionCostos()
  }, [hotelSeleccionado, mesSeleccionado, añoSeleccionado])

  // Cargar reporte de recetas cuando cambien los filtros
  useEffect(() => {
    async function loadReporteRecetas() {
      if (hotelSeleccionado && mesSeleccionado && añoSeleccionado) {
        setIsLoadingReporte(true)
        try {
          const reporteData = await obtenerReporteRecetas(
            Number.parseInt(hotelSeleccionado),
            Number.parseInt(mesSeleccionado),
            Number.parseInt(añoSeleccionado),
          )
          setReporteRecetas(reporteData)
          setCurrentPage(1) // Reset a la primera página cuando cambian los filtros
        } catch (error) {
          console.error("Error cargando reporte de recetas:", error)
          setReporteRecetas([])
        } finally {
          setIsLoadingReporte(false)
        }
      }
    }
    loadReporteRecetas()
  }, [hotelSeleccionado, mesSeleccionado, añoSeleccionado])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (platilloSearchTerm.length > 0 || selectedMenuId !== "-1") {
        setIsLoadingPlatillosDropdown(true)
        const platillos = await getPlatillosForDropdown(Number.parseInt(selectedMenuId), platilloSearchTerm)
        setPlatilloOptions(platillos)
        setIsLoadingPlatillosDropdown(false)
      } else {
        setPlatilloOptions([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [platilloSearchTerm, selectedMenuId])

  const handleSearch = async () => {
    setIsLoadingChartData(true)
    setIsLoadingMargins(true)
    setIsLoadingComparisonChart(true) // Activar carga para el nuevo gráfico

    console.log("handleSearch triggered with:", {
      selectedPlatilloId,
      fechaInicial: fechaInicial ? format(fechaInicial, "yyyy-MM-dd") : undefined,
      fechaFinal: fechaFinal ? format(fechaFinal, "yyyy-MM-dd") : undefined,
    })

    if (selectedPlatilloId && fechaInicial && fechaFinal) {
      const history = await getPlatilloCostHistory(
        selectedPlatilloId,
        format(fechaInicial, "yyyy-MM-dd"),
        format(fechaFinal, "yyyy-MM-dd"),
      )
      console.log("Received cost history from action:", history)
      setCostHistoryData(history)
    } else {
      console.log("Missing platillo ID or date range for chart data. Chart will be empty.")
      setCostHistoryData([])
    }

    // Obtener datos para el nuevo gráfico de barras
    if (selectedPlatilloId) {
      const comparisonData = await getPlatilloComparisonData(selectedPlatilloId)
      setPlatilloComparisonData(comparisonData)
      console.log("Received platillo comparison data:", comparisonData) // Log para depuración
    } else {
      setPlatilloComparisonData(null)
    }

    const margins = await getPlatillosWithMargins()
    console.log("Received margins data:", margins)
    setPlatillosWithMargins(margins)

    setIsLoadingChartData(false)
    setIsLoadingMargins(false)
    setIsLoadingComparisonChart(false) // Desactivar carga para el nuevo gráfico
  }

  const handleTooltipHover = async (platilloId: number, MenuId: number) => {
    if (activeTooltipPlatilloId === platilloId && activeTooltipMenuId === MenuId && tooltipContent) {
      return // Already loaded for this platillo and menu combination
    }
    setActiveTooltipPlatilloId(platilloId)
    setActiveTooltipMenuId(MenuId)
    setIsTooltipLoading(true)
    const details = await getPlatilloDetailsForTooltip(platilloId, MenuId)
    setTooltipContent(details)
    setIsTooltipLoading(false)
  }

  // Función para cargar detalles del platillo para tooltip
  const cargarDetallesPlatilloTooltip = async (platilloId: number) => {
    setLoadingTooltip(true)
    try {
      const response = await obtenerDetallesPlatilloTooltip(platilloId)
      if (response.success && response.data) {
        setDetallesPlatilloTooltip(response.data)
      } else {
        setDetallesPlatilloTooltip(null)
      }
    } catch (error) {
      console.error("Error cargando detalles del platillo:", error)
      setDetallesPlatilloTooltip(null)
    } finally {
      setLoadingTooltip(false)
    }
  }

  // Función para cargar detalles de la receta para tooltip
  const cargarDetallesRecetaTooltip = async (recetaId: number) => {
    setLoadingTooltip(true)
    try {
      const response = await obtenerDetallesRecetaTooltip(recetaId)
      if (response.success && response.data) {
        setDetallesRecetaTooltip(response.data)
      } else {
        setDetallesRecetaTooltip(null)
      }
    } catch (error) {
      console.error("Error cargando detalles de la receta:", error)
      setDetallesRecetaTooltip(null)
    } finally {
      setLoadingTooltip(false)
    }
  }

  const formattedCostHistoryData = useMemo(() => {
    return costHistoryData.map((item) => ({
      ...item,
      fechacreacion: format(new Date(item.fechacreacion), "dd/MM/yyyy"),
    }))
  }, [costHistoryData])

  // Función para formatear valores float con 3 decimales
  const formatValue = (value: any) => {
    if (value === null || value === undefined) return ""
    if (typeof value === "number" && !Number.isInteger(value)) {
      return value.toFixed(3)
    }
    return String(value)
  }

  // Función para manejar el ordenamiento
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
    setCurrentPage(1) // Regresar a la página 1 cuando se ordene
  }

  // Función para ordenar los datos
  const sortedReporteRecetas = useMemo(() => {
    if (!sortConfig.key) return reporteRecetas

    return [...reporteRecetas].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      // Si ambos valores son números
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
      }

      // Si ambos valores son strings
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      // Convertir a string para comparación general
      const aStr = String(aValue || "")
      const bStr = String(bValue || "")

      return sortConfig.direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [reporteRecetas, sortConfig])

  // Actualizar paginatedData para usar sortedReporteRecetas
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return sortedReporteRecetas.slice(startIndex, endIndex)
  }, [sortedReporteRecetas, currentPage])

  // Actualizar totalPages para usar sortedReporteRecetas
  const totalPages = Math.ceil(sortedReporteRecetas.length / ITEMS_PER_PAGE)

  // Función para renderizar las columnas con ordenamiento
  const renderTableHeaders = () => {
    if (reporteRecetas.length === 0) return null

    const firstRow = reporteRecetas[0]
    return Object.keys(firstRow).map((key) => (
      <TableHead key={key} className="cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort(key)}>
        <div className="flex items-center justify-between">
          <span>{key}</span>
          <div className="flex flex-col ml-1">
            <ChevronUp
              className={`h-3 w-3 ${
                sortConfig.key === key && sortConfig.direction === "asc" ? "text-blue-600" : "text-gray-400"
              }`}
            />
            <ChevronDown
              className={`h-3 w-3 -mt-1 ${
                sortConfig.key === key && sortConfig.direction === "desc" ? "text-blue-600" : "text-gray-400"
              }`}
            />
          </div>
        </div>
      </TableHead>
    ))
  }

  const renderTableRows = () => {
    return paginatedData.map((receta, index) => (
      <TableRow key={index}>
        {Object.entries(receta).map(([key, value], cellIndex) => (
          <TableCell key={cellIndex}>{formatValue(value)}</TableCell>
        ))}
      </TableRow>
    ))
  }

  // Función para exportar a Excel según la pestaña activa
  const handleExportExcel = async () => {
    let dataToExport: any[] = []
    let fileName = ""

    // Determinar qué datos exportar según la pestaña activa
    switch (activeTab) {
      case "reporte-recetas":
        if (reporteRecetas.length === 0) {
          alert("No hay datos para exportar")
          return
        }
        dataToExport = reporteRecetas
        const hotelNombre = hoteles.find((h) => h.id.toString() === hotelSeleccionado)?.nombre || "Hotel"
        const mesNombre = mesesDelAño.find((m) => m.id.toString() === mesSeleccionado)?.nombre || "Mes"
        fileName = `Reporte_Recetas_${hotelNombre}_${mesNombre}_${añoSeleccionado}.xlsx`
        break

      case "variacion-costos":
        if (cambiosPlatillos.length === 0) {
          alert("No hay datos para exportar")
          return
        }
        dataToExport = cambiosPlatillos.map((platillo) => ({
          "Nombre Platillo": platillo.nombre,
          "Mes Anterior": platillo.costo_inicial,
          "Mes Actual": platillo.costo_actual,
          "Variación de Costo (%)": platillo.variacion_porcentaje,
        }))
        const hotelNombreVar = hoteles.find((h) => h.id.toString() === hotelSeleccionado)?.nombre || "Hotel"
        const mesNombreVar = mesesDelAño.find((m) => m.id.toString() === mesSeleccionado)?.nombre || "Mes"
        fileName = `Variacion_Costos_${hotelNombreVar}_${mesNombreVar}_${añoSeleccionado}.xlsx`
        break

      case "ingredientes-aumento":
        if (ingredientesAumento.length === 0) {
          alert("No hay datos para exportar")
          return
        }
        dataToExport = ingredientesAumento.map((ingrediente) => ({
          "Nombre Ingrediente": ingrediente.nombre,
          "Mes Anterior": ingrediente.costo_inicial,
          "Mes Actual": ingrediente.costo_actual,
          "Variación de Costo (%)": ingrediente.aumento_porcentaje,
        }))
        const hotelNombreIng = hoteles.find((h) => h.id.toString() === hotelSeleccionado)?.nombre || "Hotel"
        const mesNombreIng = mesesDelAño.find((m) => m.id.toString() === mesSeleccionado)?.nombre || "Mes"
        fileName = `Insumos_Var_Costos_${hotelNombreIng}_${mesNombreIng}_${añoSeleccionado}.xlsx`
        break

      default:
        alert("No hay datos para exportar")
        return
    }

    setIsExporting(true)
    try {
      console.log("Iniciando exportación...", { dataToExport: dataToExport.length })

      // Importación dinámica de XLSX
      const XLSX = await import("xlsx")
      console.log("XLSX importado correctamente")

      // Formatear los datos para Excel
      const excelData = dataToExport.map((row) => {
        const formattedRow: any = {}
        Object.entries(row).forEach(([key, value]) => {
          formattedRow[key] = formatValue(value)
        })
        return formattedRow
      })
      console.log("Datos formateados:", excelData.length, "filas")

      // Crear worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)
      console.log("Worksheet creado")

      // Crear un nuevo workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Reporte")
      console.log("Workbook creado")

      console.log("Nombre del archivo:", fileName)

      // Generar el archivo como array buffer
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      console.log("Archivo generado, tamaño:", wbout.byteLength, "bytes")

      // Crear blob y descargar
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      console.log("Blob creado")

      // Crear URL y elemento de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      link.style.display = "none"

      // Agregar al DOM, hacer click y remover
      document.body.appendChild(link)
      console.log("Iniciando descarga...")
      link.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        console.log("Cleanup completado")
      }, 100)

      console.log("Exportación completada exitosamente")
    } catch (error) {
      console.error("Error detallado en exportación:", error)
      alert(`Error al exportar el archivo: ${error.message || error}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Funciones de paginación para reporte de recetas
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Funciones de paginación para variación de costos
  const totalPagesVariacion = Math.ceil(cambiosPlatillos.length / ITEMS_PER_PAGE)
  const goToPageVariacion = (page: number) => {
    if (page >= 1 && page <= totalPagesVariacion) {
      setCurrentPageVariacion(page)
    }
  }

  const goToPreviousPageVariacion = () => {
    if (currentPageVariacion > 1) {
      setCurrentPageVariacion(currentPageVariacion - 1)
    }
  }

  const goToNextPageVariacion = () => {
    if (currentPageVariacion < totalPagesVariacion) {
      setCurrentPageVariacion(currentPageVariacion + 1)
    }
  }

  // Funciones de paginación para ingredientes aumento
  const totalPagesIngredientes = Math.ceil(ingredientesAumento.length / ITEMS_PER_PAGE)
  const goToPageIngredientes = (page: number) => {
    if (page >= 1 && page <= totalPagesIngredientes) {
      setCurrentPageIngredientes(page)
    }
  }

  const goToPreviousPageIngredientes = () => {
    if (currentPageIngredientes > 1) {
      setCurrentPageIngredientes(currentPageIngredientes - 1)
    }
  }

  const goToNextPageIngredientes = () => {
    if (currentPageIngredientes < totalPagesIngredientes) {
      setCurrentPageIngredientes(currentPageIngredientes + 1)
    }
  }

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  // Generar números de página para variación de costos
  const getPageNumbersVariacion = () => {
    const pages = []
    const maxPagesToShow = 5
    let startPage = Math.max(1, currentPageVariacion - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPagesVariacion, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  // Generar números de página para ingredientes aumento
  const getPageNumbersIngredientes = () => {
    const pages = []
    const maxPagesToShow = 5
    let startPage = Math.max(1, currentPageIngredientes - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPagesIngredientes, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  // Datos paginados para variación de costos
  const paginatedVariacionData = useMemo(() => {
    const startIndex = (currentPageVariacion - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return cambiosPlatillos.slice(startIndex, endIndex)
  }, [cambiosPlatillos, currentPageVariacion])

  // Datos paginados para ingredientes aumento
  const paginatedIngredientesData = useMemo(() => {
    const startIndex = (currentPageIngredientes - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return ingredientesAumento.slice(startIndex, endIndex)
  }, [ingredientesAumento, currentPageIngredientes])

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Estadísticas Costos</h1>

      {/* Contenedor principal con pestañas */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-blue-800">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Reportes y Análisis
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exportando..." : "Exportar"}
              </Button>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-5 w-5 text-blue-600 hover:text-blue-800 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md p-4 bg-white border border-blue-200 shadow-lg">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-800 text-sm">Reportes y Análisis</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Esta sección incluye el reporte completo de recetas y el análisis de variación de costos para
                        identificar tendencias y cambios en los precios de los platillos.
                      </p>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros compartidos */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotel-reporte">Hotel</Label>
                <Select value={hotelSeleccionado} onValueChange={setHotelSeleccionado}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hoteles.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id.toString()}>
                        {hotel.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mes-reporte">Mes</Label>
                <Select value={mesSeleccionado} onValueChange={setMesSeleccionado}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesDelAño.map((mes) => (
                      <SelectItem key={mes.id} value={mes.id.toString()}>
                        {mes.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="año-reporte">Año</Label>
                <Select value={añoSeleccionado} onValueChange={setAñoSeleccionado}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {añosDisponibles.map((año) => (
                      <SelectItem key={año.id} value={año.id.toString()}>
                        {año.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pestañas */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reporte-recetas">Reporte de Recetas</TabsTrigger>
              <TabsTrigger value="variacion-costos">Variación Costos (Top 5)</TabsTrigger>
              <TabsTrigger value="ingredientes-aumento">Insumos Var Costos</TabsTrigger>
            </TabsList>

            {/* Pestaña Reporte de Recetas */}
            <TabsContent value="reporte-recetas" className="space-y-4">
              {isLoadingReporte ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-lg">Cargando reporte de recetas...</div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>{renderTableHeaders()}</TableRow>
                      </TableHeader>
                      <TableBody>{renderTableRows()}</TableBody>
                    </Table>
                  </div>

                  {/* Paginación para reporte de recetas */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{" "}
                        {Math.min(currentPage * ITEMS_PER_PAGE, sortedReporteRecetas.length)} de{" "}
                        {sortedReporteRecetas.length} registros
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={goToPreviousPage} disabled={currentPage === 1} variant="outline" size="sm">
                          Anterior
                        </Button>
                        {getPageNumbers().map((page) => (
                          <Button
                            key={page}
                            onClick={() => goToPage(page)}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                        >
                          Siguiente
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Pestaña Variación de Costos */}
            <TabsContent value="variacion-costos" className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre Platillo</TableHead>
                      <TableHead>Mes Anterior</TableHead>
                      <TableHead>Mes Actual</TableHead>
                      <TableHead>Variación de Costo (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVariacionData.map((platillo, index) => (
                      <TableRow key={index}>
                        <TableCell
                          className="cursor-pointer hover:bg-blue-50"
                          onMouseEnter={() => cargarDetallesPlatilloTooltip(platillo.id || 0)}
                        >
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <span className="text-blue-600 hover:text-blue-800">{platillo.nombre}</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm p-4 bg-white border shadow-lg">
                                {loadingTooltip ? (
                                  <div className="text-sm">Cargando detalles...</div>
                                ) : detallesPlatilloTooltip ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      {detallesPlatilloTooltip.imgurl && (
                                        <img
                                          src={detallesPlatilloTooltip.imgurl || "/placeholder.svg"}
                                          alt={detallesPlatilloTooltip.nombre}
                                          className="w-12 h-12 object-cover rounded"
                                        />
                                      )}
                                      <div>
                                        <h4 className="font-semibold text-sm">{detallesPlatilloTooltip.nombre}</h4>
                                        <p className="text-xs text-gray-600">ID: {detallesPlatilloTooltip.id}</p>
                                      </div>
                                    </div>
                                    <div className="text-xs space-y-1">
                                      <p>
                                        <span className="font-medium">Costo Total:</span> $
                                        {detallesPlatilloTooltip.costototal?.toFixed(2) || "0.00"}
                                      </p>
                                      <p>
                                        <span className="font-medium">Costo Administrativo:</span> $
                                        {detallesPlatilloTooltip.costoadministrativo?.toFixed(2) || "0.00"}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">No se pudieron cargar los detalles</div>
                                )}
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>${platillo.costo_inicial.toFixed(2)}</TableCell>
                        <TableCell>${platillo.costo_actual.toFixed(2)}</TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${
                              platillo.variacion_porcentaje > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {platillo.variacion_porcentaje > 0 ? "+" : ""}
                            {platillo.variacion_porcentaje.toFixed(2)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación para variación de costos */}
              {totalPagesVariacion > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {(currentPageVariacion - 1) * ITEMS_PER_PAGE + 1} a{" "}
                    {Math.min(currentPageVariacion * ITEMS_PER_PAGE, cambiosPlatillos.length)} de{" "}
                    {cambiosPlatillos.length} registros
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={goToPreviousPageVariacion}
                      disabled={currentPageVariacion === 1}
                      variant="outline"
                      size="sm"
                    >
                      Anterior
                    </Button>
                    {getPageNumbersVariacion().map((page) => (
                      <Button
                        key={page}
                        onClick={() => goToPageVariacion(page)}
                        variant={page === currentPageVariacion ? "default" : "outline"}
                        size="sm"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      onClick={goToNextPageVariacion}
                      disabled={currentPageVariacion === totalPagesVariacion}
                      variant="outline"
                      size="sm"
                    >
                      Siguiente
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Página {currentPageVariacion} de {totalPagesVariacion}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Pestaña Insumos Var Costos */}
            <TabsContent value="ingredientes-aumento" className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre Ingrediente</TableHead>
                      <TableHead>Mes Anterior</TableHead>
                      <TableHead>Mes Actual</TableHead>
                      <TableHead>Variación de Costo (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedIngredientesData.map((ingrediente, index) => (
                      <TableRow key={index}>
                        <TableCell>{ingrediente.nombre}</TableCell>
                        <TableCell>${ingrediente.costo_inicial.toFixed(2)}</TableCell>
                        <TableCell>${ingrediente.costo_actual.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className="font-medium text-red-600">
                            +{ingrediente.aumento_porcentaje?.toFixed(2) || "0.00"}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación para ingredientes aumento */}
              {totalPagesIngredientes > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {(currentPageIngredientes - 1) * ITEMS_PER_PAGE + 1} a{" "}
                    {Math.min(currentPageIngredientes * ITEMS_PER_PAGE, ingredientesAumento.length)} de{" "}
                    {ingredientesAumento.length} registros
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={goToPreviousPageIngredientes}
                      disabled={currentPageIngredientes === 1}
                      variant="outline"
                      size="sm"
                    >
                      Anterior
                    </Button>
                    {getPageNumbersIngredientes().map((page) => (
                      <Button
                        key={page}
                        onClick={() => goToPageIngredientes(page)}
                        variant={page === currentPageIngredientes ? "default" : "outline"}
                        size="sm"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      onClick={goToNextPageIngredientes}
                      disabled={currentPageIngredientes === totalPagesIngredientes}
                      variant="outline"
                      size="sm"
                    >
                      Siguiente
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Página {currentPageIngredientes} de {totalPagesIngredientes}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
