"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, BookOpen, Search, RotateCcw, Eye, Edit, Power, PowerOff, AlertCircle, X } from "lucide-react"
import { getSession } from "@/app/actions/session-actions"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import Image from "next/image" // Se eliminó la importación duplicada de Image
import { getRecetaDetails } from "@/app/actions/recetas-details-actions"

interface SessionData {
  UsuarioId: string | null
  Email: string | null
  NombreCompleto: string | null
  HotelId: string | null
  RolId: string | null
  Permisos: string[] | null
  SesionActiva: boolean | null
}

interface Hotel {
  id: number
  nombre: string
}

interface Receta {
  folio: number
  receta: string
  notaspreparacion: string
  costo: number
  hotel: string
  activo: boolean
}

interface RecetaDetalle {
  id: number
  nombre: string
  notaspreparacion: string
  costo: number
  activo: boolean
  fechacreacion: string
  imgurl: string | null
}

interface IngredienteReceta {
  id: number
  Ingrediente: string
  cantidad: number
  ingredientecostoparcial: number
}

interface PlatilloReceta {
  id: number
  Platillo: string
  imgurl: string | null
}

interface RecetaCompleta {
  receta: RecetaDetalle | null
  ingredientes: IngredienteReceta[]
  platillos: PlatilloReceta[]
  error?: string
}

