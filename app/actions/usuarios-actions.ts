"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { hashPassword } from "@/lib/password"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface UsuarioRow {
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

export interface UsuarioDetalle {
  id: number
  nombrecompleto: string
  email: string
  rolid: number | null
  hotelid: number | null
  activo: boolean
  fechacreacion: string | null
  fechaultimoacceso: string | null
  cantidadaccesos: number
  imgurl: string | null
}

export interface Rol {
  id: number
  nombre: string
}

export interface HotelItem {
  value: string
  text: string
  activo: boolean
}

export async function obtenerUsuarios(
  busqueda = "",
  rolid = -1,
  activo = "Todos",
  hotelid = -1,
): Promise<{ success: boolean; data: UsuarioRow[]; error?: string }> {
  try {
    let query = supabaseAdmin
      .from("usuarios")
      .select(
        `id, nombrecompleto, email, rolid, hotelid, activo, fechacreacion, fechaultimoacceso, cantidadaccesos, imgurl,
         roles(nombre), hoteles(nombre)`,
      )
      .order("nombrecompleto", { ascending: true })

    if (busqueda.trim() !== "") {
      query = query.or(`nombrecompleto.ilike.%${busqueda}%,email.ilike.%${busqueda}%`)
    }
    if (rolid !== -1) query = query.eq("rolid", rolid)
    if (hotelid !== -1) query = query.eq("hotelid", hotelid)
    if (activo === "Activo") query = query.eq("activo", true)
    else if (activo === "Inactivo") query = query.eq("activo", false)

    const { data, error } = await query
    if (error) return { success: false, data: [], error: error.message }

    const usuarios: UsuarioRow[] = (data || []).map((u: any) => ({
      id: u.id,
      nombrecompleto: u.nombrecompleto || "Sin nombre",
      email: u.email || "",
      rolid: u.rolid,
      rolNombre: u.roles?.nombre || "Sin rol",
      hotelid: u.hotelid,
      hotelNombre: u.hoteles?.nombre || "Sin hotel",
      activo: u.activo === true,
      fechacreacion: u.fechacreacion,
      fechaultimoacceso: u.fechaultimoacceso,
      cantidadaccesos: u.cantidadaccesos || 0,
      imgurl: u.imgurl,
    }))

    return { success: true, data: usuarios }
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || "Error desconocido" }
  }
}

export async function obtenerUsuarioDetalle(
  id: number,
): Promise<{ success: boolean; data: UsuarioDetalle | null; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .select(
        "id, nombrecompleto, email, rolid, hotelid, activo, fechacreacion, fechaultimoacceso, cantidadaccesos, imgurl",
      )
      .eq("id", id)
      .maybeSingle()

    if (error) return { success: false, data: null, error: error.message }
    if (!data) return { success: false, data: null, error: "Usuario no encontrado" }

    return { success: true, data: data as UsuarioDetalle }
  } catch (err: any) {
    return { success: false, data: null, error: err?.message || "Error desconocido" }
  }
}

export async function validarEmailUnico(
  email: string,
  excluirId = 0,
): Promise<{ success: boolean; existe: boolean; error?: string }> {
  try {
    if (!email || email.trim().length < 3) {
      return { success: false, existe: false, error: "El email debe tener al menos 3 caracteres" }
    }
    let query = supabaseAdmin.from("usuarios").select("id").eq("email", email.trim())
    if (excluirId > 0) query = query.neq("id", excluirId)
    const { data, error } = await query.maybeSingle()
    if (error) return { success: false, existe: false, error: error.message }
    return { success: true, existe: !!data }
  } catch (err: any) {
    return { success: false, existe: false, error: err?.message || "Error desconocido" }
  }
}

export async function obtenerRoles(): Promise<{ success: boolean; data: Rol[]; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.from("roles").select("id, nombre").order("id", { ascending: true })
    if (error) return { success: false, data: [], error: error.message }
    return { success: true, data: (data || []) as Rol[] }
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || "Error desconocido" }
  }
}

export async function listaDesplegableHoteles(
  soloActivos = true,
): Promise<{ success: boolean; data: HotelItem[]; error?: string }> {
  try {
    let query = supabaseAdmin.from("hoteles").select("id, nombre, activo").order("nombre", { ascending: true })
    if (soloActivos) query = query.eq("activo", true)
    const { data, error } = await query
    if (error) return { success: false, data: [], error: error.message }
    const items: HotelItem[] = (data || []).map((h: any) => ({
      value: String(h.id),
      text: h.nombre || `Hotel ${h.id}`,
      activo: !!h.activo,
    }))
    return { success: true, data: items }
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || "Error desconocido" }
  }
}

export async function crearUsuario(
  formData: FormData,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const nombrecompleto = (formData.get("nombrecompleto") as string)?.trim()
    const email = (formData.get("email") as string)?.trim()
    const password = formData.get("password") as string
    const rolidRaw = formData.get("rolid") as string
    const hotelidRaw = formData.get("hotelid") as string
    const activoRaw = formData.get("activo") as string

    if (!nombrecompleto) return { success: false, error: "El nombre completo es requerido" }
    if (!email) return { success: false, error: "El email es requerido" }
    if (!password) return { success: false, error: "La contraseña es requerida" }
    const rolid = Number(rolidRaw)
    if (!rolid || isNaN(rolid)) return { success: false, error: "El rol es requerido" }

    const validacion = await validarEmailUnico(email)
    if (!validacion.success) return { success: false, error: validacion.error }
    if (validacion.existe) return { success: false, error: "Ya existe un usuario con ese email" }

    const passwordHash = await hashPassword(password)
    const hotelid = hotelidRaw && hotelidRaw.trim() !== "" ? Number(hotelidRaw) : null
    const activo = activoRaw === "false" ? false : true
    const fecha = new Date().toISOString().split("T")[0]

    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .insert({
        nombrecompleto,
        email,
        password: passwordHash,
        rolid,
        hotelid,
        activo,
        fechacreacion: fecha,
        cantidadaccesos: 0,
      })
      .select("id")
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/usuarios")
    return { success: true, data: data.id }
  } catch (err: any) {
    return { success: false, error: err?.message || "Error desconocido" }
  }
}

export async function actualizarInfoBasicaUsuario(
  id: number,
  nombrecompleto: string,
  hotelid: number | null,
  activo: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!nombrecompleto.trim()) return { success: false, error: "El nombre completo es requerido" }
    const { error } = await supabaseAdmin
      .from("usuarios")
      .update({ nombrecompleto: nombrecompleto.trim(), hotelid, activo })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/usuarios")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Error desconocido" }
  }
}

export async function actualizarAccesoUsuario(
  id: number,
  email: string,
  rolid: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!email.trim()) return { success: false, error: "El email es requerido" }
    if (!rolid) return { success: false, error: "El rol es requerido" }

    const validacion = await validarEmailUnico(email, id)
    if (!validacion.success) return { success: false, error: validacion.error }
    if (validacion.existe) return { success: false, error: "Ya existe otro usuario con ese email" }

    const { error } = await supabaseAdmin
      .from("usuarios")
      .update({ email: email.trim(), rolid })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/usuarios")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Error desconocido" }
  }
}

export async function actualizarPasswordUsuario(
  id: number,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!password.trim()) return { success: false, error: "La contraseña no puede estar vacía" }
    const passwordHash = await hashPassword(password)
    const { error } = await supabaseAdmin.from("usuarios").update({ password: passwordHash }).eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Error desconocido" }
  }
}

export async function cambiarEstatusUsuario(
  id: number,
  activo: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.from("usuarios").update({ activo }).eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/usuarios")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Error desconocido" }
  }
}
