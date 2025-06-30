"use server"

import { supabase } from "@/lib/supabase-real"
import { revalidatePath } from "next/cache"

export async function crearRestaurante(prevState: any, formData: FormData) {
  try {
    const nombre = formData.get("nombre") as string
    const hotelid = formData.get("hotelid") as string
    const direccion = formData.get("direccion") as string

    if (!nombre || nombre.trim() === "") {
      return { success: false, error: "El nombre del restaurante es requerido" }
    }

    const insertData: any = {
      nombre: nombre.trim(),
      activo: true,
    }

    if (hotelid && hotelid !== "null") {
      insertData.hotelid = Number.parseInt(hotelid)
    }

    if (direccion && direccion.trim()) {
      insertData.direccion = direccion.trim()
    }

    const { data, error } = await supabase.from("restaurantes").insert(insertData).select().single()

    if (error) {
      console.error("Error de Supabase:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/restaurantes")
    return {
      success: true,
      message: `Restaurante "${nombre}" creado exitosamente`,
      data,
    }
  } catch (error: any) {
    console.error("Error completo en crearRestaurante:", error)
    return { success: false, error: `Error al crear restaurante: ${error.message}` }
  }
}

export async function obtenerRestaurantes() {
  try {
    const { data, error } = await supabase
      .from("restaurantes")
      .select(`
        *,
        hotel:hoteles(id, nombre)
      `)
      .eq("activo", true)
      .order("nombre")

    if (error) {
      console.error("Error obteniendo restaurantes:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error en obtenerRestaurantes:", error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function actualizarRestaurante(id: number, prevState: any, formData: FormData) {
  try {
    const nombre = formData.get("nombre") as string
    const direccion = formData.get("direccion") as string

    if (!nombre || nombre.trim() === "") {
      return { error: "El nombre del restaurante es requerido" }
    }

    const updateData: any = {
      nombre: nombre.trim(),
    }

    if (direccion !== null) {
      updateData.direccion = direccion?.trim() || null
    }

    const { error } = await supabase.from("restaurantes").update(updateData).eq("id", id)

    if (error) {
      console.error("Error al actualizar restaurante:", error)
      return { error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath(`/restaurantes/${id}`)
    revalidatePath("/restaurantes")
    return { success: true }
  } catch (error: any) {
    console.error("Error en actualizarRestaurante:", error)
    return { error: error.message || "Error al actualizar el restaurante" }
  }
}

export async function eliminarRestaurante(id: number) {
  try {
    const { error } = await supabase.from("restaurantes").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar restaurante:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath("/restaurantes")
    return { success: true }
  } catch (error: any) {
    console.error("Error en eliminarRestaurante:", error)
    return { success: false, error: error.message }
  }
}
