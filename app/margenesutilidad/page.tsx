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
  type PlatilloMargin,
  type PlatilloComparisonData, // Importar la nueva interfaz
} from "@/app/actions/margenes-actions"
import {
  obtenerCambiosCostosPlatillos,
  obtenerCambiosCostosRecetas,
  obtenerIngredientesAumentoPrecio,
  obtenerIngredientesDisminucionPrecio,
  obtenerHotelesPorRol,
  obtenerDetallesPlatilloTooltip,
  obtenerDetallesRecetaTooltip,
} from "@/app/actions/dashboard-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandList, CommandGroup, CommandInput, CommandItem, CommandEmpty } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon, SearchIcon, CheckIcon, ChefHat, HelpCircle, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "@/components/ui/loader2"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getTopMarginPlatillos,
  getBottomMarginPlatillos,
  getPlatilloDetailsForTooltip,
  type MarginPlatilloSummary,
  type PlatilloDetail,
} from "@/app/actions/margenes-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
]

const añosDisponibles = [{ id: 2025, nombre: "2025" }]

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
      }
    }
    loadVariacionCostos()
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

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Estadísticas Costos</h1>

      {/* Nueva sección de Variación de Costos */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-orange-800">
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6" />
              Variacion Costos(Top 5)
            </div>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-5 w-5 text-orange-600 hover:text-orange-800 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md p-4 bg-white border border-orange-200 shadow-lg">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-orange-800 text-sm">Variacion de Costos(top 5)</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Esta sección compara el costo actual de la receta con el mes anterior seleccionado en las opciones
                      Mes y Año mostrando la variación porcentual entre estos 2 costos (Costo Mes Actual vs Costo Mes
                      Anterior). Le ayuda a identificar tendencias de costos rápidamente mostrando las 5 recetas con
                      mayor porcentaje de variación, de esta manera ayuda a identificar que recetas han subido su costo
                      drásticamente conforme al mes anterior y así tomar decisiones informadas sobre precios y
                      proveedores.
                    </p>
                    <div className="border-t border-orange-100 pt-2">
                      <p className="text-xs font-medium text-orange-700 mb-1">Modo de Consultar:</p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Seleccionar un Hotel, Mes y Año de las opciones del listado para poder consultar mi top 10
                        recetas con mayor variación de costos.
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros para la sección de variación de costos */}
          <div className="flex items-center gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="hotel-variacion">Hotel</Label>
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
              <Label htmlFor="mes-variacion">Mes</Label>
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
              <Label htmlFor="año-variacion">Año</Label>
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

          {/* Contenido de la sección de variación de costos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjetas de análisis de costos */}
            <div className="bg-gradient-to-r col-span-3 from-amber-50 to-orange-50 border border-orange-100 w-[1100px]  rounded-lg p-4">
              <Tabs defaultValue="platillos" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="platillos" className="text-xs">
                    Recetas
                  </TabsTrigger>
                  <TabsTrigger value="recetas" className="text-xs">
                    SubRecetas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="platillos" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-1 h-[400px] w-full overflow-y-auto">
                    {cambiosPlatillos.length >= 0 ? (
                      cambiosPlatillos.slice(0, 5).map((platillo, index) => (
                        <TooltipProvider key={index}>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Card
                                className="rounded-xs border bg-card text-card-foreground p-3 bg-gradient-to-r h-[100px] w-64 from-orange-50 to-red-50 border-orange-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onMouseEnter={() => platillo.id && cargarDetallesPlatilloTooltip(platillo.id)}
                              >
                                <div className="grid grid-cols-3 grid-rows-2 h-16">
                                  {/* Nombre del platillo - ocupa 2 columnas en la primera fila */}
                                  <div className="col-span-2 row-span-1">
                                    <h4 className="text-sm font-semibold text-gray-800 truncate leading-tight">
                                      {platillo.nombre}
                                    </h4>
                                  </div>

                                  {/* Variación % - ocupa 1 columna y 2 filas del lado derecho */}
                                  <div className="col-span-1 row-span-2 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-200">
                                    <div
                                      className={`text-lg font-bold ${platillo.variacion_porcentaje > 0 ? "text-red-600" : "text-green-600"}`}
                                    >
                                      +{Math.abs(platillo.variacion_porcentaje).toFixed(2)}%
                                    </div>
                                  </div>

                                  {/* Costo inicial - primera columna, segunda fila */}
                                  <div className="col-span-1 row-span-1">
                                    <div className="text-xs text-gray-500">Mes Anterior</div>
                                    <div className="text-sm font-medium text-gray-700">
                                      ${platillo.costo_inicial.toFixed(2)}
                                    </div>
                                  </div>

                                  {/* Costo actual - segunda columna, segunda fila */}
                                  <div className="col-span-1 row-span-1">
                                    <div className="text-xs text-gray-500">Mes Actual</div>
                                    <div className="text-sm font-medium text-gray-700">
                                      ${platillo.costo_actual.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm p-0 bg-white/95 backdrop-blur-sm border border-orange-200 shadow-2xl rounded-xl overflow-hidden">
                              {loadingTooltip ? (
                                <div className="flex items-center justify-center p-4">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                                  <span className="ml-2 text-sm text-gray-600">Cargando...</span>
                                </div>
                              ) : detallesPlatilloTooltip ? (
                                <div className="bg-gradient-to-br from-orange-50/90 to-red-50/90">
                                  <div className="p-4 border-b border-orange-200/50 bg-gradient-to-r from-orange-100/80 to-red-100/80">
                                    <div className="flex items-center gap-3">
                                      {detallesPlatilloTooltip.imgurl && (
                                        <img
                                          src={detallesPlatilloTooltip.imgurl || "/placeholder.svg"}
                                          alt={detallesPlatilloTooltip.nombre}
                                          className="w-12 h-12 rounded-lg object-cover border-2 border-orange-200/50"
                                        />
                                      )}
                                      <div>
                                        <h4 className="font-bold text-orange-800 text-sm">
                                          {detallesPlatilloTooltip.nombre}
                                        </h4>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div className="bg-white/60 rounded-lg p-2 border border-orange-200/50">
                                        <span className="text-gray-600">Costo Elaboracion:</span>
                                        <p className="font-bold text-green-600">
                                          ${detallesPlatilloTooltip.costototal.toFixed(2)}
                                        </p>
                                      </div>
                                      <div className="bg-white/60 rounded-lg p-2 border border-orange-200/50">
                                        <span className="text-gray-600">Costo Total:</span>
                                        <p className="font-bold text-blue-600">
                                          ${detallesPlatilloTooltip.costoadministrativo.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 text-center text-gray-500">
                                  <p className="text-sm">No se pudo cargar la información</p>
                                </div>
                              )}
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ))
                    ) : (
                      <Card className="p-4 bg-gray-50 border-gray-200">
                        <div className="text-center text-sm text-gray-500">No hay cambios significativos</div>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="recetas" className="mt-4">
                  <div className="h-[330px] w-full space-y-2 overflow-y-auto">
                    {cambiosRecetas.length >= 0 ? (
                      cambiosRecetas.slice(0, 3).map((receta, index) => (
                        <TooltipProvider key={index}>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Card
                                className="rounded-xs border bg-card text-card-foreground p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onMouseEnter={() => receta.id && cargarDetallesRecetaTooltip(receta.id)}
                              >
                                <div className="grid grid-cols-3 grid-rows-2 h-16">
                                  {/* Nombre de la receta - ocupa 2 columnas en la primera fila */}
                                  <div className="col-span-2 row-span-1">
                                    <h4 className="text-sm font-semibold text-gray-800 truncate leading-tight">
                                      {receta.nombre}
                                    </h4>
                                  </div>

                                  {/* Variación % - ocupa 1 columna y 2 filas del lado derecho */}
                                  <div className="col-span-1 row-span-2 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-200">
                                    <div
                                      className={`text-lg font-bold ${receta.variacion_porcentaje > 0 ? "text-red-600" : "text-green-600"}`}
                                    >
                                      {receta.variacion_porcentaje.toFixed(2)}%
                                    </div>
                                  </div>

                                  {/* Costo inicial - primera columna, segunda fila */}
                                  <div className="col-span-1 row-span-1">
                                    <div className="text-xs text-gray-500">Mes Anterior</div>
                                    <div className="text-sm font-medium text-gray-700">
                                      ${receta.costo_inicial.toFixed(2)}
                                    </div>
                                  </div>

                                  {/* Costo actual - segunda columna, segunda fila */}
                                  <div className="col-span-1 row-span-1">
                                    <div className="text-xs text-gray-500">Mes Actual</div>
                                    <div className="text-sm font-medium text-gray-700">
                                      ${receta.costo_actual.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm p-0 bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-xl overflow-hidden">
                              {loadingTooltip ? (
                                <div className="flex items-center justify-center p-4">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  <span className="ml-2 text-sm text-gray-600">Cargando...</span>
                                </div>
                              ) : detallesRecetaTooltip ? (
                                <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90">
                                  <div className="p-4 border-b border-blue-200/50 bg-gradient-to-r from-blue-100/80 to-indigo-100/80">
                                    <div className="flex items-center gap-3">
                                      {detallesRecetaTooltip.imgurl && (
                                        <img
                                          src={detallesRecetaTooltip.imgurl || "/placeholder.svg"}
                                          alt={detallesRecetaTooltip.nombre}
                                          className="w-12 h-12 rounded-lg object-cover border-2 border-blue-200/50"
                                        />
                                      )}
                                      <div>
                                        <h4 className="font-bold text-blue-800 text-sm">
                                          {detallesRecetaTooltip.nombre}
                                        </h4>
                                        <p className="text-xs text-blue-600">{detallesRecetaTooltip.hotel}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div className="bg-white/60 rounded-lg p-2 border border-blue-200/50">
                                        <span className="text-gray-600">Costo:</span>
                                        <p className="font-bold text-green-600">
                                          ${detallesRecetaTooltip.costo.toFixed(2)}
                                        </p>
                                      </div>
                                      <div className="bg-white/60 rounded-lg p-2 border border-blue-200/50">
                                        <span className="text-gray-600">Cantidad:</span>
                                        <p className="font-bold text-blue-600">
                                          {detallesRecetaTooltip.cantidad.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-2 border border-blue-200/50">
                                      <span className="text-gray-600">Unidad Base:</span>
                                      <p className="font-semibold text-gray-800">{detallesRecetaTooltip.unidadbase}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 text-center text-gray-500">
                                  <p className="text-sm">No se pudo cargar la información</p>
                                </div>
                              )}
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ))
                    ) : (
                      <Card className="p-4 bg-gray-50 border-gray-200">
                        <div className="text-center text-sm text-gray-500">No hay cambios significativos</div>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="frmEstadisticaBuscar" className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="ddlMenu">Menú</Label>
              <Select value={selectedMenuId} onValueChange={setSelectedMenuId} disabled={isLoadingMenus}>
                <SelectTrigger id="ddlMenu" name="ddlMenu" className="w-full">
                  <SelectValue placeholder="Selecciona un menú" />
                </SelectTrigger>
                <SelectContent>
                  {menuOptions.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id.toString()}>
                      {menu.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="txtPlatilloNombre">Platillo</Label>
              <Popover open={isPlatilloPopoverOpen} onOpenChange={setIsPlatilloPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPlatilloPopoverOpen}
                    className="w-full justify-between bg-white text-gray-900"
                  >
                    {selectedPlatilloName || "Selecciona un platillo..."}
                    <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                  <Command>
                    <CommandInput
                      placeholder="Buscar platillo..."
                      value={platilloSearchTerm}
                      onValueChange={(value) => {
                        setPlatilloSearchTerm(value)
                        setSelectedPlatilloName(value)
                        setSelectedPlatilloId(null)
                      }}
                    />
                    <CommandList>
                      {isLoadingPlatillosDropdown ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No se encontraron platillos.</CommandEmpty>
                          <CommandGroup>
                            {platilloOptions.map((platillo) => (
                              <CommandItem
                                key={platillo.id}
                                value={platillo.nombre}
                                onSelect={() => {
                                  setSelectedPlatilloId(platillo.id)
                                  setSelectedPlatilloName(platillo.nombre)
                                  setPlatilloSearchTerm(platillo.nombre)
                                  setIsPlatilloPopoverOpen(false)
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedPlatilloId === platillo.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {platillo.nombre}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="txtFechaInicial">Fecha Inicial</Label>
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
                id="txtFechaInicial"
                name="txtFechaInicial"
                type="hidden"
                value={fechaInicial ? format(fechaInicial, "yyyy-MM-dd") : ""}
                maxLength={80}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="txtFechaFinal">Fecha Final</Label>
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
                id="txtFechaFinal"
                name="txtFechaFinal"
                type="hidden"
                value={fechaFinal ? format(fechaFinal, "yyyy-MM-dd") : ""}
                maxLength={80}
              />
            </div>

            <Button
              id="btnEstadisticaBuscar"
              name="btnEstadisticaBuscar"
              type="button"
              onClick={handleSearch}
              className="w-full h-10 mt-auto flex items-center justify-center text-black"
              style={{ backgroundColor: "#82ffea", fontSize: "12px" }}
              disabled={isLoadingChartData || isLoadingMargins || isLoadingComparisonChart}
            >
              {isLoadingChartData || isLoadingMargins || isLoadingComparisonChart ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Top Margen Utilidad */}

      </div>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Márgenes de Utilidad de Platillos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMargins ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : platillosWithMargins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platillo</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead>Margen Utilidad (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platillosWithMargins.map((platillo) => (
                  <TableRow key={platillo.id}>
                    <TableCell className="font-medium">{platillo.nombre}</TableCell>
                    <TableCell>${platillo.costo.toFixed(2)}</TableCell>
                    <TableCell>${platillo.precio_venta.toFixed(2)}</TableCell>
                    <TableCell>{platillo.margen_utilidad.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500">No hay platillos registrados o datos de margen disponibles.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
