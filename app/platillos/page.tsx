"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Eye, Search, ChefHat } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { obtenerPlatillos, eliminarPlatillo } from "@/app/actions/platillos-actions"
import { obtenerRestaurantes } from "@/app/actions/hoteles-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function PlatillosPage() {
  const [platillos, setPlatillos] = useState<any[]>([])
  const [restaurantes, setRestaurantes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRestaurante, setSelectedRestaurante] = useState<string>("")
  const [deletingPlatilloId, setDeletingPlatilloId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchRestaurantes()
  }, [])

  useEffect(() => {
    fetchPlatillos()
  }, [selectedRestaurante])

  const fetchRestaurantes = async () => {
    try {
      const result = await obtenerRestaurantes()
      if (result.success) {
        setRestaurantes(result.data)
        // Seleccionar el primer restaurante automáticamente
        if (result.data.length > 0) {
          setSelectedRestaurante(result.data[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching restaurantes:", error)
    }
  }

  const fetchPlatillos = async () => {
    try {
      setLoading(true)
      const result = await obtenerPlatillos(selectedRestaurante || undefined)
      if (result.success) {
        setPlatillos(result.data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los platillos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching platillos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlatillo = async () => {
    if (!deletingPlatilloId) return

    try {
      const result = await eliminarPlatillo(deletingPlatilloId)

      if (result.success) {
        setPlatillos(platillos.filter((p) => p.id !== deletingPlatilloId))
        toast({
          title: "Platillo eliminado",
          description: "El platillo ha sido eliminado correctamente",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el platillo",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error eliminando platillo:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el platillo",
        variant: "destructive",
      })
    } finally {
      setDeletingPlatilloId(null)
    }
  }

  // Filtrar platillos por término de búsqueda
  const filteredPlatillos = platillos.filter((platillo) =>
    platillo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Platillos</h1>
          <p className="text-muted-foreground">Administra las recetas y platillos del sistema</p>
        </div>
        <Button asChild>
          <Link href="/platillos/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Platillo
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
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
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar platillos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Platillos</p>
                <p className="text-2xl font-bold">{filteredPlatillos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Costo Promedio</p>
                <p className="text-2xl font-bold">
                  {filteredPlatillos.length > 0
                    ? `$${(
                        filteredPlatillos.reduce((sum, p) => sum + (p.costo_total || 0), 0) / filteredPlatillos.length
                      ).toFixed(2)}`
                    : "$0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Costo Total</p>
                <p className="text-2xl font-bold">
                  ${filteredPlatillos.reduce((sum, p) => sum + (p.costo_total || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de platillos */}
      <Card>
        <CardHeader>
          <CardTitle>Platillos</CardTitle>
          <CardDescription>
            {filteredPlatillos.length} platillo(s) encontrado(s)
            {searchTerm && ` para "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPlatillos.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron platillos</p>
              <Button variant="outline" className="mt-2" asChild>
                <Link href="/platillos/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Platillo
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platillo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Costo Total</TableHead>
                  <TableHead>Porciones</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlatillos.map((platillo) => (
                  <TableRow key={platillo.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {platillo.imagen_url && (
                          <img
                            src={platillo.imagen_url || "/placeholder.svg"}
                            alt={platillo.nombre}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{platillo.nombre}</div>
                          {platillo.tiempo_preparacion && (
                            <div className="text-sm text-muted-foreground">{platillo.tiempo_preparacion}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{platillo.descripcion || "-"}</div>
                    </TableCell>
                    <TableCell className="font-medium">${(platillo.costo_total || 0).toFixed(2)}</TableCell>
                    <TableCell>{platillo.porciones || 1}</TableCell>
                    <TableCell>
                      <Badge variant={platillo.activo ? "default" : "secondary"}>
                        {platillo.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/platillos/${platillo.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/platillos/${platillo.id}/editar`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500"
                              onClick={() => setDeletingPlatilloId(platillo.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el platillo{" "}
                                <strong>{platillo.nombre}</strong> y todos sus ingredientes asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeletingPlatilloId(null)}>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeletePlatillo} className="bg-red-500 hover:bg-red-600">
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
