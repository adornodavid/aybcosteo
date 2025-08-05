"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function getUnidadMedidaForRecetaIngrediente(ingredienteId: number) {
  const { data, error } = await supabase
    .from("ingredientes")
    .select(
      `
      id,
      tipounidadmedida (
        id,
        descripcion,
        calculoconversion
      )
    `,
    )
    .eq("id", ingredienteId)
    .single()

  if (error) {
    console.error("Error fetching unidad de medida for ingrediente:", error)
    return []
  }

  if (data && data.tipounidadmedida) {
    return [data.tipounidadmedida]
  }
  return []
}

export async function registrarRecetaConImagen(formData: FormData) {
  const nombre = formData.get("nombre") as string
  const notaspreparacion = formData.get("notaspreparacion") as string
  const hotelId = formData.get("hotelId") as string
  const cantidad = formData.get("cantidad") as string
  const unidadBaseId = formData.get("unidadBaseId") as string
  const imagenFile = formData.get("imagen") as File | null

  if (!nombre || !notaspreparacion || !hotelId) {
    return { success: false, error: "Faltan campos obligatorios." }
  }

  let imgUrl: string | null = null

  if (imagenFile && imagenFile.size > 0) {
    const bucketName = "imagenes"
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = imagenFile.name.split(".").pop()
    const filePath = `Recetas/receta_${timestamp}_${randomString}.${fileExtension}`

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, imagenFile, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error al subir imagen:", uploadError)
      return { success: false, error: `Error al subir imagen: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(uploadData.path)
    imgUrl = publicUrlData.publicUrl
  }

  try {
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("recetas")
      .insert({
        nombre: nombre,
        notaspreparacion: notaspreparacion,
        //hotelid: Number(hotelId),
        costo: null, // Se calculará después
        activo: true,
        fechacreacion: new Date().toISOString(),
        imgurl: imgUrl,
        cantidad: Number(cantidad) || null,
        unidadbaseid: Number(unidadBaseId) || null,
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Error al registrar receta en DB:", insertError)
      return { success: false, error: `Error al registrar receta: ${insertError.message}` }
    }

    revalidatePath("/recetas/nuevo")
    return { success: true, recetaId: insertData.id, imgUrl: imgUrl }
  } catch (error: any) {
    console.error("Error inesperado al registrar receta:", error)
    return { success: false, error: `Error inesperado: ${error.message}` }
  }
}
