"use server"

import { createClient } from "@/lib/supabase"

interface UnidadMedida {
  id: number
  descripcion: string
  calculoconversion: number | null
}

export async function getUnidadMedidaForRecetaIngrediente(ingredienteId: number): Promise<UnidadMedida[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .select(`
        id,
        unidadmedidaid,
        tipounidadmedida (
          id,
          descripcion,
          calculoconversion
        )
      `)
      .eq("id", ingredienteId)
      .single()

    if (error) {
      console.error("Error al obtener unidad de medida del ingrediente:", error.message)
      return []
    }

    if (data && data.tipounidadmedida) {
      return [
        {
          id: data.tipounidadmedida.id,
          descripcion: data.tipounidadmedida.descripcion,
          calculoconversion: data.tipounidadmedida.calculoconversion,
        },
      ]
    }

    return []
  } catch (error) {
    console.error("Error inesperado al obtener unidad de medida del ingrediente:", error)
    return []
  }
}
