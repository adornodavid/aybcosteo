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

// GET /api/v1/ingredientes/:id
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { data, error } = await supabase
      .from("ingredientes")
      .select(`
        *,
        categoriaingredientes (id, descripcion),
        tipounidadmedida (id, descripcion),
        hoteles (id, nombre, acronimo)
      `)
      .eq("id", parseInt(params.id))
      .single()

    if (error) return errorResponse("Ingrediente no encontrado", 404)

    return successResponse(data)
  } catch {
    return errorResponse("Error interno del servidor")
  }
}
