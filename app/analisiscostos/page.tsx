"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartLegend } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts"
import {
  getMenusForAnalisis,
  getPlatillosForAnalisis,
  getPlatilloCostHistory,
  getPlatilloDetailsForTooltip,
  getPlatilloActualInfo,
  getPlatilloHistoricoInfo,
  type MenuItem,
  type PlatilloItem,
  type CostHistoryItem,
  type PlatilloTooltipDetail,
  type PlatilloActualInfo,
  type PlatilloHistoricoInfo,
} from "@/app/actions/analisis-costos-actions"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, SearchIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

// Tipo para los detalles específicos del punto seleccionado
interface SelectedPointDetails {
  fecha: string
  fechaOriginal: string
  costo: number
  precioventa: number
  margenutilidad: number
  costoporcentual: number
  platilloNombre: string
  restaurante: string
  menu: string
  menuId: number
}

export default function AnalisisCostosPage() {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [selectedMenu, setSelectedMenu] = useState<string>("-1")
  const [platillos, setPlatillos] = useState<PlatilloItem[]>([])
  const [selectedPlatillo, setSelectedPlatillo] = useState<string>("")
  const [searchTermPlatillo, setSearchTermPlatillo] = useState<string>("")
  const [fechaInicial, setFechaInicial] = useState<Date | undefined>(undefined)
  const [fechaFinal, setFechaFinal] = useState<Date | undefined>(undefined)
  const [chartData, setChartData] = useState<CostHistoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [platilloDetails, setPlatilloDetails] = useState<PlatilloTooltipDetail | null>(null)
  const [selectedPointDetails, setSelectedPointDetails] = useState<SelectedPointDetails | null>(null)
  const [platilloActual, setPlatilloActual] = useState<PlatilloActualInfo | null>(null)
  const [platilloHistorico, setPlatilloHistorico] = useState<PlatilloHistoricoInfo | null>(null)

  // Formatear datos para el gráfico - mantener fechacreacionOriginal intacta
  const formattedChartData = useMemo(() => {
    return chartData.map((item, index) => ({
      ...item,
      fechacreacion: format(new Date(item.fechacreacion), "dd/MM/yyyy"), // Solo formatear para mostrar en el eje X
      dataIndex: index, // Agregar índice para identificar el punto
      // fechacreacionOriginal se mantiene en formato YYYY-MM-DD
    }))
  }, [chartData])

  // Cargar menús al inicio
  useEffect(() => {
    const loadMenus = async () => {
      const fetchedMenus = await getMenusForAnalisis()
      setMenus(fetchedMenus)
      setLoading(false)
    }
    loadMenus()
  }, [])

  // Cargar platillos cuando cambia el menú seleccionado o el término de búsqueda
  useEffect(() => {
    const loadPlatillos = async () => {
      if (selectedMenu === "") return // Evitar cargar si no hay menú seleccionado (inicialmente)
      const menuIdNum = Number.parseInt(selectedMenu)
      const fetchedPlatillos = await getPlatillosForAnalisis(menuIdNum, searchTermPlatillo)
      setPlatillos(fetchedPlatillos)
    }
    loadPlatillos()
  }, [selectedMenu, searchTermPlatillo])

  // Función para manejar la búsqueda
  const handleSearch = useCallback(async () => {
    if (!selectedPlatillo || !fechaInicial || !fechaFinal) {
      alert("Por favor, selecciona un platillo y un rango de fechas.")
      return
    }

    const platilloIdNum = Number.parseInt(selectedPlatillo)
    const menuIdNum = Number.parseInt(selectedMenu)
    const history = await getPlatilloCostHistory(
      platilloIdNum,
      format(fechaInicial, "yyyy-MM-dd"),
      format(fechaFinal, "yyyy-MM-dd"),
    )
    setChartData(history)

    const details = await getPlatilloDetailsForTooltip(platilloIdNum, menuIdNum)
    setPlatilloDetails(details)

    // Limpiar la selección de punto específico al hacer nueva búsqueda
    setSelectedPointDetails(null)
    setPlatilloActual(null)
    setPlatilloHistorico(null)
  }, [selectedPlatillo, fechaInicial, fechaFinal, selectedMenu])

  // Función para manejar el clic en los puntos - NUEVA IMPLEMENTACIÓN
  const handlePointClick = useCallback(
    async (dataIndex: number) => {
      try {
        console.log("Point clicked with dataIndex:", dataIndex)
        console.log("FormattedChartData:", formattedChartData)
        console.log("Original chartData:", chartData)

        // Validaciones iniciales
        if (dataIndex < 0 || dataIndex >= formattedChartData.length) {
          console.error("Invalid dataIndex:", dataIndex)
          return
        }

        if (!selectedPlatillo || !platilloDetails) {
          console.error("Missing selectedPlatillo or platilloDetails")
          return
        }

        // Obtener los datos del punto usando el índice
        const pointData = formattedChartData[dataIndex]
        const originalData = chartData[dataIndex] // Datos originales sin formatear

        console.log("Point data:", pointData)
        console.log("Original data:", originalData)

        const platilloIdNum = Number.parseInt(selectedPlatillo)
        const menuIdNum = Number.parseInt(selectedMenu)

        // Usar la fecha original sin formatear
        const fechaOriginal = originalData.fechacreacionOriginal

        console.log("fechaOriginal from originalData:", fechaOriginal)

        // Validar que tengamos una fecha válida en formato YYYY-MM-DD
        if (!fechaOriginal || fechaOriginal === "undefined" || !/^\d{4}-\d{2}-\d{2}$/.test(fechaOriginal)) {
          console.error("Invalid fechaOriginal:", fechaOriginal)
          alert("Error: No se pudo obtener la fecha del punto seleccionado en formato válido.")
          return
        }

        // Crear los detalles específicos del punto seleccionado
        const pointDetails: SelectedPointDetails = {
          fecha: format(new Date(fechaOriginal), "dd/MM/yyyy"), // Fecha formateada para mostrar
          fechaOriginal: fechaOriginal, // Fecha original en formato YYYY-MM-DD para consultas
          costo: originalData.costo || 0,
          precioventa: originalData.precioventa || 0,
          margenutilidad: originalData.margenutilidad || 0,
          costoporcentual: originalData.costoporcentual || 0,
          platilloNombre: originalData.nombreplatillo || platilloDetails.Platillo,
          restaurante: platilloDetails.Restaurante,
          menu: originalData.nombremenu || platilloDetails.Menu,
          menuId: menuIdNum,
        }

        setSelectedPointDetails(pointDetails)

        // Obtener información actual y histórica del platillo
        console.log("Fetching info with fechaOriginal:", fechaOriginal)
        const [actualInfo, historicoInfo] = await Promise.all([
          getPlatilloActualInfo(platilloIdNum, menuIdNum),
          getPlatilloHistoricoInfo(platilloIdNum, fechaOriginal),
        ])

        setPlatilloActual(actualInfo)
        setPlatilloHistorico(historicoInfo)
      } catch (error) {
        console.error("Error in handlePointClick:", error)
        alert("Error al obtener la información del platillo.")
      }
    },
    [selectedPlatillo, platilloDetails, selectedMenu, formattedChartData, chartData],
  )

  const chartConfig = {
    costo: {
      label: "Costo",
    },
    precioventa: {
      label: "Precio Venta",
    },
    margenutilidad: {
      label: "Margen Utilidad",
    },
    costoporcentual: {
      label: "Costo %",
    },
  }

  // Función para calcular la diferencia y mostrar el indicador
  const renderComparison = (actual: number, historico: number, isPercentage = false) => {
    const diferencia = actual - historico
    const porcentajeCambio = historico !== 0 ? (diferencia / historico) * 100 : 0
    const suffix = isPercentage ? "%" : ""

    if (diferencia > 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">
            +{diferencia.toFixed(2)}
            {suffix} ({porcentajeCambio.toFixed(1)}%)
          </span>
        </div>
      )
    } else if (diferencia < 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">
            {diferencia.toFixed(2)}
            {suffix} ({porcentajeCambio.toFixed(1)}%)
          </span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-600">
          <Minus className="h-4 w-4" />
          <span className="text-sm font-medium">Sin cambio</span>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">Análisis de Costos</h1>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="frmAnalisisCostoBuscar" className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ddlMenu">Menú</Label>
              <Select
                value={selectedMenu}
                onValueChange={(value) => {
                  setSelectedMenu(value)
                  setSelectedPlatillo("") // Reset platillo cuando cambia el menú
                  setSearchTermPlatillo("")
                }}
              >
                <SelectTrigger id="ddlMenu" name="ddlMenu">
                  <SelectValue placeholder="Selecciona un menú" />
                </SelectTrigger>
                <SelectContent>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id.toString()}>
                      {menu.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="txtPlatilloCostoNombre">Platillo</Label>
              <Select value={selectedPlatillo} onValueChange={setSelectedPlatillo}>
                <SelectTrigger id="txtPlatilloCostoNombre" name="txtPlatilloCostoNombre">
                  <SelectValue placeholder="Selecciona un platillo" />
                </SelectTrigger>
                <SelectContent>
                  {platillos.map((platillo) => (
                    <SelectItem key={platillo.id} value={platillo.id.toString()}>
                      {platillo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="txtFechaInicialCosto">Fecha Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white text-gray-900",
                      !fechaInicial && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaInicial ? format(fechaInicial, "PPP") : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={fechaInicial} onSelect={setFechaInicial} initialFocus />
                </PopoverContent>
              </Popover>
              <Input
                id="txtFechaInicialCosto"
                name="txtFechaInicialCosto"
                type="hidden"
                value={fechaInicial ? format(fechaInicial, "yyyy-MM-dd") : ""}
                maxLength={80}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="txtFechaFinalCosto">Fecha Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white text-gray-900",
                      !fechaFinal && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaFinal ? format(fechaFinal, "PPP") : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={fechaFinal} onSelect={setFechaFinal} initialFocus />
                </PopoverContent>
              </Popover>
              <Input
                id="txtFechaFinalCosto"
                name="txtFechaFinalCosto"
                type="hidden"
                value={fechaFinal ? format(fechaFinal, "yyyy-MM-dd") : ""}
                maxLength={80}
              />
            </div>

            <Button
              id="btnAnalisisCostoBuscar"
              name="btnAnalisisCostoBuscar"
              type="button"
              onClick={handleSearch}
              style={{ backgroundColor: "#a7c1eb", color: "black", fontSize: "12px" }}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <SearchIcon className="h-4 w-4" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p>Cargando datos del gráfico...</p>
      ) : chartData.length > 0 ? (
        <div className="relative w-full">
          {/* Fondo con efecto glass-liquid */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/60 to-cyan-50/80 backdrop-blur-sm rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10 rounded-3xl"></div>

          {/* Efectos de burbujas decorativas */}
          <div className="absolute top-4 left-8 w-3 h-3 bg-blue-200/40 rounded-full blur-sm"></div>
          <div className="absolute top-12 right-12 w-2 h-2 bg-purple-200/50 rounded-full blur-sm"></div>
          <div className="absolute bottom-8 left-16 w-4 h-4 bg-cyan-200/30 rounded-full blur-sm"></div>
          <div className="absolute bottom-16 right-8 w-2.5 h-2.5 bg-indigo-200/40 rounded-full blur-sm"></div>

          <Card className="relative w-full border-0 bg-white/70 backdrop-blur-md shadow-2xl shadow-blue-500/10 rounded-3xl overflow-hidden">
            <CardHeader className="relative z-10 bg-gradient-to-r from-slate-50/80 to-blue-50/60 backdrop-blur-sm border-b border-white/20">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Variación de Costos y Precios de Venta
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-8">
              <div className="relative h-[400px] w-full">
                {/* Contenedor del gráfico con efecto glass */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-blue-50/40 to-purple-50/30 backdrop-blur-sm rounded-2xl border border-white/30 shadow-inner"></div>
                <div className="absolute inset-2 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20"></div>

                <div className="relative z-10 h-full w-full p-4">
                  <ResponsiveContainer width="100%" height="100%" key={JSON.stringify(formattedChartData)}>
                    <LineChart data={formattedChartData} accessibilityLayer width={700} height={300}>
                      <defs>
                        <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" strokeWidth={1} />
                      <XAxis
                        dataKey="fechacreacion"
                        minTickGap={20}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                      />
                      <YAxis
                        domain={[0, 60]}
                        tickMargin={8}
                        label={{
                          value: "Costo %",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#64748b", fontSize: "14px", fontWeight: "500" },
                        }}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.4)" }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => {
                          const data = props.payload
                          return [
                            <div key="tooltip-content" className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Platillo:</span>
                                <span className="font-semibold text-slate-800">{data.nombreplatillo || "N/A"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Menú:</span>
                                <span className="font-semibold text-slate-800">{data.nombremenu || "N/A"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Fecha Original:</span>
                                <span className="font-semibold text-slate-800">
                                  {data.fechacreacionOriginal || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Costo:</span>
                                <span className="font-semibold text-green-600">
                                  ${data.costo ? data.costo.toFixed(2) : "0.00"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Precio Venta:</span>
                                <span className="font-semibold text-blue-600">
                                  ${data.precioventa ? data.precioventa.toFixed(2) : "0.00"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Margen Utilidad:</span>
                                <span className="font-semibold text-purple-600">
                                  ${data.margenutilidad ? data.margenutilidad.toFixed(2) : "0.00"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Costo %:</span>
                                <span className="font-semibold text-orange-600">{value.toFixed(2)}%</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                                Haz clic para ver comparación detallada
                              </div>
                            </div>,
                            "",
                          ]
                        }}
                        labelFormatter={(label) => `Fecha: ${label}`}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                          borderRadius: "12px",
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                          fontSize: "13px",
                          padding: "12px",
                        }}
                        labelStyle={{ color: "#374151", fontWeight: "600", marginBottom: "8px" }}
                      />
                      <Line
                        dataKey="costoporcentual"
                        type="monotone"
                        stroke="#8884d8"
                        strokeWidth={3}
                        dot={{
                          fill: "#8884d8",
                          strokeWidth: 2,
                          r: 6,
                          filter: "drop-shadow(0 2px 4px rgba(136, 132, 216, 0.3))",
                          cursor: "pointer",
                        }}
                        activeDot={{
                          r: 8,
                          fill: "#8884d8",
                          stroke: "#ffffff",
                          strokeWidth: 3,
                          filter: "drop-shadow(0 4px 8px rgba(136, 132, 216, 0.4))",
                          cursor: "pointer",
                          onClick: (data: any, index: number) => {
                            console.log("ActiveDot clicked:", { data, index })
                            handlePointClick(index)
                          },
                        }}
                        name="Costo %"
                      />
                      <ChartLegend content={<ChartLegend />} />
                      <ReferenceLine
                        y={30}
                        stroke="#ef4444"
                        strokeDasharray="8 4"
                        strokeWidth={2}
                        label={{
                          value: "Objetivo (30%)",
                          position: "topRight",
                          style: {
                            fill: "#ef4444",
                            fontSize: "12px",
                            fontWeight: "600",
                            filter: "drop-shadow(0 1px 2px rgba(239, 68, 68, 0.3))",
                          },
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lista de puntos clickeables debajo del gráfico */}
              <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                <h4 className="text-lg font-semibold mb-3 text-slate-700">
                  Puntos del Gráfico (Haz clic para comparar):
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {formattedChartData.map((point, index) => (
                    <button
                      key={index}
                      onClick={() => handlePointClick(index)}
                      className="p-3 bg-white/70 hover:bg-blue-50/80 rounded-lg border border-blue-200/30 transition-all duration-200 text-left"
                    >
                      <div className="text-sm font-medium text-slate-700">{point.fechacreacion}</div>
                      <div className="text-xs text-slate-500">Costo: {point.costoporcentual.toFixed(1)}%</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mostrar tarjetas comparativas cuando se selecciona un punto */}
              {selectedPointDetails && platilloActual && platilloHistorico ? (
                <div className="mt-8 space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent mb-2">
                      Comparación de Costos: {selectedPointDetails.platilloNombre}
                    </h3>
                    <p className="text-slate-600">
                      Comparando datos actuales vs. fecha seleccionada ({selectedPointDetails.fecha})
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Tarjeta de Información Actual */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/60 to-indigo-50/80 backdrop-blur-sm rounded-2xl border border-blue-200/30"></div>
                      <Card className="relative border-0 bg-transparent shadow-lg">
                        <CardHeader className="text-center pb-4">
                          <CardTitle className="text-xl font-bold text-blue-700 flex items-center justify-center gap-2">
                            📊 Información Actual
                          </CardTitle>
                          <p className="text-sm text-slate-600">Datos más recientes del platillo</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {platilloActual.imgurl && (
                            <div className="flex justify-center mb-4">
                              <img
                                src={platilloActual.imgurl || "/placeholder.svg"}
                                alt={platilloActual.nombre}
                                className="w-24 h-24 object-cover rounded-full border-4 border-blue-200/50"
                              />
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200/20">
                              <p className="text-sm text-slate-600 font-medium">Platillo</p>
                              <p className="text-lg font-bold text-slate-800">{platilloActual.nombre}</p>
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200/20">
                              <p className="text-sm text-slate-600 font-medium">Menú</p>
                              <p className="text-lg font-semibold text-slate-800">{platilloActual.menu}</p>
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200/20">
                              <p className="text-sm text-slate-600 font-medium">Costo Total</p>
                              <p className="text-2xl font-bold text-green-600">
                                ${platilloActual.costototal.toFixed(2)}
                              </p>
                              {renderComparison(platilloActual.costototal, platilloHistorico.costototal)}
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200/20">
                              <p className="text-sm text-slate-600 font-medium">Precio de Venta</p>
                              <p className="text-2xl font-bold text-blue-600">
                                ${platilloActual.precioventa.toFixed(2)}
                              </p>
                              {renderComparison(platilloActual.precioventa, platilloHistorico.precioventa)}
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200/20">
                              <p className="text-sm text-slate-600 font-medium">Margen de Utilidad</p>
                              <p className="text-2xl font-bold text-purple-600">
                                ${platilloActual.margenutilidad.toFixed(2)}
                              </p>
                              {renderComparison(platilloActual.margenutilidad, platilloHistorico.margenutilidad)}
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200/20">
                              <p className="text-sm text-slate-600 font-medium">Fecha de Creación</p>
                              <p className="text-lg font-semibold text-slate-800">
                                {format(new Date(platilloActual.fechacreacion), "dd/MM/yyyy")}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Tarjeta de Información Histórica */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-white/60 to-orange-50/80 backdrop-blur-sm rounded-2xl border border-amber-200/30"></div>
                      <Card className="relative border-0 bg-transparent shadow-lg">
                        <CardHeader className="text-center pb-4">
                          <CardTitle className="text-xl font-bold text-amber-700 flex items-center justify-center gap-2">
                            📅 Información Histórica
                          </CardTitle>
                          <p className="text-sm text-slate-600">Datos del {selectedPointDetails.fecha}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-center mb-4">
                            <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-center justify-center border-4 border-amber-200/50">
                              <span className="text-2xl">📊</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-amber-200/20">
                              <p className="text-sm text-slate-600 font-medium">Platillo</p>
                              <p className="text-lg font-semibold text-slate-800">{platilloHistorico.platillo}</p>
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-amber-200/20">
                              <p className="text-sm text-slate-600 font-medium">Fecha</p>
                              <p className="text-lg font-semibold text-slate-800">{selectedPointDetails.fecha}</p>
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-amber-200/20">
                              <p className="text-sm text-slate-600 font-medium">Costo Total</p>
                              <p className="text-2xl font-bold text-green-600">
                                ${platilloHistorico.costototal.toFixed(2)}
                              </p>
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-amber-200/20">
                              <p className="text-sm text-slate-600 font-medium">Precio de Venta</p>
                              <p className="text-2xl font-bold text-blue-600">
                                ${platilloHistorico.precioventa.toFixed(2)}
                              </p>
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-amber-200/20">
                              <p className="text-sm text-slate-600 font-medium">Margen de Utilidad</p>
                              <p className="text-2xl font-bold text-purple-600">
                                ${platilloHistorico.margenutilidad.toFixed(2)}
                              </p>
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-amber-200/20">
                              <p className="text-sm text-slate-600 font-medium">Costo Porcentual</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {platilloHistorico.costoporcentual.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => {
                        setSelectedPointDetails(null)
                        setPlatilloActual(null)
                        setPlatilloHistorico(null)
                      }}
                      variant="outline"
                      size="sm"
                      className="text-slate-600 hover:text-slate-800"
                    >
                      Cerrar comparación
                    </Button>
                  </div>
                </div>
              ) : (
                platilloDetails && (
                  <div className="mt-6 relative">
                    {/* Fondo glass para los detalles generales */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/60 via-white/40 to-purple-50/60 backdrop-blur-sm rounded-2xl border border-white/30"></div>
                    <div className="relative z-10 p-6 rounded-2xl">
                      <h3 className="font-bold text-xl mb-4 bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent">
                        Detalles Generales del Platillo: {platilloDetails.Platillo}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className="text-sm text-slate-600 font-medium">Restaurante</p>
                          <p className="text-lg font-semibold text-slate-800">{platilloDetails.Restaurante}</p>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className="text-sm text-slate-600 font-medium">Menú</p>
                          <p className="text-lg font-semibold text-slate-800">{platilloDetails.Menu}</p>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className="text-sm text-slate-600 font-medium">Costo de Elaboración</p>
                          <p className="text-lg font-semibold text-green-600">
                            ${platilloDetails.CostoElaboracion?.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className="text-sm text-slate-600 font-medium">Precio de Venta</p>
                          <p className="text-lg font-semibold text-blue-600">
                            ${platilloDetails.PrecioVenta?.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className="text-sm text-slate-600 font-medium">Margen de Utilidad</p>
                          <p className="text-lg font-semibold text-purple-600">
                            ${platilloDetails.MargenUtilidad?.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className="text-sm text-slate-600 font-medium">Costo %</p>
                          <p className="text-lg font-semibold text-orange-600">
                            {platilloDetails.CostoPorcentual?.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-slate-500">
                          Haz clic en cualquier punto del gráfico o en los botones de abajo para ver la comparación
                          detallada
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 via-slate-50/60 to-gray-100/80 backdrop-blur-sm rounded-3xl"></div>
          <Card className="relative border-0 bg-white/70 backdrop-blur-md shadow-xl rounded-3xl">
            <CardContent className="p-12 text-center">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <p className="text-lg text-slate-600 font-medium">
                  No hay datos disponibles para el platillo y rango de fechas seleccionados.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
