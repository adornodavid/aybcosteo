"use client"

/* ==================================================
  Imports
================================================== */
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  agregarPlatilloAMenu,
  obtenerPlatillosDeMenu,
  obtenerTodosLosPlatillos,
  eliminarPlatilloDeMenu,
  obtenerDetallePlatillo,
  actualizarPrecioVenta, // Importar la acción de actualizar precio
} from "@/app/actions/menu-platillos-actions"
import type { MenuPlatillo, Platillo } from "@/lib/types-sistema-costeo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, Plus, Trash2, Pencil, TriangleAlert } from "lucide-react" // Importar Pencil y TriangleAlert
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase" // Import the correct client for client-side fetching

interface AgregarPlatillosPageProps {
  params: {
    id: string // menu.id
  }
}

export default function AgregarPlatillosPage({ params }: AgregarPlatillosPageProps) {
  const menuId = Number.parseInt(params.id)
  const router = useRouter()
  const { toast } = useToast()

  const [assignedPlatillos, setAssignedPlatillos] = useState<MenuPlatillo[]>([])
  const [availablePlatillos, setAvailablePlatillos] = useState<Platillo[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false) // Para agregar platillo
  const [selectedPlatilloId, setSelectedPlatilloId] = useState<string>("")
  const [costoPlatillo, setCostoPlatillo] = useState<string>("")
  const [costoAdministrativo, setCostoAdministrativo] = useState<string>("") // Nueva variable de estado
  const [precioVenta, setPrecioVenta] = useState<string>("")
  const [precioSugerido, setPrecioSugerido] = useState<string>("") // Nueva variable de estado para precio sugerido
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showValidationAlert, setShowValidationAlert] = useState(false) // Nuevo estado para la alerta de validación
  const [costoPorcentual, setCostoPorcentual] = useState<string>("") // Nuevo estado para Costo%
  const [searchFilter, setSearchFilter] = useState<string>("") // Nuevo estado para el filtro de búsqueda
  const [sortOrder, setSortOrder] = useState<string>("") // Nuevo estado para el ordenamiento

  // Estados para el modal de detalles del platillo
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedPlatilloForDetails, setSelectedPlatilloForDetails] = useState<Platillo | null>(null)

  // Estado para la tabla de información del platillo en el formulario de agregar
  const [selectedPlatilloDetailsForForm, setSelectedPlatilloDetailsForForm] = useState<Platillo | null>(null)

  // Nuevos estados para el modal de edición de precio
  const [showEditPriceDialog, setShowEditPriceDialog] = useState(false)
  const [platilloToEdit, setPlatilloToEdit] = useState<MenuPlatillo | null>(null)
  const [editPrecioVenta, setEditPrecioVenta] = useState<string>("")

  const fetchPlatillos = useCallback(async () => {
    setLoading(true)
    const [assignedRes, availableRes] = await Promise.all([obtenerPlatillosDeMenu(menuId), obtenerTodosLosPlatillos()])

    if (assignedRes.data) {
      setAssignedPlatillos(assignedRes.data)
    } else {
      toast({
        title: "Error",
        description: assignedRes.error || "Error al cargar platillos asignados.",
        variant: "destructive",
      })
    }

    if (availableRes.data) {
      const assignedIds = new Set(assignedRes.data?.map((p) => p.platilloid) || [])
      const filteredAvailable = availableRes.data.filter((p) => !assignedIds.has(p.id))
      setAvailablePlatillos(filteredAvailable)
    } else {
      toast({
        title: "Error",
        description: availableRes.error || "Error al cargar platillos disponibles.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }, [menuId, toast])

  useEffect(() => {
    fetchPlatillos()
  }, [fetchPlatillos])

  // Función para limpiar los inputs del diálogo
  const resetDialogInputs = useCallback(() => {
    setSelectedPlatilloId("")
    setCostoPlatillo("")
    setCostoAdministrativo("")
    setPrecioVenta("")
    setPrecioSugerido("")
    setSelectedPlatilloDetailsForForm(null)
    setCostoPorcentual("")
    setShowValidationAlert(false) // También limpiar la alerta de validación
  }, [])

  const calcularCostoPorcentual = async (precioVenta: string, platilloId: number) => {
    if (!precioVenta || Number.parseFloat(precioVenta) <= 0) {
      setCostoPorcentual("")
      return
    }

    try {
      const supabase = createClient() // Usar createClient para el lado del cliente
      const { data, error } = await supabase
        .from("platillos")
        .select("costoadministrativo")
        .eq("id", platilloId)
        .single()

      if (error || !data) {
        setCostoPorcentual("")
        return
      }

      const costoAdmin = data.costoadministrativo || 0
      const precio = Number.parseFloat(precioVenta)
      const porcentaje = (costoAdmin / precio) * 100 // Multiplicar por 100 para obtener porcentaje
      setCostoPorcentual(porcentaje.toFixed(2)) // Formatear a 2 decimales
    } catch (error) {
      setCostoPorcentual("")
    }
  }

  const handleAddPlatillo = async () => {
    // Validar que se haya seleccionado un platillo y se haya ingresado un precio de venta
    if (!selectedPlatilloId || !precioVenta || Number.parseFloat(precioVenta) <= 0) {
      setShowValidationAlert(true) // Mostrar la alerta
      return
    }
    setShowValidationAlert(false) // Ocultar la alerta si la validación pasa

    const platilloExistente = assignedPlatillos.find((p) => p.platilloid === Number.parseInt(selectedPlatilloId))
    if (platilloExistente) {
      toast({
        title: "Error",
        description: "El platillo seleccionado ya existe para este menu",
        variant: "destructive",
      })
      return
    }

    // Asegurarse de que costoPorcentual esté calculado antes de llamar a la acción
    const currentCostoPorcentual = Number.parseFloat(costoPorcentual)
    if (isNaN(currentCostoPorcentual)) {
      toast({
        title: "Error de cálculo",
        description: "El costo porcentual no pudo ser calculado. Asegúrate de que el precio de venta sea válido.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const res = await agregarPlatilloAMenu({
      menuid: menuId,
      platilloid: Number.parseInt(selectedPlatilloId),
      precioventa: Number.parseFloat(precioVenta),
      costoplatillo: Number.parseFloat(costoPlatillo),
      costoadministrativo: Number.parseFloat(costoAdministrativo), // Pasar el costo administrativo
      costoporcentual: currentCostoPorcentual, // Pasar el nuevo parámetro
    })

    if (res.data) {
      toast({
        title: "Éxito",
        description: "Platillo asignado al menú.",
      })
      setDialogOpen(false)
      resetDialogInputs() // Limpiar inputs al agregar exitosamente
      fetchPlatillos() // Actualizar el listado
    } else {
      toast({
        title: "Error",
        description: res.error || "Error al asignar platillo.",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const handlePlatilloSelect = async (value: string) => {
    setSelectedPlatilloId(value)
    // Reset validation alert when a platillo is selected
    setShowValidationAlert(false)

    const selected = availablePlatillos.find((p) => p.id === Number.parseInt(value))
    if (selected && selected.costototal !== null) {
      setCostoPlatillo(selected.costototal.toString())
    } else {
      setCostoPlatillo("")
    }

    // Cargar detalles completos del platillo para la tabla de información
    if (value) {
      const detailsRes = await obtenerDetallePlatillo(Number.parseInt(value))
      if (detailsRes.data) {
        setSelectedPlatilloDetailsForForm(detailsRes.data)
        // Actualizar el costo administrativo si está disponible
        if (detailsRes.data.costoadministrativo !== null) {
          setCostoAdministrativo(detailsRes.data.costoadministrativo.toString())
        } else {
          setCostoAdministrativo("") // Limpiar si no hay costo administrativo
        }
        // Actualizar el precio sugerido si está disponible
        if (detailsRes.data.precioSugerido !== null && detailsRes.data.precioSugerido !== undefined) {
          setPrecioSugerido(detailsRes.data.precioSugerido.toFixed(2).toString())
        } else {
          setPrecioSugerido("") // Limpiar si no hay precio sugerido
        }

        // Calcular costo porcentual si hay precio de venta
        if (precioVenta) {
          await calcularCostoPorcentual(precioVenta, Number.parseInt(value))
        } else {
          setCostoPorcentual("") // Limpiar si no hay precio de venta
        }
      } else {
        setSelectedPlatilloDetailsForForm(null)
        setCostoAdministrativo("") // Limpiar si hay error
        setPrecioSugerido("") // Limpiar si hay error
        setCostoPorcentual("") // Limpiar si hay error
        toast({
          title: "Error",
          description: detailsRes.error || "Error al cargar detalles del platillo.",
          variant: "destructive",
        })
      }
    } else {
      setSelectedPlatilloDetailsForForm(null)
      setCostoAdministrativo("") // Limpiar si no hay selección
      setPrecioSugerido("") // Limpiar si no hay selección
      setCostoPorcentual("") // Limpiar si no hay selección
    }
  }

  const handleViewDetails = (platillo: Platillo) => {
    setSelectedPlatilloForDetails(platillo)
    setShowDetailsDialog(true)
  }

  const handleDeletePlatillo = async (platilloIdToDelete: number) => {
    setIsSubmitting(true) // Reutilizar isSubmitting para el botón de eliminar
    const res = await eliminarPlatilloDeMenu({ menuid: menuId, platilloid: platilloIdToDelete })

    if (res.success) {
      toast({
        title: "Éxito",
        description: "Platillo eliminado del menú.",
      })
      fetchPlatillos() // Actualizar el listado
    } else {
      toast({
        title: "Error",
        description: res.error || "Error al eliminar platillo.",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  // Función para abrir el modal de edición de precio
  const handleEditPrice = (platillo: MenuPlatillo) => {
    setPlatilloToEdit(platillo)
    setEditPrecioVenta(platillo.precioventa?.toString() || "")
    // Establecer el precio sugerido del platillo para el modal de edición
    if (platillo.platillos?.precioSugerido !== null && platillo.platillos?.precioSugerido !== undefined) {
      setPrecioSugerido(platillo.platillos.precioSugerido.toFixed(2).toString())
    } else {
      setPrecioSugerido("")
    }
    // Recalcular costo porcentual al abrir el modal de edición
    if (platillo.precioventa && platillo.platilloid) {
      calcularCostoPorcentual(platillo.precioventa.toString(), platillo.platilloid)
    } else {
      setCostoPorcentual("")
    }
    setShowEditPriceDialog(true)
  }

  // Función para actualizar el precio de venta
  const handleUpdatePrecioVenta = async () => {
    if (!platilloToEdit || !editPrecioVenta) {
      toast({
        title: "Información faltante",
        description: "Favor de llenar el precio de venta.",
        variant: "destructive",
      })
      return
    }

    // Asegurarse de que costoPorcentual esté calculado antes de llamar a la acción
    const currentCostoPorcentual = Number.parseFloat(costoPorcentual)
    if (isNaN(currentCostoPorcentual)) {
      toast({
        title: "Error de cálculo",
        description: "El costo porcentual no pudo ser calculado. Asegúrate de que el precio de venta sea válido.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const res = await actualizarPrecioVenta({
      menuid: menuId,
      platilloid: platilloToEdit.platilloid,
      precioventa: Number.parseFloat(editPrecioVenta),
      costoplatillo: platilloToEdit.platillos?.costototal || 0, // Usar el costo del platillo asignado
      costoadministrativo: platilloToEdit.platillos?.costoadministrativo || 0, // Pasar el costo administrativo
      costoporcentual: currentCostoPorcentual, // Pasar el nuevo parámetro
    })

    if (res.data) {
      toast({
        title: "Éxito",
        description: "Precio de venta actualizado.",
      })
      setShowEditPriceDialog(false)
      setPlatilloToEdit(null)
      setEditPrecioVenta("")
      fetchPlatillos() // Actualizar el listado
    } else {
      toast({
        title: "Error",
        description: res.error || "Error al actualizar precio de venta.",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const filteredAndSortedAssignedPlatillos = assignedPlatillos
    .filter((platillo) => platillo.platillos?.nombre?.toLowerCase().includes(searchFilter.toLowerCase()) || false)
    .sort((a, b) => {
      switch (sortOrder) {
        case "precio-mayor":
          return (b.precioventa ?? 0) - (a.precioventa ?? 0)
        case "precio-menor":
          return (a.precioventa ?? 0) - (b.precioventa ?? 0)
        case "alfabetico-az":
          return (a.platillos?.nombre ?? "").localeCompare(b.platillos?.nombre ?? "")
        case "alfabetico-za":
          return (b.platillos?.nombre ?? "").localeCompare(a.platillos?.nombre ?? "")
        default:
          return 0
      }
    })

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            id="btnRegresarMenu"
            name="btnRegresarMenu"
            variant="outline"
            size="icon"
            onClick={() => router.push("/menus")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Regresar</span>
          </Button>
          <h1 className="text-3xl font-bold">Recetas de Menú:</h1>
        </div>
        <Button
          id="btnAgregarPlatillo"
          name="btnAgregarPlatillo"
          onClick={() => {
            resetDialogInputs() // Limpiar inputs al abrir el diálogo
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Recetas
        </Button>
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="searchReceta" className="text-sm font-medium">
              Receta:
            </Label>
            <Input
              id="searchReceta"
              name="searchReceta"
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar platillo..."
              className="w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sortOrder" className="text-sm font-medium">
              Ordenar:
            </Label>
            <Select value={sortOrder} onValueChange={setSortOrder} name="sortOrder">
              <SelectTrigger id="sortOrder" className="w-48">
                <SelectValue placeholder="Seleccionar orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin ordenar</SelectItem>
                <SelectItem value="precio-mayor">Precio Venta mayor</SelectItem>
                <SelectItem value="precio-menor">Precio Venta menor</SelectItem>
                <SelectItem value="alfabetico-az">Alfabéticamente (A-Z)</SelectItem>
                <SelectItem value="alfabetico-za">Alfabéticamente (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recetas Asignadas</h2>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando Recetas...</span>
          </div>
        ) : filteredAndSortedAssignedPlatillos.length === 0 ? (
          <p className="text-gray-500">
            {searchFilter
              ? "No se encontraron platillos que coincidan con la búsqueda."
              : "No hay platillos asignados a este menú."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedAssignedPlatillos.map((platillo) => (
              <Card key={platillo.id} className="flex flex-col items-center text-center relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-700"
                  onClick={() => handleDeletePlatillo(platillo.platilloid)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Eliminar Platillo</span>
                </Button>
                <div className="cursor-pointer w-full" onClick={() => handleViewDetails(platillo.platillos!)}>
                  <CardHeader className="p-0 w-full">
                    <div className="relative w-full h-40">
                      <Image
                        src={platillo.platillos?.imgurl || "/placeholder.svg?height=160&width=240&query=dish"}
                        alt={platillo.platillos?.nombre || "Imagen de platillo"}
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-t-lg"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 w-full">
                    <CardTitle className="text-lg font-bold mb-2">{platillo.platillos?.nombre}</CardTitle>

                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-gray-700 text-sm">Precio Venta: ${(platillo.precioventa ?? 0).toFixed(2)}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-500 hover:text-gray-700"
                          onClick={(e) => {
                            e.stopPropagation() // Evitar que se dispare handleViewDetails
                            handleEditPrice(platillo)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar Precio</span>
                        </Button>
                      </div>
                      <p className="text-gray-600 text-xs">
                        Con IVA: ${((platillo.precioventa ?? 0) * 1.16).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Dialog para agregar platillo al menú */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            // Si el diálogo se está cerrando
            resetDialogInputs() // Limpiar inputs al cerrar el diálogo
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {/* Aumentado el ancho aquí */}
          <DialogHeader>
            <DialogTitle>Agregar Recetas al Menú</DialogTitle>
            <DialogDescription>Selecciona una Recetas y define su precio de venta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ddlPlatillos" className="text-right">
                Platillo
              </Label>
              <Select value={selectedPlatilloId} onValueChange={handlePlatilloSelect} name="ddlPlatillos">
                <SelectTrigger id="ddlPlatillos" className="col-span-3">
                  <SelectValue placeholder="Selecciona un platillo" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlatillos.length === 0 ? (
                    <SelectItem value="no-platillos" disabled>
                      No hay platillos disponibles
                    </SelectItem>
                  ) : (
                    availablePlatillos.map((platillo) => (
                      <SelectItem key={platillo.id} value={platillo.id.toString()}>
                        {platillo.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedPlatilloDetailsForForm && (
              <Card className="col-span-4 mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Información del Platillo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Image
                      src={selectedPlatilloDetailsForForm.imgurl || "/placeholder.svg?height=80&width=80&query=dish"}
                      alt={selectedPlatilloDetailsForForm.nombre || "Imagen de platillo"}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />
                    <div>
                      <p className="font-semibold">{selectedPlatilloDetailsForForm.nombre}</p>
                      <p className="text-sm text-gray-600">{selectedPlatilloDetailsForForm.descripcion}</p>
                    </div>
                  </div>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Instrucciones:</TableCell>
                        <TableCell className="text-sm">
                          {selectedPlatilloDetailsForForm.instruccionespreparacion || "N/A"}
                        </TableCell>
                      </TableRow>
                      {/*<TableRow>
                        <TableCell className="font-medium">Costo de Elaboracion:</TableCell>
                        <TableCell>${(selectedPlatilloDetailsForForm.costototal ?? 0).toFixed(2)}</TableCell>
                      </TableRow>*/}
                      <TableRow>
                        <TableCell className="font-medium">Costo Total:</TableCell>
                        <TableCell>${(selectedPlatilloDetailsForForm.costoadministrativo ?? 0).toFixed(2)}</TableCell>
                      </TableRow>
                      {/*<TableRow>
                        <TableCell className="font-medium">% Administracion:</TableCell>
                        <TableCell className="text-sm">75%</TableCell>
                      </TableRow>*/}
                      {precioSugerido && ( // Mostrar solo si hay un precio sugerido
                        <TableRow>
                          <TableCell className="font-medium">Precio Mínimo:</TableCell>
                          <TableCell>${precioSugerido}</TableCell>
                          <TableCell className="text-sm">Porc.Administrativo 30%</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            {/*<div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtCostoPlatillo" className="text-right">
                Costo Platillo
              </Label>
              <Input
                id="txtCostoPlatillo"
                name="txtCostoPlatillo"
                type="text"
                value={costoPlatillo}
                onChange={(e) => setCostoPlatillo(e.target.value)}
                className="col-span-3"
                placeholder="Costo total del platillo"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtCostoAdministrativo" className="text-right">
                Costo Administrativo
              </Label>
              <Input
                id="txtCostoAdministrativo"
                name="txtCostoAdministrativo"
                type="text"
                value={costoAdministrativo}
                onChange={(e) => setCostoAdministrativo(e.target.value)}
                className="col-span-3"
                placeholder="Costo administrativo del platillo"
                readOnly
              />
            </div>*/}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtPrecioVenta" className="text-right">
                Precio Venta
              </Label>
              <Input
                id="txtPrecioVenta"
                name="txtPrecioVenta"
                type="number"
                value={precioVenta}
                onChange={async (e) => {
                  setPrecioVenta(e.target.value)
                  setShowValidationAlert(false) // Ocultar la alerta al empezar a escribir
                  // Calcular costo porcentual si hay platillo seleccionado
                  if (selectedPlatilloId) {
                    await calcularCostoPorcentual(e.target.value, Number.parseInt(selectedPlatilloId))
                  } else {
                    setCostoPorcentual("") // Limpiar si no hay platillo seleccionado
                  }
                }}
                className="col-span-3"
                placeholder="Precio de venta del platillo"
              />
            </div>
            {/* Nuevo input Costo% - Después de la línea 482 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtCostoPorcentual" className="text-right">
                Costo%
              </Label>
              <Input
                id="txtCostoPorcentual"
                name="txtCostoPorcentual"
                type="number"
                value={costoPorcentual}
                className={`text-center col-span-3 ${
                  costoPorcentual && Number.parseFloat(costoPorcentual) > 30.0
                    ? "border-red-500 bg-red-50"
                    : costoPorcentual && Number.parseFloat(costoPorcentual) <= 30.0
                      ? "border-green-500 bg-green-50"
                      : ""
                }`}
                placeholder="Costo porcentual calculado"
                disabled
                readOnly
              />
            </div>
          </div>
          {showValidationAlert && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-yellow-100 text-yellow-800 rounded-md">
              <TriangleAlert className="h-5 w-5" />
              <p className="text-sm">Selecciona un platillo y/o ingresa un precio de venta válido.</p>
            </div>
          )}
          <DialogFooter>
            <Button
              id="btnAsignarPlatillo"
              name="btnAsignarPlatillo"
              onClick={handleAddPlatillo}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                "Asignar Platillo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para mostrar detalles del platillo */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedPlatilloForDetails?.nombre}</DialogTitle>
            <DialogDescription>Detalles del Platillo</DialogDescription>
          </DialogHeader>
          {selectedPlatilloForDetails && (
            <div className="grid gap-4 py-4">
              <div className="relative w-full h-48">
                <Image
                  src={selectedPlatilloForDetails.imgurl || "/placeholder.svg?height=192&width=400&query=dish"}
                  alt={selectedPlatilloForDetails.nombre || "Imagen de platillo"}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-md"
                />
              </div>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Descripción:</TableCell>
                    <TableCell>{selectedPlatilloForDetails.descripcion || "N/A"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Instrucciones:</TableCell>
                    <TableCell>{selectedPlatilloForDetails.instruccionespreparacion || "N/A"}</TableCell>
                  </TableRow>
                  {/* <TableRow>
                   <TableCell className="font-medium">Costo de Elaboracion:</TableCell>
                    <TableCell>${(selectedPlatilloForDetails.costototal ?? 0).toFixed(2)}</TableCell>
                  </TableRow>*/}
                  <TableRow>
                    <TableCell className="font-medium">Costo Total:</TableCell>
                    <TableCell>${(selectedPlatilloForDetails.costoadministrativo ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                  {precioSugerido && ( // Mostrar solo si hay un precio sugerido
                    <TableRow>
                      <TableCell className="font-medium">Precio Mínimo:</TableCell>
                      <TableCell>${precioSugerido}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nuevo Dialog para editar precio de venta */}
      <Dialog open={showEditPriceDialog} onOpenChange={setShowEditPriceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Precio de Venta</DialogTitle>
            <DialogDescription>
              Actualiza el precio de venta para {platilloToEdit?.platillos?.nombre}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtNomPla" className="text-right">
                Platillo
              </Label>
              <Input
                id="txtNomPla"
                name="txtNomPla"
                type="text"
                value={platilloToEdit?.platillos?.nombre || ""}
                className="col-span-3"
                readOnly
              />
            </div>
            {platilloToEdit?.platillos?.imgurl && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Imagen</Label>
                <div className="col-span-3">
                  <Image
                    src={platilloToEdit.platillos.imgurl || "/placeholder.svg?height=80&width=80&query=dish"}
                    alt={platilloToEdit.platillos.nombre || "Imagen de platillo"}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                </div>
              </div>
            )}
            {/*<div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtCostoPla" className="text-right">
                Costo Platillo
              </Label>
              <Input
                id="txtCostoPla"
                name="txtCostoPla"
                type="text"
                value={(platilloToEdit?.platillos?.costototal ?? 0).toFixed(2) || ""}
                className="col-span-3"
                readOnly
              />
            </div> */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtCostoAdmin" className="text-right">
                Costo Total
              </Label>
              <Input
                id="txtCostoAdmin"
                name="txtCostoAdmin"
                type="text"
                value={(platilloToEdit?.platillos?.costoadministrativo ?? 0).toFixed(2) || ""}
                className="col-span-3"
                readOnly
                disabled
              />
            </div>
            {/* Línea 742: Aquí se inserta el Precio Mínimo */}
            {precioSugerido && ( // Mostrar solo si hay un precio sugerido
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="txtPrecioMinimo" className="text-right">
                  Precio Mínimo
                </Label>
                <Input
                  id="txtPrecioMinimo"
                  name="txtPrecioMinimo"
                  type="text"
                  value={precioSugerido} // Usar el estado precioSugerido que se setea en handleEditPrice
                  className="col-span-3"
                  readOnly
                  disabled
                />
              </div>
            )}
            {/* Línea 743: Continúa el código original */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtPreVen" className="text-right">
                Precio Venta(SinIva)
              </Label>
              <Input
                id="txtPreVen"
                name="txtPreVen"
                type="number"
                value={editPrecioVenta}
                //onChange={(e) => setEditPrecioVenta(e.target.value)}
                className="col-span-3"
                placeholder="Nuevo precio de venta"
                onChange={async (e) => {
                  setEditPrecioVenta(e.target.value)
                  setShowValidationAlert(false) // Ocultar la alerta al empezar a escribir
                  // Calcular costo porcentual si hay platillo seleccionado
                  if (platilloToEdit?.platilloid) {
                    await calcularCostoPorcentual(e.target.value, Number.parseInt(platilloToEdit.platilloid))
                  } else {
                    setCostoPorcentual("") // Limpiar si no hay platillo seleccionado
                  }
                }}
              />
            </div>
            {/* Nuevo input Costo% - Después de la línea 482 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtCostoPorc" className="text-right">
                Costo%
              </Label>
              <Input
                id="txtCostoPorc"
                name="txtCostoPorc"
                type="number"
                value={costoPorcentual}
                className={`text-center col-span-3 ${
                  costoPorcentual && Number.parseFloat(costoPorcentual) > 30.0
                    ? "border-red-600 bg-red-100"
                    : costoPorcentual && Number.parseFloat(costoPorcentual) <= 30.0
                      ? "border-green-600 bg-green-100"
                      : ""
                }`}
                placeholder="Costo porcentual calculado"
                disabled
                readOnly
              />
            </div>
            {/* Precio Venta (Con IVA) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtPrecioConIva" className="text-right">
                Precio Venta (Con IVA)
              </Label>
              <Input
                id="txtPrecioConIva"
                name="txtPrecioConIva"
                type="number"
                value={editPrecioVenta ? (Number.parseFloat(editPrecioVenta) * 1.16).toFixed(2) : ""}
                className="col-span-3"
                disabled
                readOnly
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              id="btnActualizarPrecio"
              name="btnActualizarPrecio"
              onClick={handleUpdatePrecioVenta}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar Precio"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