export default function RecetasPage() {
  const router = useRouter()

  // Estados de sesión y carga
  const [sesion, setSesion] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados de datos
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [totalRecetas, setTotalRecetas] = useState(0)

  // Estados de filtros
  const [txtRecetaNombre, setTxtRecetaNombre] = useState("")
  const [ddlHotelReceta, setDdlHotelReceta] = useState("-1") // Valor por defecto para "Todos"
  const [ddlEstatusReceta, setDdlEstatusReceta] = useState("true") // Valor por defecto "Activo"

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  // Estados para el modal de detalles
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedRecetaDetails, setSelectedRecetaDetails] = useState<RecetaCompleta | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // Cargar sesión al montar el componente
  useEffect(() => {
    cargarSesion()
  }, [])

  // Cargar datos iniciales cuando la sesión esté lista
  useEffect(() => {
    if (sesion) {
      cargarHoteles()
      cargarEstadisticas()
      cargarRecetasIniciales()
    }
  }, [sesion])

  const cargarSesion = async () => {
    try {
      const datosSession = await getSession()

      // Validación de seguridad
      if (!datosSession || datosSession.SesionActiva !== true) {
        router.push("/login")
        return
      }

      if (!datosSession.RolId || Number.parseInt(datosSession.RolId.toString(), 10) === 0) {
        router.push("/login")
        return
      }

      setSesion(datosSession)
    } catch (error) {
      console.error("Error cargando sesión:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const cargarHoteles = async () => {
    try {
      if (!sesion) return

      const rolId = Number.parseInt(sesion.RolId?.toString() || "0", 10)
      const hotelIdSesion = Number.parseInt(sesion.HotelId?.toString() || "0", 10)

      let auxHotelid: number
      if (![1, 2, 3, 4].includes(rolId)) {
        auxHotelid = hotelIdSesion
      } else {
        auxHotelid = -1
      }

      let fetchedHoteles: Hotel[] = []
      let defaultSelectedValue = "-1" // Valor por defecto para el ddl

      if (auxHotelid === -1) {
        // Si auxHotelid es -1, obtener todos los hoteles y agregar "Todos"
        const { data, error } = await supabase.from("hoteles").select("id, nombre").order("nombre", { ascending: true })

        if (error) throw error

        fetchedHoteles = [{ id: -1, nombre: "Todos" }, ...(data || [])]
        defaultSelectedValue = "-1" // Seleccionar "Todos"
      } else {
        // Si auxHotelid tiene un valor específico, filtrar por ese hotel
        const { data, error } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .eq("id", auxHotelid)
          .order("nombre", { ascending: true })

        if (error) throw error

        fetchedHoteles = data || []
        // Si se encontró el hotel, seleccionarlo, de lo contrario, volver a "Todos"
        defaultSelectedValue = fetchedHoteles.length > 0 ? auxHotelid.toString() : "-1"
      }

      setHoteles(fetchedHoteles)
      setDdlHotelReceta(defaultSelectedValue) // Aplicar el valor por defecto
    } catch (error: any) {
      console.error("Error cargando hoteles:", error)
      setError(`Error al cargar hoteles: ${error.message}`)
      setHoteles([])
      setDdlHotelReceta("-1") // Fallback a "Todos" en caso de error
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const { count, error } = await supabase.from("recetas").select("*", { count: "exact", head: true })

      if (error) throw error

      setTotalRecetas(count || 0)
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

  const cargarRecetasIniciales = useCallback(async () => {
    try {
      if (!sesion) return

      const rolId = Number.parseInt(sesion.RolId?.toString() || "0", 10)
      const hotelIdSesion = Number.parseInt(sesion.HotelId?.toString() || "0", 10)

      let auxHotelid: number
      if (![1, 2, 3, 4].includes(rolId)) {
        auxHotelid = hotelIdSesion
      } else {
        auxHotelid = -1
      }

      let query = supabase
        .from("recetas")
        .select(`
          id,
          nombre,
          notaspreparacion,
          costo,
          activo,
          ingredientesxreceta!inner (
            ingredientes!inner (
              hoteles!inner (
                id, nombre
              )
            )
          )
        `)
        .eq("activo", ddlEstatusReceta === "true")

      // Aplicar filtro de hotel si auxHotelid no es -1
      if (auxHotelid !== -1) {
        query = query.eq("ingredientesxreceta.ingredientes.hoteles.id", auxHotelid)
      }

      const { data, error } = await query
        .order("nombre", { ascending: true })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error

      const recetasFormateadas = (data || []).map((receta: any) => ({
        folio: receta.id,
        receta: receta.nombre,
        notaspreparacion: receta.notaspreparacion || "",
        costo: receta.costo || 0,
        hotel: receta.ingredientesxreceta?.[0]?.ingredientes?.hoteles?.nombre || "N/A",
        activo: receta.activo,
      }))

      setRecetas(recetasFormateadas)

      // Calcular total de páginas
      // Para el conteo, necesitamos una consulta similar pero solo para el count
      let countQuery = supabase
        .from("recetas")
        .select(
          `
          id,
          activo,
          ingredientesxreceta!inner (
            ingredientes!inner (
              hoteles!inner (
                id
              )
            )
          )
        `,
          { count: "exact", head: true },
        )
        .eq("activo", ddlEstatusReceta === "true")

      if (auxHotelid !== -1) {
        countQuery = countQuery.eq("ingredientesxreceta.ingredientes.hoteles.id", auxHotelid)
      }

      const { count: totalCount } = await countQuery
      setTotalPages(Math.ceil((totalCount || 0) / itemsPerPage))
    } catch (error) {
      console.error("Error cargando recetas iniciales:", error)
      setError("Error al cargar las recetas. Por favor, intente de nuevo.")
      setRecetas([])
    }
  }, [sesion, currentPage, ddlEstatusReceta])

  const btnRecetaBuscar = async () => {
    try {
      setSearching(true)

      if (!sesion) return

      const rolId = Number.parseInt(sesion.RolId?.toString() || "0", 10)
      const hotelIdSesion = Number.parseInt(sesion.HotelId?.toString() || "0", 10)

      let auxHotelid: number
      if (![1, 2, 3, 4].includes(rolId)) {
        auxHotelid = hotelIdSesion
      } else {
        auxHotelid = -1
      }

      // Determinar el ID de hotel a filtrar para la búsqueda
      const hotelFilterId = ddlHotelReceta !== "-1" ? Number.parseInt(ddlHotelReceta, 10) : auxHotelid

      let query = supabase
        .from("recetas")
        .select(`
          id,
          nombre,
          notaspreparacion,
          costo,
          activo,
          ingredientesxreceta!inner (
            ingredientes!inner (
              hoteles!inner (
                id, nombre
              )
            )
          )
        `)
        .eq("activo", ddlEstatusReceta === "true")

      // Filtro por nombre
      if (txtRecetaNombre.trim()) {
        query = query.ilike("nombre", `%${txtRecetaNombre.trim()}%`)
      }

      // Filtro por hotel
      if (hotelFilterId !== -1) {
        query = query.eq("ingredientesxreceta.ingredientes.hoteles.id", hotelFilterId)
      }

      const { data, error } = await query
        .order("nombre", { ascending: true })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error

      const recetasFormateadas = (data || []).map((receta: any) => ({
        folio: receta.id,
        receta: receta.nombre,
        notaspreparacion: receta.notaspreparacion || "",
        costo: receta.costo || 0,
        hotel: receta.ingredientesxreceta?.[0]?.ingredientes?.hoteles?.nombre || "N/A",
        activo: receta.activo,
      }))

      setRecetas(recetasFormateadas)

      // Calcular total de páginas para la búsqueda
      let countQuery = supabase
        .from("recetas")
        .select(
          `
          id,
          activo,
          ingredientesxreceta!inner (
            ingredientes!inner (
              hoteles!inner (
                id
              )
            )
          )
        `,
          { count: "exact", head: true },
        )
        .eq("activo", ddlEstatusReceta === "true")

      if (txtRecetaNombre.trim()) {
        countQuery = countQuery.ilike("nombre", `%${txtRecetaNombre.trim()}%`)
      }

      if (hotelFilterId !== -1) {
        countQuery = countQuery.eq("ingredientesxreceta.ingredientes.hoteles.id", hotelFilterId)
      }

      const { count: totalCount } = await countQuery
      setTotalPages(Math.ceil((totalCount || 0) / itemsPerPage))

      // Simular animación de 0.5 segundos
      setTimeout(() => {
        setSearching(false)
      }, 500)
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setError("Error al realizar la búsqueda. Por favor, intente de nuevo.")
      setSearching(false)
    }
  }

  const clearPlatillosBusqueda = () => {
    setTxtRecetaNombre("")
    setDdlHotelReceta("-1") // Restablecer a "Todos"
    setDdlEstatusReceta("true") // Restablecer a "Activo"
    setCurrentPage(1)
    cargarRecetasIniciales() // Recargar con filtros por defecto
  }

  const toggleEstadoReceta = async (folio: number, estadoActual: boolean) => {
    const accion = estadoActual ? "inactivar" : "activar"
    const confirmacion = window.confirm(`¿Está seguro que desea ${accion} esta receta?`)

    if (!confirmacion) return

    try {
      const { error } = await supabase.from("recetas").update({ activo: !estadoActual }).eq("id", folio)

      if (error) throw error

      toast.success(`Receta ${estadoActual ? "inactivada" : "activada"} correctamente`)
      btnRecetaBuscar() // Recargar la lista con los filtros actuales
    } catch (error) {
      console.error("Error cambiando estado:", error)
      toast.error("Error al cambiar el estado de la receta")
    }
  }

  const btnRecetaNuevo = () => {
    router.push("/recetas/nuevo")
  }

  // Nueva función para manejar la visualización de detalles de la receta
  const handleViewRecetaDetails = async (recetaId: number) => {
    setLoadingDetails(true)
    setDetailsError(null)
    setSelectedRecetaDetails(null)
    setShowDetailsDialog(true) // Abrir el diálogo inmediatamente para mostrar el estado de carga

    try {
      const result = await getRecetaDetails(recetaId)
      if (result.error) {
        setDetailsError(result.error)
        toast.error(result.error)
      } else {
        setSelectedRecetaDetails(result)
      }
    } catch (err: any) {
      console.error("Error al cargar detalles de la receta:", err)
      setDetailsError("Error al cargar los detalles de la receta.")
      toast.error("Error al cargar los detalles de la receta.")
    } finally {
      setLoadingDetails(false)
    }
  }

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

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sub-Recetas</h1>
          <p className="text-lg text-muted-foreground">Gestión de Sub-Recetas</p>
        </div>
        <Button
          id="btnRecetaNuevo"
          name="btnRecetaNuevo"
          type="button"
          onClick={btnRecetaNuevo}
          style={{
            backgroundColor: "#cfa661",
            color: "white",
            border: "none",
          }}
          className="hover:opacity-90 transition-opacity"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Nueva Sub-Receta
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sub-Recetas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecetas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="frmRecetasBuscar" name="frmRecetasBuscar" className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="txtRecetaNombre">Nombre</Label>
              <Input
                id="txtRecetaNombre"
                name="txtRecetaNombre"
                type="text"
                maxLength={150}
                value={txtRecetaNombre}
                onChange={(e) => setTxtRecetaNombre(e.target.value)}
                placeholder="Buscar por nombre..."
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="ddlHotelReceta">Hotel</Label>
              <Select value={ddlHotelReceta} onValueChange={setDdlHotelReceta}>
                <SelectTrigger id="ddlHotelReceta" name="ddlHotelReceta">
                  <SelectValue placeholder="Seleccione un hotel" />
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

            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="ddlEstatusReceta">Estatus</Label>
              <Select value={ddlEstatusReceta} onValueChange={setDdlEstatusReceta}>
                <SelectTrigger id="ddlEstatusReceta" name="ddlEstatusReceta">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              id="btnRecetaLimpiar"
              name="btnRecetaLimpiar"
              type="button"
              onClick={clearPlatillosBusqueda}
              style={{
                backgroundColor: "#edc787",
                color: "black",
                fontSize: "12px",
              }}
              className="hover:opacity-90"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpiar filtros
            </Button>

            <Button
              id="btnRecetaBuscar"
              name="btnRecetaBuscar"
              type="button"
              onClick={btnRecetaBuscar}
              disabled={searching}
              style={{
                backgroundColor: "#edc787",
                color: "black",
                fontSize: "12px",
              }}
              className="hover:opacity-90"
            >
              {searching ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Search className="h-3 w-3 mr-1" />}
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Sub-Recetas</CardTitle>
          <CardDescription>
            Mostrando {recetas.length} de {totalRecetas} sub-recetas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center space-y-2">
                <BookOpen className="h-8 w-8 animate-pulse text-[#cfa661]" />
                <span className="text-sm text-muted-foreground">Buscando sub-recetas...</span>
              </div>
            </div>
          ) : (
            <Table id="tblRecetaResultados">
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Sub-Receta</TableHead>
                  <TableHead>Notas Preparación</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recetas.map((receta) => (
                  <TableRow key={receta.folio}>
                    <TableCell>{receta.folio}</TableCell>
                    <TableCell>{receta.receta}</TableCell>
                    <TableCell>{receta.notaspreparacion}</TableCell>
                    <TableCell>${receta.costo.toFixed(2)}</TableCell>
                    <TableCell>{receta.hotel}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewRecetaDetails(receta.folio)} // Cambiado para abrir el modal
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/recetas/${receta.folio}/editar`)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleEstadoReceta(receta.folio, receta.activo)}
                        >
                          {receta.activo ? (
                            <PowerOff className="h-3 w-3 text-red-500" />
                          ) : (
                            <Power className="h-3 w-3 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles de Receta */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <DialogTitle className="text-2xl font-bold text-[#cfa661]">Detalles de Sub-Receta</DialogTitle>
            <DialogPrimitive.Close asChild>
              {" "}
              {/* Usado DialogPrimitive.Close */}
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-5 w-5" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </DialogPrimitive.Close>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-10 w-10 animate-spin text-[#cfa661]" />
                <span className="text-lg text-muted-foreground">Cargando detalles de la sub-receta...</span>
              </div>
            </div>
          ) : detailsError ? (
            <div className="flex flex-1 items-center justify-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{detailsError}</AlertDescription>
              </Alert>
            </div>
          ) : selectedRecetaDetails?.receta ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 py-4">
                {/* Sección de Detalles de la Receta */}
                <Card className="lg:col-span-3 w-[410px] shadow-lg border-t-4 border-[#cfa661]">
                  <CardHeader>
                    <CardTitle className="text-xl">{selectedRecetaDetails.receta.nombre}</CardTitle>
                    <CardDescription>Información general de la sub-receta</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {selectedRecetaDetails.receta.imgurl && (
                      <div className="w-full max-w-xs mx-auto mb-4">
                        <AspectRatio ratio={16 / 9}>
                          <Image
                            src={selectedRecetaDetails.receta.imgurl || "/placeholder.svg"}
                            alt={`Imagen de ${selectedRecetaDetails.receta.nombre}`}
                            fill
                            className="rounded-md object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=180&width=320"
                            }}
                          />
                        </AspectRatio>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Folio:</div>
                      <div>{selectedRecetaDetails.receta.id}</div>
                      <div className="font-medium">Costo de Elaboración:</div>
                      <div>${selectedRecetaDetails.receta.costo?.toFixed(2) || "0.00"}</div>
                      <div className="font-medium">Estatus:</div>
                      <div>{selectedRecetaDetails.receta.activo ? "Activa" : "Inactiva"}</div>
                      <div className="font-medium">Fecha de Creación:</div>
                      <div>{new Date(selectedRecetaDetails.receta.fechacreacion).toLocaleDateString()}</div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-md mb-2">Notas de Preparación:</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedRecetaDetails.receta.notaspreparacion || "No hay notas de preparación."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sección de Ingredientes */}
                <Card className="lg:col-span-3 w-[400px] shadow-lg border-t-4 border-[#cfa661]">
                  <CardHeader>
                    <CardTitle className="text-xl">Ingredientes</CardTitle>
                    <CardDescription>Componentes de esta sub-receta</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedRecetaDetails.ingredientes.length > 0 ? (
                      <ScrollArea className="h-[400px] w-full rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead >Ingrediente</TableHead>
                              <TableHead className="text-right">Cantidad</TableHead>
                              <TableHead className="text-right">Costo Parcial</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedRecetaDetails.ingredientes.map((ingrediente) => (
                              <TableRow key={ingrediente.id}>
                                <TableCell className="text-xs">{ingrediente.Ingrediente}</TableCell>
                                <TableCell className="text-right">{ingrediente.cantidad}</TableCell>
                                <TableCell className="text-right">
                                  ${ingrediente.ingredientecostoparcial?.toFixed(2) || "0.00"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay ingredientes asociados a esta sub-receta.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Sección de Platillos que usan esta Receta */}
                <Card className="lg:col-span-6 shadow-lg border-t-4 border-[#cfa661]">
                  <CardHeader>
                    <CardTitle className="text-xl">Platillos que usan esta Sub-Receta</CardTitle>
                    <CardDescription>Platillos donde se utiliza esta sub-receta</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedRecetaDetails.platillos.length > 0 ? (
                      <ScrollArea className="h-[200px] w-full rounded-md border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-2">
                          {selectedRecetaDetails.platillos.map((platillo) => (
                            <Card key={platillo.id} className="flex flex-col items-center text-center p-2">
                              <AspectRatio ratio={1 / 1} className="w-24 h-24 mb-2">
                                <Image
                                  src={platillo.imgurl || "/placeholder.svg?height=96&width=96&query=platillo"}
                                  alt={`Imagen de ${platillo.Platillo}`}
                                  fill
                                  className="rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg?height=96&width=96"
                                  }}
                                />
                              </AspectRatio>
                              <p className="font-medium text-sm">{platillo.Platillo}</p>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">Ningún platillo utiliza esta sub-receta.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">No se encontraron detalles para esta sub-receta.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
