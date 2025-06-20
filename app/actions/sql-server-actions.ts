"use server"

import { executeQuery, getConnection } from "@/lib/sql-server"
import { revalidatePath } from "next/cache"
import type { Hotel, Restaurante, Categoria } from "@/lib/sql-server"

// =============================================
// ACCIONES PARA HOTELES
// =============================================

export async function obtenerHoteles() {
  try {
    const hoteles = await executeQuery<Hotel>(`
      SELECT * FROM hoteles 
      WHERE activo = 1 
      ORDER BY nombre
    `)

    return { success: true, data: hoteles }
  } catch (error: any) {
    console.error("Error obteniendo hoteles:", error)
    return { success: false, error: error.message }
  }
}

export async function crearHotel(formData: FormData) {
  try {
    const nombre = formData.get("nombre") as string
    const shortname = formData.get("shortname") as string
    const descripcion = formData.get("descripcion") as string

    if (!nombre?.trim()) {
      return { success: false, error: "El nombre del hotel es obligatorio" }
    }

    const connection = await getConnection()
    const request = connection.request()

    const result = await request
      .input("nombre", nombre.trim())
      .input("shortname", shortname?.trim() || null)
      .input("descripcion", descripcion?.trim() || null)
      .query(`
        INSERT INTO hoteles (nombre, shortname, descripcion)
        OUTPUT INSERTED.*
        VALUES (@nombre, @shortname, @descripcion)
      `)

    revalidatePath("/hoteles")
    return { success: true, data: result.recordset[0] }
  } catch (error: any) {
    console.error("Error creando hotel:", error)
    return { success: false, error: error.message }
  }
}

// =============================================
// ACCIONES PARA RESTAURANTES
// =============================================

export async function obtenerRestaurantes() {
  try {
    const restaurantes = await executeQuery<Restaurante>(`
      SELECT r.*, h.nombre as hotel_nombre, h.shortname as hotel_shortname
      FROM restaurantes r
      LEFT JOIN hoteles h ON r.hotel_id = h.id
      WHERE r.activo = 1
      ORDER BY r.nombre
    `)

    return { success: true, data: restaurantes }
  } catch (error: any) {
    console.error("Error obteniendo restaurantes:", error)
    return { success: false, error: error.message }
  }
}

export async function crearRestaurante(formData: FormData) {
  try {
    const nombre = formData.get("nombre") as string
    const hotel_id = formData.get("hotel_id") as string
    const descripcion = formData.get("descripcion") as string

    if (!nombre?.trim()) {
      return { success: false, error: "El nombre del restaurante es obligatorio" }
    }

    const connection = await getConnection()
    const request = connection.request()

    const result = await request
      .input("nombre", nombre.trim())
      .input("hotel_id", hotel_id === "N/A" ? null : Number.parseInt(hotel_id))
      .input("descripcion", descripcion?.trim() || null)
      .query(`
        INSERT INTO restaurantes (nombre, hotel_id, descripcion)
        OUTPUT INSERTED.*
        VALUES (@nombre, @hotel_id, @descripcion)
      `)

    revalidatePath("/restaurantes")
    return { success: true, data: result.recordset[0] }
  } catch (error: any) {
    console.error("Error creando restaurante:", error)
    return { success: false, error: error.message }
  }
}

// =============================================
// ACCIONES PARA INGREDIENTES
// =============================================

export async function obtenerIngredientes(restauranteId?: string) {
  try {
    let query = `
      SELECT 
        i.*,
        c.nombre as categoria_nombre,
        r.nombre as restaurante_nombre,
        p.precio as precio_actual
      FROM ingredientes i
      LEFT JOIN categorias c ON i.categoria_id = c.id
      LEFT JOIN restaurantes r ON i.restaurante_id = r.id
      LEFT JOIN precios_unitarios p ON i.id = p.ingrediente_id AND p.fecha_fin IS NULL
    `

    const params: any[] = []
    if (restauranteId) {
      query += ` WHERE i.restaurante_id = @param0`
      params.push(Number.parseInt(restauranteId))
    }

    query += ` ORDER BY i.descripcion`

    const ingredientes = await executeQuery<any>(query, params)

    return { success: true, data: ingredientes }
  } catch (error: any) {
    console.error("Error obteniendo ingredientes:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerCategorias() {
  try {
    const categorias = await executeQuery<Categoria>(`
      SELECT * FROM categorias ORDER BY nombre
    `)

    return { success: true, data: categorias }
  } catch (error: any) {
    console.error("Error obteniendo categorías:", error)
    return { success: false, error: error.message }
  }
}
