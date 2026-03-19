"use server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { revalidatePath } from "next/cache"

function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle cookies errors in Server Actions
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // Handle cookies errors in Server Actions
        }
      },
    },
  })
}

export async function crearIngrediente(prevState: any, formData: FormData) {
  try {
    const clave = formData.get("clave") as string
    const descripcion = formData.get("descripcion") as string
    const categoria_id = formData.get("categoria_id") as string
    const tipo = formData.get("tipo") as string
    const unidad_medida_id = formData.get("unidad_medida_id") as string
    const cantidad_por_presentacion = formData.get("cantidad_por_presentacion") as string
    const conversion = formData.get("conversion") as string

    if (!clave || clave.trim() === "") {
      return { success: false, error: "La clave del ingrediente es requerida." }
    }
    if (!descripcion || descripcion.trim() === "") {
      return { success: false, error: "La descripción del ingrediente es requerida." }
    }
    if (!categoria_id || categoria_id.trim() === "") {
      return { success: false, error: "La categoría es requerida." }
    }
    if (!unidad_medida_id || unidad_medida_id.trim() === "") {
      return { success: false, error: "La unidad de medida es requerida." }
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("ingredientes")
      .insert({
        clave: clave.trim(),
        descripcion: descripcion.trim(),
        categoria_id: Number(categoria_id),
        tipo: tipo.trim(),
        unidad_medida_id: Number(unidad_medida_id),
        cantidad_por_presentacion: Number(cantidad_por_presentacion),
        conversion: Number(conversion),
        activo: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error al crear ingrediente:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/ingredientes")
    return { success: true, message: `Ingrediente "${descripcion}" creado exitosamente.`, data }
  } catch (error: any) {
    console.error("Error en crearIngrediente:", error)
    return { success: false, error: `Error al crear ingrediente: ${error.message}` }
  }
}

export async function obtenerIngredientes() {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .select("*, categorias(nombre), unidades_medida(nombre)")
      .eq("activo", true)
      .order("descripcion")

    if (error) {
      console.error("Error obteniendo ingredientes:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error en obtenerIngredientes:", error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function actualizarIngrediente(id: number, prevState: any, formData: FormData) {
  try {
    const clave = formData.get("clave") as string
    const descripcion = formData.get("descripcion") as string
    const categoria_id = formData.get("categoria_id") as string
    const tipo = formData.get("tipo") as string
    const unidad_medida_id = formData.get("unidad_medida_id") as string
    const cantidad_por_presentacion = formData.get("cantidad_por_presentacion") as string
    const conversion = formData.get("conversion") as string

    if (!clave || clave.trim() === "") {
      return { success: false, error: "La clave del ingrediente es requerida." }
    }
    if (!descripcion || descripcion.trim() === "") {
      return { success: false, error: "La descripción del ingrediente es requerida." }
    }
    if (!categoria_id || categoria_id.trim() === "") {
      return { success: false, error: "La categoría es requerida." }
    }
    if (!unidad_medida_id || unidad_medida_id.trim() === "") {
      return { success: false, error: "La unidad de medida es requerida." }
    }

    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from("ingredientes")
      .update({
        clave: clave.trim(),
        descripcion: descripcion.trim(),
        categoria_id: Number(categoria_id),
        tipo: tipo.trim(),
        unidad_medida_id: Number(unidad_medida_id),
        cantidad_por_presentacion: Number(cantidad_por_presentacion),
        conversion: Number(conversion),
      })
      .eq("id", id)

    if (error) {
      console.error("Error al actualizar ingrediente:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/ingredientes")
    return { success: true, message: `Ingrediente "${descripcion}" actualizado exitosamente.` }
  } catch (error: any) {
    console.error("Error en actualizarIngrediente:", error)
    return { success: false, error: `Error al actualizar ingrediente: ${error.message}` }
  }
}

export async function eliminarIngrediente(id: number) {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from("ingredientes").update({ activo: false }).eq("id", id)

    if (error) {
      console.error("Error al eliminar ingrediente:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/ingredientes")
    return { success: true, message: "Ingrediente eliminado exitosamente." }
  } catch (error: any) {
    console.error("Error en eliminarIngrediente:", error)
    return { success: false, error: `Error al eliminar ingrediente: ${error.message}` }
  }
}
