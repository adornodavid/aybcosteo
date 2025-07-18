"use client"

import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { crearHotel } from "@/app/actions/hoteles-actions-correcto"

const initialState = {
  success: false,
  message: "",
  error: "",
}

export default function NuevoHotelPage() {
  const [state, formAction] = useFormState(crearHotel, initialState)
  const { toast } = useToast()

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Nuevo Hotel</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre del Hotel</Label>
              <Input id="nombre" name="nombre" type="text" placeholder="Ej: Hotel Central" required />
            </div>
            <Button type="submit" className="w-full" disabled={state.success}>
              {state.success ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Hotel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
