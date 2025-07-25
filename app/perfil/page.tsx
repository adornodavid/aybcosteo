"use client"

import { useUserSession } from "@/hooks/use-user-session"
import { UserInfo } from "@/components/user-info"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
//import { useAuth } from "@/contexts/auth-context"
//import { useRouter } from "next/navigation"

export default function PerfilPage() {
  const { profile, user, loading } = useUserSession() // Destructuramos 'user' también
  //const { signOut } = useAuth()
  //const router = useRouter()

  /*
  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }
  */

  if (loading) {
    return <div>Cargando perfil...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/*
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <Button onClick={handleSignOut} variant="outline">
          Cerrar Sesión
        </Button>
      </div>
      */}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {" "}
        {/* Ajustado para 3 columnas */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
            <CardDescription>Datos de tu cuenta en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <UserInfo />
          </CardContent>
        </Card>

        {/*
        <Card>
          <CardHeader>
            <CardTitle>Variables de Sesión (Perfil Enriquecido)</CardTitle>
            <CardDescription>Información técnica de la sesión actual (con datos de BD si existen)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>ID:</strong> {profile?.id}
              </div>
              <div>
                <strong>Email:</strong> {profile?.email}
              </div>
              <div>
                <strong>Nombre:</strong> {profile?.nombre}
              </div>
              <div>
                <strong>Rol:</strong> {profile?.rol || "No asignado"}
              </div>
              <div>
                <strong>Hotel ID:</strong> {profile?.hotel_id || "No asignado"}
              </div>
              <div>
                <strong>Hotel:</strong> {profile?.hotel_nombre || "No asignado"}
              </div>
              <div>
                <strong>Permisos:</strong> {profile?.permisos ? profile.permisos.join(", ") : "No asignado"}
              </div>
              */}
              {/* Asumiendo que SesionActiva podría ser parte del perfil enriquecido si se añade */}
              {/* <div>
                <strong>Sesión Activa:</strong> {profile?.SesionActiva ? "Sí" : "No"}
              </div> */}
            {/*
            </div>
          </CardContent>
        </Card>
        */}

        {/* Nueva tarjeta para mostrar los valores directos de la cookie de sesión */}
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
