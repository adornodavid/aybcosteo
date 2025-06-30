"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function obtenerIngredientes(hotelId?: number) {
  try {
    const supabase = createServerClient()
    let query = supabase
      .from("ingredientes")
      .select(`
        *,
        categoria:categoriaingredientes(id, descripcion),
        hotel:hoteles(id, nombre),
        unidadmedida:tipounidadmedida(id, descripcion)
      `)
      .eq("activo", true)
      .order("nombre")

    if (hotelId) {
      query = query.eq("hotelid", hotelId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error en query ingredientes:", error)
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo ingredientes:", error)
    return { success: true, data: [] }
  }
}

export async function obtenerIngredientePorId(id: number) {
  try {
    const supabase = createServerClient()
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
    return { success: true, data }
  } catch (error: any) {
    console.error("Error obteniendo ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function crearIngrediente(ingredienteData: any) {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
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
          cambio: ingredienteData.cambio,
          activo: true,
          fechacreacion: new Date().toISOString().split("T")[0],
        },
      ])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/ingredientes")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error creando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarIngrediente(id: number, ingredienteData: any) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from("ingredientes")
      .update({
        codigo: ingredienteData.codigo,
        nombre: ingredienteData.nombre,
        categoriaid: ingredienteData.categoriaid,
        costo: ingredienteData.costo,
        unidadmedidaid: ingredienteData.unidadmedidaid,
        imgurl: ingredienteData.imgurl,
        cambio: ingredienteData.cambio,
        fechamodificacion: new Date().toISOString().split("T")[0],
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/ingredientes")
    return { success: true }
  } catch (error: any) {
    console.error("Error actualizando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarIngrediente(id: number) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from("ingredientes")
      .update({
        activo: false,
        fechamodificacion: new Date().toISOString().split("T")[0],
      })
      .eq("id", id)

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
    const supabase = createServerClient()
    const { data, error } = await supabase.from("categoriaingredientes").select("*").order("descripcion")

    if (error) {
      console.error("Error obteniendo categorías:", error)
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo categorías:", error)
    return { success: true, data: [] }
  }
}

export async function obtenerHoteles() {
  try {
    const supabase = createServerClient()

    // Verificar que las variables de entorno estén disponibles
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Variables de entorno de Supabase no configuradas")
      return { success: false, data: [], error: "Configuración de Supabase faltante" }
    }

    const { data, error } = await supabase
      .from("hoteles")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error en query hoteles:", error)
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo hoteles:", error)
    return { success: false, data: [], error: error.message || "Error desconocido" }
  }
}

export async function obtenerCategoriasIngredientes() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("categoriaingredientes")
      .select("id, descripcion")
      .order("id", { ascending: true })

    if (error) {
      console.error("Error obteniendo categorías:", error)
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo categorías:", error)
    return { success: true, data: [] }
  }
}

export async function buscarIngredientes(filtros: {
  codigo?: string
  nombre?: string
  hotelId?: number
  categoriaId?: number
  page?: number
  limit?: number
}) {
  try {
    const supabase = createServerClient()
    const { codigo, nombre, hotelId, categoriaId, page = 1, limit = 20 } = filtros
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from("ingredientes")
      .select(
        `
        *,
        categoria:categoriaingredientes(id, descripcion),
        hotel:hoteles(id, nombre),
        unidadmedida:tipounidadmedida(id, descripcion)
      `,
        { count: "exact" },
      )
      .eq("activo", true)

    if (codigo && codigo.trim()) {
      query = query.ilike("codigo", `%${codigo.trim()}%`)
    }

    if (nombre && nombre.trim()) {
      query = query.ilike("nombre", `%${nombre.trim()}%`)
    }

    if (hotelId && hotelId > 0) {
      query = query.eq("hotelid", hotelId)
    }

    if (categoriaId && categoriaId > 0) {
      query = query.eq("categoriaid", categoriaId)
    }

    query = query.order("nombre").range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error("Error en búsqueda de ingredientes:", error)
      return { success: true, data: [], count: 0 }
    }

    return { success: true, data: data || [], count: count || 0 }
  } catch (error: any) {
    console.error("Error buscando ingredientes:", error)
    return { success: true, data: [], count: 0 }
  }
}
