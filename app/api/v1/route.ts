import { NextRequest, NextResponse } from "next/server"
import { corsHeaders } from "./_middleware/auth"

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin

  return NextResponse.json(
    {
      name: "AyB Costeo API",
      version: "1.0.0",
      description: "API REST para el sistema de gestión de costeo de alimentos y bebidas",
      autenticacion: {
        tipo: "API Key",
        instrucciones: "Incluye tu API Key en el header 'x-api-key' o como 'Authorization: Bearer <key>'",
      },
      endpoints: [
        {
          recurso: "Hoteles",
          metodos: ["GET"],
          rutas: [
            { metodo: "GET", ruta: `${baseUrl}/api/v1/hoteles`, descripcion: "Listar hoteles", params: ["activo", "search", "limit", "offset"] },
          ],
        },
        {
          recurso: "Restaurantes",
          metodos: ["GET"],
          rutas: [
            { metodo: "GET", ruta: `${baseUrl}/api/v1/restaurantes`, descripcion: "Listar restaurantes", params: ["hotelid", "activo", "search", "limit", "offset"] },
          ],
        },
        {
          recurso: "Ingredientes",
          metodos: ["GET"],
          rutas: [
            { metodo: "GET", ruta: `${baseUrl}/api/v1/ingredientes`, descripcion: "Listar ingredientes", params: ["hotelid", "categoriaid", "activo", "search", "limit", "offset"] },
            { metodo: "GET", ruta: `${baseUrl}/api/v1/ingredientes/:id`, descripcion: "Obtener ingrediente por ID" },
          ],
        },
        {
          recurso: "Platillos",
          metodos: ["GET"],
          rutas: [
            { metodo: "GET", ruta: `${baseUrl}/api/v1/platillos`, descripcion: "Listar platillos con costos", params: ["hotelid", "activo", "search", "limit", "offset"] },
            { metodo: "GET", ruta: `${baseUrl}/api/v1/platillos/:id`, descripcion: "Obtener platillo con ingredientes y recetas" },
          ],
        },
        {
          recurso: "Recetas",
          metodos: ["GET"],
          rutas: [
            { metodo: "GET", ruta: `${baseUrl}/api/v1/recetas`, descripcion: "Listar recetas", params: ["hotelid", "activo", "search", "limit", "offset"] },
          ],
        },
        {
          recurso: "Menus",
          metodos: ["GET"],
          rutas: [
            { metodo: "GET", ruta: `${baseUrl}/api/v1/menus`, descripcion: "Listar menus", params: ["restauranteid", "activo", "search", "limit", "offset"] },
            { metodo: "GET", ruta: `${baseUrl}/api/v1/menus/:id`, descripcion: "Obtener menú completo con platillos y precios" },
          ],
        },
      ],
    },
    { headers: corsHeaders() }
  )
}
