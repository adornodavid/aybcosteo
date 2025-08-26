"use client"

/* ==================================================
  Imports
================================================== */
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { createClient } from "@/lib/supabase" // Import the correct client for server-side fetching

interface MenuRestaurante {
  id: number
  nombre: string
  restaurante_id: number
  platillo_id: number
  restaurantes: { nombre: string } | null
  platillos: { nombre: string; descripcion: string; imagen_url: string | null } | null
}

export default function MenuRestauranteDetallePage({ params }: { params: { id: string } }) {
  const menuId = Number(params.id)
  const [menu, setMenu] = useState<MenuRestaurante | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true)
      const supabase = createClient() // Use the correct client for server-side fetching
      const { data, error } = await supabase
        .from("menus_restaurantes")
        .select(
          `
          id,
          nombre,
          restaurante_id,
          platillo_id,
          restaurantes ( nombre ),
          platillos ( nombre, descripcion, imagen_url )
        `,
        )
        .eq("id", menuId)
        .single()

      if (error) {
        console.error("Error fetching menu:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del menú.",
          variant: "destructive",
        })
      } else {
        setMenu(data)
      }
      setLoading(false)
    }

    fetchMenu()
  }, [menuId, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Cargando menú...</span>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-destructive">Menú no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Detalle del Menú: {menu.nombre}</h1>
          <p className="text-lg text-muted-foreground">Restaurante: {menu.restaurantes?.nombre || "N/A"}</p>
        </div>
        <Link href={`/menus/${menu.id}/editar`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Editar Menú
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platillo Asociado</CardTitle>
        </CardHeader>
        <CardContent>
          {menu.platillos ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xl font-semibold">{menu.platillos.nombre}</h3>
                <p className="text-muted-foreground">{menu.platillos.descripcion}</p>
              </div>
              {menu.platillos.imagen_url && (
                <div className="flex justify-center md:justify-end">
                  <img
                    src={menu.platillos.imagen_url || "/placeholder.svg"}
                    alt={menu.platillos.nombre}
                    className="w-48 h-48 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay platillo asociado a este menú.</p>
          )}
        </CardContent>
      </Card>

      {/* Puedes añadir más secciones si el menú tuviera más detalles o platillos */}
    </div>
  )
}
