"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft } from "lucide-react"

import { getPlatilloTotalCost } from "@/app/actions/platillos-wizard-actions"

interface PlatilloData {
  id: number
  nombre: string
  descripcion: string
  instruccionespreparacion: string | null
  tiempopreparacion: string | null
  imgurl: string | null
  costototal: number | null
  costoadministrativo: number | null
}

interface IngredientePlatillo {
  id: number
  ingredienteid: number
  nombre: string
  cantidad: number
  ingredientecostoparcial: number
  unidad: string
  costounitario: number
}

interface RecetaPlatillo {
  id: number
  recetaid: number
  nombre: string
  recetacostoparcial: number
  cantidad: number
}

interface MenuAsociado {
  menuid: number
  nombre: string
  precioventa: number | null
  precioconiva: number | null
  margenutilidad: number | null
  restaurante: string
  hotel: string
}

export default function VerPlatilloPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platilloId = searchParams.get("getPlatilloId")
  const menuNombre = searchParams.get("getMenuNombre")

  const [activeTab, setActiveTab] = useState("informacion")
  const [platilloData, setPlatilloData] = useState<PlatilloData | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)
  const [menusAsociados, setMenusAsociados] = useState<MenuAsociado[]>([])
  const [loading, setLoading] = useState(true)

  const [ingredientesPlatillo, setIngredientesPlatillo] = useState<IngredientePlatillo[]>([])
  const [recetasPlatillo, setRecetasPlatillo] = useState<RecetaPlatillo[]>([])

  const [ingredientesLoaded, setIngredientesLoaded] = useState(false)
  const [costosLoaded, setCostosLoaded] = useState(false)

  const [totalCostoPlatillo, setTotalCostoPlatillo] = useState<number | null>(null)
  const [costoAdministrativoPlatillo, setCostoAdministrativoPlatillo] = useState<number | null>(null)
  const [precioSugeridoPlatillo, setPrecioSugeridoPlatillo] = useState<number | null>(null)

  const [precioVenta, setPrecioVenta] = useState<string>("")
  const [costoPorcentual, setCostoPorcentual] = useState<string>("")
  const [precioConIVA, setPrecioConIVA] = useState<string>("")

  const formatCurrency = (amount: number | null) =>
    amount !== null && amount !== undefined ? `$${amount.toFixed(2)}` : "$0.00"

  /* ==================================================
    Data Loading
  ================================================== */

  useEffect(() => {
    const fetchPlatilloData = async () => {
      if (!platilloId) {
        toast.error("ID de receta no proporcionado.")
        setLoading(false)
        router.push("/platillos")
        return
      }

      try {
        const { data, error } = await supabase
          .from("platillos")
          .select(
            "id, nombre, descripcion, instruccionespreparacion, tiempopreparacion, imgurl, costototal, costoadministrativo",
          )
          .eq("id", platilloId)
          .single()

        if (error) {
          console.error("Error al cargar datos de la receta:", error)
          toast.error("Error al cargar datos de la receta.")
          router.push("/platillos")
          return
        }

        if (data) {
          setPlatilloData(data)
        }

        if (menuNombre) {
          const { data: menuData, error: menuError } = await supabase
            .from("menus")
            .select("id")
            .eq("nombre", menuNombre)
            .single()

          if (menuError) {
            console.error("Error al obtener menuId por nombre:", menuError)
          } else if (menuData) {
            setMenuId(menuData.id)
          }
        } else {
          const { data: platilloMenuData, error: platilloMenuError } = await supabase
            .from("platillosxmenu")
            .select(`menuid, menus!inner(id, nombre)`)
            .eq("platilloid", platilloId)
            .limit(1)
            .single()

          if (!platilloMenuError && platilloMenuData) {
            setMenuId(platilloMenuData.menuid)
          }
        }

        const { data: menusData, error: menusError } = await supabase
          .from("platillosxmenu")
          .select(`
            menuid, precioventa, precioconiva, margenutilidad,
            menus!inner(
              nombre,
              restaurantes!inner(
                nombre,
                hoteles!inner(nombre)
              )
            )
          `)
          .eq("platilloid", platilloId)

        if (!menusError && menusData) {
          setMenusAsociados(
            menusData.map((m: any) => ({
              menuid: m.menuid,
              nombre: m.menus.nombre,
              precioventa: m.precioventa,
              precioconiva: m.precioconiva,
              margenutilidad: m.margenutilidad,
              restaurante: m.menus.restaurantes.nombre,
              hotel: m.menus.restaurantes.hoteles.nombre,
            })),
          )
        }
      } catch (error) {
        console.error("Error inesperado al cargar receta:", error)
        toast.error("Error inesperado al cargar receta.")
        router.push("/platillos")
      } finally {
        setLoading(false)
      }
    }

    fetchPlatilloData()
  }, [platilloId, menuNombre, router])

  const loadIngredientesData = useCallback(async () => {
    if (!platilloId || ingredientesLoaded) return

    try {
      const { data: existingIngredientes, error: ingError } = await supabase
        .from("ingredientesxplatillo")
        .select(`
          id, cantidad, ingredientecostoparcial,
          ingredientes(id, nombre, tipounidadmedida(descripcion), codigo, costo)
        `)
        .eq("platilloid", platilloId)

      if (!ingError) {
        setIngredientesPlatillo(
          (existingIngredientes || []).map((item: any) => ({
            id: item.id,
            ingredienteid: item.ingredientes.id,
            nombre: item.ingredientes.nombre,
            cantidad: item.cantidad,
            ingredientecostoparcial: item.ingredientecostoparcial,
            unidad: item.ingredientes?.tipounidadmedida?.descripcion,
            costounitario: item.ingredientes?.costo || 0,
          })),
        )
      }

      const { data: existingRecetas, error: recError } = await supabase
        .from("recetasxplatillo")
        .select(`id, recetacostoparcial, cantidad, recetas(id, nombre)`)
        .eq("platilloid", platilloId)

      if (!recError) {
        setRecetasPlatillo(
          (existingRecetas || []).map((item: any) => ({
            id: item.id,
            recetaid: item.recetas.id,
            nombre: item.recetas.nombre,
            recetacostoparcial: item.recetacostoparcial,
            cantidad: item.cantidad,
          })),
        )
      }

      setIngredientesLoaded(true)
    } catch (error) {
      console.error("Error al cargar ingredientes/subrecetas:", error)
    }
  }, [platilloId, ingredientesLoaded])

  const loadCostosData = useCallback(async () => {
    if (!platilloId || costosLoaded) return

    try {
      const { totalCost, costoAdministrativo, precioSugerido } = await getPlatilloTotalCost(Number(platilloId))
      setTotalCostoPlatillo(totalCost)
      setCostoAdministrativoPlatillo(costoAdministrativo)
      setPrecioSugeridoPlatillo(precioSugerido)

      const { data: platilloMenuData, error: platilloMenuError } = await supabase
        .from("platillosxmenu")
        .select("precioventa, precioconiva")
        .eq("platilloid", platilloId)
        .eq("menuid", menuId)
        .limit(1)
        .single()

      if (!platilloMenuError && platilloMenuData) {
        if (platilloMenuData.precioventa) {
          const Costoporcentual = (costoAdministrativo / platilloMenuData.precioventa) * 100
          setCostoPorcentual(Costoporcentual.toFixed(2))
          setPrecioVenta(platilloMenuData.precioventa.toString())
          const precioConIVACalculado = platilloMenuData.precioventa * 0.16 + platilloMenuData.precioventa
          setPrecioConIVA(precioConIVACalculado.toFixed(2))
        }
        if (platilloMenuData.precioconiva) {
          setPrecioConIVA(platilloMenuData.precioconiva.toString())
        }
      }

      setCostosLoaded(true)
    } catch (error) {
      console.error("Error al cargar costos:", error)
    }
  }, [platilloId, menuId, costosLoaded])

  useEffect(() => {
    if (activeTab === "ingredientes" || activeTab === "subrecetas") {
      loadIngredientesData()
    } else if (activeTab === "costos") {
      loadIngredientesData()
      loadCostosData()
    }
  }, [activeTab, loadIngredientesData, loadCostosData])

  /* ==================================================
    Render
  ================================================== */

  if (loading && !platilloData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <img
          src="https://nxtrsibnomdqmzcrwedc.supabase.co/storage/v1/object/public/imagenes/AnimationGif/CargarPage.gif"
          alt="Cargando..."
          className="w-40 h-40 object-contain"
        />
      </div>
    )
  }

  if (!platilloData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Receta no encontrada.</h1>
        <Button onClick={() => router.push("/platillos")} className="mt-4">
          Regresar
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalle de Receta</h1>
          <p className="text-muted-foreground">Visualizacion completa de la receta</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/platillos")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar
        </Button>
      </div>

      {/* ===== TOP SECTION: Image + Info Panel ===== */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left: Image */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 md:w-40 md:h-40 border rounded-lg overflow-hidden bg-gray-50">
                {platilloData.imgurl ? (
                  <Image
                    src={platilloData.imgurl}
                    alt={platilloData.nombre || "Imagen del platillo"}
                    layout="fill"
                    objectFit="cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Sin imagen
                  </div>
                )}
              </div>
            </div>

            {/* Right: Info columns */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1">
              {/* Column 1: Informacion Basica */}
              <div>
                <h3 className="text-sm font-semibold text-blue-700 mb-1">Informacion Basica</h3>
                <div className="space-y-0.5 text-xs">
                  <p><span className="font-semibold text-blue-700">ID:</span> {platilloData.id}</p>
                  <p><span className="font-semibold text-blue-700">Nombre:</span> {platilloData.nombre}</p>
                  <p><span className="font-semibold text-blue-700">Descripcion:</span> {platilloData.descripcion}</p>
                  {platilloData.instruccionespreparacion && (
                    <p><span className="font-semibold text-blue-700">Instrucciones:</span> {platilloData.instruccionespreparacion}</p>
                  )}
                  {platilloData.tiempopreparacion && (
                    <p><span className="font-semibold text-blue-700">Tiempo Prep.:</span> {platilloData.tiempopreparacion}</p>
                  )}
                  <p>
                    <span className="font-semibold text-blue-700">Estatus:</span>{" "}
                    <Badge variant="default" className="bg-green-600 text-white ml-1">Activo</Badge>
                  </p>
                </div>
              </div>

              {/* Column 2: Costos */}
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-1">Costos</h3>
                <div className="space-y-0.5 text-xs">
                  <p>
                    <span className="font-semibold text-orange-600">Costo Elaboracion:</span>{" "}
                    {formatCurrency(platilloData.costototal)}
                  </p>
                  <p>
                    <span className="font-semibold text-orange-600">Costo Total:</span>{" "}
                    <span className="font-bold">{formatCurrency(platilloData.costoadministrativo)}</span>
                  </p>
                  {menusAsociados.length > 0 && menusAsociados[0].precioventa && (
                    <>
                      <p>
                        <span className="font-semibold text-orange-600">Precio Venta:</span>{" "}
                        {formatCurrency(menusAsociados[0].precioventa)}
                      </p>
                      <p>
                        <span className="font-semibold text-orange-600">Precio con IVA:</span>{" "}
                        {formatCurrency(menusAsociados[0].precioconiva)}
                      </p>
                      <p>
                        <span className="font-semibold text-orange-600">Utilidad:</span>{" "}
                        {formatCurrency(
                          (menusAsociados[0].precioventa || 0) - (platilloData.costoadministrativo || 0),
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Column 3: Menus Asociados */}
              <div>
                <h3 className="text-sm font-semibold text-purple-700 mb-1">Menus Asociados</h3>
                <div className="space-y-1 text-xs">
                  {menusAsociados.length > 0 ? (
                    menusAsociados.map((menu) => (
                      <div key={menu.menuid} className="flex items-center gap-2">
                        {menu.menuid === menuId && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0"></span>}
                        <Badge variant="outline" className="text-xs">{menu.nombre}</Badge>
                        {menu.precioventa && (
                          <span className="text-muted-foreground">{formatCurrency(menu.precioventa)}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Sin menus asociados</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== BOTTOM SECTION: Tabs ===== */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
          <TabsTrigger
            value="informacion"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-6 py-3"
          >
            Informacion Basica
          </TabsTrigger>
          <TabsTrigger
            value="menus"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-6 py-3"
          >
            Menus Asociados
          </TabsTrigger>
          <TabsTrigger
            value="costos"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-6 py-3"
          >
            Elaboracion Receta
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB: Informacion Basica ===== */}
        <TabsContent value="informacion">
          <Card>
            <CardHeader>
              <CardTitle>Informacion Basica</CardTitle>
              <CardDescription>Detalles principales de la receta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre de la Receta</p>
                  <p className="text-sm mt-1">{platilloData.nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Descripcion</p>
                  <p className="text-sm mt-1">{platilloData.descripcion}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Instrucciones de Elaboracion</p>
                  <p className="text-sm mt-1">{platilloData.instruccionespreparacion || "Sin instrucciones"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tiempo de Preparacion</p>
                  <p className="text-sm mt-1">{platilloData.tiempopreparacion || "No especificado"}</p>
                </div>
              </div>
              {platilloData.imgurl && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Imagen</p>
                  <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                    <Image
                      src={platilloData.imgurl}
                      alt="Imagen del platillo"
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: Menus Asociados ===== */}
        <TabsContent value="menus">
          <Card>
            <CardHeader>
              <CardTitle>Menus Asociados</CardTitle>
              <CardDescription>Todos los menus en los que se encuentra esta receta.</CardDescription>
            </CardHeader>
            <CardContent>
              {menusAsociados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {menusAsociados.map((menu) => {
                    const costoAdmin = platilloData.costoadministrativo || 0
                    const costoPorcentual = menu.precioventa ? ((costoAdmin / menu.precioventa) * 100).toFixed(2) : "0.00"
                    const esRentable = Number(costoPorcentual) <= 30

                    return (
                      <div
                        key={menu.menuid}
                        className={`rounded-lg border p-4 space-y-3 ${menu.menuid === menuId ? "border-orange-400 bg-orange-50/30" : "bg-white"}`}
                      >
                        {/* Header del menu */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{menu.nombre}</h4>
                            <p className="text-xs text-gray-500">{menu.hotel} - {menu.restaurante}</p>
                          </div>
                          {menu.menuid === menuId && (
                            <Badge className="bg-orange-500 text-white text-[10px]">Actual</Badge>
                          )}
                        </div>

                        {/* Datos de precios */}
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Costo Total</span>
                            <span className="font-semibold">{formatCurrency(costoAdmin)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Precio Venta</span>
                            <span className="font-semibold">{formatCurrency(menu.precioventa)} <span className="text-gray-400 font-normal">/ con IVA:</span> {formatCurrency(menu.precioconiva)}</span>
                          </div>
                        </div>

                        {/* Costo % y Margen Utilidad */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div className={`flex justify-between rounded-md px-3 py-1.5 ${esRentable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            <span>Costo %</span>
                            <span>{costoPorcentual}%</span>
                          </div>
                          <div className="flex justify-between rounded-md px-3 py-1.5 bg-blue-100 text-blue-700">
                            <span>Margen</span>
                            <span>{menu.precioventa ? (((menu.precioventa - costoAdmin) / menu.precioventa) * 100).toFixed(2) : "0.00"}%</span>
                          </div>
                        </div>

                        <div className="flex justify-center pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => router.push(`/menus/${menu.menuid}/agregar?buscar=${encodeURIComponent(platilloData.nombre)}`)}
                          >
                            Ver menu
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Esta receta no esta asociada a ningun menu.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: Resumen de Precio ===== */}
        <TabsContent value="costos">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Precio</CardTitle>
              <CardDescription>Costos y precio de venta de la receta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!costosLoaded ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Cargando costos...</span>
                </div>
              ) : (
                <>
                  {/* Elaboracion de la Receta */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Elaboracion de la Receta</h3>
                    {(ingredientesPlatillo.length > 0 || recetasPlatillo.length > 0) ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead className="text-right">Costo</TableHead>
                              <TableHead className="text-center">Unidad de Medida</TableHead>
                              <TableHead className="text-center text-green-600 border-l-2 border-gray-300">Cantidad</TableHead>
                              <TableHead className="text-right text-green-600">Costo Parcial</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ingredientesPlatillo.map((ing) => (
                              <TableRow key={`ing-${ing.id}`}>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">Ingrediente</Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{ing.nombre}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{formatCurrency(ing.costounitario)}</TableCell>
                                <TableCell className="text-center whitespace-nowrap">{ing.unidad || "N/A"}</TableCell>
                                <TableCell className="text-center text-green-600 border-l-2 border-gray-300">{ing.cantidad}</TableCell>
                                <TableCell className="text-right text-green-600 whitespace-nowrap">{formatCurrency(ing.ingredientecostoparcial)}</TableCell>
                              </TableRow>
                            ))}
                            {recetasPlatillo.map((rec) => (
                              <TableRow key={`rec-${rec.id}`}>
                                <TableCell>
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 whitespace-nowrap">Sub-Receta</Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{rec.nombre}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{formatCurrency(rec.recetacostoparcial / (rec.cantidad || 1))}</TableCell>
                                <TableCell className="text-center whitespace-nowrap">N/A</TableCell>
                                <TableCell className="text-center text-green-600 border-l-2 border-gray-300">{rec.cantidad}</TableCell>
                                <TableCell className="text-right text-green-600 whitespace-nowrap">{formatCurrency(rec.recetacostoparcial)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="border-t-2 border-blue-500 px-4 py-2 flex justify-end">
                          <span className="text-sm font-semibold text-gray-700">Total Costo Parcial:{" "}
                            <span className="text-base font-bold text-orange-600">
                              {formatCurrency(
                                ingredientesPlatillo.reduce((sum, ing) => sum + (ing.ingredientecostoparcial || 0), 0) +
                                recetasPlatillo.reduce((sum, rec) => sum + (rec.recetacostoparcial || 0), 0)
                              )}
                            </span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No hay ingredientes ni sub-recetas agregados.</p>
                    )}
                  </div>

                  {/* Cost summary + Price */}
                  <div className="flex flex-col items-end gap-4 mt-2">
                    {/* Desglose de Costos */}
                    <div className="w-full md:w-[480px] rounded-lg border bg-white p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Desglose de Costos</h3>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Costo de Elaboracion</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(totalCostoPlatillo)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Variacion de Precios</span>
                        <span className="font-semibold text-gray-800">5%</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t-2 border-[#58e0be]">
                        <span className="text-sm font-bold text-gray-900">Costo Total</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(costoAdministrativoPlatillo)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-yellow-600 font-medium">* Precio Minimo Sugerido</span>
                        <span className="font-semibold text-yellow-600">{formatCurrency(precioSugeridoPlatillo)}</span>
                      </div>
                    </div>

                    {/* Precio de Venta */}
                    <div className="w-full md:w-[480px] rounded-lg border bg-gray-50 px-4 py-3">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Precio de Venta</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[11px] text-gray-500">Precio Venta</p>
                          <p className="text-sm font-semibold mt-1">{precioVenta ? formatCurrency(Number(precioVenta)) : "$0.00"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500">Precio con IVA</p>
                          <p className="text-sm font-semibold mt-1">{precioConIVA ? formatCurrency(Number(precioConIVA)) : "$0.00"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500">Costo %</p>
                          <p className={`text-sm font-semibold mt-1 ${
                            costoPorcentual && Number(costoPorcentual) > 30.0
                              ? "text-red-700"
                              : "text-green-700"
                          }`}>{costoPorcentual ? `${costoPorcentual}%` : "0.00%"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        <Button
          type="button"
          onClick={() => router.push(`/platillos/editar?getPlatilloId=${platilloData.id}&getMenuNombre=${menuNombre || ""}`)}
          className="bg-green-800 hover:bg-green-900 text-white"
        >
          Editar
        </Button>
      </div>
    </div>
  )
}
