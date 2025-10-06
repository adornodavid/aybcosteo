"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { obtenerVariablesSesion as getSessionData } from "./session-actions-with-expiration" // Importa la función correcta y renómbrala

// Tipos para los datos que devuelven las funciones
type Hotel = { id: number; nombre: string }
type Restaurante = { id: number; nombre: string }
type Menu = { id: number; nombre: string }
type Ingrediente = { id: number; nombre: string; costo: number | null; codigo: string } // Añadido el campo codigo
type Receta = {
  id: number
  nombre: string
  costo: number | null
  cantidad: number | null // Añadido para la cantidad base de la receta
  unidadbaseid: number | null // Añadido para la unidad base de la receta
  tipounidadmedida: {
    descripcion: string
  } | null // Añadido para la descripción de la unidad base
}
type UnidadMedida = { id: number; descripcion: string; calculoconversion: number | null }
type IngredienteAgregado = {
  id: number
  nombre: string
  cantidad: number
  ingredientecostoparcial: number
  unidad: string
} // Añadido 'unidad'
type RecetaAgregada = { id: number; nombre: string; recetacostoparcial: number }

// --- ACCIONES DE SESIÓN Y DATOS ---

export async function obtenerVariablesSesion() {
  const session = await getSessionData() // Usa la función renombrada

  return {
    SesionActiva: session?.SesionActiva ? "true" : "false",
    RolId: session?.RolId?.toString() || "0",
    HotelId: session?.HotelId?.toString() || "0",
  }
}

export async function getHoteles(hotelId: number): Promise<Hotel[]> {
  const supabase = createServerComponentClient({ cookies })
  let query = supabase.from("hoteles").select("id, nombre")
  if (hotelId !== -1) {
    query = query.eq("id", hotelId)
  }
  const { data, error } = await query.order("nombre", { ascending: true })
  if (error) {
    console.error("Error fetching hoteles:", error)
    return []
  }
  return data || []
}

export async function getRestaurantes(hotelId: number): Promise<Restaurante[]> {
  const supabase = createServerComponentClient({ cookies })
  const { data, error } = await supabase
    .from("restaurantes")
    .select("id, nombre")
    .eq("hotelid", hotelId) // Usar 'hotelid' según tu SQL
    .order("nombre")
  if (error) {
    console.error("Error fetching restaurantes:", error)
    return []
  }
  return data || []
}

export async function getMenus(restauranteId: number, hotelId: number): Promise<Menu[]> {
  const supabase = createServerComponentClient({ cookies })
  // Adaptado a tu SQL: SELECT a.id, a.nombre from menus a inner join restaurantes b on a.restauranteid = b.id inner join hoteles c on b.hotelid = c.id where b.id =[ddlRestaurante.value] and c.id = [ddlHotel.value]
  const { data, error } = await supabase
    .from("menus")
    .select(
      `
    id,
    nombre,
    restaurantes!inner(
      id,
      hotelid
    )
  `,
    )
    .eq("restaurantes.id", restauranteId)
    .eq("restaurantes.hotelid", hotelId)
    .order("nombre")

  if (error) {
    console.error("Error fetching menus:", error)
    return []
  }
  return data || []
}

export async function getIngredientes(hotelId: number): Promise<Ingrediente[]> {
  const supabase = createServerComponentClient({ cookies })
  // Adaptado a tu SQL: select id, nombre from ingredientes where hotelid = [ddlHotel.value]
  // Incluyo 'costo' para el campo bloqueado 'txtCostoIngrediente'
  const { data, error } = await supabase
    .from("ingredientes")
    .select("id, nombre, codigo, costo") // Asegúrate de que 'nombre', 'codigo' y 'costo' existan en tu tabla 'ingredientes'
    .eq("hotelid", hotelId) // Asegúrate de que 'hotelid' exista en tu tabla 'ingredientes'
    .order("nombre", { ascending: true })
  if (error) {
    console.error("Error fetching ingredientes:", error)
    return []
  }
  return data || []
}

