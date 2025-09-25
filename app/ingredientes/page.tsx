"use client"

/* ==================================================
  Imports
================================================== */
import { useState, useEffect } from "react"
import Image from "next/image" // Importar Image de next/image
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, Edit, Trash2, Package, Loader2, Eye, Calendar, AlertCircle, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  obtenerHoteles,
  obtenerCategoriasIngredientes,
  buscarIngredientes,
  eliminarIngrediente,
} from "@/app/actions/ingredientes-actions"

interface Hotel {
  id: number
  nombre: string
}

interface CategoriaIngrediente {
  id: number
  descripcion: string
}

interface Ingrediente {
  id: number
  codigo?: string
  nombre?: string
  categoriaid?: number
  costo?: number
  unidadmedidaid?: number
  hotelid?: number
  imgurl?: string
  cambio?: number
  activo?: boolean
  fechacreacion?: string
  fechamodificacion?: string
  hotel?: {
    id: number
    nombre: string
  }
  categoria?: {
    id: number
    descripcion: string
  }
  unidadmedida?: {
    id: number
    descripcion: string
  }
}

export default function IngredientesPage() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [categorias, setCategorias] = useState<CategoriaIngrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Estados para los filtros
  const [txtCodigo, setTxtCodigo] = useState("")
  const [txtNombre, setTxtNombre] = useState("")
  const [ddlHoteles, setDdlHoteles] = useState("")
  const [ddlCategorias, setDdlCategorias] = useState("")

  const itemsPerPage = 20

  useEffect(() => {
    cargarDatosIniciales()
  }, [])

  const cargarDatosIniciales = async () => {
    setLoading(true)
    setError(null)

    try {
      // Verificar variables de entorno
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Variables de entorno de Supabase no configuradas")
      }

      // Cargar hoteles
      console.log("Cargando hoteles...")
      const hotelesResult = await obtenerHoteles()
      if (hotelesResult.success) {
        setHoteles(hotelesResult.data)
        console.log("Hoteles cargados:", hotelesResult.data.length)
      } else {
        console.error("Error cargando hoteles:", hotelesResult.error)
        setError(`Error cargando hoteles: ${hotelesResult.error}`)
      }

      // Cargar categorías
      console.log("Cargando categorías...")
      const categoriasResult = await obtenerCategoriasIngredientes()
      if (categoriasResult.success) {
        setCategorias(categoriasResult.data)
        console.log("Categorías cargadas:", categoriasResult.data.length)
      } else {
        console.error("Error cargando categorías:", categoriasResult.error)
      }

      // Cargar ingredientes iniciales
      console.log("Cargando ingredientes...")
      await ejecutarBusqueda(1)
    } catch (error: any) {
      console.error("Error cargando datos iniciales:", error)
      setError(`Error de conexión: ${error.message}`)
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con la base de datos. Verifica tu conexión.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const ejecutarBusqueda = async (page = 1) => {
    setSearching(true)
    try {
      const filtros = {
        codigo: txtCodigo,
        nombre: txtNombre,
        hotelId: ddlHoteles ? Number.parseInt(ddlHoteles) : undefined,
        categoriaId: ddlCategorias ? Number.parseInt(ddlCategorias) : undefined,
        page,
        limit: itemsPerPage,
      }

      const result = await buscarIngredientes(filtros)
      if (result.success) {
        setIngredientes(result.data)
        setTotalCount(result.count)
        setCurrentPage(page)
        setTotalPages(Math.ceil(result.count / itemsPerPage))
      } else {
        setError(`Error en búsqueda: ${result.error}`)
      }
    } catch (error: any) {
      console.error("Error en búsqueda:", error)
      setError(`Error en búsqueda: ${error.message}`)
      toast({
        title: "Error",
        description: "Error al buscar ingredientes",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  const handleBtnBuscar = () => {
    ejecutarBusqueda(1)
  }

  const handleBtnLimpiar = () => {
    setTxtCodigo("")
    setTxtNombre("")
    setDdlHoteles("")
    setDdlCategorias("")
  }

  const handleBtnImportarExcel = () => {
    router.push("/importar")
  }

  const handleEliminarIngrediente = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${nombre}"?`)) {
      return
    }

    try {
      const result = await eliminarIngrediente(id)
      if (result.success) {
        toast({
          title: "Ingrediente eliminado",
          description: `El ingrediente ${nombre} ha sido eliminado correctamente`,
        })
        ejecutarBusqueda(currentPage)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar el ingrediente",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el ingrediente",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Sin fecha"
    return new Date(dateString).toLocaleDateString("es-MX")
  }

  const calcularEstadisticas = () => {
    const totalIngredientes = totalCount
    const costoPromedio =
      ingredientes.length > 0 ? ingredientes.reduce((sum, i) => sum + (i.costo || 0), 0) / ingredientes.length : 0
    const costoTotal = ingredientes.reduce((sum, i) => sum + (i.costo || 0), 0)
    const hotelesConIngredientes = new Set(ingredientes.map((i) => i.hotel?.nombre).filter(Boolean)).size

    return { totalIngredientes, costoPromedio, costoTotal, hotelesConIngredientes }
  }

  const estadisticas = calcularEstadisticas()
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" >
      <div className="flex flex-col items-center justify-center">
         <div className="relative w-24 h-24 mb-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/design-mode-images/CargarPage%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29-gizJKKg9b0KEafLqXqsorTrqMiiel0.gif"
              alt="Procesando..."
              width={300} // Ajusta el tamaño según sea necesario
              height={300} // Ajusta el tamaño según sea necesario
              unoptimized // Importante para GIFs externos
              className="absolute inset-0 animate-bounce-slow"
            />
            </div>
        
            <span className="text-lg font-semibold text-gray-800">Cargando página...</span>
            </div>
      </div>
    )
  }
  
  

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={cargarDatosIniciales}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* 1. Título */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ingredientes</h1>
          <p className="text-base text-muted-foreground mt-2">Gestión completa de ingredientes por hotel</p>
        </div>
        {/* 2. Botones con alineación derecha */}
        {/*<div className="flex gap-2">
          <Button onClick={() => router.push("/ingredientes/nuevo")}>Registrar Ingrediente</Button>
          <Button variant="outline" onClick={handleBtnImportarExcel}>
            Importar Excel
          </Button>
        </div>*/}
      </div>

      {/* 3. Resumen de estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.totalIngredientes}</div>
            <p className="text-xs text-muted-foreground">ingredientes activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(estadisticas.costoPromedio)}</div>
            <p className="text-xs text-muted-foreground">Por ingrediente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo Total Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(estadisticas.costoTotal)}</div>
            <p className="text-xs text-muted-foreground">Valor total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hoteles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.hotelesConIngredientes}</div>
            <p className="text-xs text-muted-foreground">Con ingredientes</p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Filtros de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Código de Ingrediente</label>
              <input
                type="text"
                value={txtCodigo}
                onChange={(e) => setTxtCodigo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Código..."
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <input
                type="text"
                value={txtNombre}
                onChange={(e) => setTxtNombre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre..."
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hotel</label>
              <select
                value={ddlHoteles}
                onChange={(e) => setDdlHoteles(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los hoteles</option>
                {hoteles.map((hotel) => (
                  <option key={hotel.id} value={hotel.id.toString()}>
                    {hotel.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <select
                value={ddlCategorias}
                onChange={(e) => setDdlCategorias(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id.toString()}>
                    {categoria.descripcion}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Button variant="outline" onClick={handleBtnLimpiar} className="w-full bg-transparent">
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpiar Filtros
              </Button>
            </div>

            <div className="space-y-2">
              <Button onClick={handleBtnBuscar} disabled={searching} className="w-full">
                {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Grid que muestre el resultado de la búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes Registrados</CardTitle>
          <CardDescription>
            {totalCount} ingrediente(s) encontrado(s) - Página {currentPage} de {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searching ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Buscando ingredientes...</span>
            </div>
          ) : ingredientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron ingredientes</p>
              <p className="text-sm">Intenta ajustar los filtros o crear un nuevo ingrediente</p>
            </div>
          ) : (
            <>
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Código</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hotel</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Categoría</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Costo</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Unidad</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cambio</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Fecha Creación
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientes.map((ingrediente) => (
                      <tr key={ingrediente.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-mono text-sm">{ingrediente.id}</td>
                        <td className="p-4 align-middle font-medium">{ingrediente.codigo || "Sin código"}</td>
                        <td className="p-4 align-middle">
                          <div className="max-w-[200px]">
                            <div className="font-medium">{ingrediente.nombre || "Sin nombre"}</div>
                            {ingrediente.imgurl && <div className="text-xs text-muted-foreground">Con imagen</div>}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline">{ingrediente.hotel?.nombre || "Sin hotel"}</Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="secondary">{ingrediente.categoria?.descripcion || "Sin categoría"}</Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="default" className="bg-green-600">
                            {formatCurrency(ingrediente.costo || 0)}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="text-sm">{ingrediente.unidadmedida?.descripcion || "Sin unidad"}</div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={ingrediente.cambio ? "default" : "secondary"}>
                            {ingrediente.cambio || 0}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(ingrediente.fechacreacion)}
                          </div>
                          {ingrediente.fechamodificacion &&
                            ingrediente.fechamodificacion !== ingrediente.fechacreacion && (
                              <div className="text-xs text-muted-foreground">
                                Mod: {formatDate(ingrediente.fechamodificacion)}
                              </div>
                            )}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex justify-end gap-2">
                           {/* <Button variant="ghost" size="sm" asChild>
                              <Link href={`/ingredientes/${ingrediente.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/ingredientes/${ingrediente.id}/editar`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminarIngrediente(ingrediente.id, ingrediente.nombre || "")}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>*/}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} ingredientes
                  </div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i
                      if (pageNum > totalPages) return null
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => ejecutarBusqueda(pageNum)}
                          disabled={searching}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => ejecutarBusqueda(currentPage + 1)}
                    disabled={currentPage >= totalPages || searching}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
