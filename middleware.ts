import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login", "/logout", "/debug-session"]

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verificar si hay sesión activa
  const sesionActiva = request.cookies.get("SesionActiva")?.value
  const rolId = request.cookies.get("RolId")?.value

  // Si no hay sesión activa o RolId no es válido, redirigir al login
  if (sesionActiva !== "true" || !rolId || Number.parseInt(rolId) === 0) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si hay sesión activa y RolId es válido, permitir acceso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
