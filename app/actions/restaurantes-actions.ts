"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function crearRestaurante(prevState: any, formData: FormData) {
  try {
    console.log("=== CREAR RESTAURANTE ===")

    const nombre = formData.get("nombre") as string
    const descripcion = formData.get("descripcion") as string
    const hotel_id = formData.get("hotel_id") as string
    const direccion = formData.get("direccion") as string
    const telefono = formData.get("telefono") as string
    const email = formData.get("email") as string

    console.log("Datos recibidos:", { nombre, hotel_id, descripcion, direccion, telefono, email })

    // Validaciones
    if (!nombre || nombre.trim() === "") {
      return { success: false, error: "El nombre del restaurante es requerido" }
    }

    if (!hotel_id || hotel_id.trim() === "") {
      return { success: false, error: "Debes seleccionar un hotel o N/A" }
    }

    // Preparar datos para insertar
    const insertData: any = {
      nombre: nombre.trim(),
      activo: true,
    }

    // CORREGIDO: Manejar la relación con hoteles correctamente
    if (hotel_id === "N/A") {
      insertData.hotel_id = null // Sin hotel asignado
    } else {
      insertData.hotel_id = hotel_id // ID del hotel
    }

    // Agregar campos opcionales si tienen valor
    if (descripcion && descripcion.trim()) {
      insertData.descripcion = descripcion.trim()
    }
    if (direccion && direccion.trim()) {
      insertData.direccion = direccion.trim()
    }
    if (telefono && telefono.trim()) {
      insertData.telefono = telefono.trim()
    }
    if (email && email.trim()) {
      insertData.email = email.trim()
    }

    console.log("Datos a insertar en restaurantes:", insertData)

    // Insertar en la tabla restaurantes
    const { data, error } = await supabase.from("restaurantes").insert(insertData).select().single()

    if (error) {
      console.error("Error de Supabase:", error)
      return { success: false, error: `Error de base de datos: ${error.message}` }
    }

    console.log("Restaurante creado exitosamente:", data)

    // Revalidar páginas
    revalidatePath("/restaurantes")
    revalidatePath("/")

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
    const { data, error } = await supabase.from("restaurantes").select("*").eq("activo", true).order("nombre")

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

export async function actualizarRestaurante(id: string, prevState: any, formData: FormData) {
  try {
    if (!formData) {
      return { error: "No se recibieron datos del formulario" }
    }
    const nombre = formData.get("nombre") as string
    const direccion = formData.get("direccion") as string
    const telefono = formData.get("telefono") as string
    const email = formData.get("email") as string

    if (!nombre || nombre.trim() === "") {
      return { error: "El nombre del restaurante es requerido" }
    }

    const updateData: any = {
      nombre: nombre.trim(),
      updated_at: new Date().toISOString(),
    }

    if (direccion !== null) {
      updateData.direccion = direccion?.trim() || null
    }
    if (telefono !== null) {
      updateData.telefono = telefono?.trim() || null
    }
    if (email !== null) {
      updateData.email = email?.trim() || null
    }

    const { error } = await supabase.from("restaurantes").update(updateData).eq("id", id)

    if (error) {
      console.error("Error al actualizar restaurante:", error)
      return { error: `Error de base de datos: ${error.message}` }
    }

    revalidatePath(`/restaurantes/${id}`)
    revalidatePath("/restaurantes")
  } catch (error: any) {
    console.error("Error en actualizarRestaurante:", error)
    return { error: error.message || "Error al actualizar el restaurante" }
  }
}

export async function eliminarRestaurante(id: string) {
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
