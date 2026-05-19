"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  UserCog,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import {
  obtenerUsuarioDetalle,
  actualizarInfoBasicaUsuario,
  actualizarAccesoUsuario,
  actualizarPasswordUsuario,
  validarEmailUnico,
  obtenerRoles,
  listaDesplegableHoteles,
  type Rol,
  type HotelItem,
  type UsuarioDetalle,
} from "@/app/actions/usuarios-actions"

function EditarUsuarioContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = Number(searchParams.get("id"))

  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null)
  const [roles, setRoles] = useState<Rol[]>([])
  const [hoteles, setHoteles] = useState<HotelItem[]>([])

  const [inputNombre, setInputNombre] = useState("")
  const [inputHotelId, setInputHotelId] = useState("")
  const [activo, setActivo] = useState(true)
  const [savingInfo, setSavingInfo] = useState(false)

  const [inputEmail, setInputEmail] = useState("")
  const [inputRolId, setInputRolId] = useState("")
  const [emailValidado, setEmailValidado] = useState<null | boolean>(null)
  const [validandoEmail, setValidandoEmail] = useState(false)
  const [savingAcceso, setSavingAcceso] = useState(false)

  const [password1, setPassword1] = useState("")
  const [password2, setPassword2] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (!id || isNaN(id)) {
      router.push("/admin/usuarios")
      return
    }
    async function loadData() {
      const [resUsuario, resRoles, resHoteles] = await Promise.all([
        obtenerUsuarioDetalle(id),
        obtenerRoles(),
        listaDesplegableHoteles(false),
      ])

      if (!resUsuario.success || !resUsuario.data) {
        toast.error(resUsuario.error || "Error al cargar usuario")
        router.push("/admin/usuarios")
        return
      }
      const u = resUsuario.data
      setUsuario(u)
      setInputNombre(u.nombrecompleto || "")
      setInputEmail(u.email || "")
      setInputRolId(u.rolid?.toString() || "")
      setInputHotelId(u.hotelid != null ? String(u.hotelid) : "")
      setActivo(u.activo)

      if (resRoles.success) setRoles(resRoles.data)
      if (resHoteles.success) setHoteles(resHoteles.data)

      if (u.email) {
        const r = await validarEmailUnico(u.email, id)
        if (r.success) setEmailValidado(!r.existe)
      }
      setLoading(false)
    }
    loadData()
  }, [id, router])

  useEffect(() => {
    setEmailValidado(null)
  }, [inputEmail])

  async function handleValidarEmail() {
    if (inputEmail.trim().length < 3) {
      toast.error("El email debe tener al menos 3 caracteres")
      return
    }
    setValidandoEmail(true)
    const result = await validarEmailUnico(inputEmail.trim(), id)
    if (result.success) setEmailValidado(!result.existe)
    else toast.error(result.error || "Error al validar")
    setValidandoEmail(false)
  }

  async function handleActualizarInfo() {
    if (!inputNombre.trim()) return toast.error("El nombre completo es requerido")
    setSavingInfo(true)
    const hotelIdNum = inputHotelId && inputHotelId.trim() !== "" ? Number(inputHotelId) : null
    const result = await actualizarInfoBasicaUsuario(id, inputNombre, hotelIdNum, activo)
    setSavingInfo(false)
    if (result.success) toast.success("Información actualizada correctamente")
    else toast.error(result.error || "Error al actualizar")
  }

  async function handleActualizarAcceso() {
    if (!inputEmail.trim()) return toast.error("El email es requerido")
    if (!inputRolId) return toast.error("El rol es requerido")
    setSavingAcceso(true)
    const result = await actualizarAccesoUsuario(id, inputEmail.trim(), Number(inputRolId))
    setSavingAcceso(false)
    if (result.success) toast.success("Datos de acceso actualizados correctamente")
    else toast.error(result.error || "Error al actualizar")
  }

  async function handleActualizarPassword() {
    if (!password1.trim() || !password2.trim()) return toast.error("Ambos campos son requeridos")
    if (password1 !== password2) return toast.error("Las contraseñas no coinciden")
    setSavingPassword(true)
    const result = await actualizarPasswordUsuario(id, password1)
    setSavingPassword(false)
    if (result.success) {
      toast.success("Contraseña actualizada correctamente")
      setPassword1("")
      setPassword2("")
    } else {
      toast.error(result.error || "Error al actualizar")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lime-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando usuario...</p>
        </div>
      </div>
    )
  }
  if (!usuario) return null

  const emailOk = inputEmail.trim().length >= 3 && (emailValidado === true || emailValidado === null)
  const puedeActualizarAcceso = emailOk && !!inputRolId && emailValidado !== false

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
            <UserCog className="h-5 w-5 text-lime-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar: {usuario.nombrecompleto}</h1>
            <p className="text-sm text-muted-foreground">Modificar datos del usuario</p>
          </div>
        </div>
      </div>

      <Card className="border-lime-200">
        <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-lime-600" />
            <CardTitle>Información Básica</CardTitle>
          </div>
          <CardDescription>Datos del usuario y estatus.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombrecompleto" className="font-semibold">
                Nombre Completo
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
                      {!hotel.activo && " (inactivo)"}
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
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleActualizarInfo}
              disabled={savingInfo}
              className="bg-foreground text-background hover:bg-foreground/90 gap-2"
            >
              {savingInfo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Actualizando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Actualizar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-lime-200">
        <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-lime-600" />
            <CardTitle>Acceso</CardTitle>
          </div>
          <CardDescription>Email y rol. Valida unicidad antes de guardar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">
                Email
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
                  <XCircle className="h-3 w-3" /> Este email ya existe
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
                Rol
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
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleActualizarAcceso}
              disabled={savingAcceso || !puedeActualizarAcceso}
              className="bg-foreground text-background hover:bg-foreground/90 gap-2"
            >
              {savingAcceso ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Actualizando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Actualizar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-lime-200">
        <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-lime-600" />
            <CardTitle>Cambiar Contraseña</CardTitle>
          </div>
          <CardDescription>
            Define una nueva contraseña. Se guarda encriptada con bcrypt; ambos campos deben coincidir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password1" className="font-semibold">
                Nueva contraseña
              </Label>
              <Input
                id="password1"
                type="password"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                placeholder="Ingresa la nueva contraseña"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password2" className="font-semibold">
                Confirmar contraseña
              </Label>
              <Input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Repite la nueva contraseña"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleActualizarPassword}
              disabled={savingPassword || !password1 || !password2}
              className="bg-foreground text-background hover:bg-foreground/90 gap-2"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Actualizando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Actualizar contraseña
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EditarUsuarioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-lime-600" />
        </div>
      }
    >
      <EditarUsuarioContent />
    </Suspense>
  )
}
