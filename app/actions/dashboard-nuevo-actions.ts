"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // noop
          }
        },
      },
    },
  )
}

// ============================================================================
// FILTROS BÁSICOS (lookups para los selects del dashboard)
// ============================================================================

export type HotelLookup = { id: number; nombre: string; acronimo: string | null }

export async function obtenerHotelesDashboard(): Promise<HotelLookup[]> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("hoteles")
    .select("id, nombre, acronimo")
    .eq("activo", true)
    .order("nombre")
  return (data ?? []) as HotelLookup[]
}

// ============================================================================
// HELPERS
// ============================================================================

// Mes 1-12 → nombre corto en español
const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
function periodoLabel(year: number, mes: number) {
  return `${MES_CORTO[mes - 1] ?? mes} ${String(year).slice(2)}`
}
function periodoKey(year: number, mes: number) {
  return year * 100 + mes
}

// Construye el rango de los últimos N meses (incluye el mes actual)
function ultimosMeses(n: number): { year: number; mes: number; key: number; label: string }[] {
  const hoy = new Date()
  const out: { year: number; mes: number; key: number; label: string }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    out.push({ year: y, mes: m, key: periodoKey(y, m), label: periodoLabel(y, m) })
  }
  return out
}

// ============================================================================
// KPIs PRINCIPALES (del mes actual con comparación al mes anterior)
// ============================================================================

export type DashboardKPIs = {
  ingresoMesActual: number
  ingresoMesAnterior: number
  variacionIngreso: number // %
  unidadesMesActual: number
  unidadesMesAnterior: number
  variacionUnidades: number
  costoPorcentualPromedio: number | null
  costoPorcentualAnterior: number | null
  variacionCostoPorcentual: number | null
  margenPromedio: number | null // % (precioventa - costo) / precioventa
  totalPlatillosActivos: number
  totalMenusActivos: number
}

