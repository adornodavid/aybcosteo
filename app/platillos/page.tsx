"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Image from "next/image" // Importar Image de next/image

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog" // Importar componentes de Dialog
import * as DialogPrimitive from "@radix-ui/react-dialog" // Importar DialogPrimitive directamente
import { Eraser, Search, Eye, Edit, ToggleLeft, ToggleRight, Loader2, PlusCircle, RotateCcw } from "lucide-react"
import { getPlatilloDetailsForModal } from "@/app/actions/platillos-details-actions" // Importar la nueva acción

// --- Interfaces ---
interface DropdownItem {
  id: number
  nombre: string
}

interface PlatilloListado {
  PlatilloId: number
  PlatilloNombre: string
  PlatilloDescripcion: string
  PlatilloTiempo: string
  PlatilloCosto: number
  PlatilloActivo: boolean
  PlatilloImagenUrl: string | null // Añadido para la URL de la imagen
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

// Nueva interfaz para los detalles del platillo en el modal
interface PlatilloDetail {
  id: number
  Hotel: string
  Restaurante: string
  Menu: string
  Platillo: string
  descripcion: string
  instruccionespreparacion: string | null
  tiempopreparacion: string | null
  imgurl: string | null
  CostoElaboracion: number
  precioventa: number | null
  margenutilidad: number | null
  CostoTotal: number
  PrecioSugerido: number // Nuevo campo
}

// --- Componente Principal ---
export default function PlatillosPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // --- Estados ---
  const [platillos, setPlatillos] = useState<PlatilloListado[]>([]) // Usar PlatilloListado
  const [estadisticas, setEstadisticas] = useState<EstadisticasPlatillos>({
    totalPlatillos: 0,
    costoPromedio: 0,
    costoTotal: 0,
    tiempoPromedio: "N/A",
  })
  const [hoteles, setHoteles] = useState<DropdownItem[]>([])
  const [restaurantes, setRestaurantes] = useState<DropdownItem[]>([])
  const [menus, setMenus] = useState<DropdownItem[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [platilloToToggle, setPlatilloToToggle] = useState<{ id: number; activo: boolean } | null>(null)
  const [searchTerm, setSearchTerm] = useState("") // Mantener searchTerm para el filtro de nombre
  const [platilloToDelete, setPlatilloToDelete] = useState<number | null>(null)

  // Estados para el modal de detalles
  const [showPlatilloDetailsModal, setShowPlatilloDetailsModal] = useState(false)
  const [selectedPlatilloDetails, setSelectedPlatilloDetails] = useState<PlatilloDetail[] | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroHotel, setFiltroHotel] = useState("-1")
  const [filtroRestaurante, setFiltroRestaurante] = useState("-1")
  const [filtroMenu, setFiltroMenu] = useState("-1")

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const resultadosPorPagina = 20

  const esAdmin = useMemo(() => user && [1, 2, 3, 4].includes(user.RolId), [user])

