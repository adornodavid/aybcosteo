"use server"

import { createClient } from "@/lib/supabase-final"
import { revalidatePath } from "next/cache"

export async function obtenerTodosLosIngredientes() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("ingredientes")
      .select(`
        *,
        hoteles:hotelid (
          id,
          nombre,
          acronimo
        ),
        categoriaingredientes:categoriaid (
          id,
          descripcion
        ),
        tipounidadmedida:unidadmedidaid (
          id,
          descripcion
        )
      `)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo ingredientes:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [], error: null }
  } catch (error) {
    console.error("Error en obtenerTodosLosIngredientes:", error)
    return { success: false, error: "Error interno del servidor", data: [] }
  }
}

export async function crearIngrediente(formData: FormData) {
  try {
    const supabase = createClient()

    const ingredienteData = {
      codigo: formData.get("codigo") as string,
      nombre: formData.get("nombre") as string,
      categoriaid: formData.get("categoriaid") ? Number.parseInt(formData.get("categoriaid") as string) : null,
      costo: formData.get("costo") ? Number.parseFloat(formData.get("costo") as string) : null,
      unidadmedidaid: formData.get("unidadmedidaid") ? Number.parseInt(formData.get("unidadmedidaid") as string) : null,
      hotelid: formData.get("hotelid") ? Number.parseInt(formData.get("hotelid") as string) : null,
      imgurl: (formData.get("imgurl") as string) || null,
      cambio: formData.get("cambio") ? Number.parseInt(formData.get("cambio") as string) : null,
      activo: true,
      fechacreacion: new Date().toISOString().split("T")[0],
      fechamodificacion: new Date().toISOString().split("T")[0],
    }

    const { data, error } = await supabase.from("ingredientes").insert([ingredienteData]).select()

    if (error) {
      console.error("Error creando ingrediente:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/ingredientes")
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error en crearIngrediente:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function eliminarIngrediente(id: number) {
  try {
    const supabase = createClient()

    // Soft delete - cambiar activo a false
    const { error } = await supabase
      .from("ingredientes")
      .update({
        activo: false,
        fechamodificacion: new Date().toISOString().split("T")[0],
      })
      .eq("id", id)

    if (error) {
      console.error("Error eliminando ingrediente:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/ingredientes")
    return { success: true }
  } catch (error) {
    console.error("Error en eliminarIngrediente:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
