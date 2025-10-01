"use server"

//mport { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

interface Usuario {
  id: string
  nombrecompleto: string
  email: string
  rol: string
  hotel: string
  imgurl?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

export async function obtenerUsuariosPorRol(): Promise<Usuario[]> {
  try {
    const supabase = createSupabaseServerClient()

    // Obtener RolId de las cookies
    const allCookies = cookies()
    const rolIdCookie = allCookies.get("RolId")
    const EmailCookie = allCookies.get("Email")

    console.log("rol",rolIdCookie)
    console.log("rol",EmailCookie)

      let EmailId = 0

  if (EmailCookie) {
    EmailId = EmailCookie.value
  }

  console.log("rol",EmailId)
  
    // Obtener el perfil del usuario con rol y hotel usando el email
    const { data: perfilData, error: perfilError } = await supabase
      .from("usuarios")
      .select("rolid, hotelid, id")
      .eq("email", EmailId)
      .maybeSingle()

    if (perfilError) {
      console.error("Error obteniendo perfil:", perfilError)
      return []
    }

    if (!perfilData) {
      console.error("No se encontró perfil para el usuario:", EmailId)
      return []
    }

    const { rolid, hotelid, id: usuarioId } = perfilData

    console.log("Perfil encontrado - RolId:", rolid, "HotelId:", hotelid, "UsuarioId:", usuarioId)

    let query = supabase.from("usuarios").select(
      `
        id,
        nombrecompleto,
        email,
        imgurl,
        roles!inner(nombre),
        hoteles!inner(nombre)
      `,
    )

    // Aplicar filtros según el rol
    if (rolid >= 6) {
      // RolId >= 6: Solo ver su propia información
      console.log("Filtrando por usuario ID:", usuarioId)
      query = query.eq("id", usuarioId)
    } else if (rolid === 5) {
      // RolId 5: Ver usuarios del mismo hotel
      console.log("Filtrando por hotel ID:", hotelid)
      query = query.eq("hotelid", hotelid)
    } else {
      // RolId 1, 2, 3, 4: Ver todos los usuarios
      console.log("Mostrando todos los usuarios (Admin)")
    }

    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo usuarios:", error)
      return []
    }

    console.log("Usuarios encontrados:", data?.length || 0)

    // Transformar los datos al formato esperado
    const usuarios: Usuario[] =
      data?.map((item: any) => ({
        id: item.id.toString(),
        nombrecompleto: item.nombrecompleto || "Sin nombre",
        email: item.email || "Sin email",
        rol: item.roles?.nombre || "Sin rol",
        hotel: item.hoteles?.nombre || "Sin hotel",
        imgurl: item.imgurl || "/placeholder-user.jpg",
      })) || []

    return usuarios
  } catch (error) {
    console.error("Error en obtenerUsuariosPorRol:", error)
    return []
  }
}

export async function obtenerUsuariosPorHotel(hotelId: string): Promise<Usuario[]> {
  try {
    
    const supabase = createSupabaseServerClient()

    

    // Obtener el perfil del usuario con rol usando el email
    const { data: perfilData, error: perfilError } = await supabase
      .from("usuarios")
      .select("rolid, hotelid, id")
      .eq("email", EmailId)
      .maybeSingle()

    if (perfilError) {
      console.error("Error obteniendo perfil:", perfilError)
      return []
    }

    if (!perfilData) {
      console.error("No se encontró perfil para el usuario:", EmailId)
      return []
    }

    const { rolid, hotelid: hotelUsuario, id: usuarioId } = perfilData

    console.log("Perfil encontrado - RolId:", rolid, "HotelId del usuario:", hotelUsuario)

    let query = supabase.from("usuarios").select(
      `
        id,
        nombrecompleto,
        email,
        imgurl,
        roles!inner(nombre),
        hoteles!inner(nombre)
      `,
    )

    // Aplicar filtros según el rol y el hotel seleccionado
    if (rolid >= 6) {
      // RolId >= 6: Solo ver su propia información
      console.log("Usuario con RolId >= 6, mostrando solo su información")
      query = query.eq("id", usuarioId)
    } else if (rolid === 5) {
      // RolId 5: Ver usuarios del mismo hotel
      console.log("Usuario con RolId 5, mostrando usuarios del hotel:", hotelUsuario)
      query = query.eq("hotelid", hotelUsuario)
    } else {
      // RolId 1, 2, 3, 4: Filtrar por hotel seleccionado
      const hotelIdNum = Number.parseInt(hotelId, 10)
      if (hotelIdNum !== -1) {
        console.log("Usuario admin, filtrando por hotel:", hotelIdNum)
        query = query.eq("hotelid", hotelIdNum)
      } else {
        console.log("Usuario admin, mostrando todos los usuarios")
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo usuarios por hotel:", error)
      return []
    }

    console.log("Usuarios encontrados:", data?.length || 0)

    // Transformar los datos al formato esperado
    const usuarios: Usuario[] =
      data?.map((item: any) => ({
        id: item.id.toString(),
        nombrecompleto: item.nombrecompleto || "Sin nombre",
        email: item.email || "Sin email",
        rol: item.roles?.nombre || "Sin rol",
        hotel: item.hoteles?.nombre || "Sin hotel",
        imgurl: item.imgurl || "/placeholder-user.jpg",
      })) || []

    return usuarios
  } catch (error) {
    console.error("Error en obtenerUsuariosPorHotel:", error)
    return []
  }
}
