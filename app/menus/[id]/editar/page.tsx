"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, PlusCircle, Check, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useUserSession } from "@/hooks/use-user-session"
import {
  getMenuDetails,
  getHotelsForDropdown,
  getRestaurantsForDropdown,
  updateMenuBasicInfo,
  getAvailablePlatillos,
  addPlatilloToMenu,
  getPlatillosInMenu,
} from "@/app/actions/menus-editar-actions"
import type { Hotel, Restaurante, Platillo, PlatilloXMenu } from "@/lib/supabase" // Using supabase types for structure
import { formatCurrency } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MenuPlatilloDisplay extends PlatilloXMenu {
  platillo: Platillo // Assuming platillo details are joined
}

export default function EditarMenuPage() {
  const params = useParams()
  const menuId = typeof params.id === "string" ? Number.parseInt(params.id) : null
  const router = useRouter()
  const { toast } = useToast()
  const { session, loading: sessionLoading } = useUserSession()

  const [currentStage, setCurrentStage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Etapa 1 states
  const [nombreMenu, setNombreMenu] = useState("")
  const [descripcionMenu, setDescripcionMenu] = useState("")
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [selectedRestauranteId, setSelectedRestauranteId] = useState<number | null>(null)
  const [isUpdatingBasicInfo, setIsUpdatingBasicInfo] = useState(false)

  // Etapa 2 states
  const [availablePlatillos, setAvailablePlatillos] = useState<Platillo[]>([])
  const [platillosEnMenu, setPlatillosEnMenu] = useState<MenuPlatilloDisplay[]>([])
  const [selectedPlatilloId, setSelectedPlatilloId] = useState<number | null>(null)
  const [costoPlatillo, setCostoPlatillo] = useState<number>(0) // This will be read-only, derived from selected platillo
  const [precioVentaPlatillo, setPrecioVentaPlatillo] = useState<number>(0)
  const [isAddingPlatillo, setIsAddingPlatillo] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Security check and initial data fetch
  useEffect(() => {
    if (sessionLoading) return

    // Validar que la sesión está activa y el RolId no está vacío o es 0
    if (!session || !session.SesionActiva || session.SesionActiva !== true || !session.RolId || session.RolId === 0) {
      router.push("/login")
      return
    }

    if (!menuId) {
      setError("ID de menú no válido.")
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch menu details
        const { data: menuData, error: menuError } = await getMenuDetails(menuId)
        if (menuError || !menuData) {
          throw new Error(menuError || "Menú no encontrado.")
        }
        setNombreMenu(menuData.nombre || "")
        setDescripcionMenu(menuData.descripcion || "")
        setSelectedRestauranteId(menuData.restaurante_id || null)
        setSelectedHotelId(menuData.restaurantes?.hotel_id || null)

        // Fetch hotels
        const { data: hotelsData, error: hotelsError } = await getHotelsForDropdown(
          session.RolId,
          session.HotelId, // Usar HotelId de la sesión
        )
        if (hotelsError) throw new Error(hotelsError)
        setHotels(hotelsData || [])

        // Fetch available platillos for Etapa 2
        const { data: availablePlatillosData, error: availablePlatillosError } = await getAvailablePlatillos()
        if (availablePlatillosError) throw new Error(availablePlatillosError)
        setAvailablePlatillos(availablePlatillosData || [])

        // Fetch platillos already in this menu for Etapa 2 table
        const { data: platillosInMenuData, error: platillosInMenuError } = await getPlatillosInMenu(menuId)
        if (platillosInMenuError) throw new Error(platillosInMenuError)
        setPlatillosEnMenu(platillosInMenuData || [])
      } catch (err: any) {
        console.error("Error loading menu data:", err)
        setError(err.message || "Error al cargar los datos del menú.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, sessionLoading, menuId, router])

  // Fetch restaurants when selectedHotelId changes
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (selectedHotelId) {
        const { data, error } = await getRestaurantsForDropdown(selectedHotelId)
        if (error) {
          toast({
            title: "Error",
            description: `Error al cargar restaurantes: ${error}`,
            variant: "destructive",
          })
          setRestaurantes([])
        } else {
          setRestaurantes(data || [])
        }
      } else {
        setRestaurantes([])
      }
    }
    fetchRestaurants()
  }, [selectedHotelId, toast])

  // Update costoPlatillo when selectedPlatilloId changes
  useEffect(() => {
    if (selectedPlatilloId) {
      const platillo = availablePlatillos.find((p) => p.id === selectedPlatilloId)
      if (platillo) {
        setCostoPlatillo(platillo.costo_total || 0)
      }
    } else {
      setCostoPlatillo(0)
    }
  }, [selectedPlatilloId, availablePlatillos])

  const handleNextStage = async () => {
    if (!nombreMenu || !descripcionMenu || !selectedHotelId || !selectedRestauranteId) {
      toast({
        title: "Información faltante",
        description: "Favor de llenar la información faltante.",
        variant: "destructive",
      })
      return
    }

    if (!menuId) {
      toast({
        title: "Error",
        description: "ID de menú no válido para actualizar.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingBasicInfo(true)
    try {
      const result = await updateMenuBasicInfo(menuId, {
        nombre: nombreMenu,
        descripcion: descripcionMenu,
        restaurante_id: selectedRestauranteId,
      })

      if (result.success) {
        toast({
          title: "Menú actualizado",
          description: "Información básica del menú actualizada correctamente.",
        })
        setCurrentStage(2)
      } else {
        throw new Error(result.error || "Error al actualizar la información básica del menú.")
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingBasicInfo(false)
    }
  }

  const handlePrevStage = () => {
    setCurrentStage(1)
  }

  const handleAddPlatillo = async () => {
    if (!selectedPlatilloId || !precioVentaPlatillo) {
      toast({
        title: "Información faltante",
        description: "Favor de llenar la información faltante para el platillo.",
        variant: "destructive",
      })
      return
    }

    if (!menuId) {
      toast({
        title: "Error",
        description: "ID de menú no válido para agregar platillo.",
        variant: "destructive",
      })
      return
    }

    setIsAddingPlatillo(true)
    try {
      const result = await addPlatilloToMenu(menuId, selectedPlatilloId, precioVentaPlatillo)

      if (result.success) {
        toast({
          title: "Platillo agregado",
          description: "Platillo agregado al menú correctamente.",
        })
        // Re-fetch platillos in menu to update the table
        const { data, error: fetchError } = await getPlatillosInMenu(menuId)
        if (fetchError) throw new Error(fetchError)
        setPlatillosEnMenu(data || [])

        // Clear inputs
        setSelectedPlatilloId(null)
        setCostoPlatillo(0)
        setPrecioVentaPlatillo(0)
      } else {
        throw new Error(result.error || "Error al agregar el platillo al menú.")
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsAddingPlatillo(false)
    }
  }

  const handleFinalUpdate = () => {
    setShowSuccessModal(true)
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    router.push("/menus")
  }

  if (loading || sessionLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="ml-2 text-lg">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push("/menus")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Menús
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            id="btnRegresarMenuEd"
            name="btnRegresarMenuEd"
            onClick={() => router.push("/menus")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Regresar a Menús</span>
          </Button>
          <h1 className="text-3xl font-bold">Editar Menú</h1>
        </div>
      </div>

      {currentStage === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 1: Información Básica del Menú</CardTitle>
            <CardDescription>Actualiza los detalles principales de tu menú.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="txtNombreMenuNuevo">Nombre del Menú</Label>
              <Input
                id="txtNombreMenuNuevo"
                name="txtNombreMenuNuevo"
                type="text"
                maxLength={150}
                value={nombreMenu}
                onChange={(e) => setNombreMenu(e.target.value)}
                placeholder="Nombre del menú"
              />
            </div>
            <div>
              <Label htmlFor="txtDescripcionMenu">Descripción</Label>
              <Textarea
                id="txtDescripcionMenu"
                name="txtDescripcionMenu"
                maxLength={150}
                value={descripcionMenu}
                onChange={(e) => setDescripcionMenu(e.target.value)}
                placeholder="Descripción del menú"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="ddlHotelMenu">Hotel</Label>
              <Select
                value={selectedHotelId?.toString() || ""}
                onValueChange={(value) => setSelectedHotelId(Number.parseInt(value))}
              >
                <SelectTrigger id="ddlHotelMenu" name="ddlHotelMenu">
                  <SelectValue placeholder="Selecciona un hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id.toString()}>
                      {hotel.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ddlRestauranteMenu">Restaurante</Label>
              <Select
                value={selectedRestauranteId?.toString() || ""}
                onValueChange={(value) => setSelectedRestauranteId(Number.parseInt(value))}
                disabled={!selectedHotelId || restaurantes.length === 0}
              >
                <SelectTrigger id="ddlRestauranteMenu" name="ddlRestauranteMenu">
                  <SelectValue placeholder="Selecciona un restaurante" />
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              id="btnRegistrarMenu"
              name="btnRegistrarMenu"
              onClick={handleNextStage}
              disabled={isUpdatingBasicInfo}
            >
              {isUpdatingBasicInfo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...
                </>
              ) : (
                "Actualizar Menú"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStage === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 2: Agregar Platillos al Menú</CardTitle>
            <CardDescription>Añade y gestiona los platillos que forman parte de este menú.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ddIPlatilloMenu">Platillo</Label>
                <Select
                  value={selectedPlatilloId?.toString() || ""}
                  onValueChange={(value) => setSelectedPlatilloId(Number.parseInt(value))}
                >
                  <SelectTrigger id="ddIPlatilloMenu" name="ddIPlatilloMenu">
                    <SelectValue placeholder="Selecciona un platillo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlatillos.map((platillo) => (
                      <SelectItem key={platillo.id} value={platillo.id.toString()}>
                        {platillo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="txtCostoPlatillo">Costo Platillo</Label>
                <Input
                  id="txtCostoPlatillo"
                  name="txtCostoPlatillo"
                  type="text"
                  value={formatCurrency(costoPlatillo)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="txtVentaPlatillo">Precio de Venta</Label>
                <Input
                  id="txtVentaPlatillo"
                  name="txtVentaPlatillo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioVentaPlatillo}
                  onChange={(e) => setPrecioVentaPlatillo(Number.parseFloat(e.target.value))}
                  placeholder="Precio de venta"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                id="btnAgregarPlatillo"
                name="btnAgregarPlatillo"
                onClick={handleAddPlatillo}
                disabled={isAddingPlatillo || !selectedPlatilloId || !precioVentaPlatillo}
              >
                {isAddingPlatillo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Agregando...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Platillo
                  </>
                )}
              </Button>
            </div>

            <div className="border rounded-md mt-6">
              {platillosEnMenu.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platillo</TableHead>
                      <TableHead>Costo</TableHead>
                      <TableHead>Precio Venta</TableHead>
                      <TableHead>Margen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {platillosEnMenu.map((item) => {
                      const costoTotalPlatillo = item.platillos?.costo_total || 0
                      const margen =
                        item.precio_venta && costoTotalPlatillo > 0
                          ? ((item.precio_venta - costoTotalPlatillo) / item.precio_venta) * 100
                          : 0
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.platillos?.imagen_url && (
                                <div className="h-10 w-10 rounded-md overflow-hidden relative">
                                  <Image
                                    src={item.platillos.imagen_url || "/placeholder.svg"}
                                    alt={item.platillos.nombre || "Platillo"}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <p className="font-medium">{item.platillos?.nombre}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(costoTotalPlatillo)}</TableCell>
                          <TableCell>{formatCurrency(item.precio_venta || 0)}</TableCell>
                          <TableCell>
                            <Badge variant={margen < 20 ? "destructive" : margen < 30 ? "outline" : "secondary"}>
                              {margen.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay platillos agregados a este menú.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevStage}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            <Button id="btnActualizarMenu" name="btnActualizarMenu" onClick={handleFinalUpdate}>
              Actualizar Menú
            </Button>
          </CardFooter>
        </Card>
      )}

      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-green-600">
              <Check className="mr-2 h-5 w-5" /> Menú actualizado correctamente
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            La información del menú y sus platillos han sido guardados exitosamente.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseSuccessModal}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
