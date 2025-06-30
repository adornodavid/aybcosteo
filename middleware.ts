import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// CONFIGURACIÓN: Cambiar a true para activar protección de rutas
const ENABLE_AUTH_PROTECTION = false

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Si la protección está desactivada, permitir acceso a todas las rutas
  if (!ENABLE_AUTH_PROTECTION) {
    return res
  }

  const supabase = createMiddlewareClient({ req, res })

  // Verificar sesión solo si la protección está activada
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login", "/login/test"]
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

  // Si no hay sesión y no es ruta pública, redirigir a login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Si hay sesión y está en login, redirigir al dashboard
  if (session && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
