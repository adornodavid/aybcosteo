"use server"

import { cookies } from "next/headers"
import { createServerSupabaseClientWrapper } from "@/lib/supabase"
import type { Restaurante, DropdownOption, RestauranteTableRow } from "@/lib/types-sistema-costeo"
import { revalidatePath } from "next/cache"

// Helper para obtener el cliente Supabase en el servidor
const getSupabaseClient = () => createServerSupabaseClientWrapper(cookies())

export async function obtenerRestaurantesFiltrados(
  searchTerm: string,
  hotelId: number | null, // Puede ser 0 para "Todos" o null si no se filtra
  restauranteId: number | null, // Puede ser 0 para "Todos" o null si no se filtra
  page: number,
  pageSize: number,
  rolId: number, // Rol del usuario de la sesión
  sessionHotelId: number | null, // HotelId del usuario de la sesión
): Promise<{ data: RestauranteTableRow[]; count: number; success: boolean; error?: string }> {
  const supabase = getSupabaseClient()
  const offset = (page - 1) * pageSize

  let query = supabase.from("restaurantes").select(
    `
      id,
      nombre,
      direccion,
      imgurl,
      activo,
      hotelid,
      hoteles (
        nombre,
        id
      )
    `,
    { count: "exact" },
  )

  // Lógica para auxHotelid
  let auxHotelidFilter: number | null = null
  if (![1, 2, 3, 4].includes(rolId)) {
    // Si el rol no es 1, 2, 3 o 4 (roles de administrador), se restringe por el hotel de la sesión
    auxHotelidFilter = sessionHotelId
  } else {
    // Si es un rol de administrador
    if (hotelId !== null && hotelId !== 0) {
      // Si se seleccionó un hotel específico en el filtro
      auxHotelidFilter = hotelId
    }
    // Si hotelId es 0 (Todos) o null, no se aplica filtro por hotel_id
  }

  if (auxHotelidFilter !== null && auxHotelidFilter !== 0) {
    query = query.eq("hotelid", auxHotelidFilter)
  }

  if (searchTerm) {
    query = query.ilike("nombre", `%${searchTerm}%`)
  }

  if (restauranteId !== null && restauranteId !== 0) {
    query = query.eq("id", restauranteId)
  }

  const { data, error, count } = await query.order("nombre", { ascending: true }).range(offset, offset + pageSize - 1)

  if (error) {
    console.error("Error al obtener restaurantes filtrados:", error)
    return { data: [], count: 0, success: false, error: error.message }
  }

  const mappedData: RestauranteTableRow[] = data.map((r: any) => ({
    Folio: r.id,
    Hotel: r.hoteles?.nombre || "N/A",
    Nombre: r.nombre,
    Direccion: r.direccion,
    Imagen: r.imgurl,
    Estatus: r.activo,
    id: r.id, // Para uso interno en acciones
    hotelid: r.hoteles?.id || null, // Para uso interno en formulario de edición
  }))

  return { data: mappedData, count: count || 0, success: true }
}

export async function obtenerEstadisticasRestaurantes(): Promise<{ total: number; success: boolean; error?: string }> {
  const supabase = getSupabaseClient()
  const { count, error } = await supabase.from("restaurantes").select("*", { count: "exact", head: true })

  if (error) {
    console.error("Error al obtener estadísticas de restaurantes:", error)
    return { total: 0, success: false, error: error.message }
  }
  return { total: count || 0, success: true }
}

export async function obtenerHotelesParaFiltroPorRol(
  rolId?: number,
  sessionHotelId?: number | null,
): Promise<{ data: DropdownOption[]; success: boolean; error?: string }> {
  const supabase = getSupabaseClient()
  let query = supabase.from("hoteles").select("id, nombre").order("nombre", { ascending: true })

  // Lógica de seguridad: si es rol 5 (Gerente de Hotel), solo ve su hotel
  if (rolId === 5 && sessionHotelId !== null) {
    query = query.eq("id", sessionHotelId)
  } else if ([1, 2, 3, 4].includes(rolId)) {
    // Roles 1-4 (Administrador, etc.) ven todos los hoteles
  } else {
    // Otros roles o sin rol, no deberían ver hoteles o solo los "públicos" si aplica
    return { data: [], success: true, error: "Acceso no autorizado para ver hoteles." }
  }

  const { data, error } = await query

  if (error) {
    console.error("Error al obtener hoteles para filtro:", error)
    return { data: [], success: false, error: error.message }
  }

  const options: DropdownOption[] = [
    { value: "0", label: "Todos" }, // Opción "Todos"
    ...data.map((h) => ({ value: h.id.toString(), label: h.nombre })),
  ]
  return { data: options, success: true }
}

