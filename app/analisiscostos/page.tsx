"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, TrendingUp, TrendingDown, Calendar, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import {
  obtenerCambiosCostosPlatillos,
  obtenerIngredientesAumentoPrecio,
  obtenerVariacionCostosPrecios,
} from "@/app/actions/analisis-costos-actions"
import type { CambioCostoPlatillo, IngredienteAumentoPrecio, VariacionCostoPrecio } from "@/lib/types-sistema-costeo"

export default function AnalisisCostosPage() {
  const { toast } = useToast()

  // Estados para datos
  const [cambiosCostos, setCambiosCostos] = useState<CambioCostoPlatillo[]>([])
  const [ingredientesAumento, setIngredientesAumento] = useState<IngredienteAumentoPrecio[]>([])
  const [variacionCostos, setVariacionCostos] = useState<VariacionCostoPrecio[]>([])

  // Estados para filtros
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [hotelId, setHotelId] = useState<string>("")
  const [restauranteId, setRestauranteId] = useState<string>("")

  // Estados de carga
  const [loading, setLoading] = useState(true)
  const [loadingVariacion, setLoadingVariacion] = useState(false)

  // Estados para zoom y pan
  const [zoomLevel, setZoomLevel] = useState(100)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const chartRef = useRef<HTMLDivElement>(null)

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [cambiosRes, ingredientesRes] = await Promise.all([
        obtenerCambiosCostosPlatillos(),
        obtenerIngredientesAumentoPrecio(),
      ])

      if (cambiosRes.data) {
        setCambiosCostos(cambiosRes.data)
      } else {
        toast({
          title: "Error",
          description: cambiosRes.error || "Error al cargar cambios de costos",
          variant: "destructive",
        })
      }

      if (ingredientesRes.data) {
        setIngredientesAumento(ingredientesRes.data)
      } else {
        toast({
          title: "Error",
          description: ingredientesRes.error || "Error al cargar ingredientes con aumento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar datos de análisis",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Cargar variación de costos con filtros
  const cargarVariacionCostos = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return

    setLoadingVariacion(true)
    try {
      const variacionRes = await obtenerVariacionCostosPrecios({
        fechaInicio,
        fechaFin,
        hotelId: hotelId ? Number.parseInt(hotelId) : undefined,
        restauranteId: restauranteId ? Number.parseInt(restauranteId) : undefined,
      })

      if (variacionRes.data) {
        setVariacionCostos(variacionRes.data)
      } else {
        toast({
          title: "Error",
          description: variacionRes.error || "Error al cargar variación de costos",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar variación de costos",
        variant: "destructive",
      })
    } finally {
      setLoadingVariacion(false)
    }
  }, [fechaInicio, fechaFin, hotelId, restauranteId, toast])

  // Funciones de zoom y pan
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 300))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50))
  }

  const handleResetZoom = () => {
    setZoomLevel(100)
    setPanX(0)
    setPanY(0)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPanX(e.clientX - dragStart.x)
    setPanY(e.clientY - dragStart.y)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      cargarVariacionCostos()
    }
  }, [cargarVariacionCostos])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando análisis de costos...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Análisis de Costos</h1>
      </div>

      {/* Filtros para variación de costos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="fechaInicio">Fecha Inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fechaFin">Fecha Fin</Label>
              <Input id="fechaFin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hotel">Hotel (Opcional)</Label>
              <Select value={hotelId} onValueChange={setHotelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hotel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los hoteles</SelectItem>
                  {/* Aquí se cargarían los hoteles dinámicamente */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="restaurante">Restaurante (Opcional)</Label>
              <Select value={restauranteId} onValueChange={setRestauranteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar restaurante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los restaurantes</SelectItem>
                  {/* Aquí se cargarían los restaurantes dinámicamente */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Variación de Costos y Precios */}
      {variacionCostos.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Variación de Costos y Precios de Venta
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Zoom: {zoomLevel}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetZoom}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={chartRef}
              className="w-full h-96 overflow-hidden"
              style={{
                cursor: isDragging ? "grabbing" : "grab",
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) translate(${panX}px, ${panY}px)`,
                  transformOrigin: "0 0",
                  width: "100%",
                  height: "100%",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={variacionCostos} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis domain={[0, 60]} ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="costototal" stroke="#8884d8" strokeWidth={2} name="Costo Total" />
                    <Line type="monotone" dataKey="precioventa" stroke="#82ca9d" strokeWidth={2} name="Precio Venta" />
                    <ReferenceLine y={30} stroke="red" strokeDasharray="5 5" label="Límite Costo %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingVariacion && (
        <Card>
          <CardContent className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando variación de costos...</span>
          </CardContent>
        </Card>
      )}

      {/* Cambios Recientes en Costos de Platillos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cambios Recientes en Costos de Platillos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cambiosCostos.length === 0 ? (
            <p className="text-gray-500">No hay cambios recientes en costos de platillos.</p>
          ) : (
            <div className="space-y-4">
              {cambiosCostos.map((cambio, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{cambio.platillo}</h3>
                    <p className="text-sm text-gray-600">{cambio.menu}</p>
                    <p className="text-xs text-gray-500">{cambio.fecha}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        ${cambio.costo_anterior?.toFixed(2)} → ${cambio.costo_actual?.toFixed(2)}
                      </span>
                      {(cambio.costo_actual || 0) > (cambio.costo_anterior || 0) ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Cambio: {cambio.porcentaje_cambio ? `${cambio.porcentaje_cambio.toFixed(1)}%` : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ingredientes con Mayor Aumento de Precio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ingredientes con Mayor Aumento de Precio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ingredientesAumento.length === 0 ? (
            <p className="text-gray-500">No hay ingredientes con aumentos de precio recientes.</p>
          ) : (
            <div className="space-y-4">
              {ingredientesAumento.map((ingrediente, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{ingrediente.ingrediente}</h3>
                    <p className="text-sm text-gray-600">{ingrediente.categoria}</p>
                    <p className="text-xs text-gray-500">{ingrediente.fecha_cambio}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        ${ingrediente.precio_anterior?.toFixed(2)} → ${ingrediente.precio_actual?.toFixed(2)}
                      </span>
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Aumento:{" "}
                      {ingrediente.porcentaje_aumento ? `${ingrediente.porcentaje_aumento.toFixed(1)}%` : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
