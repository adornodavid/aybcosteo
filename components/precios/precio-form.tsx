"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { supabase, type Ingrediente } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const precioSchema = z.object({
  precio: z.coerce.number().positive("El precio debe ser mayor a 0"),
  fecha_inicio: z.date({
    required_error: "La fecha de inicio es requerida",
  }),
})

type PrecioFormValues = z.infer<typeof precioSchema>

interface PrecioFormProps {
  ingrediente: Ingrediente
  onSuccess?: () => void
}

export function PrecioForm({ ingrediente, onSuccess }: PrecioFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<PrecioFormValues>({
    resolver: zodResolver(precioSchema),
    defaultValues: {
      precio: 0,
      fecha_inicio: new Date(),
    },
  })

  const onSubmit = async (values: PrecioFormValues) => {
    setLoading(true)
    try {
      // Primero, cerrar el precio actual (si existe)
      const { data: precioActual, error: errorBusqueda } = await supabase
        .from("precios_unitarios")
        .select("*")
        .eq("ingrediente_id", ingrediente.id)
        .is("fecha_fin", null)
        .order("fecha_inicio", { ascending: false })
        .limit(1)
        .single()

      if (errorBusqueda && errorBusqueda.code !== "PGRST116") {
        // PGRST116 es el código cuando no se encuentra ningún registro
        throw errorBusqueda
      }

      if (precioActual) {
        // Cerrar el precio actual
        const { error: errorCierre } = await supabase
          .from("precios_unitarios")
          .update({
            fecha_fin: new Date(values.fecha_inicio).toISOString().split("T")[0],
          })
          .eq("id", precioActual.id)

        if (errorCierre) throw errorCierre
      }

      // Insertar el nuevo precio
      const { error: errorInsercion } = await supabase.from("precios_unitarios").insert([
        {
          ingrediente_id: ingrediente.id,
          precio: values.precio,
          fecha_inicio: new Date(values.fecha_inicio).toISOString().split("T")[0],
          fecha_fin: null,
        },
      ])

      if (errorInsercion) throw errorInsercion

      toast({
        title: "Precio actualizado",
        description: "El precio del ingrediente ha sido actualizado correctamente",
      })

      form.reset({
        precio: 0,
        fecha_inicio: new Date(),
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error saving precio:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el precio",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo Precio</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="precio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Unitario</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>Precio por unidad de medida ({ingrediente.unidad_medida})</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Inicio</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Fecha desde la que aplica este precio</FormDescription>
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
              {loading ? "Guardando..." : "Guardar Precio"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
