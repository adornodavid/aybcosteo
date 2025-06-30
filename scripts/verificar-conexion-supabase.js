// Script para verificar la conexión a Supabase
const { createClient } = require("@supabase/supabase-js")

async function verificarConexion() {
  try {
    console.log("🔍 Verificando conexión a Supabase...")

    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("📋 Variables de entorno:")
    console.log("SUPABASE_URL:", supabaseUrl ? "✅ Configurada" : "❌ Faltante")
    console.log("SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Configurada" : "❌ Faltante")

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Variables de entorno faltantes")
      return
    }

    // Crear cliente
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Probar conexión con una consulta simple
    console.log("🔗 Probando conexión...")
    const { data, error } = await supabase.from("hoteles").select("count(*)").limit(1)

    if (error) {
      console.error("❌ Error de conexión:", error.message)
      return
    }

    console.log("✅ Conexión exitosa a Supabase")
    console.log("📊 Datos de prueba:", data)

    // Verificar tablas principales
    const tablas = ["hoteles", "ingredientes", "categoriaingredientes", "tipounidadmedida"]

    for (const tabla of tablas) {
      try {
        const { data, error } = await supabase.from(tabla).select("count(*)").limit(1)

        if (error) {
          console.log(`❌ Tabla ${tabla}: ${error.message}`)
        } else {
          console.log(`✅ Tabla ${tabla}: Accesible`)
        }
      } catch (err) {
        console.log(`❌ Tabla ${tabla}: Error de acceso`)
      }
    }
  } catch (error) {
    console.error("❌ Error general:", error.message)
  }
}

verificarConexion()
