"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Inicializar el cliente Supabase con la clave de servicio para operaciones de administrador
const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Función para obtener todas las categorías de 'categoriaingredientes'
export async function obtenerCategorias() {
  try {
    const { data, error } = await supabaseAdmin
      .from("categoriaingredientes")
      .select("*") // Seleccionar todas las columnas como solicitaste
      .order("descripcion")

    if (error) {
      console.error("Error al obtener categorías:", error.message)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (e: any) {
    console.error("Excepción al obtener categorías:", e.message)
    return { data: null, error: e.message }
  }
}

// Función para crear una nueva categoría
export async function crearCategoria(prevState: any, formData: FormData) {
  try {
    const descripcion = formData.get("descripcion") as string

    if (!descripcion || descripcion.trim() === "") {
      return { success: false, error: "La descripción de la categoría es requerida." }
    }

    const { data, error } = await supabaseAdmin
      .from("categoriaingredientes")
      .insert({ descripcion: descripcion.trim(), activo: true }) // Asumiendo 'activo' existe y se inicializa en true
      .select()
      .single()

    if (error) {
      console.error("Error al crear categoría:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/categorias")
    return { success: true, message: `Categoría "${descripcion}" creada exitosamente.`, data }
  } catch (error: any) {
    console.error("Error en crearCategoria:", error)
    return { success: false, error: `Error al crear categoría: ${error.message}` }
  }
}

// Función para actualizar una categoría existente
export async function actualizarCategoria(id: number, prevState: any, formData: FormData) {
  try {
    const descripcion = formData.get("descripcion") as string

    if (!descripcion || descripcion.trim() === "") {
      return { success: false, error: "La descripción de la categoría es requerida." }
    }

    const { error } = await supabaseAdmin
      .from("categoriaingredientes")
      .update({ descripcion: descripcion.trim() })
      .eq("id", id)

    if (error) {
      console.error("Error al actualizar categoría:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/categorias")
    return { success: true, message: `Categoría "${descripcion}" actualizada exitosamente.` }
  } catch (error: any) {
    console.error("Error en actualizarCategoria:", error)
    return { success: false, error: `Error al actualizar categoría: ${error.message}` }
  }
}

// Función para eliminar una categoría (borrado lógico)
export async function eliminarCategoria(id: number) {
  try {
    // Asumiendo que 'activo' es una columna para un borrado lógico
    const { error } = await supabaseAdmin.from("categoriaingredientes").update({ activo: false }).eq("id", id)

    if (error) {
      console.error("Error al eliminar categoría:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/categorias")
    return { success: true, message: "Categoría eliminada exitosamente." }
  } catch (error: any) {
    console.error("Error en eliminarCategoria:", error)
    return { success: false, error: `Error al eliminar categoría: ${error.message}` }
  }
}
