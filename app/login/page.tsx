"use client"

/* ==================================================
  Imports
================================================== */
import { useState } from "react"
import { procesarInicioSesion } from "@/app/actions/login-backend-actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Icons } from "@/components/icons"
import { Send, UserCheck } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const router = useRouter()

  const showModalMessage = (message: string, redirect = false) => {
    setModalMessage(message)
    setShowModal(true)
    setShouldRedirect(redirect)
  }

  const handleModalClose = () => {
    setShowModal(false)
    if (shouldRedirect) {
      router.push("/dashboard")
    }
  }

  const validateLogin = async () => {
    const txtCorreo = document.getElementById("txtCorreo") as HTMLInputElement
    const txtPassword = document.getElementById("txtPassword") as HTMLInputElement

    // Validar correo
    if (!txtCorreo.value.trim()) {
      showModalMessage("Por favor introduce tu Correo de acceso")
      txtCorreo.focus()
      return
    }

    // Validar contraseña
    if (!txtPassword.value || txtPassword.value.length < 4) {
      showModalMessage("Por favor introduce tu password correctamente.")
      return
    }

    // Procesar en backend
    setLoading(true)
    try {
      const result = await procesarInicioSesion(txtCorreo.value, txtPassword.value)

      if (result.success) {
        showModalMessage(result.message, true)
        setTimeout(() => {
          setShowModal(false)
          router.push("/dashboard")
        }, 2000)
      } else {
        showModalMessage(result.message)
      }
    } catch (error) {
      showModalMessage("Error inesperado. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[url('https://nxtrsibnomdqmzcrwedc.supabase.co/storage/v1/object/public/imagenes/Backgrouds/FondoInicioSesion.jpg')] bg-cover bg-center">
      {/* Iconos de fondo */}
      {/*<div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-10 text-blue-700/20">
          <Icons.Lock className="w-16 h-16" />
        </div>
        <div className="absolute top-32 right-20 text-blue-700/20">
          <Icons.KeyRound className="w-12 h-12" />
        </div>
        <div className="absolute bottom-32 left-20 text-blue-700/20">
          <Icons.Lock className="w-14 h-14" />
        </div>
        <div className="absolute bottom-10 right-10 text-blue-700/20">
          <Icons.KeyRound className="w-18 h-18" />
        </div>
        <div className="absolute top-1/2 left-1/4 text-blue-700/10">
          <Icons.Lock className="w-20 h-20" />
        </div>
        <div className="absolute top-1/3 right-1/3 text-blue-700/10">
          <Icons.KeyRound className="w-16 h-16" />
        </div>
      </div>*/}

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Logo */}
       

        {/* Formulario */}
        <Card className="bg-[#fffcf5] w-full max-w-md z-20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="bg-[#fffcf5] mb-8 rounded-lg">
          <div className="bg-[#fffcf5] flex items-center space-x-3 rounded-lg">
            <div className="w-full h-12 rounded-lg flex items-center justify-center">
             
          <Icons.Utensils className="w-8 h-8 text-black mr-4"/><h1 className="text-3xl font-bold text-black"> Sistema de Costeo </h1>
          
            </div>
            
          </div>
        </div>
          <h1></h1>
          <h3></h3>
          <h3></h3>
            <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="frmLogin" name="frmLogin" className="bg-[#fffcf5] space-y-4">
              <div className="bg-[#fffcf5] space-y-2 z-30 relative">
                <Input
                  type="text"
                  id="txtCorreo"
                  name="txtCorreo"
                  maxLength={50}
                  placeholder="Introduce tu Usuario / Correo electrónico"
                  className="bg-[#fffcf5] w-full z-30"
                  autoComplete="email"
                />
              </div>

              <div className="bg-[#fffcf5] space-y-2 z-30 relative">
                <Input
                  type="password"
                  id="txtPassword"
                  name="txtPassword"
                  maxLength={150}
                  placeholder="Coloca tu contraseña de acceso"
                  className="bg-[#fffcf5] w-full z-30"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="button"
                id="btnValidar"
                name="btnValidar"
                onClick={validateLogin}
                disabled={loading}
                className="w-full bg-[#333333] text-white z-30 relative"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Validando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Validar</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>

          <div className="mt-4 text-center">
          <p className="text-sm text-black">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-xs mt-1 mb-4 text-black">Sistema de Gestión de Restaurantes</p>
        </div>
        </Card>

        {/* Pie de página */}
        
      </div>

      {/* Modal */}
      <AlertDialog open={showModal} onOpenChange={setShowModal}>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Sistema de Costeo</AlertDialogTitle>
            <AlertDialogDescription>{modalMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleModalClose}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
