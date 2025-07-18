import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables must be set.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verificarBucketImagenes() {
  try {
    console.log("Listando buckets de Supabase...")
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error("Error al listar buckets:", error)
      return
    }

    if (!data || data.length === 0) {
      console.log("No se encontraron buckets en tu proyecto de Supabase.")
      return
    }

    console.log("Buckets encontrados:")
    let found = false
    for (const bucket of data) {
      console.log(`- ID: ${bucket.id}, Nombre: ${bucket.name}, Público: ${bucket.public}`)
      if (bucket.name === "imagenes") {
        // Usar el nombre correcto del bucket
        found = true
      }
    }

    if (found) {
      console.log('\n¡El bucket "imagenes" fue encontrado exitosamente!')
    } else {
      console.log(
        '\nEl bucket "imagenes" NO fue encontrado. Por favor, asegúrate de crearlo en tu panel de Supabase Storage.',
      )
    }
  } catch (error) {
    console.error("Error inesperado:", error)
  }
}

verificarBucketImagenes()
