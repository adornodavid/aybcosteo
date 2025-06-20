"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Menu, Platillo } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Edit, Trash2, AlertTriangle, Check, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
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
import {
  agregarPlatilloAMenu,
  eliminarPlatilloDeMenu,
  actualizarDisponibilidadPlatillo,
  actualizarPrecioVenta,
} from "@/app/actions/menu-platillos-actions"
import { useToast } from "@/components/ui/use-toast"
import { PlatilloSelector } from "@/components/menus/platillo-selector"

interface MenuPlatillo {
  id: string
  menu_id: string
  platillo_id: string
  precio_venta: number
  disponible: boolean
  created_at: string
  platillo: Platillo
}

export default function MenuDetalle() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [menu, setMenu] = useState<Menu | null>(null)
  const [platillos, setPlatillos] = useState<MenuPlatillo[]>([])
  const [loading, setLoading] = useState(true)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingPrecio, setEditingPrecio] = useState<string | null>(null)
  const [tempPrecio, setTempPrecio] = useState<number>(0)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!params.id) {
          setError("ID de menú no encontrado")
          setLoading(false)
          return
        }

        // Obtener datos del menú
        const { data: menuData, error: menuError } = await supabase
          .from("menus")
          .select("*")
          .eq("id", params.id)
          .single()

        if (menuError) {
          throw menuError
        }

        if (!menuData) {
          setError("Menú no encontrado")
          setLoading(false)
          return
        }

        setMenu(menuData)

        // Obtener platillos del menú con sus detalles
        const { data: platillosData, error: platillosError } = await supabase
          .from("menus_platillos") // Actualizado nombre de la tabla
          .select(`
            id,
            menu_id,
            platillo_id,
            precio_venta,
            disponible,
            created_at,
            platillo:platillos(
              id, 
              nombre, 
              descripcion, 
              imagen_url,
              costo_total
            )
          `)
          .eq("menu_id", params.id)
          .order("id")

        if (platillosError) {
          throw platillosError
        }

        console.log("Platillos cargados:", platillosData)
        setPlatillos(platillosData || [])
      } catch (error: any) {
        console.error("Error al cargar menú:", error)
        setError(error.message || "Error al cargar el menú")
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [params.id])

  const handleEliminar = async () => {
    if (!menu) return

    try {
      setEliminando(true)
      const result = await eliminarMenu(menu.id)

      if (result.success) {
        toast({
          title: "Menú eliminado",
          description: "El menú ha sido eliminado correctamente",
        })
        router.push("/menus")
      } else {
        throw new Error(result.error || "Error al eliminar el menú")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el menú",
        variant: "destructive",
      })
    } finally {
      setEliminando(false)
    }
  }

  const handleAgregarPlatillo = async (platillo: Platillo, precioVenta: number) => {
    if (!menu) return

    try {
      const result = await agregarPlatilloAMenu(menu.id, platillo.id, precioVenta)

      if (result.success) {
        toast({
          title: "Platillo agregado",
          description: `${platillo.nombre} ha sido agregado al menú`,
        })

        // Actualizar la lista de platillos
        const nuevoPlatilloMenu: MenuPlatillo = {
          id: Date.now().toString(), // ID temporal hasta recargar
          menu_id: menu.id,
          platillo_id: platillo.id,
          precio_venta: precioVenta,
          disponible: true,
          created_at: new Date().toISOString(),
          platillo: platillo,
        }

        setPlatillos([...platillos, nuevoPlatilloMenu])
      } else {
        throw new Error(result.error || "Error al agregar el platillo al menú")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el platillo al menú",
        variant: "destructive",
      })
    }
  }

  const handleEliminarPlatillo = async (menuPlatilloId: string) => {
    if (!menu) return

    try {
      const result = await eliminarPlatilloDeMenu(menuPlatilloId, menu.id)

      if (result.success) {
        toast({
          title: "Platillo eliminado",
          description: "El platillo ha sido eliminado del menú",
        })

        // Actualizar la lista de platillos
        setPlatillos(platillos.filter((p) => p.id !== menuPlatilloId))
      } else {
        throw new Error(result.error || "Error al eliminar el platillo del menú")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el platillo del menú",
        variant: "destructive",
      })
    }
  }

  const handleToggleDisponibilidad = async (menuPlatilloId: string, disponible: boolean) => {
    if (!menu) return

    try {
      const result = await actualizarDisponibilidadPlatillo(menuPlatilloId, disponible, menu.id)

      if (result.success) {
        toast({
          title: disponible ? "Platillo disponible" : "Platillo no disponible",
          description: `El platillo ahora está ${disponible ? "disponible" : "no disponible"} en el menú`,
        })

        // Actualizar la lista de platillos
        setPlatillos(platillos.map((p) => (p.id === menuPlatilloId ? { ...p, disponible } : p)))
      } else {
        throw new Error(result.error || "Error al actualizar la disponibilidad")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la disponibilidad",
        variant: "destructive",
      })
    }
  }

  const handleStartEditPrecio = (menuPlatilloId: string, precioActual: number) => {
    setEditingPrecio(menuPlatilloId)
    setTempPrecio(precioActual)
  }

  const handleCancelEditPrecio = () => {
    setEditingPrecio(null)
    setTempPrecio(0)
  }

  const handleSavePrecio = async (menuPlatilloId: string) => {
    if (!menu) return

    try {
      const result = await actualizarPrecioVenta(menuPlatilloId, tempPrecio, menu.id)

      if (result.success) {
        toast({
          title: "Precio actualizado",
          description: "El precio de venta ha sido actualizado",
        })

        // Actualizar la lista de platillos
        setPlatillos(platillos.map((p) => (p.id === menuPlatilloId ? { ...p, precio_venta: tempPrecio } : p)))

        setEditingPrecio(null)
      } else {
        throw new Error(result.error || "Error al actualizar el precio")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el precio",
        variant: "destructive",
      })
    }
  }

  // Calcular estadísticas del menú
  const calcularEstadisticas = () => {
    if (platillos.length === 0) {
      return {
        totalPlatillos: 0,
        platillosDisponibles: 0,
        costoPromedio: 0,
        precioPromedioVenta: 0,
        margenPromedio: 0,
      }
    }

    const totalPlatillos = platillos.length
    const platillosDisponibles = platillos.filter((p) => p.disponible).length

    const costoTotal = platillos.reduce((sum, p) => sum + p.platillo.costo_total, 0)
    const ventaTotal = platillos.reduce((sum, p) => sum + p.precio_venta, 0)

    const costoPromedio = costoTotal / totalPlatillos
    const precioPromedioVenta = ventaTotal / totalPlatillos

    const margenPromedio = costoTotal > 0 ? ((ventaTotal - costoTotal) / ventaTotal) * 100 : 0

    return {
      totalPlatillos,
      platillosDisponibles,
      costoPromedio,
      precioPromedioVenta,
      margenPromedio,
    }
  }

  const stats = calcularEstadisticas()

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Cargando menú...</p>
        </div>
      </div>
    )
  }

  if (error || !menu) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "No se pudo cargar el menú"}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push("/menus")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Menús
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/menus">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{menu.nombre}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/menus/${menu.id}/editar`}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
                <AlertDialogAction
                  onClick={handleEliminar}
                  disabled={eliminando}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {eliminando ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Platillos en el Menú</CardTitle>
              <CardDescription>Gestiona los platillos, precios y disponibilidad</CardDescription>
            </div>
            <PlatilloSelector onAddPlatillo={handleAgregarPlatillo} buttonText="Agregar Platillo" />
          </CardHeader>
          <CardContent>
            {platillos.length > 0 ? (
              <div className="border rounded-md">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Platillo</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Precio de Venta</TableHead>
                        <TableHead>Margen</TableHead>
                        <TableHead>Disponible</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {platillos.map((item) => {
                        const margen =
                          item.precio_venta > 0
                            ? ((item.precio_venta - item.platillo.costo_total) / item.precio_venta) * 100
                            : 0

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {item.platillo.imagen_url && (
                                  <div className="h-10 w-10 rounded-md overflow-hidden relative">
                                    <Image
                                      src={item.platillo.imagen_url || "/placeholder.svg"}
                                      alt={item.platillo.nombre}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{item.platillo.nombre}</p>
                                  {item.platillo.descripcion && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {item.platillo.descripcion}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(item.platillo.costo_total)}</TableCell>
                            <TableCell>
                              {editingPrecio === item.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={tempPrecio}
                                    onChange={(e) => setTempPrecio(Number(e.target.value))}
                                    className="w-24 h-8"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600"
                                    onClick={() => handleSavePrecio(item.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={handleCancelEditPrecio}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className="cursor-pointer hover:underline"
                                  onClick={() => handleStartEditPrecio(item.id, item.precio_venta)}
                                >
                                  {formatCurrency(item.precio_venta)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={margen < 20 ? "destructive" : margen < 30 ? "outline" : "secondary"}>
                                {margen.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={item.disponible}
                                onCheckedChange={(checked) => handleToggleDisponibilidad(item.id, checked)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEliminarPlatillo(item.id)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-muted-foreground mb-2">Este menú no tiene platillos registrados</p>
                <PlatilloSelector
                  onAddPlatillo={handleAgregarPlatillo}
                  buttonText="Agregar Platillos"
                  buttonVariant="outline"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen del Menú</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {menu.imagen_url && (
              <div className="aspect-video relative rounded-md overflow-hidden">
                <Image src={menu.imagen_url || "/placeholder.svg"} alt={menu.nombre} fill className="object-cover" />
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Descripción</h3>
              <p className="text-sm">{menu.descripcion || "Sin descripción"}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total de Platillos</h3>
                <p className="text-2xl font-semibold">{stats.totalPlatillos}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Platillos Disponibles</h3>
                <p className="text-2xl font-semibold">{stats.platillosDisponibles}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Costo Promedio</h3>
              <p className="text-xl font-semibold">{formatCurrency(stats.costoPromedio)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Precio Promedio de Venta</h3>
              <p className="text-xl font-semibold">{formatCurrency(stats.precioPromedioVenta)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Margen Promedio</h3>
              <p className="text-xl font-semibold">{stats.margenPromedio.toFixed(1)}%</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Fecha de creación</h3>
              <p className="text-sm">{new Date(menu.created_at).toLocaleDateString()}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Última actualización</h3>
              <p className="text-sm">{new Date(menu.updated_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
