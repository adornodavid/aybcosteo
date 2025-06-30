import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Utensils, Users, Clock } from "lucide-react"
import Link from "next/link"

export default function RestaurantesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurantes</h1>
          <p className="text-muted-foreground">Gestiona todos los restaurantes de tus hoteles</p>
        </div>
        <Button asChild>
          <Link href="/restaurantes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Restaurante
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restaurantes</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Restaurantes registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurantes Activos</CardTitle>
            <Utensils className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">En operación</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Comensales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horario Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Horas de servicio</p>
          </CardContent>
        </Card>
      </div>

      {/* Restaurants List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Restaurantes</CardTitle>
          <CardDescription>Todos los restaurantes registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Utensils className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No hay restaurantes registrados</h3>
            <p className="text-muted-foreground">Comienza agregando tu primer restaurante al sistema</p>
            <Button asChild className="mt-4">
              <Link href="/restaurantes/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Restaurante
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
