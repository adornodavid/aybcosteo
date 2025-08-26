"use server"

/* ==================================================
  Imports
================================================== */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

/* ==================================================
  Interfaces, clases, objetos
================================================== */
export interface LoginResult {
  success: boolean
  message: string
  user?: any
}

/* ==================================================
	  Conexion a la base de datos: Supabase
	================================================== */
const supabase = createClientComponentClient()

/* ==================================================
  Variables (especiales, constantes)
================================================== */

/* ==================================================
  Funciones
  --------------------
  * CREATES-CREAR (INSERTS)
    - insXXXXX
  * READS-OBTENER (SELECTS)
    - selXXXXX
  * UPDATES-ACTUALIZAR (UPDATES)
    - updXXXXX
  * DELETES-ELIMINAR (DELETES)
    - delXXXXX
  * SPECIALS-ESPECIALES ()
    - loginUser
    - logoutUser
================================================== */
export async function loginUser(formData: FormData): Promise<LoginResult> {
  try {
    const email = formData.get("txtCorreo") as string
    const password = formData.get("txtPassword") as string

    if (!email || !password) {
      return {
        success: false,
        message: "Por favor ingrese correo y contraseña",
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      return {
        success: false,
        message: "Credenciales incorrectas. Verifique su correo y contraseña.",
      }
    }

    return {
      success: true,
      message: "Inicio de sesión exitoso",
      user: data.user,
    }
  } catch (error) {
    console.error("Error en login:", error)
    return {
      success: false,
      message: "Error interno del servidor. Intente nuevamente.",
    }
  }
}

export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error al cerrar sesión:", error)
    }
    redirect("/login")
  } catch (error) {
    console.error("Error en logout:", error)
    redirect("/login")
  }
}
