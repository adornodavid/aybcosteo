"use client"

/* ==================================================
  Imports
================================================== */
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Hotel,
  Building,
  Menu,
  Utensils,
  Package,
  ChefHat,
  Target,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  HelpCircle,
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import {
  obtenerResumenesDashboard,
  obtenerCambiosCostosPlatillos,
  obtenerCambiosCostosRecetas,
  obtenerMejoresMargenesUtilidad,
  obtenerPeoresMargenesUtilidad,
  obtenerAlertasCostoPorcentual,
  obtenerIngredientesAumentoPrecio,
  obtenerIngredientesDisminucionPrecio,
  obtenerHotelesPorRol,
  obtenerRestaurantesPorHotel,
  obtenerMenusPorRestaurante,
  obtenerPlatillosPorMenu,
  obtenerHistoricoCosteo,
  obtenerTopIngredientesPorCosto,
  buscarPlatillosPorNombre,
  buscarRecetasPorNombre,
  obtenerHistoricoCosteoRecetas,
  obtenerDetallesPlatilloActual,
  obtenerDetallesPlatilloIngredientesHistorico,
  obtenerDetallesPlatilloRecetasHistorico,
  obtenerDetallesPlatilloTooltip,
  obtenerDetallesRecetaTooltip,
} from "@/app/actions/dashboard-actions"
import {
  getPlatilloCostHistory,
  getPlatilloActualInfo,
  getPlatilloHistoricoInfo,
  type CostHistoryItem,
  type PlatilloActualInfo,
  type PlatilloHistoricoInfo,
} from "@/app/actions/analisis-costos-actions"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  LineChart,
  ReferenceLine,
} from "recharts"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

/* ==================================================
  Interfaces, tipados, clases
================================================== */
interface ResumenesDashboard {
  hoteles: number
  restaurantes: number
  menus: number
  platillos: number
  ingredientes: number
}

interface DatosSesion {
  UsuarioId: number
  Email: string
  NombreCompleto: string
  HotelId: number
  RolId: number
  Permisos: string
  SesionActiva: boolean
}

interface CambioCosto {
  id?: number
  nombre: string
  costo_inicial: number
  costo_actual: number
  variacion_porcentaje: number
}

interface MargenUtilidad {
  platilloid: number
  nombrePlatillo: string
  nombreHotel: string
  nombreMenu: string
  nombreRestaurante: string
  costoTotal: number
  precioVenta: number
  margenUtilidad: number
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

interface DatoHistorico {
  mes: string
  costo: number
  fechaUltima: string | null
}

interface DetallesPlatilloTooltip {
  id: number
  imgurl?: string
  hotel: string
  restaurante: string
  menu: string
  nombre: string
  costototal: number
  precioventa: number
  precioconiva: number
  margenutilidad: number
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

// Tipo para los datos procesados por platillo y menú
interface PlatilloDataset {
  id: string // Cambio: ahora es string para incluir platilloid_menuid
  platilloid: number
  menuid: number
  nombre: string
  color: string
  data: CostHistoryItem[]
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
]

const añosDisponibles = [{ id: 2025, nombre: "2025" }]

/* ==================================================
  Componente Principal, Pagina
================================================== */
export default function DashboardPage() {
  // --- Variables especiales ---
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // --- Estados ---
  const [resumenes, setResumenes] = useState<ResumenesDashboard | null>(null)
  const [sesion, setSesion] = useState<DatosSesion | null>(null)
  const [loading, setLoading] = useState(true)

  // Estados para las nuevas secciones
  const [cambiosPlatillos, setCambiosPlatillos] = useState<CambioCosto[]>([])
  const [cambiosRecetas, setCambiosRecetas] = useState<CambioCosto[]>([])

  const [mejoresMargenesUtilidad, setMejoresMargenesUtilidad] = useState<MargenUtilidad[]>([])
  const [peoresMargenesUtilidad, setPeoresMargenesUtilidad] = useState<MargenUtilidad[]>([])
  const [alertasCostoPorcentual, setAlertasCostoPorcentual] = useState<any[]>([])
  const [ingredientesAumento, setIngredientesAumento] = useState<CambioIngrediente[]>([])
  const [ingredientesDisminucion, setIngredientesDisminucion] = useState<CambioIngrediente[]>([])

  // Estados para el gráfico histórico
  const [hoteles, setHoteles] = useState<OpcionSelect[]>([])
  const [restaurantes, setRestaurantes] = useState<OpcionSelect[]>([])
  const [menus, setMenus] = useState<OpcionSelect[]>([])
  const [platillos, setPlatillos] = useState<OpcionSelect[]>([])
  const [datosHistorico, setDatosHistorico] = useState<DatoHistorico[]>([])

  // Estados de filtros
  const [hotelSeleccionado, setHotelSeleccionado] = useState<string>("")
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState<string>("-1")
  const [menuSeleccionado, setMenuSeleccionado] = useState<string>("-1")
  const [platilloSeleccionado, setPlatilloSeleccionado] = useState<string>("")
  const [loadingGrafico, setLoadingGrafico] = useState(false)

  // Estados para búsqueda de platillos
  const [busquedaPlatillo, setBusquedaPlatillo] = useState<string>("")
  const [platillosBusqueda, setPlatillosBusqueda] = useState<OpcionSelect[]>([])
  const [mostrarDropdownPlatillo, setMostrarDropdownPlatillo] = useState(false)
  const [platilloSeleccionadoObj, setPlatilloSeleccionadoObj] = useState<OpcionSelect | null>(null)

  // Estados para búsqueda de recetas
  const [busquedaReceta, setBusquedaReceta] = useState<string>("")
  const [recetasBusqueda, setRecetasBusqueda] = useState<OpcionSelect[]>([])
  const [mostrarDropdownReceta, setMostrarDropdownReceta] = useState(false)
  const [recetaSeleccionadaObj, setRecetaSeleccionadaObj] = useState<OpcionSelect | null>(null)
  const [datosHistoricoRecetas, setDatosHistoricoRecetas] = useState<DatoHistorico[]>([])
  const [loadingGraficoRecetas, setLoadingGraficoRecetas] = useState(false)

  // Estados de filtros de fecha con valores por defecto
  const fechaActual = new Date()
  const fechaanterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() -1, 1)
  const mesAnterior = fechaActual.getMonth()
  const añoActual = fechaActual.getFullYear()

  const [mesSeleccionado, setMesSeleccionado] = useState<string>(mesAnterior.toString())
  const [añoSeleccionado, setAñoSeleccionado] = useState<string>(añoActual.toString())
  const [topIngredientesCosto, setTopIngredientesCosto] = useState<any[]>([])

  // Estados para el modal de detalles del platillo
  const [modalAbierto, setModalAbierto] = useState(false)
  const [platilloSeleccionadoModal, setPlatilloSeleccionadoModal] = useState<CambioCosto | null>(null)
  const [detallesActuales, setDetallesActuales] = useState<any[]>([])
  const [ingredientesHistoricos, setIngredientesHistoricos] = useState<any[]>([])
  const [recetasHistoricas, setRecetasHistoricas] = useState<any[]>([])
  const [loadingModal, setLoadingModal] = useState(false)
  const [elementosDiferentes, setElementosDiferentes] = useState<any>({})

  // Estados para tooltips de análisis de costos
  const [detallesPlatilloTooltip, setDetallesPlatilloTooltip] = useState<DetallesPlatilloTooltip | null>(null)
  const [detallesRecetaTooltip, setDetallesRecetaTooltip] = useState<DetallesRecetaTooltip | null>(null)
  const [loadingTooltip, setLoadingTooltip] = useState(false)

  // Estados para el nuevo gráfico de análisis de costos
  const [fechaInicial, setFechaInicial] = useState<string>(fechaanterior.toString())
  const [fechaFinal, setFechaFinal] = useState<string>(fechaActual.toString())
  const [chartData, setChartData] = useState<CostHistoryItem[]>([])
  const [platillosDatasets, setPlatillosDatasets] = useState<PlatilloDataset[]>([])
  const [selectedPointDetails, setSelectedPointDetails] = useState<SelectedPointDetails | null>(null)
  const [platilloActual, setPlatilloActual] = useState<PlatilloActualInfo | null>(null)
  const [platilloHistorico, setPlatilloHistorico] = useState<PlatilloHistoricoInfo | null>(null)
  const [loadingAnalisisCostos, setLoadingAnalisisCostos] = useState(false)

  // Estados para loading de secciones
  const [loadingVariacionCostos, setLoadingVariacionCostos] = useState(false)
  const [loadingInsumosVariacion, setLoadingInsumosVariacion] = useState(false)

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

  // Procesar datos para crear datasets por platillo y menú
  const processDataByPlatillo = () => {
    if (chartData.length === 0) return []

    // Obtener combinaciones únicas de platilloid y menuid
    const uniqueCombinations = Array.from(new Set(chartData.map((item) => `${item.platilloid}_${item.menuid}`)))
    
    console.log("Combinaciones únicas encontradas:", uniqueCombinations)
    console.log("Datos del chart:", chartData)

    // Crear dataset para cada combinación platillo-menú
    const datasets: PlatilloDataset[] = uniqueCombinations.map((combination, index) => {
      const [platilloId, menuId] = combination.split('_').map(Number)
      const combinationData = chartData.filter((item) => item.platilloid === platilloId && item.menuid === menuId)
      const platilloNombre = combinationData[0]?.nombreplatillo || `Platillo ${platilloId}`
      const menuNombre = combinationData[0]?.nombremenu || `Menu ${menuId}`

      console.log(`Dataset ${combination}:`, combinationData.length, "registros")

      return {
        id: combination,
        platilloid: platilloId,
        menuid: menuId,
        nombre: `${platilloNombre} (${menuNombre})`,
        color: colors[index % colors.length],
        data: combinationData.sort((a, b) => new Date(a.fechacreacion).getTime() - new Date(b.fechacreacion).getTime()),
      }
    })

    console.log("Datasets procesados:", datasets)
    return datasets
  }

