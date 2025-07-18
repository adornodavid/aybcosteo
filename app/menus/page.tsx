"use client"

import Link from "next/link"
import Image from "next/image" // Importar Image para mostrar imágenes de platillos

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination"
import { Utensils, Search, RotateCcw, Eye, Edit, PowerOff, Power, HandPlatter, X } from "lucide-react" // Añadir X para el botón de cerrar
import { useRouter } from "next/navigation"
import { getSession } from "@/app/actions/session-actions"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "@/components/ui/loader2"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog" // Importar Dialog
import * as DialogPrimitive from "@radix-ui/react-dialog" // Importar DialogPrimitive para DialogClose
import { ScrollArea } from "@/components/ui/scroll-area" // Importar ScrollArea
import { getMenuDetails } from "@/app/actions/menus-details-actions" // Importar la nueva acción

interface Menu {
  id: string // Aseguramos que el ID sea string para consistencia
  nombre: string
  descripcion: string | null
  activo: boolean
  restaurante: {
    nombre: string
    hotel: {
      nombre: string
    }
  }
}

interface Hotel {
  id: string // Aseguramos que el ID sea string
  nombre: string
}

interface Restaurante {
  id: string // Aseguramos que el ID sea string
  nombre: string
}

// Interfaces para los detalles del menú
interface MenuDetails {
  id: string
  nombre: string
  descripcion: string | null
  activo: boolean
  fechacreacion: string
  restaurante: {
    nombre: string
    hotel: {
      nombre: string
    }
  }
}

interface PlatilloAsignado {
  id: string
  precioventa: number
  margenutilidad: number
  platillo: {
    nombre: string
    costototal: number
    imgurl: string | null
  }
}

