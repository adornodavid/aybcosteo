"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Hotel, Store, Menu, ChefHat, Package, TrendingUp, Users, Database } from "lucide-react"
import { obtenerVariablesSesion, type SessionData } from "@/app/actions/session-actions"
import { obtenerResumenesDashboard, type DashboardStats } from "@/app/actions/dashboard-actions"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    validarSesionYCargarDatos()
  }, [])

  const validarSesionYCargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Obteniendo datos de sesión...")

      // 1. Obtener datos de sesión (sin validar si está activa)
      const session = await obtenerVariablesSesion()
      console.log("Datos de sesión obtenidos:", session)

      setSessionData(session)

      // 2. Obtener resúmenes del dashboard
      console.log("Obteniendo resúmenes del dashboard...")
      const statsResult = await obtenerResumenesDashboard()

      if (statsResult.success && statsResult.data) {
        setDashboardStats(statsResult.data)
        console.log("Resúmenes cargados:", statsResult.data)
      } else {
        setError(statsResult.error || "Error al cargar los resúmenes")
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setError("Error al cargar los datos del dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* 1. Sección del título de la página y bienvenida en la misma fila */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Sistema de Costeo</h1>
          <h2 className="text-2xl font-semibold text-gray-600">Dashboard</h2>
        </div>

        {/* 2. Sección de bienvenida - lado derecho */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3">
          <Users className="h-6 w-6 text-blue-600" />
          <p className="text-gray-800" style={{ fontSize: "16px" }}>
            Hola <span className="font-semibold text-blue-700">{sessionData?.NombreCompleto || "Usuario"}</span>,
            bienvenido a la aplicación.
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={validarSesionYCargarDatos} className="mt-2">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3. Sección resúmenes visuales */}
      {dashboardStats && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Resúmenes del Sistema</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hoteles</CardTitle>
                <Hotel className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{dashboardStats.totalHoteles}</div>
                <p className="text-xs text-muted-foreground">Hoteles registrados</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Restaurantes</CardTitle>
                <Store className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{dashboardStats.totalRestaurantes}</div>
                <p className="text-xs text-muted-foreground">Restaurantes activos</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Menús</CardTitle>
                <Menu className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{dashboardStats.totalMenus}</div>
                <p className="text-xs text-muted-foreground">Menús creados</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platillos</CardTitle>
                <ChefHat className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{dashboardStats.totalPlatillos}</div>
                <p className="text-xs text-muted-foreground">Platillos disponibles</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingredientes</CardTitle>
                <Package className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{dashboardStats.totalIngredientes}</div>
                <p className="text-xs text-muted-foreground">Ingredientes catalogados</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 4. Resumen del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Resumen del Sistema
          </CardTitle>
          <CardDescription>Información general del sistema de costeo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Total de registros:</p>
              <p className="text-2xl font-bold text-gray-800">
                {dashboardStats
                  ? dashboardStats.totalHoteles +
                    dashboardStats.totalRestaurantes +
                    dashboardStats.totalMenus +
                    dashboardStats.totalPlatillos +
                    dashboardStats.totalIngredientes
                  : 0}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Usuario activo:</p>
              <p className="text-lg font-semibold text-blue-600">{sessionData?.NombreCompleto || "Usuario"}</p>
              <Badge variant="outline">Rol ID: {sessionData?.RolId || "N/A"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button className="w-full justify-start h-12" asChild>
              <Link href="/hoteles">
                <Hotel className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Hoteles</div>
                  <div className="text-xs opacity-70">{dashboardStats?.totalHoteles || 0} registrados</div>
                </div>
              </Link>
            </Button>

            <Button className="w-full justify-start h-12" variant="outline" asChild>
              <Link href="/platillos">
                <ChefHat className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Platillos</div>
                  <div className="text-xs opacity-70">{dashboardStats?.totalPlatillos || 0} disponibles</div>
                </div>
              </Link>
            </Button>

            <Button className="w-full justify-start h-12" variant="outline" asChild>
              <Link href="/menus">
                <Menu className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Menús</div>
                  <div className="text-xs opacity-70">{dashboardStats?.totalMenus || 0} creados</div>
                </div>
              </Link>
            </Button>

            <Button className="w-full justify-start h-12" variant="outline" asChild>
              <Link href="/ingredientes">
                <Package className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Ingredientes</div>
                  <div className="text-xs opacity-70">{dashboardStats?.totalIngredientes || 0} catalogados</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 6. Estado del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>Información sobre el estado actual del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                Conectado
              </Badge>
              <span className="text-sm">Base de datos Supabase</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-600 text-blue-600">
                Sesión Activa
              </Badge>
              <span className="text-sm">Usuario autenticado</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Multi-Hotel</Badge>
              <span className="text-sm">Sistema completo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. Variables de Sesión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Variables de Sesión Activas
          </CardTitle>
          <CardDescription>Información detallada de las variables de sesión del usuario actual</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionData ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Usuario ID */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium text-sm text-blue-800">Usuario ID:</span>
                  <Badge variant="default" className="bg-blue-600">
                    {sessionData.UsuarioId || "No disponible"}
                  </Badge>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-sm text-green-800">Email:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {sessionData.Email || "No disponible"}
                  </Badge>
                </div>

                {/* Nombre Completo */}
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium text-sm text-purple-800">Nombre Completo:</span>
                  <Badge variant="outline" className="border-purple-600 text-purple-800">
                    {sessionData.NombreCompleto || "No disponible"}
                  </Badge>
                </div>

                {/* Hotel ID */}
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium text-sm text-orange-800">Hotel ID:</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {sessionData.HotelId || "No disponible"}
                  </Badge>
                </div>

                {/* Rol ID */}
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-sm text-red-800">Rol ID:</span>
                  <Badge variant="outline" className="border-red-600 text-red-800">
                    {sessionData.RolId || "No disponible"}
                  </Badge>
                </div>

                {/* Sesión Activa */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-sm text-gray-800">Sesión Activa:</span>
                  <Badge
                    variant={sessionData.SesionActiva === "true" ? "default" : "destructive"}
                    className={
                      sessionData.SesionActiva === "true" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                    }
                  >
                    {sessionData.SesionActiva === "true" ? "ACTIVA" : "INACTIVA"}
                  </Badge>
                </div>
              </div>

              {/* Permisos */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Permisos Asignados:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sessionData.Permisos && sessionData.Permisos.length > 0 ? (
                    sessionData.Permisos.map((permiso, index) => (
                      <Badge key={index} variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-800">
                        Permiso {permiso}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-500">
                      Sin permisos asignados
                    </Badge>
                  )}
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2">Información del Sistema:</h5>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Variables asignadas durante el proceso de login</p>
                  <p>• Se mantienen activas durante toda la sesión</p>
                  <p>• Actualizadas automáticamente al iniciar sesión</p>
                </div>
              </div>

              {/* Botón para actualizar sesión */}
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={validarSesionYCargarDatos} className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Actualizar Variables de Sesión
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No hay variables de sesión disponibles</p>
              <p className="text-sm text-gray-400 mt-1">Las variables se cargarán después del login</p>
              <Button variant="outline" onClick={validarSesionYCargarDatos} className="mt-4">
                Cargar Variables de Sesión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
