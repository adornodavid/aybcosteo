"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSession } from "@/app/actions/session-actions"

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

// Registra una entrada en bitacorausuarios usando el usuario activo de la sesión.
// Es "best-effort": si la sesión no está, o el insert falla, NO se propaga el
// error — la operación de negocio que llamó este helper no debe romperse por un
// fallo de logging. Devuelve true si se registró.
export async function registrarBitacora(params: {
  actividad: string
  observaciones?: string
  modulo?: string
  recursoid?: number | null
  // Si la sesión no está disponible (ej: ruta donde el cookie no llega), el
  // caller puede pasar el usuarioid explícito.
  usuarioidOverride?: number
}): Promise<boolean> {
  try {
    let usuarioid = params.usuarioidOverride ?? null
    if (!usuarioid) {
      const session = await getSession()
      usuarioid = session?.UsuarioId ?? null
    }
    if (!usuarioid || !Number.isFinite(usuarioid) || usuarioid <= 0) {
      // Sin sesión válida no podemos atribuir el movimiento. No es un error.
      return false
    }

    const supabase = await getSupabase()
    const { error } = await supabase.from("bitacorausuarios").insert({
      usuarioid,
      actividad: params.actividad,
      observaciones: params.observaciones ?? null,
      modulo: params.modulo ?? null,
      recursoid: params.recursoid ?? null,
    })
    if (error) {
      console.warn("[bitacora] insert falló:", error.message)
      return false
    }
    return true
  } catch (error: any) {
    console.warn("[bitacora] excepción:", error?.message)
    return false
  }
}

export type BitacoraEntrada = {
  id: number
  usuarioid: number
  actividad: string | null
  observaciones: string | null
  fechamovimiento: string
  modulo: string | null
  recursoid: number | null
}

export type UsuarioBitacora = {
  id: number
  nombrecompleto: string
  email: string
  rolid: number | null
  hotelid: number | null
  activo: boolean | null
  imgurl: string | null
  fechaultimoacceso: string | null
  cantidadaccesos: number | null
}

// Trae datos del usuario y su bitácora ordenada por fecha desc, paginable.
// limit por defecto 500 — suficiente para el render inicial sin saturar.
export async function obtenerBitacoraDeUsuario(
  usuarioid: number,
  opts: { limit?: number; modulo?: string | null } = {},
) {
  try {
    if (!Number.isFinite(usuarioid) || usuarioid <= 0) {
      return { success: false, message: "usuarioid inválido", usuario: null, entradas: [] }
    }
    const supabase = await getSupabase()
    const limit = Math.max(1, Math.min(opts.limit ?? 500, 5000))

    const usuarioReq = supabase
      .from("usuarios")
      .select("id, nombrecompleto, email, rolid, hotelid, activo, imgurl, fechaultimoacceso, cantidadaccesos")
      .eq("id", usuarioid)
      .single()

    let bitacoraReq = supabase
      .from("bitacorausuarios")
      .select("id, usuarioid, actividad, observaciones, fechamovimiento, modulo, recursoid")
      .eq("usuarioid", usuarioid)
      .order("fechamovimiento", { ascending: false })
      .limit(limit)

    if (opts.modulo) {
      bitacoraReq = bitacoraReq.eq("modulo", opts.modulo)
    }

    const [uRes, bRes] = await Promise.all([usuarioReq, bitacoraReq])

    if (uRes.error) throw new Error(uRes.error.message)
    if (bRes.error) throw new Error(bRes.error.message)

    return {
      success: true,
      usuario: uRes.data as UsuarioBitacora,
      entradas: (bRes.data || []) as BitacoraEntrada[],
    }
  } catch (error: any) {
    console.error("[bitacora] obtenerBitacoraDeUsuario:", error)
    return {
      success: false,
      message: error?.message || "Error obteniendo bitácora",
      usuario: null,
      entradas: [],
    }
  }
}