export async function obtenerKPIsDashboard(hotelid: number | null): Promise<DashboardKPIs> {
  const supabase = await getSupabase()
  const meses = ultimosMeses(2)
  const actual = meses[1]
  const anterior = meses[0]

  // ----- Ventas (ventasplatillos) actual y anterior -----
  let qActual = supabase.from("ventasplatillos").select("cantidad, ingreso_total")
    .eq("year", actual.year).eq("mes", actual.mes)
  let qAnterior = supabase.from("ventasplatillos").select("cantidad, ingreso_total")
    .eq("year", anterior.year).eq("mes", anterior.mes)
  if (hotelid) {
    qActual = qActual.eq("hotelid", hotelid)
    qAnterior = qAnterior.eq("hotelid", hotelid)
  }

  const [ventasActual, ventasAnterior] = await Promise.all([qActual, qAnterior])

  const ingresoMesActual = (ventasActual.data ?? []).reduce(
    (s: number, r: any) => s + Number(r.ingreso_total ?? 0),
    0,
  )
  const ingresoMesAnterior = (ventasAnterior.data ?? []).reduce(
    (s: number, r: any) => s + Number(r.ingreso_total ?? 0),
    0,
  )
  const unidadesMesActual = (ventasActual.data ?? []).reduce(
    (s: number, r: any) => s + Number(r.cantidad ?? 0),
    0,
  )
  const unidadesMesAnterior = (ventasAnterior.data ?? []).reduce(
    (s: number, r: any) => s + Number(r.cantidad ?? 0),
    0,
  )

  // ----- Costo porcentual (de historico) últimos 2 meses -----
  let qCpActual = supabase
    .from("historico")
    .select("costoporcentual, platilloid")
    .gte("fechacreacion", `${actual.year}-${String(actual.mes).padStart(2, "0")}-01`)
    .lt(
      "fechacreacion",
      actual.mes === 12
        ? `${actual.year + 1}-01-01`
        : `${actual.year}-${String(actual.mes + 1).padStart(2, "0")}-01`,
    )
    .not("platilloid", "is", null)
    .not("costoporcentual", "is", null)
  let qCpAnterior = supabase
    .from("historico")
    .select("costoporcentual, platilloid")
    .gte("fechacreacion", `${anterior.year}-${String(anterior.mes).padStart(2, "0")}-01`)
    .lt(
      "fechacreacion",
      anterior.mes === 12
        ? `${anterior.year + 1}-01-01`
        : `${anterior.year}-${String(anterior.mes + 1).padStart(2, "0")}-01`,
    )
    .not("platilloid", "is", null)
    .not("costoporcentual", "is", null)
  if (hotelid) {
    qCpActual = qCpActual.eq("hotelid", hotelid)
    qCpAnterior = qCpAnterior.eq("hotelid", hotelid)
  }

  const [cpActual, cpAnterior] = await Promise.all([qCpActual, qCpAnterior])

  function promedioPorPlatillo(rows: any[]) {
    if (!rows || rows.length === 0) return null
    const map = new Map<number, number>()
    for (const r of rows) {
      const k = Number(r.platilloid)
      if (!map.has(k)) map.set(k, Number(r.costoporcentual))
    }
    if (map.size === 0) return null
    let sum = 0
    map.forEach((v) => (sum += v))
    return sum / map.size
  }

  const cpProm = promedioPorPlatillo(cpActual.data ?? [])
  const cpPromAnt = promedioPorPlatillo(cpAnterior.data ?? [])

  // ----- Totales generales -----
  let qPlat = supabase.from("platillos").select("id", { count: "exact", head: true }).eq("activo", true)
  if (hotelid) qPlat = qPlat.eq("hotelid", hotelid)
  const [{ count: countPlatillos }] = await Promise.all([qPlat])

  let qMenus = supabase.from("menus").select("id, restaurantes!inner(hotelid)", {
    count: "exact",
    head: true,
  })
  if (hotelid) qMenus = qMenus.eq("restaurantes.hotelid", hotelid)
  const { count: countMenus } = await qMenus

  // ----- Margen promedio (precioventa promedio del mes actual vs costo promedio) -----
  // Aproximación: 100 - costoporcentual_promedio = margen_promedio
  const margen = cpProm != null ? 100 - cpProm : null

  function pct(a: number, b: number) {
    if (b === 0) return a === 0 ? 0 : 100
    return ((a - b) / b) * 100
  }

  return {
    ingresoMesActual,
    ingresoMesAnterior,
    variacionIngreso: pct(ingresoMesActual, ingresoMesAnterior),
    unidadesMesActual,
    unidadesMesAnterior,
    variacionUnidades: pct(unidadesMesActual, unidadesMesAnterior),
    costoPorcentualPromedio: cpProm,
    costoPorcentualAnterior: cpPromAnt,
    variacionCostoPorcentual:
      cpProm != null && cpPromAnt != null ? cpProm - cpPromAnt : null,
    margenPromedio: margen,
    totalPlatillosActivos: countPlatillos ?? 0,
    totalMenusActivos: countMenus ?? 0,
  }
}

// ============================================================================
// TENDENCIA MENSUAL (12 meses): ingresos, unidades, costo% promedio
// ============================================================================

export type PuntoTendencia = {
  periodo: string // "May 26"
  year: number
  mes: number
  ingresos: number
  unidades: number
  costoPorcentual: number | null
}