// NUEVA FUNCIÓN: Buscar ingredientes por término de búsqueda
export async function searchIngredientes(hotelId: number, searchTerm: string): Promise<Ingrediente[]> {
  const supabase = createServerComponentClient({ cookies })
  let query = supabase
    .from("ingredientes")
    .select("id, nombre, codigo, costo") // Incluir 'codigo'
    .eq("hotelid", hotelId)

  if (searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    query = query.or(`nombre.ilike.%${lowerCaseSearchTerm}%,codigo.ilike.%${lowerCaseSearchTerm}%`)
  }

  const { data, error } = await query.order("nombre", { ascending: true })
  if (error) {
    console.error("Error searching ingredientes:", error)
    return []
  }
  return data || []
}

export async function getRecetas(hotelId: number): Promise<Receta[]> {
  const supabase = createServerComponentClient({ cookies })
  // Adaptado a tu SQL: SELECT distinct a.id, a.nombre from recetas a inner join ingredientesxreceta b on a.id = b.recetaid inner join ingredientes c on b.ingredienteid = c.id inner join hoteles d on c.hotelid = d.id WHERE d.id = [ddlHotel.value] AND a.activo = true;
  // Incluyo 'costo', 'cantidad' y 'unidadbaseid' con su descripción para los campos bloqueados
  // ASUMPTION: 'recetas' table has 'cantidad' and 'unidadbaseid' columns.
  const { data, error } = await supabase
    .from("recetas")
    .select(
      `
    id,
    nombre,
    costo,
    cantidad,
    unidadbaseid,
    tipounidadmedida(
      descripcion
    )
  `,
    ) // Asegúrate de que 'costo', 'cantidad', 'unidadbaseid' existan en tu tabla 'recetas'
    .eq("activo", true)
    .order("nombre", { ascending: true })
  // Nota: La lógica de filtrar por hotel_id a través de ingredientesxreceta e ingredientes
  // es compleja para una simple selección de recetas. Si 'recetas' tiene un 'hotel_id' directo,
  // sería más eficiente. Por ahora, se asume que 'recetas' no tiene 'hotel_id' directo
  // y se traen todas las recetas activas, o se necesita una función RPC para el filtro complejo.
  // Si 'recetas' tiene 'hotel_id', descomenta la siguiente línea:
  // .eq("hotel_id", hotelId)
  if (error) {
    console.error("Error fetching recetas:", error)
    return []
  }
  return data || []
}

// NUEVA FUNCIÓN: Obtener unidades de medida por ingrediente
export async function getUnidadesMedidaByIngrediente(ingredienteId: number): Promise<UnidadMedida[]> {
  const supabase = createServerComponentClient({ cookies })
  // SQL proporcionado: SELECT b.id, b.descripcion from ingredientes a inner join tipounidadmedida b on a.unidadmedidaid = b.id where a.id = [ddlIngredientes.value]
  const { data, error } = await supabase
    .from("ingredientes")
    .select(
      `
    unidadmedidaid,
    tipounidadmedida(
      id,
      descripcion,
      calculoconversion
    )
  `,
    )
    .eq("id", ingredienteId)
    .single() // Asumiendo que ingrediente.id es único y tiene una sola unidad asociada

  if (error) {
    console.error("Error fetching unidad de medida por ingrediente:", error)
    return []
  }

  if (!data || !data.tipounidadmedida) {
    return []
  }

  const unit = data.tipounidadmedida
  return [{ id: unit.id, descripcion: unit.descripcion, calculoconversion: unit.calculoconversion }]
}

