"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, CheckCircle } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Función para limpiar todas las cookies de sesión
    const clearSessionCookies = () => {
      const cookiesToClear = [
        "UsuarioId",
        "Email",
        "NombreCompleto",
        "HotelId",
        "RolId",
        "Permisos",
        "SesionActiva",
        "ExpiresAt",
      ]

      // Establecer fecha pasada para expirar las cookies
      const pastDate = new Date(0).toUTCString()

      cookiesToClear.forEach((cookieName) => {
        document.cookie = `${cookieName}=; expires=${pastDate}; path=/; SameSite=Strict`
      })

      console.log("Variables de sesión eliminadas correctamente")
    }

    // Limpiar cookies inmediatamente
    clearSessionCookies()

    // Redirigir al login después de un breve delay
    const timer = setTimeout(() => {
      router.push("/login")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="text-center space-y-6 p-8 bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-center">
          <div className="relative">
            <LogOut className="h-16 w-16 text-red-500 animate-pulse" />
            <CheckCircle className="h-6 w-6 text-green-500 absolute -top-1 -right-1 animate-bounce" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Cerrando Sesión</h1>
          <p className="text-gray-600">Limpiando variables de sesión...</p>
        </div>

        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>

        <p className="text-sm text-gray-500">Redirigiendo al login en unos segundos...</p>
      </div>
    </div>
  )
}