export async function obtenerTendenciaMensual(hotelid: number | null): Promise<PuntoTendencia[]> {
  const supabase = await getSupabase()
  const meses = ultimosMeses(12)
  const yearMin = meses[0].year
  const yearMax = meses[meses.length - 1].year
  const fechaMin = `${meses[0].year}-${String(meses[0].mes).padStart(2, "0")}-01`
  const ultimo = meses[meses.length - 1]
  const fechaMax =
    ultimo.mes === 12
      ? `${ultimo.year + 1}-01-01`
      : `${ultimo.year}-${String(ultimo.mes + 1).padStart(2, "0")}-01`

  // Ventas agrupadas por (year, mes)
  let qVentas = supabase
    .from("ventasplatillos")
    .select("year, mes, cantidad, ingreso_total")
    .gte("year", yearMin)
    .lte("year", yearMax)
  if (hotelid) qVentas = qVentas.eq("hotelid", hotelid)

  // Costo% promedio por mes (de historico) — promediado por platillo único
  let qCp = supabase
    .from("historico")
    .select("fechacreacion, platilloid, costoporcentual")
    .gte("fechacreacion", fechaMin)
    .lt("fechacreacion", fechaMax)
    .not("platilloid", "is", null)
    .not("costoporcentual", "is", null)
  if (hotelid) qCp = qCp.eq("hotelid", hotelid)

  const [ventasRes, cpRes] = await Promise.all([qVentas, qCp])

  // Agregar ventas por periodo
  const ventasMap = new Map<number, { ingresos: number; unidades: number }>()
  for (const r of ventasRes.data ?? []) {
    const key = periodoKey(Number((r as any).year), Number((r as any).mes))
    const acc = ventasMap.get(key) ?? { ingresos: 0, unidades: 0 }
    acc.ingresos += Number((r as any).ingreso_total ?? 0)
    acc.unidades += Number((r as any).cantidad ?? 0)
    ventasMap.set(key, acc)
  }

  // Agregar costo% por periodo (promedio por platillo único en el mes)
  const cpPorMes = new Map<number, Map<number, number>>()
  for (const r of cpRes.data ?? []) {
    const f = new Date((r as any).fechacreacion as string)
    const key = periodoKey(f.getFullYear(), f.getMonth() + 1)
    let inner = cpPorMes.get(key)
    if (!inner) {
      inner = new Map<number, number>()
      cpPorMes.set(key, inner)
    }
    const pid = Number((r as any).platilloid)
    if (!inner.has(pid)) inner.set(pid, Number((r as any).costoporcentual))
  }
  const cpMap = new Map<number, number>()
  cpPorMes.forEach((inner, k) => {
    if (inner.size === 0) return
    let s = 0
    inner.forEach((v) => (s += v))
    cpMap.set(k, s / inner.size)
  })

  return meses.map((m) => ({
    periodo: m.label,
    year: m.year,
    mes: m.mes,
    ingresos: Math.round(ventasMap.get(m.key)?.ingresos ?? 0),
    unidades: ventasMap.get(m.key)?.unidades ?? 0,
    costoPorcentual: cpMap.has(m.key) ? Number(cpMap.get(m.key)!.toFixed(2)) : null,
  }))
}

// ============================================================================
// TOP PLATILLOS DEL MES POR INGRESO (con comparación vs mes anterior)
// ============================================================================

export type TopPlatilloVenta = {
  platilloid: number
  nombre: string
  unidadesActual: number
  ingresoActual: number
  unidadesAnterior: number
  ingresoAnterior: number
  variacionIngresoPct: number
}

