"use client"

import type React from "react"

/* ==================================================
	Imports
================================================== */
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getHotelesForAnalisis,
  getRestaurantesForAnalisis,
  getMenusForAnalisis,
  getPlatillosForAnalisis,
  getPlatilloCostHistory,
  getPlatilloDetailsForTooltip,
  getPlatilloActualInfo,
  getPlatilloHistoricoInfo,
  type HotelItem,
  type RestauranteItem,
  type MenuItem,
  type PlatilloItem,
  type CostHistoryItem,
  type PlatilloTooltipDetail,
  type PlatilloActualInfo,
  type PlatilloHistoricoInfo,
} from "@/app/actions/analisis-costos-actions"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, SearchIcon, TrendingUp, TrendingDown, Minus, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

/* ==================================================
  Interfaces, tipados, clases
================================================== */
// Tipo para los detalles específicos del punto seleccionado
interface SelectedPointDetails {
  fecha: string
  fechaOriginal: string
  costo: number
  precioventa: number
  margenutilidad: number
  costoporcentual: number
  platilloNombre: string
  restaurante: string
  menu: string
  menuId: number
}

// Tipo para los datos procesados por platillo
interface PlatilloDataset {
  id: number
  nombre: string
  color: string
  data: CostHistoryItem[]
}

/* ==================================================
  Componente Principal, Pagina
================================================== */
export default function AnalisisCostosPage() {
  // --- Estados ---
  const [hoteles, setHoteles] = useState<HotelItem[]>([])
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [restaurantes, setRestaurantes] = useState<RestauranteItem[]>([])
  const [selectedRestaurante, setSelectedRestaurante] = useState<string>("")
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [selectedMenu, setSelectedMenu] = useState<string>("")
  const [platillos, setPlatillos] = useState<PlatilloItem[]>([])
  const [selectedPlatillo, setSelectedPlatillo] = useState<string>("-1")
  const [searchTermPlatillo, setSearchTermPlatillo] = useState<string>("")
  const [fechaInicial, setFechaInicial] = useState<Date | undefined>(undefined)
  const [fechaFinal, setFechaFinal] = useState<Date | undefined>(undefined)
  const [chartData, setChartData] = useState<CostHistoryItem[]>([])
  const [platillosDatasets, setPlatillosDatasets] = useState<PlatilloDataset[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [platilloDetails, setPlatilloDetails] = useState<PlatilloTooltipDetail | null>(null)
  const [selectedPointDetails, setSelectedPointDetails] = useState<SelectedPointDetails | null>(null)
  const [platilloActual, setPlatilloActual] = useState<PlatilloActualInfo | null>(null)
  const [platilloHistorico, setPlatilloHistorico] = useState<PlatilloHistoricoInfo | null>(null)
  const [showValidationDialog, setShowValidationDialog] = useState<boolean>(false)
  const [validationMessage, setValidationMessage] = useState<string>("")

  // Estados para zoom y pan
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [panX, setPanX] = useState<number>(0)
  const [panY, setPanY] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false)
  const [hoveredPoint, setHoveredPoint] = useState<{
    data: any
    dataset: PlatilloDataset
    position: { x: number; y: number }
  } | null>(null)

  // Estados para el tooltip mejorado
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false)
  const [tooltipData, setTooltipData] = useState<{
    data: any
    dataset: PlatilloDataset
    position: { x: number; y: number }
  } | null>(null)

  // Estado para el rango de costo porcentual
  const [rangoCosto, setRangoCosto] = useState<[number, number]>([1, 60])

  // Colores para las líneas de los platillos
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#8dd1e1",
    "#d084d0",
    "#ffb347",
    "#87ceeb",
    "#dda0dd",
    "#98fb98",
  ]

  // --- Variables especiales ---
  // Procesar datos para crear datasets por platillo
  const processDataByPlatillo = useMemo(() => {
    if (chartData.length === 0) return []

    // Filtrar datos por rango de costo porcentual
    const filteredData = chartData.filter((item) => {
      const costoPorcentual = item.costoporcentual || 0
      return costoPorcentual >= rangoCosto[0] && costoPorcentual <= rangoCosto[1]
    })

    if (filteredData.length === 0) return []

    // Obtener platillos únicos
    const uniquePlatillos = Array.from(new Set(filteredData.map((item) => item.platilloid)))

    // Crear dataset para cada platillo
    const datasets: PlatilloDataset[] = uniquePlatillos.map((platilloId, index) => {
      const platilloData = filteredData.filter((item) => item.platilloid === platilloId)
      const platilloNombre = platilloData[0]?.nombreplatillo || `Platillo ${platilloId}`

      return {
        id: platilloId,
        nombre: platilloNombre,
        color: colors[index % colors.length],
        data: platilloData.sort((a, b) => new Date(a.fechacreacion).getTime() - new Date(b.fechacreacion).getTime()),
      }
    })

    return datasets
  }, [chartData, rangoCosto])

  // Crear datos combinados para el gráfico - NUEVA LÓGICA CORREGIDA CON FILTRO DE RANGO
  const combinedChartData = useMemo(() => {
    if (chartData.length === 0) return []

    // Filtrar datos por rango de costo porcentual
    const filteredData = chartData.filter((item) => {
      const costoPorcentual = item.costoporcentual || 0
      return costoPorcentual >= rangoCosto[0] && costoPorcentual <= rangoCosto[1]
    })

    if (filteredData.length === 0) return []

    // Obtener todas las fechas únicas y ordenarlas
    const allDates = Array.from(new Set(filteredData.map((item) => item.fechacreacion))).sort()

    // Crear el array de datos combinados
    return allDates.map((fecha) => {
      const dataPoint: any = { fechacreacion: fecha }

      // Para cada platillo, buscar si tiene datos en esta fecha
      platillosDatasets.forEach((dataset) => {
        const itemForDate = dataset.data.find((item) => {
          const costoPorcentual = item.costoporcentual || 0
          return item.fechacreacion === fecha && costoPorcentual >= rangoCosto[0] && costoPorcentual <= rangoCosto[1]
        })
        if (itemForDate) {
          dataPoint[`platillo_${dataset.id}`] = itemForDate.costoporcentual
          // Guardar referencia al item completo para el tooltip
          dataPoint[`item_${dataset.id}`] = itemForDate
        }
        // NO asignar null si no hay datos - esto es clave para la conexión de líneas
      })

      return dataPoint
    })
  }, [chartData, platillosDatasets, rangoCosto])

  // --- Cargas ---
  // Cargar hoteles al inicio y seleccionar el primero
  useEffect(() => {
    const loadHoteles = async () => {
      const fetchedHoteles = await getHotelesForAnalisis()
      setHoteles(fetchedHoteles)

      // Seleccionar el primer hotel automáticamente
      if (fetchedHoteles.length > 0) {
        setSelectedHotel(fetchedHoteles[0].id.toString())
      }

      setLoading(false)
    }
    loadHoteles()
  }, [])

  // Cargar restaurantes cuando cambia el hotel seleccionado y seleccionar el primero
  useEffect(() => {
    const loadRestaurantes = async () => {
      if (selectedHotel === "") return
      const hotelIdNum = Number.parseInt(selectedHotel)
      const fetchedRestaurantes = await getRestaurantesForAnalisis(hotelIdNum)
      setRestaurantes(fetchedRestaurantes)

      // Seleccionar el primer restaurante automáticamente
      if (fetchedRestaurantes.length > 0) {
        setSelectedRestaurante(fetchedRestaurantes[0].id.toString())
      } else {
        setSelectedRestaurante("")
      }

      setSelectedMenu("")
      setSelectedPlatillo("-1")
    }
    loadRestaurantes()
  }, [selectedHotel])

  // Cargar menús cuando cambia el restaurante seleccionado y seleccionar el primero
  useEffect(() => {
    const loadMenus = async () => {
      if (selectedRestaurante === "") return
      const restauranteIdNum = Number.parseInt(selectedRestaurante)
      const fetchedMenus = await getMenusForAnalisis(restauranteIdNum)
      setMenus(fetchedMenus)

      // Seleccionar el primer menú automáticamente
      if (fetchedMenus.length > 0) {
        setSelectedMenu(fetchedMenus[0].id.toString())
      } else {
        setSelectedMenu("")
      }

      setSelectedPlatillo("-1")
    }
    loadMenus()
  }, [selectedRestaurante])

  // Cargar platillos cuando cambia el menú seleccionado o el término de búsqueda
  useEffect(() => {
    const loadPlatillos = async () => {
      if (selectedMenu === "") return
      const menuIdNum = Number.parseInt(selectedMenu)
      const fetchedPlatillos = await getPlatillosForAnalisis(menuIdNum, searchTermPlatillo)
      setPlatillos(fetchedPlatillos)
    }
    loadPlatillos()
  }, [selectedMenu, searchTermPlatillo])

  // Actualizar datasets cuando cambian los datos del gráfico
  useEffect(() => {
    const datasets = processDataByPlatillo
    setPlatillosDatasets(datasets)
  }, [processDataByPlatillo])

  // --- Funciones --
  // Función para manejar la búsqueda
  const handleSearch = useCallback(async () => {
    if (!selectedPlatillo || !fechaInicial || !fechaFinal) {
      setValidationMessage("Por favor, selecciona un platillo y un rango de fechas.")
      setShowValidationDialog(true)
      return
    }

    const platilloIdNum = Number.parseInt(selectedPlatillo)
    const menuIdNum = Number.parseInt(selectedMenu)
    const restauranteIdNum = Number.parseInt(selectedRestaurante)
    const hotelIdNum = Number.parseInt(selectedHotel)

    const history = await getPlatilloCostHistory(
      platilloIdNum,
      format(fechaInicial, "yyyy-MM-dd"),
      format(fechaFinal, "yyyy-MM-dd"),
      menuIdNum,
      restauranteIdNum,
      hotelIdNum,
    )
    setChartData(history)

    const details = await getPlatilloDetailsForTooltip(platilloIdNum, menuIdNum)
    setPlatilloDetails(details)

    // Limpiar la selección de punto específico al hacer nueva búsqueda
    setSelectedPointDetails(null)
    setPlatilloActual(null)
    setPlatilloHistorico(null)
    setShowComparisonModal(false) // Cerrar modal si se hace una nueva búsqueda
  }, [selectedPlatillo, fechaInicial, fechaFinal, selectedMenu, selectedRestaurante, selectedHotel])

  // Función para manejar el clic en "Comparar Costo" desde el tooltip
  const handleCompareFromTooltip = useCallback(async () => {
    if (!tooltipData) return

    try {
      const originalItem = tooltipData.data
      const platilloId = tooltipData.dataset.id
      const fechaOriginal = originalItem.fechacreacion
      const menuNombre = originalItem.nombremenu

      if (!fechaOriginal || !/^\d{4}-\d{2}-\d{2}$/.test(fechaOriginal)) {
        setValidationMessage("Error: No se pudo obtener la fecha del punto seleccionado en formato válido.")
        setShowValidationDialog(true)
        return
      }

      const menuIdNum = Number.parseInt(selectedMenu)

      // Crear los detalles específicos del punto seleccionado
      const pointDetails: SelectedPointDetails = {
        fecha: format(new Date(fechaOriginal), "dd/MM/yyyy"),
        fechaOriginal: fechaOriginal,
        costo: originalItem.costo || 0,
        precioventa: originalItem.precioventa || 0,
        margenutilidad: originalItem.margenutilidad || 0,
        costoporcentual: originalItem.costoporcentual || 0,
        platilloNombre: originalItem.nombreplatillo,
        restaurante: "N/A",
        menu: originalItem.nombremenu,
        menuId: menuIdNum,
      }

      setSelectedPointDetails(pointDetails)
  

      // Obtener información actual y histórica del platillo
      const [actualInfo, historicoInfo] = await Promise.all([
        getPlatilloActualInfo(platilloId, menuIdNum),
        getPlatilloHistoricoInfo(platilloId, fechaOriginal, menuIdNum),
      ])

      setPlatilloActual(actualInfo)
      setPlatilloHistorico(historicoInfo)

      // Ocultar tooltip y mostrar modal
      setTooltipVisible(false)
      setTooltipData(null)
      setShowComparisonModal(true)
    } catch (error) {
      console.error("Error in handleCompareFromTooltip:", error)
      setValidationMessage("Error al obtener la información del platillo.")
      setShowValidationDialog(true)
    }
  }, [tooltipData, selectedMenu])

  // Función para manejar el hover sobre los puntos
  const handlePointHover = useCallback((data: any, dataset: PlatilloDataset, position: { x: number; y: number }) => {
    const originalItem = data.payload[`item_${dataset.id}`]
    if (originalItem) {
      setTooltipData({
        data: originalItem,
        dataset: dataset,
        position: position,
      })
      setTooltipVisible(true)
    }
  }, [])

  // Función para manejar cuando el mouse sale del punto
  const handlePointLeave = useCallback(() => {
    // No ocultar inmediatamente, dar tiempo para que el usuario mueva el cursor al tooltip
    setTimeout(() => {
      if (!tooltipVisible) {
        setTooltipData(null)
      }
    }, 100)
  }, [tooltipVisible])

  // Función para manejar cuando el mouse entra al tooltip
  const handleTooltipEnter = useCallback(() => {
    setTooltipVisible(true)
  }, [])

  // Función para manejar cuando el mouse sale del tooltip
  const handleTooltipLeave = useCallback(() => {
    setTooltipVisible(false)
    setTooltipData(null)
  }, [])

  // Funciones para zoom y pan
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoomLevel((prev) => Math.max(1, Math.min(3, prev + delta)))
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
    },
    [panX, panY],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !chartContainerRef.current) return

      const containerRect = chartContainerRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width
      const containerHeight = containerRect.height

      // Calcular los límites basados en el zoom y el tamaño del contenedor
      const maxPanX = (containerWidth * (zoomLevel - 1)) / 2
      const maxPanY = (containerHeight * (zoomLevel - 1)) / 2

      const newPanX = e.clientX - dragStart.x
      const newPanY = e.clientY - dragStart.y

      // Aplicar límites
      setPanX(Math.max(-maxPanX, Math.min(maxPanX, newPanX)))
      setPanY(Math.max(-maxPanY, Math.min(maxPanY, newPanY)))
    },
    [isDragging, dragStart, zoomLevel],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(3, prev + 0.2))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(1, prev - 0.2))
  }, [])

  const resetZoom = useCallback(() => {
    setZoomLevel(1)
    setPanX(0)
    setPanY(0)
  }, [])

  // Función para calcular la diferencia y mostrar el indicador
  const renderComparison = (actual: number, historico: number, isPercentage = false) => {
    const diferencia = actual - historico
    const porcentajeCambio = historico !== 0 ? (diferencia / historico) * 100 : 0
    const suffix = isPercentage ? "%" : ""

    if (diferencia > 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">
            +{diferencia.toFixed(2)}
            {suffix} ({porcentajeCambio.toFixed(1)}%)
          </span>
        </div>
      )
    } else if (diferencia < 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">
            {diferencia.toFixed(2)}
            {suffix} ({porcentajeCambio.toFixed(1)}%)
          </span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-600">
          <Minus className="h-4 w-4" />
          <span className="text-sm font-medium">Sin cambio</span>
        </div>
      )
    }
  }

  // Función para prevenir el scroll de la página cuando se hace scroll en el contenedor
  const handleContainerScroll = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Llamar a la función de zoom
      handleWheel(e)
    },
    [handleWheel],
  )

  // Efecto para prevenir el scroll de la página en el contenedor del gráfico
  useEffect(() => {
    const chartContainer = chartContainerRef.current
    if (!chartContainer) return

    const preventScroll = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Crear un evento sintético para el zoom
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        deltaY: e.deltaY,
      } as React.WheelEvent

      handleWheel(syntheticEvent)
    }

    chartContainer.addEventListener("wheel", preventScroll, { passive: false })

    return () => {
      chartContainer.removeEventListener("wheel", preventScroll)
    }
  }, [handleWheel])

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">Analisis de Costos</h1>

      {/* AlertDialog para validaciones */}
      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Validación de Datos</AlertDialogTitle>
            <AlertDialogDescription>{validationMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowValidationDialog(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="frmAnalisisCostoBuscar" className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ddlHotel">Hotel</Label>
              <Select
                value={selectedHotel}
                onValueChange={(value) => {
                  setSelectedHotel(value)
                  setSelectedRestaurante("")
                  setSelectedMenu("")
                  setSelectedPlatillo("-1")
                }}
              >
                <SelectTrigger id="ddlHotel" name="ddlHotel">
                  <SelectValue placeholder="Selecciona un hotel" />
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="ddlRestaurante">Restaurante</Label>
              <Select
                value={selectedRestaurante}
                onValueChange={(value) => {
                  setSelectedRestaurante(value)
                  setSelectedMenu("")
                  setSelectedPlatillo("-1")
                }}
                disabled={selectedHotel === ""}
              >
                <SelectTrigger id="ddlRestaurante" name="ddlRestaurante">
                  <SelectValue placeholder="Selecciona un restaurante" />
                </SelectTrigger>
                <SelectContent>
                  {restaurantes.map((restaurante) => (
                    <SelectItem key={restaurante.id} value={restaurante.id.toString()}>
                      {restaurante.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ddlMenu">Menú</Label>
              <Select
                value={selectedMenu}
                onValueChange={(value) => {
                  setSelectedMenu(value)
                  setSelectedPlatillo("-1")
                  setSearchTermPlatillo("")
                }}
                disabled={selectedRestaurante === ""}
              >
                <SelectTrigger id="ddlMenu" name="ddlMenu">
                  <SelectValue placeholder="Selecciona un menú" />
                </SelectTrigger>
                <SelectContent>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id.toString()}>
                      {menu.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="txtPlatilloCostoNombre">Platillo</Label>
              <Select value={selectedPlatillo} onValueChange={setSelectedPlatillo} disabled={selectedMenu === ""}>
                <SelectTrigger id="txtPlatilloCostoNombre" name="txtPlatilloCostoNombre">
                  <SelectValue placeholder="Selecciona un platillo" />
                </SelectTrigger>
                <SelectContent>
                  {platillos.map((platillo) => (
                    <SelectItem key={platillo.id} value={platillo.id.toString()}>
                      {platillo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="txtFechaInicialCosto">Fecha Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white text-gray-900",
                      !fechaInicial && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaInicial ? format(fechaInicial, "PPP") : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={fechaInicial} onSelect={setFechaInicial} initialFocus />
                </PopoverContent>
              </Popover>
              <Input
                id="txtFechaInicialCosto"
                name="txtFechaInicialCosto"
                type="hidden"
                value={fechaInicial ? format(fechaInicial, "yyyy-MM-dd") : ""}
                maxLength={80}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="txtFechaFinalCosto">Fecha Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white text-gray-900",
                      !fechaFinal && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaFinal ? format(fechaFinal, "PPP") : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={fechaFinal} onSelect={setFechaFinal} initialFocus />
                </PopoverContent>
              </Popover>
              <Input
                id="txtFechaFinalCosto"
                name="txtFechaFinalCosto"
                type="hidden"
                value={fechaFinal ? format(fechaFinal, "yyyy-MM-dd") : ""}
                maxLength={80}
              />
            </div>

            <Button
              id="btnAnalisisCostoBuscar"
              name="btnAnalisisCostoBuscar"
              type="button"
              onClick={handleSearch}
              style={{ backgroundColor: "#a7c1eb", color: "black", fontSize: "12px" }}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <SearchIcon className="h-4 w-4" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Nuevo input de rango de costo */}
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Filtro por Rango de Costo %</CardTitle>
        </CardHeader>
        <CardContent className="p-1 pt-0">
          <div className="space-y-4">
            {/*<div className="flex items-center space-x-4">
              <Label htmlFor="rangoCosto" className="text-sm font-medium">
                Rango de Costo: {rangoCosto[0]}% - {rangoCosto[1]}%
              </Label>
            </div>*/}
            <div className="px-2">
              <input
                type="range"
                id="rangoCostoMin"
                min="1"
                max="60"
                value={rangoCosto[0]}
                onChange={(e) => {
                  const newMin = Number(e.target.value)
                  if (newMin <= rangoCosto[1]) {
                    setRangoCosto([newMin, rangoCosto[1]])
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((rangoCosto[0] - 1) / 59) * 100}%, #e5e7eb ${((rangoCosto[0] - 1) / 59) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Mínimo: {rangoCosto[0]}%</span>
                <span>1% - 60%</span>
              </div>
            </div>
            {/*<div className="px-2">
              <input
                type="range"
                id="rangoCostoMax"
                min="1"
                max="60"
                value={rangoCosto[1]}
                onChange={(e) => {
                  const newMax = Number(e.target.value)
                  if (newMax >= rangoCosto[0]) {
                    setRangoCosto([rangoCosto[0], newMax])
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((rangoCosto[1] - 1) / 59) * 100}%, #3b82f6 ${((rangoCosto[1] - 1) / 59) * 100}%, #3b82f6 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Máximo: {rangoCosto[1]}%</span>
                <span>1% - 60%</span>
              </div>
            </div>
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setRangoCosto([1, 60])} className="text-xs">
                Restablecer Rango
              </Button>
            </div>*/}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p>Cargando datos del gráfico...</p>
      ) : combinedChartData.length > 0 ? (
        <div className="relative w-full">
          {/* Fondo con efecto glass-liquid */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/60 to-cyan-50/80 backdrop-blur-sm rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10 rounded-3xl"></div>

          {/* Efectos de burbujas decorativas */}
          <div className="absolute top-4 left-8 w-3 h-3 bg-blue-200/40 rounded-full blur-sm"></div>
          <div className="absolute top-12 right-12 w-2 h-2 bg-purple-200/50 rounded-full blur-sm"></div>
          <div className="absolute bottom-8 left-16 w-4 h-4 bg-cyan-200/30 rounded-full blur-sm"></div>
          <div className="absolute bottom-16 right-8 w-2.5 h-2.5 bg-indigo-200/40 rounded-full blur-sm"></div>

          <Card className="relative w-full border-0 bg-white/70 backdrop-blur-md shadow-2xl shadow-blue-500/10 rounded-3xl overflow-hidden">
            <CardHeader className="relative z-10 bg-gradient-to-r from-slate-50/80 to-blue-50/60 backdrop-blur-sm border-b border-white/20">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Variación de Costos y Precios de Venta
                </CardTitle>

                {/* Controles de zoom */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomOut}
                    className="h-8 w-8 p-0 bg-transparent"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoomLevel * 100)}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomIn}
                    className="h-8 w-8 p-0 bg-transparent"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetZoom}
                    className="h-8 w-8 p-0 bg-transparent"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 p-8">
              <div
                ref={chartContainerRef}
                className="relative h-[700px] w-full overflow-hidden cursor-grab active:cursor-grabbing"
                onWheel={handleContainerScroll}
                onScroll={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  overscrollBehavior: "contain",
                  touchAction: "none",
                }}
              >
                {/* Contenedor del gráfico con efecto glass */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-blue-50/40 to-purple-50/30 backdrop-blur-sm rounded-2xl border border-white/30 shadow-inner"></div>
                <div className="absolute inset-2 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20"></div>

                <div
                  className="relative z-10 h-full w-full p-4"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`,
                    transformOrigin: "center center",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={combinedChartData}
                      accessibilityLayer
                      width={700}
                      height={300}
                      isAnimationActive={false}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" strokeWidth={1} />
                      <XAxis
                        dataKey="fechacreacion"
                        minTickGap={20}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                      />
                      <YAxis
                        domain={[0, 60]}
                        ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]}
                        tickMargin={8}
                        label={{
                          value: "Costo %",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#64748b", fontSize: "14px", fontWeight: "500" },
                        }}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                      />
                      {/* Líneas del gráfico con eventos de hover mejorados */}
                      {platillosDatasets.map((dataset) => (
                        <Line
                          key={dataset.id}
                          dataKey={`platillo_${dataset.id}`}
                          type="monotone"
                          stroke={dataset.color}
                          strokeWidth={3}
                          connectNulls={true}
                          dot={{
                            fill: dataset.color,
                            strokeWidth: 2,
                            r: 4,
                            cursor: "pointer",
                            onMouseEnter: (data: any, index: number) => {
                              handlePointHover(data, dataset, { x: data.cx, y: data.cy })
                            },
                            onMouseLeave: handlePointLeave,
                          }}
                          activeDot={false}
                          name={`platillo_${dataset.id}`}
                        />
                      ))}
                      <ReferenceLine
                        y={30}
                        stroke="#ef4444"
                        strokeDasharray="8 4"
                        strokeWidth={2}
                        label={{
                          value: "Objetivo (30%)",
                          position: "topRight",
                          style: {
                            fill: "#ef4444",
                            fontSize: "12px",
                            fontWeight: "600",
                            filter: "drop-shadow(0 1px 2px rgba(239, 68, 68, 0.3))",
                          },
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Tooltip personalizado mejorado */}
                  {tooltipVisible && tooltipData && (
                    <div
                      className="absolute bg-white/95 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl p-4 max-w-sm z-50"
                      style={{
                        left: (() => {
                          const tooltipWidth = 350 // Ancho aproximado del tooltip
                          const containerRect = chartContainerRef.current?.getBoundingClientRect()
                          if (!containerRect) return tooltipData.position.x + 10

                          const containerLeft = 0
                          const containerRight = containerRect.width
                          const pointX = tooltipData.position.x

                          // Si el tooltip se sale por la derecha, mostrarlo a la izquierda del punto
                          if (pointX + tooltipWidth > containerRight) {
                            return Math.max(containerLeft, pointX - tooltipWidth - 10)
                          }

                          // Si se sale por la izquierda, mostrarlo a la derecha
                          if (pointX + 10 < containerLeft) {
                            return containerLeft + 10
                          }

                          // Posición normal a la derecha del punto
                          return pointX + 10
                        })(),
                        top: (() => {
                          const tooltipHeight = 200 // Altura aproximada del tooltip
                          const containerRect = chartContainerRef.current?.getBoundingClientRect()
                          if (!containerRect) return Math.max(tooltipData.position.y - 150, 10)

                          const containerTop = 0
                          const containerBottom = containerRect.height
                          const pointY = tooltipData.position.y

                          // Si el tooltip se sale por abajo, mostrarlo arriba del punto
                          if (pointY + tooltipHeight > containerBottom) {
                            return Math.max(containerTop, pointY - tooltipHeight - 10)
                          }

                          // Si se sale por arriba, mostrarlo abajo del punto
                          if (pointY - 150 < containerTop) {
                            return containerTop + 10
                          }

                          // Posición normal arriba del punto
                          return pointY - 150
                        })(),
                      }}
                      onMouseEnter={handleTooltipEnter}
                      onMouseLeave={handleTooltipLeave}
                    >
                      <div className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">
                        Fecha: {tooltipData.data.fechacreacion}
                      </div>
                      <div className="space-y-2 p-3 bg-slate-50/50 rounded-lg border border-slate-200/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tooltipData.dataset.color }}
                          ></div>
                          <span className="font-semibold text-slate-800">{tooltipData.dataset.nombre}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Costo:</span>
                            <span className="font-medium text-green-600">
                              ${(tooltipData.data.costo || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Precio Venta:</span>
                            <span className="font-medium text-blue-600">
                              ${(tooltipData.data.precioventa || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Margen:</span>
                            <span className="font-medium text-purple-600">
                              ${(tooltipData.data.margenutilidad || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Costo %:</span>
                            <span className="font-medium text-orange-600">
                              {(tooltipData.data.costoporcentual || 0).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botón Comparar Costo */}
                      <div className="mt-3 pt-2 border-t border-slate-200">
                        <Button
                          onClick={handleCompareFromTooltip}
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs"
                        >
                          Comparar Costo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal de comparación */}
              <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent text-center">
                      Comparación de Costos: {selectedPointDetails?.platilloNombre}
                    </DialogTitle>
                    <DialogDescription className="text-center text-slate-600">
                      Comparando datos actuales vs. fecha seleccionada ({selectedPointDetails?.fecha})
                    </DialogDescription>
                  </DialogHeader>

                  {selectedPointDetails && platilloActual && platilloHistorico && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                      {/* Tarjeta de Información Actual */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/60 to-indigo-50/80 backdrop-blur-sm rounded-xl border border-blue-200/30"></div>
                        <Card className="rounded-xl text-card-foreground relative border-0 bg-transparent shadow-lg">
                          <CardHeader className="text-center pb-4">
                            <CardTitle className="text-xl font-bold text-blue-700 flex items-center justify-center gap-2">
                              📊 Información Actual
                            </CardTitle>
                            <p className="text-sm text-slate-600">Datos más recientes del platillo</p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="h-[95px] flex justify-center mb-4">
                              <img
                                src={platilloActual.imgurl || "/placeholder.svg"}
                                className="w-24 h-24 object-cover rounded-full border-4 border-blue-200/50"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Platillo</p>
                                <p className="text-lg font-bold text-slate-800">{platilloActual.nombre}</p>
                              </div>

                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Menú</p>
                                <p className="text-lg font-semibold text-slate-800">{platilloActual.menu}</p>
                              </div>

                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Costo Total</p>
                                <p className="text-2xl font-bold text-green-400">
                                  ${platilloActual.costototal.toFixed(2)}
                                </p>
                                {renderComparison(platilloActual.costototal, platilloHistorico.costototal)}
                              </div>

                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Precio de Venta</p>
                                <p className="text-2xl font-bold text-blue-400">
                                  ${platilloActual.precioventa.toFixed(2)}
                                </p>
                                {renderComparison(platilloActual.precioventa, platilloHistorico.precioventa)}
                              </div>

                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Margen de Utilidad</p>
                                <p className="text-2xl font-bold text-purple-400">
                                  ${platilloActual.margenutilidad.toFixed(2)}
                                </p>
                                {renderComparison(platilloActual.margenutilidad, platilloHistorico.margenutilidad)}
                              </div>

                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Costo Porcentual</p>
                                <p className="text-2xl font-bold text-orange-400">
                                  {platilloActual.costoporcentual.toFixed(2)}%
                                </p>
                                {renderComparison(platilloActual.costoporcentual, platilloHistorico.costoporcentual)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Tarjeta de Información Histórica */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-white/60 to-orange-50/80 backdrop-blur-sm rounded-xl border border-amber-200/30"></div>
                        <Card className="relative border-0 bg-transparent shadow-lg">
                          <CardHeader className="text-center pb-4">
                            <CardTitle className="text-xl font-bold text-amber-700 flex items-center justify-center gap-2">
                              📅 Información Histórica
                            </CardTitle>
                            <p className="text-sm text-slate-600">Datos del {selectedPointDetails.fecha}</p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-center mb-4">
                              <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-center justify-center border-4 border-amber-200/50">
                                <span className="text-2xl">📊</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Platillo</p>
                                <p className="text-lg font-semibold text-slate-800">{platilloHistorico.platillo}</p>
                              </div>

                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Fecha</p>
                                <p className="text-lg font-semibold text-slate-800">{selectedPointDetails.fecha}</p>
                              </div>

                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Costo Total</p>
                                <p className="text-2xl font-bold text-green-400">
                                  ${platilloHistorico.costototal.toFixed(2)}
                                </p>
                              </div>

                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Precio de Venta</p>
                                <p className="text-2xl font-bold text-blue-400">
                                  ${platilloHistorico.precioventa.toFixed(2)}
                                </p>
                              </div>

                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Margen de Utilidad</p>
                                <p className="text-2xl font-bold text-purple-400">
                                  ${platilloHistorico.margenutilidad.toFixed(2)}
                                </p>
                              </div>

                              <div className="backdrop-blur-sm rounded-lg p-3">
                                <p className="text-sm text-slate-600 font-medium">Costo Porcentual</p>
                                <p className="text-2xl font-bold text-orange-400">
                                  {platilloHistorico.costoporcentual.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 via-slate-50/60 to-gray-100/80 backdrop-blur-sm rounded-3xl"></div>
          <Card className="relative border-0 bg-white/70 backdrop-blur-md shadow-xl rounded-3xl">
            <CardContent className="p-12 text-center">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <p className="text-lg text-slate-600 font-medium">
                  No hay datos disponibles para el platillo y rango de fechas seleccionados.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
