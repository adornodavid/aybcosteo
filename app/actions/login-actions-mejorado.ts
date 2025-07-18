import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type SessionData, setSessionCookies, clearSession } from "./session-actions"
import type { Database } from "@/lib/types-sistema-costeo"

export async function obtenerVariablesSesion(): Promise<SessionData> {
  const supabase = createServerComponentClient<Database>({ cookies })

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error obteniendo sesión de Supabase:", sessionError.message)
      return { SesionActiva: "false", RolId: "0", HotelId: "0", UsuarioId: "0" }
    }

    if (!sessionData?.session) {
      console.log("No hay sesión activa.")
      return { SesionActiva: "false", RolId: "0", HotelId: "0", UsuarioId: "0" }
    }

    const user = sessionData.session.user
    const usuarioId = user.id

    // Obtener rol_id y hotel_id del perfil del usuario
    const { data: profileData, error: profileError } = await supabase
      .from("usuarios")
      .select("rol_id, usuario_hoteles(hotel_id)")
      .eq("id", usuarioId)
      .single()

    if (profileError) {
      console.error("Error obteniendo perfil del usuario:", profileError.message)
      return { SesionActiva: "false", RolId: "0", HotelId: "0", UsuarioId: "0" }
    }

    const rolId = profileData?.rol_id?.toString() || "0"
    const hotelId = profileData?.usuario_hoteles?.[0]?.hotel_id?.toString() || "0"

    return {
      SesionActiva: "true",
      RolId: rolId,
      HotelId: hotelId,
      UsuarioId: usuarioId,
    }
  } catch (error: any) {
    console.error("Error inesperado en obtenerVariablesSesion:", error.message)
    return { SesionActiva: "false", RolId: "0", HotelId: "0", UsuarioId: "0" }
  }
}

export async function procesarInicioSesion(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = createServerComponentClient<Database>({ cookies })

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Error de inicio de sesión:", error.message)
      return { success: false, message: error.message }
    }

    if (data.user) {
      // Obtener rol_id y hotel_id del perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from("usuarios")
        .select("rol_id, usuario_hoteles(hotel_id)")
        .eq("id", data.user.id)
        .single()

      if (profileError) {
        console.error("Error obteniendo perfil del usuario después del login:", profileError.message)
        return { success: false, message: "Error al obtener información del usuario." }
      }

      const sessionData: SessionData = {
        SesionActiva: "true",
        RolId: profileData?.rol_id?.toString() || "0",
        HotelId: profileData?.usuario_hoteles?.[0]?.hotel_id?.toString() || "0",
        UsuarioId: data.user.id,
      }

      await setSessionCookies(sessionData)
      return { success: true, message: "Inicio de sesión exitoso." }
    } else {
      return { success: false, message: "Credenciales inválidas." }
    }
  } catch (e: any) {
    console.error("Excepción en procesarInicioSesion:", e)
    return { success: false, message: e.message || "Error desconocido al iniciar sesión." }
  }
}

export async function logout() {
  const supabase = createServerComponentClient<Database>({ cookies })
  try {
    await supabase.auth.signOut()
    await clearSession()
    return { success: true, message: "Sesión cerrada correctamente." }
  } catch (error: any) {
    console.error("Error al cerrar sesión:", error.message)
    return { success: false, message: "Error al cerrar sesión." }
  }
}
