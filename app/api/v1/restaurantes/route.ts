import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateApiKey, successResponse, errorResponse, corsHeaders } from "../_middleware/auth"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

// GET /api/v1/restaurantes
// Query params: hotelid, activo, search, limit, offset
export async function GET(request: NextRequest) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const hotelid = searchParams.get("hotelid")
    const activo = searchParams.get("activo")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("restaurantes")
      .select(`
        id,
        nombre,
        direccion,
        imgurl,
        activo,
        hotelid,
        fechacreacion,
        hoteles (id, nombre, acronimo)
      `)
      .range(offset, offset + limit - 1)
      .order("nombre", { ascending: true })

    if (hotelid) query = query.eq("hotelid", parseInt(hotelid))
    if (activo !== null && activo !== undefined) query = query.eq("activo", activo === "true")
    if (search) query = query.ilike("nombre", `%${search}%`)

    const { data, error } = await query

    if (error) return errorResponse(error.message)

    return successResponse(data, { limit, offset })
  } catch {
    return errorResponse("Error interno del servidor")
  }
}
