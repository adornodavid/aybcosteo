"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { obtenerVariablesSesion } from "@/app/actions/session-actions"
import { ArrowLeft, Plus, Save } from "lucide-react"

interface Hotel {
  id: number
  nombre: string
}

interface Restaurante {
  id: number
  nombre: string
}

interface Menu {
  id: number
  nombre: string
}

interface Ingrediente {
  id: number
  nombre: string
  costo: number
}

interface IngredientePlatillo {
  id: number
  nombre: string
  cantidad: number
  ingredientecostoparcial: number
}

export default function NuevoPlatilloPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Estados de sesión
  const [sesionValida, setSesionValida] = useState(false)
  const [hotelIdSesion, setHotelIdSesion] = useState<string>("")
  const [rolIdSesion, setRolIdSesion] = useState<string>("")

  // Estados del formulario básico
  const [nombrePlatillo, setNombrePlatillo] = useState("")
  const [descripcionPlatillo, setDescripcionPlatillo] = useState("")
  const [instruccionesPlatillo, setInstruccionesPlatillo] = useState("")
  const [tiempoPlatillo, setTiempoPlatillo] = useState("")
  const [platilloRegistrado, setPlatilloRegistrado] = useState(false)
  const [platilloId, setPlatilloId] = useState<number | null>(null)
  const [inputsBloqueados, setInputsBloqueados] = useState(false)

  // Estados de dropdowns
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])

  // Estados de selección
  const [hotelSeleccionado, setHotelSeleccionado] = useState("")
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState("")
  const [menuSeleccionado, setMenuSeleccionado] = useState("")
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState("")
  const [cantidadIngrediente, setCantidadIngrediente] = useState("")
  const [costoIngrediente, setCostoIngrediente] = useState("")

  // Estado de ingredientes agregados
  const [ingredientesAgregados, setIngredientesAgregados] = useState<IngredientePlatillo[]>([])

  // Validar sesión al cargar
  useEffect(() => {
    validarSesion()
  }, [])

  // Cargar hoteles cuando la sesión es válida
  useEffect(() => {
    if (sesionValida) {
      cargarHoteles()
    }
  }, [sesionValida, rolIdSesion, hotelIdSesion])

  // Cargar restaurantes cuando cambia el hotel
  useEffect(() => {
    if (hotelSeleccionado) {
      cargarRestaurantes()
      cargarIngredientes()
    }
  }, [hotelSeleccionado])

  // Cargar menús cuando cambia el restaurante
  useEffect(() => {
    if (restauranteSeleccionado && hotelSeleccionado) {
      cargarMenus()
    }
  }, [restauranteSeleccionado, hotelSeleccionado])

  // Actualizar costo cuando cambia el ingrediente
  useEffect(() => {
    if (ingredienteSeleccionado) {
      actualizarCostoIngrediente()
    }
  }, [ingredienteSeleccionado])

  const validarSesion = async () => {
    try {
      const sesion = await obtenerVariablesSesion()

      if (sesion.SesionActiva !== "true" || !sesion.RolId || sesion.RolId === "0") {
        router.push("/login")
        return
      }

      setSesionValida(true)
      setHotelIdSesion(sesion.HotelId || "")
      setRolIdSesion(sesion.RolId || "")
    } catch (error) {
      console.error("Error validando sesión:", error)
      router.push("/login")
    }
  }

  const cargarHoteles = async () => {
    try {
      // Determinar auxHotelid según el rol
      let auxHotelid = -1
      if (!["1", "2", "3", "4"].includes(rolIdSesion)) {
        auxHotelid = Number.parseInt(hotelIdSesion) || -1
      }

      let query = supabase.from("hoteles").select("id, nombre").eq("activo", true).order("nombre")

      // Si auxHotelid no es -1, filtrar por hotel específico
      if (auxHotelid !== -1) {
        query = query.eq("id", auxHotelid)
      }

      const { data, error } = await query

      if (error) throw error

      setHoteles(data || [])

      // Seleccionar el primer hotel automáticamente
      if (data && data.length > 0) {
        setHotelSeleccionado(data[0].id.toString())
      }
    } catch (error) {
      console.error("Error cargando hoteles:", error)
      toast({
        title: "Error",
        description: "Error al cargar hoteles",
        variant: "destructive",
      })
    }
  }

  const cargarRestaurantes = async () => {
    if (!hotelSeleccionado) return

    try {
      const { data, error } = await supabase
        .from("restaurantes")
        .select("id, nombre")
        .eq("hotelid", Number.parseInt(hotelSeleccionado))
        .order("nombre")

      if (error) throw error

      setRestaurantes(data || [])

      // Seleccionar el primer restaurante automáticamente
      if (data && data.length > 0) {
        setRestauranteSeleccionado(data[0].id.toString())
      } else {
        setRestauranteSeleccionado("")
      }
    } catch (error) {
      console.error("Error cargando restaurantes:", error)
      toast({
        title: "Error",
        description: "Error al cargar restaurantes",
        variant: "destructive",
      })
    }
  }

  const cargarMenus = async () => {
    if (!restauranteSeleccionado || !hotelSeleccionado) return

    try {
      const { data, error } = await supabase
        .from("menus")
        .select(`
          id, 
          nombre,
          restaurantes!inner(
            id,
            hoteles!inner(id)
          )
        `)
        .eq("restauranteid", Number.parseInt(restauranteSeleccionado))
        .eq("restaurantes.hotelid", Number.parseInt(hotelSeleccionado))
        .order("nombre")

      if (error) throw error

      const menusData =
        data?.map((menu) => ({
          id: menu.id,
          nombre: menu.nombre,
        })) || []

      setMenus(menusData)

      // Seleccionar el primer menú automáticamente
      if (menusData.length > 0) {
        setMenuSeleccionado(menusData[0].id.toString())
      } else {
        setMenuSeleccionado("")
      }
    } catch (error) {
      console.error("Error cargando menús:", error)
      toast({
        title: "Error",
        description: "Error al cargar menús",
        variant: "destructive",
      })
    }
  }

  const cargarIngredientes = async () => {
    if (!hotelSeleccionado) return

    try {
      const { data, error } = await supabase
        .from("ingredientes")
        .select("id, nombre, costo")
        .eq("hotelid", Number.parseInt(hotelSeleccionado))
        .order("nombre")

      if (error) throw error

      setIngredientes(data || [])
    } catch (error) {
      console.error("Error cargando ingredientes:", error)
      toast({
        title: "Error",
        description: "Error al cargar ingredientes",
        variant: "destructive",
      })
    }
  }

  const actualizarCostoIngrediente = () => {
    const ingrediente = ingredientes.find((ing) => ing.id.toString() === ingredienteSeleccionado)
    if (ingrediente) {
      setCostoIngrediente(ingrediente.costo.toString())
    }
  }

  const registrarPlatillo = async () => {
    // Validar campos
    if (!nombrePlatillo || !descripcionPlatillo || !instruccionesPlatillo || !tiempoPlatillo) {
      toast({
        title: "Error",
        description: "Favor de llenar la información faltante",
        variant: "destructive",
      })
      return
    }

    try {
      // Insertar platillo
      const { data, error } = await supabase
        .from("platillos")
        .insert({
          nombre: nombrePlatillo,
          descripcion: descripcionPlatillo,
          instruccionespreparacion: instruccionesPlatillo,
          tiempopreparacion: tiempoPlatillo,
          costototal: null,
          imgurl: null,
          activo: true,
          fechacreacion: null,
        })
        .select()

      if (error) throw error

      // Obtener el ID del platillo recién creado
      const { data: platilloData, error: platilloError } = await supabase
        .from("platillos")
        .select("id")
        .eq("nombre", nombrePlatillo)
        .single()

      if (platilloError) throw platilloError

      setPlatilloId(platilloData.id)
      setPlatilloRegistrado(true)
      setInputsBloqueados(true)

      toast({
        title: "Éxito",
        description: "Platillo registrado correctamente",
      })
    } catch (error) {
      console.error("Error registrando platillo:", error)
      toast({
        title: "Error",
        description: "Error al registrar el platillo",
        variant: "destructive",
      })
    }
  }

  const agregarIngrediente = async () => {
    // Validar campos
    if (!ingredienteSeleccionado || !cantidadIngrediente) {
      toast({
        title: "Error",
        description: "Favor de llenar la información faltante",
        variant: "destructive",
      })
      return
    }

    try {
      const cantidad = Number.parseFloat(cantidadIngrediente)
      const costo = Number.parseFloat(costoIngrediente)
      const costoParcial = cantidad * costo

      // Insertar ingrediente del platillo
      const { error } = await supabase.from("ingredientesxplatillo").insert({
        platilloid: platilloId,
        ingredienteid: Number.parseInt(ingredienteSeleccionado),
        cantidad: cantidad,
        ingredientecostoparcial: costoParcial,
        activo: true,
        fechacreacion: null,
        fechamodificacion: null,
      })

      if (error) throw error

      // Actualizar tabla de ingredientes
      await cargarIngredientesAgregados()

      // Limpiar campos
      setIngredienteSeleccionado("")
      setCantidadIngrediente("")
      setCostoIngrediente("")

      toast({
        title: "Éxito",
        description: "Ingrediente agregado correctamente",
      })
    } catch (error) {
      console.error("Error agregando ingrediente:", error)
      toast({
        title: "Error",
        description: "Error al agregar el ingrediente",
        variant: "destructive",
      })
    }
  }

  const cargarIngredientesAgregados = async () => {
    if (!platilloId) return

    try {
      const { data, error } = await supabase
        .from("ingredientesxplatillo")
        .select(`
          id,
          cantidad,
          ingredientecostoparcial,
          ingredientes!inner(nombre)
        `)
        .eq("platilloid", platilloId)

      if (error) throw error

      const ingredientesData =
        data?.map((item) => ({
          id: item.id,
          nombre: item.ingredientes.nombre,
          cantidad: item.cantidad,
          ingredientecostoparcial: item.ingredientecostoparcial,
        })) || []

      setIngredientesAgregados(ingredientesData)
    } catch (error) {
      console.error("Error cargando ingredientes agregados:", error)
    }
  }

  const registroCompleto = async () => {
    // Validar que se haya seleccionado un menú
    if (!menuSeleccionado) {
      toast({
        title: "Error",
        description: "El platillo no se encuentra asignado a ningun Menu, favor de llenar la informacion",
        variant: "destructive",
      })
      return
    }

    try {
      // Insertar en platillosxmenu
      const { error } = await supabase.from("platillosxmenu").insert({
        menuid: Number.parseInt(menuSeleccionado),
        platilloid: platilloId,
        precioventa: null,
        margenutilidad: null,
        activo: true,
        fechacreacion: null,
      })

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Platillo registrado completamente",
      })

      // Redirigir a la página de platillos
      router.push("/platillos")
    } catch (error) {
      console.error("Error en registro completo:", error)

      // Eliminar platillo si hay error
      if (platilloId) {
        await supabase.from("platillos").delete().eq("id", platilloId)
      }

      toast({
        title: "Error",
        description: "Error al completar el registro del platillo",
        variant: "destructive",
      })
    }
  }

  if (!sesionValida) {
    return <div>Validando sesión...</div>
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold">Registrar Platillo</h1>
      </div>

      {/* Botón Regresar */}
      <div>
        <Button
          type="button"
          id="btnRegresar"
          name="btnRegresar"
          variant="outline"
          onClick={() => router.push("/platillos")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Regresar
        </Button>
      </div>

      {/* Sección 1: Información básica del platillo */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica del Platillo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="txtNombrePlatilloNuevo">Nombre Platillo</Label>
              <Input
                type="text"
                id="txtNombrePlatilloNuevo"
                name="txtNombrePlatilloNuevo"
                maxLength={150}
                value={nombrePlatillo}
                onChange={(e) => setNombrePlatillo(e.target.value)}
                disabled={inputsBloqueados}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="txtDescripcionPlatillo">Descripción</Label>
              <Input
                type="text"
                id="txtDescripcionPlatillo"
                name="txtDescripcionPlatillo"
                maxLength={150}
                value={descripcionPlatillo}
                onChange={(e) => setDescripcionPlatillo(e.target.value)}
                disabled={inputsBloqueados}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="txtPlatilloInstrucciones">Instrucciones de Elaboración</Label>
              <Input
                type="text"
                id="txtPlatilloInstrucciones"
                name="txtPlatilloInstrucciones"
                maxLength={150}
                value={instruccionesPlatillo}
                onChange={(e) => setInstruccionesPlatillo(e.target.value)}
                disabled={inputsBloqueados}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="txtPlatilloTiempo">Tiempo Preparación</Label>
              <Input
                type="text"
                id="txtPlatilloTiempo"
                name="txtPlatilloTiempo"
                maxLength={150}
                value={tiempoPlatillo}
                onChange={(e) => setTiempoPlatillo(e.target.value)}
                disabled={inputsBloqueados}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              id="btnRegistrarPlatillo"
              name="btnRegistrarPlatillo"
              onClick={registrarPlatillo}
              disabled={platilloRegistrado}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Registrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sección 2: Registrar a un Menú (solo visible después de registrar platillo) */}
      {platilloRegistrado && (
        <Card>
          <CardHeader>
            <CardTitle>Asignar a Menú</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ddlHotel">Hotel</Label>
                <Select value={hotelSeleccionado} onValueChange={setHotelSeleccionado}>
                  <SelectTrigger id="ddlHotel" name="ddlHotel">
                    <SelectValue placeholder="Seleccionar hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hoteles.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id.toString()}>
                        {hotel.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ddlRestaurante">Restaurante</Label>
                <Select value={restauranteSeleccionado} onValueChange={setRestauranteSeleccionado}>
                  <SelectTrigger id="ddlRestaurante" name="ddlRestaurante">
                    <SelectValue placeholder="Seleccionar restaurante" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurantes.map((restaurante) => (
                      <SelectItem key={restaurante.id} value={restaurante.id.toString()}>
                        {restaurante.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ddlMenu">Menú</Label>
                <Select value={menuSeleccionado} onValueChange={setMenuSeleccionado}>
                  <SelectTrigger id="ddlMenu" name="ddlMenu">
                    <SelectValue placeholder="Seleccionar menú" />
                  </SelectTrigger>
                  <SelectContent>
                    {menus.map((menu) => (
                      <SelectItem key={menu.id} value={menu.id.toString()}>
                        {menu.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sección 3: Registrar ingredientes (solo visible después de registrar platillo) */}
      {platilloRegistrado && (
        <Card>
          <CardHeader>
            <CardTitle>Ingredientes del Platillo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ddlIngredientes">Ingrediente</Label>
                <Select value={ingredienteSeleccionado} onValueChange={setIngredienteSeleccionado}>
                  <SelectTrigger id="ddlIngredientes" name="ddlIngredientes">
                    <SelectValue placeholder="Seleccionar ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredientes.map((ingrediente) => (
                      <SelectItem key={ingrediente.id} value={ingrediente.id.toString()}>
                        {ingrediente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="txtCantidadIngrediente">Cantidad</Label>
                <Input
                  type="number"
                  id="txtCantidadIngrediente"
                  name="txtCantidadIngrediente"
                  step="0.01"
                  value={cantidadIngrediente}
                  onChange={(e) => setCantidadIngrediente(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="txtCostoIngrediente">Costo</Label>
                <Input
                  type="text"
                  id="txtCostoIngrediente"
                  name="txtCostoIngrediente"
                  value={costoIngrediente}
                  disabled
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  id="btnAgregarIngrediente"
                  name="btnAgregarIngrediente"
                  onClick={agregarIngrediente}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar ingrediente
                </Button>
              </div>
            </div>

            {/* Tabla de ingredientes agregados */}
            {ingredientesAgregados.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-medium mb-3">Ingredientes Agregados</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo Parcial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientesAgregados.map((ingrediente) => (
                      <TableRow key={ingrediente.id}>
                        <TableCell>{ingrediente.id}</TableCell>
                        <TableCell>{ingrediente.nombre}</TableCell>
                        <TableCell>{ingrediente.cantidad}</TableCell>
                        <TableCell>${ingrediente.ingredientecostoparcial.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sección 4: Botón de registro completo (solo visible después de registrar platillo) */}
      {platilloRegistrado && (
        <div className="flex justify-end">
          <Button
            type="button"
            id="btnRegistroCompleto"
            name="btnRegistroCompleto"
            onClick={registroCompleto}
            className="flex items-center gap-2"
            size="lg"
          >
            <Save className="h-5 w-5" />
            Registrar Platillo
          </Button>
        </div>
      )}
    </div>
  )
}
