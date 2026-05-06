"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { registrarBitacora } from "@/app/actions/bitacora-actions"
import { BITACORA_ACTIVIDADES, BITACORA_MODULOS } from "@/lib/bitacora-actividades"

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
            // noop dentro de server actions
          }
        },
      },
    },
  )
}

// Normaliza un string para comparaciones tolerantes a mayúsculas, acentos y
// espacios extra. Aplica a platillos.nombre y cargaventas.descripcion.
function normalizar(s: any): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

export type CargaventaMatch = {
  cargaventaid: number
  codigo: string
  descripcion: string
}

export type PlatilloComparativo = {
  id: number
  nombre: string
  codigo: string | null
  hotelid: number | null
  costototal: number | null
  tipofamilia: string | null
  // Todos los matches exactos en cargaventas (mismo hotel) cuyo descripcion
  // normalizado coincide con nombre normalizado. Puede haber 0, 1 o N (cuando
  // varias filas de cargaventas comparten descripcion con códigos distintos).
  matches: CargaventaMatch[]
  match_count: number
  // Atajos al primer match (para UI compacta y back-compat). null si match_count === 0.
  match_codigo: string | null
  match_descripcion: string | null
  match_cargaventaid: number | null
}

// Devuelve, para un hotel dado, todos los platillos activos enriquecidos con su
// match exacto (nombre <-> descripcion, normalizado) en cargaventas del MISMO
// hotel. También reporta cuántos registros hay en cargaventas del hotel.
export async function obtenerComparativoPlatillosCodigos(hotelid: number) {
  try {
    if (!Number.isFinite(hotelid) || hotelid <= 0) {
      return { success: false, message: "hotelid inválido", data: [], totalCargaventas: 0 }
    }
    const supabase = await getSupabase()

    const [platRes, cvRes] = await Promise.all([
      supabase
        .from("platillos")
        .select("id, nombre, codigo, hotelid, costototal, tipofamilia, activo")
        .eq("hotelid", hotelid)
        .eq("activo", true)
        .order("nombre", { ascending: true }),
      supabase
        .from("cargaventas")
        .select("id, codigo, descripcion, hotelid")
        .eq("hotelid", hotelid),
    ])

    if (platRes.error) throw new Error(platRes.error.message)
    if (cvRes.error) throw new Error(cvRes.error.message)

    const platillos = (platRes.data || []) as any[]
    const cargaventas = (cvRes.data || []) as any[]

    // Mapa de cargaventas por descripción normalizada — para match O(1).
    // Cuando varias filas comparten la misma descripción (mismo hotel) las
    // acumulamos todas: la UI debe poder mostrar la ambigüedad para que el
    // usuario decida cuál código asignar, en vez de elegir silenciosamente.
    const cvByDesc = new Map<string, CargaventaMatch[]>()
    for (const cv of cargaventas) {
      const key = normalizar(cv.descripcion)
      if (!key) continue
      const entry: CargaventaMatch = {
        cargaventaid: Number(cv.id),
        codigo: String(cv.codigo ?? ""),
        descripcion: String(cv.descripcion ?? ""),
      }
      const arr = cvByDesc.get(key)
      if (arr) arr.push(entry)
      else cvByDesc.set(key, [entry])
    }

    const data: PlatilloComparativo[] = platillos.map((p: any) => {
      const key = normalizar(p.nombre)
      const matches = (key ? cvByDesc.get(key) : undefined) ?? []
      // Estabilizar orden: por código asc para que duplicados se muestren igual entre cargas.
      const ordered = matches.slice().sort((a, b) => a.codigo.localeCompare(b.codigo))
      const first = ordered[0]
      return {
        id: Number(p.id),
        nombre: String(p.nombre ?? ""),
        codigo: p.codigo ?? null,
        hotelid: p.hotelid ?? null,
        costototal: p.costototal ?? null,
        tipofamilia: p.tipofamilia ?? null,
        matches: ordered,
        match_count: ordered.length,
        match_codigo: first?.codigo ?? null,
        match_descripcion: first?.descripcion ?? null,
        match_cargaventaid: first?.cargaventaid ?? null,
      }
    })

    return {
      success: true,
      data,
      totalCargaventas: cargaventas.length,
      totalPlatillos: platillos.length,
    }
  } catch (error: any) {
    console.error("[cargaventas] obtenerComparativoPlatillosCodigos:", error)
    return {
      success: false,
      message: error?.message || "Error obteniendo comparativo",
      data: [],
      totalCargaventas: 0,
    }
  }
}