// NUEVA FUNCIÓN: Obtener el costo total de un platillo y el costo administrativo
export async function getPlatilloTotalCost(
  platilloId: number,
): Promise<{ totalCost: number; costoAdministrativo: number; precioSugerido: number }> {
  const supabase = createServerComponentClient({ cookies })

  // Fetch sum of ingredient costs
  const { data: ingredientesSum, error: ingSumError } = await supabase
    .from("ingredientesxplatillo")
    .select("ingredientecostoparcial")
    .eq("platilloid", platilloId)

  if (ingSumError) {
    console.error("Error fetching ingredient costs for total:", ingSumError)
    return { totalCost: 0, costoAdministrativo: 0, precioSugerido: 0 }
  }
  const totalIngredientesCost = ingredientesSum.reduce((sum, item) => sum + (item.ingredientecostoparcial || 0), 0)

  // Fetch sum of recipe costs
  const { data: recetasSum, error: recSumError } = await supabase
    .from("recetasxplatillo")
    .select("recetacostoparcial")
    .eq("platilloid", platilloId)

  if (recSumError) {
    console.error("Error fetching recipe costs for total:", recSumError)
    const totalCost = totalIngredientesCost
    // If recipes fail, we still need a totalCost and a default costoAdministrativo
    // Attempt to get config for administrative cost even if recipes fail
    const { data: configData, error: configError } = await supabase
      .from("configuraciones")
      .select("valorfloat")
      .eq("id", 1)
      .single()

    const valorFloatConfig = configError || !configData ? 0 : configData.valorfloat || 0
    const costoAdministrativo = totalCost * valorFloatConfig + totalCost

    return { totalCost, costoAdministrativo, precioSugerido: 0 }
  }
  const totalRecetasCost = recetasSum.reduce((sum, item) => sum + (item.recetacostoparcial || 0), 0)

  const totalCost = totalIngredientesCost + totalRecetasCost

  // Get valorfloat from configuraciones where id = 1 for administrative cost
  const { data: configData, error: configError } = await supabase
    .from("configuraciones")
    .select("valorfloat")
    .eq("id", 1)
    .single()

  if (configError || !configData) {
    console.error("Error al obtener la configuración para el costo administrativo (ID 1):", configError)
    // Return totalCost and a default costoAdministrativo if config fails
    console.log("getPlatilloTotalCost (Error Config ID 1):")
    console.log("  totalCost:", totalCost)
    console.log("  costoAdministrativo (fallback):", totalCost)
    return { totalCost, costoAdministrativo: totalCost, precioSugerido: 0 } // Or 0, depending on desired fallback
  }
  const valorFloatConfig = configData.valorfloat || 0 // Asegurarse de que sea un número, por defecto 0 si es null/undefined

  // Calculate costoAdministrativo
  const costoAdministrativo = totalCost * valorFloatConfig + totalCost

  // Obtener valorfloat de la tabla configuraciones para Precio Sugerido (id = 2)
  const { data: configPrecioSugeridoData, error: configPrecioSugeridoError } = await supabase
    .from("configuraciones")
    .select("valorfloat")
    .eq("id", 2)
    .single()

  if (configPrecioSugeridoError || !configPrecioSugeridoData) {
    console.error("Error al obtener la configuración para el precio sugerido (ID 2):", configPrecioSugeridoError)
    // Return default if config fails
    console.log("getPlatilloTotalCost (Error Config ID 2):")
    console.log("  totalCost:", totalCost)
    console.log("  costoAdministrativo:", costoAdministrativo)
    console.log("  precioSugerido (fallback):", 0)
    return { totalCost, costoAdministrativo, precioSugerido: 0 }
  }
  const valorFloatPrecioSugerido = configPrecioSugeridoData.valorfloat || 1 // Default to 1 to avoid division by zero

  // Calcular Precio Sugerido
  const precioSugerido = valorFloatPrecioSugerido !== 0 ? costoAdministrativo / valorFloatPrecioSugerido : 0

  console.log("getPlatilloTotalCost (Final):")
  console.log("  platilloId:", platilloId)
  console.log("  totalCost:", totalCost)
  console.log("  valorFloatConfig (ID 1):", valorFloatConfig)
  console.log("  costoAdministrativo:", costoAdministrativo)
  console.log("  valorFloatPrecioSugerido (ID 2):", valorFloatPrecioSugerido)
  console.log("  precioSugerido:", precioSugerido)

  return { totalCost, costoAdministrativo, precioSugerido }
}

// --- ACCIONES DEL WIZARD ---

