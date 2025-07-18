//import { createServerSupabaseClientWrapper } from "@/lib/supabase"
import { getSession } from "@/app/actions/session-actions" // Importación correcta de la función getSession
import {
  obtenerRestaurantesFiltrados,
  obtenerHotelesParaFiltroPorRol,
  obtenerRestaurantesParaFiltroPorRol,
} from "@/app/actions/restaurantes-actions"
import RestaurantesClientPage from "@/components/restaurantes/restaurantes-client-page" // Importación por defecto
import Image from "next/image" // Importar Image de next/image


export const dynamic = "force-dynamic"

export default async function RestaurantesPage() {
  //const supabase = createServerSupabaseClientWrapper() // Se mantiene por si se usa en otras partes, aunque no directamente para la sesión aquí.

  // Obtener la sesión directamente, ya que getSession devuelve SessionData | null
  const sessionData = await getSession()

  // Verificar si la sesión no existe o no está activa
  if (!sessionData || !sessionData.SesionActiva) {
    console.error("No session found or error getting session: Session data is null or inactive.")
    // Puedes redirigir o mostrar un mensaje de error
    return <div>Error: No se pudo cargar la sesión del usuario o la sesión no está activa.</div>
  }

  // Acceder a rolId y sessionHotelId directamente desde sessionData
  const rolId = sessionData.RolId || 0
  const sessionHotelId = sessionData.HotelId || null

  // Lógica para auxHotelid en el servidor para la carga inicial
  let auxHotelidInitial: number | null = null
  if (![1, 2, 3, 4].includes(rolId)) {
    auxHotelidInitial = sessionHotelId
  }

  const defaultPageSize = 10



  // Obtener datos iniciales para la tabla
  const { data: initialRestaurantes, count: initialTotalCount } = await obtenerRestaurantesFiltrados(
    "", // searchTerm inicial vacío
    auxHotelidInitial, // hotelId inicial basado en auxHotelid
    null, // restauranteId inicial vacío
    1, // página inicial
    defaultPageSize,
    rolId,
    sessionHotelId,
  )

  // Obtener opciones para los filtros de hoteles y restaurantes
  const { data: initialHotelOptions } = await obtenerHotelesParaFiltroPorRol(rolId, sessionHotelId)
  const { data: initialRestauranteOptions } = await obtenerRestaurantesParaFiltroPorRol(rolId, sessionHotelId)

  return (
    <RestaurantesClientPage
      initialRestaurantes={initialRestaurantes || []}
      initialTotalCount={initialTotalCount || 0}
      initialHotelOptions={initialHotelOptions || []}
      initialRestauranteOptions={initialRestauranteOptions || []}
      userSession={{
        id: sessionData.UsuarioId.toString(), // Convertir a string si es necesario para el componente cliente
        email: sessionData.Email,
        rol_id: sessionData.RolId,
        hotel_id: sessionData.HotelId,
        nombre: sessionData.NombreCompleto || null,
      }}
    />
  )
}
