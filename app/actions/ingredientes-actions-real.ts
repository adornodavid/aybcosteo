"use server"

import { supabase } from "@/lib/supabase-real"
import { revalidatePath } from "next/cache"
import type { Ingrediente, CrearIngredienteData } from "@/lib/supabase-real"

export async function obtenerIngredientes(hotelId?: number) {
  try {
    let query = supabase
      .from("ingredientes")
      .select(`
        *,
        categoria:categoriaingredientes(id, descripcion),
        hotel:hoteles(id, nombre),
        unidadmedida:tipounidadmedida(id, descripcion)
      `)
      .order("nombre")

    if (hotelId) {
      query = query.eq("hotelid", hotelId)
    }

    const { data, error } = await query

    if (error) throw error
    return { success: true, data: data as Ingrediente[] }
  } catch (error: any) {
    console.error("Error obteniendo ingredientes:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerIngredientePorId(id: number) {
  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .select(`
        *,
        categoria:categoriaingredientes(id, descripcion),
        hotel:hoteles(id, nombre),
        unidadmedida:tipounidadmedida(id, descripcion)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return { success: true, data: data as Ingrediente }
  } catch (error: any) {
    console.error("Error obteniendo ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function crearIngrediente(ingredienteData: CrearIngredienteData) {
  try {
    const { data: ingrediente, error } = await supabase
      .from("ingredientes")
      .insert([
        {
          codigo: ingredienteData.codigo,
          nombre: ingredienteData.nombre,
          categoriaid: ingredienteData.categoriaid,
          costo: ingredienteData.costo,
          unidadmedidaid: ingredienteData.unidadmedidaid,
          hotelid: ingredienteData.hotelid,
          imgurl: ingredienteData.imgurl,
        },
      ])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/ingredientes")
    return { success: true, data: ingrediente as Ingrediente }
  } catch (error: any) {
    console.error("Error creando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarIngrediente(id: number, ingredienteData: Partial<CrearIngredienteData>) {
  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .update({
        codigo: ingredienteData.codigo,
        nombre: ingredienteData.nombre,
        categoriaid: ingredienteData.categoriaid,
        costo: ingredienteData.costo,
        unidadmedidaid: ingredienteData.unidadmedidaid,
        imgurl: ingredienteData.imgurl,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/ingredientes")
    return { success: true, data: data as Ingrediente }
  } catch (error: any) {
    console.error("Error actualizando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarIngrediente(id: number) {
  try {
    // Verificar si está siendo usado en platillos
    const { count, error: countError } = await supabase
      .from("ingredientesxplatillo")
      .select("*", { count: "exact", head: true })
      .eq("ingredienteid", id)

    if (countError) throw countError

    if (count && count > 0) {
      return {
        success: false,
        error: `No se puede eliminar el ingrediente porque está siendo usado en ${count} platillo(s)`,
      }
    }

    // Eliminar ingrediente
    const { error } = await supabase.from("ingredientes").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/ingredientes")
    return { success: true }
  } catch (error: any) {
    console.error("Error eliminando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerCategorias() {
  try {
    const { data, error } = await supabase.from("categoriaingredientes").select("*").order("descripcion")

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo categorías:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerHoteles() {
  try {
    const { data, error } = await supabase.from("hoteles").select("*").eq("activo", true).order("nombre")

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo hoteles:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerUnidadesMedida() {
  try {
    const { data, error } = await supabase.from("tipounidadmedida").select("*").order("descripcion")

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo unidades de medida:", error)
    return { success: false, error: error.message }
  }
}
