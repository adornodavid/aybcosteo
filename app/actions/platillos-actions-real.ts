"use server"

import { supabase } from "@/lib/supabase-real"
import { revalidatePath } from "next/cache"
import type { Platillo, CrearPlatilloData } from "@/lib/supabase-real"

export async function obtenerPlatillos(restauranteId?: number) {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .select(`
        *,
        ingredientes:ingredientesxplatillo(
          id,
          cantidad,
          unidadmedida,
          costo,
          ingrediente:ingredientes(
            id,
            codigo,
            nombre,
            costo,
            categoria:categoriaingredientes(descripcion)
          )
        )
      `)
      .eq("activo", true)
      .order("nombre")

    if (error) throw error
    return { success: true, data: data as Platillo[] }
  } catch (error: any) {
    console.error("Error obteniendo platillos:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerPlatilloPorId(id: number) {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .select(`
        *,
        ingredientes:ingredientesxplatillo(
          id,
          cantidad,
          unidadmedida,
          costo,
          ingrediente:ingredientes(
            id,
            codigo,
            nombre,
            costo,
            categoria:categoriaingredientes(descripcion)
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return { success: true, data: data as Platillo }
  } catch (error: any) {
    console.error("Error obteniendo platillo:", error)
    return { success: false, error: error.message }
  }
}

export async function crearPlatillo(platilloData: CrearPlatilloData) {
  try {
    // Calcular costo total
    const costoTotal = platilloData.ingredientes.reduce((sum, ing) => {
      return sum + ing.cantidad * 0 // Necesitamos obtener el costo del ingrediente
    }, 0)

    // 1. Crear el platillo
    const { data: platillo, error: platilloError } = await supabase
      .from("platillos")
      .insert([
        {
          nombre: platilloData.nombre,
          descripcion: platilloData.descripcion,
          instrucciones: platilloData.instrucciones,
          costo: costoTotal,
          activo: true,
          imgurl: platilloData.imgurl,
        },
      ])
      .select()
      .single()

    if (platilloError) throw platilloError

    // 2. Agregar ingredientes
    if (platilloData.ingredientes.length > 0) {
      const ingredientesParaInsertar = platilloData.ingredientes.map((ing) => ({
        platilloid: platillo.id,
        ingredienteid: ing.ingredienteid,
        cantidad: ing.cantidad,
        unidadmedida: ing.unidadmedida,
        costo: 0, // Calcular basado en el costo del ingrediente
      }))

      const { error: ingredientesError } = await supabase.from("ingredientesxplatillo").insert(ingredientesParaInsertar)

      if (ingredientesError) throw ingredientesError
    }

    revalidatePath("/platillos")
    return { success: true, data: platillo as Platillo }
  } catch (error: any) {
    console.error("Error creando platillo:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarPlatillo(id: number, platilloData: Partial<CrearPlatilloData>) {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .update({
        nombre: platilloData.nombre,
        descripcion: platilloData.descripcion,
        instrucciones: platilloData.instrucciones,
        imgurl: platilloData.imgurl,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/platillos")
    return { success: true, data: data as Platillo }
  } catch (error: any) {
    console.error("Error actualizando platillo:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarPlatillo(id: number) {
  try {
    // Eliminar ingredientes del platillo primero
    await supabase.from("ingredientesxplatillo").delete().eq("platilloid", id)

    // Eliminar platillo
    const { error } = await supabase.from("platillos").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/platillos")
    return { success: true }
  } catch (error: any) {
    console.error("Error eliminando platillo:", error)
    return { success: false, error: error.message }
  }
}
