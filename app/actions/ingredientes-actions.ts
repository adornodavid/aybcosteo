"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { registrarBitacora } from "@/app/actions/bitacora-actions"
import { BITACORA_ACTIVIDADES, BITACORA_MODULOS } from "@/lib/bitacora-actividades"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function obtenerIngredientes(hotelId?: number) {
  try {
    let query = supabaseAdmin // Usando supabaseAdmin
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
    const { data, error } = await supabaseAdmin // Usando supabaseAdmin
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
    const { data, error } = await supabaseAdmin // Usando supabaseAdmin
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

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.CREAR_INGREDIENTE,
      observaciones: `Creó insumo «${ingredienteData.nombre ?? "?"}» (código «${ingredienteData.codigo ?? ""}», hotel ${ingredienteData.hotelid ?? "?"}).`,
      modulo: BITACORA_MODULOS.INGREDIENTES,
      recursoid: data?.id ? Number(data.id) : null,
    })

    return { success: true, data }
  } catch (error: any) {
    console.error("Error creando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarIngrediente(id: number, ingredienteData: any) {
  try {
    const { error } = await supabaseAdmin // Usando supabaseAdmin
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

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.ACTUALIZAR_INGREDIENTE,
      observaciones: `Actualizó insumo «${ingredienteData.nombre ?? "?"}» (id ${id}).`,
      modulo: BITACORA_MODULOS.INGREDIENTES,
      recursoid: id,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error actualizando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function eliminarIngrediente(id: number) {
  try {
    // Capturar nombre antes del soft-delete para que el log sea legible.
    const { data: prev } = await supabaseAdmin
      .from("ingredientes")
      .select("nombre, codigo")
      .eq("id", id)
      .single()

    const { error } = await supabaseAdmin // Usando supabaseAdmin
      .from("ingredientes")
      .update({
        activo: false,
        fechamodificacion: new Date().toISOString().split("T")[0],
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/ingredientes")

    const nom = (prev as any)?.nombre ?? "(sin nombre)"
    const cod = (prev as any)?.codigo ?? ""
    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.ELIMINAR_INGREDIENTE,
      observaciones: `Eliminó (desactivó) insumo «${nom}»${cod ? ` (código «${cod}»)` : ""} (id ${id}).`,
      modulo: BITACORA_MODULOS.INGREDIENTES,
      recursoid: id,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error eliminando ingrediente:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerCategorias() {
  try {
    const { data, error } = await supabaseAdmin // Usando supabaseAdmin
      .from("categoriaingredientes")
      .select("*")
      .order("descripcion")

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

export async function obtenerHoteles(rolId?: number, hotelId?: number) {
  try {
    // Verificar que las variables de entorno estén disponibles
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Variables de entorno de Supabase no configuradas")
      return { success: false, data: [], error: "Configuración de Supabase faltante" }
    }

    // Lógica de filtrado por rol
    // Si rolId es 1, 2, 3 o 4: mostrar todos los hoteles
    // Si rolId es 5 o 6: mostrar solo el hotel asignado al usuario
    if (rolId && hotelId && ![1, 2, 3, 4].includes(rolId)) {
      // Filtrar por el hotel del usuario
      const { data, error } = await supabaseAdmin
        .from("hoteles")
        .select("id, nombre")
        .eq("activo", true)
        .eq("id", hotelId)
        .order("nombre", { ascending: true })

      if (error) {
        console.error("Error en query hotel específico:", error)
        return { success: false, data: [], error: error.message }
      }

      return { success: true, data: data || [] }
    } else {
      // Mostrar todos los hoteles
      const { data, error } = await supabaseAdmin
        .from("hoteles")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre", { ascending: true })

      if (error) {
        console.error("Error en query hoteles:", error)
        return { success: false, data: [], error: error.message }
      }

      return { success: true, data: data || [] }
    }
  } catch (error: any) {
    console.error("Error obteniendo hoteles:", error)
    return { success: false, data: [], error: error.message || "Error desconocido" }
  }
}

export async function obtenerCategoriasIngredientes() {
  try {
    const { data, error } = await supabaseAdmin // Usando supabaseAdmin
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

export async function obtenerTipoUnidadMedida() {
  try {
    const { data, error } = await supabaseAdmin
      .from("tipounidadmedida")
      .select("id, descripcion")
      .order("descripcion", { ascending: true })

    if (error) {
      console.error("Error obteniendo tipos de unidad de medida:", error)
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error obteniendo tipos de unidad de medida:", error)
    return { success: false, data: [], error: error.message }
  }
}

export async function validarCodigoIngrediente(codigo: string, hotelid: number) {
  try {
    if (!codigo || !codigo.trim() || !hotelid) {
      return { success: false, exists: false, error: "Código u hotel inválido" }
    }

    const { data, error } = await supabaseAdmin
      .from("ingredientes")
      .select("id")
      .eq("hotelid", hotelid)
      .eq("codigo", codigo.trim())
      .limit(1)

    if (error) {
      console.error("Error validando código:", error)
      return { success: false, exists: false, error: error.message }
    }

    return { success: true, exists: (data?.length || 0) > 0 }
  } catch (error: any) {
    console.error("Error validando código:", error)
    return { success: false, exists: false, error: error.message }
  }
}

export async function registrarInsumo(insumo: {
  codigo: string
  hotelid: number
  nombre: string
  categoriaid: number
  unidadmedidaid: number
  costo: number
  conversion: number
  porcentajemerma: number
  codigorapsodia?: string | null
}) {
  try {
    if (!insumo.codigo?.trim() || !insumo.hotelid || !insumo.nombre?.trim()) {
      return { success: false, error: "Faltan campos obligatorios" }
    }

    const { data: existente, error: errExist } = await supabaseAdmin
      .from("ingredientes")
      .select("id")
      .eq("hotelid", insumo.hotelid)
      .eq("codigo", insumo.codigo.trim())
      .limit(1)

    if (errExist) throw errExist
    if (existente && existente.length > 0) {
      return { success: false, error: "El código ya existe para este hotel" }
    }

    const { data, error } = await supabaseAdmin
      .from("ingredientes")
      .insert([
        {
          codigo: insumo.codigo.trim(),
          hotelid: insumo.hotelid,
          nombre: insumo.nombre.trim(),
          categoriaid: insumo.categoriaid,
          unidadmedidaid: insumo.unidadmedidaid,
          costo: insumo.costo,
          conversion: insumo.conversion,
          porcentajemerma: insumo.porcentajemerma,
          codigorapsodia: insumo.codigorapsodia?.trim() || null,
          activo: true,
          fechacreacion: new Date().toISOString().split("T")[0],
        },
      ])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/ingredientes")

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.CREAR_INGREDIENTE,
      observaciones: `Registró insumo «${insumo.nombre}» (código «${insumo.codigo}», hotel ${insumo.hotelid}).`,
      modulo: BITACORA_MODULOS.INGREDIENTES,
      recursoid: data?.id ? Number(data.id) : null,
    })

    return { success: true, data }
  } catch (error: any) {
    console.error("Error registrando insumo:", error)
    return { success: false, error: error.message }
  }
}

export async function actualizarInsumo(
  id: number,
  insumo: {
    nombre: string
    categoriaid: number | null
    unidadmedidaid: number
    costo: number
    conversion: number
    porcentajemerma: number
    codigorapsodia?: string | null
  },
) {
  try {
    if (!id || !insumo.nombre?.trim()) {
      return { success: false, error: "Faltan datos obligatorios" }
    }

    const { error } = await supabaseAdmin
      .from("ingredientes")
      .update({
        nombre: insumo.nombre.trim(),
        categoriaid: insumo.categoriaid,
        unidadmedidaid: insumo.unidadmedidaid,
        costo: insumo.costo,
        conversion: insumo.conversion,
        porcentajemerma: insumo.porcentajemerma,
        codigorapsodia: insumo.codigorapsodia?.trim() || null,
        fechamodificacion: new Date().toISOString().split("T")[0],
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/ingredientes")

    await registrarBitacora({
      actividad: BITACORA_ACTIVIDADES.ACTUALIZAR_INGREDIENTE,
      observaciones: `Actualizó insumo «${insumo.nombre}» (id ${id}).`,
      modulo: BITACORA_MODULOS.INGREDIENTES,
      recursoid: id,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error actualizando insumo:", error)
    return { success: false, error: error.message }
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
    const { codigo, nombre, hotelId, categoriaId, page = 1, limit = 20 } = filtros
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin // Usando supabaseAdmin
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
