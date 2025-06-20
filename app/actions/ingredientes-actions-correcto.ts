"use server"

import { supabase } from "@/lib/supabase-correcto"
import { revalidatePath } from "next/cache"
import type { Ingrediente, CrearIngredienteData } from "@/lib/supabase-correcto"

export async function obtenerIngredientes(restauranteId?: string) {
  try {
    let query = supabase
      .from("ingredientes")
      .select(`
        *,
        categoria:categorias(id, nombre, descripcion),
        restaurante:restaurantes(id, nombre),
        precio_actual:precios_unitarios!inner(precio, fecha_inicio)
      `)
      .eq("precios_unitarios.fecha_fin", null)
      .order("descripcion")

    if (restauranteId) {
      query = query.eq("restaurante_id", restauranteId)
    }

    const { data, error } = await query

    if (error) throw error
    return { success: true, data: data as Ingrediente[] }
  } catch (error: any) {
    console.error("Error obteniendo ingredientes:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerIngredientePorId(id: string) {
  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .select(`
        *,
        categoria:categorias(id, nombre, descripcion),
        restaurante:restaurantes(id, nombre),
        precio_actual:precios_unitarios!inner(precio, fecha_inicio, fecha_fin)
      `)
      .eq("id", id)
      .eq("precios_unitarios.fecha_fin", null)
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
    // 1. Crear el ingrediente
    const { data: ingrediente, error: ingredienteError } = await supabase
      .from("ingredientes")
      .insert([
        {
          clave: ingredienteData.clave,
          descripcion: ingredienteData.descripcion,
          categoria_id: ingredienteData.categoria_id,
          status: ingredienteData.status || "activo",
          tipo: ingredienteData.tipo,
          unidad_medida: ingredienteData.unidad_medida,
          cantidad_por_presentacion: ingredienteData.cantidad_por_presentacion || 1.0,
          conversion: ingredienteData.conversion,
          restaurante_id: ingredienteData.restaurante_id,
        },
      ])
      .select()
      .single()

    if (ingredienteError) throw ingredienteError

    // 2. Crear el precio inicial
    const { error: precioError } = await supabase.from("precios_unitarios").insert([
      {
        ingrediente_id: ingrediente.id,
        precio: ingredienteData.precio_inicial,
        fecha_inicio: new Date().toISOString().split("T")[0],
      },
    ])

    if (precioError) throw precioError

    revalidatePath("/ingredientes")
    return { success: true, data: ingrediente as Ingrediente }
  } catch (error: any) {
    console.error("Error creando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarIngrediente(id: string, ingredienteData: Partial<CrearIngredienteData>) {
  try {
    const updateData = {
      clave: ingredienteData.clave,
      descripcion: ingredienteData.descripcion,
      categoria_id: ingredienteData.categoria_id,
      status: ingredienteData.status,
      tipo: ingredienteData.tipo,
      unidad_medida: ingredienteData.unidad_medida,
      cantidad_por_presentacion: ingredienteData.cantidad_por_presentacion,
      conversion: ingredienteData.conversion,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("ingredientes").update(updateData).eq("id", id).select().single()

    if (error) throw error

    revalidatePath("/ingredientes")
    return { success: true, data: data as Ingrediente }
  } catch (error: any) {
    console.error("Error actualizando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarIngrediente(id: string) {
  try {
    // Verificar si está siendo usado en platillos
    const { count, error: countError } = await supabase
      .from("platillo_ingredientes")
      .select("*", { count: "exact", head: true })
      .eq("ingrediente_id", id)

    if (countError) throw countError

    if (count && count > 0) {
      return {
        success: false,
        error: `No se puede eliminar el ingrediente porque está siendo usado en ${count} platillo(s)`,
      }
    }

    // Eliminar precios primero (por CASCADE debería ser automático, pero por seguridad)
    await supabase.from("precios_unitarios").delete().eq("ingrediente_id", id)

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

export async function obtenerHistorialPrecios(ingredienteId: string) {
  try {
    const { data, error } = await supabase
      .from("precios_unitarios")
      .select("*")
      .eq("ingrediente_id", ingredienteId)
      .order("fecha_inicio", { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    console.error("Error obteniendo historial de precios:", error)
    return { success: false, error: error.message }
  }
}

export async function agregarNuevoPrecio(ingredienteId: string, precio: number, fechaInicio?: string) {
  try {
    // 1. Cerrar el precio actual (si existe)
    const fechaFin = fechaInicio || new Date().toISOString().split("T")[0]

    await supabase
      .from("precios_unitarios")
      .update({ fecha_fin: fechaFin })
      .eq("ingrediente_id", ingredienteId)
      .is("fecha_fin", null)

    // 2. Crear el nuevo precio
    const { data, error } = await supabase
      .from("precios_unitarios")
      .insert([
        {
          ingrediente_id: ingredienteId,
          precio: precio,
          fecha_inicio: fechaFin,
        },
      ])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/ingredientes")
    revalidatePath("/precios")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error agregando nuevo precio:", error)
    return { success: false, error: error.message }
  }
}
