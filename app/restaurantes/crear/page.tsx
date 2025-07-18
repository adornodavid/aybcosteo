"use client"

import { useState, useEffect } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { crearRestaurante } from "@/app/actions/restaurantes-actions"
import { createClient } from "@/lib/supabase" // Import the correct client for server-side fetching

interface HotelOption {
  id: number
  nombre: string
}

const initialState = {
  success: false,
  message: "",
  error: "",
}

export default function CrearRestaurantePage() {
  const [state, formAction] = useFormState(crearRestaurante, initialState)
  const { toast } = useToast()
  const [hotels, setHotels] = useState<HotelOption[]>([])
  const [loadingHotels, setLoadingHotels] = useState(true)

  useEffect(() => {
    const fetchHotels = async () => {
      setLoadingHotels(true)
      const supabase = createClient() // Use the correct client for server-side fetching
      const { data, error } = await supabase.from("hoteles").select("id, nombre").eq("activo", true).order("nombre")

      if (error) {
        console.error("Error fetching hotels:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los hoteles.",
          variant: "destructive",
        })
      } else {
        setHotels(data || [])
      }
      setLoadingHotels(false)
    }
    fetchHotels()
  }, [toast])

  useEffect(() => {
    if (state.success) {
      toast({
        title: "¡Registro exitoso!",
        description: state.message,
      })
    } else if (state.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state, toast])

  if (loadingHotels) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Cargando hoteles...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Crear Nuevo Restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre del Restaurante</Label>
              <Input id="nombre" name="nombre" type="text" placeholder="Ej: El Fogón" required />
            </div>
            <div>
              <Label htmlFor="hotel_id">Hotel Asociado</Label>
              <select
                id="hotel_id"
                name="hotel_id"
                className="block w-full p-2 border border-gray-300 rounded-md"
                defaultValue=""
              >
                <option value="">Selecciona un hotel</option>
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.nombre}
                  </option>
                ))}
                <option value="N/A">N/A (Sin hotel asignado)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" type="text" placeholder="Ej: Calle Falsa 123" />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" type="text" placeholder="Ej: 5512345678" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="Ej: info@elfogon.com" />
            </div>
            <Button type="submit" className="w-full" disabled={state.success}>
              {state.success ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Restaurante"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
