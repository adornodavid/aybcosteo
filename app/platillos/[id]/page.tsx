import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"

interface Platillo {
  id: string
  nombre: string
  descripcion: string
  imagen_url: string
  precio: number
}

interface Ingrediente {
  id: string
  nombre: string
}

interface PlatilloIngrediente {
  ingrediente_id: string
  cantidad: string
}

async function getPlatillo(id: string): Promise<Platillo | null> {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase.from("platillos").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching platillo:", error)
    return null
  }

  return data as Platillo
}

async function getIngredientesDelPlatillo(platilloId: string): Promise<
  {
    ingrediente: Ingrediente
    cantidad: string
  }[]
> {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from("platillos_ingredientes")
    .select(
      `
      cantidad,
      ingrediente (
        id,
        nombre
      )
    `,
    )
    .eq("platillo_id", platilloId)

  if (error) {
    console.error("Error fetching ingredientes:", error)
    return []
  }

  return data.map((item: any) => ({
    ingrediente: item.ingrediente as Ingrediente,
    cantidad: item.cantidad as string,
  }))
}

export default async function PlatilloPage({
  params,
}: {
  params: { id: string }
}) {
  const platillo = await getPlatillo(params.id)
  const ingredientes = await getIngredientesDelPlatillo(params.id)

  if (!platillo) {
    return <div>Platillo no encontrado</div>
  }

  return (
    <div className="container mx-auto p-4">
      <Link href="/platillos" className="mb-4 inline-block">
        Volver a la lista de platillos
      </Link>
      <h1 className="text-2xl font-bold mb-2">{platillo.nombre}</h1>
      <div className="mb-4">
        <img src={platillo.imagen_url || "/placeholder.svg"} alt={platillo.nombre} className="w-64 h-auto" />
      </div>
      <p className="mb-2">{platillo.descripcion}</p>
      <p className="mb-2">Precio: ${platillo.precio}</p>

      <div>
        <h2 className="text-xl font-bold mb-2">Ingredientes:</h2>
        <ul>
          {ingredientes.map((item) => (
            <li key={item.ingrediente.id}>
              {item.ingrediente.nombre} - {item.cantidad}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
