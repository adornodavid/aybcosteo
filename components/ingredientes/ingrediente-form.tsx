"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { supabase, type Categoria, type Ingrediente } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

// Actualizar el esquema de validación para incluir los nuevos campos
const ingredienteSchema = z.object({
  clave: z.string().min(1, "La clave es requerida"),
  clave_rapsodia: z.string().optional(),
  descripcion: z.string().min(3, "La descripción debe tener al menos 3 caracteres"),
  status: z.enum(["activo", "inactivo"]),
  categoria_id: z.string().optional(),
  tipo: z.string().optional(),
  tipo_ingrediente: z.string().optional(),
  unidad_medida: z.string().min(1, "La unidad de medida es requerida"),
  unidad_base: z.string().optional(),
  cantidad_presentacion: z.coerce.number().optional(),
  cantidad_secundaria: z.coerce.number().optional(),
  conversion: z.coerce.number().optional(),
  proveedor: z.string().optional(),
  marca: z.string().optional(),
  presentacion: z.string().optional(),
  rendimiento: z.coerce.number().optional(),
  merma: z.coerce.number().optional(),
  codigo_barras: z.string().optional(),
  stock_minimo: z.coerce.number().optional(),
  stock_maximo: z.coerce.number().optional(),
  ubicacion: z.string().optional(),
  tiempo_vida: z.coerce.number().optional(),
  unidad_tiempo_vida: z.string().optional(),
  observaciones: z.string().optional(),
  datos_2024: z.string().optional(),
  datos_2025_ytd: z.string().optional(),
  compras_2024: z.string().optional(),
  compras_2025: z.string().optional(),
})

type IngredienteFormValues = z.infer<typeof ingredienteSchema>

interface IngredienteFormProps {
  ingrediente?: Ingrediente
  onSuccess?: () => void
}

export function IngredienteForm({ ingrediente, onSuccess }: IngredienteFormProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Actualizar los valores por defecto del formulario
  const form = useForm<IngredienteFormValues>({
    resolver: zodResolver(ingredienteSchema),
    defaultValues: {
      clave: ingrediente?.clave || "",
      clave_rapsodia: ingrediente?.clave_rapsodia || "",
      descripcion: ingrediente?.descripcion || "",
      status: ingrediente?.status || "activo",
      categoria_id: ingrediente?.categoria_id || undefined,
      tipo: ingrediente?.tipo || "",
      tipo_ingrediente: ingrediente?.tipo_ingrediente || "",
      unidad_medida: ingrediente?.unidad_medida || "",
      unidad_base: ingrediente?.unidad_base || "",
      cantidad_presentacion: ingrediente?.cantidad_presentacion || undefined,
      cantidad_secundaria: ingrediente?.cantidad_secundaria || undefined,
      conversion: ingrediente?.conversion || undefined,
      proveedor: ingrediente?.proveedor || "",
      marca: ingrediente?.marca || "",
      presentacion: ingrediente?.presentacion || "",
      rendimiento: ingrediente?.rendimiento || undefined,
      merma: ingrediente?.merma || undefined,
      codigo_barras: ingrediente?.codigo_barras || "",
      stock_minimo: ingrediente?.stock_minimo || undefined,
      stock_maximo: ingrediente?.stock_maximo || undefined,
      ubicacion: ingrediente?.ubicacion || "",
      tiempo_vida: ingrediente?.tiempo_vida || undefined,
      unidad_tiempo_vida: ingrediente?.unidad_tiempo_vida || "",
      observaciones: ingrediente?.observaciones || "",
      datos_2024: ingrediente?.datos_2024 || "",
      datos_2025_ytd: ingrediente?.datos_2025_ytd || "",
      compras_2024: ingrediente?.compras_2024 || "",
      compras_2025: ingrediente?.compras_2025 || "",
    },
  })

  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase.from("categorias").select("*").order("nombre")
      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error("Error fetching categorias:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (values: IngredienteFormValues) => {
    setLoading(true)
    try {
      if (ingrediente) {
        // Actualizar ingrediente existente
        const { error } = await supabase
          .from("ingredientes")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ingrediente.id)

        if (error) throw error

        toast({
          title: "Ingrediente actualizado",
          description: "El ingrediente ha sido actualizado correctamente",
        })
      } else {
        // Crear nuevo ingrediente
        const { error } = await supabase.from("ingredientes").insert([values])

        if (error) throw error

        toast({
          title: "Ingrediente creado",
          description: "El ingrediente ha sido creado correctamente",
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/ingredientes")
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error saving ingrediente:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el ingrediente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ingrediente ? "Editar Ingrediente" : "Nuevo Ingrediente"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clave"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clave</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. ING-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clave_rapsodia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clave Rapsodia</FormLabel>
                    <FormControl>
                      <Input placeholder="Clave Rapsodia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descripción del ingrediente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Fresco, Congelado, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_ingrediente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingrediente</FormLabel>
                      <FormControl>
                        <Input placeholder="Tipo de ingrediente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unidad_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad Base (GR/ML/PZA)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. GR, ML, PZA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="unidad_medida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Medida</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. kg, lt, pza" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cantidad_presentacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad por Presentación</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
                    </FormControl>
                    <FormDescription>Cantidad en la presentación comercial</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conversion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factor de Conversión</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.000001" {...field} />
                    </FormControl>
                    <FormDescription>Factor para convertir unidades</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección "Información del Proveedor" */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="proveedor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Proveedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Marca" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo_barras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Barras</FormLabel>
                    <FormControl>
                      <Input placeholder="Código de Barras" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección "Presentación y Medidas" */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="presentacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presentación</FormLabel>
                    <FormControl>
                      <Input placeholder="Presentación" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rendimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rendimiento</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="%" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="merma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merma</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="%" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección "Control de Inventario" */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="stock_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_maximo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Máximo</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ubicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ubicación" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección "Vida Útil" */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tiempo_vida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo de Vida</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unidad_tiempo_vida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Tiempo de Vida</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="días">Días</SelectItem>
                        <SelectItem value="semanas">Semanas</SelectItem>
                        <SelectItem value="meses">Meses</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Añadir campos para datos históricos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="datos_2024"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datos 2024</FormLabel>
                    <FormControl>
                      <Input placeholder="Datos 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="datos_2025_ytd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datos 2025 YTD</FormLabel>
                    <FormControl>
                      <Input placeholder="Datos 2025 YTD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="compras_2024"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compras 2024</FormLabel>
                    <FormControl>
                      <Input placeholder="Compras 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="compras_2025"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compras 2025</FormLabel>
                    <FormControl>
                      <Input placeholder="Compras 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección "Observaciones" */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observaciones" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : ingrediente ? "Actualizar" : "Crear"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
