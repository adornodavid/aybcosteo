import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

interface Restaurant {
  id: string
  created_at: string
  nombre: string
  direccion: string
  telefono: string
  descripcion: string
  imagen_url: string
}

interface Menu {
  id: string
  created_at: string
  nombre: string
  descripcion: string
  precio: number
  imagen_url: string
  restaurante_id: string
}

async function getRestaurant(id: string): Promise<Restaurant | null> {
  // Verificar si el ID es "nuevo" o no es un UUID válido
  if (id === "nuevo" || !isValidUUID(id)) {
    return null
  }

  const supabase = createServerComponentClient({ cookies })

  const { data: restaurant, error } = await supabase.from("restaurantes").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching restaurant:", error)
    return null
  }

  return restaurant
}

// Función helper para validar UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

async function getMenus(restaurantId: string): Promise<any[]> {
  const supabase = createServerComponentClient({ cookies })

  const { data: menusData, error: menusError } = await supabase
    .from("restaurante_menus")
    .select(`
    *,
    menus (
      id,
      nombre,
      descripcion,
      imagen_url
    )
  `)
    .eq("restaurante_id", restaurantId)
    .eq("activo", true)

  if (menusError) {
    console.error("Error fetching menus:", menusError)
    return []
  }

  return menusData || []
}

export default async function RestaurantPage({
  params,
}: {
  params: { id: string }
}) {
  const restaurantId = params.id

  // Si es "nuevo" o "crear", redirigir a la página de creación
  if (restaurantId === "nuevo" || restaurantId === "crear") {
    redirect("/restaurantes/crear")
  }

  const restaurant = await getRestaurant(restaurantId)

  // Solo obtener menús si el restaurante existe y el ID es válido
  const menusData = restaurant ? await getMenus(restaurantId) : []

  if (!restaurant) {
    return <div>Restaurant not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <Link href="/restaurantes" className="mb-4 inline-block">
        &larr; Back to Restaurants
      </Link>
      <h1 className="text-2xl font-bold mb-2">{restaurant.nombre}</h1>
      <p className="text-gray-700 mb-2">{restaurant.descripcion}</p>
      <p className="text-gray-700 mb-2">Address: {restaurant.direccion}</p>
      <p className="text-gray-700 mb-2">Phone: {restaurant.telefono}</p>
      <img
        src={restaurant.imagen_url || "/placeholder.svg"}
        alt={restaurant.nombre}
        className="mb-4 rounded-md"
        style={{ maxWidth: "400px" }}
      />

      <h2 className="text-xl font-bold mb-2">Menus</h2>
      {menusData && menusData.length > 0 ? (
        <ul className="list-disc list-inside">
          {menusData.map((restauranteMenu) => (
            <li key={restauranteMenu.id} className="mb-2">
              <Link href={`/menus/${restauranteMenu.menus?.id}`} className="hover:underline">
                <h3 className="font-semibold">{restauranteMenu.menus?.nombre}</h3>
              </Link>
              <p className="text-gray-700">{restauranteMenu.menus?.descripcion}</p>
              {restauranteMenu.menus?.imagen_url && (
                <img
                  src={restauranteMenu.menus.imagen_url || "/placeholder.svg"}
                  alt={restauranteMenu.menus.nombre}
                  className="mt-2 rounded-md"
                  style={{ maxWidth: "200px" }}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay menús asignados a este restaurante.</p>
      )}
    </div>
  )
}