export type CandidatoCargaventa = {
  id: number
  codigo: string
  descripcion: string
  tipo: string | null
  score: number // 0-100 aproximado (100 = match exacto)
  matchedTokens: string[] // tokens del nombre del platillo que se encontraron en la descripción
}

// Devuelve candidatos de cargaventas (mismo hotel) que comparten tokens con el
// nombre del platillo. Ranking en JS: token-overlap + bonus por match exacto y
// penalización por diferencia de longitud.
export async function buscarCoincidenciasFuzzy(
  hotelid: number,
  nombrePlatillo: string,
  limit = 30,
) {
  try {
    if (!Number.isFinite(hotelid) || hotelid <= 0) {
      return { success: false, message: "hotelid inválido", data: [] as CandidatoCargaventa[] }
    }
    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from("cargaventas")
      .select("id, codigo, descripcion, tipo, hotelid")
      .eq("hotelid", hotelid)

    if (error) throw new Error(error.message)
    const filas = (data || []) as any[]

    const nombreNorm = normalizar(nombrePlatillo)
    if (!nombreNorm) {
      return { success: true, data: [] as CandidatoCargaventa[] }
    }

    // Tokens significativos: longitud >= 3 (descarta artículos y conectores).
    const STOPWORDS = new Set(["del", "los", "las", "con", "sin", "por", "para", "que"])
    const tokens = nombreNorm
      .split(" ")
      .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    const tokensUnicos = Array.from(new Set(tokens))

    const candidatos: CandidatoCargaventa[] = []
    for (const fila of filas) {
      const descNorm = normalizar(fila.descripcion)
      if (!descNorm) continue

      // Match exacto -> score máximo 100, devolver siempre como #1.
      if (descNorm === nombreNorm) {
        candidatos.push({
          id: Number(fila.id),
          codigo: String(fila.codigo ?? ""),
          descripcion: String(fila.descripcion ?? ""),
          tipo: fila.tipo ?? null,
          score: 100,
          matchedTokens: tokensUnicos.slice(),
        })
        continue
      }

      // Token-overlap: cuántos tokens del nombre aparecen como substring en desc.
      const matched: string[] = []
      for (const t of tokensUnicos) {
        if (descNorm.includes(t)) matched.push(t)
      }
      if (matched.length === 0) continue

      // Score base: ratio de tokens matcheados (0-80).
      const ratio = matched.length / tokensUnicos.length
      let score = ratio * 80

      // Penalización suave por gran diferencia de longitud (mucho más larga
      // suele ser otro plato con misma palabra raíz).
      const diff = Math.abs(descNorm.length - nombreNorm.length)
      const lenPenalty = Math.min(diff / Math.max(nombreNorm.length, 1), 1) * 15
      score = Math.max(0, score - lenPenalty)

      // Bonus si la descripción contiene el nombre completo o viceversa.
      if (descNorm.includes(nombreNorm) || nombreNorm.includes(descNorm)) {
        score += 10
      }

      candidatos.push({
        id: Number(fila.id),
        codigo: String(fila.codigo ?? ""),
        descripcion: String(fila.descripcion ?? ""),
        tipo: fila.tipo ?? null,
        score: Math.min(99, Math.round(score)),
        matchedTokens: matched,
      })
    }

    // Ordenar por score desc, luego descripción asc para estabilidad visual.
    candidatos.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.descripcion.localeCompare(b.descripcion)
    })

    return {
      success: true,
      data: candidatos.slice(0, Math.max(1, limit)),
      total: candidatos.length,
    }
  } catch (error: any) {
    console.error("[cargaventas] buscarCoincidenciasFuzzy:", error)
    return {
      success: false,
      message: error?.message || "Error buscando coincidencias",
      data: [] as CandidatoCargaventa[],
    }
  }
}

