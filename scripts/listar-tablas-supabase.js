import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables de entorno de Supabase no configuradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listarTablas() {
  console.log("🔍 Conectando a Supabase...")

  try {
    // Obtener listado de tablas
    const { data: tablas, error: errorTablas } = await supabase.rpc("exec_sql", {
      query: `
          SELECT 
            table_name,
            table_type
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `,
    })

    if (errorTablas) {
      console.error("❌ Error obteniendo tablas:", errorTablas)

      // Método alternativo usando pg_tables
      const { data: tablasAlt, error: errorAlt } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_type", "BASE TABLE")
        .order("table_name")

      if (errorAlt) {
        console.error("❌ Error con método alternativo:", errorAlt)
        return
      }

      console.log("✅ Tablas encontradas (método alternativo):")
      tablasAlt?.forEach((tabla, index) => {
        console.log(`${index + 1}. ${tabla.table_name}`)
      })
      return
    }

    console.log("✅ Tablas encontradas en la base de datos:")
    console.log("=".repeat(50))

    if (tablas && tablas.length > 0) {
      tablas.forEach((tabla, index) => {
        console.log(`${index + 1}. ${tabla.table_name} (${tabla.table_type})`)
      })
      console.log(`\n📊 Total de tablas: ${tablas.length}`)
    } else {
      console.log("No se encontraron tablas")
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message)
  }
}

// Función alternativa usando consulta directa
async function listarTablasDirecto() {
  console.log("\n🔄 Intentando método directo...")

  try {
    // Lista de tablas que sabemos que existen según el código
    const tablasConocidas = [
      "categoriaingrediente",
      "hotel",
      "tipounidadmedida",
      "ingrediente",
      "restaurante",
      "platillo",
      "platilloingrediente",
      "menu",
      "menuplatillo",
      "restaurantemenu",
      "preciounitario",
      "usuario",
      "rol",
      "permiso",
      "usuariorol",
      "rolpermiso",
      "auditoria",
    ]

    console.log("📋 Tablas identificadas en el código:")
    console.log("=".repeat(50))

    tablasConocidas.forEach((tabla, index) => {
      console.log(`${index + 1}. ${tabla}`)
    })

    console.log(`\n📊 Total de tablas identificadas: ${tablasConocidas.length}`)

    // Verificar cuáles existen realmente
    console.log("\n🔍 Verificando existencia de tablas...")

    for (const tabla of tablasConocidas) {
      try {
        const { data, error } = await supabase.from(tabla).select("*").limit(1)

        if (error) {
          console.log(`❌ ${tabla} - No existe o sin acceso`)
        } else {
          console.log(`✅ ${tabla} - Existe y accesible`)
        }
      } catch (err) {
        console.log(`❌ ${tabla} - Error: ${err.message}`)
      }
    }
  } catch (error) {
    console.error("❌ Error en verificación:", error.message)
  }
}

// Ejecutar ambos métodos
listarTablas().then(() => {
  listarTablasDirecto()
})
