"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { obtenerVariablesSesion } from "@/app/actions/session-actions-with-expiration"
import type { SessionData } from "@/app/actions/session-actions-with-expiration"

interface AuthContextType {
  user: SessionData | null
  isLoading: boolean
  selectedHotel: number | null
  setSelectedHotel: (hotelId: number | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = ["/login", "/logout"]

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionData = await obtenerVariablesSesion()

        if (sessionData && sessionData.SesionActiva) {
          setUser(sessionData)
          setSelectedHotel(sessionData.HotelId || null)
        } else if (!publicRoutes.includes(pathname)) {
          router.push("/login")
        }
      } catch (error) {
        console.error("[v0] Error obteniendo variables de sesión:", error)
        if (!publicRoutes.includes(pathname)) {
          router.push("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  const logout = () => {
    setUser(null)
    setSelectedHotel(null)
    router.push("/logout")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        selectedHotel,
        setSelectedHotel,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
