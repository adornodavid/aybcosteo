"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, Edit, Trash2, Package, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { obtenerIngredientes, obtenerHoteles, eliminarIngrediente } from "@/app/actions/ingredientes-actions-real"
import { formatCurrency, type Ingrediente, type Hotel } from "@/lib/supabase-real"

export default function IngredientesPageReal() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHotel, setSelectedHotel] = useState<string>("todos")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Obtener hoteles
      const hotelesResult = await obtenerHoteles()
      if (hotelesResult.success) {
        setHoteles(hotelesResult.data)
      }

      // Obtener ingredientes
      const ingredientesResult = await obtenerIngredientes()
      if (ingredientesResult.success) {
        setIngredientes(ingredientesResult.data)
      } else {
        toast({
          title: "Error",
          description: ingredientesResult.error || "No se pudieron cargar los ingredientes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarIngrediente = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${nombre}"?`)) {
      return
    }

    const result = await eliminarIngrediente(id)
    if (result.success) {
      setIngredientes(ingredientes.filter((i) => i.id !== id))
      toast({
        title: "Ingrediente eliminado",
        description: `El ingrediente ${nombre} ha sido eliminado correctamente`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo eliminar el ingrediente",
        variant: "destructive",
      })
    }
  }

  // Filtrar ingredientes
  const filteredIngredientes = ingredientes.filter((ingrediente) => {
    const matchesSearch =
      ingrediente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ingrediente.codigo && ingrediente.codigo.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesHotel = selectedHotel === "todos" || ingrediente.hotelid?.toString() === selectedHotel

    return matchesSearch && matchesHotel
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Ingredientes</h1>
          <p className="text-muted-foreground mt-2">Administra el inventario de ingredientes por hotel</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/ingredientes/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ingrediente
            </Link>
          </Button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredIngredientes.length}</div>
            <p className="text-xs text-muted-foreground">ingredientes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredIngredientes.length > 0
                ? formatCurrency(
                    filteredIngredientes.reduce((sum, i) => sum + (i.costo || 0), 0) / filteredIngredientes.length,
                  )
                : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Por ingrediente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredIngredientes.reduce((sum, i) => sum + (i.costo || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Inventario total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hoteles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hoteles.length}</div>
            <p className="text-xs text-muted-foreground">Hoteles activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hotel</label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hotel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los hoteles</SelectItem>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id.toString()}>
                      {hotel.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <Button variant="outline" className="w-full" onClick={() => setSearchTerm("")}>
                <Search className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ingredientes */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes Registrados</CardTitle>
          <CardDescription>
            {filteredIngredientes.length} ingrediente(s) encontrado(s)
            {searchTerm && ` para "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando ingredientes...</span>
            </div>
          ) : filteredIngredientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron ingredientes</p>
              <p className="text-sm">Intenta ajustar los filtros o crear un nuevo ingrediente</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/ingredientes/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Ingrediente
                </Link>
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Hotel</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredientes.map((ingrediente) => (
                    <TableRow key={ingrediente.id}>
                      <TableCell className="font-medium">{ingrediente.codigo}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium">{ingrediente.nombre}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ingrediente.hotel?.nombre || "Sin hotel"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ingrediente.categoria?.descripcion || "Sin categoría"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          {formatCurrency(ingrediente.costo || 0)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{ingrediente.unidadmedida?.descripcion || "Sin unidad"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/ingredientes/${ingrediente.id}/editar`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminarIngrediente(ingrediente.id, ingrediente.nombre)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
