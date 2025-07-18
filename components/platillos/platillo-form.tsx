"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, type Platillo } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/ui/image-upload"
import { IngredienteSelector, type IngredientePlatillo } from "@/components/platillos/ingrediente-selector"
import { BulkIngredientImporter } from "@/components/platillos/bulk-ingredient-importer"
import { formatCurrency } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Info, Calculator, ArrowLeft, Loader2, UploadCloud } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { actualizarPlatillo } from "@/app/actions/platillos-actions"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
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
import { recetas } from "@/lib/recetas" // Import or declare the variable here

interface PlatilloFormProps {
  platillo?: Platillo
  onSuccess?: () => void
  // Props para el wizard
  etapa: number
  setEtapa: React.Dispatch<React.SetStateAction<number>>
  nombre: string
  setNombre: React.Dispatch<React.SetStateAction<string>>
  descripcion: string
  setDescripcion: React.Dispatch<React.SetStateAction<string>>
  instrucciones: string
  setInstrucciones: React.Dispatch<React.SetStateAction<string>>
  tiempo: string
  setTiempo: React.Dispatch<React.SetStateAction<string>>
  imagenFile: File | null
  setImagenFile: React.Dispatch<React.SetStateAction<File | null>>
  imagenPreview: string | null
  setImagenPreview: React.Dispatch<React.SetStateAction<string | null>>
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRegistrarPlatillo: () => Promise<void>
  handleContinuar: () => void
  handleAgregarIngrediente: () => Promise<void>
  handleAgregarReceta: () => Promise<void>
  handleRegistroCompleto: () => Promise<void>
  hoteles: { id: number; nombre: string }[]
  setHotelId: React.Dispatch<React.SetStateAction<string>>
  hotelId: string
  restaurantes: { id: number; nombre: string }[]
  setRestauranteId: React.Dispatch<React.SetStateAction<string>>
  restauranteId: string
  menus: { id: number; nombre: string }[]
  setMenuId: React.Dispatch<React.SetStateAction<string>>
  menuId: string
  ingredientes: { id: number; nombre: string; costo: number | null }[]
  setSelIngredienteId: React.Dispatch<React.SetStateAction<string>>
  selIngredienteId: string
  selIngredienteCantidad: string
  setSelIngredienteCantidad: React.Dispatch<React.SetStateAction<string>>
  selIngredienteUnidad: string
  setSelIngredienteUnidad: React.Dispatch<React.SetStateAction<string>>
  selIngredienteCosto: string
  unidades: { id: number; descripcion: string; calculoconversion: number | null }[]
  ingredientesAgregados: { id: number; nombre: string; cantidad: number; ingredientecostoparcial: number }[]
  setIngredientesAgregados: React.Dispatch<
    React.SetStateAction<{ id: number; nombre: string; cantidad: number; ingredientecostoparcial: number }[]>
  >
  selRecetaId: string
  setSelRecetaId: React.Dispatch<React.SetStateAction<string>>
  selRecetaCosto: string
  recetasAgregadas: { id: number; nombre: string; recetacostoparcial: number }[]
  setRecetasAgregadas: React.Dispatch<
    React.SetStateAction<{ id: number; nombre: string; recetacostoparcial: number }[]>
  >
  isSubmitting: boolean
  menuNom: string
  showLeaveConfirm: boolean
  setShowLeaveConfirm: React.Dispatch<React.SetStateAction<boolean>>
  handleLeavePage: (confirm: boolean) => Promise<void>
  checkLeave: (path: string) => void
}

interface IngredienteConPorcion extends IngredientePlatillo {
  unidad_porcion?: string
  cantidad_porcion?: number
  precio_por_unidad_porcion?: number
}

const MAX_IMAGE_SIZE_MB = 10
const MAX_IMAGE_DIMENSION = 500