  // Crear datos combinados para el gráfico
  const combinedChartData = () => {
    if (chartData.length === 0) return []

    // Obtener todas las fechas únicas y ordenarlas
    const allDates = Array.from(new Set(chartData.map((item) => item.fechacreacion))).sort()

    // Crear el array de datos combinados
    return allDates.map((fecha) => {
      const dataPoint: any = { fechacreacion: fecha }

      // Para cada combinación platillo-menú, buscar si tiene datos en esta fecha
      platillosDatasets.forEach((dataset) => {
        const itemForDate = dataset.data.find((item) => item.fechacreacion === fecha)
        if (itemForDate) {
          dataPoint[`platillo_${dataset.id}`] = itemForDate.costoporcentual
          // Guardar referencia al item completo para el tooltip
          dataPoint[`item_${dataset.id}`] = itemForDate
        } else {
          // Importante: establecer null para fechas sin datos en lugar de omitir la propiedad
          dataPoint[`platillo_${dataset.id}`] = null
          dataPoint[`item_${dataset.id}`] = null
        }
      })

      return dataPoint
    })
  }

  //--- Carga Inicial ---
  useEffect(() => {
    const validarSeguridadYCargarDatos = async () => {
      try {
        // Validar cookies de sesión del lado del cliente
        console.log("Sesion de user: ", user.SesionActiva)

        // Validaciones de seguridad como especificas
        if (user.SesionActiva !== true) {
          console.log("Variable de user: SesionActiva es falsa")
          router.push("/login")
          return
        }

        if (!user.RolId || user.RolId === "0" || user.RolId === "") {
          console.log("Variable de user: RolId es 0 o es ")
          router.push("/login")
          return
        }

        setSesion({
          UsuarioId: user.UsuarioId,
          Email: user.Email,
          NombreCompleto: user.NombreCompleto,
          HotelId: user.HotelId,
          RolId: user.RolId,
          Permisos: user.Permisos,
          SesionActiva: user.SesionActiva,
        })

        // Cargar resúmenes del dashboard
        const data = await obtenerResumenesDashboard()
        if (data.success) {
          setResumenes(data.data)
        }

        // Cargar datos para las nuevas secciones
        const [
          mejoresMargenesData,
          peoresMargenesData,
        ] = await Promise.all([
          obtenerMejoresMargenesUtilidad(),
          obtenerPeoresMargenesUtilidad(),
        ])

        if (mejoresMargenesData.success) setMejoresMargenesUtilidad(mejoresMargenesData.data)
        if (peoresMargenesData.success) setPeoresMargenesUtilidad(peoresMargenesData.data)

        console.log("loging", ingredientesAumento.nombre)

        // Cargar hoteles para el gráfico
        const hotelesData = await obtenerHotelesPorRol()
        if (hotelesData.success) {
          setHoteles(hotelesData.data)

          // Si el usuario tiene un hotel específico, seleccionarlo automáticamente
          if (user.HotelId && user.HotelId > 0) {
            const hotelUsuario = hotelesData.data.find((h) => h.id === user.HotelId)
            if (hotelUsuario) {
              setHotelSeleccionado(hotelUsuario.id.toString())
              // Cargar restaurantes del hotel del usuario
              const restaurantesData = await obtenerRestaurantesPorHotel(user.HotelId)
              if (restaurantesData.success) {
                // Agregar opción "Todos" al inicio
                const restaurantesConTodos = [{ id: -1, nombre: "Todos" }, ...restaurantesData.data]
                setRestaurantes(restaurantesConTodos)

                // Como el restaurante por defecto es "Todos" (-1), cargar todos los menús
                const todosLosMenus = []
                for (const restaurante of restaurantesData.data) {
                  const menusData = await obtenerMenusPorRestaurante(restaurante.id)
                  if (menusData.success) {
                    todosLosMenus.push(...menusData.data)
                  }
                }
                // Agregar opción "Todos" al inicio de los menús
                const menusConTodos = [{ id: -1, nombre: "Todos" }, ...todosLosMenus]
                setMenus(menusConTodos)
              }

            }
          }
        }
      } catch (error) {
        console.error("Error validando seguridad:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    validarSeguridadYCargarDatos()
  }, [router])

  // Manejar cambio de hotel
  const handleHotelChange = async (hotelId: string) => {
    setHotelSeleccionado(hotelId)
    setRestauranteSeleccionado("-1")
    setMenuSeleccionado("-1")
    setPlatilloSeleccionado("")
    setRestaurantes([])
    setMenus([])
    setPlatillos([])
    setDatosHistorico([])
    setBusquedaPlatillo("")
    setPlatilloSeleccionadoObj(null)
    setBusquedaReceta("")
    setRecetaSeleccionadaObj(null)
    setDatosHistoricoRecetas([])

    if (hotelId) {
      const restaurantesData = await obtenerRestaurantesPorHotel(Number.parseInt(hotelId))
      if (restaurantesData.success) {
        // Agregar opción "Todos" al inicio
        const restaurantesConTodos = [{ id: -1, nombre: "Todos" }, ...restaurantesData.data]
        setRestaurantes(restaurantesConTodos)
      }
    }
  }

  // Manejar cambio de restaurante
  const handleRestauranteChange = async (restauranteId: string) => {
    setRestauranteSeleccionado(restauranteId)
    setMenuSeleccionado("-1")
    setPlatilloSeleccionado("")
    setMenus([])
    setPlatillos([])
    setDatosHistorico([])

    if (restauranteId && restauranteId !== "-1") {
      const menusData = await obtenerMenusPorRestaurante(Number.parseInt(restauranteId))
      if (menusData.success) {
        // Agregar opción "Todos" al inicio
        const menusConTodos = [{ id: -1, nombre: "Todos" }, ...menusData.data]
        setMenus(menusConTodos)
      }
    } else if (restauranteId === "-1") {
      // Si selecciona "Todos" los restaurantes, cargar todos los menús del hotel
      if (hotelSeleccionado) {
        // Obtener todos los restaurantes del hotel
        const restaurantesData = await obtenerRestaurantesPorHotel(Number.parseInt(hotelSeleccionado))
        if (restaurantesData.success) {
          // Obtener menús de todos los restaurantes
          const todosLosMenus = []
          for (const restaurante of restaurantesData.data) {
            const menusData = await obtenerMenusPorRestaurante(restaurante.id)
            if (menusData.success) {
              todosLosMenus.push(...menusData.data)
            }
          }
          // Agregar opción "Todos" al inicio
          const menusConTodos = [{ id: -1, nombre: "Todos" }, ...todosLosMenus]
          setMenus(menusConTodos)
        }
      }
    }
  }

  // Manejar cambio de menú
  const handleMenuChange = async (menuId: string) => {
    setMenuSeleccionado(menuId)
    setPlatilloSeleccionado("")
    setPlatillos([])
    setDatosHistorico([])

    if (menuId && menuId !== "-1") {
      const platillosData = await obtenerPlatillosPorMenu(Number.parseInt(menuId))
      if (platillosData.success) {
        setPlatillos(platillosData.data)
      }
    } else if (menuId === "-1") {
      // Si selecciona "Todos" los menús, cargar todos los platillos
      const todosLosPlatillos = []
      for (const menu of menus) {
        if (menu.id !== -1) {
          const platillosData = await obtenerPlatillosPorMenu(menu.id)
          if (platillosData.success) {
            todosLosPlatillos.push(...platillosData.data)
          }
        }
      }
      setPlatillos(todosLosPlatillos)
    }
  }

  // Manejar búsqueda de platillos
  const handleBusquedaPlatillo = async (valor: string) => {
    setBusquedaPlatillo(valor)

    if (valor.length >= 0 && hotelSeleccionado) {
      const resultados = await buscarPlatillosPorNombre(valor, Number.parseInt(hotelSeleccionado))
      if (resultados.success) {
        setPlatillosBusqueda(resultados.data)
        setMostrarDropdownPlatillo(true)
      }
    } else {
      setPlatillosBusqueda([])
      setMostrarDropdownPlatillo(false)
    }
  }

  // Seleccionar platillo del dropdown
  const seleccionarPlatillo = async (platillo: OpcionSelect) => {

    if (!fechaInicial || !fechaFinal ) {
      return
    }
    console.log("pla", platillo)
    setLoadingAnalisisCostos(true)

    const platilloIdNum = platillo.id
    const menuIdNum = menuSeleccionado !== "-1" ? Number.parseInt(menuSeleccionado) : -1
    const restauranteIdNum = restauranteSeleccionado !== "-1" ? Number.parseInt(restauranteSeleccionado) : -1
    const hotelIdNum = Number.parseInt(hotelSeleccionado)

    const history = await getPlatilloCostHistory(
      platilloIdNum,
      format(fechaInicial, "yyyy-MM-dd"),
      format(fechaFinal, "yyyy-MM-dd"),
      menuIdNum,
      restauranteIdNum,
      hotelIdNum,
    )
    setChartData(history)

    // Limpiar la selección de punto específico al hacer nueva búsqueda
    setSelectedPointDetails(null)
    setPlatilloActual(null)
    setPlatilloHistorico(null)

    setLoadingAnalisisCostos(false)
    
    setPlatilloSeleccionadoObj(platillo)
    setBusquedaPlatillo(platillo.nombre)
    setMostrarDropdownPlatillo(false)

    // Cargar datos históricos del platillo
    if (hotelSeleccionado ) {
      setLoadingGrafico(true)
      const historicoData = await obtenerHistoricoCosteo(
        Number.parseInt(hotelSeleccionado),
        platillo.id,
      )

      if (historicoData.success) {
        setDatosHistorico(historicoData.data)
      }
      setLoadingGrafico(false)
    }

    // También actualizar el gráfico de análisis de costos si hay fechas seleccionadas
    if (fechaInicial && fechaFinal) {
      await handleSearchAnalisisCostos()
    }
  }

  // Manejar búsqueda de recetas
  const handleBusquedaReceta = async (valor: string) => {
    setBusquedaReceta(valor)

    if (valor.length >= 0 && hotelSeleccionado) {
      const resultados = await buscarRecetasPorNombre(valor, Number.parseInt(hotelSeleccionado))
      if (resultados.success) {
        setRecetasBusqueda(resultados.data)
        setMostrarDropdownReceta(true)
      }
    } else {
      setRecetasBusqueda([])
      setMostrarDropdownReceta(false)
    }
  }

  // Seleccionar receta del dropdown
  const seleccionarReceta = async (receta: OpcionSelect) => {
    setRecetaSeleccionadaObj(receta)
    setBusquedaReceta(receta.nombre)
    setMostrarDropdownReceta(false)

    // Cargar datos históricos de la receta
    if (hotelSeleccionado) {
      setLoadingGraficoRecetas(true)
      const historicoData = await obtenerHistoricoCosteoRecetas(Number.parseInt(hotelSeleccionado), receta.id)

      if (historicoData.success) {
        setDatosHistoricoRecetas(historicoData.data)
      }
      setLoadingGraficoRecetas(false)
    }
  }

  // Manejar cambio de filtros de fecha
  const handleFiltrosFechaChange = async () => {
    if (mesSeleccionado && añoSeleccionado && hotelSeleccionado) {
      const topIngredientesData = await obtenerTopIngredientesPorCosto(
        Number.parseInt(mesSeleccionado),
        Number.parseInt(añoSeleccionado),
        Number.parseInt(hotelSeleccionado),
      )

      if (topIngredientesData.success) {
        setTopIngredientesCosto(topIngredientesData.data)
      }

      // Cargar alertas de costo porcentual con el hotel seleccionado
      const alertasData = await obtenerAlertasCostoPorcentual(Number.parseInt(hotelSeleccionado))
      if (alertasData.success) {
        setAlertasCostoPorcentual(alertasData.data)
      }

      // Activar loading para variación de costos
      setLoadingVariacionCostos(true)

      // Cargar cambios de platillos y recetas con los filtros seleccionados
      const cambiosPlatillosData = await obtenerCambiosCostosPlatillos(
        Number.parseInt(mesSeleccionado),
        Number.parseInt(añoSeleccionado),
        Number.parseInt(hotelSeleccionado),
      )

      const cambiosRecetasData = await obtenerCambiosCostosRecetas(
        Number.parseInt(mesSeleccionado),
        Number.parseInt(añoSeleccionado),
        Number.parseInt(hotelSeleccionado),
      )

      if (cambiosPlatillosData.success) setCambiosPlatillos(cambiosPlatillosData.data)
      if (cambiosRecetasData.success) setCambiosRecetas(cambiosRecetasData.data)

      // Desactivar loading para variación de costos
      setLoadingVariacionCostos(false)

      // Activar loading para insumos variación
      setLoadingInsumosVariacion(true)

      // Cargar cambios de ingredientes aumento con los filtros seleccionados
      const cambiosIngredientesAumentoData = await obtenerIngredientesAumentoPrecio(
        Number.parseInt(mesSeleccionado),
        Number.parseInt(añoSeleccionado),
        Number.parseInt(hotelSeleccionado),
      )

      // Cargar cambios de ingredientes disminución con los filtros seleccionados
      const cambiosIngredientesDisminucionData = await obtenerIngredientesDisminucionPrecio(
        Number.parseInt(mesSeleccionado),
        Number.parseInt(añoSeleccionado),
        Number.parseInt(hotelSeleccionado),
      )

      if (cambiosIngredientesAumentoData.success) {
        setIngredientesAumento(cambiosIngredientesAumentoData.data)
      }
      if (cambiosIngredientesDisminucionData.success) {
        setIngredientesDisminucion(cambiosIngredientesDisminucionData.data)
      }

      // Desactivar loading para insumos variación
      setLoadingInsumosVariacion(false)
    }
  }

  // Efecto para cargar datos cuando cambien los filtros
  useEffect(() => {
    handleFiltrosFechaChange()
  }, [mesSeleccionado, añoSeleccionado, hotelSeleccionado])

  // Actualizar datasets cuando cambian los datos del gráfico
  useEffect(() => {
    const datasets = processDataByPlatillo()
    setPlatillosDatasets(datasets)
  }, [chartData])

  // Función para manejar la búsqueda del análisis de costos
  const handleSearchAnalisisCostos = async () => {
    if (!fechaInicial || !fechaFinal || !platilloSeleccionadoObj) {
      return
    }

    setLoadingAnalisisCostos(true)

    const platilloIdNum = platilloSeleccionadoObj.id
    const menuIdNum = menuSeleccionado !== "-1" ? Number.parseInt(menuSeleccionado) : -1
    const restauranteIdNum = restauranteSeleccionado !== "-1" ? Number.parseInt(restauranteSeleccionado) : -1
    const hotelIdNum = Number.parseInt(hotelSeleccionado)

    const history = await getPlatilloCostHistory(
      platilloIdNum,
      format(fechaInicial, "yyyy-MM-dd"),
      format(fechaFinal, "yyyy-MM-dd"),
      menuIdNum,
      restauranteIdNum,
      hotelIdNum,
    )
    setChartData(history)

    // Limpiar la selección de punto específico al hacer nueva búsqueda
    setSelectedPointDetails(null)
    setPlatilloActual(null)
    setPlatilloHistorico(null)

    setLoadingAnalisisCostos(false)
  }

  // Función para manejar el clic en los puntos
  const handlePointClick = async (data: any, datasetId: string, index: any) => {
    try {
      const originalItem = index.payload

      if (!originalItem) {
        return
      }

      const fechaOriginal = originalItem.fechacreacion

      if (!fechaOriginal || !/^\d{4}-\d{2}-\d{2}$/.test(fechaOriginal)) {
        return
      }

      // Extraer platilloid y menuid del datasetId
      const [platilloId, menuId] = datasetId.split('_').map(Number)

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
        menuId: menuId,
      }

      setSelectedPointDetails(pointDetails)

      // Obtener información actual y histórica del platillo
      const [actualInfo, historicoInfo] = await Promise.all([
        getPlatilloActualInfo(platilloId, menuId),
        getPlatilloHistoricoInfo(platilloId, fechaOriginal),
      ])

      setPlatilloActual(actualInfo)
      setPlatilloHistorico(historicoInfo)
    } catch (error) {
      console.error("Error in handlePointClick:", error)
    }
  }

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

  // Función para manejar el clic en las tarjetas de variación de costos
  const handleTarjetaClick = async (platillo: CambioCosto) => {
    if (!platillo.id) return

    // Buscar el platillo en la lista de búsqueda o agregarlo
    let platilloObj = platillosBusqueda.find((p) => p.id === platillo.id)

    if (!platilloObj) {
      platilloObj = { id: platillo.id, nombre: platillo.nombre }
    }

    // Actualizar el input de receta
    setPlatilloSeleccionadoObj(platilloObj)
    setBusquedaPlatillo(platillo.nombre)
    setMostrarDropdownPlatillo(false)

    // Actualizar gráfico histórico si hay filtros seleccionados
    if (hotelSeleccionado) {
      setLoadingGrafico(true)
      const restauranteIdNum = restauranteSeleccionado !== "-1" ? Number.parseInt(restauranteSeleccionado) : -1
      const menuIdNum = menuSeleccionado !== "-1" ? Number.parseInt(menuSeleccionado) : -1
      
      const historicoData = await obtenerHistoricoCosteo(
        Number.parseInt(hotelSeleccionado),
        platillo.id,
      )

      if (historicoData.success) {
        setDatosHistorico(historicoData.data)
      }
      setLoadingGrafico(false)
    }

    // Actualizar gráfico de análisis de costos si hay fechas seleccionadas
    if (fechaInicial && fechaFinal) {
      setLoadingAnalisisCostos(true)

      const platilloIdNum = platillo.id
      const menuIdNum = menuSeleccionado !== "-1" ? Number.parseInt(menuSeleccionado) : -1
      const restauranteIdNum = restauranteSeleccionado !== "-1" ? Number.parseInt(restauranteSeleccionado) : -1
      const hotelIdNum = Number.parseInt(hotelSeleccionado)

      const history = await getPlatilloCostHistory(
        platilloIdNum,
        format(fechaInicial, "yyyy-MM-dd"),
        format(fechaFinal, "yyyy-MM-dd"),
        menuIdNum,
        restauranteIdNum,
        hotelIdNum,
      )
      setChartData(history)

      // Limpiar la selección de punto específico
      setSelectedPointDetails(null)
      setPlatilloActual(null)
      setPlatilloHistorico(null)

      setLoadingAnalisisCostos(false)
    }
  }

  // Función para abrir el modal con detalles del platillo
  const abrirModalDetalles = async (platillo: CambioCosto) => {
    if (!platillo.id) return

    setPlatilloSeleccionadoModal(platillo)
    setModalAbierto(true)
    setLoadingModal(true)

    try {
      // Cargar detalles actuales
      const detallesActualesData = await obtenerDetallesPlatilloActual(platillo.id)

      // Cargar detalles históricos de ingredientes
      const ingredientesHistoricosData = await obtenerDetallesPlatilloIngredientesHistorico(
        platillo.id,
        Number.parseInt(hotelSeleccionado),
        Number.parseInt(mesSeleccionado),
        Number.parseInt(añoSeleccionado),
      )

      // Cargar detalles históricos de recetas
      const recetasHistoricasData = await obtenerDetallesPlatilloRecetasHistorico(
        platillo.id,
        Number.parseInt(hotelSeleccionado),
        Number.parseInt(mesSeleccionado),
        Number.parseInt(añoSeleccionado),
      )

      if (detallesActualesData.success) setDetallesActuales(detallesActualesData.data)
      if (ingredientesHistoricosData.success) setIngredientesHistoricos(ingredientesHistoricosData.data)
      if (recetasHistoricasData.success) setRecetasHistoricas(recetasHistoricasData.data)

      // Identificar elementos con costos diferentes
      if (detallesActualesData.success && ingredientesHistoricosData.success && recetasHistoricasData.success) {
        const diferencias = identificarElementosDiferentes(
          detallesActualesData.data,
          ingredientesHistoricosData.data,
          recetasHistoricasData.data,
        )
        setElementosDiferentes(diferencias)
      }
    } catch (error) {
      console.error("Error cargando detalles del platillo:", error)
    } finally {
      setLoadingModal(false)
    }
  }

  // Función para cerrar el modal
  const cerrarModal = () => {
    setModalAbierto(false)
    setPlatilloSeleccionadoModal(null)
    setDetallesActuales([])
    setIngredientesHistoricos([])
    setRecetasHistoricas([])
    setElementosDiferentes({})
  }

  // Función para identificar elementos con costos diferentes
  const identificarElementosDiferentes = (
    detallesActuales: any[],
    ingredientesHistoricos: any[],
    recetasHistoricas: any[],
  ) => {
    const diferencias: { [key: string]: boolean } = {}

    // Crear un mapa de los elementos históricos para facilitar la búsqueda
    const mapaHistoricos = new Map()

    // Agregar ingredientes históricos al mapa
    ingredientesHistoricos.forEach((ing) => {
      mapaHistoricos.set(ing.codigoelemento, {
        costoparcial: ing.ingredientecostoparcial,
        tipo: "ingrediente",
      })
    })

    // Agregar recetas históricas al mapa
    recetasHistoricas.forEach((rec) => {
      mapaHistoricos.set(rec.codigoelemento, {
        costoparcial: rec.ingredientecostoparcial,
        tipo: "receta",
      })
    })

    // Comparar los detalles actuales con los históricos
    detallesActuales.forEach((detalle) => {
      const historicoItem = mapaHistoricos.get(detalle.codigoelemento)

      if (historicoItem) {
        // Si el costo es diferente, marcar como diferente
        if (Math.abs(detalle.costoparcial - historicoItem.costoparcial) >= 0.0001) {
          diferencias[detalle.codigoelemento] = true
        }
      }
    })

    return diferencias
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

  // Función para navegar a la página de márgenes de utilidad
  const navegarAMargenesUtilidad = () => {
    router.push("/margenesutilidad")
  }

  // Componente personalizado para el tooltip del gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          <p className="text-blue-600">{`Costo: $${payload[0].value.toFixed(2)}`}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="relative w-24 h-24 mb-4">
            <Image
              src="https://nxtrsibnomdqmzcrwedc.supabase.co/storage/v1/object/public/imagenes/AnimationGif/CargarPage.gif"
              alt="Procesando..."
              width={300}
              height={300}
              unoptimized
              className="absolute inset-0 animate-bounce-slow"
            />
          </div>
          <p className="text-lg font-semibold text-gray-800">Cargando Pagina...</p>
        </div>
      </div>
    )
  }

  if (!sesion) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Sección Título de la página con bienvenida en la esquina derecha */}
      <div className="w-full flex justify-between items-center">
        {/* Título centrado */}
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-light text-gray-800 tracking-wide">Sistema de Costeo</h1>
          <h2 className="text-xl font-light text-gray-600 mt-1">Dashboard</h2>
        </div>

