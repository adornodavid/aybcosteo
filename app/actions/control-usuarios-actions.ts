"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface UsuarioControl {
  id: number
  nombrecompleto: string
  email: string
  rolid: number | null
  rolNombre: string
  hotelid: number | null
  hotelNombre: string
  activo: boolean
  fechacreacion: string | null
  fechaultimoacceso: string | null
  cantidadaccesos: number
  imgurl: string | null
}

export async function obtenerControlUsuarios(): Promise<{
  success: boolean
  data: UsuarioControl[]
  error?: string
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .select(
        `
        id,
        nombrecompleto,
        email,
        rolid,
        hotelid,
        activo,
        fechacreacion,
        fechaultimoacceso,
        cantidadaccesos,
        imgurl,
        roles(nombre),
        hoteles(nombre)
      `,
      )
      .order("cantidadaccesos", { ascending: false })

    if (error) {
      console.error("Error obteniendo control de usuarios:", error)
      return { success: false, data: [], error: error.message }
    }

    const usuarios: UsuarioControl[] =
      (data || []).map((u: any) => ({
        id: u.id,
        nombrecompleto: u.nombrecompleto || "Sin nombre",
        email: u.email || "Sin email",
        rolid: u.rolid,
        rolNombre: u.roles?.nombre || "Sin rol",
        hotelid: u.hotelid,
        hotelNombre: u.hoteles?.nombre || "Sin hotel",
        activo: u.activo === true,
        fechacreacion: u.fechacreacion || null,
        fechaultimoacceso: u.fechaultimoacceso || null,
        cantidadaccesos: u.cantidadaccesos || 0,
        imgurl: u.imgurl || null,
      })) || []

    return { success: true, data: usuarios }
  } catch (error: any) {
    console.error("Error obteniendo control de usuarios:", error)
    return { success: false, data: [], error: error.message }
  }
}
