"use client"

/* ==================================================
  Imports
================================================== */
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { RestauranteForm } from "@/components/restaurantes/restaurante-form"
import { useToast } from "@/hooks/use-toast"
import {
  obtenerRestaurantesFiltrados,
  obtenerRestaurantePorId,
  actualizarEstadoRestaurante,
} from "@/app/actions/restaurantes-actions"
import type { DropdownOption, Restaurante, RestauranteTableRow, UserSession } from "@/lib/types-sistema-costeo"
import { Loader2, Edit, ToggleLeft, ToggleRight, Search } from "lucide-react"
import Image from "next/image"
import { ImageIcon } from "@/components/ui/image-icon"
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

interface RestaurantesClientPageProps {
  initialRestaurantes: RestauranteTableRow[]
  initialTotalCount: number
  initialHotelOptions: DropdownOption[]
  initialRestauranteOptions: DropdownOption[]
  userSession: UserSession | null
}

export default function RestaurantesClientPage({
  initialRestaurantes,
  initialTotalCount,
  initialHotelOptions,
  initialRestauranteOptions,
  userSession,
}: RestaurantesClientPageProps) {
  const { toast } = useToast()
  const [restaurantes, setRestaurantes] = useState<RestauranteTableRow[]>(initialRestaurantes)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHotelId, setSelectedHotelId] = useState<string>("0")
  const [selectedRestauranteId, setSelectedRestauranteId] = useState<string>("0")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRestaurante, setEditingRestaurante] = useState<Restaurante | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [actionRestauranteId, setActionRestauranteId] = useState<number | null>(null)
  const [actionNewStatus, setActionNewStatus] = useState<boolean | null>(null)

  const [manualSearchTrigger, setManualSearchTrigger] = useState(0)
  const isInitialMount = useRef(true)

  const fetchRestaurantes = useCallback(async () => {
    setIsLoading(true)
    const rolId = userSession?.rol_id || 0
    const sessionHotelId = userSession?.hotel_id || null

      const { data, count, success, error } = await obtenerRestaurantesFiltrados(
        searchTerm,
        selectedHotelId === "0" ? null : Number(selectedHotelId),
        selectedRestauranteId === "0" ? null : Number(selectedRestauranteId),
        currentPage,
        pageSize,
        rolId,
        sessionHotelId,
      )

      if (success) {
        setRestaurantes(data)
        setTotalCount(count)
      } else {
        toast({
          title: "Error",
          description: error || "Error al cargar restaurantes.",
          variant: "destructive",
        })
        setRestaurantes([])
        setTotalCount(0)
      }
      setIsLoading(false) // Asegura que isLoading siempre se resetee a false
  }, [currentPage, pageSize, userSession, toast])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      // Omitir la búsqueda inicial ya que los datos provienen de las props del servidor
      // y solo queremos que fetchRestaurantes se ejecute en cambios de filtro o paginación.
      return
    }
    
    fetchRestaurantes()
  }, [manualSearchTrigger, currentPage])

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page on new search
    setManualSearchTrigger((prev) => prev + 1) // Disparar el useEffect
  }

  const handleEdit = async (id: number) => {
    const { data, success, error } = await obtenerRestaurantePorId(id)
    if (success && data) {
      setEditingRestaurante(data)
      setIsModalOpen(true)
    } else {
      toast({
        title: "Error",
        description: error || "No se pudo cargar la información del restaurante para editar.",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    setActionRestauranteId(id)
    setActionNewStatus(!currentStatus)
    setIsConfirmDialogOpen(true)
  }

  const confirmToggleStatus = async () => {
    if (actionRestauranteId !== null && actionNewStatus !== null) {
      const { success, message, error } = await actualizarEstadoRestaurante(actionRestauranteId, actionNewStatus)
      if (success) {
        toast({
          title: "Éxito",
          description: message,
        })
        setManualSearchTrigger((prev) => prev + 1) // Disparar una nueva búsqueda para actualizar la lista
      } else {
        toast({
          title: "Error",
          description: error || message,
          variant: "destructive",
        })
      }

      setIsConfirmDialogOpen(false)
      setActionRestauranteId(null)
      setActionNewStatus(null)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingRestaurante(null)
    setManualSearchTrigger((prev) => prev + 1) // Disparar una nueva búsqueda al cerrar el modal
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Gestión de Restaurantes</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5d8f72] hover:bg-[#44785a] text-white" onClick={() => setEditingRestaurante(null)}>Crear Nuevo Restaurante</Button>
          </DialogTrigger>
          <RestauranteForm
            isOpen={isModalOpen}
            onClose={handleModalClose}
            initialData={editingRestaurante}
            hotels={initialHotelOptions}
          />
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          id="txtRestauranteNombre"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch()
          }}
        />
        <Select onValueChange={setSelectedHotelId} value={selectedHotelId}>
          <SelectTrigger id="ddlHotel">
            <SelectValue placeholder="Filtrar por Hotel" />
          </SelectTrigger>
          <SelectContent>
            {initialHotelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setSelectedRestauranteId} value={selectedRestauranteId}>
          <SelectTrigger id="ddlRestaurante">
            <SelectValue placeholder="Filtrar por Restaurante" />
          </SelectTrigger>
          <SelectContent>
            {initialRestauranteOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button  className="bg-[#4a4a4a] text-white hover:bg-[#333333]" id="btnRestaurantesBuscar" onClick={handleSearch}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Buscar
        </Button>
      </div>

      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Imagen</TableHead>
              <TableHead>Hotel</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Cargando restaurantes...</p>
                </TableCell>
              </TableRow>
            ) : restaurantes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No se encontraron restaurantes.
                </TableCell>
              </TableRow>
            ) : (
              restaurantes.map((restaurante) => (
                <TableRow key={restaurante.Folio}>
                  <TableCell>{restaurante.Folio}</TableCell>
                  <TableCell>
                    {restaurante.Imagen ? (
                      <Image
                        src={restaurante.Imagen || "/placeholder.svg"}
                        alt={restaurante.Nombre}
                        width={72}
                        height={72}
                        className="rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{restaurante.Hotel}</TableCell>
                  <TableCell>{restaurante.Nombre}</TableCell>
                  <TableCell>{restaurante.Direccion}</TableCell>
                  <TableCell>{restaurante.Estatus ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(restaurante.Folio)} title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(restaurante.Folio, restaurante.Estatus)}
                      title={restaurante.Estatus ? "Inactivar" : "Activar"}
                    >
                      {restaurante.Estatus ? (
                        <ToggleLeft className="h-4 w-4 text-red-500" />
                      ) : (
                        <ToggleRight className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </Button>
      </div>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Acción</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas {actionNewStatus ? "activar" : "inactivar"} este restaurante?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
