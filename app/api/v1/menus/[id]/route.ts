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

// GET /api/v1/menus/:id
// Retorna el menú completo con todos sus platillos y costos
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { data: menu, error } = await supabase
      .from("menus")
      .select(`
        *,
        restaurantes (
          id,
          nombre,
          direccion,
          imgurl,
          hotelid,
          hoteles (id, nombre, acronimo, direccion)
        )
      `)
      .eq("id", parseInt(params.id))
      .single()

    if (error) return errorResponse("Menú no encontrado", 404)

    // Obtener platillos del menú con precios
    const { data: platillos } = await supabase
      .from("platillosxmenu")
      .select(`
        id,
        precioventa,
        precioconiva,
        margenutilidad,
        activo,
        fechacreacion,
        platillos (
          id,
          nombre,
          descripcion,
          costototal,
          tipofamilia,
          imgurl
        )
      `)
      .eq("menuid", parseInt(params.id))
      .eq("activo", true)
      .order("id", { ascending: true })

    // Calcular resumen del menú
    const platillosActivos = platillos || []
    const resumen = {
      total_platillos: platillosActivos.length,
      costo_total_menu: platillosActivos.reduce((acc, p) => acc + ((p.platillos as { costototal?: number })?.costototal || 0), 0),
      precio_venta_total: platillosActivos.reduce((acc, p) => acc + (p.precioventa || 0), 0),
    }

    return successResponse({
      ...menu,
      platillos: platillosActivos,
      resumen,
    })
  } catch {
    return errorResponse("Error interno del servidor")
  }
}
