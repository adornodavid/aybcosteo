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

// GET /api/v1/ingredientes
// Query params: hotelid, categoriaid, activo, search, limit, offset
export async function GET(request: NextRequest) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const hotelid = searchParams.get("hotelid")
    const categoriaid = searchParams.get("categoriaid")
    const activo = searchParams.get("activo")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("ingredientes")
      .select(`
        id,
        nombre,
        codigo,
        codigorapsodia,
        costo,
        conversion,
        porcentajemerma,
        activo,
        fechacreacion,
        fechamodificacion,
        hotelid,
        categoriaid,
        unidadmedidaid,
        categoriaingredientes (id, descripcion),
        tipounidadmedida (id, descripcion)
      `)
      .range(offset, offset + limit - 1)
      .order("nombre", { ascending: true })

    if (hotelid) query = query.eq("hotelid", parseInt(hotelid))
    if (categoriaid) query = query.eq("categoriaid", parseInt(categoriaid))
    if (activo !== null && activo !== undefined) query = query.eq("activo", activo === "true")
    if (search) query = query.ilike("nombre", `%${search}%`)

    const { data, error, count } = await query

    if (error) return errorResponse(error.message)

    return successResponse(data, { total: count, limit, offset })
  } catch {
    return errorResponse("Error interno del servidor")
  }
}
