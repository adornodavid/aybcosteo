"use client"

import { useState, useEffect } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { crearPlatillo } from "@/app/actions/platillos-actions"
import { ImageUpload } from "@/components/ui/image-upload"

const initialState = {
  success: false,
  message: "",
  error: "",
}

export default function CrearPlatilloPage() {
  const [state, formAction] = useFormState(crearPlatillo, initialState)
  const { toast } = useToast()
  const [imageUrl, setImageUrl] = useState<string | null>(null)

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

  const handleImageChange = (url: string | null) => {
    setImageUrl(url)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Crear Nuevo Platillo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="imagen_url" value={imageUrl || ""} />
            <div>
              <Label htmlFor="nombre">Nombre del Platillo</Label>
              <Input id="nombre" name="nombre" type="text" placeholder="Ej: Ensalada César" required />
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" name="descripcion" placeholder="Breve descripción del platillo" rows={4} />
            </div>
            <div>
              <Label htmlFor="imagen">Imagen del Platillo</Label>
              <ImageUpload
                id="imagen"
                name="imagen"
                onImageChange={handleImageChange}
                bucketFolder="platillos"
                maxFileSizeMB={5} // Example: 5MB limit for platillo images
                allowedFileTypes={["image/jpeg", "image/png"]} // Example: allow JPG and PNG
              />
            </div>
            <Button type="submit" className="w-full" disabled={state.success}>
              {state.success ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Platillo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
