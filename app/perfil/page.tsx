"use client"

/* ==================================================
  Imports
================================================== */
import { useEffect, useState, useMemo } from "react"
//import { useUserSession } from "@/hooks/use-user-session"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { obtenerUsuariosPorRol, obtenerUsuariosPorHotel } from "@/app/actions/perfil-actions"
import { supabase } from "@/lib/supabase"

interface Usuario {
  id: string
  nombrecompleto: string
  email: string
  rol: string
  hotel: string
  imgurl?: string
}

interface DropdownItem {
  id: number
  nombre: string
}

export default function PerfilPage() {
  const { profile, user, loading } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [hoteles, setHoteles] = useState<DropdownItem[]>([])
  const [filtroHotel, setFiltroHotel] = useState("-1")
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // Determinar si es admin basado en la cookie de sesión
  const esAdmin = useMemo(() => {
    if (!user) return false
    const rolId = user.RolId
    return rolId && [1, 2, 3, 4].includes(rolId)
  }, [user])

  // Cargar datos iniciales (hoteles)
  const cargarDatosIniciales = async () => {
    if (!user) {
      console.log("No hay usuario para cargar datos iniciales")
      return
    }

    console.log("Cargando datos iniciales. Usuario:", user.Email, "RolId:", user.RolId, "HotelId:", user.HotelId)

    try {
      // Cargar hoteles
      if (esAdmin) {
        console.log("Usuario es admin, cargando todos los hoteles")
        const { data: hotelesData, error: hotelesError } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .order("nombre")

        if (!hotelesError) {
          const hotelesConTodos = [
            { id: -1, nombre: "Todos" },
            ...(hotelesData || []).map((h: any) => ({ id: h.id, nombre: h.nombre })),
          ]
          console.log("Hoteles cargados:", hotelesConTodos.length)
          setHoteles(hotelesConTodos)
          setFiltroHotel("-1")
        } else {
          console.error("Error cargando hoteles:", hotelesError)
        }
      } else {
        console.log("Usuario NO es admin, cargando solo su hotel:", user.HotelId)
        const { data: hotelData, error: hotelError } = await supabase
          .from("hoteles")
          .select("id, nombre")
          .eq("id", user.HotelId)
          .order("nombre")

        if (!hotelError) {
          const hotelesData = (hotelData || []).map((h: any) => ({ id: h.id, nombre: h.nombre }))
          console.log("Hotel del usuario cargado:", hotelesData)
          setHoteles(hotelesData)
          if (hotelesData.length > 0) {
            setFiltroHotel(hotelesData[0].id.toString())
          }
        } else {
          console.error("Error cargando hotel del usuario:", hotelError)
        }
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error)
    }
  }

  // Cargar hoteles al montar el componente
  useEffect(() => {
    if (!loading && user) {
      console.log("useEffect: Inicializando carga de datos")
      const inicializar = async () => {
        setPageLoading(true)
        await cargarDatosIniciales()
        setPageLoading(false)
      }
      inicializar()
    }
  }, [loading, user, esAdmin])

  // Cargar usuarios iniciales
  useEffect(() => {
    async function cargarUsuariosIniciales() {
      console.log("Cargando usuarios iniciales...")
      setLoadingUsuarios(true)
      const usuariosData = await obtenerUsuariosPorRol()
      console.log("Usuarios cargados:", usuariosData.length)
      setUsuarios(usuariosData)
      setLoadingUsuarios(false)
    }
    if (user && !pageLoading) {
      console.log("useEffect: Condiciones cumplidas para cargar usuarios")
      cargarUsuariosIniciales()
    } else {
      console.log("useEffect: Esperando condiciones. user:", !!user, "pageLoading:", pageLoading)
    }
  }, [user, pageLoading])

  // Manejar cambio de hotel
  const handleHotelChange = async (value: string) => {
    console.log("Cambiando filtro de hotel a:", value)
    setFiltroHotel(value)
    setLoadingUsuarios(true)
    const usuariosData = await obtenerUsuariosPorHotel(value)
    console.log("Usuarios después de filtrar por hotel:", usuariosData.length)
    setUsuarios(usuariosData)
    setLoadingUsuarios(false)
  }

  if (loading || pageLoading) {
    return (
      <div className="container mx-auto p-6">
        <div>Cargando perfil...</div>
      </div>
    )
  }

  // Determinar si debe mostrar el selector de hotel
  const mostrarSelectorHotel = esAdmin

  console.log(
    "Renderizando página. Usuarios:",
    usuarios.length,
    "EsAdmin:",
    esAdmin,
    "MostrarSelector:",
    mostrarSelectorHotel,
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold">Administración de Usuarios</h1>
      </div>

      {/* Selector de Hotel */}
      {mostrarSelectorHotel && (
        <div className="w-full max-w-xs">
          <label className="text-sm font-medium mb-2 block">Hotel</label>
          <Select value={filtroHotel} onValueChange={handleHotelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un hotel" />
            </SelectTrigger>
            <SelectContent>
              {hoteles.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id.toString()}>
                  {hotel.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Listado de Usuarios en Tarjetas */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Usuarios</h2>
        {loadingUsuarios ? (
          <div className="text-center py-8">Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay usuarios para mostrar</p>
            <p className="text-xs mt-2">
              RolId: {user?.RolId} | HotelId: {user?.HotelId} | Email: {user?.Email}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {usuarios.map((usuario) => (
              <Card key={usuario.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={usuario.imgurl || "/placeholder.svg"} alt={usuario.nombrecompleto} />
                      <AvatarFallback className="text-2xl">
                        {usuario.nombrecompleto
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 w-full">
                      <h3 className="font-semibold text-lg">{usuario.nombrecompleto}</h3>
                      <p className="text-sm text-muted-foreground">{usuario.email}</p>
                      <div className="pt-2 space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-medium">Rol:</span>
                          <span className="text-xs text-muted-foreground">{usuario.rol}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-medium">Hotel:</span>
                          <span className="text-xs text-muted-foreground">{usuario.hotel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Información de la sesión (mantener la existente) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Valores de la Cookie de Sesión (Raw)</CardTitle>
            <CardDescription>Datos directamente de la sesión de autenticación (cookie)</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-60 bg-gray-50 p-2 rounded-md">
              {JSON.stringify(user, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
