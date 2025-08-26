/* ==================================================
  Imports
================================================== */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tags, Package, TrendingUp } from "lucide-react"
import { obtenerCategorias } from "@/app/actions/categorias-actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// No se necesita Badge si la columna 'activo' se elimina de la UI
// import { Badge } from "@/components/ui/badge"

/* ==================================================
  Interfaces, tipados, clases
================================================== */
// Definir la interfaz para la categoría, incluyendo 'activo' ya que la acción lo trae con select("*")
interface CategoriaIngrediente {
  id: number
  descripcion: string
  activo: boolean // Se mantiene en la interfaz porque la acción lo trae, aunque no se muestre en la UI
}

export default async function CategoriasPage() {
  const { data: categorias, error } = (await obtenerCategorias()) as {
    data: CategoriaIngrediente[] | null
    error: string | null
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías de Ingredientes</h1>
          <p className="text-muted-foreground">Organiza y clasifica todos los ingredientes del sistema</p>
        </div>
        {/* Botón "Nueva Categoría" eliminado */}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorias?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Categorías creadas</p>
          </CardContent>
        </Card>
        {/* Tarjeta "Categorías Activas" eliminada */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingredientes Totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>{" "}
            {/* Este valor requeriría una consulta adicional a la tabla de ingredientes */}
            <p className="text-xs text-muted-foreground">Ingredientes clasificados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Más Utilizada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div> {/* Este valor requeriría lógica de conteo de uso */}
            <p className="text-xs text-muted-foreground">Categoría popular</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
          <CardDescription>Todas las categorías de ingredientes del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8 text-red-500">
              <p>Error al cargar categorías: {error}</p>
            </div>
          )}
          {categorias && categorias.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Descripción</TableHead>
                  {/* Columna 'Estado' eliminada */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="font-medium">{categoria.id}</TableCell>
                    <TableCell>{categoria.descripcion}</TableCell>
                    {/* Celda 'Estado' eliminada */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Tags className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay categorías registradas</h3>
              <p className="text-muted-foreground">Comienza creando categorías para organizar tus ingredientes</p>
              {/* Botón "Crear Primera Categoría" eliminado */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
