"use server"

import { cookies } from "next/headers"

export interface SessionData {
  UsuarioId: string | null
  Email: string | null
  NombreCompleto: string | null
  HotelId: string | null
  RolId: string | null
  Permisos: string[] | null
  SesionActiva: string | null
}

export async function obtenerVariablesSesion(): Promise<SessionData> {
  try {
    const cookieStore = cookies()

    // Obtener todas las variables de sesión de las cookies
    const UsuarioId = cookieStore.get("UsuarioId")?.value || null
    const Email = cookieStore.get("Email")?.value || null
    const NombreCompleto = cookieStore.get("NombreCompleto")?.value || null
    const HotelId = cookieStore.get("HotelId")?.value || null
    const RolId = cookieStore.get("RolId")?.value || null
    const PermisosRaw = cookieStore.get("Permisos")?.value || null
    const SesionActiva = cookieStore.get("SesionActiva")?.value || null

    // Parsear permisos si existen
    let Permisos: string[] | null = null
    if (PermisosRaw) {
      try {
        Permisos = JSON.parse(PermisosRaw)
      } catch (error) {
        console.error("Error parsing permisos:", error)
        Permisos = []
      }
    }

    console.log("Variables de sesión obtenidas:", {
      UsuarioId,
      Email,
      NombreCompleto,
      HotelId,
      RolId,
      Permisos,
      SesionActiva,
    })

    return {
      UsuarioId,
      Email,
      NombreCompleto,
      HotelId,
      RolId,
      Permisos,
      SesionActiva,
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
    }
  }
}
