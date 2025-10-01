"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface UserProfile {
  id: string
  email: string
  nombre?: string
  rol?: string
  hotel_id?: number
  hotel_nombre?: string
  permisos?: string[]
}

export function useUserSession() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user])

  const fetchUserProfile = async () => {
    if (!user) return

    try {
      // Buscar usuario en la tabla usuarios usando el email del usuario autenticado
      const userEmail = user.email
      console.log("emial",user.email)
      if (!user.email) {
        console.error("No hay email en el usuario autenticado")
        setProfile({
          id: user.id,
          email: "Sin email",
          nombre: "Usuario",
        })
        setLoading(false)
        return
      }

      const { data: userData, error } = await supabase
        .from("usuarios")
        .select(
          `
          id,
          nombrecompleto,
          email,
          rolid,
          hotelid,
          roles:rolid (
            nombre,
            descripcion
          ),
          hoteles:hotelid (
            nombre
          )
        `,
        )
        .eq("email", user.email)
        .maybeSingle()

      if (error) {
        console.error("Error fetching user profile:", error)
        // Si no existe en usuarios, crear perfil básico
        setProfile({
          id: user.id,
          email: user.email,
          nombre: user.email.split("@")[0] || "Usuario",
        })
      } else if (!userData) {
        // No se encontró el usuario en la base de datos
        console.warn("Usuario no encontrado en la tabla usuarios")
        setProfile({
          id: user.id,
          email: user.email,
          nombre: user.email.split("@")[0] || "Usuario",
        })
      } else {
        setProfile({
          id: userData.id.toString(),
          email: userData.email || user.email,
          nombre: userData.nombrecompleto || user.email.split("@")[0] || "Usuario",
          rol: userData.roles?.nombre || "Usuario",
          hotel_id: userData.hotelid,
          hotel_nombre: userData.hoteles?.nombre,
        })
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      setProfile({
        id: user.id,
        email: user.email || "",
        nombre: user.email?.split("@")[0] || "Usuario",
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    profile,
    loading: authLoading || loading,
    isAuthenticated: !!user,
    refreshProfile: fetchUserProfile,
  }
}
