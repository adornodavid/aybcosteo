"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function importarIngredientesAction(datos: any[]) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de cookies en server actions
            }
          },
        },
      }
    )

    // Mapear los datos del Excel a las columnas de la tabla cargaingredientes
    const datosFormateados = datos.map((fila) => {
      const nuevoObjeto: any = {}

      // Mapeo dinámico de columnas del Excel a la tabla
      Object.keys(fila).forEach((clave) => {
        const claveNormalizada = clave.toLowerCase().trim()
        const valor = fila[clave]

        // Mapeo de columnas posibles del Excel a la tabla cargaingredientes
        if (
          claveNormalizada.includes("mes") ||
          claveNormalizada === "mes"
        ) {
          nuevoObjeto.mes = valor ? Number.parseInt(String(valor)) : null
        } else if (
          claveNormalizada.includes("subfamilia") ||
          claveNormalizada === "subfamilia"
        ) {
          nuevoObjeto.subfamilia = valor ? String(valor) : null
        } else if (
          claveNormalizada.includes("unidad") ||
          claveNormalizada === "unidad"
        ) {
          nuevoObjeto.unidad = valor ? String(valor) : null
        } else if (
          claveNormalizada.includes("precio") ||
          claveNormalizada === "precio"
        ) {
          nuevoObjeto.precio = valor ? Number.parseFloat(String(valor)) : null
        } else if (
          claveNormalizada.includes("familia") ||
          claveNormalizada === "familia"
        ) {
          nuevoObjeto.familia = valor ? String(valor) : null
        } else if (
          claveNormalizada.includes("hotel") ||
          claveNormalizada === "hotel"
        ) {
          nuevoObjeto.hotel = valor ? String(valor) : null
        } else if (
          claveNormalizada.includes("codigorapsodia") ||
          claveNormalizada === "codigorapsodia"
        ) {
          nuevoObjeto.codigorapsodia = valor ? String(valor) : null
        } else if (
          claveNormalizada.includes("year") ||
          claveNormalizada === "year"
        ) {
          nuevoObjeto.year = valor ? Number.parseInt(String(valor)) : null
        } else if (
          claveNormalizada.includes("cantidad") ||
          claveNormalizada === "cantidad"
        ) {
          nuevoObjeto.cantidad = valor ? Number.parseFloat(String(valor)) : null
        } else if (
          claveNormalizada.includes("articulo") ||
          claveNormalizada === "articulo"
        ) {
          nuevoObjeto.articulo = valor ? String(valor) : null
        }
      })

      return nuevoObjeto
    })

    // Filtrar solo los objetos que tienen al menos un campo con valor
    const datosValidos = datosFormateados.filter(
      (obj) => Object.keys(obj).length > 0
    )

    if (datosValidos.length === 0) {
      throw new Error("No hay datos válidos para importar")
    }

    // Realizar el INSERT a la tabla cargaingredientes
    const { data, error } = await supabase
      .from("cargaingredientes")
      .insert(datosValidos)
      .select()

    if (error) {
      throw new Error(`Error al importar: ${error.message}`)
    }

    return {
      success: true,
      message: `Se importaron ${data?.length || 0} registros correctamente`,
      recordsInserted: data?.length || 0,
    }
  } catch (error: any) {
    console.error("[v0] Error en importarIngredientesAction:", error)
    return {
      success: false,
      message: error.message || "Error al importar los datos",
      recordsInserted: 0,
    }
  }
}

export async function verificarYObtenerConteo() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de cookies en server actions
            }
          },
        },
      }
    )

    const { count, error } = await supabase
      .from("cargaingredientes")
      .select("*", { count: "exact", head: true })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      hasData: count && count > 0,
      count: count || 0,
    }
  } catch (error: any) {
    console.error("[v0] Error en verificarYObtenerConteo:", error)
    return {
      success: false,
      hasData: false,
      count: 0,
    }
  }
}

export async function limpiarCargaIngredientes() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de cookies en server actions
            }
          },
        },
      }
    )

    const { error } = await supabase
      .from("cargaingredientes")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      message: "Datos eliminados correctamente",
    }
  } catch (error: any) {
    console.error("[v0] Error en limpiarCargaIngredientes:", error)
    return {
      success: false,
      message: error.message || "Error al eliminar los datos",
    }
  }
}
