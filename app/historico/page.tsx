"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, Search, Filter, Calendar, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

// Datos de ejemplo para histórico
const historicoEjemplo = [
  {
    idrec: 1,
    hotelid: 1,
    restauranteid: 1,
    menuid: 1,
    platilloid: 1,
    ingredienteid: 1,
    recetaid: 1,
    cantidad: 2.5,
    costo: 45.5,
    activo: true,
    fechacreacion: "2024-01-15",
    hotel: "Hotel Plaza",
    restaurante: "Restaurante Principal",
    menu: "Menú Ejecutivo",
    platillo: "Pasta Alfredo",
    ingrediente: "Queso Parmesano",
    receta: "Salsa Alfredo",
  },
  {
    idrec: 2,
    hotelid: 1,
    restauranteid: 1,
    menuid: 1,
    platilloid: 2,
    ingredienteid: 2,
    recetaid: 2,
    cantidad: 1.0,
    costo: 25.0,
    activo: true,
    fechacreacion: "2024-01-14",
    hotel: "Hotel Plaza",
    restaurante: "Restaurante Principal",
    menu: "Menú Ejecutivo",
    platillo: "Ensalada César",
    ingrediente: "Lechuga Romana",
    receta: "Aderezo César",
  },
]

export default function HistoricoPage() {
  const [historico, setHistorico] = useState(historicoEjemplo)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHotel, setSelectedHotel] = useState("todos")
  const [selectedFecha, setSelectedFecha] = useState("todos")

  const filteredHistorico = historico.filter((item) => {
    const matchesSearch =
      item.platillo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ingrediente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hotel.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesHotel = selectedHotel === "todos" || item.hotelid.toString() === selectedHotel

    return matchesSearch && matchesHotel
  })

  const totalCosto = filteredHistorico.reduce((sum, item) => sum + item.costo, 0)
  const costoPromedio = filteredHistorico.length > 0 ? totalCosto / filteredHistorico.length : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Costos</h1>
          <p className="text-muted-foreground mt-2">Seguimiento histórico de costos por ingrediente y platillo</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredHistorico.length}</div>
            <p className="text-xs text-muted-foreground">movimientos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCosto)}</div>
            <p className="text-xs text-muted-foreground">acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costoPromedio)}</div>
            <p className="text-xs text-muted-foreground">por movimiento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tendencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-green-500">+5.2%</span>
            </div>
            <p className="text-xs text-muted-foreground">vs mes anterior</p>
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
                  placeholder="Platillo, ingrediente, hotel..."
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
                  <SelectItem value="1">Hotel Plaza</SelectItem>
                  <SelectItem value="2">Hotel Central</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedFecha} onValueChange={setSelectedFecha}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los períodos</SelectItem>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="mes">Este mes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedHotel("todos")
                  setSelectedFecha("todos")
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Históricos</CardTitle>
          <CardDescription>{filteredHistorico.length} movimiento(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistorico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron movimientos</p>
              <p className="text-sm">Ajusta los filtros para ver más resultados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Platillo</TableHead>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistorico.map((item) => (
                  <TableRow key={item.idrec}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.fechacreacion).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.hotel}</Badge>
                    </TableCell>
                    <TableCell>{item.restaurante}</TableCell>
                    <TableCell className="font-medium">{item.platillo}</TableCell>
                    <TableCell>{item.ingrediente}</TableCell>
                    <TableCell>{item.cantidad}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-600">
                        {formatCurrency(item.costo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.activo ? "default" : "secondary"}>
                        {item.activo ? "Activo" : "Inactivo"}
                      </Badge>
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