  // --- Función de búsqueda SIN dependencias automáticas ---
  const ejecutarBusqueda = async (nombre: string, hotelId: number, restauranteId: number, menuId: number) => {
    if (!user) return
    setIsSearching(true)
    setPaginaActual(1)

    try {
      // Usar consulta directa con JOINs
      let query = supabase.from("platillos").select(`
          id, nombre, descripcion, tiempopreparacion, costototal, costoadministrativo, activo, imgurl,
          platillosxmenu!inner(
            menus!inner(
              id, nombre,
              restaurantes!inner(
                id, nombre,
                hoteles!inner(id, nombre)
              )
            )
          )
        `)

      if (nombre) query = query.like("nombre", `%${nombre}%`)
      if (hotelId !== -1) query = query.eq("platillosxmenu.menus.restaurantes.hoteles.id", hotelId)
      if (restauranteId !== -1) query = query.eq("platillosxmenu.menus.restaurantes.id", restauranteId)
      if (menuId !== -1) query = query.eq("platillosxmenu.menus.id", menuId)

      const { data: queryData, error: queryError } = await query.order("nombre", { ascending: true })

      if (queryError) {
        console.error("Error en búsqueda:", queryError)
        toast.error("Error al buscar recetas.")
        setPlatillos([])
        return
      }

      // Transformar datos de la consulta
      const flattenedData = queryData.flatMap((p: any) =>
        p.platillosxmenu.map((x: any) => ({
          PlatilloId: p.id,
          PlatilloNombre: p.nombre,
          PlatilloDescripcion: p.descripcion,
          PlatilloTiempo: p.tiempopreparacion,
          PlatilloCosto: p.costototal,
          PlatilloCostoAdministrativo : p.costoadministrativo,
          PlatilloActivo: p.activo,
          PlatilloImagenUrl: p.imgurl, // Mapear la URL de la imagen
          HotelId: x.menus.restaurantes.hoteles.id,
          HotelNombre: x.menus.restaurantes.hoteles.nombre,
          RestauranteId: x.menus.restaurantes.id,
          RestauranteNombre: x.menus.restaurantes.nombre,
          MenuId: x.menus.id,
          MenuNombre: x.menus.nombre,
        })),
      )
      setPlatillos(flattenedData)
      toast.success(`Búsqueda completada. Se encontraron ${flattenedData.length} resultados.`)
    } catch (error) {
      console.error("Error inesperado al buscar recetas:", error)
      toast.error("Error inesperado al buscar recetas")
      setPlatillos([])
    } finally {
      setIsSearching(false)
    }
  }

