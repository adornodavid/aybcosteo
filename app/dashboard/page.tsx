"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Hotel, Building, Menu, Utensils, Package, TrendingUp, Activity } from "lucide-react"
import { obtenerResumenesDashboard } from "@/app/actions/dashboard-actions"
import Link from "next/link"
import Image from "next/image" // Importar Image de next/image

interface ResumenesDashboard {
  hoteles: number
  restaurantes: number
  menus: number
  platillos: number
  ingredientes: number
}

interface DatosSesion {
  UsuarioId: number
  Email: string
  NombreCompleto: string
  HotelId: number
  RolId: number
  Permisos: string
  SesionActiva: boolean
}

export default function DashboardPage() {
  const [resumenes, setResumenes] = useState<ResumenesDashboard | null>(null)
  const [sesion, setSesion] = useState<DatosSesion | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const validarSeguridadYCargarDatos = async () => {
      try {
        // Validar cookies de sesión del lado del cliente
        const sesionActiva = document.cookie
          .split("; ")
          .find((row) => row.startsWith("SesionActiva="))
          ?.split("=")[1]

        const rolId = document.cookie
          .split("; ")
          .find((row) => row.startsWith("RolId="))
          ?.split("=")[1]

        // Validaciones de seguridad como especificas
        if (sesionActiva !== "true") {
          router.push("/login")
          return
        }

        if (!rolId || rolId === "0" || rolId === "") {
          router.push("/login")
          return
        }

        // Obtener datos de sesión
        const nombreCompleto = document.cookie
          .split("; ")
          .find((row) => row.startsWith("NombreCompleto="))
          ?.split("=")[1]

        const usuarioId = document.cookie
          .split("; ")
          .find((row) => row.startsWith("UsuarioId="))
          ?.split("=")[1]

        const email = document.cookie
          .split("; ")
          .find((row) => row.startsWith("Email="))
          ?.split("=")[1]

        const hotelId = document.cookie
          .split("; ")
          .find((row) => row.startsWith("HotelId="))
          ?.split("=")[1]

        const permisos = document.cookie
          .split("; ")
          .find((row) => row.startsWith("Permisos="))
          ?.split("=")[1]

        setSesion({
          UsuarioId: Number.parseInt(usuarioId || "0"),
          Email: decodeURIComponent(email || ""),
          NombreCompleto: decodeURIComponent(nombreCompleto || ""),
          HotelId: Number.parseInt(hotelId || "0"),
          RolId: Number.parseInt(rolId || "0"),
          Permisos: decodeURIComponent(permisos || ""),
          SesionActiva: true,
        })

        // Cargar resúmenes del dashboard
        const data = await obtenerResumenesDashboard()
        if (data.success) {
          setResumenes(data.data)
        }
      } catch (error) {
        console.error("Error validando seguridad:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    validarSeguridadYCargarDatos()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center justify-center p-8">
            <div className="relative w-24 h-24 mb-4">
            <Image
              src="https://nxtrsibnomdqmzcrwedc.supabase.co/storage/v1/object/public/imagenes/AnimationGif/CargarPage.gif"
              alt="Procesando..."
              width={300} // Ajusta el tamaño según sea necesario
              height={300} // Ajusta el tamaño según sea necesario
              unoptimized // Importante para GIFs externos
              className="absolute inset-0 animate-bounce-slow"
            />
            </div>
            <p className="text-lg font-semibold text-gray-800">Cargando Pagina...</p>
           
        </div>
      </div>
    )
  }

  if (!sesion) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Sección Título de la página */}
      <div className="w-full text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Sistema de costeo</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Dashboard</h2>
      </div>

      {/* Sección de bienvenida */}
      <div className="w-full">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <p className="text-lg text-gray-800">
              Hola <span className="font-semibold text-blue-700">{sesion.NombreCompleto}</span>, bienvenido a la
              aplicación.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sección resúmenes visuales */}
      <div className="w-full">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Resúmenes del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoteles</CardTitle>
              <Hotel className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{resumenes?.hoteles || 0}</div>
              <p className="text-xs text-muted-foreground">Hoteles activos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restaurantes</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resumenes?.restaurantes || 0}</div>
              <p className="text-xs text-muted-foreground">Restaurantes activos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menús</CardTitle>
              <Menu className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{resumenes?.menus || 0}</div>
              <p className="text-xs text-muted-foreground">Menús activos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platillos</CardTitle>
              <Utensils className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{resumenes?.platillos || 0}</div>
              <p className="text-xs text-muted-foreground">Platillos activos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingredientes</CardTitle>
              <Package className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{resumenes?.ingredientes || 0}</div>
              <p className="text-xs text-muted-foreground">Ingredientes activos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resumen del sistema */}
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumen del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {(resumenes?.hoteles || 0) + (resumenes?.restaurantes || 0)}
                </div>
                <p className="text-sm text-gray-600">Total Establecimientos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {(resumenes?.platillos || 0) + (resumenes?.menus || 0)}
                </div>
                <p className="text-sm text-gray-600">Total Productos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{resumenes?.ingredientes || 0}</div>
                <p className="text-sm text-gray-600">Total Ingredientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="w-full">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/hoteles">
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
            >
              <Hotel className="h-6 w-6" />
              <span>Hoteles</span>
            </Button>
          </Link>

          <Link href="/platillos">
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
            >
              <Utensils className="h-6 w-6" />
              <span>Platillos</span>
            </Button>
          </Link>

          <Link href="/menus">
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
            >
              <Menu className="h-6 w-6" />
              <span>Menús</span>
            </Button>
          </Link>

          <Link href="/ingredientes">
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
            >
              <Package className="h-6 w-6" />
              <span>Ingredientes</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Estado del sistema */}
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Sistema Operativo
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Base de Datos Conectada
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Sesión Activa
              </Badge>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Usuario: {sesion.Email}
              </Badge>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Última actualización: {new Date().toLocaleString("es-ES")}</p>
              <p>Rol ID: {sesion.RolId}</p>
              <p>Hotel ID: {sesion.HotelId || "No asignado"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
