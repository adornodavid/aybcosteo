import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase (usa las variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables de entorno de Supabase no configuradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarBuckets() {
  console.log("🔍 Verificando configuración de buckets en Supabase...\n")

  try {
    // 1. Listar todos los buckets
    console.log("📁 Buckets disponibles:")
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("❌ Error al listar buckets:", bucketsError.message)
      return
    }

    buckets.forEach((bucket) => {
      console.log(`  - ${bucket.name} (público: ${bucket.public ? "Sí" : "No"})`)
    })

    // 2. Verificar bucket específico "imagenes"
    const bucketImagenes = buckets.find((b) => b.name === "imagenes")

    if (!bucketImagenes) {
      console.log('\n❌ Bucket "imagenes" no encontrado')
      console.log('💡 Crea el bucket "imagenes" en tu panel de Supabase Storage')
      return
    }

    console.log('\n✅ Bucket "imagenes" encontrado')
    console.log(`   - Público: ${bucketImagenes.public ? "Sí" : "No"}`)
    console.log(`   - Creado: ${bucketImagenes.created_at}`)

    // 3. Probar subida de archivo de prueba
    console.log("\n🧪 Probando subida de archivo...")

    const testFile = new Blob(["Test content"], { type: "text/plain" })
    const testFileName = `test-${Date.now()}.txt`

    const { error: uploadError } = await supabase.storage.from("imagenes").upload(`test/${testFileName}`, testFile)

    if (uploadError) {
      console.error("❌ Error en subida de prueba:", uploadError.message)

      if (uploadError.message.includes("policy")) {
        console.log("💡 Problema de políticas RLS. Ejecuta el script SQL para configurarlas.")
      }
    } else {
      console.log("✅ Subida de prueba exitosa")

      // Limpiar archivo de prueba
      await supabase.storage.from("imagenes").remove([`test/${testFileName}`])
      console.log("🧹 Archivo de prueba eliminado")
    }

    // 4. Verificar políticas
    console.log("\n🔐 Verificando políticas RLS...")

    // Esta consulta requiere permisos de administrador, puede fallar en algunos casos
    const { data: policies, error: policiesError } = await supabase
      .from("storage.policies")
      .select("*")
      .eq("bucket_id", "imagenes")

    if (policiesError) {
      console.log("⚠️  No se pudieron verificar las políticas (normal si no eres admin)")
    } else {
      console.log(`📋 Políticas configuradas: ${policies.length}`)
      policies.forEach((policy) => {
        console.log(`   - ${policy.name} (${policy.command})`)
      })
    }
  } catch (error) {
    console.error("❌ Error general:", error.message)
  }
}

// Ejecutar verificación
verificarBuckets()
