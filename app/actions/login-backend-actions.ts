"use server"

import { supabase } from "@/lib/supabase"
import { setSessionCookies } from "./session-actions"
import { cerrarSesion } from "./session-actions-with-expiration" // Importar cerrarSesion

export interface LoginResult {
  success: boolean
  message: string
  redirect?: string
}

export async function procesarInicioSesion(email: string, password: string): Promise<LoginResult> {
  try {
    // Paso 1: Validar credenciales
    const { data: usuarios, error: loginError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .eq("activo", true)

    if (loginError) {
      console.error("Error en consulta de login:", loginError)
      return {
        success: false,
        message: "Error en el servidor. Intenta nuevamente.",
      }
    }

    if (!usuarios || usuarios.length === 0) {
      return {
        success: false,
        message: "El correo o el password está incorrecto, favor de verificar.",
      }
    }

    // Paso 2: Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("id, email, nombrecompleto, hotelid, rolid")
      .eq("email", email)
      .single()

    if (userError || !userData) {
      console.error("Error obteniendo datos del usuario:", userError)
      return {
        success: false,
        message: "Error obteniendo datos del usuario.",
      }
    }

    // Paso 3: Obtener permisos del rol
    const { data: permisos, error: permisosError } = await supabase
      .from("permisosxrol")
      .select("permisoid")
      .eq("rolid", userData.rolid)
      .eq("activo", true)

    if (permisosError) {
      console.error("Error obteniendo permisos:", permisosError)
    }

    // Crear string de permisos separados por |
    const permisosString = permisos?.map((p) => p.permisoid).join("|") || ""

    // Paso 4: Crear cookies de sesión
    await setSessionCookies({
      UsuarioId: userData.id,
      Email: userData.email,
      NombreCompleto: userData.nombrecompleto || "",
      HotelId: userData.hotelid || 0,
      RolId: userData.rolid || 0,
      Permisos: permisosString,
      SesionActiva: true,
    })

    return {
      success: true,
      message: "Validación correcta en un momento serás dirigido a la página inicial de la aplicación.",
      redirect: "/dashboard",
    }
  } catch (error) {
    console.error("Error en procesarInicioSesion:", error)
    return {
      success: false,
      message: "Error inesperado. Intenta nuevamente.",
    }
  }
}

// Nueva función para cerrar sesión
export async function logout(): Promise<void> {
  await cerrarSesion()
}
