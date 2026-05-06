"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Percent,
  Utensils,
  Hotel,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  obtenerHotelesDashboard,
  obtenerKPIsDashboard,
  obtenerTendenciaMensual,
  obtenerTopPlatillosVendidos,
  obtenerVariacionesCostosPlatillos,
  obtenerCostoPorcentualPorMenu,
  type HotelLookup,
  type DashboardKPIs,
  type PuntoTendencia,
  type TopPlatilloVenta,
  type VariacionCosto,
  type CostoPorMenu,
} from "@/app/actions/dashboard-nuevo-actions"

// Paleta del proyecto (Opción B — teal monocromático)
const C = {
  primary: "#1F4F58",
  mid: "#528A94",
  light: "#7BAEB8",
  pale: "#E8F0F1",
  ink: "#0F172A",
  good: "#16a34a",
  goodPale: "#dcfce7",
  bad: "#dc2626",
  badPale: "#fee2e2",
  warn: "#d97706",
  warnPale: "#fef3c7",
}

function fmtCurrency(n: number | null | undefined) {
  if (n == null) return "—"
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)
}
function fmtNumber(n: number | null | undefined) {
  if (n == null) return "—"
  return new Intl.NumberFormat("es-MX").format(n)
}
function fmtPct(n: number | null | undefined, decimals = 1) {
  if (n == null || !Number.isFinite(n)) return "—"
  return `${n.toFixed(decimals)}%`
}