        {/* Bienvenida en la esquina derecha */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-gray-700">
              Hola <span className="font-medium text-blue-700">{sesion.NombreCompleto}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sección de slide infinito de resúmenes */}
      <div className="w-full -mx-6 px-6 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
        <div className="bg-white relative overflow-hidden">
          <div className="flex animate-scroll-left space-x-6">
            {/* Primera iteración de los datos */}
            <div className="flex space-x-6 min-w-max">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Hotel className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{resumenes?.hoteles || 0}</div>
                    <div className="text-sm text-gray-600">Hoteles Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{resumenes?.restaurantes || 0}</div>
                    <div className="text-sm text-gray-600">Restaurantes Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Menu className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{resumenes?.menus || 0}</div>
                    <div className="text-sm text-gray-600">Menús Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Utensils className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{resumenes?.platillos || 0}</div>
                    <div className="text-sm text-gray-600">Recetas Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Package className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{resumenes?.ingredientes || 0}</div>
                    <div className="text-sm text-gray-600">Ingredientes Activos</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Segunda iteración de los datos (para el efecto infinito) */}
            <div className="flex space-x-6 min-w-max">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Hotel className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{resumenes?.hoteles || 0}</div>
                    <div className="text-sm text-gray-600">Hoteles Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{resumenes?.restaurantes || 0}</div>
                    <div className="text-sm text-gray-600">Restaurantes Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Menu className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{resumenes?.menus || 0}</div>
                    <div className="text-sm text-gray-600">Menús Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Utensils className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{resumenes?.platillos || 0}</div>
                    <div className="text-sm text-gray-600">Recetas Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Package className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{resumenes?.ingredientes || 0}</div>
                    <div className="text-sm text-gray-600">Ingredientes Activos</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tercera iteración de los datos (para asegurar continuidad) */}
            <div className="flex space-x-6 min-w-max">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Hotel className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{resumenes?.hoteles || 0}</div>
                    <div className="text-sm text-gray-600">Hoteles Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{resumenes?.restaurantes || 0}</div>
                    <div className="text-sm text-gray-600">Restaurantes Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Menu className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{resumenes?.menus || 0}</div>
                    <div className="text-sm text-gray-600">Menús Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Utensils className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{resumenes?.platillos || 0}</div>
                    <div className="text-sm text-gray-600">Recetas Activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Package className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{resumenes?.ingredientes || 0}</div>
                    <div className="text-sm text-gray-600">Ingredientes Activos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de filtros de fecha */}
      <div className="w-full">
        <Card className="rounded-xs border bg-card text-card-foreground">
          <CardContent className="p-1">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotel">Hotel</Label>
                <Select value={hotelSeleccionado} onValueChange={handleHotelChange}>
                  <SelectTrigger>
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

              <div className="space-y-1">
                <Label htmlFor="restaurante">Restaurante</Label>
                <Select
                  value={restauranteSeleccionado}
                  onValueChange={handleRestauranteChange}
                  disabled={!hotelSeleccionado}
                >
                  <SelectTrigger className="flex h-10 w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                    <SelectValue placeholder="Seleccionar restaurante" />
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

              <div className="space-y-1 w-[390px]">
                <Label htmlFor="menu">Menú</Label>
                <Select value={menuSeleccionado} onValueChange={handleMenuChange} disabled={!restauranteSeleccionado}>
                  <SelectTrigger className="flex h-10 w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                    <SelectValue placeholder="Seleccionar menú" />
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

              <div className="space-y-2">
                <Label htmlFor="mes">Mes</Label>
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
                <Label htmlFor="año">Año</Label>
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
          </CardContent>
        </Card>
      </div>

      {/* Sección del gráfico histórico de costeo */}
      <div className="w-full flex grid grid-cols-4 grid-rows-4 h-[650px] gap-6">

      {/* Nuevo gráfico de análisis de costos */}
      <div className="w-full col-span-2 row-span-2 h-[320px]">
        <Card className="rounded-xs border bg-card text-card-foreground shadow bg-gradient-to-r h-[320px] from-cyan-50 to-blue-50 border-cyan-200">
          <CardHeader className="flex flex-col space-y-1.5 p-2">
            <CardTitle className="flex items-center justify-between text-cyan-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Variación de Costos y Precios de Venta
              </div>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-5 w-5 text-cyan-600 hover:text-cyan-800 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md p-4 bg-white border border-cyan-200 shadow-lg">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-cyan-800 text-sm">Variación de Costos y Precios de Venta</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Este gráfico muestra la evolución de los costos porcentuales de las recetas seleccionadas en un
                        rango de fechas específico. Permite identificar tendencias y variaciones en los costos de
                        producción y precios de venta a lo largo del tiempo.
                      </p>
                      <div className="border-t border-cyan-100 pt-2">
                        <p className="text-xs font-medium text-cyan-700 mb-1">Modo de Consultar:</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Seleccionar un Hotel, Restaurante, Menú, Receta y un rango de fechas para poder consultar la
                          información del gráfico.
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-1 pt-0 space-y-2">
            {/* Filtros de fecha */}
            <div className="mb-3 p-2 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex items-end gap-4">
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
                </div>

                <div className="space-y-1 relative">
                  <Label htmlFor="platillo">Receta</Label>
                  <Input
                    type="text"
                    placeholder="Buscar receta..."
                    value={busquedaPlatillo}
                    onChange={(e) => handleBusquedaPlatillo(e.target.value)}
                    disabled={!menuSeleccionado}
                    className="w-full"
                  />
                  {mostrarDropdownPlatillo && platillosBusqueda.length >= 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {platillosBusqueda.map((platillo) => (
                        <div
                          key={platillo.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => seleccionarPlatillo(platillo)}
                        >
                          {platillo.nombre}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loadingAnalisisCostos ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando datos del gráfico...</p>
                </div>
              </div>
            ) : combinedChartData().length > 0 ? (
              <>
                {/* Leyenda de platillos 
                {platillosDatasets.length > 1 && (
                  <div className="mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                    <h4 className="text-lg font-semibold mb-3 text-slate-700">Platillos en el gráfico:</h4>
                    <div className="flex flex-wrap gap-4">
                      {platillosDatasets.map((dataset) => (
                        <div key={dataset.id} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: dataset.color }}
                          ></div>
                          <span className="text-sm font-medium text-slate-700">{dataset.nombre}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}*/}

                <div className="h-[190px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={combinedChartData()} accessibilityLayer width={700} height={300}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" strokeWidth={1} />
                      <XAxis
                        dataKey="fechacreacion"
                        minTickGap={20}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                      />
                      <YAxis
                        domain={[0, 60]}
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
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || payload.length === 0) return null

                          // Filtrar solo los payloads que tienen valor (no null/undefined)
                          const validPayloads = payload.filter((p) => p.value !== null && p.value !== undefined)

                          if (validPayloads.length === 0) return null

                          return (
                            <div className="bg-white/95 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl p-2 max-w-sm">
                              <div className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">
                                Fecha: {label}
                              </div>
                              <div className="space-y-2">
                                {validPayloads.map((entry, index) => {
                                  const datasetId = entry.dataKey?.toString().replace("platillo_", "")
                                  const originalItem = entry.payload[`item_${datasetId}`]

                                  if (!originalItem) return null

                                  const dataset = platillosDatasets.find((d) => d.id === datasetId)

                                  return (
                                    <div
                                      key={index}
                                      className="space-y-1 p-2 bg-slate-50/50 rounded-lg border border-slate-200/30"
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: dataset?.color || "#8884d8" }}
                                        ></div>
                                        <span className="font-semibold text-slate-800">{dataset?.nombre || "N/A"}</span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-slate-600">Menú:</span>
                                          <span className="font-medium text-slate-800">
                                            {originalItem.nombremenu || "N/A"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-600">Fecha:</span>
                                          <span className="font-medium text-slate-800">
                                            {originalItem.fechacreacion || "N/A"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-600">Costo:</span>
                                          <span className="font-medium text-green-600">
                                            ${(originalItem.costo || 0).toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-600">Precio Venta:</span>
                                          <span className="font-medium text-blue-600">
                                            ${(originalItem.precioventa || 0).toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-600">Margen:</span>
                                          <span className="font-medium text-purple-600">
                                            ${(originalItem.margenutilidad || 0).toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-600">Costo %:</span>
                                          <span className="font-medium text-orange-600">
                                            {(originalItem.costoporcentual || 0).toFixed(2)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        }}
                      />

                      {/* Generar una línea por cada combinación platillo-menú */}
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
                            r: 6,
                            filter: `drop-shadow(0 2px 4px ${dataset.color}30)`,
                            cursor: "pointer",
                          }}
                          activeDot={{
                            r: 8,
                            fill: dataset.color,
                            stroke: "#ffffff",
                            strokeWidth: 3,
                            filter: `drop-shadow(0 4px 8px ${dataset.color}40)`,
                            cursor: "pointer",
                            onClick: (data: any, index) => {
                              handlePointClick(data, dataset.id, index)
                            },
                          }}
                          name={dataset.nombre}
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
                </div>

                {/* Mostrar tarjetas comparativas cuando se selecciona un punto */}
                {selectedPointDetails && platilloActual && platilloHistorico ? (
                  <div className="mt-8 space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent mb-2">
                        Comparación de Costos: {selectedPointDetails.platilloNombre}
                      </h3>
                      <p className="text-slate-600">
                        Comparando datos actuales vs. fecha seleccionada ({selectedPointDetails.fecha})
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Tarjeta de Información Actual */}
                      <div className="relative h-[705px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/60 to-indigo-50/80 backdrop-blur-sm rounded-xs border border-blue-200/30"></div>
                        <Card className="rounded-xs text-card-foreground relative border-0 bg-transparent shadow-lg">
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
                              <div className="backdrop-blur-sm rounded-xs p-1">
                                <p className="text-sm text-slate-600 font-medium">Platillo</p>
                                <p className="text-lg font-bold text-slate-800">{platilloActual.nombre}</p>
                              </div>

                              <div className="backdrop-blur-sm rounded-xs p-1">
                                <p className="text-sm text-slate-600 font-medium">Menú</p>
                                <p className="text-lg font-semibold text-slate-800">{platilloActual.menu}</p>
                              </div>

                              <div className="backdrop-blur-sm rounded-xs p-1">
                                <p className="text-sm text-slate-600 font-medium">Costo Total</p>
                                <p className="text-2xl font-bold text-green-400">
                                  ${platilloActual.costototal.toFixed(2)}
                                </p>
                                {renderComparison(platilloActual.costototal, platilloHistorico.costototal)}
                              </div>

                              <div className="backdrop-blur-sm rounded-xs p-1">
                                <p className="text-sm text-slate-600 font-medium">Precio de Venta</p>
                                <p className="text-2xl font-bold text-blue-400">
                                  ${platilloActual.precioventa.toFixed(2)}
                                </p>
                                {renderComparison(platilloActual.precioventa, platilloHistorico.precioventa)}
                              </div>

                              <div className="backdrop-blur-sm rounded-xs p-1">
                                <p className="text-sm text-slate-600 font-medium">Margen de Utilidad</p>
                                <p className="text-2xl font-bold text-purple-400">
                                  ${platilloActual.margenutilidad.toFixed(2)}
                                </p>
                                {renderComparison(platilloActual.margenutilidad, platilloHistorico.margenutilidad)}
                              </div>

                              <div className="backdrop-blur-sm rounded-xs p-1">
                                <p className="text-sm text-slate-600 font-medium">Costo Porcentual</p>
                                <p className="text-2xl font-bold text-orange-400">
                                  ${platilloActual.costoporcentual.toFixed(2)}
                                </p>
                                {renderComparison(platilloActual.costoporcentual, platilloHistorico.costoporcentual)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Tarjeta de Información Histórica */}
                      <div className="relative h-[715px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-white/60 to-orange-50/80 backdrop-blur-sm rounded-2xl border border-amber-200/30"></div>
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
                              <div className="backdrop-blur-sm rounded-xl p-2">
                                <p className="text-sm text-slate-600 font-medium">Platillo</p>
                                <p className="text-lg font-semibold text-slate-800">{platilloHistorico.platillo}</p>
                              </div>

                              <div className="backdrop-blur-sm rounded-xl p-2">
                                <p className="text-sm text-slate-600 font-medium">Fecha</p>
                                <p className="text-lg font-semibold text-slate-800">{selectedPointDetails.fecha}</p>
                              </div>

                              <div className="backdrop-blur-sm rounded-xl p-3">
                                <p className="text-sm text-slate-600 font-medium">Costo Total</p>
                                <p className="text-2xl font-bold text-green-400">
                                  ${platilloHistorico.costototal.toFixed(2)}
                                </p>
                              </div>

                              <div className="backdrop-blur-sm rounded-xl p-3">
                                <p className="text-sm text-slate-600 font-medium">Precio de Venta</p>
                                <p className="text-2xl font-bold text-blue-400">
                                  ${platilloHistorico.precioventa.toFixed(2)}
                                </p>
                              </div>

                              <div className="backdrop-blur-sm rounded-xl p-3">
                                <p className="text-sm text-slate-600 font-medium">Margen de Utilidad</p>
                                <p className="text-2xl font-bold text-purple-400">
                                  ${platilloHistorico.margenutilidad.toFixed(2)}
                                </p>
                              </div>

                              <div className="backdrop-blur-sm rounded-xl p-3">
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

                    <div className="text-center">
                      <Button
                        onClick={() => {
                          setSelectedPointDetails(null)
                          setPlatilloActual(null)
                          setPlatilloHistorico(null)
                        }}
                        variant="outline"
                        size="sm"
                        className="text-slate-600 hover:text-slate-800"
                      >
                        Cerrar comparación
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {platilloSeleccionadoObj
                      ? "No hay datos disponibles para el rango de fechas seleccionado"
                      : "Selecciona una receta y rango de fechas para ver el gráfico"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
        
        {/* Tarjetas de análisis de costos del lado derecho */}
        <div className="w-4/4 row-span-4">
          <Card className="rounded-xs border bg-card text-card-foreground shadow bg-gradient-to-r h-[650px] from-amber-50 to-orange-50 border-orange-100">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-orange-800">
                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-orange-600" />
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
                          Esta sección compara el costo actual de la receta con el mes anterior seleccionado en las
                          opciones Mes y Año mostrando la variación porcentual entre estos 2 costos (Costo Mes Actual vs
                          Costo Mes Anterior). Le ayuda a identificar tendencias de costos rápidamente mostrando las 5
                          recetas con mayor porcentaje de variación, de esta manera ayuda a identificar que recetas han
                          subido su costo drásticamente conforme al mes anterior y así tomar decisiones informadas sobre
                          precios y proveedores.
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

            <CardContent className="p-4 pt-0">
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
                  <div className="h-[461px] space-y-2 w-full overflow-y-auto">
                    {loadingVariacionCostos ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Cargando variación de costos...</p>
                        </div>
                      </div>
                    ) : cambiosPlatillos.length >= 0 ? (
                      cambiosPlatillos.slice(0, 5).map((platillo, index) => (
                        <TooltipProvider key={index}>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Card
                                className="rounded-xs border bg-card text-card-foreground p-3 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleTarjetaClick(platillo)}
                                onMouseEnter={() => platillo.id && cargarDetallesPlatilloTooltip(platillo.id)}
                              >
                                <div className="grid grid-cols-3 grid-rows-4 h-20 gap-2">
                                  {/* Nombre del platillo - ocupa 2 columnas en la primera fila */}
                                  <div className="col-span-2 row-span-1">
                                    <h4 className="text-sm font-semibold text-gray-800 truncate leading-tight">
                                      {platillo.nombre}
                                    </h4>
                                  </div>

                                  {/* Variación % - ocupa 1 columna y 2 filas del lado derecho */}
                                  <div className="col-span-1 row-span-3 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-200">
                                    <div
                                      className={`text-lg font-bold ${platillo.variacion_porcentaje > 0 ? "text-red-600" : "text-green-600"}`}
                                    >
                                      +{Math.abs(platillo.variacion_porcentaje).toFixed(2)}%
                                    </div>
                                  </div>

                                  {/* Costo inicial - primera columna, segunda fila */}
                                  <div className="col-span-1 row-span-2">
                                    <div className="text-xs text-gray-500 w-32">Mes Anterior</div>
                                    <div className="text-sm font-medium text-gray-700">
                                      ${platillo.costo_inicial.toFixed(2)}
                                    </div>
                                  </div>

                                  {/* Costo actual - segunda columna, segunda fila */}
                                  <div className="col-span-1 row-span-2">
                                    <div className="text-xs text-gray-500">Mes Actual</div>
                                    <div className="text-sm font-medium text-gray-700">
                                      ${platillo.costo_actual.toFixed(2)}
                                    </div>
                                  </div>

                                  {/* Botón Ver detalle - ocupa 2 columnas en la tercera fila */}
                                  <div className="col-span-2 flex items-right justify-right row-span-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent rounded-md w-64 text-xs text-gray-600 hover:text-black-800 h-6 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        abrirModalDetalles(platillo)
                                      }}
                                    >
                                      
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye h-3 w-3 mr-1"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>Ver detalle
                                    </Button>
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

                  {/* Botón Ver Más */}
                  {/*<div className="mt-4 pt-2 border-t border-orange-200">
                    <Button
                      onClick={navegarAMargenesUtilidad}
                      variant="outline"
                      size="sm"
                      className="w-full text-orange-700 border-orange-300 hover:bg-orange-50 bg-transparent"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Más
                    </Button>
                  </div>*/}
                </TabsContent>

                <TabsContent value="recetas" className="mt-4">
                  <div className="h-[300px] w-full space-y-2 overflow-y-auto">
                    {loadingVariacionCostos ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Cargando variación de costos...</p>
                        </div>
                      </div>
                    ) : cambiosRecetas.length >= 0 ? (
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
                                    <div className="text-xs text-gray-500 w-32">Mes Anterior</div>
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

                  {/*<div className="mt-4 pt-2 border-t border-orange-200">
                    <Button
                      onClick={navegarAMargenesUtilidad}
                      variant="outline"
                      size="sm"
                      className="w-full text-orange-700 border-orange-300 hover:bg-orange-50 bg-transparent"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Más
                    </Button>
                  </div>*/}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* 4. Sección Insumos */}
        <div className="w-4/4 row-span-4">
          <Card className="rounded-xs border bg-card text-card-foreground shadow bg-gradient-to-r h-[650px] from-[#fdfaff] to-[#fdfaff] border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-purple-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  Insumos Var Costos
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-5 w-5 text-purple-600 hover:text-purple-800 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md p-4 bg-white border border-purple-200 shadow-lg">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-purple-800 text-sm">Insumos - Variaciones Costos(Top 5)</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Esta sección monitorea los cambios de precio en los ingredientes adquiridos. Compara el costo
                          unitario de cada ingrediente del mes anterior con el del mes actual, calcula el porcentaje de
                          variación para identificar y mostrar si los ingredientes tuvieron un Aumento o disminución de
                          precio conforme el mes anterior, se lista los 10 ingredientes con mayor aumento y los 10 con
                          mayor disminución.
                        </p>
                        <div className="bg-purple-50 p-2 rounded-md">
                          <p className="text-xs font-medium text-purple-700 mb-1">Objetivo:</p>
                          <p className="text-xs text-gray-600">
                            Identificar rápidamente las materias primas más críticas para tomar acciones.
                          </p>
                        </div>
                        <div className="border-t border-purple-100 pt-2">
                          <p className="text-xs font-medium text-purple-700 mb-1">Modo de Consultar:</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Seleccionar un Hotel, Mes y Año de las opciones del listado para poder consultar la
                            información en esta sección.
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Tabs defaultValue="aumentos" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="aumentos" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-xs">Incremento %</TabsTrigger>
                  <TabsTrigger value="disminuciones" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-xs">Disminucion %</TabsTrigger>
                </TabsList>

                <TabsContent value="aumentos" className="mt-4">
                  <div className="h-[450px] w-full overflow-y-auto">
                    {loadingInsumosVariacion ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Cargando variación de insumos...</p>
                        </div>
                      </div>
                    ) : ingredientesAumento.length > 0 ? (
                      <div className="space-y-2">
                        {ingredientesAumento.slice(0, 10).map((ingrediente, index) => (
                          <Card
                            key={index}
                            className="rounded-xs border bg-card text-card-foreground p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="grid grid-cols-3 grid-rows-2 h-16">
                              {/* Nombre del ingrediente - ocupa 2 columnas en la primera fila */}
                              <div className="col-span-2 row-span-1">
                                <h4 className="text-sm font-semibold text-gray-800 truncate leading-tight">
                                  {ingrediente.nombre}
                                </h4>
                              </div>

                              {/* Aumento % - ocupa 1 columna y 2 filas del lado derecho */}
                              <div className="col-span-1 row-span-2 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-200">
                                <div className="text-lg font-bold text-red-600">
                                  +{ingrediente.aumento_porcentaje?.toFixed(2)}%
                                </div>
                              </div>

                              {/* Costo inicial - primera columna, segunda fila */}
                              <div className="col-span-1 row-span-1">
                                <div className="text-xs text-gray-500 w-32">Mes Anterior</div>
                                <div className="text-sm font-medium text-gray-700">
                                  ${ingrediente.costo_inicial.toFixed(4)}
                                </div>
                              </div>

                              {/* Costo actual - segunda columna, segunda fila */}
                              <div className="col-span-1 row-span-1">
                                <div className="text-xs text-gray-500">Mes Actual</div>
                                <div className="text-sm font-medium text-gray-700">
                                  ${ingrediente.costo_actual.toFixed(4)}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay ingredientes con aumentos significativos</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Botón Ver Más */}
                  {/*<div className="mt-4 pt-2 border-t border-purple-200">
                    <Button
                      onClick={navegarAMargenesUtilidad}
                      variant="outline"
                      size="sm"
                      className="w-full text-purple-700 border-purple-200 hover:bg-purple-50 bg-transparent"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Más
                    </Button>
                  </div>*/}
                </TabsContent>

                <TabsContent value="disminuciones" className="mt-4">
                  <div className="h-[355px] w-full overflow-y-auto">
                    {loadingInsumosVariacion ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Cargando variación de insumos...</p>
                        </div>
                      </div>
                    ) : ingredientesDisminucion.length > 0 ? (
                      <div className="space-y-2">
                        {ingredientesDisminucion.slice(0, 10).map((ingrediente, index) => (
                          <Card
                            key={index}
                            className="rounded-xs border bg-card text-card-foreground p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="grid grid-cols-3 grid-rows-2 gap-2 h-16">
                              {/* Nombre del ingrediente - ocupa 2 columnas en la primera fila */}
                              <div className="col-span-2 row-span-1">
                                <h4 className="text-sm font-semibold text-gray-800 truncate leading-tight">
                                  {ingrediente.nombre}
                                </h4>
                              </div>

                              {/* Disminución % - ocupa 1 columna y 2 filas del lado derecho */}
                              <div className="col-span-1 row-span-2 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-200">
                                <div className="text-lg font-bold text-green-600">
                                  {ingrediente.disminucion_porcentaje?.toFixed(2)}%
                                </div>
                              </div>

                              {/* Costo inicial - primera columna, segunda fila */}
                              <div className="col-span-1 row-span-1">
                                <div className="text-xs text-gray-500 w-32">Mes Anterior</div>
                                <div className="text-sm font-medium text-gray-700">
                                  ${ingrediente.costo_inicial.toFixed(3)}
                                </div>
                              </div>

                              {/* Costo actual - segunda columna, segunda fila */}
                              <div className="col-span-1 row-span-1">
                                <div className="text-xs text-gray-500">Mes Actual</div>
                                <div className="text-sm font-medium text-gray-700">
                                  ${ingrediente.costo_actual.toFixed(3)}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay ingredientes con disminuciones significativas</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>


        {/* Gráfico del lado izquierdo */}
        <div className="col-span-2 row-span-2">
          <Card className="rounded-xs border bg-card text-card-foreground shadow bg-gradient-to-r h-[315px] from-cyan-50 to-blue-50 border-cyan-200">
            <CardHeader className="flex flex-col space-y-1.5 p-4">
              <CardTitle className="flex items-center justify-between text-cyan-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Histórico Costeo
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-5 w-5 text-cyan-600 hover:text-cyan-800 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md p-4 bg-white border border-cyan-200 shadow-lg">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-cyan-800 text-sm">Histórico Costeo</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Este gráfico muestra la evolución histórica de los costos de la receta seleccionada durante
                          los últimos meses. Cada barra representa el costo de elaboración que se tuvo para cada mes,
                          permitiendo identificar tendencias y variaciones en el costo de producción.
                        </p>
                        <div className="border-t border-cyan-100 pt-2">
                          <p className="text-xs font-medium text-cyan-700 mb-1">Modo de Consultar:</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Seleccionar un Hotel, Restaurante, Menú y Receta de las opciones del listado para poder
                            consultar la información del gráfico para la Receta seleccionada.
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs defaultValue="platillos" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="platillos" className="text-xs">
                    Recetas
                  </TabsTrigger>
                  <TabsTrigger value="recetas" className="text-xs">
                    Subrecetas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="platillos" className="mt-1">
                  {/* Filtros para platillos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    
                  </div>

                  {/* Gráfico de platillos */}
                  <div className="h-[200px] w-full">
                    {loadingGrafico ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Cargando datos...</p>
                        </div>
                      </div>
                    ) : datosHistorico.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosHistorico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                          <XAxis
                            dataKey="mes"
                            stroke="#0891b2"
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis stroke="#0891b2" fontSize={12} tickFormatter={(value) => `$${value.toFixed(2)}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="costo" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                          <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0891b2" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#67e8f9" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            {platilloSeleccionadoObj
                              ? "No hay datos históricos disponibles"
                              : "Selecciona todos los filtros para ver el gráfico"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="recetas" className="mt-4">
                  {/* Filtro para recetas */}
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div className="space-y-1 relative">
                      <Label htmlFor="receta">Receta</Label>
                      <Input
                        type="text"
                        placeholder="Buscar receta..."
                        value={busquedaReceta}
                        onChange={(e) => handleBusquedaReceta(e.target.value)}
                        disabled={!hotelSeleccionado}
                        className="w-full"
                      />
                      {mostrarDropdownReceta && recetasBusqueda.length >= 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {recetasBusqueda.map((receta) => (
                            <div
                              key={receta.id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => seleccionarReceta(receta)}
                            >
                              {receta.nombre}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gráfico de recetas */}
                  <div className="h-[300px] w-full">
                    {loadingGraficoRecetas ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Cargando datos...</p>
                        </div>
                      </div>
                    ) : datosHistoricoRecetas.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosHistoricoRecetas} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                          <XAxis
                            dataKey="mes"
                            stroke="#0891b2"
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis stroke="#0891b2" fontSize={12} tickFormatter={(value) => `$${value.toFixed(2)}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="costo" fill="url(#colorGradientRecetas)" radius={[4, 4, 0, 0]} />
                          <defs>
                            <linearGradient id="colorGradientRecetas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0891b2" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#67e8f9" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            {recetaSeleccionadaObj
                              ? "No hay datos históricos disponibles"
                              : "Selecciona una receta para ver el gráfico"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
  

      {/* Nuevo contenedor horizontal dividido en 3 */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primera sección - Tabla de Márgenes de Utilidad */}
        <div className="lg:col-span-1 h-[360px]">
          <Card className="rounded-xs h-80 border bg-card text-card-foreground shadow bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-green-800">
                <div className="flex items-center gap-2">
                  <Target className="h-6 w-6" />
                  Top Márgenes de Utilidad
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-5 w-5 text-green-600 hover:text-green-800 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md p-4 bg-white border border-green-200 shadow-lg">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-green-800 text-sm">Top Márgenes de Utilidad</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Esta sección revela la rentabilidad de mi receta. Calcula el margen de utilidad representado
                          en % de ganancia comparando su precio de venta contra su costo de elaboración y lista los Top
                          10 recetas con mayor margen.
                        </p>
                        <div className="bg-green-50 p-2 rounded-md">
                          <p className="text-xs font-medium text-green-700 mb-1">Objetivo:</p>
                          <p className="text-xs text-gray-600">
                            Identificar aquellos platillos con mayor rentabilidad para potenciar su venta y tomar
                            decisiones estratégicas sobre precios y costos.
                          </p>
                        </div>
                        <div className="border-t border-green-100 pt-2">
                          <p className="text-xs font-medium text-green-700 mb-1">Modo de Consultar:</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Seleccionar un Hotel, Mes y Año de las opciones del listado para poder consultar la
                            información en esta sección.
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full overflow-y-auto">
                {mejoresMargenesUtilidad.length > 0 ? (
                  <div className="space-y-1">
                    {/* Encabezados de tabla */}
                    <div className="grid grid-cols-2 gap-4 pb-2 border-b border-green-200 mb-3">
                      <div className="text-sm font-semibold text-green-800">Nombre Receta</div>
                      <div className="text-sm font-semibold text-green-800">Margen Utilidad</div>
                    </div>

                    {/* Filas de datos */}
                    {mejoresMargenesUtilidad.slice(0, 10).map((margen, index) => (
                      <TooltipProvider key={index}>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <div className="grid grid-cols-2 gap-4 py-2 hover:bg-green-100 rounded-lg px-2 transition-colors cursor-pointer group">
                              {/* Columna 1: Nombre de la receta */}
                              <div className="text-sm text-gray-800 truncate">{margen.nombrePlatillo}</div>

                              {/* Columna 2: Barra horizontal del margen */}
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-300 group-hover:from-green-600 group-hover:to-emerald-500"
                                    style={{ width: `${Math.min(margen.margenUtilidad, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-green-700 min-w-[40px] text-right">
                                  {margen.margenUtilidad.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm p-0 bg-white/95 backdrop-blur-sm border border-green-200 shadow-2xl rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-br from-green-50/90 to-emerald-50/90">
                              <div className="p-4 border-b border-green-200/50 bg-gradient-to-r from-green-100/80 to-emerald-100/80">
                                <h4 className="font-bold text-green-800 text-sm">{margen.nombrePlatillo}</h4>
                                <p className="text-xs text-green-600">{margen.nombreHotel}</p>
                              </div>
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="bg-white/60 rounded-lg p-2 border border-green-200/50">
                                    <span className="text-gray-600">Restaurante:</span>
                                    <p className="font-semibold text-gray-800">{margen.nombreRestaurante}</p>
                                  </div>
                                  <div className="bg-white/60 rounded-lg p-2 border border-green-200/50">
                                    <span className="text-gray-600">Menú:</span>
                                    <p className="font-semibold text-gray-800">{margen.nombreMenu}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="bg-white/60 rounded-lg p-2 border border-green-200/50">
                                    <span className="text-gray-600">Costo Total:</span>
                                    <p className="font-bold text-green-600">${margen.costoTotal.toFixed(2)}</p>
                                  </div>
                                  <div className="bg-white/60 rounded-lg p-2 border border-green-200/50">
                                    <span className="text-gray-600">Precio Venta:</span>
                                    <p className="font-bold text-blue-600">${margen.precioVenta.toFixed(2)}</p>
                                  </div>
                                </div>
                                <div className="bg-white/60 rounded-lg p-2 border border-green-200/50">
                                  <span className="text-gray-600">Margen Utilidad:</span>
                                  <p className="font-bold text-green-600">{margen.margenUtilidad.toFixed(2)}%</p>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay datos de márgenes disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segunda sección - Alertas de Costo Porcentual */}
        <div className="lg:col-span-1 h-[360px]">
          <Card className="rounded-xs h-80 border bg-card text-card-foreground shadow bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-yellow-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  Alertas de Costo Porcentual Alto
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-5 w-5 text-yellow-600 hover:text-yellow-800 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md p-4 bg-white border border-yellow-200 shadow-lg">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-yellow-800 text-sm">Alertas de Costo Porcentual Alto</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Esta sección muestra mi costo % que obtengo entre mi costo total de elaboración de mi receta /
                          el precio asignado de venta sin IVA, este costo % representa la rentabilidad del porcentaje de
                          ganancia y así conocer de mejor manera si el precio asignado a la venta al público debe ser
                          monitoreado.
                        </p>
                        <div className="bg-yellow-50 p-2 rounded-md border-l-4 border-yellow-400">
                          <p className="text-xs font-medium text-yellow-700 mb-1">⚠️ Importante:</p>
                          <p className="text-xs text-gray-600">
                            El costo % no debe superar el 30% ya que de lo contrario el precio asignado de venta no es
                            rentable para mi receta.
                          </p>
                        </div>
                        <div className="border-t border-yellow-100 pt-2">
                          <p className="text-xs font-medium text-yellow-700 mb-1">Modo de Consultar:</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Seleccionar un Hotel, Mes y Año de las opciones del listado para poder consultar la
                            información en esta sección.
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 w-full overflow-y-auto">
                {alertasCostoPorcentual.length > 0 ? (
                  <div className="space-y-1">
                    {/* Encabezados de tabla */}
                    <div className="grid grid-cols-2 gap-4 pb-2 border-b border-yellow-200 mb-3">
                      <div className="text-sm font-semibold text-yellow-800">Nombre Receta</div>
                      <div className="text-sm font-semibold text-yellow-800">Costo Porcentual</div>
                    </div>

                    {/* Filas de datos */}
                    <TooltipProvider>
                      {alertasCostoPorcentual.slice(0, 5).map((alerta, index) => (
                        <UITooltip key={index}>
                          <TooltipTrigger asChild>
                            <div className="grid grid-cols-2 gap-4 py-2 hover:bg-yellow-100 rounded-lg px-2 transition-colors cursor-pointer group">
                              {/* Columna 1: Nombre de la receta */}
                              <div className="text-sm text-gray-800 truncate">
                                {alerta.nombre || alerta.nombrePlatillo}
                              </div>

                              {/* Columna 2: Barra horizontal del costo porcentual */}
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      (alerta.costoporcentual || alerta.costoPorcentual) >= 50
                                        ? "bg-gradient-to-r from-red-500 to-red-600 group-hover:from-red-600 group-hover:to-red-700"
                                        : (alerta.costoporcentual || alerta.costoPorcentual) >= 35
                                          ? "bg-gradient-to-r from-orange-500 to-orange-600 group-hover:from-orange-600 group-hover:to-orange-700"
                                          : "bg-gradient-to-r from-yellow-500 to-amber-400 group-hover:from-yellow-600 group-hover:to-amber-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(alerta.costoporcentual || alerta.costoPorcentual, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-yellow-700 min-w-[40px] text-right">
                                  {(alerta.costoporcentual || alerta.costoPorcentual).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm p-0 bg-white/95 backdrop-blur-sm border border-yellow-200 shadow-2xl rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-br from-yellow-50/90 to-amber-50/90">
                              <div className="p-4 border-b border-yellow-200/50 bg-gradient-to-r from-yellow-100/80 to-amber-100/80">
                                <h4 className="font-bold text-yellow-800 text-sm">
                                  {alerta.platillonombre || alerta.nombrePlatillo}
                                </h4>
                                <p className="text-xs text-yellow-600">{alerta.hotel || alerta.nombreHotel}</p>
                              </div>
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="bg-white/60 rounded-lg p-2 border border-yellow-200/50">
                                    <span className="text-gray-600">Restaurante:</span>
                                    <p className="font-semibold text-gray-800">
                                      {alerta.restaurante || alerta.nombreRestaurante}
                                    </p>
                                  </div>
                                  <div className="bg-white/60 rounded-lg p-2 border border-yellow-200/50">
                                    <span className="text-gray-600">Menú:</span>
                                    <p className="font-semibold text-gray-800">{alerta.menu || alerta.nombreMenu}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="bg-white/60 rounded-lg p-2 border border-yellow-200/50">
                                    <span className="text-gray-600">Costo Total:</span>
                                    <p className="font-bold text-blue-600">
                                      ${(alerta.costohistorico || alerta.costohistorico)?.toFixed(2) || "N/A"}
                                    </p>
                                  </div>
                                  <div className="bg-white/60 rounded-lg p-2 border border-yellow-200/50">
                                    <span className="text-gray-600">Precio Venta:</span>
                                    <p className="font-bold text-green-600">
                                      ${(alerta.precioventa || alerta.precioVenta)?.toFixed(2) || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <div className="bg-white/60 rounded-lg p-2 border border-yellow-200/50">
                                  <span className="text-gray-600">Costo Porcentual:</span>
                                  <p className="font-bold text-yellow-600">
                                    {(alerta.costoporcentual || alerta.costoPorcentual).toFixed(2)}%
                                  </p>
                                </div>
                                <div className="bg-white/60 rounded-lg p-2 border border-yellow-200/50">
                                  <span className="text-gray-600">Fecha revision:</span>
                                  <p className="font-bold text-gray-800">
                                    {alerta.fechacreacion || alerta.fechacreacion}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay alertas de costo porcentual</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Ver Más */}
              {/*<div className="mt-4 pt-2 border-t border-yellow-200">
                <Button
                  onClick={navegarAMargenesUtilidad}
                  variant="outline"
                  size="sm"
                  className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-50 bg-transparent"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Más
                </Button>
              </div>*/}
            </CardContent>
          </Card>
        </div>

        {/* Tercera sección - Top Ingredientes por Costo */}
        <div className="lg:col-span-1 h-[360px]">
          <Card className="rounded-xs h-80 border bg-card text-card-foreground shadow bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-orange-800">
                <div className="flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  Ingredientes mayor Costo/Gasto
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-5 w-5 text-orange-600 hover:text-orange-800 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md p-4 bg-white border border-orange-200 shadow-lg">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-orange-800 text-sm">Top Ingredientes por Costo</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Este panel muestra el gasto total en materias primas utilizadas específicamente para la
                          elaboración de recetas para el mes y el año seleccionado. Ayuda a entender el costo directo de
                          la operación.
                        </p>
                        <div className="bg-orange-50 p-2 rounded-md">
                          <p className="text-xs font-medium text-orange-700 mb-1">Objetivo:</p>
                          <p className="text-xs text-gray-600">
                            Controlar y optimizar el gasto en insumos para mantener la rentabilidad.
                          </p>
                        </div>
                        <div className="border-t border-orange-100 pt-2">
                          <p className="text-xs font-medium text-orange-700 mb-1">Modo de Consultar:</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Seleccionar un Hotel, Mes y Año de las opciones del listado para poder consultar la
                            información en esta sección.
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 w-full overflow-y-auto">
                {topIngredientesCosto.length > 0 ? (
                  <div className="space-y-1">
                    {/* Encabezados de tabla */}
                    <div className="grid grid-cols-2 gap-4 pb-2 border-b border-orange-200 mb-3">
                      <div className="text-sm font-semibold text-orange-800">Nombre Ingrediente</div>
                      <div className="text-sm font-semibold text-orange-800">Costo Total</div>
                    </div>

                    {/* Filas de datos */}
                    {topIngredientesCosto.map((ingrediente, index) => (
                      <TooltipProvider key={index}>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <div className="grid grid-cols-2 gap-4 py-2 hover:bg-orange-100 rounded-lg px-2 transition-colors cursor-pointer group">
                              {/* Columna 1: Nombre del ingrediente */}
                              <div className="text-sm text-gray-800 truncate">{ingrediente.nombre}</div>

                              {/* Columna 2: Barra horizontal del costo */}
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-red-400 rounded-full transition-all duration-300 group-hover:from-orange-600 group-hover:to-red-500"
                                    style={{
                                      width: `${Math.min((ingrediente.costo / Math.max(...topIngredientesCosto.map((i) => i.costo))) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-orange-700 min-w-[60px] text-right">
                                  ${ingrediente.costo.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm p-0 bg-white/95 backdrop-blur-sm border border-orange-200 shadow-2xl rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-br from-orange-50/90 to-red-50/90">
                              <div className="p-4 border-b border-orange-200/50 bg-gradient-to-r from-orange-100/80 to-red-100/80">
                                <h4 className="font-bold text-orange-800 text-sm">{ingrediente.nombre}</h4>
                                <p className="text-xs text-orange-600">{ingrediente.codigo}</p>
                              </div>
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="bg-white/60 rounded-lg p-2 border border-orange-200/50">
                                    <span className="text-gray-600">Categoría:</span>
                                    <p className="font-semibold text-gray-800">{ingrediente.categoria || "N/A"}</p>
                                  </div>
                                  <div className="bg-white/60 rounded-lg p-2 border border-orange-200/50">
                                    <span className="text-gray-600">Unidad:</span>
                                    <p className="font-semibold text-gray-800">{ingrediente.unidadmedida || "N/A"}</p>
                                  </div>
                                </div>
                                <div className="bg-white/60 rounded-lg p-2 border border-orange-200/50">
                                  <span className="text-gray-600">Costo Total:</span>
                                  <p className="font-bold text-orange-600">${ingrediente.costo.toFixed(2)}</p>
                                </div>
                                {ingrediente.descripcion && (
                                  <div className="bg-white/60 rounded-lg p-2 border border-orange-200/50">
                                    <span className="text-gray-600">Descripción:</span>
                                    <p className="font-semibold text-gray-800 text-xs">{ingrediente.descripcion}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {mesSeleccionado && añoSeleccionado && hotelSeleccionado
                          ? "No hay datos de ingredientes disponibles"
                          : "Selecciona mes, año y hotel para ver los datos"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de detalles del platillo */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-8xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalles del Platillo: {platilloSeleccionadoModal?.nombre}</span>
            </DialogTitle>
          </DialogHeader>

          {loadingModal ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-2 text-gray-600">Cargando detalles...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Tarjeta derecha - Costo Histórico */}
              <Card className="rounded-xs border bg-card text-card-foreground shadow rounde-xs bg-gradient-to-r from-[#fffaf0] to-red-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Costo Platillo Histórico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="text-sm text-gray-600">
                        Costo Total ({mesesDelAño.find((m) => m.id === Number.parseInt(mesSeleccionado))?.nombre}{" "}
                        {añoSeleccionado})
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        ${platilloSeleccionadoModal?.costo_inicial.toFixed(2)}
                      </div>
                    </div>

                    {/* Tabla de ingredientes y recetas históricos combinada */}
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-orange-50 sticky top-0">
                            <tr>
                              <th className="px-1 py-1 text-left font-semibold text-orange-800">Tipo</th>
                              <th className="px-1 py-1 text-left font-semibold text-orange-800">Código</th>
                              <th className="px-1 py-1 text-left font-semibold text-orange-800">Elemento</th>
                              <th className="px-1 py-1 text-left font-semibold text-orange-800">Cantidad</th>
                              <th className="px-1 py-1 text-left font-semibold text-orange-800">Unidad</th>
                              <th className="px-1 py-1 text-right font-semibold text-orange-800">Costo Parcial</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ingredientesHistoricos.map((ingrediente, index) => {
                              const tieneVariacion = elementosDiferentes[ingrediente.codigoelemento]
                              return (
                                <tr
                                  key={index}
                                  className={`border-b hover:bg-orange-50 ${
                                    tieneVariacion ? "bg-red-100 border-l-4 border-l-red-500" : ""
                                  }`}
                                >
                                  <td className="px-1 py-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {ingrediente.tipoing || "Ingrediente"}
                                    </span>
                                  </td>
                                  <td className="px-1 py-1 font-mono text-xs">{ingrediente.codigoelemento}</td>
                                  <td className="px-1 py-1 font-medium">{ingrediente.nombreelemento}</td>
                                  <td className="px-1 py-1">{ingrediente.cantidading?.toFixed(2)}</td>
                                  <td className="px-1 py-1">{ingrediente.unidad}</td>
                                  <td className="px-1 py-1 text-right font-semibold text-orange-600">
                                    ${ingrediente.ingredientecostoparcial?.toFixed(2)}
                                  </td>
                                </tr>
                              )
                            })}

                            {recetasHistoricas.map((receta, index) => {
                              const tieneVariacion = elementosDiferentes[receta.codigoelemento]
                              return (
                                <tr
                                  key={`receta-${index}`}
                                  className={`border-b hover:bg-orange-50 ${
                                    tieneVariacion ? "bg-red-100 border-l-4 border-l-red-500" : ""
                                  }`}
                                >
                                  <td className="px-1 py-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      Receta
                                    </span>
                                  </td>
                                  <td className="px-1 py-1 font-mono text-xs">{receta.codigoelemento}</td>
                                  <td className="px-1 py-1 font-medium">{receta.nombreelemento}</td>
                                  <td className="px-1 py-1">{receta.cantidading?.toFixed(2)}</td>
                                  <td className="px-1 py-1">{receta.unidad}</td>
                                  <td className="px-1 py-1 text-right font-semibold text-orange-600">
                                    ${receta.ingredientecostoparcial?.toFixed(2)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tarjeta izquierda - Costo Actual */}
              <Card className="rounded-xs border bg-card text-card-foreground shadow bg-gradient-to-r from-[#f0f9ff] to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Utensils className="h-5 w-5" />
                    Costo Platillo Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-xs border">
                      <div className="text-sm text-gray-600">Costo Total Mes Actual</div>
                      <div className="text-2xl font-bold text-blue-600">
                        ${platilloSeleccionadoModal?.costo_actual.toFixed(2)}
                      </div>
                    </div>

                    {/* Tabla de detalles actuales */}
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-blue-100 sticky top-0">
                            <tr>
                              <th className="px-1 py-1 text-left font-semibold text-blue-800">Tipo</th>
                              <th className="px-1 py-1 text-left font-semibold text-blue-800">Código</th>
                              <th className="px-1 py-1 text-left font-semibold text-blue-800">Elemento</th>
                              <th className="px-1 py-1 text-left font-semibold text-blue-800">Cantidad</th>
                              <th className="px-1 py-1 text-left font-semibold text-blue-800">Descripción</th>
                              <th className="px-1 py-1 text-right font-semibold text-blue-800">Costo Parcial</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detallesActuales.map((detalle, index) => {
                              const tieneVariacion = elementosDiferentes[detalle.codigoelemento]
                              return (
                                <tr
                                  key={index}
                                  className={`border-b hover:bg-blue-50 ${
                                    tieneVariacion ? "bg-red-100 border-l-4 border-l-red-500" : ""
                                  }`}
                                >
                                  <td className="px-1 py-1">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        detalle.tipo === "ingrediente"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-purple-100 text-purple-800"
                                      }`}
                                    >
                                      {detalle.tipo === "ingrediente" ? "Ingrediente" : "Receta"}
                                    </span>
                                  </td>
                                  <td className="px-1 py-1 font-mono text-xs">{detalle.codigoelemento}</td>
                                  <td className="px-1 py-1">{detalle.elemento}</td>
                                  <td className="px-1 py-1">{detalle.cantidad?.toFixed(2)}</td>
                                  <td className="px-1 py-1">
                                    <div className="max-w-32 truncate" title={detalle.descripcion}>
                                      {detalle.descripcion}
                                    </div>
                                  </td>
                                  <td className="px-1 py-1 text-right font-semibold text-blue-600">
                                    ${detalle.costoparcial?.toFixed(2)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>
          )}

          {/* Leyenda de colores si hay diferencias */}
          {Object.keys(elementosDiferentes).length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span>
                  Los elementos resaltados en rojo tienen costos diferentes entre el período actual e histórico
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
        }
        
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
