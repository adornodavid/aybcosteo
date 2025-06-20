"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, DollarSign } from "lucide-react"
import { supabase, type Ingrediente } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

interface IngredienteConPrecio extends Ingrediente {
  precio_actual?: number
}

export default function PreciosPage() {
  const [ingredientes, setIngredientes] = useState<IngredienteConPrecio[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchIngredientesConPrecios()
    fetchCategorias()
  }, [])

  const fetchIngredientesConPrecios = async () => {
    try {
      setLoading(true)
      // Obtener todos los ingredientes
      const { data: ingredientesData, error: ingredientesError } = await supabase
        .from("ingredientes")
        .select(`
          *,
          categoria:categorias(*)
        `)
        .eq("status", "activo")
        .order("descripcion")

      if (ingredientesError) throw ingredientesError

      // Para cada ingrediente, obtener su precio actual
      const ingredientesConPrecios: IngredienteConPrecio[] = []
      for (const ingrediente of ingredientesData || []) {
        const { data: precioData, error: precioError } = await supabase
          .from("precios_unitarios")
          .select("precio")
          .eq("ingrediente_id", ingrediente.id)
          .is("fecha_fin", null)
          .order("fecha_inicio", { ascending: false })
          .limit(1)
          .single()

        if (precioError && precioError.code !== "PGRST116") {
          console.error("Error fetching precio for ingrediente:", ingrediente.id, precioError)
        }

        ingredientesConPrecios.push({
          ...ingrediente,
          precio_actual: precioData?.precio || 0,
        })
      }

      setIngredientes(ingredientesConPrecios)
    } catch (error) {
      console.error("Error fetching ingredientes con precios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los ingredientes con sus precios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase.from("categorias").select("*").order("nombre")

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error("Error fetching categorias:", error)
    }
  }

  const filteredIngredientes = ingredientes.filter((ingrediente) => {
    const matchesSearch =
      ingrediente.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingrediente.clave.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategoria = selectedCategoria === "all" || ingrediente.categoria_id === selectedCategoria

    return matchesSearch && matchesCategoria
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Precios Unitarios</h1>
        <p className="text-muted-foreground">Gestiona los precios de los ingredientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra ingredientes por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o clave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Precios</CardTitle>
          <CardDescription>{filteredIngredientes.length} ingredientes encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Precio Actual</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron ingredientes con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                filteredIngredientes.map((ingrediente) => (
                  <TableRow key={ingrediente.id}>
                    <TableCell className="font-mono">{ingrediente.clave}</TableCell>
                    <TableCell className="font-medium">{ingrediente.descripcion}</TableCell>
                    <TableCell>{ingrediente.categoria?.nombre || "Sin categoría"}</TableCell>
                    <TableCell>{ingrediente.unidad_medida}</TableCell>
                    <TableCell className="font-medium">
                      {ingrediente.precio_actual ? (
                        `$${Number.parseFloat(ingrediente.precio_actual.toString()).toFixed(2)}`
                      ) : (
                        <Badge variant="outline">Sin precio</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/precios/${ingrediente.id}`}>
                        <Button variant="outline" size="sm">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Gestionar
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
