"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Eye, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { createClient } from "@/lib/supabase" // Import the correct client for server-side fetching
import { Loader2 } from "@/components/ui/loader2"

interface IngredienteRow {
  id: number
  clave: string
  descripcion: string
  categoria: string
  unidad_medida: string
  precio_actual: number | null
}

interface CategoriaOption {
  id: number
  nombre: string
}

interface UnidadMedidaOption {
  id: number
  nombre: string
}

export default function PreciosPage() {
  const { toast } = useToast()
  const [ingredientes, setIngredientes] = useState<IngredienteRow[]>([])
  const [totalIngredientes, setTotalIngredientes] = useState(0)
  const [categorias, setCategorias] = useState<CategoriaOption[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaOption[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("-1")
  const [selectedUnit, setSelectedUnit] = useState<string>("-1")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const itemsPerPage = 20

  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient() // Use the correct client for server-side fetching

      // Fetch dropdown data
      const { data: categoriasData, error: categoriasError } = await supabase
        .from("categorias")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre")
      if (categoriasError) throw categoriasError
      setCategorias([{ id: -1, nombre: "Todas" }, ...(categoriasData || [])])

      const { data: unidadesData, error: unidadesError } = await supabase
        .from("unidades_medida")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre")
      if (unidadesError) throw unidadesError
      setUnidadesMedida([{ id: -1, nombre: "Todas" }, ...(unidadesData || [])])

      // Fetch ingredients with current prices
      let query = supabase
        .from("ingredientes")
        .select(
          `
          id,
          clave,
          descripcion,
          categorias(nombre),
          unidades_medida(nombre),
          precios_unitarios(precio, fecha_inicio, fecha_fin)
        `,
          { count: "exact" },
        )
        .eq("activo", true)

      if (searchTerm) {
        query = query.ilike("descripcion", `%${searchTerm}%`)
      }
      if (selectedCategory !== "-1") {
        query = query.eq("categoria_id", Number(selectedCategory))
      }
      if (selectedUnit !== "-1") {
        query = query.eq("unidad_medida_id", Number(selectedUnit))
      }

      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage - 1

      const { data, error: ingredientesError, count } = await query.order("descripcion").range(startIndex, endIndex)

      if (ingredientesError) throw ingredientesError

      const formattedData =
        data?.map((ing: any) => {
          const activePrice = ing.precios_unitarios?.find((precio: any) => {
            const now = new Date()
            const fechaInicio = new Date(precio.fecha_inicio)
            const fechaFin = precio.fecha_fin ? new Date(precio.fecha_fin) : null
            return fechaInicio <= now && (!fechaFin || fechaFin > now)
          })

          return {
            id: ing.id,
            clave: ing.clave,
            descripcion: ing.descripcion,
            categoria: ing.categorias?.nombre || "N/A",
            unidad_medida: ing.unidades_medida?.nombre || "N/A",
            precio_actual: activePrice ? activePrice.precio : null,
          }
        }) || []

      if (mounted.current) {
        setIngredientes(formattedData)
        setTotalIngredientes(count || 0)
      }
    } catch (err: any) {
      if (mounted.current) {
        console.error("Error fetching data:", err)
        setError("Error desconocido al cargar los datos: " + err.message)
        toast({
          title: "Error inesperado",
          description: "Ocurrió un error al cargar la información.",
          variant: "destructive",
        })
      }
    } finally {
      if (mounted.current) {
        setLoading(false)
      }
    }
  }, [searchTerm, selectedCategory, selectedUnit, currentPage, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page on new search
    fetchData()
  }

  const totalPages = Math.ceil(totalIngredientes / itemsPerPage)

  const getPaginationItems = () => {
    const items = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      items.push(1)
      if (currentPage > maxPagesToShow / 2 + 1) {
        items.push("...")
      }

      let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2) + 1)
      let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxPagesToShow / 2) - 1)

      if (currentPage <= Math.floor(maxPagesToShow / 2) + 1) {
        endPage = maxPagesToShow - 1
      } else if (currentPage >= totalPages - Math.floor(maxPagesToShow / 2)) {
        startPage = totalPages - maxPagesToShow + 2
      }

      for (let i = startPage; i <= endPage; i++) {
        items.push(i)
      }

      if (currentPage < totalPages - Math.floor(maxPagesToShow / 2)) {
        items.push("...")
      }
      items.push(totalPages)
    }
    return items
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Precios Unitarios</h1>
        <p className="text-lg text-muted-foreground">Consulta y administra los precios de tus ingredientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Descripción</Label>
              <Input
                id="searchTerm"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por descripción de ingrediente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryFilter">Categoría</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitFilter">Unidad de Medida</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una unidad" />
                </SelectTrigger>
                <SelectContent>
                  {unidadesMedida.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Listado de Ingredientes con Precios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando ingredientes...</span>
            </div>
          ) : error ? (
            <div className="text-center text-destructive p-8">
              <p>Error: {error}</p>
              <p>Por favor, intenta de nuevo más tarde.</p>
            </div>
          ) : ingredientes.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              No se encontraron ingredientes con los filtros aplicados.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clave</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Unidad de Medida</TableHead>
                      <TableHead className="text-right">Precio Actual</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientes.map((ingrediente) => (
                      <TableRow key={ingrediente.id}>
                        <TableCell>{ingrediente.clave}</TableCell>
                        <TableCell>{ingrediente.descripcion}</TableCell>
                        <TableCell>{ingrediente.categoria}</TableCell>
                        <TableCell>{ingrediente.unidad_medida}</TableCell>
                        <TableCell className="text-right">
                          {ingrediente.precio_actual !== null ? `$${ingrediente.precio_actual.toFixed(2)}` : "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/precios/${ingrediente.id}`}>
                            <Button variant="ghost" size="icon" title="Ver historial de precios">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver historial de precios de {ingrediente.descripcion}</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : undefined}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                  {getPaginationItems().map((item, index) => (
                    <PaginationItem key={index}>
                      {item === "..." ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={item === currentPage}
                          onClick={() => setCurrentPage(item as number)}
                        >
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      aria-disabled={currentPage === totalPages}
                      tabIndex={currentPage === totalPages ? -1 : undefined}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
