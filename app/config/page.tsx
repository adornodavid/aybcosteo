"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, ShieldOff, Settings } from "lucide-react"

export default function ConfigPage() {
  const authEnabled = false // Esto debería leerse del middleware

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
        <p className="text-muted-foreground">Gestiona la configuración de autenticación y seguridad</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Estado de Autenticación
            </CardTitle>
            <CardDescription>Controla si el sistema requiere autenticación para acceder a las páginas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {authEnabled ? (
                  <>
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>Protección de rutas activada</span>
                    <Badge variant="default">Activo</Badge>
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-5 w-5 text-orange-600" />
                    <span>Protección de rutas desactivada</span>
                    <Badge variant="secondary">Inactivo</Badge>
                  </>
                )}
              </div>
              <Button variant={authEnabled ? "destructive" : "default"}>
                {authEnabled ? "Desactivar" : "Activar"} Protección
              </Button>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Cuando la protección está desactivada, puedes navegar libremente por todas las
                páginas sin necesidad de iniciar sesión. Para activar la protección, cambia{" "}
                <code>ENABLE_AUTH_PROTECTION</code> a <code>true</code> en el archivo <code>middleware.ts</code>.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Páginas sin Navegación</CardTitle>
            <CardDescription>Páginas que no muestran la barra lateral de navegación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="outline">/login</Badge>
              <Badge variant="outline">/login/test</Badge>
              <Badge variant="outline">/register</Badge>
              <Badge variant="outline">/forgot-password</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
