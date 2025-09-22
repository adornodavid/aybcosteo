"use client"

/* ==================================================
  Imports
================================================== */
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  addIngredienteToReceta,
  deleteIngredienteFromReceta,
  getIngredientesByRecetaId,
  getIngredientesForDropdown,
  getRecetaDetails,
  getUnidadMedidaForDropdown,
  getCostoIngrediente,
  updateRecetaBasicInfo,
  updateRecetaCostoAndHistorico,
  getHotelIdFromRecetaIngredients,
} from "@/app/actions/recetas-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Loader2,
  PlusIcon,
  TrashIcon,
  SaveIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "lucide-react"
import type { IngredienteReceta, UnidadMedidaDropdown } from "@/lib/types-sistema-costeo"
import { ImageUpload } from "@/components/ui/image-upload"
import { useToast } from "@/components/ui/use-toast" // Mantener useToast para otros mensajes
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { obtenerHoteles } from "@/app/actions/hoteles-actions-correcto" // Importar obtenerHoteles
import { createClient } from "@supabase/supabase-js" // Importar createClient para la validación
import Image from "next/image"

// Configuración de Supabase para validación en cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface RecetaEditFormProps {
  recetaId: string
}

export function RecetaEditForm({ recetaId }: RecetaEditFormProps) {
  const router = useRouter()
  const { toast } = useToast() // Se mantiene para otros toasts
  const [isPending, startTransition] = useTransition()

  const [nombreReceta, setNombreReceta] = useState("")
  const [notasPreparacion, setNotasPreparacion] = useState<string | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [costoTotalReceta, setCostoTotalReceta] = useState<number>(0)

  const [ingredientesReceta, setIngredientesReceta] = useState<IngredienteReceta[]>([])
  const [ingredientesDropdown, setIngredientesDropdown] = useState<{ id: number; nombre: string }[]>([])
  const [selectedIngredienteId, setSelectedIngredienteId] = useState<string>("")
  const [cantidadIngrediente, setCantidadIngrediente] = useState<number>(0)
  const [unidadMedidaDropdown, setUnidadMedidaDropdown] = useState<UnidadMedidaDropdown[]>([])
  const [selectedUnidadMedidaId, setSelectedUnidadMedidaId] = useState<string>("")
  const [selectedIngredienteCosto, setSelectedIngredienteCosto] = useState<number>(0)
  const [isUnidadMedidaDisabled, setIsUnidadMedidaDisabled] = useState(false)

  const [hotelesDropdown, setHotelesDropdown] = useState<{ id: number; nombre: string }[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string>("")

  const [currentStep, setCurrentStep] = useState(1) // Estado para controlar las etapas
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false) // State for loading animation
  const [showIngredienteDuplicadoDialog, setShowIngredienteDuplicadoDialog] = useState(false) // Nuevo estado para modal de duplicado
  const [showIngredientesInsuficientesDialog, setShowIngredientesInsuficientesDialog] = useState(false) // Nuevo estado para el AlertDialog de ingredientes insuficientes

  useEffect(() => {
    const loadRecetaData = async () => {
      const { data, error } = await getRecetaDetails(recetaId)
      if (error) {
        toast({
          title: "Error",
          description: `Error al cargar detalles de la sub-receta: ${error.message}`,
          variant: "destructive",
        })
        return
      }
      if (data) {
        setNombreReceta(data.nombre)
        setNotasPreparacion(data.notaspreparacion)
        setImgUrl(data.imgurl)
        setCostoTotalReceta(data.costo || 0)
      }

      const { data: ingredientesData, error: ingredientesError } = await getIngredientesByRecetaId(recetaId)
      if (ingredientesError) {
        toast({
          title: "Error",
          description: `Error al cargar ingredientes de la sub-receta: ${ingredientesError.message}`,
          variant: "destructive",
        })
        return
      }
      if (ingredientesData) {
        setIngredientesReceta(ingredientesData)
      }

      // Load hotel ID from recipe's ingredients
      const { data: hotelIdData, error: hotelIdError } = await getHotelIdFromRecetaIngredients(recetaId)
      if (hotelIdError) {
        toast({
          title: "Error",
          description: `Error al cargar ID de hotel de los ingredientes: ${hotelIdError.message}`,
          variant: "destructive",
        })
        return
      }
      if (hotelIdData?.id) {
        setSelectedHotelId(String(hotelIdData.id))
      }

      // Load all hotels for the dropdown
      const { data: hotelesData, error: hotelesError } = await obtenerHoteles() // Usar obtenerHoteles()
      if (hotelesError) {
        toast({
          title: "Error",
          description: `Error al cargar hoteles: ${hotelesError.message}`,
          variant: "destructive",
        })
        return
      }
      if (hotelesData) {
        setHotelesDropdown(hotelesData)
      }
    }
    loadRecetaData()
  }, [recetaId, toast])

  useEffect(() => {
    if (selectedHotelId) {
      const loadIngredientes = async () => {
        const { data, error } = await getIngredientesForDropdown(Number(selectedHotelId))
        if (error) {
          toast({
            title: "Error",
            description: `Error al cargar ingredientes para el hotel: ${error.message}`,
            variant: "destructive",
          })
          return
        }
        if (data) {
          setIngredientesDropdown(data)
        }
      }
      loadIngredientes()
    } else {
      setIngredientesDropdown([])
    }
  }, [selectedHotelId, toast])

  useEffect(() => {
    if (selectedIngredienteId) {
      const loadUnidadMedidaAndCosto = async () => {
        const { data: umData, error: umError } = await getUnidadMedidaForDropdown(Number(selectedIngredienteId))
        if (umError) {
          toast({
            title: "Error",
            description: `Error al cargar unidad de medida: ${umError.message}`,
            variant: "destructive",
          })
          setUnidadMedidaDropdown([]) // Limpiar el dropdown en caso de error
          setSelectedUnidadMedidaId("")
          setIsUnidadMedidaDisabled(false) // Habilitar si hay error o no se encuentra
          return
        }
        if (umData && umData.length > 0) {
          setUnidadMedidaDropdown(umData) // <--- ESTA ES LA LÍNEA CLAVE FALTANTE
          setSelectedUnidadMedidaId(String(umData[0].id))
          setIsUnidadMedidaDisabled(true) // Deshabilitar después de seleccionar automáticamente
        } else {
          setUnidadMedidaDropdown([]) // Limpiar si no hay datos
          setSelectedUnidadMedidaId("")
          setIsUnidadMedidaDisabled(false) // Habilitar si no hay datos
        }

        const { data: costoData, error: costoError } = await getCostoIngrediente(Number(selectedIngredienteId))
        if (costoError) {
          toast({
            title: "Error",
            description: `Error al cargar costo del ingrediente: ${costoError.message}`,
            variant: "destructive",
          })
          setSelectedIngredienteCosto(0)
          return
        }
        if (costoData) {
          setSelectedIngredienteCosto(costoData.costo)
        } else {
          setSelectedIngredienteCosto(0)
        }
      }
      loadUnidadMedidaAndCosto()
    } else {
      setUnidadMedidaDropdown([]) // Limpiar cuando no hay ingrediente seleccionado
      setSelectedUnidadMedidaId("")
      setSelectedIngredienteCosto(0)
      setIsUnidadMedidaDisabled(false) // Habilitar cuando no hay ingrediente seleccionado
    }
  }, [selectedIngredienteId, toast])

  const handleAddIngrediente = async () => {
    if (!selectedIngredienteId || cantidadIngrediente <= 0 || !selectedUnidadMedidaId) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, selecciona un ingrediente, cantidad y unidad de medida válidos.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      // --- INICIO DE LA NUEVA VALIDACIÓN ---
      const { data: existingIngrediente, error: checkError } = await supabase
        .from("ingredientesxreceta")
        .select("id")
        .eq("recetaid", recetaId) // Usa recetaId de las props
        .eq("elementoid", Number(selectedIngredienteId))
        .eq("tiposegmentoid",1)
        .single()

      // Si hay un error y no es el error de "no rows found" (PGRST116), lo manejamos
      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error al verificar ingrediente existente:", checkError)
        toast({
          title: "Error",
          description: `Error al verificar ingrediente existente: ${checkError.message}`,
          variant: "destructive",
        })
        return // Sale del bloque startTransition
      }

      // Si se encontró un ingrediente existente, mostramos el diálogo y salimos
      if (existingIngrediente) {
        setShowIngredienteDuplicadoDialog(true)
        return // Sale del bloque startTransition
      }
      // --- FIN DE LA NUEVA VALIDACIÓN ---

      const { success, error } = await addIngredienteToReceta(
        recetaId,
        Number(selectedIngredienteId),
        cantidadIngrediente,
        selectedUnidadMedidaId,
        selectedIngredienteCosto,
      )

      if (success) {
        toast({
          title: "Ingrediente agregado",
          description: "El ingrediente se ha añadido a la sub-receta.",
        })
        // Recargar ingredientes de la receta y actualizar costo total
        const { data: updatedIngredientes, error: updatedIngredientesError } = await getIngredientesByRecetaId(recetaId)
        if (updatedIngredientesError) {
          toast({
            title: "Error",
            description: `Error al recargar ingredientes: ${updatedIngredientesError.message}`,
            variant: "destructive",
          })
          return
        }
        if (updatedIngredientes) {
          setIngredientesReceta(updatedIngredientes)
          const newCostoTotal = updatedIngredientes.reduce((sum, item) => sum + (item.ingredientecostoparcial || 0), 0)
          setCostoTotalReceta(newCostoTotal)
        }
        // Reset form fields
        setSelectedIngredienteId("")
        setCantidadIngrediente(0)
        setSelectedUnidadMedidaId("")
        setSelectedIngredienteCosto(0)
      } else {
        toast({
          title: "Error",
          description: `Error al agregar ingrediente: ${error?.message}`,
          variant: "destructive",
        })
      }
    })
  }

  const handleDeleteIngrediente = async (id: number) => {
    startTransition(async () => {
      const { success, error } = await deleteIngredienteFromReceta(id, recetaId)
      if (success) {
        toast({
          title: "Ingrediente eliminado",
          description: "El ingrediente se ha eliminado de la sub-receta.",
        })
        
        // Recargar ingredientes de la receta y actualizar costo total
        const { data: updatedIngredientes, error: updatedIngredientesError } = await getIngredientesByRecetaId(recetaId)
        if (updatedIngredientesError) {
          toast({
            title: "Error",
            description: `Error al recargar ingredientes: ${updatedIngredientesError.message}`,
            variant: "destructive",
          })
          return
        }
        if (updatedIngredientes) {
          setIngredientesReceta(updatedIngredientes)
          const newCostoTotal = updatedIngredientes.reduce((sum, item) => sum + (item.ingredientecostoparcial || 0), 0)
          setCostoTotalReceta(newCostoTotal)
        }
      } else {
        toast({
          title: "Error",
          description: `Error al eliminar ingrediente: ${error?.message}`,
          variant: "destructive",
        })
      } 
     
    })
     console.log("cons", id)
  }

  const handleUpdateRecetaBasicInfo = async () => {
    if (!nombreReceta) {
      toast({
        title: "Nombre de sub-receta requerido",
        description: "Por favor, ingresa un nombre para la sub-receta.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const { success, error } = await updateRecetaBasicInfo(recetaId, nombreReceta, notasPreparacion, imgUrl)
      if (success) {
        toast({
          title: "Información básica actualizada",
          description: "La información general de la sub-receta ha sido guardada.",
        })
        setCurrentStep(2) // Avanzar a la siguiente etapa
      } else {
        toast({
          title: "Error",
          description: `Error al actualizar información básica: ${error?.message}`,
          variant: "destructive",
        })
      }
    })
  }

  const handleUpdateRecetaCompleto = async () => {
    // Validar que existan al menos 2 ingredientes
    if (ingredientesReceta.length < 1) {
      setShowIngredientesInsuficientesDialog(true) // Mostrar AlertDialog en lugar de toast
      return // Detener el proceso de actualización
    }

    setShowConfirmationModal(true)
  }

  const confirmUpdateRecetaCompleto = async () => {
    setShowConfirmationModal(false)
    setIsUpdating(true) // Start loading animation

    try {
      // Ensure minimum 4 seconds for animation
      await Promise.all([
        updateRecetaCostoAndHistorico(recetaId),
        new Promise((resolve) => setTimeout(resolve, 4000)), // Minimum 4 seconds
      ])

      toast({
        title: "Sub-Receta Actualizada correctamente",
        description: "Se actualizó la información y costos de las recetas asociadas a esta sub-receta.",
        action: <CheckCircleIcon className="text-green-500" />,
      })
      router.push("/recetas") // Redirect to /recetas page
    } catch (e: any) {
      toast({
        title: "Error inesperado",
        description: `Ocurrió un error: ${e.message}`,
        variant: "destructive",
        action: <XCircleIcon className="text-red-500" />,
      })
    } finally {
      setIsUpdating(false) // Stop loading animation
    }
  }


  return (
  <main className="container mx-auto max-w-5xl p-8">
  <div className="rounded-xl border bg-card text-card-foreground shadow">
  <main className="flex-1 p-4 md:p-6">
    <div className="space-y-6 p-6">
      {isUpdating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl">
            <div className="relative w-24 h-24 mb-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/design-mode-images/RegistrarSubReceta%281%29-KntDX8GyLD0HZO8iJgz8fv46ADpnBu.gif"
                alt="Procesando..."
                width={400} // Ajusta el tamaño según sea necesario
                height={400} // Ajusta el tamaño según sea necesario
                unoptimized // Importante para GIFs externos
                className="absolute inset-0 animate-bounce-slow"
              />
            </div>
            <p className="text-lg font-semibold text-gray-800">Actualizando Sub-receta...</p>
            <p className="text-sm text-gray-600">Esto puede tomar unos segundos.</p>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold">Editar Sub-Receta</h1>

      {/* Step 1: Basic Recipe Information */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Información Básica de la Sub-Receta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombreReceta">Nombre de la Sub-Receta</Label>
              <Input
                id="nombreReceta"
                value={nombreReceta}
                onChange={(e) => setNombreReceta(e.target.value)}
                placeholder="Ej. Sopa de Tomate Cremosa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notasPreparacion">Notas de Preparación (Opcional)</Label>
              <Textarea
                id="notasPreparacion"
                value={notasPreparacion || ""}
                onChange={(e) => setNotasPreparacion(e.target.value)}
                placeholder="Instrucciones especiales, tips, etc."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="imgUrl">Imagen de la Sub-Receta</Label>
            <ImageUpload value={imgUrl} onChange={setImgUrl} folder="recetas" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleUpdateRecetaBasicInfo} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightIcon className="mr-2 h-4 w-4" />
              )}
              Siguiente
            </Button>
          </div>
        </div>
  
      )}

      {/* Step 2: Ingredient Management */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Gestión de Ingredientes</h2>
          <div className="space-y-2">
            <Label htmlFor="ddlHotel">Hotel</Label>
            <Select value={selectedHotelId} onValueChange={setSelectedHotelId} disabled={true}>
              <SelectTrigger id="ddlHotel">
                <SelectValue placeholder="Selecciona un hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotelesDropdown.map((hotel) => (
                  <SelectItem key={hotel.id} value={String(hotel.id)}>
                    {hotel.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="ddlIngredientes">Ingrediente</Label>
              <Select
                value={selectedIngredienteId}
                onValueChange={setSelectedIngredienteId}
                disabled={isPending || !selectedHotelId}
              >
                <SelectTrigger id="ddlIngredientes">
                  <SelectValue placeholder="Selecciona un ingrediente" />
                </SelectTrigger>
                <SelectContent>
                  {ingredientesDropdown.map((ingrediente) => (
                    <SelectItem key={ingrediente.id} value={String(ingrediente.id)}>
                      {ingrediente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="txtCantidad">Cantidad</Label>
              <Input
                id="txtCantidad"
                type="number"
                value={cantidadIngrediente}
                onChange={(e) => setCantidadIngrediente(Number(e.target.value))}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="ddlUnidadMedida">Unidad de Medida</Label>
              <Select
                value={selectedUnidadMedidaId}
                onValueChange={setSelectedUnidadMedidaId}
                disabled={isUnidadMedidaDisabled}
              >
                <SelectTrigger id="ddlUnidadMedida">
                  <SelectValue placeholder="Unidad" />
                </SelectTrigger>
                <SelectContent>
                  {unidadMedidaDropdown.map((um) => (
                    <SelectItem key={um.id} value={String(um.id)}>
                      {um.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="txtCostoIngrediente">Costo Unitario</Label>
              <Input
                id="txtCostoIngrediente"
                type="number"
                value={selectedIngredienteCosto.toFixed(3)}
                disabled={true} // This field is for display only
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleAddIngrediente}
              disabled={isPending || !selectedIngredienteId || cantidadIngrediente <= 0}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusIcon className="mr-2 h-4 w-4" />}
              Agregar Ingrediente
            </Button>
          </div>

          <h3 className="text-xl font-semibold mt-6">Ingredientes de la Sub-Receta</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Costo Parcial</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientesReceta.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay ingredientes agregados a esta sub-receta.
                  </TableCell>
                </TableRow>
              ) : (
                ingredientesReceta.map((ingrediente) => (
                  <TableRow key={ingrediente.id}>
                    <TableCell>{ingrediente.nombre}</TableCell>
                    <TableCell>{ingrediente.cantidad}</TableCell>
                    <TableCell>{ingrediente.unidadmedidadescripcion}</TableCell>
                    <TableCell>{ingrediente.ingredientecostoparcial?.toFixed(3) || "0.00"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteIngrediente(ingrediente.id)}
                        disabled={isPending}
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="text-right text-lg font-bold mt-4">
            Costo Total de Sub-Receta: ${costoTotalReceta.toFixed(2)}
          </div>

          {/* Navigation buttons for Step 2 */}
          <div className="flex justify-between mt-8">
            <Button onClick={() => setCurrentStep(1)} disabled={isPending}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button onClick={handleUpdateRecetaCompleto} disabled={isPending || isUpdating}>
              {isPending || isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="mr-2 h-4 w-4" />
              )}
              Actualizar Sub-Receta
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Actualización</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas realizar los cambios en base a la información agregada?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmationModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmUpdateRecetaCompleto}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Ingrediente Duplicado */}
      <Dialog open={showIngredienteDuplicadoDialog} onOpenChange={setShowIngredienteDuplicadoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingrediente Duplicado</DialogTitle>
            <DialogDescription>No puedes agregar este ingrediente, ya que ya está incluido.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowIngredienteDuplicadoDialog(false)}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nuevo Dialogo para Ingredientes Insuficientes */}
      <Dialog open={showIngredientesInsuficientesDialog} onOpenChange={setShowIngredientesInsuficientesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingredientes Insuficientes</DialogTitle>
            <DialogDescription>
              No puedes actualizar una sub-receta sin al menos 2 ingredientes. De lo contrario, al no contener
              ingredientes se eliminará de la base de datos automáticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowIngredientesInsuficientesDialog(false)}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      </main>
     </div>
      </main>
  )
}
