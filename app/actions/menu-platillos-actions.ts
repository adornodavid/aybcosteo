"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { MenuPlatillo, Platillo, ApiResponse } from "@/lib/types-sistema-costeo"

interface AgregarPlatilloData {
  menuid: number
  platilloid: number
  precioventa: number
  costoplatillo: number // Mantener por si se usa en otro lado, aunque el margen usará costoadministrativo
  costoadministrativo: number // Nuevo parámetro para el costo administrativo
  activo?: boolean
  costoporcentual: number // Nuevo parámetro para el costo porcentual
}

interface ActualizarPrecioVentaData {
  menuid: number
  platilloid: number
  precioventa: number
  costoplatillo: number // Mantener por si se usa en otro lado
  costoadministrativo: number // Añadido para calcular margen
  costoporcentual: number // Nuevo parámetro para el costo porcentual
}

export async function agregarPlatilloAMenu(data: AgregarPlatilloData) {
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

    // --- INICIO: Lógica de Histórico para agregarPlatilloAMenu ---
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1 // getMonth() devuelve 0-11, necesitamos 1-12

    // 1. Verificar si ya existe un registro para este platillo y el mes actual en 'historico'
    const { data: existingHistorico, error: checkError } = await supabase
      .from("historico")
      .select("idrec") // Solo necesitamos saber si existe
      .eq("platilloid", data.platilloid)
      .eq("menuid", data.menuid)
      .gte("fechacreacion", `${year}-${month.toString().padStart(2, "0")}-01`)
      .lt("fechacreacion", `${year}-${(month + 1).toString().padStart(2, "0")}-01`)

    if (checkError) {
      console.error("Error al verificar registro histórico existente (agregar):", checkError)
      // Puedes decidir cómo manejar este error, por ahora, solo se registrará
    }

    if (existingHistorico && existingHistorico.length > 0) {
      // Si existe, realizar UPDATE
      console.log(
        `Actualizando registro histórico para platillo ${data.platilloid} en el mes ${month}/${year} (agregar)`,
      )
      const { error: updateHistoricoError } = await supabase
        .from("historico")
        .update({
          precioventa: data.precioventa,
          costoporcentual: data.costoporcentual,
        })
        .eq("platilloid", data.platilloid)
        .eq("menuid", data.menuid)
        .gte("fechacreacion", `${year}-${month.toString().padStart(2, "0")}-01`)
        .lt("fechacreacion", `${year}-${(month + 1).toString().padStart(2, "0")}-01`)

      if (updateHistoricoError) {
        console.error("Error al actualizar histórico (agregar):", updateHistoricoError)
        // Manejar error
      }
    } else {
      // Si no existe, realizar INSERTs
      console.log(
        `Insertando nuevos registros históricos para platillo ${data.platilloid} en el mes ${month}/${year} (agregar)`,
      )

      const todayString = new Date().toISOString().split("T")[0] // Para la fecha de inserción

      // Primero, obtener hotelid y restauranteid
      const { data: menuDetails, error: menuDetailsError } = await supabase
        .from("menus")
        .select("restauranteid, restaurantes(hotelid)")
        .eq("id", data.menuid)
        .single()

      if (menuDetailsError || !menuDetails || !menuDetails.restaurantes) {
        console.error("Error al obtener detalles del menú para inserción histórica (agregar):", menuDetailsError)
        // No retornamos un error aquí para no detener la actualización principal,
        // pero el insert en histórico no se realizará.
      } else {
        const restauranteId = menuDetails.restauranteid
        const hotelId = menuDetails.restaurantes.hotelid

        // Insertar para recetasxplatillo
        const { data: recetasData, error: recetasError } = await supabase
          .from("recetasxplatillo")
          .select("recetaid, recetacostoparcial")
          .eq("platilloid", data.platilloid)

        if (recetasError) {
          console.error("Error al obtener recetasxplatillo para inserción histórica (agregar):", recetasError)
          // Continuar, pero registrar el error
        }

        if (recetasData && recetasData.length > 0) {
          const historicoRecetasToInsert = recetasData.map((r) => ({
            hotelid: hotelId,
            restauranteid: restauranteId,
            menuid: data.menuid,
            platilloid: data.platilloid,
            ingredienteid: null,
            recetaid: r.recetaid,
            cantidad: null, // Según la consulta SQL, es null para recetas
            costo: r.recetacostoparcial,
            activo: true,
            fechacreacion: todayString,
            precioventa: data.precioventa,
            costoporcentual: data.costoporcentual,
          }))
          const { error: insertRecetasError } = await supabase.from("historico").insert(historicoRecetasToInsert)
          if (insertRecetasError) {
            console.error("Error al insertar histórico (recetas - agregar):", insertRecetasError)
            // Manejar error
          }
        }

        // Insertar para ingredientesxplatillo
        const { data: ingredientesData, error: ingredientesError } = await supabase
          .from("ingredientesxplatillo")
          .select("ingredienteid, cantidad, ingredientecostoparcial")
          .eq("platilloid", data.platilloid)

        if (ingredientesError) {
          console.error("Error al obtener ingredientesxplatillo para inserción histórica (agregar):", ingredientesError)
          // Continuar, pero registrar el error
        }

        if (ingredientesData && ingredientesData.length > 0) {
          const historicoIngredientesToInsert = ingredientesData.map((i) => ({
            hotelid: hotelId,
            restauranteid: restauranteId,
            menuid: data.menuid,
            platilloid: data.platilloid,
            ingredienteid: i.ingredienteid,
            recetaid: null,
            cantidad: i.cantidad,
            costo: i.ingredientecostoparcial,
            activo: true,
            fechacreacion: todayString,
            precioventa: data.precioventa,
            costoporcentual: data.costoporcentual,
          }))
          const { error: insertIngredientesError } = await supabase
            .from("historico")
            .insert(historicoIngredientesToInsert)
          if (insertIngredientesError) {
            console.error("Error al insertar histórico (ingredientes - agregar):", insertIngredientesError)
            // Manejar error
          }
        }
      }
    }
    // --- FIN: Lógica de Histórico para agregarPlatilloAMenu ---

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

export async function actualizarPrecioVenta(data: ActualizarPrecioVentaData) {
  try {
    // Modificación aquí: margenUtilidad ahora usa costoadministrativo
    const margenUtilidad = data.precioventa - data.costoadministrativo

    const { data: result, error } = await supabase
      .from("platillosxmenu") // Usar 'platillosxmenu'
      .update({
        precioventa: data.precioventa, // Usar 'precioventa'
        margenutilidad: margenUtilidad, // Actualizar margen de utilidad
        precioconiva: (data.precioventa * .16) + data.precioventa, // Usar 'precioventa'
        // No hay 'updated_at' en tu SQL, así que lo omito
      })
      .eq("menuid", data.menuid) // Usar 'menuid'
      .eq("platilloid", data.platilloid) // Usar 'platilloid'
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar precio de venta en platillosxmenu:", error)
      return { data: null, error: error.message }
    }

    revalidatePath(`/menus/${data.menuid}/agregar`) // Revalidar la página de agregar
    revalidatePath("/menus")
    revalidatePath("/platillos")

    // --- INICIO: Lógica de Histórico ---
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1 // getMonth() devuelve 0-11, necesitamos 1-12

    console.log("year: ", year, "month: ", month)

    // 1. Verificar si ya existe un registro para este platillo y el mes actual en 'historico'
    const { data: existingHistorico, error: checkError } = await supabase
      .from("historico")
      .select("idrec") // Solo necesitamos saber si existe
      .eq("platilloid", data.platilloid)
      .eq("menuid", data.menuid)
      .gte("fechacreacion", `${year}-${month.toString().padStart(2, "0")}-01`)
      .lt("fechacreacion", `${year}-${(month + 1).toString().padStart(2, "0")}-01`)

    if (checkError) {
      console.error("Error al verificar registro histórico existente:", checkError)
      // Puedes decidir cómo manejar este error, por ahora, solo se registrará
    }

    if (existingHistorico && existingHistorico.length > 0) {
      // Si existe, realizar UPDATE
      console.log(`Actualizando registro histórico para platillo ${data.platilloid} en el mes ${month}/${year}`)
      const { error: updateHistoricoError } = await supabase
        .from("historico")
        .update({
          precioventa: data.precioventa,
          costoporcentual: data.costoporcentual,
        })
        .eq("platilloid", data.platilloid)
        .eq("menuid", data.menuid)
        .gte("fechacreacion", `${year}-${month.toString().padStart(2, "0")}-01`)
        .lt("fechacreacion", `${year}-${(month + 1).toString().padStart(2, "0")}-01`)

      if (updateHistoricoError) {
        console.error("Error al actualizar histórico:", updateHistoricoError)
        // Manejar error
      }
    } else {
      // Si no existe, realizar INSERTs
      console.log(`Insertando nuevos registros históricos para platillo ${data.platilloid} en el mes ${month}/${year}`)

      const todayString = new Date().toISOString().split("T")[0] // Para la fecha de inserción

      // Primero, obtener hotelid y restauranteid
      const { data: menuDetails, error: menuDetailsError } = await supabase
        .from("menus")
        .select("restauranteid, restaurantes(hotelid)")
        .eq("id", data.menuid)
        .single()

      if (menuDetailsError || !menuDetails || !menuDetails.restaurantes) {
        console.error("Error al obtener detalles del menú para inserción histórica:", menuDetailsError)
        // No retornamos un error aquí para no detener la actualización principal,
        // pero el insert en histórico no se realizará.
      } else {
        const restauranteId = menuDetails.restauranteid
        const hotelId = menuDetails.restaurantes.hotelid

        // Insertar para recetasxplatillo
        const { data: recetasData, error: recetasError } = await supabase
          .from("recetasxplatillo")
          .select("recetaid, recetacostoparcial, cantidad")
          .eq("platilloid", data.platilloid)

        if (recetasError) {
          console.error("Error al obtener recetasxplatillo para inserción histórica:", recetasError)
          // Continuar, pero registrar el error
        }

        if (recetasData && recetasData.length > 0) {
          const historicoRecetasToInsert = recetasData.map((r) => ({
            hotelid: hotelId,
            restauranteid: restauranteId,
            menuid: data.menuid,
            platilloid: data.platilloid,
            ingredienteid: null,
            recetaid: r.recetaid,
            cantidad: r.cantidad,
            costo: r.recetacostoparcial,
            activo: true,
            fechacreacion: todayString,
            precioventa: data.precioventa,
            costoporcentual: data.costoporcentual,
          }))
          const { error: insertRecetasError } = await supabase.from("historico").insert(historicoRecetasToInsert)
          if (insertRecetasError) {
            console.error("Error al insertar histórico (recetas):", insertRecetasError)
            // Manejar error
          }
        }

        // Insertar para ingredientesxplatillo
        const { data: ingredientesData, error: ingredientesError } = await supabase
          .from("ingredientesxplatillo")
          .select("ingredienteid, cantidad, ingredientecostoparcial")
          .eq("platilloid", data.platilloid)

        if (ingredientesError) {
          console.error("Error al obtener ingredientesxplatillo para inserción histórica:", ingredientesError)
          // Continuar, pero registrar el error
        }

        if (ingredientesData && ingredientesData.length > 0) {
          const historicoIngredientesToInsert = ingredientesData.map((i) => ({
            hotelid: hotelId,
            restauranteid: restauranteId,
            menuid: data.menuid,
            platilloid: data.platilloid,
            ingredienteid: i.ingredienteid,
            recetaid: null,
            cantidad: i.cantidad,
            costo: i.ingredientecostoparcial,
            activo: true,
            fechacreacion: todayString,
            precioventa: data.precioventa,
            costoporcentual: data.costoporcentual,
          }))
          const { error: insertIngredientesError } = await supabase
            .from("historico")
            .insert(historicoIngredientesToInsert)
          if (insertIngredientesError) {
            console.error("Error al insertar histórico (ingredientes):", insertIngredientesError)
            // Manejar error
          }
        }
      }
    }
    // --- FIN: Lógica de Histórico ---

    return { data: result, error: null }
  } catch (error: any) {
    console.error("Error en actualizarPrecioVenta:", error)
    return { data: null, error: error.message }
  }
}

