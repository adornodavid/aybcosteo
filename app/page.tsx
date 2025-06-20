"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Hotel, Package, ShoppingCart, Utensils, Store, FileSpreadsheet, ChefHat, TrendingUp } from "lucide-react"
import { obtenerHoteles } from "@/app/actions/hoteles-actions"
import { obtenerIngredientes } from "@/app/actions/ingredientes-actions"
import { obtenerPlatillos } from "@/app/actions/platillos-actions"
import Link from "next/link"

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalHoteles: 0,
    totalIngredientes: 0,
    totalPlatillos: 0,
    costoPromedioIngredientes: 0,
    costoPromedioPlatillos: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching dashboard data...")

      // Obtener datos básicos
      const [hotelesResult, ingredientesResult, platillosResult] = await Promise.all([
        obtenerHoteles(),
        obtenerIngredientes(),
        obtenerPlatillos(),
      ])

      console.log("Hoteles result:", hotelesResult)
      console.log("Ingredientes result:", ingredientesResult)
      console.log("Platillos result:", platillosResult)

      const hoteles = hotelesResult.success ? hotelesResult.data || [] : []
      const ingredientes = ingredientesResult.success ? ingredientesResult.data || [] : []
      const platillos = platillosResult.success ? platillosResult.data || [] : []

      // Calcular estadísticas
      const costoPromedioIngredientes =
        ingredientes.length > 0
          ? ingredientes.reduce((sum: number, item: any) => sum + (item.precio_actual?.precio || 0), 0) /
            ingredientes.length
          : 0

      const costoPromedioPlatillos =
        platillos.length > 0
          ? platillos.reduce((sum: number, item: any) => sum + (item.costo_total || 0), 0) / platillos.length
          : 0

      setStats({
        totalHoteles: hoteles.length,
        totalIngredientes: ingredientes.length,
        totalPlatillos: platillos.length,
        costoPromedioIngredientes,
        costoPromedioPlatillos,
      })

      console.log("Stats calculadas:", {
        totalHoteles: hoteles.length,
        totalIngredientes: ingredientes.length,
        totalPlatillos: platillos.length,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Error al cargar los datos del dashboard")
    } finally {
      setLoading(false)
    }
  }

  // Datos para el gráfico de barras
  const barData = [
    {
      name: "Hoteles",
      total: stats.totalHoteles,
    },
    {
      name: "Ingredientes",
      total: stats.totalIngredientes,
    },
    {
      name: "Platillos",
      total: stats.totalPlatillos,
    },
  ]

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard - Sistema de Costeo Hotelero</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchDashboardData}>
            Actualizar Datos
          </Button>
          <Button asChild>
            <Link href="/importar">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Importar Datos
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={fetchDashboardData} className="mt-2">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoteles</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHoteles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalHoteles === 0 ? "Crea tu primer hotel" : "Hoteles registrados"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingredientes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIngredientes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.costoPromedioIngredientes > 0
                ? `Costo promedio: ${formatCurrency(stats.costoPromedioIngredientes)}`
                : "Agrega ingredientes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platillos</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlatillos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.costoPromedioPlatillos > 0
                ? `Costo promedio: ${formatCurrency(stats.costoPromedioPlatillos)}`
                : "Crea platillos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistema</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Activo</div>
            <p className="text-xs text-muted-foreground">Datos en tiempo real</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Resumen del Sistema</CardTitle>
            <CardDescription>Datos actuales de tu sistema de costeo</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8884d8" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="w-full justify-start" asChild>
              <Link href="/hoteles">
                <Hotel className="mr-2 h-4 w-4" />
                Gestionar Hoteles ({stats.totalHoteles})
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/ingredientes">
                <Package className="mr-2 h-4 w-4" />
                Gestionar Ingredientes ({stats.totalIngredientes})
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/platillos">
                <ChefHat className="mr-2 h-4 w-4" />
                Crear Platillos ({stats.totalPlatillos})
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/menus">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Gestionar Menús
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/restaurantes">
                <Store className="mr-2 h-4 w-4" />
                Gestionar Restaurantes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Información del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
          <CardDescription>Información sobre la configuración actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Badge variant="default">Datos Reales</Badge>
              <span className="text-sm">Conectado a Supabase</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Multi-Hotel</Badge>
              <span className="text-sm">Soporte para cadena hotelera</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Costeo Dinámico</Badge>
              <span className="text-sm">Cálculos automáticos de costos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
