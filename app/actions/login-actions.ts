"use server"

import { supabase } from "@/lib/supabase"

export interface LoginResult {
  success: boolean
  message: string
  userData?: any
}

export async function validateLoginBackend(email: string, password: string): Promise<LoginResult> {
  try {
    console.log("Validando credenciales:", { email, password })

    // Validación básica de credenciales (puedes cambiar esto por tu lógica real)
    if (email === "admin@sistema.com" && password === "123456") {
      // Ejecutar la función SQL solicitada
      const { data, error } = await supabase.rpc("obteneruarioper", { p_usuario_id: 2 })

      if (error) {
        console.error("Error ejecutando función SQL:", error)
        return {
          success: false,
          message: "Error al obtener datos del usuario",
        }
      }

      return {
        success: true,
        message: "Login exitoso",
        userData: data,
      }
    } else {
      return {
        success: false,
        message: "Credenciales incorrectas",
      }
    }
  } catch (error) {
    console.error("Error en validateLoginBackend:", error)
    return {
      success: false,
      message: "Error interno del servidor",
    }
  }
}
