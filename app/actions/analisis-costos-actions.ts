"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase" // Usamos el cliente de Supabase para el usuario

// Tipos para los datos que se devolverán
export type MenuItem = {
  id: number
  nombre: string
}

export type PlatilloItem = {
  id: number
  nombre: string
}

export type CostHistoryItem = {
  fechacreacion: string
  platilloid: number // Cambiado a number para coincidir con el tipo de id de platillo
  costo: number
  precioventa: number
  margenutilidad: number // Aseguramos que el tipo incluye margenutilidad
}

export type PlatilloTooltipDetail = {
  id: number // Cambiado a number
  Restaurante: string
  Menu: string
  Platillo: string
  CostoElaboracion: number
  PrecioVenta: number
  MargenUtilidad: number
}

// Función para obtener los menús para el dropdown
export async function getMenusForAnalisis(): Promise<MenuItem[]> {
  const supabase = createClient(cookies()) // Cliente de Supabase para la consulta de datos

  let auxHotelid = -1 // Variable auxiliar para el hotelId

  // 1. Obtener RolId y HotelId directamente de las cookies
  const allCookies = cookies()
  const rolIdCookie = allCookies.get("RolId")
  const hotelIdCookie = allCookies.get("HotelId")

  let rolId = 0
  let hotelId = 0

  if (rolIdCookie && !isNaN(Number.parseInt(rolIdCookie.value))) {
    rolId = Number.parseInt(rolIdCookie.value)
  } else {
    console.warn("RolId cookie not found or invalid, defaulting to 0.")
  }

  if (hotelIdCookie && !isNaN(Number.parseInt(hotelIdCookie.value))) {
    hotelId = Number.parseInt(hotelIdCookie.value)
  } else {
    console.warn("HotelId cookie not found or invalid, defaulting to 0.")
  }

  // 2. Asignar valor a auxHotelid según el RolId obtenido de la cookie
  if (rolId !== 1 && rolId !== 2 && rolId !== 3 && rolId !== 4) {
    auxHotelid = hotelId
  } else {
    auxHotelid = -1
  }

  try {
    // 3. Ejecutar la consulta SQL adaptada a Supabase Client
    let query = supabase
      .from("menus")
      .select(`
        id,
        nombre,
        restaurantes!inner(
          hoteles!inner(
            id
          )
        )
      `)
      .order("id", { ascending: true })

    // Aplicar el filtro si auxHotelid no es -1
    if (auxHotelid !== -1) {
      query = query.eq("restaurantes.hoteles.id", auxHotelid)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching menus:", error.message)
      return [{ id: -1, nombre: "Todos" }]
    }

    // 4. Formatear las opciones de la lista desplegable
    const menuItems: MenuItem[] = [
      { id: -1, nombre: "Todos" }, // Añadir la opción "Todos" al inicio
      ...data.map((menu: any) => ({
        id: menu.id,
        nombre: menu.nombre,
      })),
    ]

    return menuItems
  } catch (error) {
    console.error("Exception fetching menus:", error)
    return [{ id: -1, nombre: "Todos" }]
  }
}

// Función para obtener platillos basados en el menú seleccionado y un término de búsqueda
export async function getPlatillosForAnalisis(menuId: number, searchTerm = ""): Promise<PlatilloItem[]> {
  const supabase = createClient(cookies())

  try {
    let query = supabase.from("platillos").select(`
      id,
      nombre,
      platillosxmenu!inner(
        menuid
      )
    `)

    if (menuId !== -1) {
      query = query.eq("platillosxmenu.menuid", menuId)
    }

    if (searchTerm) {
      query = query.ilike("nombre", `%${searchTerm}%`) // 'ilike' para búsqueda insensible a mayúsculas/minúsculas
    }

    const { data, error } = await query.order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching platillos:", error.message)
      return []
    }

    const platilloItems: PlatilloItem[] = data.map((platillo: any) => ({
      id: platillo.id,
      nombre: platillo.nombre,
    }))

    return platilloItems
  } catch (error) {
    console.error("Exception fetching platillos:", error)
    return []
  }
}

// Función para obtener el historial de costos de un platillo
export async function getPlatilloCostHistory(
  platilloId: number,
  fechaInicial: string,
  fechaFinal: string,
): Promise<CostHistoryItem[]> {
  const supabase = createClient(cookies())
  console.log("Fetching cost history forprueba:", { platilloId, fechaInicial, fechaFinal })
  try {
    const { data, error } = await supabase
      .from("historico")
      .select("fechacreacion, platilloid, costo, precioventa, costoporcentual")
      .eq("platilloid", platilloId)
      .gte("fechacreacion", fechaInicial)
      .lte("fechacreacion", fechaFinal)
      .order("fechacreacion", { ascending: true }) // Ordenar por fecha para el gráfico

    if (error) {
      console.error("Error fetching platillo cost history:", error.message)
      return []
    }

    // Agrupar y sumar costos por fecha y platillo, y tomar el precioventa (asumiendo que es el mismo por fecha/platillo)
    const groupedData = data.reduce((acc: any, item: any) => {
      const key = `${item.fechacreacion}-${item.platilloid}`
      if (!acc[key]) {
        acc[key] = {
          fechacreacion: item.fechacreacion,
          platilloid: item.platilloid,
          costo: 0,
          precioventa: item.precioventa, // Tomar el primer precio de venta encontrado para esa fecha/platillo
          margenutilidad: 0, // Inicializar, se calculará después
        }
      }
      acc[key].costo += item.costo
      return acc
    }, {})

    const chartData = Object.values(groupedData).map((item: any) => ({
      fechacreacion: new Date(item.fechacreacion), // Para el eje X (tiempo)
      costo: item.costo,
      precioventa: item.precioventa,
      platilloid: item.platilloid,
      margenutilidad: item.precioventa - item.costo, // Calcular el margen de utilidad
    }))

    return chartData
  } catch (error) {
    console.error("Exception fetching platillo cost history:", error)
    return []
  }
}

// Función para obtener detalles del platillo para el tooltip
export async function getPlatilloDetailsForTooltip(platilloId: number): Promise<PlatilloTooltipDetail | null> {
  const supabase = createClient(cookies())

  try {
    const { data, error } = await supabase
      .from("platillos")
      .select(`
        id,
        nombre,
        costototal,
        platillosxmenu!inner(
          precioventa,
          margenutilidad,
          menus!inner(
            nombre,
            restaurantes!inner(
              nombre
            )
          )
        )
      `)
      .eq("id", platilloId)

    if (error) {
      console.error("Error fetching platillo details for tooltip:", error.message)
      return null
    }

    // Mapear los datos para obtener la estructura deseada para el tooltip
    const details = data.map((p: any) => ({
      id: p.id,
      Restaurante: p.platillosxmenu[0]?.menus?.restaurantes?.nombre || "N/A",
      Menu: p.platillosxmenu[0]?.menus?.nombre || "N/A",
      Platillo: p.nombre,
      CostoElaboracion: p.costototal,
      PrecioVenta: p.platillosxmenu[0]?.precioventa,
      MargenUtilidad: p.platillosxmenu[0]?.margenutilidad,
    }))

    return details.length > 0 ? details[0] : null
  } catch (error) {
    console.error("Exception fetching platillo details for tooltip:", error)
    return null
  }
}
