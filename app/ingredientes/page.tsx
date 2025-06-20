"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, Edit, Trash2, Package, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

// Datos mock para que la página funcione inmediatamente
const mockIngredientes = [
  {
    id: "1",
    clave: "CARNE001",
    descripcion: "Filete de Res Premium",
    categoria: { id: "1", nombre: "Carnes" },
    restaurante: { id: "1", nombre: "Restaurante Principal" },
    status: "activo",
    tipo: "Proteína",
    unidad_medida: "Kilogramo",
    cantidad_por_presentacion: 1.0,
    conversion: "Gramo",
    precio_actual: { precio: 450.0 },
    created_at: "2024-01-15",
    updated_at: "2024-01-15",
  },
  {
    id: "2",
    clave: "VEG001",
    descripcion: "Tomate Roma",
    categoria: { id: "2", nombre: "Verduras" },
    restaurante: { id: "1", nombre: "Restaurante Principal" },
    status: "activo",
    tipo: "Vegetal",
    unidad_medida: "Kilogramo",
    cantidad_por_presentacion: 1.0,
    conversion: "Gramo",
    precio_actual: { precio: 35.0 },
    created_at: "2024-01-15",
    updated_at: "2024-01-15",
  },
  {
    id: "3",
    clave: "LAC001",
    descripcion: "Queso Manchego",
    categoria: { id: "3", nombre: "Lácteos" },
    restaurante: { id: "1", nombre: "Restaurante Principal" },
    status: "activo",
    tipo: "Lácteo",
    unidad_medida: "Kilogramo",
    cantidad_por_presentacion: 1.0,
    conversion: "Gramo",
    precio_actual: { precio: 280.0 },
    created_at: "2024-01-15",
    updated_at: "2024-01-15",
  },
  {
    id: "4",
    clave: "MAR001",
    descripcion: "Salmón Fresco",
    categoria: { id: "4", nombre: "Mariscos" },
    restaurante: { id: "2", nombre: "Restaurante Vista Mar" },
    status: "activo",
    tipo: "Pescado",
    unidad_medida: "Kilogramo",
    cantidad_por_presentacion: 1.0,
    conversion: "Gramo",
    precio_actual: { precio: 650.0 },
    created_at: "2024-01-15",
    updated_at: "2024-01-15",
  },
  {
    id: "5",
    clave: "ACEI001",
    descripcion: "Aceite de Oliva Extra Virgen",
    categoria: { id: "5", nombre: "Aceites" },
    restaurante: { id: "1", nombre: "Restaurante Principal" },
    status: "activo",
    tipo: "Aceite",
    unidad_medida: "Litro",
    cantidad_por_presentacion: 1.0,
    conversion: "Mililitro",
    precio_actual: { precio: 180.0 },
    created_at: "2024-01-15",
    updated_at: "2024-01-15",
  },
]

const mockRestaurantes = [
  { id: "1", nombre: "Restaurante Principal" },
  { id: "2", nombre: "Restaurante Vista Mar" },
  { id: "3", nombre: "Café Montaña" },
]

const mockCategorias = [
  { id: "1", nombre: "Carnes" },
  { id: "2", nombre: "Verduras" },
  { id: "3", nombre: "Lácteos" },
  { id: "4", nombre: "Mariscos" },
  { id: "5", nombre: "Aceites" },
]

interface Ingrediente {
  id: string
  clave: string
  descripcion: string
  categoria?: { id: string; nombre: string }
  restaurante?: { id: string; nombre: string }
  status: string
  tipo?: string
  unidad_medida?: string
  cantidad_por_presentacion?: number
  conversion?: string
  precio_actual?: { precio: number } | null
  created_at: string
  updated_at: string
}

export default function IngredientesPage() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(mockIngredientes)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRestaurante, setSelectedRestaurante] = useState<string>("todos")
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todas")
  const { toast } = useToast()

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const handleEliminarIngrediente = (id: string, nombre: string) => {
    setIngredientes(ingredientes.filter((i) => i.id !== id))
    toast({
      title: "Ingrediente eliminado",
      description: `El ingrediente ${nombre} ha sido eliminado correctamente`,
    })
  }

  // Filtrar ingredientes
  const filteredIngredientes = ingredientes.filter((ingrediente) => {
    const matchesSearch =
      ingrediente.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingrediente.clave.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRestaurante = selectedRestaurante === "todos" || ingrediente.restaurante?.id === selectedRestaurante

    const matchesCategoria = selectedCategoria === "todas" || ingrediente.categoria?.id === selectedCategoria

    return matchesSearch && matchesRestaurante && matchesCategoria
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Ingredientes</h1>
          <p className="text-muted-foreground mt-2">Administra el inventario de ingredientes por restaurante</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/ingredientes/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ingrediente
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/importar">
              <Package className="h-4 w-4 mr-2" />
              Importar Excel
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
            <p className="text-xs text-muted-foreground">
              {filteredIngredientes.filter((i) => i.status === "activo").length} activos
            </p>
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
                    filteredIngredientes.reduce((sum, i) => sum + (i.precio_actual?.precio || 0), 0) /
                      filteredIngredientes.length,
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
              {formatCurrency(filteredIngredientes.reduce((sum, i) => sum + (i.precio_actual?.precio || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Inventario total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredIngredientes.map((i) => i.categoria?.nombre).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground">Diferentes tipos</p>
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
          <div className="grid gap-4 md:grid-cols-4">
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
              <label className="text-sm font-medium">Restaurante</label>
              <Select value={selectedRestaurante} onValueChange={setSelectedRestaurante}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar restaurante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los restaurantes</SelectItem>
                  {mockRestaurantes.map((restaurante) => (
                    <SelectItem key={restaurante.id} value={restaurante.id}>
                      {restaurante.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {mockCategorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
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
                    <TableHead>Descripción</TableHead>
                    <TableHead>Restaurante</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredientes.map((ingrediente) => (
                    <TableRow key={ingrediente.id}>
                      <TableCell className="font-medium">{ingrediente.clave}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium">{ingrediente.descripcion}</div>
                          <div className="text-sm text-muted-foreground">
                            {ingrediente.cantidad_por_presentacion} {ingrediente.unidad_medida}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ingrediente.restaurante?.nombre}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ingrediente.categoria?.nombre}</Badge>
                      </TableCell>
                      <TableCell>{ingrediente.tipo}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{ingrediente.unidad_medida}</div>
                          <div className="text-muted-foreground">→ {ingrediente.conversion}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ingrediente.precio_actual ? (
                          <Badge variant="default" className="bg-green-600">
                            {formatCurrency(ingrediente.precio_actual.precio)}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Sin precio</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ingrediente.status === "activo" ? "default" : "secondary"}>
                          {ingrediente.status === "activo" ? "Activo" : "Inactivo"}
                        </Badge>
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
                            onClick={() => handleEliminarIngrediente(ingrediente.id, ingrediente.descripcion)}
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
