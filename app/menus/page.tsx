"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, MenuIcon, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { eliminarMenu } from "@/app/actions/menus-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export default function MenusPage() {
  const [menus, setMenus] = useState<any[]>([])
  const [restaurantes, setRestaurantes] = useState<any[]>([])
  const [selectedRestaurante, setSelectedRestaurante] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRestaurantes()
  }, [])

  useEffect(() => {
    if (selectedRestaurante) {
      fetchMenus()
    }
  }, [selectedRestaurante])

  const fetchRestaurantes = async () => {
    try {
      const { data, error } = await supabase.from("restaurantes").select("*").order("nombre")
      if (error) throw error
      setRestaurantes(data || [])
      // Seleccionar automáticamente Montana iStay si existe
      const montana = data?.find((r) => r.id === "eb492bec-f87a-4bda-917f-4e8109ec914c")
      if (montana) {
        setSelectedRestaurante(montana.id)
      }
    } catch (error: any) {
      console.error("Error fetching restaurantes:", error)
    }
  }

  const fetchMenus = async () => {
    if (!selectedRestaurante) return

    try {
      setLoading(true)
      const { data: menus, error } = await supabase
        .from("menus")
        .select("*")
        .eq("restaurante_id", selectedRestaurante)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Obtener el conteo de platillos por menú
      const menusConPlatillos = await Promise.all(
        (menus || []).map(async (menu) => {
          const { count } = await supabase
            .from("menu_platillos")
            .select("*", { count: "exact", head: true })
            .eq("menu_id", menu.id)

          return {
            ...menu,
            platillos_count: count || 0,
          }
        }),
      )

      setMenus(menusConPlatillos)
    } catch (error: any) {
      console.error("Error fetching menus:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los menús",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Menús</h1>
        <Button asChild>
          <Link href="/menus/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Menú
          </Link>
        </Button>
      </div>

      {/* Selector de Restaurante */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRestaurante} onValueChange={setSelectedRestaurante}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un restaurante" />
            </SelectTrigger>
            <SelectContent>
              {restaurantes.map((restaurante) => (
                <SelectItem key={restaurante.id} value={restaurante.id}>
                  {restaurante.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading && (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      )}

      {!loading && menus.length === 0 && selectedRestaurante && (
        <Card>
          <CardHeader>
            <CardTitle>No hay menús</CardTitle>
            <CardDescription>Crea tu primer menú para comenzar a organizar tus platillos.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Button asChild>
              <Link href="/menus/nuevo">
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Menú
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu) => (
          <Card key={menu.id} className="overflow-hidden flex flex-col">
            {menu.imagen_url && (
              <div className="aspect-video relative">
                <Image src={menu.imagen_url || "/placeholder.svg"} alt={menu.nombre} fill className="object-cover" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MenuIcon className="h-5 w-5" />
                {menu.nombre}
              </CardTitle>
              <CardDescription>{menu.descripcion || "Sin descripción"}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Platillos:</span>
                <span className="text-sm">{menu.platillos_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Creado:</span>
                <span className="text-sm">{new Date(menu.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href={`/menus/${menu.id}`}>Ver Detalles</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente el menú "{menu.nombre}" y no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <form action={eliminarMenu.bind(null, menu.id)}>
                      <AlertDialogAction
                        type="submit"
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </form>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