  // --- Carga inicial de datos ---
  const cargarDatosIniciales = async () => {
    if (!user) return

    try {
      // Cargar estadísticas
      const {
        data: statsData,
        error: statsError,
        count,
      } = await supabase.from("platillos").select("costototal, tiempopreparacion", { count: "exact" })

      if (!statsError && statsData && statsData.length > 0) {
        const costoTotal = statsData.reduce((sum, p) => sum + (p.costototal || 0), 0)
        const costoPromedio = count ? costoTotal / count : 0
        setEstadisticas({
          totalPlatillos: count || 0,
          costoPromedio,
          costoTotal,
          tiempoPromedio: "25 min",
        })
      }

      // Cargar hoteles
      if (esAdmin) {
        const { data: hotelesData, error: hotelesError } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .order("nombre")

        if (!hotelesError) {
          const hotelesConTodos = [
            { id: -1, nombre: "Todos" },
            ...(hotelesData || []).map((h: any) => ({ id: h.id, nombre: h.nombre })),
          ]
          setHoteles(hotelesConTodos)
          setFiltroHotel("-1")
        }
      } else {
        const { data: hotelData, error: hotelError } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .eq("id", user.HotelId)
          .order("nombre")

        if (!hotelError) {
          const hotelesData = (hotelData || []).map((h: any) => ({ id: h.id, nombre: h.nombre }))
          setHoteles(hotelesData)
          if (hotelesData.length > 0) {
            setFiltroHotel(hotelesData[0].id.toString())
          }
        }
      }

      // Cargar restaurantes iniciales
      const initialHotelId = esAdmin ? -1 : user.HotelId
      let restaurantesQuery = supabase.from("restaurantes").select("id, nombre").order("nombre")

      if (!esAdmin) {
        restaurantesQuery = restaurantesQuery.eq("hotelid", user.HotelId)
      }

      const { data: restaurantesData, error: restaurantesError } = await restaurantesQuery

      if (!restaurantesError) {
        const restaurantesConTodos = [
          { id: -1, nombre: "Todos" },
          ...(restaurantesData || []).map((r: any) => ({ id: r.id, nombre: r.nombre })),
        ]
        setRestaurantes(restaurantesConTodos)
        setFiltroRestaurante("-1")
      }

      // Cargar menús iniciales
      let menusQuery = supabase
        .from("menus")
        .select(`
          id, nombre,
          restaurantes!inner(
            id,
            hoteles!inner(id)
          )
        `)
        .eq("activo", true)
        .order("nombre")

      if (!esAdmin) {
        menusQuery = menusQuery.eq("restaurantes.hoteles.id", user.HotelId)
      }

      const { data: menusData, error: menusError } = await menusQuery

      if (!menusError) {
        const menusConTodos = [
          { id: -1, nombre: "Todos" },
          ...(menusData || []).map((m: any) => ({ id: m.id, nombre: m.nombre })),
        ]
        setMenus(menusConTodos)
        setFiltroMenu("-1")
      }

      // Ejecutar búsqueda inicial
      await ejecutarBusqueda("", initialHotelId, -1, -1)
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error)
      toast.error("Error al cargar datos iniciales")
    }
  }

  // --- Carga Inicial y Seguridad ---
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.RolId === 0) {
        router.push("/login")
        return
      }

      const inicializar = async () => {
        setPageLoading(true)
        await cargarDatosIniciales()
        setPageLoading(false)
      }
      inicializar()
    }
  }, [authLoading, user, router, esAdmin])

  // --- Handlers de Eventos ---
  const handleHotelChange = async (value: string) => {
    setFiltroHotel(value)
    setFiltroRestaurante("-1")
    setFiltroMenu("-1")

    // SOLO actualizar cascada de dropdowns, NO ejecutar búsqueda
    try {
      const hotelIdNum = Number.parseInt(value, 10)
      let query = supabase.from("restaurantes").select("id, nombre").order("nombre")

      if (hotelIdNum === -1) {
        if (!esAdmin) {
          query = query.eq("hotelid", user.HotelId)
        }
      } else {
        query = query.eq("hotelid", hotelIdNum)
      }

      const { data, error } = await query

      if (!error) {
        const restaurantesConTodos = [
          { id: -1, nombre: "Todos" },
          ...(data || []).map((r: any) => ({ id: r.id, nombre: r.nombre })),
        ]
        setRestaurantes(restaurantesConTodos)
      }
    } catch (error) {
      console.error("Error al cambiar hotel:", error)
    }

    // Resetear menús a solo "Todos"
    setMenus([{ id: -1, nombre: "Todos" }])
  }

  const handleRestauranteChange = async (value: string) => {
    setFiltroRestaurante(value)
    setFiltroMenu("-1")

    // SOLO actualizar cascada de menús, NO ejecutar búsqueda
    try {
      const restauranteIdNum = Number.parseInt(value, 10)
      const hotelIdNum = Number.parseInt(filtroHotel, 10)

      let query = supabase
        .from("menus")
        .select(`
          id, nombre,
          restaurantes!inner(
            id,
            hoteles!inner(id)
          )
        `)
        .eq("activo", true)
        .order("nombre")

      if (restauranteIdNum !== -1) {
        query = query.eq("restauranteid", restauranteIdNum)
      }

      if (hotelIdNum !== -1) {
        query = query.eq("restaurantes.hoteles.id", hotelIdNum)
      } else if (!esAdmin) {
        query = query.eq("restaurantes.hoteles.id", user.HotelId)
      }

      const { data, error } = await query

      if (!error) {
        const menusConTodos = [
          { id: -1, nombre: "Todos" },
          ...(data || []).map((m: any) => ({ id: m.id, nombre: m.nombre })),
        ]
        setMenus(menusConTodos)
      }
    } catch (error) {
      console.error("Error al cambiar restaurante:", error)
    }
  }

  // ESTE ES EL ÚNICO LUGAR DONDE SE EJECUTA LA BÚSQUEDA
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const hotelId = Number.parseInt(filtroHotel, 10)
    const restauranteId = Number.parseInt(filtroRestaurante, 10)
    const menuId = Number.parseInt(filtroMenu, 10)
    ejecutarBusqueda(filtroNombre, hotelId, restauranteId, menuId)
  }

  const clearPlatillosBusqueda = () => {
    setFiltroNombre("")
    const initialHotelId = esAdmin ? "-1" : user.HotelId.toString()
    setFiltroHotel(initialHotelId)
    handleHotelChange(initialHotelId)
    toast.info("Filtros limpiados.")
  }

  const handleToggleStatusClick = (id: number, activo: boolean) => {
    setPlatilloToToggle({ id, activo })
    setShowConfirmDialog(true)
  }

  const cambiarEstadoPlatillo = async () => {
    if (!platilloToToggle) return

    try {
      const { id, activo } = platilloToToggle
      const nuevoEstado = !activo
      const { error } = await supabase.from("platillos").update({ activo: nuevoEstado }).eq("id", id)

      if (error) {
        console.error("Error al cambiar estado:", error)
        toast.error(`Error al cambiar estado de la recetas.`)
      } else {
        setPlatillos((prev) => prev.map((p) => (p.PlatilloId === id ? { ...p, PlatilloActivo: nuevoEstado } : p)))
        toast.success(`Receta ${nuevoEstado ? "activado" : "inactivado"} correctamente.`)
      }
    } catch (error) {
      console.error("Error inesperado al cambiar estado:", error)
      toast.error("Error inesperado al cambiar estado")
    }

    setShowConfirmDialog(false)
    setPlatilloToToggle(null)
  }

  const handleDeletePlatillo = async () => {
    if (platilloToDelete === null) return

    setPageLoading(true)
    const { error } = await supabase.from("platillos").update({ activo: false }).eq("id", platilloToDelete)

    if (error) {
      toast.error("Error al eliminar receta: " + error.message)
    } else {
      toast.success("Receta eliminada correctamente.")
      setPlatilloToDelete(null)
      // Recargar la lista de platillos después de la eliminación
      const hotelId = Number.parseInt(filtroHotel, 10)
      const restauranteId = Number.parseInt(filtroRestaurante, 10)
      const menuId = Number.parseInt(filtroMenu, 10)
      await ejecutarBusqueda(filtroNombre, hotelId, restauranteId, menuId)
    }
    setPageLoading(false)
  }

  // Handler para abrir el modal de detalles del platillo
  const handleViewPlatilloDetails = async (platilloId: number) => {
    setIsDetailsLoading(true)
    setShowPlatilloDetailsModal(true) // Abrir modal inmediatamente con estado de carga
    setSelectedPlatilloDetails(null) // Limpiar detalles anteriores

    const { success, data, error } = await getPlatilloDetailsForModal(platilloId)

    // INICIO DE LA MODIFICACIÓN
    
    console.log(`getPlatilloDetailsForModal - Success: ${success}, Error: ${error ? error : "No error"}`)
    // FIN DE LA MODIFICACIÓN

    if (success && data) {
      setSelectedPlatilloDetails(data)
    } else {
      toast.error(`Error al cargar detalles de la receta: ${error}`)
      setSelectedPlatilloDetails([]) // Indicar que no se encontraron datos
    }
    setIsDetailsLoading(false)
    
  }
  
  // --- Paginación ---
  const platillosPaginados = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * resultadosPorPagina
    return platillos.slice(indiceInicio, indiceInicio + resultadosPorPagina)
  }, [platillos, paginaActual])

  const totalPaginas = Math.ceil(platillos.length / resultadosPorPagina)

  // Corrección aquí: usar PlatilloNombre para el filtro
  const filteredPlatillos = platillos.filter((platillo) =>
    platillo.PlatilloNombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number | null) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount || 0)

  // --- Renderizado ---
  if (pageLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center justify-center p-8">
            <div className="relative w-24 h-24 mb-4">
              <Image
                src="https://nxtrsibnomdqmzcrwedc.supabase.co/storage/v1/object/public/imagenes/AnimationGif/CargarPage.gif"
                alt="Procesando..."
                width={300} // Ajusta el tamaño según sea necesario
                height={300} // Ajusta el tamaño según sea necesario
                unoptimized // Importante para GIFs externos
                className="absolute inset-0 animate-bounce-slow"
              />
            </div>
            <p className="text-lg font-semibold text-gray-800">Cargando Pagina...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* 1. Título y Botón */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recetas</h1>
          <p className="text-muted-foreground">Gestión completa de Recetas</p>
        </div>
        <Link href="/platillos/nuevo" passHref>
          <Button id="btnPlatilloNuevo" name="btnPlatilloNuevo" className="bg-[#5d8f72] hover:bg-[#44785a] text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nueva Receta
          </Button>
        </Link>
      </div>

      {/* 2. Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Recetas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.totalPlatillos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(estadisticas.costoPromedio)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(estadisticas.costoTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio Prep.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.tiempoPromedio}</div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="frmPlatillosBuscar"
            name="frmPlatillosBuscar"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end"
            onSubmit={handleFormSubmit}
          >
            <div className="lg:col-span-2">
              <label htmlFor="txtPlatilloNombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="txtPlatilloNombre"
                name="txtPlatilloNombre"
                type="text"
                placeholder="Buscar por nombre..."
                maxLength={150}
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="ddlHotel" className="text-sm font-medium">
                Hotel
              </label>
              <Select name="ddlHotel" value={filtroHotel} onValueChange={handleHotelChange} disabled={!esAdmin}>
                <SelectTrigger id="ddlHotel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hoteles.map((h) => (
                    <SelectItem key={h.id} value={h.id.toString()}>
                      {h.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="ddlRestaurante" className="text-sm font-medium">
                Restaurante
              </label>
              <Select name="ddlRestaurante" value={filtroRestaurante} onValueChange={handleRestauranteChange}>
                <SelectTrigger id="ddlRestaurante">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {restaurantes.map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="ddlMenu" className="text-sm font-medium">
                Menú
              </label>
              <Select name="ddlMenu" value={filtroMenu} onValueChange={setFiltroMenu}>
                <SelectTrigger id="ddlMenu">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {menus.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                id="btnPlatillosLimpiar"
                name="btnPlatillosLimpiar"
                type="button"
                variant="outline"
                className="w-full bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                onClick={clearPlatillosBusqueda}
              >
                <RotateCcw className="mr-2 h-3 w-3" /> Limpiar
              </Button>
              <Button
                id="btnPlatillosBuscar"
                name="btnPlatillosBuscar"
                type="submit"
                className="w-full bg-[#4a4a4a] text-white hover:bg-[#333333]"
                style={{ fontSize: "12px" }}
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Search className="mr-2 h-3 w-3" />}{" "}
                Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 4. Grid de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Mostrando {platillosPaginados.length} de {platillos.length} recetas encontradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table id="tblPlatillosResultados">
              <TableHeader>
                <TableRow>
                  <TableHead>Receta</TableHead>
                  <TableHead className="hidden md:table-cell">Hotel</TableHead>
                  <TableHead className="hidden lg:table-cell">Restaurante</TableHead>
                  <TableHead className="hidden lg:table-cell">Menú</TableHead>
                  {/*<TableHead>Costo elaboración</TableHead>*/}
                  <TableHead>Costo total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSearching ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredPlatillos.length > 0 ? (
                  filteredPlatillos.map((p, index) => (
                    <TableRow key={`${p.PlatilloId}-${p.MenuId}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={p.PlatilloImagenUrl || "/placeholder.svg?height=40&width=40"} // Usar la URL de la imagen o el placeholder
                            alt={p.PlatilloNombre}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                          <div>
                            <div className="font-medium">{p.PlatilloNombre}</div>
                            <div className="text-sm text-muted-foreground hidden sm:block">{p.PlatilloDescripcion}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{p.HotelNombre}</TableCell>
                      <TableCell className="hidden lg:table-cell">{p.RestauranteNombre}</TableCell>
                      <TableCell className="hidden lg:table-cell">{p.MenuNombre}</TableCell>
                      {/*<TableCell>{formatCurrency(p.PlatilloCosto)}</TableCell>*/}
                      <TableCell>{formatCurrency(p.PlatilloCostoAdministrativo)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${p.PlatilloActivo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {p.PlatilloActivo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Botón "Ver" para abrir el modal de detalles */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver Detalles"
                            onClick={() => handleViewPlatilloDetails(p.PlatilloId)}
                            disabled={isDetailsLoading}
                          >
                            {isDetailsLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/platillos/editar?getPlatilloId=${p.PlatilloId}`} passHref>
                            <Button variant="ghost" size="icon" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={p.PlatilloActivo ? "Inactivar" : "Activar"}
                            onClick={() => handleToggleStatusClick(p.PlatilloId, p.PlatilloActivo)}
                          >
                            {p.PlatilloActivo ? (
                              <ToggleRight className="h-4 w-4 text-red-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              {/*
                              <Button
                                variant="destructive"
                                size="icon"
                                title="Eliminar Platillo"
                                onClick={() => setPlatilloToDelete(p.PlatilloId)}
                              >
                              
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              */}
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción desactivará la receta (el platillo). No se eliminará permanentemente de la
                                  base de datos, pero ya no estará visible en la aplicación.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeletePlatillo}>Confirmar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {paginaActual} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmación de Cambio de Estado */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto cambiará el estado de la receta a '{platilloToToggle?.activo ? "Inactivo" : "Activo"}'. ¿Deseas
              continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlatilloToToggle(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={cambiarEstadoPlatillo}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Detalles del Platillo */}
      <Dialog open={showPlatilloDetailsModal} onOpenChange={setShowPlatilloDetailsModal}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalles de la Receta</DialogTitle>
            <DialogDescription>Información detallada de la receta seleccionada.</DialogDescription>
          </DialogHeader>
          {isDetailsLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando detalles...</span>
            </div>
          ) : selectedPlatilloDetails && selectedPlatilloDetails.length > 0 ? (
            <div className="grid gap-4 py-4">
              {/* Mostrar información principal del platillo una vez */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                {selectedPlatilloDetails[0].imgurl && (
                  <img
                    src={selectedPlatilloDetails[0].imgurl || "/placeholder.svg"}
                    alt={selectedPlatilloDetails[0].Platillo}
                    className="w-64 h-64 object-cover rounded-md"
                  />
                )}
                <div className="grid gap-1">
                  <h3 className="text-xl font-semibold">{selectedPlatilloDetails[0].Platillo}</h3>
                  <p className="text-muted-foreground">{selectedPlatilloDetails[0].descripcion}</p>
                  {selectedPlatilloDetails[0].instruccionespreparacion && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="text-base text-black-600 font-medium">Instrucciones:</span>{" "}
                      {selectedPlatilloDetails[0].instruccionespreparacion}
                    </p>
                  )}
                  {selectedPlatilloDetails[0].tiempopreparacion && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="text-base font-medium">Tiempo de Preparación:</span>{" "}
                      {selectedPlatilloDetails[0].tiempopreparacion}
                    </p>
                  )}
                  {/*
                  <p className="mt-3 text-sm text-gray-600">
                    <span className="text-base font-medium">Costo de Elaboración:</span>{" "}
                    {formatCurrency(selectedPlatilloDetails[0].CostoElaboracion)}
                  </p>
                  */}
                  <p className="text-sm text-gray-600">
                    <span className="text-base font-medium">Costo Total:</span>{" "}
                    {formatCurrency(selectedPlatilloDetails[0].CostoTotal)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="text-base font-medium">Precio Mínimo:</span>{" "}
                    {formatCurrency(selectedPlatilloDetails[0].PrecioSugerido)}
                  </p>
                </div>
              </div>

              {/* Mostrar detalles específicos de cada asociación con menú */}
              {selectedPlatilloDetails.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-2">Asociaciones con Menús:</h4>
                  <div className="grid gap-3">
                    {selectedPlatilloDetails.map((detail, idx) => (
                      <Card key={idx} className="p-3">
                        <p className="text-sm">
                          <span className="font-medium">Hotel:</span> {detail.Hotel}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Restaurante:</span> {detail.Restaurante}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Menú:</span> {detail.Menu}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Precio de Venta:</span> {formatCurrency(detail.precioventa)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Margen de Utilidad:</span>{" "}
                          {detail.margenutilidad !== null ? `${detail.margenutilidad}` : "N/A"}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No se encontraron detalles para esta receta.</div>
          )}
          <DialogFooter>
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="secondary">
                Cerrar
              </Button>
            </DialogPrimitive.Close>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
