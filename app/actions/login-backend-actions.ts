"use server"

import { supabase } from "@/lib/supabase"
import { setSessionCookies } from "./session-actions"
import { cerrarSesion } from "./session-actions-with-expiration" // Importar cerrarSesion
import { verifyPassword, hashPassword, isBcryptHash } from "@/lib/password"

export interface LoginResult {
  success: boolean
  message: string
  redirect?: string
}

export async function procesarInicioSesion(email: string, password: string): Promise<LoginResult> {
  try {
    // Paso 1: Buscar usuario por email + activo (sin filtrar por password — comparamos por hash en JS)
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("id, email, nombrecompleto, hotelid, rolid, cantidadaccesos, password")
      .eq("email", email)
      .eq("activo", true)
      .maybeSingle()

    if (userError) {
      console.error("Error en consulta de login:", userError)
      return {
        success: false,
        message: "Error en el servidor. Intenta nuevamente.",
      }
    }

    if (!userData) {
      return {
        success: false,
        message: "El correo o el password está incorrecto, favor de verificar.",
      }
    }

    // Paso 1.1: Validar password (soporta hash bcrypt y texto plano legacy)
    const passwordMatches = await verifyPassword(password, userData.password)
    if (!passwordMatches) {
      return {
        success: false,
        message: "El correo o el password está incorrecto, favor de verificar.",
      }
    }

    // Paso 1.2: Auto-upgrade — si el password estaba en texto plano y coincidió, hashearlo
    if (!isBcryptHash(userData.password)) {
      try {
        const newHash = await hashPassword(password)
        await supabase.from("usuarios").update({ password: newHash }).eq("id", userData.id)
      } catch (upgradeErr) {
        console.error("Error al migrar password a bcrypt (no bloquea login):", upgradeErr)
      }
    }

    // Paso 2.1: Tracking de acceso — incrementar contador y actualizar última fecha
    const nuevaCantidad = (userData.cantidadaccesos || 0) + 1
    const hoy = new Date().toISOString().split("T")[0]
    const { error: trackError } = await supabase
      .from("usuarios")
      .update({
        cantidadaccesos: nuevaCantidad,
        fechaultimoacceso: hoy,
      })
      .eq("id", userData.id)
    if (trackError) {
      console.error("Error actualizando tracking de acceso:", trackError)
      // No bloquea el login si falla
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
