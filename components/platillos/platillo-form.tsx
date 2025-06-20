"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Trash2, Info, Calculator } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { crearPlatillo, actualizarPlatillo } from "@/app/actions/platillos-actions"
import { Separator } from "@/components/ui/separator"

interface PlatilloFormProps {
  platillo?: Platillo
  onSuccess?: () => void
}

interface IngredienteConPorcion extends IngredientePlatillo {
  unidad_porcion?: string
  cantidad_porcion?: number
  precio_por_unidad_porcion?: number
}

export function PlatilloForm({ platillo, onSuccess }: PlatilloFormProps) {
  const [loading, setLoading] = useState(false)
  const [ingredientes, setIngredientes] = useState<IngredienteConPorcion[]>([])
  const [restaurantes, setRestaurantes] = useState<any[]>([])
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()

  // Estado para los campos del formulario
  const [nombre, setNombre] = useState(platillo?.nombre || "")
  const [descripcion, setDescripcion] = useState(platillo?.descripcion || "")
  const [instrucciones, setInstrucciones] = useState(platillo?.instrucciones || "")
  const [imagenUrl, setImagenUrl] = useState(platillo?.imagen_url || "")

  useEffect(() => {
    fetchRestaurantes()
    if (platillo) {
      setRestauranteSeleccionado(platillo.restaurante_id || "")
      fetchIngredientesPlatillo(platillo.id)
    }
  }, [platillo])

  const fetchRestaurantes = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurantes")
        .select("id, nombre, descripcion")
        .eq("activo", true)
        .order("nombre")

      if (error) throw error
      setRestaurantes(data || [])
    } catch (error) {
      console.error("Error fetching restaurantes:", error)
    }
  }

  const fetchIngredientesPlatillo = async (platilloId: string) => {
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

      setIngredientes(ingredientesConPorcion)
    } catch (error) {
      console.error("Error fetching ingredientes del platillo:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los ingredientes del platillo",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones
      if (!restauranteSeleccionado) {
        toast({
          title: "Error",
          description: "Debe seleccionar un restaurante",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (nombre.length < 3) {
        toast({
          title: "Error",
          description: "El nombre debe tener al menos 3 caracteres",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (ingredientes.length === 0) {
        toast({
          title: "Error",
          description: "Debe agregar al menos un ingrediente",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Calcular costo total
      const costoTotal = ingredientes.reduce((sum, item) => sum + item.costo_parcial, 0)

      // Preparar los ingredientes para enviar
      const ingredientesParaEnviar = ingredientes.map((item) => ({
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
          imagen_url: imagenUrl,
          costo_total: costoTotal,
          restaurante_id: restauranteSeleccionado,
          ingredientes: ingredientesParaEnviar,
        })
      } else {
        // Crear nuevo platillo
        result = await crearPlatillo({
          nombre,
          descripcion,
          instrucciones,
          imagen_url: imagenUrl,
          costo_total: costoTotal,
          restaurante_id: restauranteSeleccionado,
          ingredientes: ingredientesParaEnviar,
        })
      }

      if (result.success) {
        toast({
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
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el platillo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddIngrediente = (ingrediente: any, cantidad: number, unidadPorcion: string) => {
    // Verificar si el ingrediente ya existe
    const exists = ingredientes.some((item) => item.ingrediente_id === ingrediente.id)
    if (exists) {
      toast({
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

    setIngredientes((prev) => [...prev, newIngrediente])
  }

  const handleAddBulkIngredientes = (ingredientesImportados: Array<{ ingrediente: any; cantidad: number }>) => {
    const nuevosIngredientes: IngredienteConPorcion[] = []

    for (const { ingrediente, cantidad } of ingredientesImportados) {
      // Verificar si ya existe
      const exists = ingredientes.some((item) => item.ingrediente_id === ingrediente.id)
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

    setIngredientes((prev) => [...prev, ...nuevosIngredientes])
  }

  const handleRemoveIngrediente = (index: number) => {
    const newValue = [...ingredientes]
    newValue.splice(index, 1)
    setIngredientes(newValue)
  }

  const handleUpdateCantidad = (index: number, newCantidad: number) => {
    if (newCantidad <= 0) return

    const newValue = [...ingredientes]
    const item = newValue[index]
    const precioPorUnidad = item.precio_por_unidad_porcion || item.ingrediente?.precio_unitario || 0

    newValue[index] = {
      ...item,
      cantidad: newCantidad,
      cantidad_porcion: newCantidad,
      costo_parcial: newCantidad * precioPorUnidad,
    }

    setIngredientes(newValue)
  }

  const handleChangeUnidadPorcion = (index: number, nuevaUnidad: string) => {
    const newValue = [...ingredientes]
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

    setIngredientes(newValue)
  }

  // Calcular costo total
  const costoTotal = ingredientes.reduce((sum, item) => sum + item.costo_parcial, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {platillo ? "Editar Receta" : "Nueva Receta"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurante">Restaurante *</Label>
                <Select value={restauranteSeleccionado} onValueChange={setRestauranteSeleccionado} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar restaurante" />
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
                <ImageUpload value={imagenUrl} onChange={setImagenUrl} onRemove={() => setImagenUrl("")} />
              </div>

              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Análisis de Costos
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ingredientes:</span>
                    <span>{ingredientes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costo Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(costoTotal)}</span>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    <p>• Precio sugerido (50% margen): {formatCurrency(costoTotal * 2)}</p>
                    <p>• Precio sugerido (70% margen): {formatCurrency(costoTotal * 3.33)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Ingredientes de la Receta ({ingredientes.length})</h3>
              <div className="flex gap-2">
                <IngredienteSelector onAddIngrediente={handleAddIngrediente} />
                <BulkIngredientImporter
                  onAddIngredientes={handleAddBulkIngredientes}
                  restauranteId={restauranteSeleccionado}
                />
              </div>
            </div>

            {!restauranteSeleccionado && (
              <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center bg-muted/50">
                <Calculator className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Selecciona un restaurante para agregar ingredientes</p>
              </div>
            )}

            {restauranteSeleccionado && ingredientes.length === 0 && (
              <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center">
                <Calculator className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No hay ingredientes agregados</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Usa los botones de arriba para agregar ingredientes individual o masivamente
                </p>
              </div>
            )}

            {ingredientes.length > 0 && (
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
                    {ingredientes.map((item, index) => {
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
                              onChange={(e) => handleUpdateCantidad(index, Number.parseFloat(e.target.value) || 0)}
                              className="w-20 h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.unidad_porcion || item.ingrediente?.unidad}
                              onValueChange={(value) => handleChangeUnidadPorcion(index, value)}
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
                                        Precio convertido: {formatCurrency(item.ingrediente.precio_unitario_convertido)}{" "}
                                        por {item.ingrediente.conversion_unidad}
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
                              onClick={() => handleRemoveIngrediente(index)}
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
              <p className="text-lg font-bold">{formatCurrency(costoTotal)}</p>
            </div>
            <Button type="submit" disabled={loading || ingredientes.length === 0 || !restauranteSeleccionado}>
              {loading ? "Guardando..." : platillo ? "Actualizar Receta" : "Crear Receta"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
