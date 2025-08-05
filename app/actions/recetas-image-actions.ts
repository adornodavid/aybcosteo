"use server"

import { createClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"

const getSupabaseClient = () => {
  return createClient(cookies())
}

export async function uploadImage(file: File) {
  const supabase = getSupabaseClient()
  try {
    const fileExtension = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = `${fileName}`

    const { data, error } = await supabase.storage.from("imagenes").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading image:", error)
      return { data: null, error: { message: `Error al subir imagen: ${error.message}` } }
    }

    const { data: publicUrlData } = supabase.storage.from("imagenes").getPublicUrl(filePath)

    return { data: { publicUrl: publicUrlData.publicUrl }, error: null }
  } catch (e: any) {
    console.error("Exception in uploadImage:", e)
    return { data: null, error: { message: e.message || "Error desconocido al subir imagen." } }
  }
}

export async function deleteImage(imageUrl: string) {
  const supabase = getSupabaseClient()
  try {
    const urlParts = imageUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]

    const { data, error } = await supabase.storage.from("imagenes").remove([fileName])

    if (error) {
      console.error("Error deleting image:", error)
      return { success: false, error: { message: `Error al eliminar imagen: ${error.message}` } }
    }

    return { success: true, error: null }
  } catch (e: any) {
    console.error("Exception in deleteImage:", e)
    return { success: false, error: { message: e.message || "Error desconocido al eliminar imagen." } }
  }
}