export async function obtenerRestaurantesParaFiltroPorRol(
  rolId?: number,
  sessionHotelId?: number | null,
): Promise<{ data: DropdownOption[]; success: boolean; error?: string }> {
  const supabase = getSupabaseClient()
  let query = supabase.from("restaurantes").select("id, nombre").order("nombre", { ascending: true })

  // Lógica de seguridad: si es rol 5 (Gerente de Hotel), solo ve restaurantes de su hotel
  if (rolId === 5 && sessionHotelId !== null) {
    query = query.eq("hotel_id", sessionHotelId)
  } else if ([1, 2, 3, 4].includes(rolId)) {
    // Roles 1-4 (Administrador, etc.) ven todos los restaurantes
  } else {
    // Otros roles o sin rol, no deberían ver restaurantes o solo los "públicos" si aplica
    return { data: [], success: true, error: "Acceso no autorizado para ver restaurantes." }
  }

  const { data, error } = await query

  if (error) {
    console.error("Error al obtener restaurantes para filtro:", error)
    return { data: [], success: false, error: error.message }
  }

  const options: DropdownOption[] = [
    { value: "0", label: "Todos" }, // Opción "Todos"
    ...data.map((r) => ({ value: r.id.toString(), label: r.nombre })),
  ]
  return { data: options, success: true }
}

export async function obtenerRestaurantePorId(
  id: number,
): Promise<{ success: boolean; data?: Restaurante; error?: string }> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("restaurantes").select("*, hoteles(nombre)").eq("id", id).single()

  if (error) {
    console.error("Error al obtener restaurante por ID:", error)
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: "Restaurante no encontrado." }
  }

  const mappedData: Restaurante = {
    ...data,
    HotelAsignado: (data.hoteles as { nombre: string } | null)?.nombre || "N/A",
  }

  return { success: true, data: mappedData }
}

export async function crearOActualizarRestaurante(
  formData: FormData,
): Promise<{ success: boolean; message: string; error?: string }> {
  const supabase = getSupabaseClient()
  const id = formData.get("hddEdicionRestauranteId") as string
  const nombre = formData.get("txtEdicionRestauranteNombre") as string
  const direccion = formData.get("txtEdicionRestauranteDireccion") as string
  const hotelid = formData.get("ddlEdicionHotel") ? Number.parseInt(formData.get("ddlEdicionHotel") as string) : null
  const imgurl = formData.get("hddEdicionImagen") as string | null
  const activo = formData.get("activo") === "true" // Asumiendo que el formulario envía 'true' o 'false' para activo

  if (!nombre || !hotelid) {
    return { success: false, message: "Nombre y Hotel son campos obligatorios." }
  }

  const restauranteData = {
    nombre,
    direccion: direccion || null,
    hotelid,
    imgurl,
    activo,
  }

  let result
  if (id && id !== "0") {
    // Actualizar
    result = await supabase.from("restaurantes").update(restauranteData).eq("id", Number.parseInt(id)).select().single()
  } else {
    // Crear
    result = await supabase
      .from("restaurantes")
      .insert({ ...restauranteData, activo: true }) // Por defecto activo al crear
      .select()
      .single()
  }

  if (result.error) {
    console.error("Error al crear/actualizar restaurante:", result.error)
    return { success: false, message: "Error al guardar el restaurante.", error: result.error.message }
  }

  revalidatePath("/restaurantes")
  return { success: true, message: `Restaurante ${id && id !== "0" ? "actualizado" : "creado"} exitosamente.` }
}

export async function actualizarEstadoRestaurante(
  id: number,
  newStatus: boolean,
): Promise<{ success: boolean; message: string; error?: string }> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("restaurantes").update({ activo: newStatus }).eq("id", id)

  if (error) {
    console.error("Error al cambiar estado del restaurante:", error)
    return { success: false, message: "Error al cambiar el estado del restaurante.", error: error.message }
  }

  revalidatePath("/restaurantes")
  return { success: true, message: `Restaurante ${newStatus ? "activado" : "inactivado"} exitosamente.` }
}

export async function uploadImage(
  formData: FormData,
): Promise<{ success: boolean; url: string | null; error: string | null }> {
  const supabase = getSupabaseClient()
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, url: null, error: "No se proporcionó ningún archivo." }
  }

  const fileName = `${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage.from("imagenes_restaurantes").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.error("Error al subir imagen:", error)
    return { success: false, url: null, error: error.message }
  }

  const { data: publicUrlData } = supabase.storage.from("imagenes_restaurantes").getPublicUrl(data.path)

  if (!publicUrlData || !publicUrlData.publicUrl) {
    return { success: false, url: null, error: "No se pudo obtener la URL pública de la imagen." }
  }

  return { success: true, url: publicUrlData.publicUrl, error: null }
}
