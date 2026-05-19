"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Save,
  Hotel as HotelIcon,
  User,
  CheckCircle2,
  XCircle,
  UserPlus,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import {
  crearUsuario,
  validarEmailUnico,
  obtenerRoles,
  listaDesplegableHoteles,
  type Rol,
  type HotelItem,
} from "@/app/actions/usuarios-actions"

export default function CrearUsuarioPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Rol[]>([])
  const [hoteles, setHoteles] = useState<HotelItem[]>([])
  const [saving, setSaving] = useState(false)

  const [inputNombre, setInputNombre] = useState("")
  const [inputEmail, setInputEmail] = useState("")
  const [inputRolId, setInputRolId] = useState("")
  const [inputHotelId, setInputHotelId] = useState("")
  const [activo, setActivo] = useState(true)

  const [emailValidado, setEmailValidado] = useState<null | boolean>(null)
  const [validandoEmail, setValidandoEmail] = useState(false)

  const [password1, setPassword1] = useState("")
  const [password2, setPassword2] = useState("")

  useEffect(() => {
    async function loadData() {
      const [resRoles, resHoteles] = await Promise.all([obtenerRoles(), listaDesplegableHoteles(true)])
      if (resRoles.success) setRoles(resRoles.data)
      if (resHoteles.success) {
        setHoteles(resHoteles.data)
        if (resHoteles.data.length > 0) setInputHotelId(resHoteles.data[0].value)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    setEmailValidado(null)
  }, [inputEmail])

  async function handleValidarEmail() {
    if (inputEmail.trim().length < 3) {
      toast.error("El email debe tener al menos 3 caracteres")
      return
    }
    setValidandoEmail(true)
    const result = await validarEmailUnico(inputEmail.trim())
    if (result.success) {
      setEmailValidado(!result.existe)
    } else {
      toast.error(result.error || "Error al validar")
    }
    setValidandoEmail(false)
  }

  const passwordsCoinciden = password1 === password2
  const passwordIngresada = password1.trim().length > 0 && password2.trim().length > 0
  const emailDuplicado = emailValidado === false
  const emailNecesitaValidar = inputEmail.trim().length >= 3 && emailValidado === null

  const puedeCrear =
    inputNombre.trim().length > 0 &&
    !!inputRolId &&
    inputEmail.trim().length >= 3 &&
    !emailDuplicado &&
    !emailNecesitaValidar &&
    passwordIngresada &&
    passwordsCoinciden

  async function handleCrear() {
    if (!inputNombre.trim()) return toast.error("El nombre completo es requerido")
    if (!inputRolId) return toast.error("El rol es requerido")
    if (inputEmail.trim().length < 3) return toast.error("El email es requerido")
    if (emailNecesitaValidar) return toast.error("Debes validar el email antes de crear")
    if (emailDuplicado) return toast.error("El email ya está registrado")
    if (!passwordIngresada) return toast.error("La contraseña es requerida")
    if (!passwordsCoinciden) return toast.error("Las contraseñas no coinciden")

    setSaving(true)
    const formData = new FormData()
    formData.append("nombrecompleto", inputNombre.trim())
    formData.append("email", inputEmail.trim())
    formData.append("password", password1)
    formData.append("rolid", inputRolId)
    formData.append("hotelid", inputHotelId)
    formData.append("activo", activo ? "true" : "false")

    const result = await crearUsuario(formData)
    setSaving(false)

    if (result.success) {
      toast.success("Usuario creado correctamente")
      router.push("/admin/usuarios")
    } else {
      toast.error(result.error || "Error al crear usuario")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lime-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-gradient-to-r from-lime-50 to-transparent rounded-xl border border-lime-200 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/usuarios")}
          className="hover:bg-lime-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-lime-600/10">
            <UserPlus className="h-5 w-5 text-lime-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h1>
            <p className="text-sm text-muted-foreground">Crear un nuevo usuario en el sistema</p>
          </div>
        </div>
      </div>

      <Card className="border-lime-200">
        <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-lime-600" />
            <CardTitle>Información Básica</CardTitle>
          </div>
          <CardDescription>
            Datos del usuario. Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombrecompleto" className="font-semibold">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombrecompleto"
                value={inputNombre}
                onChange={(e) => setInputNombre(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotelPrincipal" className="font-semibold flex items-center gap-1">
                <HotelIcon className="h-3.5 w-3.5" />
                Hotel
              </Label>
              <Select value={inputHotelId} onValueChange={setInputHotelId}>
                <SelectTrigger id="hotelPrincipal">
                  <SelectValue placeholder="Seleccionar hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel.value} value={hotel.value}>
                      {hotel.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-lime-50/40 transition-colors">
            <Checkbox checked={activo} onCheckedChange={(c) => setActivo(c === true)} />
            <div className="flex-1">
              <p className="text-sm font-medium">Usuario activo</p>
              <p className="text-xs text-muted-foreground">Si está inactivo no podrá iniciar sesión</p>
            </div>
          </label>
        </CardContent>
      </Card>

      <Card className="border-lime-200">
        <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-lime-600" />
            <CardTitle>Acceso</CardTitle>
          </div>
          <CardDescription>Email único y rol para el inicio de sesión.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="correo@dominio.com"
                  className={
                    emailValidado === false
                      ? "border-red-500"
                      : emailValidado === true
                        ? "border-emerald-500"
                        : ""
                  }
                />
                <Button
                  type="button"
                  variant={emailValidado === false ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleValidarEmail}
                  disabled={validandoEmail || inputEmail.trim().length < 3}
                  className="shrink-0"
                >
                  {validandoEmail ? "..." : "Validar"}
                </Button>
              </div>
              {emailValidado === false && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Este email ya existe en el sistema
                </p>
              )}
              {emailValidado === true && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Email disponible
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol" className="font-semibold">
                Rol <span className="text-red-500">*</span>
              </Label>
              <Select value={inputRolId} onValueChange={setInputRolId}>
                <SelectTrigger id="rol">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-lime-200">
        <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-lime-600" />
            <CardTitle>Contraseña</CardTitle>
          </div>
          <CardDescription>
            Define la contraseña inicial. Se guarda encriptada con bcrypt; ambos campos deben coincidir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password1" className="font-semibold">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password1"
                type="password"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                placeholder="Ingresa la contraseña"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password2" className="font-semibold">
                Confirmar contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Repite la contraseña"
                className={
                  password2.length > 0
                    ? passwordsCoinciden
                      ? "border-emerald-500"
                      : "border-red-500"
                    : ""
                }
              />
              {password2.length > 0 &&
                (passwordsCoinciden ? (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Las contraseñas coinciden
                  </p>
                ) : (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Las contraseñas no coinciden
                  </p>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={() => router.push("/admin/usuarios")} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleCrear}
          disabled={saving || !puedeCrear}
          className="bg-foreground text-background hover:bg-foreground/90 gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Crear Usuario
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