export async function obtenerTopPlatillosVendidos(
  hotelid: number | null,
  limit = 8,
): Promise<TopPlatilloVenta[]> {
  const supabase = await getSupabase()
  const meses = ultimosMeses(2)
  const actual = meses[1]
  const anterior = meses[0]

  let qActual = supabase
    .from("ventasplatillos")
    .select("platilloid, cantidad, ingreso_total")
    .eq("year", actual.year)
    .eq("mes", actual.mes)
  let qAnterior = supabase
    .from("ventasplatillos")
    .select("platilloid, cantidad, ingreso_total")
    .eq("year", anterior.year)
    .eq("mes", anterior.mes)
  if (hotelid) {
    qActual = qActual.eq("hotelid", hotelid)
    qAnterior = qAnterior.eq("hotelid", hotelid)
  }

  const [actualRes, antRes] = await Promise.all([qActual, qAnterior])

  const ingresoActualMap = new Map<number, { unidades: number; ingreso: number }>()
  for (const r of actualRes.data ?? []) {
    const pid = Number((r as any).platilloid)
    const acc = ingresoActualMap.get(pid) ?? { unidades: 0, ingreso: 0 }
    acc.unidades += Number((r as any).cantidad ?? 0)
    acc.ingreso += Number((r as any).ingreso_total ?? 0)
    ingresoActualMap.set(pid, acc)
  }
  const antMap = new Map<number, { unidades: number; ingreso: number }>()
  for (const r of antRes.data ?? []) {
    const pid = Number((r as any).platilloid)
    const acc = antMap.get(pid) ?? { unidades: 0, ingreso: 0 }
    acc.unidades += Number((r as any).cantidad ?? 0)
    acc.ingreso += Number((r as any).ingreso_total ?? 0)
    antMap.set(pid, acc)
  }

  const topIds = Array.from(ingresoActualMap.entries())
    .sort((a, b) => b[1].ingreso - a[1].ingreso)
    .slice(0, limit)
    .map(([pid]) => pid)

  if (topIds.length === 0) return []

  const { data: nombres } = await supabase
    .from("platillos")
    .select("id, nombre")
    .in("id", topIds)

  const nombreMap = new Map<number, string>()
  for (const n of nombres ?? []) nombreMap.set(Number((n as any).id), String((n as any).nombre))

  return topIds.map((pid) => {
    const a = ingresoActualMap.get(pid) ?? { unidades: 0, ingreso: 0 }
    const ant = antMap.get(pid) ?? { unidades: 0, ingreso: 0 }
    const variacion =
      ant.ingreso === 0 ? (a.ingreso > 0 ? 100 : 0) : ((a.ingreso - ant.ingreso) / ant.ingreso) * 100
    return {
      platilloid: pid,
      nombre: nombreMap.get(pid) ?? `Platillo ${pid}`,
      unidadesActual: a.unidades,
      ingresoActual: Math.round(a.ingreso),
      unidadesAnterior: ant.unidades,
      ingresoAnterior: Math.round(ant.ingreso),
      variacionIngresoPct: Number(variacion.toFixed(1)),
    }
  })
}

// ============================================================================
// VARIACIONES DE COSTOS DE PLATILLOS (top subidas / bajadas vs mes anterior)
// ============================================================================

export type VariacionCosto = {
  platilloid: number
  nombre: string
  costoActual: number
  costoAnterior: number
  variacionPct: number
  precioventa: number | null
  costoPorcentualActual: number | null
}

