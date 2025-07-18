"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartLegend } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import {
  getMenusForAnalisis,
  getPlatillosForAnalisis,
  getPlatilloCostHistory,
  getPlatilloDetailsForTooltip,
  type MenuItem,
  type PlatilloItem,
  type CostHistoryItem,
  type PlatilloTooltipDetail,
} from "@/app/actions/analisis-costos-actions"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, SearchIcon } from "lucide-react" // Se eliminó la importación duplicada de SearchIcon
import { cn } from "@/lib/utils"

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

  console.log("handleSearch triggered with:", {
    selectedPlatillo,
    fechaInicial: fechaInicial ? format(fechaInicial, "yyyy-MM-dd") : undefined,
    fechaFinal: fechaFinal ? format(fechaFinal, "yyyy-MM-dd") : undefined,
  })

  // Función para manejar la búsqueda
  const handleSearch = useCallback(async () => {
    if (!selectedPlatillo || !fechaInicial || !fechaFinal) {
      alert("Por favor, selecciona un platillo y un rango de fechas.")
      return
    }

    const platilloIdNum = Number.parseInt(selectedPlatillo)
    const history = await getPlatilloCostHistory(
      platilloIdNum,
      format(fechaInicial, "yyyy-MM-dd"),
      format(fechaFinal, "yyyy-MM-dd"),
    )
    setChartData(history)

    const details = await getPlatilloDetailsForTooltip(platilloIdNum)
    setPlatilloDetails(details)
  }, [selectedPlatillo, fechaInicial, fechaFinal])

  // Formatear datos para el gráfico
  const formattedChartData = useMemo(() => {
    return chartData.map((item) => ({
      ...item,
      fechacreacion: format(new Date(item.fechacreacion), "dd/MM/yyyy"), // Formatear fecha para el eje X
    }))
  }, [chartData])

  const chartConfig = {
    costo: {
      label: "Costo",
    },
    precioventa: {
      label: "Precio Venta",
    },
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
              {/* Input para búsqueda en tiempo real, si se desea implementar */}
              {/* <Input
                type="text"
                placeholder="Buscar platillo..."
                value={searchTermPlatillo}
                onChange={(e) => setSearchTermPlatillo(e.target.value)}
                className="mt-1"
              /> */}
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
        <Card className="w-full">
          {console.log("Datos consulta:", chartData)}
          <CardHeader>
            <CardTitle>Variación de Costos y Precios de Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full border border-gray-200 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%" key={JSON.stringify(formattedChartData)}>
                <LineChart data={formattedChartData} accessibilityLayer width={700} height={300}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fechacreacion" minTickGap={20} />
                  <YAxis
                    domain={[0, 700]} // Rango fijo de $0.00 a $700
                    tickMargin={8}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Costo p"]} />
                  <Line dataKey="costo" type="monotone" stroke="#56a8b3" strokeWidth={2} dot={true} name="Costo" />
                  <Line
                    dataKey="precioventa"
                    type="monotone"
                    stroke="#46914c"
                    strokeWidth={2}
                    dot={true}
                    name="Precio Venta"
                  />
                  <ChartLegend content={<ChartLegend />} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {platilloDetails && (
              <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-lg mb-2">Detalles del Platillo: {platilloDetails.Platillo}</h3>
                <p>
                  <strong>Restaurante:</strong> {platilloDetails.Restaurante}
                </p>
                <p>
                  <strong>Menú:</strong> {platilloDetails.Menu}
                </p>
                <p>
                  <strong>Costo de Elaboración:</strong> ${platilloDetails.CostoElaboracion?.toFixed(2)}
                </p>
                <p>
                  <strong>Precio de Venta:</strong> ${platilloDetails.PrecioVenta?.toFixed(2)}
                </p>
                <p>
                  <strong>Margen de Utilidad:</strong> {platilloDetails.MargenUtilidad?.toFixed(2)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-gray-500">
          No hay datos disponibles para el platillo y rango de fechas seleccionados.
        </p>
      )}
    </div>
  )
}
