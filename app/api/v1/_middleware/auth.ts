import { NextRequest, NextResponse } from "next/server"

const API_KEY = process.env.API_SECRET_KEY || "ayb-costeo-api-key-2024"

export function validateApiKey(request: NextRequest): NextResponse | null {
  const apiKey =
    request.headers.get("x-api-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "")

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "No autorizado",
        message: "Se requiere una API Key. Envíala en el header 'x-api-key' o como 'Authorization: Bearer <key>'",
      },
      { status: 401 }
    )
  }

  if (apiKey !== API_KEY) {
    return NextResponse.json(
      {
        error: "API Key inválida",
        message: "La API Key proporcionada no es válida.",
      },
      { status: 403 }
    )
  }

  return null // null = autenticación exitosa
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
  }
}

export function successResponse(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { headers: corsHeaders() }
  )
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status, headers: corsHeaders() }
  )
}