export function PlatilloForm({
  platillo,
  onSuccess,
  // Props para el wizard
  etapa,
  setEtapa,
  nombre,
  setNombre,
  descripcion,
  setDescripcion,
  instrucciones,
  setInstrucciones,
  tiempo,
  setTiempo,
  imagenFile,
  setImagenFile,
  imagenPreview,
  setImagenPreview,
  handleImageChange,
  handleRegistrarPlatillo,
  handleContinuar,
  handleAgregarIngrediente,
  handleAgregarReceta,
  handleRegistroCompleto,
  hoteles,
  setHotelId,
  hotelId,
  restaurantes,
  setRestauranteId,
  restauranteId,
  menus,
  setMenuId,
  menuId,
  ingredientes,
  setSelIngredienteId,
  selIngredienteId,
  selIngredienteCantidad,
  setSelIngredienteCantidad,
  selIngredienteUnidad,
  setSelIngredienteUnidad,
  selIngredienteCosto,
  unidades,
  ingredientesAgregados,
  setIngredientesAgregados,
  selRecetaId,
  setSelRecetaId,
  selRecetaCosto,
  recetasAgregadas,
  setRecetasAgregadas,
  isSubmitting,
  menuNom,
  showLeaveConfirm,
  setShowLeaveConfirm,
  handleLeavePage,
  checkLeave,
}: PlatilloFormProps) {
  const router = useRouter()
  const { toast: shadcnToast } = useToast() // Renombrado para evitar conflicto con sonner toast

  // Estado local para el modo de edición/creación simple (no wizard)
  const [loadingSimple, setLoadingSimple] = useState(false)
  const [ingredientesSimple, setIngredientesSimple] = useState<IngredienteConPorcion[]>([])
  const [restaurantesSimple, setRestaurantesSimple] = useState<any[]>([])
  const [restauranteSeleccionadoSimple, setRestauranteSeleccionadoSimple] = useState<string>("")

  // Si estamos en modo simple (platillo prop existe y no hay props de wizard)
  const isSimpleMode = platillo !== undefined && !setEtapa

  useEffect(() => {
    if (isSimpleMode) {
      fetchRestaurantesSimple()
      if (platillo) {
        setRestauranteSeleccionadoSimple(platillo.restaurante_id || "")
        fetchIngredientesPlatilloSimple(platillo.id)
      }
    }
  }, [platillo, isSimpleMode])

  const fetchRestaurantesSimple = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurantes")
        .select("id, nombre, descripcion")
        .eq("activo", true)
        .order("nombre")

      if (error) throw error
      setRestaurantesSimple(data || [])
    } catch (error) {
      console.error("Error fetching restaurantes:", error)
    }
  }

  const fetchIngredientesPlatilloSimple = async (platilloId: string) => {
    try {
      const { data, error } = await supabase
        .from("platillos_ingredientes")
        .select(
          `
          id,
          platillo_id,
          ingrediente_id,
          cantidad,
          unidad_porcion,
          costo_parcial,
          ingrediente:ingredientes(
            id,
            clave,
            descripcion,
            unidad,
            precio_unitario,
            conversion_unidad,
            precio_unitario_convertido,
            categoria:categorias(nombre)
          )
        `,
        )
        .eq("platillo_id", platilloId)
        .order("created_at")

      if (error) throw error

      const ingredientesConPorcion = (data || []).map((item) => ({
        ...item,
        unidad_porcion: item.unidad_porcion || item.ingrediente?.conversion_unidad || item.ingrediente?.unidad,
        cantidad_porcion: item.cantidad,
        precio_por_unidad_porcion: item.ingrediente?.precio_unitario_convertido || item.ingrediente?.precio_unitario,
      }))

      setIngredientesSimple(ingredientesConPorcion)
    } catch (error) {
      console.error("Error fetching ingredientes del platillo:", error)
      shadcnToast({
        title: "Error",
        description: "No se pudieron cargar los ingredientes del platillo",
        variant: "destructive",
      })
    }
  }

  const handleSubmitSimple = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSimple(true)

    try {
      // Validaciones
      if (!restauranteSeleccionadoSimple) {
        shadcnToast({
          title: "Error",
          description: "Debe seleccionar un restaurante",
          variant: "destructive",
        })
        setLoadingSimple(false)
        return
      }

      if (nombre.length < 3) {
        shadcnToast({
          title: "Error",
          description: "El nombre debe tener al menos 3 caracteres",
          variant: "destructive",
        })
        setLoadingSimple(false)
        return
      }

      if (ingredientesSimple.length === 0) {
        shadcnToast({
          title: "Error",
          description: "Debe agregar al menos un ingrediente",
          variant: "destructive",
        })
        setLoadingSimple(false)
        return
      }

      // Calcular costo total
      const costoTotal = ingredientesSimple.reduce((sum, item) => sum + item.costo_parcial, 0)

      // Preparar los ingredientes para enviar
      const ingredientesParaEnviar = ingredientesSimple.map((item) => ({
        ingrediente_id: item.ingrediente_id,
        cantidad: item.cantidad_porcion || item.cantidad,
        unidad_porcion: item.unidad_porcion || item.ingrediente?.conversion_unidad || item.ingrediente?.unidad,
        costo_parcial: item.costo_parcial,
      }))

      let result

      if (platillo) {
        // Actualizar platillo existente
        result = await actualizarPlatillo(platillo.id, {
          nombre,
          descripcion,
          instrucciones,
          imagen_url: platillo.imagen_url, // Usar la imagen existente en modo simple
          costo_total: costoTotal,
          restaurante_id: restauranteSeleccionadoSimple,
          ingredientes: ingredientesParaEnviar,
        })
      } else {
        // Esto no debería ocurrir en modo simple si platillo es undefined
        // Pero si se usa para crear, necesitaría imagenUrl
        shadcnToast({
          title: "Error",
          description: "Modo de creación no soportado directamente en PlatilloForm sin wizard.",
          variant: "destructive",
        })
        setLoadingSimple(false)
        return
      }

      if (result.success) {
        shadcnToast({
          title: platillo ? "Platillo actualizado" : "Platillo creado",
          description: platillo
            ? "El platillo ha sido actualizado correctamente"
            : "El platillo ha sido creado correctamente",
        })

        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/platillos")
          router.refresh()
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error saving platillo:", error)
      shadcnToast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el platillo",
        variant: "destructive",
      })
    } finally {
      setLoadingSimple(false)
    }
  }

  const handleAddIngredienteSimple = (ingrediente: any, cantidad: number, unidadPorcion: string) => {
    // Verificar si el ingrediente ya existe
    const exists = ingredientesSimple.some((item) => item.ingrediente_id === ingrediente.id)
    if (exists) {
      shadcnToast({
        title: "Ingrediente duplicado",
        description: "Este ingrediente ya ha sido agregado al platillo",
        variant: "destructive",
      })
      return
    }

    // Calcular precio por unidad de porción
    let precioPorUnidadPorcion = ingrediente.precio_unitario

    // Si la unidad de porción es diferente a la unidad base, usar precio convertido
    if (unidadPorcion !== ingrediente.unidad && ingrediente.precio_unitario_convertido) {
      precioPorUnidadPorcion = ingrediente.precio_unitario_convertido
    }

    const costoParcial = cantidad * precioPorUnidadPorcion

    // Agregar ingrediente a la lista
    const newIngrediente: IngredienteConPorcion = {
      ingrediente_id: ingrediente.id,
      cantidad,
      costo_parcial: costoParcial,
      ingrediente: {
        id: ingrediente.id,
        clave: ingrediente.clave,
        descripcion: ingrediente.descripcion,
        unidad: ingrediente.unidad,
        precio_unitario: ingrediente.precio_unitario,
        conversion_unidad: ingrediente.conversion_unidad,
        precio_unitario_convertido: ingrediente.precio_unitario_convertido,
        categoria: ingrediente.categoria,
      },
      unidad_porcion: unidadPorcion,
      cantidad_porcion: cantidad,
      precio_por_unidad_porcion: precioPorUnidadPorcion,
    }

    setIngredientesSimple((prev) => [...prev, newIngrediente])
  }

  const handleAddBulkIngredientesSimple = (ingredientesImportados: Array<{ ingrediente: any; cantidad: number }>) => {
    const nuevosIngredientes: IngredienteConPorcion[] = []

    for (const { ingrediente, cantidad } of ingredientesImportados) {
      // Verificar si ya existe
      const exists = ingredientesSimple.some((item) => item.ingrediente_id === ingrediente.id)
      if (exists) {
        console.log(`Ingrediente ${ingrediente.descripcion} ya existe, saltando...`)
        continue
      }

      const precioPorUnidad = ingrediente.precio_actual || 0
      const costoParcial = cantidad * precioPorUnidad

      nuevosIngredientes.push({
        ingrediente_id: ingrediente.id,
        cantidad,
        costo_parcial: costoParcial,
        ingrediente: {
          id: ingrediente.id,
          descripcion: ingrediente.descripcion,
          unidad: ingrediente.unidad_medida,
          precio_unitario: ingrediente.precio_actual,
          categoria: ingrediente.categoria,
          clave: ingrediente.clave_innsist,
        },
        unidad_porcion: ingrediente.unidad_medida,
        cantidad_porcion: cantidad,
        precio_por_unidad_porcion: precioPorUnidad,
      })
    }

    setIngredientesSimple((prev) => [...prev, ...nuevosIngredientes])
  }

  const handleRemoveIngredienteSimple = (index: number) => {
    const newValue = [...ingredientesSimple]
    newValue.splice(index, 1)
    setIngredientesSimple(newValue)
  }

  const handleUpdateCantidadSimple = (index: number, newCantidad: number) => {
    if (newCantidad <= 0) return

    const newValue = [...ingredientesSimple]
    const item = newValue[index]
    const precioPorUnidad = item.precio_por_unidad_porcion || item.ingrediente?.precio_unitario || 0

    newValue[index] = {
      ...item,
      cantidad: newCantidad,
      cantidad_porcion: newCantidad,
      costo_parcial: newCantidad * precioPorUnidad,
    }

    setIngredientesSimple(newValue)
  }

  const handleChangeUnidadPorcionSimple = (index: number, nuevaUnidad: string) => {
    const newValue = [...ingredientesSimple]
    const item = newValue[index]

    // Determinar el precio según la unidad seleccionada
    let nuevoPrecio = item.ingrediente?.precio_unitario || 0
    if (nuevaUnidad === item.ingrediente?.conversion_unidad && item.ingrediente?.precio_unitario_convertido) {
      nuevoPrecio = item.ingrediente.precio_unitario_convertido
    }

    newValue[index] = {
      ...item,
      unidad_porcion: nuevaUnidad,
      precio_por_unidad_porcion: nuevoPrecio,
      costo_parcial: (item.cantidad_porcion || item.cantidad) * nuevoPrecio,
    }

    setIngredientesSimple(newValue)
  }

  // Calcular costo total para modo simple
  const costoTotalSimple = ingredientesSimple.reduce((sum, item) => sum + item.costo_parcial, 0)

  // Renderizado condicional basado en si es modo simple o wizard
  if (isSimpleMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {platillo ? "Editar Receta" : "Nueva Receta"}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmitSimple}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurante">Restaurante *</Label>
                  <Select
                    value={restauranteSeleccionadoSimple}
                    onValueChange={setRestauranteSeleccionadoSimple}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar restaurante" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurantesSimple.map((restaurante) => (
                        <SelectItem key={restaurante.id} value={restaurante.id}>
                          {restaurante.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Platillo</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej. Chilaquiles Verdes"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                  {nombre.length > 0 && nombre.length < 3 && (
                    <p className="text-sm text-red-500">El nombre debe tener al menos 3 caracteres</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Descripción del platillo"
                    className="min-h-[80px]"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instrucciones">Instrucciones de Elaboración</Label>
                  <Textarea
                    id="instrucciones"
                    placeholder="Paso a paso para preparar el platillo..."
                    className="min-h-[120px]"
                    value={instrucciones}
                    onChange={(e) => setInstrucciones(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">Describe el proceso de preparación paso a paso</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imagen">Imagen del Platillo</Label>
                  <ImageUpload
                    value={platillo?.imagen_url || ""}
                    onChange={() => {}}
                    onRemove={() => {}}
                    disabled={true}
                  />
                  <p className="text-sm text-muted-foreground">
                    La imagen solo se puede cambiar al crear un nuevo platillo.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Análisis de Costos
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ingredientes:</span>
                      <span>{ingredientesSimple.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Costo Total:</span>
                      <span className="font-bold text-lg">{formatCurrency(costoTotalSimple)}</span>
                    </div>
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                      <p>• Precio sugerido (50% margen): {formatCurrency(costoTotalSimple * 2)}</p>
                      <p>• Precio sugerido (70% margen): {formatCurrency(costoTotalSimple * 3.33)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Ingredientes de la Receta ({ingredientesSimple.length})</h3>
                <div className="flex gap-2">
                  <IngredienteSelector onAddIngrediente={handleAddIngredienteSimple} />
                  <BulkIngredientImporter
                    onAddIngredientes={handleAddBulkIngredientesSimple}
                    restauranteId={restauranteSeleccionadoSimple}
                  />
                </div>
              </div>

              {!restauranteSeleccionadoSimple && (
                <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center bg-muted/50">
                  <Calculator className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Selecciona un restaurante para agregar ingredientes</p>
                </div>
              )}

              {restauranteSeleccionadoSimple && ingredientesSimple.length === 0 && (
                <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <Calculator className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No hay ingredientes agregados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usa los botones de arriba para agregar ingredientes individual o masivamente
                  </p>
                </div>
              )}

              {ingredientesSimple.length > 0 && (
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingrediente</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Unidad Porción</TableHead>
                        <TableHead>Precio/Unidad</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredientesSimple.map((item, index) => {
                        const unidadesDisponibles = [
                          item.ingrediente?.unidad,
                          item.ingrediente?.conversion_unidad,
                        ].filter(Boolean)

                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.ingrediente?.descripcion}</p>
                                <p className="text-xs text-muted-foreground">{item.ingrediente?.categoria?.nombre}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                {item.ingrediente?.clave || "N/A"}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={item.cantidad_porcion || item.cantidad}
                                onChange={(e) =>
                                  handleUpdateCantidadSimple(index, Number.parseFloat(e.target.value) || 0)
                                }
                                className="w-20 h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.unidad_porcion || item.ingrediente?.unidad}
                                onValueChange={(value) => handleChangeUnidadPorcionSimple(index, value)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {unidadesDisponibles.map((unidad) => (
                                    <SelectItem key={unidad} value={unidad!}>
                                      {unidad}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      <span>{formatCurrency(item.precio_por_unidad_porcion || 0)}</span>
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">
                                      <p>
                                        Precio base: {formatCurrency(item.ingrediente?.precio_unitario || 0)} por{" "}
                                        {item.ingrediente?.unidad}
                                      </p>
                                      {item.ingrediente?.precio_unitario_convertido && (
                                        <p>
                                          Precio convertido:{" "}
                                          {formatCurrency(item.ingrediente.precio_unitario_convertido)} por{" "}
                                          {item.ingrediente.conversion_unidad}
                                        </p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(item.costo_parcial)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveIngredienteSimple(index)}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Costo Total</p>
                <p className="text-lg font-bold">{formatCurrency(costoTotalSimple)}</p>
              </div>
              <Button
                type="submit"
                disabled={loadingSimple || ingredientesSimple.length === 0 || !restauranteSeleccionadoSimple}
              >
                {loadingSimple ? "Guardando..." : platillo ? "Actualizar Receta" : "Crear Receta"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    )
  }

  // Renderizado para el modo wizard (cuando se pasan las props de wizard)
  const progressValue = (etapa / 4) * 100

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro que deseas abandonar el registro de receta?</AlertDialogTitle>
            <AlertDialogDescription>Se perderá la información cargada previamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleLeavePage(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleLeavePage(true)}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Registro de nuevo platillo</h1>
        <Button id="btnRegresar" name="btnRegresar" variant="outline" onClick={() => checkLeave("/platillos")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Regresar
        </Button>
      </div>

      <div className="mb-8">
        <Progress value={progressValue} className="h-2 [&>*]:bg-[#58e0be]" />
        <div className="mt-2 grid grid-cols-4 text-center text-sm">
          <div className={etapa >= 1 ? "font-bold text-[#58e0be]" : "text-muted-foreground"}>Info. Básica</div>
          <div className={etapa >= 2 ? "font-bold text-[#58e0be]" : "text-muted-foreground"}>Asignar Menú</div>
          <div className={etapa >= 3 ? "font-bold text-[#58e0be]" : "text-muted-foreground"}>Contenido</div>
          <div className={etapa >= 4 ? "font-bold text-[#58e0be]" : "text-muted-foreground"}>Resumen</div>
        </div>
      </div>

      {/* --- ETAPA 1: INFORMACIÓN BÁSICA --- */}
      {etapa === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 1: Información Básica del Platillo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="txtNombrePlatilloNuevo">Nombre Platillo</Label>
                  <Input
                    id="txtNombrePlatilloNuevo"
                    name="txtNombrePlatilloNuevo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    maxLength={150}
                    disabled={platillo !== undefined} // Deshabilitar si estamos editando un platillo existente
                  />
                </div>
                <div>
                  <Label htmlFor="txtPlatilloTiempo">Tiempo Preparación (minutos)</Label>
                  <Input
                    id="txtPlatilloTiempo"
                    name="txtPlatilloTiempo"
                    type="number"
                    value={tiempo}
                    onChange={(e) => setTiempo(e.target.value)}
                    maxLength={150}
                    disabled={platillo !== undefined}
                  />
                </div>
                <div>
                  <Label htmlFor="txtDescripcionPlatillo">Descripción</Label>
                  <Textarea
                    id="txtDescripcionPlatillo"
                    name="txtDescripcionPlatillo"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    maxLength={150}
                    rows={4}
                    disabled={platillo !== undefined}
                  />
                </div>
                <div>
                  <Label htmlFor="txtPlatilloInstrucciones">Instrucciones de Elaboración</Label>
                  <Textarea
                    id="txtPlatilloInstrucciones"
                    name="txtPlatilloInstrucciones"
                    value={instrucciones}
                    onChange={(e) => setInstrucciones(e.target.value)}
                    maxLength={150}
                    rows={4}
                    disabled={platillo !== undefined}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ImagenFile">Cargar Imagen (.jpg, &lt;10MB, 500x500px)</Label>
                <div className="flex h-64 w-full items-center justify-center rounded-md border-2 border-dashed">
                  {imagenPreview ? (
                    <img
                      src={imagenPreview || "/placeholder.svg"}
                      alt="Vista previa"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                      <p>Arrastra o selecciona una imagen</p>
                    </div>
                  )}
                </div>
                <Input
                  id="ImagenFile"
                  name="ImagenFile"
                  type="file"
                  accept="image/jpeg"
                  onChange={handleImageChange}
                  className="mt-2"
                  disabled={platillo !== undefined}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              id="btnRegistrarPlatillo"
              name="btnRegistrarPlatillo"
              onClick={handleRegistrarPlatillo}
              disabled={isSubmitting || platillo !== undefined}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar y Continuar
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* --- ETAPA 2: ASIGNAR A MENÚ --- */}
      {etapa === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 2: Asignar a un Menú</CardTitle>
            <CardDescription>Es requerido asignar el platillo a un Menú para su completo registro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="ddlHotel">Hotel</Label>
                <Select value={hotelId} onValueChange={setHotelId}>
                  <SelectTrigger id="ddlHotel" name="ddlHotel">
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
                <Label htmlFor="ddlRestaurante">Restaurante</Label>
                <Select value={restauranteId} onValueChange={setRestauranteId} disabled={!hotelId}>
                  <SelectTrigger id="ddlRestaurante" name="ddlRestaurante">
                    <SelectValue placeholder="Seleccione..." />
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
                <Label htmlFor="ddlMenu">Menú</Label>
                <Select value={menuId} onValueChange={setMenuId} disabled={!restauranteId}>
                  <SelectTrigger id="ddlMenu" name="ddlMenu">
                    <SelectValue placeholder="Seleccione..." />
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setEtapa(1)}>
              Anterior
            </Button>
            <Button id="btnContinuar" name="btnContinuar" onClick={handleContinuar} disabled={!menuId}>
              Continuar
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* --- ETAPA 3: CONTENIDO --- */}
      {etapa === 3 && (
        <div className="space-y-6">
          {/* Sección Ingredientes */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Ingredientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Label>Ingrediente</Label>
                  <Select value={selIngredienteId} onValueChange={setSelIngredienteId}>
                    <SelectTrigger id="ddlIngredientes" name="ddlIngredientes">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredientes.map((i) => (
                        <SelectItem key={i.id} value={i.id.toString()}>
                          {i.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    id="txtCantidadIngrediente"
                    name="txtCantidadIngrediente"
                    type="number"
                    value={selIngredienteCantidad}
                    onChange={(e) => setSelIngredienteCantidad(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Unidad</Label>
                  <Select value={selIngredienteUnidad} onValueChange={setSelIngredienteUnidad}>
                    <SelectTrigger id="ddlUnidadMedida" name="ddlUnidadMedida">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Costo Ingrediente</Label>
                <Input id="txtCostoIngrediente" name="txtCostoIngrediente" value={selIngredienteCosto} disabled />
              </div>
              <div className="flex justify-end">
                <Button
                  id="btnAgregarIngrediente"
                  name="btnAgregarIngrediente"
                  onClick={handleAgregarIngrediente}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Agregar Ingrediente
                </Button>
              </div>
              {ingredientesAgregados.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead className="text-right">Costo Parcial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientesAgregados.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.nombre}</TableCell>
                        <TableCell>{i.cantidad}</TableCell>
                        <TableCell className="text-right">${i.ingredientecostoparcial.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Sección Recetas */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Recetas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Receta</Label>
                  <Select value={selRecetaId} onValueChange={setSelRecetaId}>
                    <SelectTrigger id="ddlReceta" name="ddlReceta">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recetas.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Costo Receta</Label>
                  <Input id="txtCostoReceta" name="txtCostoReceta" value={selRecetaCosto} disabled />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  id="btnAgregarReceta"
                  name="btnAgregarReceta"
                  onClick={handleAgregarReceta}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Agregar Receta
                </Button>
              </div>
              {recetasAgregadas.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Costo Parcial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recetasAgregadas.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.nombre}</TableCell>
                        <TableCell className="text-right">${r.recetacostoparcial.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setEtapa(2)}>
              Anterior
            </Button>
            <Button
              id="btnContinuarIngrediente"
              name="btnContinuarIngrediente"
              onClick={() => setEtapa(4)}
              disabled={ingredientesAgregados.length === 0}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* --- ETAPA 4: RESUMEN --- */}
      {etapa === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 4: Resumen y Confirmación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">Información del Platillo</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Nombre:</strong> {nombre}
                  </p>
                  <p>
                    <strong>Descripción:</strong> {descripcion}
                  </p>
                  <p>
                    <strong>Instrucciones:</strong> {instrucciones}
                  </p>
                  <p>
                    <strong>Tiempo:</strong> {tiempo} minutos
                  </p>
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Asignación</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Hotel:</strong> {hoteles.find((h) => h.id.toString() === hotelId)?.nombre}
                  </p>
                  <p>
                    <strong>Restaurante:</strong> {restaurantes.find((r) => r.id.toString() === restauranteId)?.nombre}
                  </p>
                  <p>
                    <strong>Menú:</strong> {menuNom}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Contenido del Platillo</h3>
              {ingredientesAgregados.length > 0 && (
                <>
                  <h4 className="text-md mb-1 font-medium">Ingredientes</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead className="text-right">Costo Parcial</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredientesAgregados.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell>{i.nombre}</TableCell>
                          <TableCell>{i.cantidad}</TableCell>
                          <TableCell className="text-right">${i.ingredientecostoparcial.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

              {recetasAgregadas.length > 0 && (
                <>
                  <h4 className="text-md mb-1 mt-4 font-medium">Recetas</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right">Costo Parcial</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recetasAgregadas.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.nombre}</TableCell>
                          <TableCell className="text-right">${r.recetacostoparcial.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setEtapa(3)}>
              Anterior
            </Button>
            <Button
              id="btnRegistroCompleto"
              name="btnRegistroCompleto"
              onClick={handleRegistroCompleto}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registro Completo de Platillo
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