export async function obtenerPlatillosDeMenu(menuid: number): Promise<ApiResponse<MenuPlatillo[]>> {
  try {
    // 1. Obtener el valor de configuraciones.valorfloat (id = 2)
    const { data: configData, error: configError } = await supabase
      .from("configuraciones")
      .select("valorfloat")
      .eq("id", 2)
      .single()

    if (configError) {
      console.error("Error al obtener configuración para precio sugerido:", configError)
      // Si hay un error, el valorfloat será 0 o null, lo que resultará en precioSugerido = 0
    }

    const valorFloatConfig = configData?.valorfloat || 0

    // 2. Obtener los platillos del menú con sus costos
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

    // 3. Mapear los datos y calcular precioSugerido para cada platillo
    const mappedData = data.map((item: any) => {
      let precioSugeridoCalculado = 0
      if (item.platillos?.costoadministrativo !== null && valorFloatConfig !== 0) {
        precioSugeridoCalculado = item.platillos.costoadministrativo / valorFloatConfig
      }

      return {
        id: item.id,
        menuid: menuid,
        platilloid: item.platilloid,
        precioventa: item.precioventa,
        fechacreacion: item.fechacreacion,
        activo: item.platillos.activo,
        platillos: {
          id: item.platillos.id,
          nombre: item.platillos.nombre,
          descripcion: item.platillos.descripcion,
          instruccionespreparacion: item.platillos.instruccionespreparacion,
          imgurl: item.platillos.imgurl,
          costototal: item.platillos.costototal,
          costoadministrativo: item.platillos.costoadministrativo,
          activo: item.platillos.activo,
          precioSugerido: precioSugeridoCalculado, // <--- AQUI SE AGREGA EL CAMPO CALCULADO
        },
      }
    })

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