export default function MenusPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [menus, setMenus] = useState<Menu[]>([])
  const [totalMenus, setTotalMenus] = useState(0)
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])

  const [menuNameFilter, setMenuNameFilter] = useState("")
  const [selectedHotelId, setSelectedHotelId] = useState<string>("-1") // -1 para 'Todos'
  const [selectedRestauranteId, setSelectedRestauranteId] = useState<string>("-1") // -1 para 'Todos'
  const [statusFilter, setStatusFilter] = useState<string>("true") // 'true' para Activo por defecto

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  const [sessionRolId, setSessionRolId] = useState<number | null>(null)
  const [sessionHotelId, setSessionHotelId] = useState<string | null>(null)

  // Estados para el modal de detalles del menú
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedMenuDetails, setSelectedMenuDetails] = useState<MenuDetails | null>(null)
  const [assignedPlatillos, setAssignedPlatillos] = useState<PlatilloAsignado[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // Cargar Hoteles
  const cargarHoteles = useCallback(
    async (rolId: number | null, hotelId: string | null) => {
      if (rolId === null) return

      let auxHotelid = "-1"
      if (rolId !== 1 && rolId !== 2 && rolId !== 3 && rolId !== 4) {
        auxHotelid = hotelId || "-1"
      } else {
        auxHotelid = "-1"
      }

      try {
        let query = supabase.from("hoteles").select("id, nombre")

        if (auxHotelid !== "-1") {
          query = query.eq("id", auxHotelid)
        }

        const { data, error } = await query.order("nombre", { ascending: true })

        if (error) throw error

        // Convertir todos los IDs a string inmediatamente después de la consulta
        let fetchedHoteles: Hotel[] = (data || []).map((h) => ({ ...h, id: String(h.id) }))

        if (rolId === 1 || rolId === 2 || rolId === 3 || rolId === 4) {
          fetchedHoteles = [{ id: "-1", nombre: "Todos" }, ...fetchedHoteles]
          setSelectedHotelId("-1")
        } else if (fetchedHoteles.length > 0) {
          setSelectedHotelId(String(fetchedHoteles[0].id)) // Asegurar que se setea como string
        }

        setHoteles(fetchedHoteles)
      } catch (error: any) {
        console.error("Error cargando hoteles:", error.message)
        toast({
          title: "Error",
          description: "No se pudieron cargar los hoteles.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  // Cargar Restaurantes
  const cargarRestaurantes = useCallback(
    async (hotelId: string, rolId: number | null, sessionHotelId: string | null) => {
      if (rolId === null) return

      try {
        let query = supabase.from("restaurantes").select("id, nombre")

        if (rolId !== 1 && rolId !== 2 && rolId !== 3 && rolId !== 4) {
          query = query.eq("hotelid", sessionHotelId || "")
        } else if (hotelId !== "-1") {
          query = query.eq("hotelid", hotelId)
        }

        const { data, error } = await query.order("nombre", { ascending: true })

        if (error) throw error

        // Convertir todos los IDs a string inmediatamente después de la consulta
        const fetchedRestaurantes: Restaurante[] = [
          { id: "-1", nombre: "Todos" },
          ...(data || []).map((r) => ({ ...r, id: String(r.id) })),
        ]
        setRestaurantes(fetchedRestaurantes)
        setSelectedRestauranteId("-1")
      } catch (error: any) {
        console.error("Error cargando restaurantes:", error.message)
        toast({
          title: "Error",
          description: "No se pudieron cargar los restaurantes.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  // Cargar Menús - Ahora recibe los filtros como argumentos
  const cargarMenus = useCallback(
    async (nameFilter: string, hotelIdFilter: string, restauranteIdFilter: string, status: string, page: number) => {
      if (sessionRolId === null) return

      setSearching(true)
      try {
        let query = supabase
          .from("menus")
          .select(
            `
          id,
          nombre,
          descripcion,
          activo,
          restaurante:restaurantes(
            nombre,
            hotel:hoteles(
              nombre
            )
          )
        `,
            { count: "exact" },
          )
          .eq("activo", status === "true")
          .ilike("nombre", `%${nameFilter}%`)

        if (restauranteIdFilter !== "-1") {
          query = query.eq("restauranteid", restauranteIdFilter)
        }

        if (hotelIdFilter !== "-1") {
          query = query.eq("restaurante.hotelid", hotelIdFilter)
        }

        const { data, error, count } = await query
          .order("nombre", { ascending: true })
          .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

        if (error) throw error

        // Convertir IDs de menú a string para consistencia
        setMenus((data || []).map((m) => ({ ...m, id: String(m.id) })) as Menu[])
        setTotalMenus(count || 0)
      } catch (error: any) {
        console.error("Error cargando menús:", error.message)
        toast({
          title: "Error",
          description: "No se pudieron cargar los menús.",
          variant: "destructive",
        })
      } finally {
        setSearching(false)
        setLoading(false)
      }
    },
    [sessionRolId, toast, itemsPerPage],
  )

  // Seguridad y carga inicial de datos
  useEffect(() => {
    const initPage = async () => {
      const session = await getSession()
      if (!session || session.SesionActiva !== true) {
        router.push("/login")
        return
      }
      const rolId = Number.parseInt(session.RolId?.toString() || "0", 10)
      if (rolId === 0) {
        router.push("/login")
        return
      }
      setSessionRolId(rolId)
      setSessionHotelId(session.HotelId || null)

      // Cargar hoteles primero
      await cargarHoteles(rolId, session.HotelId || null)

      // Determinar valores iniciales para la primera carga de menús
      const initialHotelId = rolId === 1 || rolId === 2 || rolId === 3 || rolId === 4 ? "-1" : session.HotelId || "-1"
      const initialRestauranteId = "-1"
      const initialStatus = "true"
      const initialName = ""

      await cargarMenus(initialName, initialHotelId, initialRestauranteId, initialStatus, 1)
    }
    initPage()
  }, [router, cargarHoteles, cargarMenus])

  // Efecto para recargar restaurantes cuando cambia el hotel seleccionado
  useEffect(() => {
    if (sessionRolId !== null && selectedHotelId) {
      cargarRestaurantes(selectedHotelId, sessionRolId, sessionHotelId)
    }
  }, [selectedHotelId, sessionRolId, sessionHotelId, cargarRestaurantes])

  const handleSearch = () => {
    setCurrentPage(1) // Resetear a la primera página en cada nueva búsqueda
    cargarMenus(menuNameFilter, selectedHotelId, selectedRestauranteId, statusFilter, 1)
  }

  const handleClearFilters = () => {
    setMenuNameFilter("")
    setStatusFilter("true")
    setSelectedRestauranteId("-1")

    const initialHotelId =
      sessionRolId === 1 || sessionRolId === 2 || sessionRolId === 3 || sessionRolId === 4
        ? "-1"
        : sessionHotelId || "-1"
    setSelectedHotelId(initialHotelId)

    setCurrentPage(1)
    cargarMenus("", initialHotelId, "-1", "true", 1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    cargarMenus(menuNameFilter, selectedHotelId, selectedRestauranteId, statusFilter, page)
  }

  const handleStatusToggle = async (menuId: string, currentStatus: boolean) => {
    if (window.confirm(`¿Estás seguro de que deseas ${currentStatus ? "inactivar" : "activar"} este menú?`)) {
      try {
        const { error } = await supabase.from("menus").update({ activo: !currentStatus }).eq("id", menuId)

        if (error) throw error

        toast({
          title: "Éxito",
          description: `Menú ${currentStatus ? "inactivado" : "activado"} correctamente.`,
        })
        cargarMenus(menuNameFilter, selectedHotelId, selectedRestauranteId, statusFilter, currentPage)
      } catch (error: any) {
        console.error("Error actualizando estado del menú:", error.message)
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del menú.",
          variant: "destructive",
        })
      }
    }
  }

  // Función para manejar la visualización de detalles del menú
  const handleViewMenuDetails = async (menuId: string) => {
    setLoadingDetails(true)
    setDetailsError(null)
    setShowDetailsDialog(true) // Abrir el diálogo inmediatamente para mostrar el loader

    try {
      const { menu, platillos, error } = await getMenuDetails(menuId)

      if (error) {
        setDetailsError(error)
        setSelectedMenuDetails(null)
        setAssignedPlatillos([])
        toast({
          title: "Error",
          description: `No se pudieron cargar los detalles del menú: ${error}`,
          variant: "destructive",
        })
      } else if (menu) {
        setSelectedMenuDetails(menu)
        setAssignedPlatillos(platillos || [])
      } else {
        setDetailsError("No se encontraron detalles para este menú.")
        setSelectedMenuDetails(null)
        setAssignedPlatillos([])
      }
    } catch (error: any) {
      console.error("Error al obtener detalles del menú:", error)
      setDetailsError("Ocurrió un error inesperado al cargar los detalles.")
      setSelectedMenuDetails(null)
      setAssignedPlatillos([])
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al cargar los detalles del menú.",
        variant: "destructive",
      })
    } finally {
      setLoadingDetails(false)
    }
  }

  const totalPages = Math.ceil(totalMenus / itemsPerPage)

    if (loading) {
    return (
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
    )
  }

  return (
    <div className="container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Menús</h1>
          <p className="text-lg text-gray-500">Gestión completa de Menus</p>
        </div>
        <Button
          type="button"
          onClick={() => router.push("/menus/nuevo")}
          style={{ backgroundColor: "#986ec2", color: "white" }}
          id="btnMenuNuevo"
          name="btnMenuNuevo"
        >
          <Utensils className="mr-2 h-4 w-4" /> Nuevo Menú
        </Button>
      </div>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pl-4 md:pl-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Menús</CardTitle>
            <Utensils className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMenus}</div>
            <p className="text-xs text-gray-500">Menús registrados en el sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de búsqueda */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="frmMenusBuscar"
            name="frmMenusBuscar"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          >
            <div className="space-y-2">
              <label htmlFor="txtMenuNombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="txtMenuNombre"
                name="txtMenuNombre"
                type="text"
                maxLength={150}
                value={menuNameFilter}
                onChange={(e) => setMenuNameFilter(e.target.value)}
                placeholder="Buscar por nombre de menú"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ddlMenuHotel" className="text-sm font-medium">
                Hotel
              </label>
              <Select value={selectedHotelId} onValueChange={setSelectedHotelId} id="ddlMenuHotel" name="ddlMenuHotel">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un hotel">
                    {selectedHotelId === "-1"
                      ? "Todos"
                      : hoteles.find((h) => h.id === selectedHotelId)?.nombre || "Selecciona un hotel"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="ddlMenuRestaurante" className="text-sm font-medium">
                Restaurante
              </label>
              <Select
                value={selectedRestauranteId}
                onValueChange={setSelectedRestauranteId}
                id="ddlMenuRestaurante"
                name="ddlMenuRestaurante"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un restaurante">
                    {selectedRestauranteId === "-1"
                      ? "Todos"
                      : restaurantes.find((r) => r.id === selectedRestauranteId)?.nombre || "Selecciona un restaurante"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {restaurantes.map((restaurante) => (
                    <SelectItem key={restaurante.id} value={restaurante.id}>
                      {restaurante.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="ddlEstatusMenu" className="text-sm font-medium">
                Estatus
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter} id="ddlEstatusMenu" name="ddlEstatusMenu">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estatus">
                    {statusFilter === "true" ? "Activo" : "Inactivo"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 col-span-full lg:col-span-2 justify-start flex-row items-end">
              <Button
                type="button"
                onClick={handleClearFilters}
                style={{ backgroundColor: "#c49deb", color: "black", fontSize: "12px" }}
                id="btnMenuLimpiar"
                name="btnMenuLimpiar"
              >
                <RotateCcw className="mr-2 h-3 w-3" /> Limpiar filtros
              </Button>
              <Button
                type="button"
                onClick={handleSearch}
                style={{ backgroundColor: "#c49deb", color: "black", fontSize: "12px" }}
                id="btnMenuBuscar"
                name="btnMenuBuscar"
              >
                <Search className="mr-2 h-3 w-3" /> Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Grid del listado */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Menús</CardTitle>
        </CardHeader>
        <CardContent>
          {searching ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#c49deb]">
              <Loader2 className="h-12 w-12 animate-spin" />
              <p className="mt-2">Cargando menús...</p>
            </div>
          ) : menus.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No se encontraron menús con los filtros aplicados.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table id="tblMenuResultados">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Folio</TableHead>
                      <TableHead>Menú</TableHead>
                      <TableHead>Restaurante</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menus.map((menu) => (
                      <TableRow key={menu.id}>
                        <TableCell>{menu.id.substring(0, 8)}...</TableCell>
                        <TableCell>{menu.nombre}</TableCell>
                        <TableCell>{menu.restaurante?.nombre || "N/A"}</TableCell>
                        <TableCell>{menu.restaurante?.hotel?.nombre || "N/A"}</TableCell>
                        <TableCell>{menu.descripcion || "Sin descripción"}</TableCell>
                        <TableCell className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Ver detalles del menú"
                            onClick={() => handleViewMenuDetails(menu.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Link href={`/menus/${menu.id}/agregar`} passHref>
                            <Button variant="ghost" size="icon" aria-label="Agregar">
                              <HandPlatter className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/menus/${menu.id}`} passHref>
                            <Button variant="ghost" size="icon" aria-label="Ver menú">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/menus/${menu.id}/editar`} passHref>
                            <Button variant="ghost" size="icon" aria-label="Editar menú">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={menu.activo ? "text-red-500" : "text-green-500"}
                                aria-label={menu.activo ? "Inactivar menú" : "Activar menú"}
                              >
                                {menu.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción {menu.activo ? "inactivará" : "activará"} el menú "{menu.nombre}". ¿Deseas
                                  continuar?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleStatusToggle(menu.id, menu.activo)}>
                                  {menu.activo ? "Inactivar" : "Activar"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : undefined}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === index + 1}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-disabled={currentPage === totalPages}
                      tabIndex={currentPage === totalPages ? -1 : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles del Menú */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
          <DialogHeader className="relative pb-4">
            <DialogTitle className="text-3xl font-bold text-[#986ec2]">Detalles del Menú</DialogTitle>
            <DialogDescription className="text-gray-600">
              Información detallada y platillos asignados al menú.
            </DialogDescription>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-6 w-6 text-gray-500" />
              <span className="sr-only">Cerrar</span>
            </DialogPrimitive.Close>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#c49deb]">
              <Loader2 className="h-16 w-16 animate-spin" />
              <p className="mt-4 text-lg">Cargando detalles del menú...</p>
            </div>
          ) : detailsError ? (
            <div className="text-center text-red-500 py-8">
              <p className="text-lg font-semibold">Error al cargar los detalles:</p>
              <p>{detailsError}</p>
            </div>
          ) : selectedMenuDetails ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="grid gap-6 py-4">
                {/* Sección de Información General del Menú */}
                <Card className="shadow-lg border-l-4 border-[#986ec2]">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-[#986ec2]">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 w-28">ID:</span>
                      <span className="text-gray-900">{selectedMenuDetails.id}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 w-28">Nombre:</span>
                      <span className="text-gray-900">{selectedMenuDetails.nombre}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 w-28">Restaurante:</span>
                      <span className="text-gray-900">{selectedMenuDetails.restaurante?.nombre || "N/A"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 w-28">Hotel:</span>
                      <span className="text-gray-900">{selectedMenuDetails.restaurante?.hotel?.nombre || "N/A"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 w-28">Estatus:</span>
                      <span
                        className={`font-semibold ${selectedMenuDetails.activo ? "text-green-600" : "text-red-600"}`}
                      >
                        {selectedMenuDetails.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 w-28">Creación:</span>
                      <span className="text-gray-900">
                        {new Date(selectedMenuDetails.fechacreacion).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="col-span-full">
                      <span className="font-medium text-gray-700 block mb-1">Descripción:</span>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                        {selectedMenuDetails.descripcion || "Sin descripción."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sección de Platillos Asignados */}
                <Card className="shadow-lg border-l-4 border-[#c49deb]">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-[#c49deb]">Platillos Asignados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignedPlatillos.length === 0 ? (
                      <div className="text-center text-gray-500 py-4">Este menú no tiene platillos asignados.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Imagen</TableHead>
                              <TableHead>Platillo</TableHead>
                              <TableHead>Costo Elaboración</TableHead>
                              <TableHead>Precio Venta</TableHead>
                              <TableHead>Margen Utilidad</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assignedPlatillos.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div className="relative w-16 h-16 rounded-md overflow-hidden">
                                    <Image
                                      src={
                                        item.platillo?.imgurl || "/placeholder.svg?height=64&width=64&query=platillo"
                                      }
                                      alt={item.platillo?.nombre || "Platillo"}
                                      layout="fill"
                                      objectFit="cover"
                                      className="rounded-md"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{item.platillo?.nombre || "N/A"}</TableCell>
                                <TableCell>${(item.platillo?.costototal || 0).toFixed(2)}</TableCell>
                                <TableCell>${(item.precioventa || 0).toFixed(2)}</TableCell>
                                <TableCell>{(item.margenutilidad || 0).toFixed(2)}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
