"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { registrarBitacora } from "@/app/actions/bitacora-actions"
import { BITACORA_ACTIVIDADES, BITACORA_MODULOS } from "@/lib/bitacora-actividades"

export interface ReporteMenuRow {
  hotel: string
  restaurante: string
  menu: string
  receta: string
  precioventa: number | null
  precioconiva: number | null
  margenutilidad: number | null
}

export async function obtenerReporteMenus(menuIds: number[]) {
  try {
    if (!menuIds || menuIds.length === 0) {
      return { success: true, data: [] as ReporteMenuRow[] }
    }

    const { data, error } = await supabase
      .from("platillosxmenu")
      .select(`
        precioventa,
        precioconiva,
        margenutilidad,
        menus!inner(
          id,
          nombre,
          restaurantes!inner(
            nombre,
            hoteles!inner(nombre)
          )
        ),
        platillos!inner(nombre)
      `)
      .in("menuid", menuIds)

    if (error) {
      console.error("Error al obtener reporte de menús:", error)
      return { success: false, data: [] as ReporteMenuRow[], error: error.message }
    }

    const filas: ReporteMenuRow[] = (data || []).map((r: any) => ({
      restaurante: r.menus?.restaurantes?.nombre || "",
      hotel: r.menus?.restaurantes?.hoteles?.nombre || "",
      menu: r.menus?.nombre || "",
      receta: r.platillos?.nombre || "",
      precioventa: r.precioventa,
      precioconiva: r.precioconiva,
      margenutilidad: r.margenutilidad,
    }))

    return { success: true, data: filas }
  } catch (error: any) {
    console.error("Error en obtenerReporteMenus:", error)
    return { success: false, data: [] as ReporteMenuRow[], error: error.message }
  }
}

export async function obtenerMenus() {
  try {
    const { data, error } = await supabase.from("menus").select("*").order("nombre", { ascending: true })

    if (error) {
      console.error("Error al obtener menús:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en obtenerMenus:", error)
    return { data: null, error: error.message }
  }
}

export async function crearMenu(menuData: {
  nombre: string
  descripcion?: string
  restauranteid: number
  activo?: boolean
}) {
  try {
    const { data, error } = await supabase
      .from("menus")
      .insert([
        {
          nombre: menuData.nombre,
          descripcion: menuData.descripcion || null,
          restauranteid: menuData.restauranteid,
          activo: menuData.activo ?? true,
          // Se han eliminado 'fechacreacion' y 'fechaactualizacion'
          // para evitar errores si no existen en la tabla o si se manejan
          // con valores por defecto/triggers en la base de datos.
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error al crear menú:", error)
      return { data: null, error: error.message }
    }

    revalidatePath("/menus")

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.CREAR_MENU,
      observaciones: `Creó menú «${menuData.nombre}» (id ${data.id}) en restaurante ${menuData.restauranteid}.`,
      modulo: BITACORA_MODULOS.MENUS,
      recursoid: Number(data.id),
    })

    return { data, success: true, error: null }
  } catch (error: any) {
    console.error("Error en crearMenu:", error)
    return { data: null, error: error.message }
  }
}

export async function actualizarMenu(
  id: number,
  menuData: {
    nombre?: string
    descripcion?: string
    restauranteid?: number
    activo?: boolean
  },
) {
  try {
    const { data, error } = await supabase
      .from("menus")
      .update({
        ...menuData,
        // Se ha eliminado 'fechaactualizacion' de la actualización
        // para evitar errores si no existe en la tabla.
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar menú:", error)
      return { data: null, error: error.message }
    }

    revalidatePath("/menus")

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.ACTUALIZAR_MENU,
      observaciones: `Actualizó menú «${data?.nombre ?? menuData.nombre ?? ""}» (id ${id}).`,
      modulo: BITACORA_MODULOS.MENUS,
      recursoid: id,
    })

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en actualizarMenu:", error)
    return { data: null, error: error.message }
  }
}

export async function obtenerMenuPorId(id: number) {
  try {
    const { data, error } = await supabase
      .from("menus")
      .select(`
        *,
        restaurantes (
          id,
          nombre,
          hoteles (
            id,
            nombre
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error al obtener menú:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en obtenerMenuPorId:", error)
    return { data: null, error: error.message }
  }
}

export async function eliminarMenu(menuId: string) {
  try {
    // Capturar nombre del menú antes de eliminarlo para el log de bitácora.
    const { data: prevMenu } = await supabase
      .from("menus")
      .select("nombre")
      .eq("id", menuId)
      .single()

    // 1. Eliminar las relaciones en menu_platillos
    const { error: deleteMenuPlatillosError } = await supabase.from("menu_platillos").delete().eq("menu_id", menuId)

    if (deleteMenuPlatillosError) {
      console.error("Error al eliminar relaciones menu_platillos:", deleteMenuPlatillosError)
      return { success: false, error: deleteMenuPlatillosError.message }
    }

    // 2. Eliminar las relaciones en restaurante_menus
    const { error: deleteRestauranteMenusError } = await supabase
      .from("restaurante_menus")
      .delete()
      .eq("menu_id", menuId)

    if (deleteRestauranteMenusError) {
      console.error("Error al eliminar relaciones restaurante_menus:", deleteRestauranteMenusError)
      return { success: false, error: deleteRestauranteMenusError.message }
    }

    // 3. Eliminar el menú
    const { error } = await supabase.from("menus").delete().eq("id", menuId)

    if (error) {
      console.error("Error al eliminar menú:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/menus")

    const nomMenu = (prevMenu as any)?.nombre ?? "(sin nombre)"
    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.ELIMINAR_MENU,
      observaciones: `Eliminó menú «${nomMenu}» (id ${menuId}) y sus relaciones (menu_platillos, restaurante_menus).`,
      modulo: BITACORA_MODULOS.MENUS,
      recursoid: Number(menuId),
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error en eliminarMenu:", error)
    return { success: false, error: error.message }
  }
}

