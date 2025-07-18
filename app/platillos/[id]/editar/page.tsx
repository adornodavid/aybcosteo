"use client"

import { useEffect, useState } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { actualizarPlatillo } from "@/app/actions/platillos-actions"
import { createClient } from "@/lib/supabase" // Import the correct client for server-side fetching
import { ImageUpload } from "@/components/ui/image-upload"

interface Platillo {
  id: number
  nombre: string
  descripcion: string | null
  imagen_url: string | null
  activo: boolean
}

const initialState = {
  success: false,
  message: "",
  error: "",
}

export default function EditarPlatilloPage({ params }: { params: { id: string } }) {
  const platilloId = Number(params.id)
  const [platillo, setPlatillo] = useState<Platillo | null>(null)
  const [loading, setLoading] = useState(true)
  const [state, formAction] = useFormState(actualizarPlatillo.bind(null, platilloId), initialState)
  const { toast } = useToast()
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlatilloData = async () => {
      setLoading(true)
      const supabase = createClient() // Use the correct client for server-side fetching
      const { data, error } = await supabase.from("platillos").select("*").eq("id", platilloId).single()

      if (error) {
        console.error("Error fetching platillo:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del platillo.",
          variant: "destructive",
        })
      } else {
        setPlatillo(data)
        setImageUrl(data.imagen_url)
      }
      setLoading(false)
    }

    fetchPlatilloData()
  }, [platilloId, toast])

  useEffect(() => {
    if (state.success) {
      toast({
        title: "¡Actualización exitosa!",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Cargando platillo...</span>
      </div>
    )
  }

  if (!platillo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-destructive">Platillo no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Editar Platillo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="imagen_url" value={imageUrl || ""} />
            <div>
              <Label htmlFor="nombre">Nombre del Platillo</Label>
              <Input id="nombre" name="nombre" type="text" defaultValue={platillo.nombre} required />
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" name="descripcion" defaultValue={platillo.descripcion || ""} rows={4} />
            </div>
            <div>
              <Label htmlFor="imagen">Imagen del Platillo</Label>
              <ImageUpload
                id="imagen"
                name="imagen"
                initialImageUrl={platillo.imagen_url}
                onImageChange={handleImageChange}
                bucketFolder="platillos"
                maxFileSizeMB={5} // Example: 5MB limit for platillo images
                allowedFileTypes={["image/jpeg", "image/png"]} // Example: allow JPG and PNG
              />
            </div>
            <Button type="submit" className="w-full" disabled={state.success}>
              {state.success ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Actualizar Platillo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
