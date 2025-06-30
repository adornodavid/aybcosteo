"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ChefHat,
  Search,
  RotateCcw,
  Clock,
  DollarSign,
  TrendingUp,
  Hash,
  Eye,
  Edit,
  Power,
  PowerOff,
  UtensilsCrossed,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { obtenerVariablesSesion } from "@/app/actions/session-actions"
import { supabase } from "@/lib/supabase"

interface Hotel {
  HotelId: number
  HotelNombre: string
}

interface Restaurante {
  RestauranteId: number
  RestauranteNombre: string
}

interface Menu {
  MenuId: number
  MenuNombre: string
}

interface PlatilloListado {
  PlatilloId: number
  PlatilloNombre: string
  PlatilloDescripcion: string
  PlatilloTiempo: string
  PlatilloCosto: number
  PlatilloActivo: boolean
  HotelId: number
  HotelNombre: string
  RestauranteId: number
  RestauranteNombre: string
  MenuId: number
  MenuNombre: string
}

interface EstadisticasPlatillos {
  totalPlatillos: number
  costoPromedio: number
  costoTotal: number
  tiempoPromedio: string
}

export default function PlatillosPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Estados
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)
  const [platillos, setPlatillos] = useState<PlatilloListado[]>([])
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasPlatillos>({
    totalPlatillos: 0,
    costoPromedio: 0,
    costoTotal: 0,
    tiempoPromedio: "0 min",
  })

  // Estados de filtros
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroHotel, setFiltroHotel] = useState("")
  const [filtroRestaurante, setFiltroRestaurante] = useState("")
  const [filtroMenu, setFiltroMenu] = useState("")

  // Variable auxiliar
  const [auxHotelid, setAuxHotelid] = useState<number>(-1)

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const resultadosPorPagina = 20

  useEffect(() => {
    validarSesionYCargarDatos()
  }, [])

  const validarSesionYCargarDatos = async () => {
    try {
      const session = await obtenerVariablesSesion()

      // Validación de seguridad
      if (!session.SesionActiva || session.SesionActiva !== "true") {
        router.push("/login")
        return
      }

      if (!session.RolId || session.RolId === "0" || session.RolId === "") {
        router.push("/login")
        return
      }

      setSessionData(session)

      // Configurar variable auxiliar auxHotelid
      let auxHotelidValue: number
      if (!["1", "2", "3", "4"].includes(session.RolId)) {
        auxHotelidValue = Number.parseInt(session.HotelId || "0")
      } else {
        auxHotelidValue = -1
      }
      setAuxHotelid(auxHotelidValue)

      await cargarHoteles(session.RolId, session.HotelId)
      await cargarPlatillosListado(auxHotelidValue)
      await cargarEstadisticas()
    } catch (error) {
      console.error("Error validando sesión:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const cargarPlatillosListado = async (auxHotelidValue: number) => {
    try {
      // Usar consultas nativas de Supabase para simular el JOIN complejo
      let query = supabase
        .from("platillos")
        .select(`
          id,
          nombre,
          descripcion,
          tiempopreparacion,
          costototal,
          activo,
          platillosxmenu!inner(
            menuid,
            menus!inner(
              id,
              nombre,
              restauranteid,
              restaurantes!inner(
                id,
                nombre,
                hotelid,
                hoteles!inner(
                  id,
                  nombre
                )
              )
            )
          )
        `)
        .eq("activo", true)

      // Aplicar filtro de hotel si no es administrador
      if (auxHotelidValue !== -1) {
        query = query.eq("platillosxmenu.menus.restaurantes.hotelid", auxHotelidValue)
      }

      const { data, error } = await query.order("nombre", { ascending: true })

      if (error) {
        console.error("Error cargando platillos listado:", error)
        // Fallback: cargar platillos básicos si falla la consulta compleja
        await cargarPlatillosBasicos()
        return
      }

      // Transformar los datos al formato esperado
      const platillosTransformados: PlatilloListado[] = []

      data?.forEach((platillo: any) => {
        platillo.platillosxmenu?.forEach((relacion: any) => {
          const menu = relacion.menus
          const restaurante = menu?.restaurantes
          const hotel = restaurante?.hoteles

          platillosTransformados.push({
            PlatilloId: platillo.id,
            PlatilloNombre: platillo.nombre,
            PlatilloDescripcion: platillo.descripcion,
            PlatilloTiempo: platillo.tiempopreparacion,
            PlatilloCosto: platillo.costototal,
            PlatilloActivo: platillo.activo,
            HotelId: hotel?.id || 0,
            HotelNombre: hotel?.nombre || "N/A",
            RestauranteId: restaurante?.id || 0,
            RestauranteNombre: restaurante?.nombre || "N/A",
            MenuId: menu?.id || 0,
            MenuNombre: menu?.nombre || "N/A",
          })
        })
      })

      setPlatillos(platillosTransformados)
    } catch (error) {
      console.error("Error ejecutando consulta de platillos:", error)
      // Fallback: cargar platillos básicos
      await cargarPlatillosBasicos()
    }
  }

  const cargarPlatillosBasicos = async () => {
    try {
      const { data, error } = await supabase
        .from("platillos")
        .select("id, nombre, descripcion, tiempopreparacion, costototal, activo")
        .eq("activo", true)
        .order("nombre")

      if (error) {
        console.error("Error cargando platillos básicos:", error)
        return
      }

      // Mapear a la estructura esperada
      const platillosBasicos = (data || []).map((p) => ({
        PlatilloId: p.id,
        PlatilloNombre: p.nombre,
        PlatilloDescripcion: p.descripcion,
        PlatilloTiempo: p.tiempopreparacion,
        PlatilloCosto: p.costototal,
        PlatilloActivo: p.activo,
        HotelId: 0,
        HotelNombre: "N/A",
        RestauranteId: 0,
        RestauranteNombre: "N/A",
        MenuId: 0,
        MenuNombre: "N/A",
      }))

      setPlatillos(platillosBasicos)
    } catch (error) {
      console.error("Error cargando platillos básicos:", error)
    }
  }

  const cargarHoteles = async (rolId: string, hotelId: string) => {
    try {
      let hotelesData: Hotel[] = []

      // Si RolId no es 1, 2, 3 o 4 - solo su hotel
      if (!["1", "2", "3", "4"].includes(rolId)) {
        const { data, error } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .eq("id", Number.parseInt(hotelId))
          .order("nombre", { ascending: true })

        if (error) {
          console.error("Error cargando hotel específico:", error)
          return
        }

        hotelesData = (data || []).map((h) => ({
          HotelId: h.id,
          HotelNombre: h.nombre,
        }))

        // Seleccionar automáticamente el único hotel
        if (hotelesData.length > 0) {
          setFiltroHotel(hotelesData[0].HotelId.toString())
        }
      } else {
        // Si RolId es 1, 2, 3 o 4 - todos los hoteles
        const { data, error } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .eq("activo", true)
          .order("nombre", { ascending: true })

        if (error) {
          console.error("Error cargando todos los hoteles:", error)
          return
        }

        // Agregar opción "Todos" al inicio
        hotelesData = [
          { HotelId: -1, HotelNombre: "Todos" },
          ...(data || []).map((h) => ({
            HotelId: h.id,
            HotelNombre: h.nombre,
          })),
        ]

        // Seleccionar "Todos" por defecto
        setFiltroHotel("-1")
      }

      setHoteles(hotelesData)

      // Cargar restaurantes iniciales
      await cargarRestaurantes(rolId, hotelId, hotelesData.length > 0 ? hotelesData[0].HotelId.toString() : "-1")
    } catch (error) {
      console.error("Error cargando hoteles:", error)
    }
  }

  const cargarRestaurantes = async (rolId: string, hotelId: string, selectedHotelId = "") => {
    try {
      let restaurantesData: Restaurante[] = []
      const hotelIdToUse = selectedHotelId || filtroHotel

      // Si RolId no es 1, 2, 3 o 4
      if (!["1", "2", "3", "4"].includes(rolId)) {
        const { data, error } = await supabase
          .from("restaurantes")
          .select("id, nombre")
          .eq("hotelid", Number.parseInt(hotelId))
          .eq("activo", true)
          .order("nombre", { ascending: true })

        if (error) {
          console.error("Error cargando restaurantes:", error)
          return
        }

        restaurantesData = [
          { RestauranteId: -1, RestauranteNombre: "Todos" },
          ...(data || []).map((r) => ({
            RestauranteId: r.id,
            RestauranteNombre: r.nombre,
          })),
        ]
      } else {
        // Si RolId es 1, 2, 3 o 4
        let query = supabase.from("restaurantes").select("id, nombre").eq("activo", true)

        if (hotelIdToUse !== "-1") {
          query = query.eq("hotelid", Number.parseInt(hotelIdToUse))
        }

        const { data, error } = await query.order("nombre", { ascending: true })

        if (error) {
          console.error("Error cargando restaurantes:", error)
          return
        }

        restaurantesData = [
          { RestauranteId: -1, RestauranteNombre: "Todos" },
          ...(data || []).map((r) => ({
            RestauranteId: r.id,
            RestauranteNombre: r.nombre,
          })),
        ]
      }

      setRestaurantes(restaurantesData)
      setFiltroRestaurante("-1")

      // Cargar menús iniciales
      await cargarMenus(rolId, hotelId, hotelIdToUse, "-1")
    } catch (error) {
      console.error("Error cargando restaurantes:", error)
    }
  }

  const cargarMenus = async (
    rolId: string,
    hotelId: string,
    selectedHotelId: string,
    selectedRestauranteId: string,
  ) => {
    try {
      let menusData: Menu[] = []

      // Si se seleccionó un restaurante específico
      if (selectedRestauranteId !== "-1") {
        const { data, error } = await supabase
          .from("menus")
          .select("id, nombre")
          .eq("restauranteid", Number.parseInt(selectedRestauranteId))
          .eq("activo", true)
          .order("nombre", { ascending: true })

        if (error) {
          console.error("Error cargando menús por restaurante:", error)
          return
        }

        menusData = [
          { MenuId: -1, MenuNombre: "Todos" },
          ...(data || []).map((m) => ({
            MenuId: m.id,
            MenuNombre: m.nombre,
          })),
        ]
      } else if (selectedHotelId !== "-1") {
        // Si se seleccionó un hotel específico, obtener menús a través de restaurantes
        const { data: restaurantesData, error: restaurantesError } = await supabase
          .from("restaurantes")
          .select("id")
          .eq("hotelid", Number.parseInt(selectedHotelId))
          .eq("activo", true)

        if (restaurantesError) {
          console.error("Error obteniendo restaurantes del hotel:", restaurantesError)
          return
        }

        if (restaurantesData && restaurantesData.length > 0) {
          const restauranteIds = restaurantesData.map((r) => r.id)

          const { data, error } = await supabase
            .from("menus")
            .select("id, nombre")
            .in("restauranteid", restauranteIds)
            .eq("activo", true)
            .order("nombre", { ascending: true })

          if (error) {
            console.error("Error cargando menús por hotel:", error)
            return
          }

          menusData = [
            { MenuId: -1, MenuNombre: "Todos" },
            ...(data || []).map((m) => ({
              MenuId: m.id,
              MenuNombre: m.nombre,
            })),
          ]
        } else {
          // No hay restaurantes en este hotel
          menusData = [{ MenuId: -1, MenuNombre: "Todos" }]
        }
      } else {
        // Mostrar todos los menús
        const { data, error } = await supabase
          .from("menus")
          .select("id, nombre")
          .eq("activo", true)
          .order("nombre", { ascending: true })

        if (error) {
          console.error("Error cargando todos los menús:", error)
          return
        }

        menusData = [
          { MenuId: -1, MenuNombre: "Todos" },
          ...(data || []).map((m) => ({
            MenuId: m.id,
            MenuNombre: m.nombre,
          })),
        ]
      }

      setMenus(menusData)
      setFiltroMenu("-1")
    } catch (error) {
      console.error("Error cargando menús:", error)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const { data, error } = await supabase
        .from("platillos")
        .select("costototal, tiempopreparacion")
        .eq("activo", true)

      if (error) {
        console.error("Error cargando estadísticas:", error)
        return
      }

      if (data && data.length > 0) {
        const total = data.length
        const costoTotal = data.reduce((sum, p) => sum + (p.costototal || 0), 0)
        const costoPromedio = costoTotal / total

        setEstadisticas({
          totalPlatillos: total,
          costoPromedio,
          costoTotal,
          tiempoPromedio: "20 min",
        })
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

  // Función para cambiar estado activo/inactivo
  const cambiarEstadoPlatillo = async (platilloId: number, nuevoEstado: boolean, nombrePlatillo: string) => {
    const accion = nuevoEstado ? "activar" : "inactivar"
    const confirmacion = confirm(`¿Estás seguro de que deseas ${accion} el platillo "${nombrePlatillo}"?`)

    if (!confirmacion) {
      return
    }

    try {
      const { error } = await supabase.from("platillos").update({ activo: nuevoEstado }).eq("id", platilloId)

      if (error) {
        console.error(`Error al ${accion} platillo:`, error)
        toast({
          title: "Error",
          description: `No se pudo ${accion} el platillo`,
          variant: "destructive",
        })
        return
      }

      // Actualizar el estado local
      setPlatillos(platillos.map((p) => (p.PlatilloId === platilloId ? { ...p, PlatilloActivo: nuevoEstado } : p)))

      toast({
        title: "Éxito",
        description: `Platillo ${nuevoEstado ? "activado" : "inactivado"} correctamente`,
      })
    } catch (error) {
      console.error(`Error al ${accion} platillo:`, error)
      toast({
        title: "Error",
        description: `No se pudo ${accion} el platillo`,
        variant: "destructive",
      })
    }
  }

  // Función JavaScript clearPlatillosBusqueda
  const clearPlatillosBusqueda = async () => {
    // Limpiar input de texto
    setFiltroNombre("")

    // Restablecer dropdowns como al cargar la página
    if (sessionData) {
      await cargarHoteles(sessionData.RolId, sessionData.HotelId)
    }

    setPaginaActual(1)

    toast({
      title: "Filtros limpiados",
      description: "Se han restablecido todos los filtros",
    })
  }

  // Función de búsqueda con SQL personalizado
  const buscarPlatillos = async () => {
    try {
      // Construir la consulta SQL con los filtros
      const sqlQuery = `
        SELECT p.id as PlatilloId, p.nombre as PlatilloNombre, p.descripcion as PlatilloDescripcion, 
               p.tiempopreparacion as PlatilloTiempo, p.costototal as PlatilloCosto, p.activo as PlatilloActivo,
               h.id as HotelId, h.nombre as HotelNombre, r.id as RestauranteId, r.nombre as RestauranteNombre, 
               m.id as MenuId, m.nombre as MenuNombre
        FROM platillos as p
        INNER JOIN platillosxmenu as x ON x.platilloid = p.id
        INNER JOIN Menus as m ON m.id = x.menuid
        INNER JOIN Restaurantes as r ON r.id = m.restauranteid
        INNER JOIN Hoteles as h ON h.id = r.hotelid
        WHERE (p.nombre like '%' || $1 || '%' or $1 = '')
        AND (m.id = $2 or $2 = -1)
        AND (m.restauranteid = $3 or $3 = -1)
        AND (r.hotelid = $4 or $4 = -1)
        AND (p.activo = true or true = TRUE)
        ORDER BY PlatilloNombre ASC
      `

      // Preparar los parámetros
      const params = [
        filtroNombre || "",
        filtroMenu === "-1" ? -1 : Number.parseInt(filtroMenu),
        filtroRestaurante === "-1" ? -1 : Number.parseInt(filtroRestaurante),
        filtroHotel === "-1" ? -1 : Number.parseInt(filtroHotel),
      ]

      console.log("Ejecutando búsqueda con parámetros:", params)

      // Ejecutar la consulta SQL usando rpc
      const { data, error } = await supabase.rpc("ejecutar_busqueda_platillos", {
        p_nombre: params[0],
        p_menu_id: params[1],
        p_restaurante_id: params[2],
        p_hotel_id: params[3],
      })

      if (error) {
        console.error("Error ejecutando búsqueda SQL:", error)

        // Fallback: usar método alternativo con consultas nativas de Supabase
        await ejecutarBusquedaAlternativa()
        return
      }

      // Transformar los resultados al formato esperado
      const platillosEncontrados: PlatilloListado[] = (data || []).map((row: any) => ({
        PlatilloId: row.platilloid,
        PlatilloNombre: row.platillonombre,
        PlatilloDescripcion: row.platillodescripcion,
        PlatilloTiempo: row.platillotiempo,
        PlatilloCosto: row.platillocosto,
        PlatilloActivo: row.platilloactivo,
        HotelId: row.hotelid,
        HotelNombre: row.hotelnombre,
        RestauranteId: row.restauranteid,
        RestauranteNombre: row.restaurantenombre,
        MenuId: row.menuid,
        MenuNombre: row.menunombre,
      }))

      // Actualizar el estado con los resultados de la búsqueda
      setPlatillos(platillosEncontrados)
      setPaginaActual(1) // Resetear a la primera página

      toast({
        title: "Búsqueda completada",
        description: `Se encontraron ${platillosEncontrados.length} platillos`,
      })
    } catch (error) {
      console.error("Error en búsqueda de platillos:", error)

      // Fallback: usar método alternativo
      await ejecutarBusquedaAlternativa()
    }
  }

  // Método alternativo de búsqueda usando consultas nativas de Supabase
  const ejecutarBusquedaAlternativa = async () => {
    try {
      console.log("Ejecutando búsqueda alternativa...")

      // Construir consulta base
      let query = supabase
        .from("platillos")
        .select(`
          id,
          nombre,
          descripcion,
          tiempopreparacion,
          costototal,
          activo,
          platillosxmenu!inner(
            menuid,
            menus!inner(
              id,
              nombre,
              restauranteid,
              restaurantes!inner(
                id,
                nombre,
                hotelid,
                hoteles!inner(
                  id,
                  nombre
                )
              )
            )
          )
        `)
        .eq("activo", true)

      // Aplicar filtro de nombre si existe
      if (filtroNombre && filtroNombre.trim() !== "") {
        query = query.ilike("nombre", `%${filtroNombre}%`)
      }

      // Aplicar filtro de hotel si no es "Todos"
      if (filtroHotel !== "-1") {
        query = query.eq("platillosxmenu.menus.restaurantes.hotelid", Number.parseInt(filtroHotel))
      }

      // Aplicar filtro de restaurante si no es "Todos"
      if (filtroRestaurante !== "-1") {
        query = query.eq("platillosxmenu.menus.restauranteid", Number.parseInt(filtroRestaurante))
      }

      // Aplicar filtro de menú si no es "Todos"
      if (filtroMenu !== "-1") {
        query = query.eq("platillosxmenu.menuid", Number.parseInt(filtroMenu))
      }

      const { data, error } = await query.order("nombre", { ascending: true })

      if (error) {
        console.error("Error en búsqueda alternativa:", error)
        toast({
          title: "Error",
          description: "No se pudo ejecutar la búsqueda",
          variant: "destructive",
        })
        return
      }

      // Transformar los datos al formato esperado
      const platillosTransformados: PlatilloListado[] = []

      data?.forEach((platillo: any) => {
        platillo.platillosxmenu?.forEach((relacion: any) => {
          const menu = relacion.menus
          const restaurante = menu?.restaurantes
          const hotel = restaurante?.hoteles

          platillosTransformados.push({
            PlatilloId: platillo.id,
            PlatilloNombre: platillo.nombre,
            PlatilloDescripcion: platillo.descripcion,
            PlatilloTiempo: platillo.tiempopreparacion,
            PlatilloCosto: platillo.costototal,
            PlatilloActivo: platillo.activo,
            HotelId: hotel?.id || 0,
            HotelNombre: hotel?.nombre || "N/A",
            RestauranteId: restaurante?.id || 0,
            RestauranteNombre: restaurante?.nombre || "N/A",
            MenuId: menu?.id || 0,
            MenuNombre: menu?.nombre || "N/A",
          })
        })
      })

      // Actualizar el estado con los resultados
      setPlatillos(platillosTransformados)
      setPaginaActual(1)

      toast({
        title: "Búsqueda completada",
        description: `Se encontraron ${platillosTransformados.length} platillos`,
      })
    } catch (error) {
      console.error("Error en búsqueda alternativa:", error)
      toast({
        title: "Error",
        description: "No se pudo ejecutar la búsqueda",
        variant: "destructive",
      })
    }
  }

  // Manejar cambio de Hotel
  const handleHotelChange = async (value: string) => {
    setFiltroHotel(value)

    // Cargar restaurantes según el hotel seleccionado
    if (sessionData) {
      await cargarRestaurantes(sessionData.RolId, sessionData.HotelId, value)
    }
  }

  // Manejar cambio de Restaurante
  const handleRestauranteChange = async (value: string) => {
    setFiltroRestaurante(value)

    // Cargar menús según hotel y restaurante seleccionados
    if (sessionData) {
      await cargarMenus(sessionData.RolId, sessionData.HotelId, filtroHotel, value)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("es-MX")
  }

  // Filtrar platillos
  const platillosFiltrados = platillos.filter((platillo) => {
    return platillo.PlatilloNombre.toLowerCase().includes(filtroNombre.toLowerCase())
  })

  // Paginación
  const totalPaginas = Math.ceil(platillosFiltrados.length / resultadosPorPagina)
  const indiceInicio = (paginaActual - 1) * resultadosPorPagina
  const indiceFin = indiceInicio + resultadosPorPagina
  const platillosPaginados = platillosFiltrados.slice(indiceInicio, indiceFin)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ChefHat className="h-12 w-12 mx-auto mb-4 animate-spin" />
          <p>Cargando platillos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Título de la página */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Platillos</h1>
          <p className="text-xl text-muted-foreground mt-2">Gestión completa de Platillos</p>
        </div>
        <button
          type="button"
          id="btnPlatilloNuevo"
          name="btnPlatilloNuevo"
          className="text-white font-semibold shadow-lg border-0 px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-xl inline-flex items-center justify-center"
          style={{ backgroundColor: "#559b79", ":hover": { backgroundColor: "#4a8a6b" } }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#4a8a6b")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#559b79")}
          onClick={() => router.push("/platillos/nuevo")}
        >
          <UtensilsCrossed className="h-5 w-5 mr-2" />
          Nuevo Platillo
        </button>
      </div>

      {/* 3. Resúmenes de estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Platillos</p>
                <p className="text-2xl font-bold">{estadisticas.totalPlatillos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Costo Promedio</p>
                <p className="text-2xl font-bold">{formatCurrency(estadisticas.costoPromedio)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Costo Total</p>
                <p className="text-2xl font-bold">{formatCurrency(estadisticas.costoTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                <p className="text-2xl font-bold">{estadisticas.tiempoPromedio}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Filtros de búsqueda */}
      <Card>
        <CardContent className="p-4">
          <form id="frmPlatillosBuscar" className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                type="text"
                id="txtPlatilloNombre"
                name="txtPlatilloNombre"
                maxLength={150}
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                placeholder="Buscar por nombre..."
              />
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Hotel</label>
              <Select value={filtroHotel} onValueChange={handleHotelChange}>
                <SelectTrigger id="ddlHotel" name="ddlHotel">
                  <SelectValue placeholder="Seleccionar hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel.HotelId} value={hotel.HotelId.toString()}>
                      {hotel.HotelNombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Restaurante</label>
              <Select value={filtroRestaurante} onValueChange={handleRestauranteChange}>
                <SelectTrigger id="ddlRestaurante" name="ddlRestaurante">
                  <SelectValue placeholder="Seleccionar restaurante" />
                </SelectTrigger>
                <SelectContent>
                  {restaurantes.map((restaurante) => (
                    <SelectItem key={restaurante.RestauranteId} value={restaurante.RestauranteId.toString()}>
                      {restaurante.RestauranteNombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Menú</label>
              <Select value={filtroMenu} onValueChange={setFiltroMenu}>
                <SelectTrigger id="ddlMenu" name="ddlMenu">
                  <SelectValue placeholder="Seleccionar menú" />
                </SelectTrigger>
                <SelectContent>
                  {menus.map((menu) => (
                    <SelectItem key={menu.MenuId} value={menu.MenuId.toString()}>
                      {menu.MenuNombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              id="btnPlatillosLimpiar"
              name="btnPlatillosLimpiar"
              variant="outline"
              className="bg-black text-white hover:bg-gray-800"
              style={{ fontSize: "12px" }}
              onClick={clearPlatillosBusqueda}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpiar
            </Button>

            <Button
              type="button"
              id="btnPlatillosBuscar"
              name="btnPlatillosBuscar"
              className="bg-black text-white hover:bg-gray-800"
              style={{ fontSize: "12px" }}
              onClick={buscarPlatillos}
            >
              <Search className="h-3 w-3 mr-1" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 5. Grid del listado */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Mostrando {platillosPaginados.length} de {platillosFiltrados.length} platillos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table id="tblPlatillosResultados">
            <TableHeader>
              <TableRow>
                <TableHead>Platillo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tiempo</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Hotel</TableHead>
                <TableHead>Restaurante</TableHead>
                <TableHead>Menú</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platillosPaginados.map((platillo) => (
                <TableRow key={platillo.PlatilloId}>
                  <TableCell>
                    <div className="font-medium">{platillo.PlatilloNombre}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">{platillo.PlatilloDescripcion}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {platillo.PlatilloTiempo}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Badge variant="default" className="bg-green-600">
                      {formatCurrency(platillo.PlatilloCosto)}
                    </Badge>
                  </TableCell>
                  <TableCell>{platillo.HotelNombre}</TableCell>
                  <TableCell>{platillo.RestauranteNombre}</TableCell>
                  <TableCell>{platillo.MenuNombre}</TableCell>
                  <TableCell>
                    <Badge variant={platillo.PlatilloActivo ? "default" : "secondary"}>
                      {platillo.PlatilloActivo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* Ver */}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/platillos/${platillo.PlatilloId}?getPlatilloId=${platillo.PlatilloId}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      {/* Editar */}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/platillos/${platillo.PlatilloId}/editar?getPlatilloId=${platillo.PlatilloId}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>

                      {/* Activar/Inactivar */}
                      {platillo.PlatilloActivo ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700 bg-transparent"
                          onClick={() => cambiarEstadoPlatillo(platillo.PlatilloId, false, platillo.PlatilloNombre)}
                        >
                          <PowerOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-500 hover:text-green-700 bg-transparent"
                          onClick={() => cambiarEstadoPlatillo(platillo.PlatilloId, true, platillo.PlatilloNombre)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
              >
                Anterior
              </Button>

              <span className="flex items-center px-4">
                Página {paginaActual} de {totalPaginas}
              </span>

              <Button
                variant="outline"
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
