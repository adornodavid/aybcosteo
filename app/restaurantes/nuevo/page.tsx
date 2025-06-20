"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, Store, CheckCircle } from "lucide-react"
import Link from "next/link"
import { crearRestaurante } from "@/app/actions/restaurantes-actions" // ✅ CORREGIDO
import { useFormState } from "react-dom"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Hotel {
  id: string
  nombre: string
}

export default function NuevoRestaurantePage() {
  const [state, formAction] = useFormState(crearRestaurante, { success: false, error: null }) // ✅ Solo 2 parámetros
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [hotelSeleccionado, setHotelSeleccionado] = useState<string>("")
  const [loadingHoteles, setLoadingHoteles] = useState(true)
  const router = useRouter()

  // Cargar hoteles disponibles desde Supabase
  useEffect(() => {
    async function cargarHoteles() {
      try {
        setLoadingHoteles(true)
        const { data, error } = await supabase.from("hoteles").select("id, nombre").eq("activo", true).order("nombre")

        if (error) {
          console.error("Error cargando hoteles:", error)
          setHoteles([])
        } else {
          setHoteles(data || [])
        }
      } catch (error) {
        console.error("Error:", error)
        setHoteles([])
      } finally {
        setLoadingHoteles(false)
      }
    }

    cargarHoteles()
  }, [])

  // Manejar redirección cuando sea exitoso
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/restaurantes")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state?.success, router])

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/restaurantes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Crear Nuevo Restaurante</h1>
          <p className="text-muted-foreground">Agrega un restaurante a tu hotel o como independiente</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Información del Restaurante
          </CardTitle>
          <CardDescription>
            Los restaurantes pueden estar asignados a un hotel específico o ser independientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {state.message || "Restaurante creado exitosamente"}. Redirigiendo...
              </AlertDescription>
            </Alert>
          )}

          <form action={formAction} className="space-y-6">
            {/* Campo oculto para hotel_id */}
            <input type="hidden" name="hotel_id" value={hotelSeleccionado} />

            <div className="space-y-2">
              <Label htmlFor="hotel">Hotel *</Label>
              <Select
                value={hotelSeleccionado}
                onValueChange={setHotelSeleccionado}
                disabled={state?.success || loadingHoteles}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingHoteles ? "Cargando hoteles..." : "Selecciona un hotel o N/A para independiente"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N/A">N/A - Restaurante Independiente</SelectItem>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Restaurante *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej: Restaurante La Terraza, Café Central, etc."
                required
                minLength={2}
                maxLength={100}
                disabled={state?.success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                placeholder="Ej: Restaurante de cocina internacional con vista panorámica..."
                rows={3}
                maxLength={500}
                disabled={state?.success}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={state?.success || !hotelSeleccionado}>
                {state?.success ? "Restaurante Creado ✓" : "Crear Restaurante"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/restaurantes">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
