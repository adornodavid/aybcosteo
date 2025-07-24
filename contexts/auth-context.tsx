"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getSession } from "@/app/actions/session-actions"
import type { DatosSesion } from "@/lib/types-sistema-costeo"

interface AuthContextType {
  user: DatosSesion | null
  isLoading: boolean
  selectedHotel: number | null
  setSelectedHotel: (hotelId: number | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("AuthProvider (CLIENT): Componente montado.")
  const [user, setUser] = useState<DatosSesion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = ["/login", "/logout"]

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession()

        if (session) {
          setUser(session)
          setSelectedHotel(session.HotelId || null)
        } else if (!publicRoutes.includes(pathname)) {
          router.push("/login")
        }
      } catch (error) {
        console.error("Error checking auth:", error)
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
