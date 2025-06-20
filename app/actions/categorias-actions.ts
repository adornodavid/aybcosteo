"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { CategoriaIngrediente, CategoriaPlatillo } from "@/lib/supabase"

// =============================================
// Categorías de Ingredientes
// =============================================

export async function obtenerCategoriasIngredientes() {
  try {
    const { data, error } = await supabase.from("CategoriaIngredientes").select("*").order("Nombre")

    if (error) throw error
    return { success: true, data: data as CategoriaIngrediente[] }
  } catch (error: any) {
    console.error("Error obteniendo categorías de ingredientes:", error)
    return { success: false, error: error.message }
  }
}

export async function crearCategoriaIngrediente(nombre: string) {
  try {
    const { data, error } = await supabase
      .from("CategoriaIngredientes")
      .insert([{ Nombre: nombre }])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/categorias")
    return { success: true, data: data as CategoriaIngrediente }
  } catch (error: any) {
    console.error("Error creando categoría de ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarCategoriaIngrediente(id: number, nombre: string) {
  try {
    const { data, error } = await supabase
      .from("CategoriaIngredientes")
      .update({
        Nombre: nombre,
        FechaActualizacion: new Date().toISOString().split("T")[0],
      })
      .eq("Categoria_Id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/categorias")
    return { success: true, data: data as CategoriaIngrediente }
  } catch (error: any) {
    console.error("Error actualizando categoría de ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarCategoriaIngrediente(id: number) {
  try {
    // Verificar si la categoría está siendo usada
    const { count, error: countError } = await supabase
      .from("Ingredientes")
      .select("*", { count: "exact", head: true })
      .eq("Categoria_id", id)

    if (countError) throw countError

    if (count && count > 0) {
      return {
        success: false,
        error: `No se puede eliminar la categoría porque está siendo usada por ${count} ingrediente(s)`,
      }
    }

    const { error } = await supabase.from("CategoriaIngredientes").delete().eq("Categoria_Id", id)

    if (error) throw error

    revalidatePath("/categorias")
    return { success: true }
  } catch (error: any) {
    console.error("Error eliminando categoría de ingrediente:", error)
    return { success: false, error: error.message }
  }
}

// =============================================
// Categorías de Platillos
// =============================================

export async function obtenerCategoriasPlatillos() {
  try {
    const { data, error } = await supabase.from("CategoriaPlatillos").select("*").order("Descripcion")

    if (error) throw error
    return { success: true, data: data as CategoriaPlatillo[] }
  } catch (error: any) {
    console.error("Error obteniendo categorías de platillos:", error)
    return { success: false, error: error.message }
  }
}

export async function crearCategoriaPlatillo(descripcion: string) {
  try {
    const { data, error } = await supabase
      .from("CategoriaPlatillos")
      .insert([{ Descripcion: descripcion }])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/categorias")
    return { success: true, data: data as CategoriaPlatillo }
  } catch (error: any) {
    console.error("Error creando categoría de platillo:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarCategoriaPlatillo(id: number, descripcion: string) {
  try {
    const { data, error } = await supabase
      .from("CategoriaPlatillos")
      .update({
        Descripcion: descripcion,
        FechaActualizacion: new Date().toISOString().split("T")[0],
      })
      .eq("CategoriaPlatillos_Id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/categorias")
    return { success: true, data: data as CategoriaPlatillo }
  } catch (error: any) {
    console.error("Error actualizando categoría de platillo:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarCategoriaPlatillo(id: number) {
  try {
    // Verificar si la categoría está siendo usada
    const { count, error: countError } = await supabase
      .from("Platillos")
      .select("*", { count: "exact", head: true })
      .eq("CategoriaPlatillo_Id", id)

    if (countError) throw countError

    if (count && count > 0) {
      return {
        success: false,
        error: `No se puede eliminar la categoría porque está siendo usada por ${count} platillo(s)`,
      }
    }

    const { error } = await supabase.from("CategoriaPlatillos").delete().eq("CategoriaPlatillos_Id", id)

    if (error) throw error

    revalidatePath("/categorias")
    return { success: true }
  } catch (error: any) {
    console.error("Error eliminando categoría de platillo:", error)
    return { success: false, error: error.message }
  }
}
