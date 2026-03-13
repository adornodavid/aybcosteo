import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateApiKey, successResponse, errorResponse, corsHeaders } from "../../_middleware/auth"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

// GET /api/v1/platillos/:id
// Retorna platillo con ingredientes y recetas incluidas
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { data: platillo, error } = await supabase
      .from("platillos")
      .select(`
        *,
        hoteles (id, nombre, acronimo)
      `)
      .eq("id", parseInt(params.id))
      .single()

    if (error) return errorResponse("Platillo no encontrado", 404)

    // Obtener ingredientes del platillo
    const { data: ingredientes } = await supabase
      .from("ingredientesxplatillo")
      .select(`
        id,
        cantidad,
        ingredientecostoparcial,
        activo,
        ingredientes (id, nombre, codigo, costo, tipounidadmedida(descripcion))
      `)
      .eq("platilloid", parseInt(params.id))
      .eq("activo", true)

    // Obtener recetas del platillo
    const { data: recetas } = await supabase
      .from("recetasxplatillo")
      .select(`
        id,
        cantidad,
        recetacostoparcial,
        activo,
        recetas (id, nombre, costo)
      `)
      .eq("platilloid", parseInt(params.id))
      .eq("activo", true)

    return successResponse({
      ...platillo,
      ingredientes: ingredientes || [],
      recetas: recetas || [],
    })
  } catch {
    return errorResponse("Error interno del servidor")
  }
}
