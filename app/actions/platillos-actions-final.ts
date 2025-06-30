"use server"

import { supabase } from "@/lib/supabase-final"
import { revalidatePath } from "next/cache"
import type { Platillo, CrearPlatilloData } from "@/lib/supabase-final"

export async function obtenerPlatillos() {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .select(`
        *,
        ingredientes:ingredientesxplatillo(
          id,
          cantidad,
          ingredientecostoparcial,
          ingrediente:ingredientes(
            id,
            codigo,
            nombre,
            costo,
            categoria:categoriaingredientes(descripcion)
          )
        ),
        recetas:recetasxplatillo(
          id,
          cantidad,
          receta:recetas(
            id,
            nombre,
            notaspreparacion
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
          ingredientecostoparcial,
          ingrediente:ingredientes(
            id,
            codigo,
            nombre,
            costo,
            categoria:categoriaingredientes(descripcion)
          )
        ),
        recetas:recetasxplatillo(
          id,
          cantidad,
          receta:recetas(
            id,
            nombre,
            notaspreparacion
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
    // 1. Calcular costo total basado en ingredientes
    let costoTotal = 0

    if (platilloData.ingredientes.length > 0) {
      for (const ing of platilloData.ingredientes) {
        const { data: ingrediente } = await supabase
          .from("ingredientes")
          .select("costo")
          .eq("id", ing.ingredienteid)
          .single()

        if (ingrediente?.costo) {
          costoTotal += ingrediente.costo * ing.cantidad
        }
      }
    }

    // 2. Crear el platillo
    const { data: platillo, error: platilloError } = await supabase
      .from("platillos")
      .insert([
        {
          nombre: platilloData.nombre,
          descripcion: platilloData.descripcion,
          instruccionespreparacion: platilloData.instruccionespreparacion,
          tiempopreparacion: platilloData.tiempopreparacion,
          costototal: costoTotal,
          imgurl: platilloData.imgurl,
          activo: true,
          fechacreacion: new Date().toISOString().split("T")[0],
        },
      ])
      .select()
      .single()

    if (platilloError) throw platilloError

    // 3. Agregar ingredientes
    if (platilloData.ingredientes.length > 0) {
      const ingredientesParaInsertar = await Promise.all(
        platilloData.ingredientes.map(async (ing) => {
          const { data: ingrediente } = await supabase
            .from("ingredientes")
            .select("costo")
            .eq("id", ing.ingredienteid)
            .single()

          const costoParcial = (ingrediente?.costo || 0) * ing.cantidad

          return {
            platilloid: platillo.id,
            ingredienteid: ing.ingredienteid,
            cantidad: ing.cantidad,
            ingredientecostoparcial: costoParcial,
            activo: true,
            fechacreacion: new Date().toISOString().split("T")[0],
          }
        }),
      )

      const { error: ingredientesError } = await supabase.from("ingredientesxplatillo").insert(ingredientesParaInsertar)

      if (ingredientesError) throw ingredientesError
    }

    // 4. Agregar recetas
    if (platilloData.recetas.length > 0) {
      const recetasParaInsertar = platilloData.recetas.map((rec) => ({
        platilloid: platillo.id,
        recetaid: rec.recetaid,
        cantidad: rec.cantidad,
        activo: true,
        fechacreacion: new Date().toISOString().split("T")[0],
      }))

      const { error: recetasError } = await supabase.from("recetasxplatillo").insert(recetasParaInsertar)

      if (recetasError) throw recetasError
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
        instruccionespreparacion: platilloData.instruccionespreparacion,
        tiempopreparacion: platilloData.tiempopreparacion,
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
    // Soft delete - cambiar activo a false
    const { error } = await supabase.from("platillos").update({ activo: false }).eq("id", id)

    if (error) throw error

    // También desactivar relaciones
    await supabase.from("ingredientesxplatillo").update({ activo: false }).eq("platilloid", id)

    await supabase.from("recetasxplatillo").update({ activo: false }).eq("platilloid", id)

    revalidatePath("/platillos")
    return { success: true }
  } catch (error: any) {
    console.error("Error eliminando platillo:", error)
    return { success: false, error: error.message }
  }
}
