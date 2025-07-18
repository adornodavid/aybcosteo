"use client"

import { useState, useEffect, useMemo } from "react"
import {
  getMenusForDropdown,
  getPlatillosForDropdown,
  getPlatilloCostHistory,
  getPlatillosWithMargins,
  getPlatilloComparisonData, // Importar la nueva acción
  type PlatilloMargin,
  type PlatilloComparisonData, // Importar la nueva interfaz
} from "@/app/actions/margenes-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandList, CommandGroup, CommandInput, CommandItem, CommandEmpty } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon, SearchIcon, CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "@/components/ui/loader2"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getTopMarginPlatillos,
  getBottomMarginPlatillos,
  getPlatilloDetailsForTooltip,
  type MarginPlatilloSummary,
  type PlatilloDetail,
} from "@/app/actions/margenes-actions"

interface MenuOption {
  id: number
  nombre: string
}

interface PlatilloOption {
  id: number
  nombre: string
}

interface CostHistoryItem {
  fechacreacion: string
  costo: number
}

export default function MargenesUtilidadPage() {
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([])
  const [selectedMenuId, setSelectedMenuId] = useState<string>("-1")
  const [platilloSearchTerm, setPlatilloSearchTerm] = useState<string>("")
  const [platilloOptions, setPlatilloOptions] = useState<PlatilloOption[]>([])
  const [selectedPlatilloId, setSelectedPlatilloId] = useState<number | null>(null)
  const [selectedPlatilloName, setSelectedPlatilloName] = useState<string>("")
  const [fechaInicial, setFechaInicial] = useState<Date | undefined>(undefined)
  const [fechaFinal, setFechaFinal] = useState<Date | undefined>(undefined)
  const [costHistoryData, setCostHistoryData] = useState<CostHistoryItem[]>([])
  const [platillosWithMargins, setPlatillosWithMargins] = useState<PlatilloMargin[]>([])
  // Nuevo estado para los datos del gráfico de barras
  const [platilloComparisonData, setPlatilloComparisonData] = useState<PlatilloComparisonData | null>(null)

  const [isLoadingMenus, setIsLoadingMenus] = useState(true)
  const [isLoadingPlatillosDropdown, setIsLoadingPlatillosDropdown] = useState(false)
  const [isLoadingChartData, setIsLoadingChartData] = useState(false)
  const [isLoadingMargins, setIsLoadingMargins] = useState(false)
  // Nuevo estado de carga para el gráfico de barras
  const [isLoadingComparisonChart, setIsLoadingComparisonChart] = useState(false)
  const [isPlatilloPopoverOpen, setIsPlatilloPopoverOpen] = useState(false)

  const [topMargins, setTopMargins] = useState<MarginPlatilloSummary[]>([])
  const [bottomMargins, setBottomMargins] = useState<MarginPlatilloSummary[]>([])
  const [isLoadingTopMargins, setIsLoadingTopMargins] = useState(true)
  const [isLoadingBottomMargins, setIsLoadingBottomMargins] = useState(true)
  const [tooltipContent, setTooltipContent] = useState<PlatilloDetail | null>(null)
  const [isTooltipLoading, setIsTooltipLoading] = useState(false)
  const [activeTooltipPlatilloId, setActiveTooltipPlatilloId] = useState<number | null>(null)
  const [activeTooltipMenuId, setActiveTooltipMenuId] = useState<number | null>(null)

  useEffect(() => {
    async function loadMenus() {
      setIsLoadingMenus(true)
      const menus = await getMenusForDropdown()
      setMenuOptions(menus)
      if (menus.length > 0) {
        setSelectedMenuId(menus[0].id.toString())
      }
      setIsLoadingMenus(false)
    }
    loadMenus()
  }, [])

  useEffect(() => {
    async function loadMargins() {
      setIsLoadingTopMargins(true)
      setIsLoadingBottomMargins(true)
      const top = await getTopMarginPlatillos()
      const bottom = await getBottomMarginPlatillos()
      setTopMargins(top)
      setBottomMargins(bottom)
      setIsLoadingTopMargins(false)
      setIsLoadingBottomMargins(false)
    }
    loadMargins()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (platilloSearchTerm.length > 0 || selectedMenuId !== "-1") {
        setIsLoadingPlatillosDropdown(true)
        const platillos = await getPlatillosForDropdown(Number.parseInt(selectedMenuId), platilloSearchTerm)
        setPlatilloOptions(platillos)
        setIsLoadingPlatillosDropdown(false)
      } else {
        setPlatilloOptions([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [platilloSearchTerm, selectedMenuId])

  const handleSearch = async () => {
    setIsLoadingChartData(true)
    setIsLoadingMargins(true)
    setIsLoadingComparisonChart(true) // Activar carga para el nuevo gráfico

    console.log("handleSearch triggered with:", {
      selectedPlatilloId,
      fechaInicial: fechaInicial ? format(fechaInicial, "yyyy-MM-dd") : undefined,
      fechaFinal: fechaFinal ? format(fechaFinal, "yyyy-MM-dd") : undefined,
    })

    if (selectedPlatilloId && fechaInicial && fechaFinal) {
      const history = await getPlatilloCostHistory(
        selectedPlatilloId,
        format(fechaInicial, "yyyy-MM-dd"),
        format(fechaFinal, "yyyy-MM-dd"),
      )
      console.log("Received cost history from action:", history)
      setCostHistoryData(history)
    } else {
      console.log("Missing platillo ID or date range for chart data. Chart will be empty.")
      setCostHistoryData([])
    }

    // Obtener datos para el nuevo gráfico de barras
    if (selectedPlatilloId) {
      const comparisonData = await getPlatilloComparisonData(selectedPlatilloId)
      setPlatilloComparisonData(comparisonData)
      console.log("Received platillo comparison data:", comparisonData) // Log para depuración
    } else {
      setPlatilloComparisonData(null)
    }

    const margins = await getPlatillosWithMargins()
    console.log("Received margins data:", margins)
    setPlatillosWithMargins(margins)

    setIsLoadingChartData(false)
    setIsLoadingMargins(false)
    setIsLoadingComparisonChart(false) // Desactivar carga para el nuevo gráfico
  }

  const handleTooltipHover = async (platilloId: number, MenuId: number) => {
    if (activeTooltipPlatilloId === platilloId && activeTooltipMenuId === MenuId && tooltipContent) {
      return // Already loaded for this platillo and menu combination
    }
    setActiveTooltipPlatilloId(platilloId)
    setActiveTooltipMenuId(MenuId)
    setIsTooltipLoading(true)
    const details = await getPlatilloDetailsForTooltip(platilloId, MenuId)
    setTooltipContent(details)
    setIsTooltipLoading(false)
  }

  const formattedCostHistoryData = useMemo(() => {
    return costHistoryData.map((item) => ({
      ...item,
      fechacreacion: format(new Date(item.fechacreacion), "dd/MM/yyyy"),
    }))
  }, [costHistoryData])

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Estadísticas Costos</h1>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="frmEstadisticaBuscar" className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="ddlMenu">Menú</Label>
              <Select value={selectedMenuId} onValueChange={setSelectedMenuId} disabled={isLoadingMenus}>
                <SelectTrigger id="ddlMenu" name="ddlMenu" className="w-full">
                  <SelectValue placeholder="Selecciona un menú" />
                </SelectTrigger>
                <SelectContent>
                  {menuOptions.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id.toString()}>
                      {menu.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="txtPlatilloNombre">Platillo</Label>
              <Popover open={isPlatilloPopoverOpen} onOpenChange={setIsPlatilloPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPlatilloPopoverOpen}
                    className="w-full justify-between bg-white text-gray-900"
                  >
                    {selectedPlatilloName || "Selecciona un platillo..."}
                    <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                  <Command>
                    <CommandInput
                      placeholder="Buscar platillo..."
                      value={platilloSearchTerm}
                      onValueChange={(value) => {
                        setPlatilloSearchTerm(value)
                        setSelectedPlatilloName(value)
                        setSelectedPlatilloId(null)
                      }}
                    />
                    <CommandList>
                      {isLoadingPlatillosDropdown ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No se encontraron platillos.</CommandEmpty>
                          <CommandGroup>
                            {platilloOptions.map((platillo) => (
                              <CommandItem
                                key={platillo.id}
                                value={platillo.nombre}
                                onSelect={() => {
                                  setSelectedPlatilloId(platillo.id)
                                  setSelectedPlatilloName(platillo.nombre)
                                  setPlatilloSearchTerm(platillo.nombre)
                                  setIsPlatilloPopoverOpen(false)
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedPlatilloId === platillo.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {platillo.nombre}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="txtFechaInicial">Fecha Inicial</Label>
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
                id="txtFechaInicial"
                name="txtFechaInicial"
                type="hidden"
                value={fechaInicial ? format(fechaInicial, "yyyy-MM-dd") : ""}
                maxLength={80}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="txtFechaFinal">Fecha Final</Label>
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
                id="txtFechaFinal"
                name="txtFechaFinal"
                type="hidden"
                value={fechaFinal ? format(fechaFinal, "yyyy-MM-dd") : ""}
                maxLength={80}
              />
            </div>

            <Button
              id="btnEstadisticaBuscar"
              name="btnEstadisticaBuscar"
              type="button"
              onClick={handleSearch}
              className="w-full h-10 mt-auto flex items-center justify-center text-black"
              style={{ backgroundColor: "#82ffea", fontSize: "12px" }}
              disabled={isLoadingChartData || isLoadingMargins || isLoadingComparisonChart}
            >
              {isLoadingChartData || isLoadingMargins || isLoadingComparisonChart ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Top Margen Utilidad */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-700">Top 10 Márgenes de Utilidad</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTopMargins ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : topMargins.length > 0 ? (
              <Table id="tblMargenesAltos">
                <TableHeader>
                  <TableRow>
                    <TableHead>Platillo</TableHead>
                    <TableHead>Menú</TableHead>
                    <TableHead>Margen Utilidad (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMargins.map((platillo) => (
                    <TableRow key={platillo.id}>
                      <TableCell className="font-medium">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span
                                onMouseEnter={() => handleTooltipHover(platillo.id, platillo.MenuId)}
                                className="cursor-help underline decoration-dotted"
                              >
                                {platillo.Platillo}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isTooltipLoading &&
                              activeTooltipPlatilloId === platillo.id &&
                              activeTooltipMenuId === platillo.MenuId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : tooltipContent &&
                                activeTooltipPlatilloId === platillo.id &&
                                activeTooltipMenuId === platillo.MenuId ? (
                                <div className="flex flex-col text-sm">
                                  <p>
                                    <strong>Restaurante:</strong> {tooltipContent.Restaurante}
                                  </p>
                                  <p>
                                    <strong>Menú:</strong> {tooltipContent.Menu}
                                  </p>
                                  <p>
                                    <strong>Platillo:</strong> {tooltipContent.Platillo}
                                  </p>
                                  <p>
                                    <strong>Costo Elaboración:</strong> ${tooltipContent.CostoElaboracion.toFixed(2)}
                                  </p>
                                  <p>
                                    <strong>Precio Venta:</strong> ${tooltipContent.precioventa.toFixed(2)}
                                  </p>
                                  <p>
                                    <strong>Margen Utilidad:</strong> {tooltipContent.margenutilidad.toFixed(2)}%
                                  </p>
                                </div>
                              ) : (
                                "Cargando detalles..."
                              )}
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>{platillo.Menu}</TableCell>
                      <TableCell>{platillo.margenutilidad.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500">No hay datos de márgenes altos disponibles.</p>
            )}
          </CardContent>
        </Card>

        {/* Bottom Margen Utilidad */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-700">Top 10 Márgenes de Utilidad Bajos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBottomMargins ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : bottomMargins.length > 0 ? (
              <Table id="tblMargenesBajos">
                <TableHeader>
                  <TableRow>
                    <TableHead>Platillo</TableHead>
                    <TableHead>Menú</TableHead>
                    <TableHead>Margen Utilidad (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bottomMargins.map((platillo) => (
                    <TableRow key={platillo.id}>
                      <TableCell className="font-medium">
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span
                                onMouseEnter={() => handleTooltipHover(platillo.id, platillo.MenuId)}
                                className="cursor-help underline decoration-dotted"
                              >
                                {platillo.Platillo}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isTooltipLoading &&
                              activeTooltipPlatilloId === platillo.id &&
                              activeTooltipMenuId === platillo.MenuId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : tooltipContent &&
                                activeTooltipPlatilloId === platillo.id &&
                                activeTooltipMenuId === platillo.MenuId ? (
                                <div className="flex flex-col text-sm">
                                  <p>
                                    <strong>Restaurante:</strong> {tooltipContent.Restaurante}
                                  </p>
                                  <p>
                                    <strong>Menú:</strong> {tooltipContent.Menu}
                                  </p>
                                  <p>
                                    <strong>Platillo:</strong> {tooltipContent.Platillo}
                                  </p>
                                  <p>
                                    <strong>Costo Elaboración:</strong> ${tooltipContent.CostoElaboracion.toFixed(2)}
                                  </p>
                                  <p>
                                    <strong>Precio Venta:</strong> ${tooltipContent.precioventa.toFixed(2)}
                                  </p>
                                  <p>
                                    <strong>Margen Utilidad:</strong> {tooltipContent.margenutilidad.toFixed(2)}%
                                  </p>
                                </div>
                              ) : (
                                "Cargando detalles..."
                              )}
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>{platillo.Menu}</TableCell>
                      <TableCell>{platillo.margenutilidad.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500">No hay datos de márgenes bajos disponibles.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Gráfico de Costos por Platillo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingChartData ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : formattedCostHistoryData.length > 0 ? (
            <div className="h-[400px] w-full border border-gray-200 rounded-lg p-2">
              {console.log("Data for Line Chart:", formattedCostHistoryData)}
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
                key={JSON.stringify(formattedCostHistoryData)}
              >
                <LineChart
                  data={formattedCostHistoryData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  width={700}
                  height={300}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fechacreacion" minTickGap={20} />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} padding={{ top: 10, bottom: 10 }} />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Costo"]} />
                  <Line type="monotone" dataKey="costo" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              
            </div>
          ) : (
            <p className="text-center text-gray-500">
              {selectedPlatilloId && fechaInicial && fechaFinal
                ? "No hay datos de costos para el platillo y rango de fechas seleccionados."
                : "Selecciona un platillo y un rango de fechas para ver el historial de costos."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Nueva Card para el Gráfico de Barras Comparativo */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Comparativa de Valores del Platillo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingComparisonChart ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : platilloComparisonData ? (
            <div className="h-[400px] w-full border border-gray-200 rounded-lg p-2">
              {console.log("Data for Bar Chart:", platilloComparisonData)}
              <ResponsiveContainer
                width="700%"
                height="300%"
                minWidth={0}
                minHeight={0}
                key={JSON.stringify(platilloComparisonData)}
              >
                <BarChart
                  data={[platilloComparisonData]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  width={700}
                  height={300}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platilloNombre" minTickGap={20} />
                  <YAxis
                    domain={[0, 1000]}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                    ticks={[
                      0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950,
                      1000,
                    ]}
                  />
                  <Tooltip formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]} />
                  <Legend />
                  <Bar dataKey="costoTotal" fill="#8884d8" name="Costo Total" />
                  <Bar dataKey="precioVenta" fill="#82ca9d" name="Precio Venta" />
                  <Bar dataKey="margenUtilidad" fill="#ffc658" name="Margen Utilidad" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500">
              {selectedPlatilloId
                ? "No hay datos de comparación para el platillo seleccionado."
                : "Selecciona un platillo para ver su comparativa de valores."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Márgenes de Utilidad de Platillos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMargins ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : platillosWithMargins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platillo</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead>Margen Utilidad (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platillosWithMargins.map((platillo) => (
                  <TableRow key={platillo.id}>
                    <TableCell className="font-medium">{platillo.nombre}</TableCell>
                    <TableCell>${platillo.costo.toFixed(2)}</TableCell>
                    <TableCell>${platillo.precio_venta.toFixed(2)}</TableCell>
                    <TableCell>{platillo.margen_utilidad.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500">No hay platillos registrados o datos de margen disponibles.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
