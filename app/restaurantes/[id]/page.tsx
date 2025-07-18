"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { createClient } from "@/lib/supabase" // Import the correct client for server-side fetching
import Image from "next/image"
import { ImageIcon } from "@/components/ui/image-icon"

interface Restaurante {
  id: number
  nombre: string
  direccion: string | null
  telefono: string | null
  email: string | null
  imagen_url: string | null
  activo: boolean
  hoteles: { nombre: string } | null
}

export default function RestauranteDetallePage({ params }: { params: { id: string } }) {
  const restauranteId = Number(params.id)
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRestaurante = async () => {
      setLoading(true)
      const supabase = createClient() // Use the correct client for server-side fetching
      const { data, error } = await supabase
        .from("restaurantes")
        .select(`*, hoteles(nombre)`)
        .eq("id", restauranteId)
        .single()

      if (error) {
        console.error("Error fetching restaurante:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del restaurante.",
          variant: "destructive",
        })
      } else {
        setRestaurante(data)
      }
      setLoading(false)
    }

    fetchRestaurante()
  }, [restauranteId, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Cargando restaurante...</span>
      </div>
    )
  }

  if (!restaurante) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-destructive">Restaurante no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Detalle del Restaurante: {restaurante.nombre}</h1>
          <p className="text-lg text-muted-foreground">Hotel: {restaurante.hoteles?.nombre || "N/A"}</p>
        </div>
        {/* Assuming there's an edit page for restaurants, similar to platillos */}
        <Link href={`/restaurantes/${restaurante.id}/editar`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Editar Restaurante
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Dirección</p>
            <p className="text-lg">{restaurante.direccion || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
            <p className="text-lg">{restaurante.telefono || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-lg">{restaurante.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estado</p>
            <p className="text-lg">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  restaurante.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {restaurante.activo ? "Activo" : "Inactivo"}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imagen del Restaurante</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          {restaurante.imagen_url ? (
            <Image
              src={restaurante.imagen_url || "/placeholder.svg"}
              alt={restaurante.nombre}
              width={200}
              height={200}
              className="rounded-md object-cover"
            />
          ) : (
            <ImageIcon className="h-32 w-32 text-muted-foreground" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