export async function obtenerVariacionesCostosPlatillos(
  hotelid: number | null,
  limit = 5,
): Promise<{ subidas: VariacionCosto[]; bajadas: VariacionCosto[] }> {
  const supabase = await getSupabase()
  const meses = ultimosMeses(2)
  const actual = meses[1]
  const anterior = meses[0]

  function dateRange(y: number, m: number) {
    const from = `${y}-${String(m).padStart(2, "0")}-01`
    const to = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`
    return { from, to }
  }

  const a = dateRange(actual.year, actual.mes)
  const an = dateRange(anterior.year, anterior.mes)

  let qA = supabase
    .from("historico")
    .select("platilloid, costo, precioventa, costoporcentual")
    .gte("fechacreacion", a.from)
    .lt("fechacreacion", a.to)
    .not("platilloid", "is", null)
  let qAn = supabase
    .from("historico")
    .select("platilloid, costo")
    .gte("fechacreacion", an.from)
    .lt("fechacreacion", an.to)
    .not("platilloid", "is", null)
  if (hotelid) {
    qA = qA.eq("hotelid", hotelid)
    qAn = qAn.eq("hotelid", hotelid)
  }

  const [aRes, anRes] = await Promise.all([qA, qAn])

  type Agg = { costo: number; precioventa: number | null; cp: number | null }
  const aMap = new Map<number, Agg>()
  for (const r of aRes.data ?? []) {
    const pid = Number((r as any).platilloid)
    const agg = aMap.get(pid) ?? { costo: 0, precioventa: null, cp: null }
    agg.costo += Number((r as any).costo ?? 0)
    if (agg.precioventa == null && (r as any).precioventa != null)
      agg.precioventa = Number((r as any).precioventa)
    if (agg.cp == null && (r as any).costoporcentual != null)
      agg.cp = Number((r as any).costoporcentual)
    aMap.set(pid, agg)
  }
  const anMap = new Map<number, number>()
  for (const r of anRes.data ?? []) {
    const pid = Number((r as any).platilloid)
    anMap.set(pid, (anMap.get(pid) ?? 0) + Number((r as any).costo ?? 0))
  }

  const ids = Array.from(aMap.keys()).filter((pid) => anMap.has(pid) && anMap.get(pid)! > 0)
  if (ids.length === 0) return { subidas: [], bajadas: [] }

  const { data: nombres } = await supabase
    .from("platillos")
    .select("id, nombre")
    .in("id", ids)
  const nombreMap = new Map<number, string>()
  for (const n of nombres ?? []) nombreMap.set(Number((n as any).id), String((n as any).nombre))

  const variaciones = ids.map((pid) => {
    const aAgg = aMap.get(pid)!
    const ant = anMap.get(pid)!
    const variacionPct = ((aAgg.costo - ant) / ant) * 100
    return {
      platilloid: pid,
      nombre: nombreMap.get(pid) ?? `Platillo ${pid}`,
      costoActual: Number(aAgg.costo.toFixed(2)),
      costoAnterior: Number(ant.toFixed(2)),
      variacionPct: Number(variacionPct.toFixed(1)),
      precioventa: aAgg.precioventa,
      costoPorcentualActual: aAgg.cp,
    }
  })

  const subidas = variaciones
    .filter((v) => v.variacionPct > 0)
    .sort((a, b) => b.variacionPct - a.variacionPct)
    .slice(0, limit)
  const bajadas = variaciones
    .filter((v) => v.variacionPct < 0)
    .sort((a, b) => a.variacionPct - b.variacionPct)
    .slice(0, limit)

  return { subidas, bajadas }
}

// ============================================================================
// COSTO % PROMEDIO POR MENÚ (mes actual)
// ============================================================================

export type CostoPorMenu = {
  menuid: number
  nombre: string
  restaurante: string | null
  costoPorcentual: number
  totalPlatillos: number
}

export async function obtenerCostoPorcentualPorMenu(
  hotelid: number | null,
): Promise<CostoPorMenu[]> {
  const supabase = await getSupabase()
  const meses = ultimosMeses(1)
  const actual = meses[0]
  const from = `${actual.year}-${String(actual.mes).padStart(2, "0")}-01`
  const to =
    actual.mes === 12
      ? `${actual.year + 1}-01-01`
      : `${actual.year}-${String(actual.mes + 1).padStart(2, "0")}-01`

  let q = supabase
    .from("historico")
    .select("menuid, platilloid, costoporcentual")
    .gte("fechacreacion", from)
    .lt("fechacreacion", to)
    .not("menuid", "is", null)
    .not("platilloid", "is", null)
    .not("costoporcentual", "is", null)
  if (hotelid) q = q.eq("hotelid", hotelid)

  const { data } = await q
  if (!data || data.length === 0) return []

  // Promedio por (menu, platillo) único
  const menuMap = new Map<number, Map<number, number>>()
  for (const r of data) {
    const mid = Number((r as any).menuid)
    const pid = Number((r as any).platilloid)
    let inner = menuMap.get(mid)
    if (!inner) {
      inner = new Map<number, number>()
      menuMap.set(mid, inner)
    }
    if (!inner.has(pid)) inner.set(pid, Number((r as any).costoporcentual))
  }

  const menuIds = Array.from(menuMap.keys())
  const { data: menus } = await supabase
    .from("menus")
    .select("id, nombre, restaurantes(nombre)")
    .in("id", menuIds)

  const menuInfo = new Map<number, { nombre: string; restaurante: string | null }>()
  for (const m of menus ?? []) {
    menuInfo.set(Number((m as any).id), {
      nombre: String((m as any).nombre ?? ""),
      restaurante: (m as any).restaurantes?.nombre ?? null,
    })
  }

  const result: CostoPorMenu[] = []
  menuMap.forEach((inner, mid) => {
    const total = inner.size
    let sum = 0
    inner.forEach((v) => (sum += v))
    const prom = sum / total
    result.push({
      menuid: mid,
      nombre: menuInfo.get(mid)?.nombre ?? `Menú ${mid}`,
      restaurante: menuInfo.get(mid)?.restaurante ?? null,
      costoPorcentual: Number(prom.toFixed(2)),
      totalPlatillos: total,
    })
  })

  return result.sort((a, b) => b.costoPorcentual - a.costoPorcentual)
}
