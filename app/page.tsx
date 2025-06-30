"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente al dashboard
    router.replace("/dashboard")
  }, [router])

  // Mostrar un loading mientras redirige
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Redirigiendo al Dashboard...</p>
      </div>
    </div>
  )
}
