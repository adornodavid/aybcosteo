"use client"

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

    setIsSubmitting(true)
    const res = await agregarPlatilloAMenu({
      menuid: menuId,
      platilloid: Number.parseInt(selectedPlatilloId),
      precioventa: Number.parseFloat(precioVenta),
      costoplatillo: Number.parseFloat(costoPlatillo),
      costoadministrativo: Number.parseFloat(costoAdministrativo), // Pasar el costo administrativo
    })

    if (res.data) {
      toast({
        title: "Éxito",
        description: "Platillo asignado al menú.",
      })
      setDialogOpen(false)
      setSelectedPlatilloId("")
      setCostoPlatillo("")
      setCostoAdministrativo("") // Limpiar costo administrativo
      setPrecioVenta("")
      setPrecioSugerido("") // Limpiar precio sugerido
      setSelectedPlatilloDetailsForForm(null) // Limpiar detalles del formulario
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
          setCostoAdministrativo("")
        }
        // Actualizar el precio sugerido si está disponible
        if (detailsRes.data.precioSugerido !== null && detailsRes.data.precioSugerido !== undefined) {
          setPrecioSugerido(detailsRes.data.precioSugerido.toFixed(2).toString())
        } else {
          setPrecioSugerido("")
        }
      } else {
        setSelectedPlatilloDetailsForForm(null)
        setCostoAdministrativo("") // Limpiar si hay error
        setPrecioSugerido("") // Limpiar si hay error
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

    setIsSubmitting(true)
    const res = await actualizarPrecioVenta({
      menuid: menuId,
      platilloid: platilloToEdit.platilloid,
      precioventa: Number.parseFloat(editPrecioVenta),
      costoplatillo: platilloToEdit.platillos?.costototal || 0, // Usar el costo del platillo asignado
      costoadministrativo: platilloToEdit.platillos?.costoadministrativo || 0, // Pasar el costo administrativo
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
          <h1 className="text-3xl font-bold">Platillos de Menú</h1>
        </div>
        <Button id="btnAgregarPlatillo" name="btnAgregarPlatillo" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Platillo
        </Button>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Platillos Asignados</h2>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando platillos...</span>
          </div>
        ) : assignedPlatillos.length === 0 ? (
          <p className="text-gray-500">No hay platillos asignados a este menú.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assignedPlatillos.map((platillo) => (
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
                    {platillo.precioventa !== null && (
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-gray-700 text-sm">Precio Venta: ${platillo.precioventa?.toFixed(2)}</p>
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
                    )}
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Dialog para agregar platillo al menú */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {" "}
          {/* Aumentado el ancho aquí */}
          <DialogHeader>
            <DialogTitle>Agregar Platillo al Menú</DialogTitle>
            <DialogDescription>Selecciona un platillo y define su precio de venta.</DialogDescription>
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
                      <TableRow>
                        <TableCell className="font-medium">Costo de Elaboracion:</TableCell>
                        <TableCell>${selectedPlatilloDetailsForForm.costototal?.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Costo Total:</TableCell>
                        <TableCell>
                          ${selectedPlatilloDetailsForForm.costoadministrativo?.toFixed(2) || "0.00"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">% Administracion:</TableCell>
                        <TableCell className="text-sm">75%</TableCell>
                      </TableRow>
                      {precioSugerido && ( // Mostrar solo si hay un precio sugerido
                        <TableRow>
                          <TableCell className="font-medium">Precio Sugerido:</TableCell>
                          <TableCell>${precioSugerido}</TableCell>
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
                onChange={(e) => {
                  setPrecioVenta(e.target.value)
                  setShowValidationAlert(false) // Ocultar la alerta al empezar a escribir
                }}
                className="col-span-3"
                placeholder="Precio de venta del platillo"
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
                  <TableRow>
                    <TableCell className="font-medium">Costo de Elaboracion:</TableCell>
                    <TableCell>${selectedPlatilloForDetails.costototal?.toFixed(2) || "0.00"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Costo Total:</TableCell>
                    <TableCell>${selectedPlatilloForDetails.costoadministrativo?.toFixed(2) || "0.00"}</TableCell>
                  </TableRow>
                  {precioSugerido && ( // Mostrar solo si hay un precio sugerido
                    <TableRow>
                      <TableCell className="font-medium">Precio Sugerido:</TableCell>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtCostoPla" className="text-right">
                Costo Platillo
              </Label>
              <Input
                id="txtCostoPla"
                name="txtCostoPla"
                type="text"
                value={platilloToEdit?.platillos?.costototal?.toFixed(2) || ""}
                className="col-span-3"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtCostoAdmin" className="text-right">
                Costo Administrativo
              </Label>
              <Input
                id="txtCostoAdmin"
                name="txtCostoAdmin"
                type="text"
                value={platilloToEdit?.platillos?.costoadministrativo?.toFixed(2) || ""}
                className="col-span-3"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="txtPreVen" className="text-right">
                Precio Venta
              </Label>
              <Input
                id="txtPreVen"
                name="txtPreVen"
                type="number"
                value={editPrecioVenta}
                onChange={(e) => setEditPrecioVenta(e.target.value)}
                className="col-span-3"
                placeholder="Nuevo precio de venta"
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