// Asigna (o reemplaza) un código a un platillo. Si codigo viene null/'' lo limpia.
export async function asignarCodigoAPlatillo(platilloId: number, codigo: string | null) {
  try {
    if (!Number.isFinite(platilloId) || platilloId <= 0) {
      return { success: false, message: "platilloId inválido" }
    }
    const supabase = await getSupabase()
    const valor = codigo == null || String(codigo).trim() === "" ? null : String(codigo).trim()

    // Capturar nombre + código previo para que las observaciones del log sean
    // legibles ("X cambió de A a B"). Es una sola query extra y solo en este flujo.
    const { data: prev } = await supabase
      .from("platillos")
      .select("nombre, codigo")
      .eq("id", platilloId)
      .single()

    const { error } = await supabase
      .from("platillos")
      .update({ codigo: valor, fechamodificacion: new Date().toISOString().slice(0, 10) })
      .eq("id", platilloId)
    if (error) throw new Error(error.message)

    const nombre = (prev as any)?.nombre ?? "(sin nombre)"
    const previo = (prev as any)?.codigo ?? null
    const observaciones =
      valor === null
        ? `Quitó código «${previo ?? "—"}» de «${nombre}» (id ${platilloId}).`
        : previo
          ? `Cambió código de «${nombre}» (id ${platilloId}): «${previo}» → «${valor}».`
          : `Asignó código «${valor}» a «${nombre}» (id ${platilloId}).`

    await registrarBitacora({
      actividad:
        valor === null
          ? BITACORA_ACTIVIDADES.CARGAVENTAS_QUITAR_CODIGO
          : BITACORA_ACTIVIDADES.CARGAVENTAS_ASIGNAR_CODIGO,
      observaciones,
      modulo: BITACORA_MODULOS.CARGAVENTAS,
      recursoid: platilloId,
    })

    return { success: true, codigo: valor }
  } catch (error: any) {
    console.error("[cargaventas] asignarCodigoAPlatillo:", error)
    return { success: false, message: error?.message || "Error asignando código" }
  }
}

// Aplica en lote las asignaciones automáticas (todas las filas con match
// exacto). Devuelve cuántas se actualizaron y cuántas fallaron.
export async function asignarCodigosAutomaticosBulk(
  asignaciones: { platilloId: number; codigo: string }[],
) {
  try {
    if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
      return { success: true, actualizados: 0, fallidos: 0, errores: [] as string[] }
    }
    const supabase = await getSupabase()
    const fecha = new Date().toISOString().slice(0, 10)

    let actualizados = 0
    let fallidos = 0
    const errores: string[] = []

    // No hay un UPDATE WHERE id IN (...) con valores distintos en supabase-js
    // sin RPC, así que aplicamos en paralelo en lotes pequeños.
    const BATCH = 25
    for (let i = 0; i < asignaciones.length; i += BATCH) {
      const lote = asignaciones.slice(i, i + BATCH)
      const results = await Promise.all(
        lote.map(async ({ platilloId, codigo }) => {
          if (!Number.isFinite(platilloId) || platilloId <= 0) {
            return { ok: false, msg: `platilloId inválido: ${platilloId}` }
          }
          const valor = String(codigo ?? "").trim()
          if (!valor) {
            return { ok: false, msg: `codigo vacío para platillo ${platilloId}` }
          }
          const { error } = await supabase
            .from("platillos")
            .update({ codigo: valor, fechamodificacion: fecha })
            .eq("id", platilloId)
          if (error) return { ok: false, msg: `${platilloId}: ${error.message}` }
          return { ok: true, msg: "" }
        }),
      )
      for (const r of results) {
        if (r.ok) actualizados++
        else {
          fallidos++
          errores.push(r.msg)
        }
      }
    }

    // Una sola entrada de bitácora resumen del lote (no una por platillo, eso
    // satura el log). El detalle queda en observaciones.
    if (actualizados > 0) {
      await registrarBitacora({
        actividad: BITACORA_ACTIVIDADES.CARGAVENTAS_ASIGNAR_BULK,
        observaciones:
          `Asignación masiva de códigos: ${actualizados} platillo(s) actualizados` +
          (fallidos > 0 ? `, ${fallidos} fallidos.` : "."),
        modulo: BITACORA_MODULOS.CARGAVENTAS,
      })
    }

    return { success: fallidos === 0, actualizados, fallidos, errores }
  } catch (error: any) {
    console.error("[cargaventas] asignarCodigosAutomaticosBulk:", error)
    return {
      success: false,
      actualizados: 0,
      fallidos: 0,
      errores: [error?.message || "Error en lote"],
    }
  }
}
