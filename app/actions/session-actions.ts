"use server"

import { cookies } from "next/headers"

export interface SessionData {
  UsuarioId: number
  Email: string
  NombreCompleto: string
  HotelId: number
  RolId: number
  Permisos: string
  SesionActiva: boolean
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = cookies()

    const usuarioId = cookieStore.get("UsuarioId")?.value
    const email = cookieStore.get("Email")?.value
    const nombreCompleto = cookieStore.get("NombreCompleto")?.value
    const hotelId = cookieStore.get("HotelId")?.value
    const rolId = cookieStore.get("RolId")?.value
    const permisos = cookieStore.get("Permisos")?.value
    const sesionActiva = cookieStore.get("SesionActiva")?.value

    if (!usuarioId || !email || sesionActiva !== "true") {
      return null
    }

    return {
      UsuarioId: Number.parseInt(usuarioId),
      Email: email,
      NombreCompleto: nombreCompleto || "",
      HotelId: Number.parseInt(hotelId || "0"),
      RolId: Number.parseInt(rolId || "0"),
      Permisos: permisos || "",
      SesionActiva: sesionActiva === "true",
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function getUserSessionData(): Promise<SessionData | null> {
  return await getSession()
}

export async function getSessionCookies(): Promise<SessionData | null> {
  return await getSession()
}

export async function clearSession(): Promise<void> {
  const cookieStore = cookies()

  cookieStore.delete("UsuarioId")
  cookieStore.delete("Email")
  cookieStore.delete("NombreCompleto")
  cookieStore.delete("HotelId")
  cookieStore.delete("RolId")
  cookieStore.delete("Permisos")
  cookieStore.delete("SesionActiva")
}

export async function validateSession(): Promise<boolean> {
  const session = await getSession()
  return session !== null && session.SesionActiva === true
}

export async function setSessionCookies(sessionData: SessionData): Promise<void> {
  const cookieStore = cookies()

  // Configurar cookies con duración de 20 días
  const cookieOptions = {
    maxAge: 20 * 24 * 60 * 60, // 20 días en segundos
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  }

  cookieStore.set("UsuarioId", sessionData.UsuarioId.toString(), cookieOptions)
  cookieStore.set("Email", sessionData.Email, cookieOptions)
  cookieStore.set("NombreCompleto", sessionData.NombreCompleto, cookieOptions)
  cookieStore.set("HotelId", sessionData.HotelId.toString(), cookieOptions)
  cookieStore.set("RolId", sessionData.RolId.toString(), cookieOptions)
  cookieStore.set("Permisos", sessionData.Permisos, cookieOptions)
  cookieStore.set("SesionActiva", sessionData.SesionActiva.toString(), cookieOptions)
}

// Nueva función para obtener variables de sesión (alias de getSession)
export const obtenerVariablesSesion = getSession
