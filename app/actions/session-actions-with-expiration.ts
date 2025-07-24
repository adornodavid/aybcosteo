import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Define la estructura de los datos de sesión
export interface SessionData {
  UsuarioId: string | null
  Email: string | null
  NombreCompleto: string | null
  HotelId: number | null
  RolId: number | null
  Permisos: string[] | null
  SesionActiva: boolean | null
  ExpiresAt: string | null
}

// Función para crear una sesión con expiración
export async function crearSesionConExpiracion(userData: {
  UsuarioId: string
  Email: string
  NombreCompleto: string
  HotelId: number
  RolId: number
  Permisos: string[]
}) {
  const supabase = createServerComponentClient({ cookies })
  const expirationTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hora de expiración

  cookies().set("UsuarioId", userData.UsuarioId, { expires: expirationTime, httpOnly: true, secure: true })
  cookies().set("Email", userData.Email, { expires: expirationTime, httpOnly: true, secure: true })
  cookies().set("NombreCompleto", userData.NombreCompleto, {
    expires: expirationTime,
    httpOnly: true,
    secure: true,
  })
  cookies().set("HotelId", userData.HotelId.toString(), { expires: expirationTime, httpOnly: true, secure: true })
  cookies().set("RolId", userData.RolId.toString(), { expires: expirationTime, httpOnly: true, secure: true })
  cookies().set("Permisos", JSON.stringify(userData.Permisos), {
    expires: expirationTime,
    httpOnly: true,
    secure: true,
  })
  cookies().set("SesionActiva", "true", { expires: expirationTime, httpOnly: true, secure: true })
  cookies().set("ExpiresAt", expirationTime.toISOString(), { expires: expirationTime, httpOnly: true, secure: true })
}

// Función para obtener las variables de sesión
export async function obtenerVariablesSesion(): Promise<SessionData> {
  try {
    const cookieStore = cookies()

    const UsuarioId = cookies().get("UsuarioId")?.value || null
    const Email = cookies().get("Email")?.value || null
    const NombreCompleto = cookies().get("NombreCompleto")?.value || null
    const HotelId = Number(cookies().get("HotelId")?.value) || null
    const RolId = Number(cookies().get("RolId")?.value) || null
    const SesionActiva = cookies().get("SesionActiva")?.value === "true"
    const ExpiresAt = cookies().get("ExpiresAt")?.value || null

    let Permisos: string[] | null = null
    const PermisosRaw = cookieStore.get("Permisos")?.value || null

    if (PermisosRaw) {
      const trimmedPermisosRaw = PermisosRaw.trim()
      // Verificar si la cadena parece un JSON válido antes de intentar parsear
      if (trimmedPermisosRaw.length > 0 && (trimmedPermisosRaw.startsWith("[") || trimmedPermisosRaw.startsWith("{"))) {
        try {
          Permisos = JSON.parse(trimmedPermisosRaw)
        } catch (error) {
          console.error("Error parsing permisos:", error)
          Permisos = [] // Asignar un array vacío en caso de error de parsing
        }
      } else {
        Permisos = [] // Si no parece JSON, tratar como vacío
      }
    }

    // Verificar expiración de la sesión
    let sessionExpired = false
    if (ExpiresAt) {
      const now = new Date()
      const expiry = new Date(ExpiresAt)
      if (now > expiry) {
        sessionExpired = true
        console.log("Sesión expirada.")
        await cerrarSesion() // Cerrar sesión si ha expirado
        return {
          UsuarioId: null,
          Email: null,
          NombreCompleto: null,
          HotelId: null,
          RolId: null,
          Permisos: null,
          SesionActiva: false,
          ExpiresAt: null,
        }
      }
    }

    return {
      UsuarioId,
      Email,
      NombreCompleto,
      HotelId,
      RolId,
      Permisos,
      SesionActiva: SesionActiva && !sessionExpired,
      ExpiresAt,
    }
  } catch (error) {
    console.error("Error obteniendo variables de sesión:", error)
    return {
      UsuarioId: null,
      Email: null,
      NombreCompleto: null,
      HotelId: null,
      RolId: null,
      Permisos: null,
      SesionActiva: null,
      ExpiresAt: null,
    }
  }
}

// Función para cerrar la sesión
export async function cerrarSesion() {
  cookies().delete("UsuarioId")
  cookies().delete("Email")
  cookies().delete("NombreCompleto")
  cookies().delete("HotelId")
  cookies().delete("RolId")
  cookies().delete("Permisos")
  cookies().delete("SesionActiva")
  cookies().delete("ExpiresAt")
}
