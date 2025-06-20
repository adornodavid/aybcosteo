"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, TrendingUp, TrendingDown, Store, Download } from "lucide-react"

export default function AnalisisPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])

  // Datos de ejemplo para comparación
  const restaurantComparison = [
    {
      id: 1,
      nombre: "Restaurante Centro",
      foodCost: 27.5,
      margenPromedio: 72.5,
      ventasPromedio: 125000,
      platillosMasVendidos: "Filete de Res",
      tendencia: "up",
    },
    {
      id: 2,
      nombre: "Restaurante Norte",
      foodCost: 29.2,
      margenPromedio: 70.8,
      ventasPromedio: 98000,
      platillosMasVendidos: "Pasta Alfredo",
      tendencia: "up",
    },
    {
      id: 3,
      nombre: "Restaurante Sur",
      foodCost: 31.5,
      margenPromedio: 68.5,
      ventasPromedio: 87000,
      platillosMasVendidos: "Pizza Margarita",
      tendencia: "down",
    },
    {
      id: 4,
      nombre: "Restaurante Polanco",
      foodCost: 26.8,
      margenPromedio: 73.2,
      ventasPromedio: 156000,
      platillosMasVendidos: "Salmón Teriyaki",
      tendencia: "up",
    },
  ]

  const topPlatillos = [
    { nombre: "Filete de Res", ventas: 450, margen: 72.5, costo: 125 },
    { nombre: "Salmón Teriyaki", ventas: 380, margen: 74.2, costo: 98 },
    { nombre: "Pasta Alfredo", ventas: 320, margen: 71.8, costo: 45 },
    { nombre: "Pizza Margarita", ventas: 290, margen: 68.5, costo: 38 },
    { nombre: "Ensalada César", ventas: 250, margen: 75.5, costo: 35 },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Análisis y Comparativas</h1>
          <p className="text-muted-foreground mt-2">Análisis detallado de costos y márgenes por restaurante</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comparison">Comparación de Restaurantes</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="top-dishes">Top Platillos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas de Costos</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          {/* KPIs Comparativos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Food Cost Promedio Global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28.7%</div>
                <p className="text-xs text-green-600">↓ 1.3% vs mes anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mejor Margen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">73.2%</div>
                <p className="text-xs text-muted-foreground">Restaurante Polanco</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Variación de Costos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.7%</div>
                <p className="text-xs text-orange-600">Entre restaurantes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Oportunidad de Mejora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45K</div>
                <p className="text-xs text-muted-foreground">Potencial mensual</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla Comparativa */}
          <Card>
            <CardHeader>
              <CardTitle>Comparación por Restaurante</CardTitle>
              <CardDescription>Métricas clave de rendimiento por ubicación</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurante</TableHead>
                    <TableHead>Food Cost</TableHead>
                    <TableHead>Margen Promedio</TableHead>
                    <TableHead>Ventas Promedio</TableHead>
                    <TableHead>Platillo Top</TableHead>
                    <TableHead>Tendencia</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurantComparison.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          {restaurant.nombre}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={restaurant.foodCost < 30 ? "text-green-600" : "text-orange-600"}>
                          {restaurant.foodCost}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={restaurant.margenPromedio > 70 ? "text-green-600" : "text-orange-600"}>
                          {restaurant.margenPromedio}%
                        </span>
                      </TableCell>
                      <TableCell>${restaurant.ventasPromedio.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{restaurant.platillosMasVendidos}</Badge>
                      </TableCell>
                      <TableCell>
                        {restaurant.tendencia === "up" ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Ver detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Gráfico Visual (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Comparación Visual de Food Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-gray-400" />
                <span className="ml-2 text-gray-500">Gráfico de barras comparativo</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Costos</CardTitle>
              <CardDescription>Evolución de costos y márgenes en el tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-12 w-12 text-gray-400" />
                <span className="ml-2 text-gray-500">Gráfico de tendencias</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-dishes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platillos Más Rentables</CardTitle>
              <CardDescription>Análisis de los platillos con mejor desempeño</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platillo</TableHead>
                    <TableHead>Ventas (unidades)</TableHead>
                    <TableHead>Margen</TableHead>
                    <TableHead>Costo Unitario</TableHead>
                    <TableHead>Contribución Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPlatillos.map((platillo, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{platillo.nombre}</TableCell>
                      <TableCell>{platillo.ventas}</TableCell>
                      <TableCell>
                        <span className="text-green-600">{platillo.margen}%</span>
                      </TableCell>
                      <TableCell>${platillo.costo}</TableCell>
                      <TableCell className="font-bold">
                        ${(platillo.ventas * platillo.costo * (platillo.margen / 100)).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Costos</CardTitle>
              <CardDescription>Platillos y restaurantes que requieren atención</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-red-900">Food Cost Alto</h4>
                    <p className="text-sm text-red-700">3 restaurantes con food cost superior al 32%</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Revisar
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-orange-900">Márgenes Bajos</h4>
                    <p className="text-sm text-orange-700">12 platillos con margen inferior al 65%</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Revisar
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-yellow-900">Variación de Precios</h4>
                    <p className="text-sm text-yellow-700">5 ingredientes con aumento de precio superior al 15%</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Revisar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