export default function DashboardNuevoPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  const [hoteles, setHoteles] = useState<HotelLookup[]>([])
  const [hotelid, setHotelid] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [tendencia, setTendencia] = useState<PuntoTendencia[]>([])
  const [topVendidos, setTopVendidos] = useState<TopPlatilloVenta[]>([])
  const [variaciones, setVariaciones] = useState<{
    subidas: VariacionCosto[]
    bajadas: VariacionCosto[]
  }>({ subidas: [], bajadas: [] })
  const [costoPorMenu, setCostoPorMenu] = useState<CostoPorMenu[]>([])

  useEffect(() => {
    setMounted(true)
    obtenerHotelesDashboard().then((data) => {
      setHoteles(data)
    })
  }, [])

  useEffect(() => {
    if (!mounted) return
    setLoading(true)
    Promise.all([
      obtenerKPIsDashboard(hotelid),
      obtenerTendenciaMensual(hotelid),
      obtenerTopPlatillosVendidos(hotelid, 8),
      obtenerVariacionesCostosPlatillos(hotelid, 5),
      obtenerCostoPorcentualPorMenu(hotelid),
    ])
      .then(([k, t, top, v, cm]) => {
        setKpis(k)
        setTendencia(t)
        setTopVendidos(top)
        setVariaciones(v)
        setCostoPorMenu(cm)
      })
      .finally(() => setLoading(false))
  }, [mounted, hotelid])

  if (!mounted || authLoading) return null

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-[#E8F0F1]/40 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ============== HEADER ============== */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1F4F58]/10">
              <LayoutDashboard className="h-6 w-6 text-[#1F4F58]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Panorama general</h1>
                <Badge className="bg-amber-100 text-amber-800 border border-amber-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Beta
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Resumen de operación: ventas, costos, márgenes y tendencias mensuales.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="hotel-filter" className="text-xs uppercase tracking-wide font-semibold text-slate-500">
              Hotel
            </label>
            <select
              id="hotel-filter"
              value={hotelid ?? ""}
              onChange={(e) => setHotelid(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white hover:border-[#528A94] focus:outline-none focus:ring-2 focus:ring-[#528A94]"
            >
              <option value="">Todos los hoteles</option>
              {hoteles.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.acronimo ?? h.nombre} — {h.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Aviso de datos demo */}
        <div className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 flex items-start gap-2 text-xs text-amber-900">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Las cifras de <strong>ventas</strong> son <em>datos demo simulados</em> en la tabla{" "}
            <span className="font-mono">ventasplatillos</span>. Los datos de costos, precios y
            márgenes son reales (vienen de <span className="font-mono">historico</span>). Cuando
            integres ventas reales, este aviso desaparece.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Cargando panorama…
          </div>
        )}

        {!loading && kpis && (
          <>
            {/* ============== KPI CARDS ============== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard
                icon={<DollarSign className="h-4 w-4" />}
                label="Ingreso del mes"
                value={fmtCurrency(kpis.ingresoMesActual)}
                trend={kpis.variacionIngreso}
                hint={`Mes anterior: ${fmtCurrency(kpis.ingresoMesAnterior)}`}
                tone="primary"
              />
              <KPICard
                icon={<ShoppingBag className="h-4 w-4" />}
                label="Unidades vendidas"
                value={fmtNumber(kpis.unidadesMesActual)}
                trend={kpis.variacionUnidades}
                hint={`Mes anterior: ${fmtNumber(kpis.unidadesMesAnterior)}`}
                tone="primary"
              />
              <KPICard
                icon={<Percent className="h-4 w-4" />}
                label="Costo % promedio"
                value={fmtPct(kpis.costoPorcentualPromedio)}
                trend={
                  kpis.variacionCostoPorcentual != null
                    ? kpis.variacionCostoPorcentual
                    : null
                }
                trendInverted
                hint={`Anterior: ${fmtPct(kpis.costoPorcentualAnterior)}`}
                tone="warn"
              />
              <KPICard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Margen promedio"
                value={fmtPct(kpis.margenPromedio)}
                hint={`${fmtNumber(kpis.totalPlatillosActivos)} platillos · ${fmtNumber(kpis.totalMenusActivos)} menús`}
                tone="good"
              />
            </div>

            {/* ============== TENDENCIA MENSUAL ============== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Ingresos & unidades */}
              <Card className="lg:col-span-2 border-2 border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-base text-slate-900">
                        Tendencia de ventas (12 meses)
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ingresos en barras · Unidades en línea
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-72 w-full">
                    <ResponsiveContainer>
                      <BarChart data={tendencia} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="grad-ing" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={C.mid} stopOpacity={0.95} />
                            <stop offset="100%" stopColor={C.light} stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "#64748b" }} />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : `${v}`)}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          tickFormatter={(v) => `${(v / 1e3).toFixed(0)}k`}
                        />
                        <ReTooltip
                          formatter={(value: any, name: any) => {
                            if (name === "Ingresos") return [fmtCurrency(value as number), name]
                            return [fmtNumber(value as number), name]
                          }}
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid #e2e8f0",
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar
                          yAxisId="left"
                          dataKey="ingresos"
                          name="Ingresos"
                          fill="url(#grad-ing)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="unidades"
                          name="Unidades"
                          stroke={C.primary}
                          strokeWidth={2}
                          dot={{ r: 3, fill: C.primary }}
                          activeDot={{ r: 5 }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Costo % tendencia */}
              <Card className="border-2 border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900">Costo % mensual</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Promedio por platillo</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-72 w-full">
                    <ResponsiveContainer>
                      <AreaChart data={tendencia} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="grad-cp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={C.warn} stopOpacity={0.5} />
                            <stop offset="100%" stopColor={C.warn} stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#64748b" }} />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <ReTooltip
                          formatter={(value: any) => [fmtPct(value as number, 2), "Costo %"]}
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid #e2e8f0",
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="costoPorcentual"
                          stroke={C.warn}
                          strokeWidth={2}
                          fill="url(#grad-cp)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ============== TOP VENDIDOS + COSTO % POR MENU ============== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top platillos vendidos */}
              <Card className="border-2 border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#528A94]" />
                    Top platillos por ingreso
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mes actual vs mes anterior
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  {topVendidos.length === 0 ? (
                    <EmptyState text="Sin ventas este mes." />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {topVendidos.map((p, i) => (
                        <li key={p.platilloid} className="py-2 flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                              i < 3
                                ? "bg-[#1F4F58] text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {p.nombre}
                            </div>
                            <div className="text-xs text-slate-500">
                              {fmtNumber(p.unidadesActual)} unidades · {fmtCurrency(p.ingresoActual)}
                            </div>
                          </div>
                          <TrendBadge value={p.variacionIngresoPct} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Costo % por menú */}
              <Card className="border-2 border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                    <Percent className="h-4 w-4 text-[#d97706]" />
                    Costo % promedio por menú
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mes actual · ordenado por costo más alto
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  {costoPorMenu.length === 0 ? (
                    <EmptyState text="Sin data de costo% este mes." />
                  ) : (
                    <div className="h-72 w-full">
                      <ResponsiveContainer>
                        <BarChart
                          data={costoPorMenu.slice(0, 8)}
                          layout="vertical"
                          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 10, fill: "#64748b" }}
                            tickFormatter={(v) => `${v}%`}
                            domain={[0, "dataMax + 5"]}
                          />
                          <YAxis
                            type="category"
                            dataKey="nombre"
                            tick={{ fontSize: 10, fill: "#475569" }}
                            width={130}
                          />
                          <ReTooltip
                            formatter={(value: any) => [fmtPct(value as number, 2), "Costo %"]}
                            contentStyle={{
                              borderRadius: 8,
                              border: "1px solid #e2e8f0",
                              fontSize: 12,
                            }}
                          />
                          <Bar dataKey="costoPorcentual" radius={[0, 6, 6, 0]} maxBarSize={20}>
                            {costoPorMenu.slice(0, 8).map((m, i) => (
                              <Cell
                                key={i}
                                fill={
                                  m.costoPorcentual >= 35
                                    ? C.bad
                                    : m.costoPorcentual >= 28
                                      ? C.warn
                                      : C.mid
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ============== VARIACIONES DE COSTOS ============== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <VariacionCard
                titulo="Mayor subida de costos"
                items={variaciones.subidas}
                tone="bad"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <VariacionCard
                titulo="Mayor baja de costos"
                items={variaciones.bajadas}
                tone="good"
                icon={<TrendingDown className="h-4 w-4" />}
              />
            </div>

            {/* Footer info */}
            <div className="text-center text-xs text-slate-400 pt-4 pb-8">
              Sesión: {user?.NombreCompleto ?? "—"}
              {hotelid && (
                <>
                  {" · "}
                  Filtrado por hotel id <span className="font-mono">{hotelid}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function KPICard({
  icon,
  label,
  value,
  trend,
  trendInverted,
  hint,
  tone = "primary",
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend?: number | null
  trendInverted?: boolean
  hint?: string
  tone?: "primary" | "good" | "warn" | "bad"
}) {
  const tonePalette: Record<string, string> = {
    primary: "bg-[#1F4F58]/10 text-[#1F4F58] border-[#7BAEB8]/40",
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    bad: "bg-rose-50 text-rose-700 border-rose-200",
  }
  return (
    <Card className="border-2 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div
            className={`px-2 py-1 rounded-md border text-[10px] uppercase tracking-wide font-semibold flex items-center gap-1 ${tonePalette[tone]}`}
          >
            {icon}
            {label}
          </div>
          {trend != null && Number.isFinite(trend) && <TrendBadge value={trend} inverted={trendInverted} />}
        </div>
        <div className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
        {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function TrendBadge({
  value,
  inverted = false,
}: {
  value: number
  inverted?: boolean
}) {
  if (!Number.isFinite(value)) return null
  // Para costo% un "subió" es malo (inverted=true)
  const isUp = value > 0
  const isGood = inverted ? !isUp : isUp
  const cls = isGood
    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
    : "bg-rose-100 text-rose-800 border border-rose-300"
  const Arrow = isUp ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${cls}`}
    >
      <Arrow className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

// Datos de ejemplo solo para previsualización visual cuando aún no hay
// suficiente histórico real para calcular variaciones (necesita dos meses
// consecutivos del mismo platillo en `historico`).
const VARIACIONES_DEMO_SUBIDAS: VariacionCosto[] = [
  { platilloid: -1, nombre: "Filete Mignon a la Parrilla",  costoActual: 312.5, costoAnterior: 245.0, variacionPct: 27.6, precioventa: 720, costoPorcentualActual: 43.4 },
  { platilloid: -2, nombre: "Risotto de Hongos Silvestres", costoActual: 168.0, costoAnterior: 135.0, variacionPct: 24.4, precioventa: 420, costoPorcentualActual: 40.0 },
  { platilloid: -3, nombre: "Pulpo a la Parrilla",          costoActual: 285.0, costoAnterior: 240.0, variacionPct: 18.8, precioventa: 650, costoPorcentualActual: 43.8 },
  { platilloid: -4, nombre: "Ensalada de Burrata",          costoActual:  98.0, costoAnterior:  84.0, variacionPct: 16.7, precioventa: 280, costoPorcentualActual: 35.0 },
  { platilloid: -5, nombre: "Tartar de Atún",               costoActual: 195.0, costoAnterior: 172.0, variacionPct: 13.4, precioventa: 480, costoPorcentualActual: 40.6 },
]
const VARIACIONES_DEMO_BAJADAS: VariacionCosto[] = [
  { platilloid: -6, nombre: "Plato de Frutas de Temporada",      costoActual:  42.0, costoAnterior:  58.0, variacionPct: -27.6, precioventa: 180, costoPorcentualActual: 23.3 },
  { platilloid: -7, nombre: "Yogurth Griego con Fruta Picada",   costoActual:  35.5, costoAnterior:  47.0, variacionPct: -24.5, precioventa: 165, costoPorcentualActual: 21.5 },
  { platilloid: -8, nombre: "Sopa de Tomate Asado",              costoActual:  58.0, costoAnterior:  72.0, variacionPct: -19.4, precioventa: 195, costoPorcentualActual: 29.7 },
  { platilloid: -9, nombre: "Pasta Pomodoro",                    costoActual:  74.0, costoAnterior:  88.0, variacionPct: -15.9, precioventa: 245, costoPorcentualActual: 30.2 },
  { platilloid: -10, nombre: "Crema de Calabaza",                costoActual:  46.0, costoAnterior:  53.5, variacionPct: -14.0, precioventa: 175, costoPorcentualActual: 26.3 },
]

function VariacionCard({
  titulo,
  items,
  tone,
  icon,
}: {
  titulo: string
  items: VariacionCosto[]
  tone: "good" | "bad"
  icon: React.ReactNode
}) {
  const headerCls =
    tone === "bad"
      ? "text-rose-700 bg-rose-50 border-rose-200"
      : "text-emerald-700 bg-emerald-50 border-emerald-200"

  // Si no hay variaciones reales, mostramos data de ejemplo para previsualizar
  // el diseño. El badge "Ejemplo" deja claro al usuario que no son datos reales.
  const usandoDemo = items.length === 0
  const datos = usandoDemo
    ? tone === "bad"
      ? VARIACIONES_DEMO_SUBIDAS
      : VARIACIONES_DEMO_BAJADAS
    : items

  return (
    <Card className="border-2 border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold w-fit ${headerCls}`}>
            {icon}
            {titulo}
          </div>
          {usandoDemo && (
            <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] uppercase tracking-wide">
              Ejemplo
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {usandoDemo
            ? "Datos de ejemplo — aún no hay variaciones reales calculadas"
            : "Comparativa vs mes anterior"}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-slate-100">
          {datos.map((v) => (
            <li key={v.platilloid} className="py-2 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{v.nombre}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                  <span>Costo: {fmtCurrency(v.costoActual)}</span>
                  <span className="text-slate-300">·</span>
                  <span>Anterior: {fmtCurrency(v.costoAnterior)}</span>
                  {v.precioventa != null && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>PV: {fmtCurrency(v.precioventa)}</span>
                    </>
                  )}
                  {v.costoPorcentualActual != null && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>CP: {fmtPct(v.costoPorcentualActual, 1)}</span>
                    </>
                  )}
                </div>
              </div>
              <TrendBadge value={v.variacionPct} inverted={tone === "bad" ? false : true} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-10 text-center text-slate-400 flex flex-col items-center gap-2">
      <AlertTriangle className="h-5 w-5" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
