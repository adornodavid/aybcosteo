"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { MenuPlatillo, Platillo, ApiResponse } from "@/lib/types-sistema-costeo"

export async function agregarPlatilloAMenu(data: {
  menuid: number
  platilloid: number
  precioventa: number
  costoplatillo: number // Mantener por si se usa en otro lado, aunque el margen usará costoadministrativo
  costoadministrativo: number // Nuevo parámetro para el costo administrativo
  activo?: boolean
}) {
  try {
    // Modificación aquí: margenUtilidad ahora usa costoadministrativo
    const margenUtilidad = data.precioventa - data.costoadministrativo

    const { data: result, error } = await supabase
      .from("platillosxmenu") // Usar 'platillosxmenu'
      .insert([
        {
          menuid: data.menuid, // Usar 'menuid'
          platilloid: data.platilloid, // Usar 'platilloid'
          precioventa: data.precioventa, // Usar 'precioventa'
          margenutilidad: margenUtilidad, // Usar 'margenutilidad'
          activo: data.activo ?? true,
          fechacreacion: new Date().toISOString(), // Usar 'fechacreacion'
          // No hay 'updated_at' en tu SQL, así que lo omito
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error al agregar platillo al menú:", error)
      return { data: null, error: error.message }
    }

    revalidatePath(`/menus/${data.menuid}/agregar`) // Revalidar la página de agregar
    revalidatePath("/menus")
    revalidatePath("/platillos")
    return { data: result, error: null }
  } catch (error: any) {
    console.error("Error en agregarPlatilloAMenu:", error)
    return { data: null, error: error.message }
  }
}

// Alias para compatibilidad
export const asignarPlatilloAMenu = agregarPlatilloAMenu

export async function eliminarPlatilloDeMenu(data: {
  menuid: number
  platilloid: number
}) {
  try {
    const { error } = await supabase
      .from("platillosxmenu") // Usar 'platillosxmenu'
      .delete()
      .eq("menuid", data.menuid) // Usar 'menuid'
      .eq("platilloid", data.platilloid) // Usar 'platilloid'

    if (error) {
      console.error("Error al eliminar platillo del menú:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/menus/${data.menuid}/agregar`) // Revalidar la página de agregar
    revalidatePath("/menus")
    revalidatePath("/platillos")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error en eliminarPlatilloDeMenu:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarDisponibilidadPlatillo(data: {
  menuid: number
  platilloid: number
  activo: boolean
}) {
  try {
    const { data: result, error } = await supabase
      .from("platillosxmenu") // Usar 'platillosxmenu'
      .update({
        activo: data.activo,
        // No hay 'updated_at' en tu SQL, así que lo omito
      })
      .eq("menuid", data.menuid) // Usar 'menuid'
      .eq("platilloid", data.platilloid) // Usar 'platilloid'
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar disponibilidad:", error)
      return { data: null, error: error.message }
    }

    revalidatePath(`/menus/${data.menuid}/agregar`) // Revalidar la página de agregar
    revalidatePath("/menus")
    revalidatePath("/platillos")
    return { data: result, error: null }
  } catch (error: any) {
    console.error("Error en actualizarDisponibilidadPlatillo:", error)
    return { data: null, error: error.message }
  }
}

export async function actualizarPrecioVenta(data: {
  menuid: number
  platilloid: number
  precioventa: number
  costoplatillo: number // Mantener por si se usa en otro lado
  costoadministrativo: number // Añadido para calcular margen
}) {
  try {
    // Modificación aquí: margenUtilidad ahora usa costoadministrativo
    const margenUtilidad = data.precioventa - data.costoadministrativo

    const { data: result, error } = await supabase
      .from("platillosxmenu") // Usar 'platillosxmenu'
      .update({
        precioventa: data.precioventa, // Usar 'precioventa'
        margenutilidad: margenUtilidad, // Actualizar margen de utilidad
        // No hay 'updated_at' en tu SQL, así que lo omito
      })
      .eq("menuid", data.menuid) // Usar 'menuid'
      .eq("platilloid", data.platilloid) // Usar 'platilloid'
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar precio de venta:", error)
      return { data: null, error: error.message }
    }

    revalidatePath(`/menus/${data.menuid}/agregar`) // Revalidar la página de agregar
    revalidatePath("/menus")
    revalidatePath("/platillos")
    return { data: result, error: null }
  } catch (error: any) {
    console.error("Error en actualizarPrecioVenta:", error)
    return { data: null, error: error.message }
  }
}

export async function obtenerPlatillosDeMenu(menuid: number): Promise<ApiResponse<MenuPlatillo[]>> {
  try {
    const { data, error } = await supabase
      .from("platillosxmenu") // Usar 'platillosxmenu'
      .select(
        `
        id,
        precioventa,
        fechacreacion,
        platilloid,
        platillos (
          id,
          nombre,
          descripcion,
          instruccionespreparacion,
          costototal,
          costoadministrativo, 
          imgurl,
          activo
        )
      `,
      )
      .eq("menuid", menuid) // Usar 'menuid'
      .order("fechacreacion", { ascending: false }) // Usar 'fechacreacion'

    if (error) {
      console.error("Error al obtener platillos del menú:", error)
      return { data: null, error: error.message }
    }

    // Mapear los datos para que coincidan con la estructura solicitada
    const mappedData = data.map((item: any) => ({
      id: item.id,
      menuid: menuid, // Asegurar que menuid esté presente
      platilloid: item.platilloid,
      precioventa: item.precioventa,
      fechacreacion: item.fechacreacion,
      activo: item.platillos.activo, // Asumiendo que activo viene del platillo o de platillosxmenu
      platillos: {
        // Mantener la estructura anidada para el componente
        id: item.platillos.id,
        nombre: item.platillos.nombre,
        descripcion: item.platillos.descripcion,
        instruccionespreparacion: item.platillos.instruccionespreparacion,
        imgurl: item.platillos.imgurl,
        costototal: item.platillos.costototal,
        costoadministrativo: item.platillos.costoadministrativo, // Mapear costoadministrativo
        activo: item.platillos.activo,
      },
    }))

    return { data: mappedData as MenuPlatillo[], error: null }
  } catch (error: any) {
    console.error("Error en obtenerPlatillosDeMenu:", error)
    return { data: null, error: error.message }
  }
}

export async function obtenerTodosLosPlatillos(): Promise<ApiResponse<Platillo[]>> {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .select("id, nombre, costototal, costoadministrativo, imgurl") // Usar 'costototal', 'costoadministrativo' y 'imgurl'
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error al obtener todos los platillos:", error)
      return { data: null, error: error.message }
    }

    return { data: data as Platillo[], error: null }
  } catch (error: any) {
    console.error("Error en obtenerTodosLosPlatillos:", error)
    return { data: null, error: error.message }
  }
}

export async function obtenerDetallePlatillo(platilloId: number): Promise<ApiResponse<Platillo | null>> {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .select("id, nombre, descripcion, instruccionespreparacion, costototal, costoadministrativo, imgurl")
      .eq("id", platilloId)
      .single()

    if (error) {
      console.error("Error al obtener detalle del platillo:", error)
      return { data: null, error: error.message }
    }

    let precioSugerido = 0
    if (data && data.costoadministrativo !== null) {
      const { data: configData, error: configError } = await supabase
        .from("configuraciones")
        .select("valorfloat")
        .eq("id", 2)
        .single()

      if (configError) {
        console.error("Error al obtener configuración para precio sugerido:", configError)
        // Puedes decidir cómo manejar este error, por ahora, el precio sugerido será 0
      } else if (configData && configData.valorfloat !== null && configData.valorfloat !== 0) {
        precioSugerido = data.costoadministrativo / configData.valorfloat
      }
    }

    // Añadir precioSugerido al objeto data antes de retornarlo
    const platilloConPrecioSugerido = {
      ...data,
      precioSugerido: precioSugerido,
    }

    return { data: platilloConPrecioSugerido as Platillo, error: null }
  } catch (error: any) {
    console.error("Error en obtenerDetallePlatillo:", error)
    return { data: null, error: error.message }
  }
}