export async function registrarPlatilloBasico(formData: FormData) {
  const supabase = createServerComponentClient({ cookies })
  const nombre = formData.get("nombre") as string
  const descripcion = formData.get("descripcion") as string
  const instruccionespreparacion = formData.get("instruccionespreparacion") as string
  const tiempopreparacion = formData.get("tiempopreparacion") as string
  const imagen = formData.get("imagen") as File | null // Ahora es opcional

  let imgUrl: string | null = null
  if (imagen && imagen.size > 0) {
    try {
      const fileExt = imagen.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `Platillos/${fileName}`
      const { error: uploadError } = await supabase.storage.from("imagenes").upload(filePath, imagen)
      if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`)

      const { data: urlData } = supabase.storage.from("imagenes").getPublicUrl(filePath)
      imgUrl = urlData.publicUrl
    } catch (uploadError: any) {
      console.error("Error al subir imagen:", uploadError)
      return { success: false, error: `Error al subir imagen: ${uploadError.message}` }
    }
  }

  try {
    // Insertar en la tabla platillos
    const { data, error: insertError } = await supabase
      .from("platillos")
      .insert({
        nombre,
        descripcion,
        instruccionespreparacion: instruccionespreparacion || null, // Nulo si está vacío
        tiempopreparacion: tiempopreparacion ? Number(tiempopreparacion) : null, // Nulo si está vacío
        imgurl: imgUrl,
        activo: true, // Se maneja la lógica de borrado si no se completa
        fechacreacion: new Date().toISOString(),
        // hotel_id y restaurante_id se asignan en platillosxmenu
      })
      .select("id")
      .single()

    if (insertError) throw insertError

    return { success: true, platilloId: data.id }
  } catch (e: any) {
    console.error("Error en registrarPlatilloBasico:", e)
    // Si la inserción falla y se subió una imagen, intentar borrarla
    if (imgUrl) {
      const filePath = imgUrl.split("/imagenes/")[1]
      if (filePath) {
        await supabase.storage.from("imagenes").remove([filePath])
      }
    }
    return { success: false, error: e.message }
  }
}

export async function agregarIngrediente(
  platilloId: number,
  ingredienteId: number,
  cantidad: number,
  unidadId: number,
) {
  const supabase = createServerComponentClient({ cookies })
  try {
    // Validar si el ingrediente ya existe en el platillo
    const { data: existingEntry, error: checkError } = await supabase
      .from("ingredientesxplatillo")
      .select("id")
      .eq("platilloid", platilloId)
      .eq("ingredienteid", ingredienteId)
      .maybeSingle()

    if (checkError) {
      console.error("Error al verificar existencia de ingrediente:", checkError)
      throw new Error("Error al verificar existencia del ingrediente.")
    }

    if (existingEntry) {
      return {
        success: false,
        error: "No es posible agregar este ingrediente, puesto que ya se encuentra agregado a la receta.",
      }
    }

    // Obtener costo del ingrediente y factor de conversión de la unidad
    const { data: ingredienteData, error: ingredienteError } = await supabase
      .from("ingredientes")
      .select("costo, tipounidadmedida(descripcion)") // Añadido tipounidadmedida(descripcion)
      .eq("id", ingredienteId)
      .single()
    if (ingredienteError || !ingredienteData) throw new Error("No se encontró el ingrediente o su costo.")

    const { data: unidadData, error: unidadError } = await supabase
      .from("tipounidadmedida")
      .select("calculoconversion")
      .eq("id", unidadId)
      .single()
    if (unidadError || !unidadData) throw new Error("No se encontró la unidad de medida o su conversión.")

    const costoIngrediente = ingredienteData.costo || 0
    const calculoConversion = unidadData.calculoconversion || 1
    const costoParcial = cantidad * calculoConversion * costoIngrediente

    const { error: insertError } = await supabase.from("ingredientesxplatillo").insert({
      platilloid: platilloId,
      ingredienteid: ingredienteId,
      cantidad,
      ingredientecostoparcial: costoParcial,
      activo: true,
      fechacreacion: new Date().toISOString(),
      fechamodificacion: new Date().toISOString(),
    })
    if (insertError) throw insertError

    // Devolver la lista actualizada de ingredientes
    const { data: ingredientesActualizados, error: fetchError } = await supabase
      .from("ingredientesxplatillo")
      .select("id, cantidad, ingredientecostoparcial, ingredientes(nombre, tipounidadmedida(descripcion))") // Asegúrate de que 'nombre' exista en 'ingredientes' y 'descripcion' en 'tipounidadmedida'
      .eq("platilloid", platilloId)
    if (fetchError) throw fetchError

    const ingredientes: IngredienteAgregado[] = ingredientesActualizados.map((i: any) => ({
      id: i.id,
      nombre: i.ingredientes?.nombre || "Desconocido",
      cantidad: i.cantidad,
      ingredientecostoparcial: i.ingredientecostoparcial,
      unidad: i.ingredientes?.tipounidadmedida?.descripcion || "N/A", // Mapear la descripción de la unidad
    }))

    return { success: true, ingredientes }
  } catch (e: any) {
    console.error("Error en agregarIngrediente:", e)
    return { success: false, error: e.message }
  }
}

export async function agregarReceta(platilloId: number, recetaId: number, cantidadIngresada: number) {
  const supabase = createServerComponentClient({ cookies })
  try {
    // Validar si la sub-receta ya existe en el platillo
    const { data: existingEntry, error: checkError } = await supabase
      .from("recetasxplatillo")
      .select("id")
      .eq("platilloid", platilloId)
      .eq("recetaid", recetaId)
      .maybeSingle()

    if (checkError) {
      console.error("Error al verificar existencia de sub-receta:", checkError)
      throw new Error("Error al verificar existencia de la sub-receta.")
    }

    if (existingEntry) {
      console.log("error listo para mostrar modal")
      return {
        success: false,
        error: "No es posible agregar esta Sub-Receta, puesto que ya se encuentra agregada a la receta.",
      }
    }

    // Obtener costo y cantidad base de la receta
    const { data: recetaData, error: recetaError } = await supabase
      .from("recetas")
      .select("costo, cantidad") // Asegúrate de que 'costo' y 'cantidad' existan en tu tabla 'recetas'
      .eq("id", recetaId)
      .single()
    if (recetaError || !recetaData) throw new Error("No se encontró la receta o su costo/cantidad base.")

    const costoBaseReceta = recetaData.costo || 0
    const cantidadBaseReceta = recetaData.cantidad || 1 // Evitar división por cero

    // Calcular recetacostoparcial: costo/(cantidad/[txtCant]) => costo * (cantidadIngresada / cantidadBaseReceta)
    const recetacostoparcial = (costoBaseReceta / cantidadBaseReceta) * cantidadIngresada

    const { error: insertError } = await supabase.from("recetasxplatillo").insert({
      platilloid: platilloId,
      recetaid: recetaId,
      recetacostoparcial: recetacostoparcial, // Usar el costo parcial calculado
      cantidad: cantidadIngresada, // Guardar la cantidad usada
      activo: true,
      fechacreacion: new Date().toISOString(),
      fechamodificacion: new Date().toISOString(),
    })
    if (insertError) throw insertError

    // Devolver la lista actualizada de recetas
    const { data: recetasActualizadas, error: fetchError } = await supabase
      .from("recetasxplatillo")
      .select("id, recetacostoparcial, cantidad, recetas(nombre)") // Asegúrate de que 'nombre' exista en 'recetas' y 'cantidad'
      .eq("platilloid", platilloId)
    if (fetchError) throw fetchError

    const recetas: RecetaAgregada[] = recetasActualizadas.map((r: any) => ({
      id: r.id,
      nombre: r.recetas?.nombre || "Desconocido",
      recetacostoparcial: r.recetacostoparcial,
      cantidad: r.cantidad, // Mapear la cantidad
    }))

    return { success: true, recetas }
  } catch (e: any) {
    console.error("Error en agregarReceta:", e)
    return { success: false, error: e.message }
  }
}

export async function finalizarRegistro(
  platilloId: number,
  menuId: number,
  precioVenta: number,
  costoAdministrativo: number,
  precioConIVA: number,
  costoPorcentual: number,
  hotelId: number, // Agregar el nuevo parámetro
) {
  const supabase = createServerComponentClient({ cookies })
  try {
    // 1. Calcular y actualizar costototal en la tabla platillos
    const { data: ingredientesCost, error: ingCostError } = await supabase
      .from("ingredientesxplatillo")
      .select("ingredientecostoparcial")
      .eq("platilloid", platilloId)
    if (ingCostError) throw ingCostError

    const { data: recetasCost, error: recCostError } = await supabase
      .from("recetasxplatillo")
      .select("recetacostoparcial")
      .eq("platilloid", platilloId)
    if (recCostError) throw recCostError

    const totalCost =
      ingredientesCost.reduce((sum, item) => sum + (item.ingredientecostoparcial || 0), 0) +
      recetasCost.reduce((sum, item) => sum + (item.recetacostoparcial || 0), 0)

    const { error: updateCostoError } = await supabase
      .from("platillos")
      .update({
        costototal: totalCost,
        hotelid: hotelId, // Agregar la actualización del hotelid
      })
      .eq("id", platilloId)

    if (updateCostoError) throw updateCostoError

    //Actualizar costo administrativo
    // Obtener valorfloat de la tabla configuraciones
    const { data: configData, error: configError } = await supabase
      .from("configuraciones")
      .select("valorfloat")
      .eq("id", 1)
      .single()

    if (configError || !configData) {
      console.error("Error al obtener la configuración para el costo administrativo:", configError)
      throw new Error("No se pudo obtener la configuración para el costo administrativo.")
    }
    const valorFloatConfig = configData.valorfloat || 0 // Asegurarse de que sea un número, por defecto 0 si es null/undefined

    // Calcular costoadministrativo
    const costoAdministrativoCalculado = totalCost * valorFloatConfig + totalCost

    // Actualizar la columna costoadministrativo en la tabla platillos
    const { error: updateCostoAdminError } = await supabase
      .from("platillos")
      .update({ costoadministrativo: costoAdministrativoCalculado })
      .eq("id", platilloId)

    if (updateCostoAdminError) throw updateCostoAdminError

    // Calcular margen de utilidad
    const margenUtilidad = precioVenta - costoAdministrativo

    // 2. Insertar en platillosxmenu con precioventa, margenutilidad y precioconiva
    const { error: platillosxmenuError } = await supabase.from("platillosxmenu").insert({
      menuid: menuId,
      platilloid: platilloId,
      precioventa: precioVenta,
      margenutilidad: margenUtilidad,
      precioconiva: precioConIVA,
      activo: true,
      fechacreacion: new Date().toISOString(),
    })
    if (platillosxmenuError) throw platillosxmenuError

    // 3. Obtener hotelid y restauranteid a partir del menuId
    const { data: menuData, error: menuDataError } = await supabase
      .from("menus")
      .select(
        `
      restauranteid,
      restaurantes(hotelid)
    `,
      )
      .eq("id", menuId)
      .single()

    if (menuDataError || !menuData) throw new Error("No se pudo obtener la información del menú.")

    const restauranteId = menuData.restauranteid
    const hotelIdFromMenu = menuData.restaurantes?.hotelid

    if (!restauranteId || !hotelIdFromMenu)
      throw new Error("Información de restaurante o hotel no encontrada para el menú.")

    // 4. Insertar en historico (recetas)
    const { data: recetasData, error: recetasDataError } = await supabase
      .from("recetasxplatillo")
      .select("recetaid, recetacostoparcial, cantidad") // Incluir cantidad
      .eq("platilloid", platilloId)
    if (recetasDataError) throw recetasDataError

    if (recetasData && recetasData.length > 0) {
      const historicoRecetasInserts = recetasData.map((r: any) => ({
        hotelid: hotelIdFromMenu,
        restauranteid: restauranteId,
        menuid: menuId,
        platilloid: platilloId,
        ingredienteid: null,
        recetaid: r.recetaid,
        cantidad: r.cantidad, // Usar la cantidad de la sub-receta
        costo: r.recetacostoparcial,
        costoporcentual: costoPorcentual,
        precioventa: precioVenta,
        activo: true,
        fechacreacion: new Date().toISOString(),
      }))
      const { error: historicoRecetasInsertError } = await supabase.from("historico").insert(historicoRecetasInserts)
      if (historicoRecetasInsertError) throw historicoRecetasInsertError
    }

    // 5. Insertar en historico (ingredientes)
    const { data: ingredientesData, error: ingredientesDataError } = await supabase
      .from("ingredientesxplatillo")
      .select("ingredienteid, cantidad, ingredientecostoparcial")
      .eq("platilloid", platilloId)
    if (ingredientesDataError) throw ingredientesDataError

    if (ingredientesData && ingredientesData.length > 0) {
      const historicoIngredientesInserts = ingredientesData.map((i: any) => ({
        hotelid: hotelIdFromMenu,
        restauranteid: restauranteId,
        menuid: menuId,
        platilloid: platilloId,
        ingredienteid: i.ingredienteid,
        recetaid: null,
        cantidad: i.cantidad,
        costo: i.ingredientecostoparcial,
        costoporcentual: costoPorcentual,
        precioventa: precioVenta,
        activo: true,
        fechacreacion: new Date().toISOString(),
      }))
      const { error: historicoIngredientesInsertError } = await supabase
        .from("historico")
        .insert(historicoIngredientesInserts)
      if (historicoIngredientesInsertError) throw historicoIngredientesInsertError
    }

    return { success: true }
  } catch (e: any) {
    console.error("Error en finalizarRegistro:", e)
    return { success: false, error: e.message }
  }
}

// NUEVA SERVER ACTION: Para cancelar el registro y limpiar la base de datos
export async function cancelarRegistro(platilloId: number) {
  const supabase = createServerComponentClient({ cookies })
  try {
    // Obtener URL de la imagen para borrarla del storage antes de borrar el platillo
    const { data: platilloData, error: platilloFetchError } = await supabase
      .from("platillos")
      .select("imgurl") // Asegúrate de que 'imgurl' exista en tu tabla 'platillos'
      .eq("id", platilloId)
      .single()

    if (platilloFetchError) {
      console.warn("No se pudo obtener la URL de la imagen para el platillo a cancelar:", platilloFetchError)
    }

    // Borrar en orden inverso a la creación para evitar problemas de FK
    const { error: deleteIngredientesError } = await supabase
      .from("ingredientesxplatillo")
      .delete()
      .eq("platilloid", platilloId)
    if (deleteIngredientesError) throw deleteIngredientesError

    const { error: deleteRecetasError } = await supabase.from("recetasxplatillo").delete().eq("platilloid", platilloId)
    if (deleteRecetasError) throw deleteRecetasError

    const { error: deletePlatillosxMenuError } = await supabase
      .from("platillosxmenu")
      .delete()
      .eq("platilloid", platilloId)
    if (deletePlatillosxMenuError) throw deletePlatillosxMenuError

    const { error: deletePlatilloError } = await supabase.from("platillos").delete().eq("id", platilloId)
    if (deletePlatilloError) throw deletePlatilloError

    // Eliminar imagen del storage si existía
    if (platilloData?.imgurl) {
      const pathSegments = platilloData.imgurl.split("/imagenes/")
      const filePath = pathSegments.length > 1 ? pathSegments[1] : null
      if (filePath) {
        const { error: storageError } = await supabase.storage.from("imagenes").remove([filePath])
        if (storageError) {
          console.error("Error al eliminar imagen del storage:", storageError)
        }
      }
    }

    return { success: true }
  } catch (e: any) {
    console.error("Error al cancelar registro:", e)
    return { success: false, error: e.message }
  }
}

// NUEVA SERVER ACTION: Eliminar ingrediente de un platillo
export async function eliminarIngredienteDePlatillo(platilloId: number, ingredienteXPlatilloId: number) {
  const supabase = createServerComponentClient({ cookies })
  try {
    const { error } = await supabase
      .from("ingredientesxplatillo")
      .delete()
      .eq("platilloid", platilloId)
      .eq("id", ingredienteXPlatilloId) // Usar el ID de la relación ingredientesxplatillo

    if (error) {
      console.error("Error al eliminar ingrediente de platillo:", error)
      throw error
    }
    return { success: true }
  } catch (e: any) {
    console.error("Error en eliminarIngredienteDePlatillo:", e)
    return { success: false, error: e.message }
  }
}

// NUEVA SERVER ACTION: Eliminar sub-receta de un platillo
export async function eliminarRecetaDePlatillo(platilloId: number, Id: number) {
  const supabase = createServerComponentClient({ cookies })
  try {
    console.log("Entramos en la funcion de eliminar subreceta de receta para la receta")
    const { error } = await supabase.from("recetasxplatillo").delete().eq("platilloid", platilloId).eq("id", Id) // Usar el ID de la relacion de la receta con el platillo

    if (error) {
      console.error("Error al eliminar sub-receta de platillo:", error)
      throw error
    }
    console.log("no ocurrio un error para elminiar la receta de la receta para la receta")
    return { success: true }
  } catch (e: any) {
    console.error("Error en eliminarRecetaDePlatillo:", e)
    return { success: false, error: e.message }
  }
}
