"use client"

import { useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"
import { createClient } from "@/lib/supabase" // Import the correct client for client-side fetching

interface PrecioFormProps {
  ingredienteId: number
  onSuccess: () => void
  onClose: () => void
}

const initialState = {
  success: false,
  message: "",
  error: "",
}

// Server Action for creating a new price
async function crearPrecioUnitario(formData: FormData) {
  const supabase = createClient() // Use the correct client for server-side operations
  const ingrediente_id = Number(formData.get("ingrediente_id"))
  const precio = Number(formData.get("precio"))
  const fecha_inicio = formData.get("fecha_inicio") as string

  if (isNaN(ingrediente_id) || !precio || isNaN(precio) || !fecha_inicio) {
    return { success: false, error: "Favor de llenar la información faltante (Ingrediente, Precio, Fecha Inicio)." }
  }

  // First, set fecha_fin for any existing active price for this ingredient
  const { error: updateError } = await supabase
    .from("precios_unitarios")
    .update({ fecha_fin: new Date().toISOString(), activo: false })
    .eq("ingrediente_id", ingrediente_id)
    .is("fecha_fin", null) // Only update prices that don't have an end date

  if (updateError) {
    console.error("Error updating previous prices:", updateError)
    // Continue even if there's an error updating previous prices, as the new price is more important
  }

  // Then, insert the new price
  const { data, error } = await supabase
    .from("precios_unitarios")
    .insert({
      ingrediente_id,
      precio,
      fecha_inicio,
      fecha_fin: null, // New price is active indefinitely until a new one is added
      activo: true,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating precio unitario:", error)
    return { success: false, error: `Error de base de datos: ${error.message}` }
  }

  return { success: true, message: `Precio de $${precio.toFixed(2)} registrado exitosamente.`, data }
}

export function PrecioForm({ ingredienteId, onSuccess, onClose }: PrecioFormProps) {
  const { toast } = useToast()
  const [state, formAction] = useFormState(crearPrecioUnitario, initialState)
  const { pending } = useFormStatus()

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "¡Registro exitoso!",
        description: state.message,
      })
      onSuccess()
      onClose()
    } else if (state?.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state, onSuccess, onClose, toast])

  return (
    <form action={formAction} className="grid gap-4 py-4">
      <input type="hidden" name="ingrediente_id" value={ingredienteId} />
      <div>
        <Label htmlFor="precio">Precio</Label>
        <Input
          id="precio"
          name="precio"
          type="number"
          step="0.01"
          placeholder="Ej: 15.75"
          required
          disabled={pending}
        />
      </div>
      <div>
        <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
        <Input
          id="fecha_inicio"
          name="fecha_inicio"
          type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
          required
          disabled={pending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Guardar Precio
      </Button>
    </form>
  )
}
