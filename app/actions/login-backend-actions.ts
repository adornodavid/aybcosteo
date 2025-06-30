"use server"

import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"

export interface LoginResult {
  success: boolean
  message: string
  userData?: any
}

export async function procesarInicioSesion(email: string, password: string): Promise<LoginResult> {
  try {
    console.log("Iniciando proceso de login para:", email)

    // 1. Validar credenciales del usuario
    const { data: usuarios, error: errorValidacion } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .eq("activo", true)

    if (errorValidacion) {
      console.error("Error en validación:", errorValidacion)
      return {
        success: false,
        message: "Error de conexión con la base de datos",
      }
    }

    // Si no hay resultados, credenciales incorrectas
    if (!usuarios || usuarios.length === 0) {
      return {
        success: false,
        message: "El correo o el password está incorrecto, favor de verificar.",
      }
    }

    // 2. Obtener UsuarioId
    const { data: usuarioData, error: errorUsuarioId } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .single()

    if (errorUsuarioId || !usuarioData) {
      console.error("Error obteniendo UsuarioId:", errorUsuarioId)
      return {
        success: false,
        message: "Error obteniendo información del usuario",
      }
    }

    const UsuarioId = usuarioData.id

    // 3. Obtener datos completos del usuario
    const { data: datosCompletos, error: errorDatos } = await supabase
      .from("usuarios")
      .select("id, nombrecompleto, rolid")
      .eq("email", email)
      .single()

    if (errorDatos || !datosCompletos) {
      console.error("Error obteniendo datos completos:", errorDatos)
      return {
        success: false,
        message: "Error obteniendo datos del usuario",
      }
    }

    // 4. Obtener permisos del rol
    const { data: permisos, error: errorPermisos } = await supabase
      .from("permisosxrol")
      .select("permisoid")
      .eq("rolid", datosCompletos.rolid)
      .eq("activo", true)

    if (errorPermisos) {
      console.error("Error obteniendo permisos:", errorPermisos)
      return {
        success: false,
        message: "Error obteniendo permisos del usuario",
      }
    }

    // 5. Crear variables de sesión usando cookies
    const cookieStore = cookies()

    // Configurar cookies de sesión
    cookieStore.set("UsuarioId", datosCompletos.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })

    cookieStore.set("NombreCompleto", datosCompletos.nombrecompleto || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    cookieStore.set("RolId", datosCompletos.rolid?.toString() || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    cookieStore.set("Permisos", JSON.stringify(permisos?.map((p) => p.permisoid) || []), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    cookieStore.set("SesionActiva", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    console.log("Variables de sesión creadas exitosamente")

    return {
      success: true,
      message: "Validación correcta en un momento serás dirigido a la página inicial de la aplicación.",
      userData: {
        UsuarioId: datosCompletos.id,
        NombreCompleto: datosCompletos.nombrecompleto,
        RolId: datosCompletos.rolid,
        Permisos: permisos?.map((p) => p.permisoid) || [],
        SesionActiva: true,
      },
    }
  } catch (error) {
    console.error("Error en procesarInicioSesion:", error)
    return {
      success: false,
      message: "Error interno del servidor",
    }
  }
}
