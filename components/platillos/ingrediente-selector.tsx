"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { Plus, Search, X, ShoppingCart, Trash2, Edit2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type IngredienteSelectorProps = {
  onAddIngrediente: (ingrediente: any, cantidad: number) => void
  buttonText?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
}

export interface IngredientePlatillo {
  id?: string
  platillo_id?: string
  ingrediente_id: string
  cantidad: number
  costo_parcial: number
  ingrediente?: any
}

export interface IngredienteSeleccionado {
  id: string
  clave: string
  descripcion: string
  unidad_medida: string
  precio_actual: number
  cantidad: number
  categoria?: { nombre: string } | null
  tipo_ingrediente?: string | null
  unidad_seleccionada?: string
  precio_por_unidad_seleccionada?: number
}

// Función para obtener unidades compatibles
const getUnidadesCompatibles = (unidadBase: string): string[] => {
  const unidadNormalizada = unidadBase.toLowerCase()

  if (unidadNormalizada.includes("kilo") || unidadNormalizada.includes("kg")) {
    return ["Kilo", "Gramo"]
  }
  if (unidadNormalizada.includes("litro") || unidadNormalizada.includes("lt")) {
    return ["Litro", "Mililitro"]
  }
  if (unidadNormalizada.includes("pieza") || unidadNormalizada.includes("pza")) {
    return ["Pieza", "Docena"]
  }

  return [unidadBase]
}

// Función para calcular el precio según la unidad seleccionada
// IMPORTANTE: El precio en la BD ya está en la unidad más pequeña (gramos, mililitros, pieza)
const calcularPrecioPorUnidad = (precioBase: number, unidadBase: string, unidadSeleccionada: string): number => {
  const unidadBaseNorm = unidadBase.toLowerCase()
  const unidadSelNorm = unidadSeleccionada.toLowerCase()

  // Si es la misma unidad, devolver el precio base
  if (unidadBaseNorm === unidadSelNorm) {
    return precioBase
  }

  // Para KILOS: el precio base ya está en gramos
  if (unidadBaseNorm.includes("kilo") || unidadBaseNorm.includes("kg")) {
    if (unidadSelNorm === "gramo") {
      return precioBase // Ya está en gramos
    }
    if (unidadSelNorm === "kilo") {
      return precioBase * 1000 // Convertir de gramos a kilos
    }
  }

  // Para LITROS: el precio base ya está en mililitros
  if (unidadBaseNorm.includes("litro") || unidadBaseNorm.includes("lt")) {
    if (unidadSelNorm === "mililitro") {
      return precioBase // Ya está en mililitros
    }
    if (unidadSelNorm === "litro") {
      return precioBase * 1000 // Convertir de mililitros a litros
    }
  }

  // Para PIEZAS
  if (unidadBaseNorm.includes("pieza") || unidadBaseNorm.includes("pza")) {
    if (unidadSelNorm === "pieza") {
      return precioBase // Ya está en piezas
    }
    if (unidadSelNorm === "docena") {
      return precioBase * 12 // Precio por docena
    }
  }

  return precioBase
}

export function IngredienteSelector({
  onAddIngrediente,
  buttonText = "Agregar Ingrediente",
  buttonVariant = "default",
  className,
}: IngredienteSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [allIngredientes, setAllIngredientes] = useState<any[]>([])
  const [filteredIngredientes, setFilteredIngredientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("buscar")
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState<IngredienteSeleccionado[]>([])
  const [editingIngrediente, setEditingIngrediente] = useState<IngredienteSeleccionado | null>(null)
  const { toast } = useToast()

  // Cargar todos los ingredientes al abrir el modal
  useEffect(() => {
    if (open) {
      fetchAllIngredientes()
    } else {
      // Limpiar cuando se cierra el modal
      setSearchTerm("")
      setIngredientesSeleccionados([])
      setEditingIngrediente(null)
    }
  }, [open])

  // Filtrar ingredientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = allIngredientes.filter(
        (ing) =>
          ing.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ing.clave && ing.clave.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredIngredientes(filtered)
    } else {
      setFilteredIngredientes(allIngredientes)
    }
  }, [searchTerm, allIngredientes])

  const fetchAllIngredientes = async () => {
    try {
      setLoading(true)

      // Obtener todos los ingredientes sin filtrar por status
      const { data, error } = await supabase
        .from("ingredientes")
        .select(`
          id,
          clave,
          descripcion,
          unidad_medida,
          status,
          tipo_ingrediente,
          categoria:categorias(nombre)
        `)
        .order("descripcion")

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        setAllIngredientes([])
        setFilteredIngredientes([])
        setLoading(false)
        return
      }

      // Obtener precios actuales para cada ingrediente
      const ingredientesConPrecios = await Promise.all(
        data.map(async (item) => {
          try {
            const { data: precioData, error: precioError } = await supabase
              .from("precios_unitarios")
              .select("precio")
              .eq("ingrediente_id", item.id)
              .is("fecha_fin", null)
              .order("fecha_inicio", { ascending: false })
              .limit(1)

            const precio = precioData && precioData.length > 0 ? precioData[0].precio : 0
            return {
              ...item,
              precio_actual: precio,
            }
          } catch (err: any) {
            return {
              ...item,
              precio_actual: 0,
            }
          }
        }),
      )

      setAllIngredientes(ingredientesConPrecios)
      setFilteredIngredientes(ingredientesConPrecios)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los ingredientes. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
      setAllIngredientes([])
      setFilteredIngredientes([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectIngrediente = (ingrediente: any) => {
    // Verificar si ya está en la lista
    const existe = ingredientesSeleccionados.some((item) => item.id === ingrediente.id)
    if (existe) {
      toast({
        title: "Ingrediente ya seleccionado",
        description: "Este ingrediente ya está en tu lista",
        variant: "default",
      })
      return
    }

    // Calcular el precio según la unidad base
    const unidadNorm = ingrediente.unidad_medida.toLowerCase()
    let unidadSeleccionada = ingrediente.unidad_medida
    let precioPorUnidad = ingrediente.precio_actual

    // Si es kilo, mostrar precio por kilo (multiplicar por 1000)
    if (unidadNorm.includes("kilo") || unidadNorm.includes("kg")) {
      unidadSeleccionada = "Kilo"
      precioPorUnidad = ingrediente.precio_actual * 1000
    }
    // Si es litro, mostrar precio por litro (multiplicar por 1000)
    else if (unidadNorm.includes("litro") || unidadNorm.includes("lt")) {
      unidadSeleccionada = "Litro"
      precioPorUnidad = ingrediente.precio_actual * 1000
    }

    // Agregar a la lista con cantidad 1 por defecto
    setIngredientesSeleccionados([
      ...ingredientesSeleccionados,
      {
        id: ingrediente.id,
        clave: ingrediente.clave,
        descripcion: ingrediente.descripcion,
        unidad_medida: ingrediente.unidad_medida,
        unidad_seleccionada: unidadSeleccionada,
        precio_actual: ingrediente.precio_actual,
        precio_por_unidad_seleccionada: precioPorUnidad,
        cantidad: 1,
        categoria: ingrediente.categoria,
        tipo_ingrediente: ingrediente.tipo_ingrediente,
      },
    ])

    toast({
      title: "Ingrediente agregado",
      description: `${ingrediente.descripcion} agregado a la lista`,
      variant: "default",
    })
  }

  const handleRemoveIngrediente = (id: string) => {
    setIngredientesSeleccionados(ingredientesSeleccionados.filter((item) => item.id !== id))
  }

  const handleEditIngrediente = (ingrediente: IngredienteSeleccionado) => {
    setEditingIngrediente(ingrediente)
  }

  const handleUpdateCantidad = (id: string, cantidad: number) => {
    if (cantidad <= 0) return

    setIngredientesSeleccionados(
      ingredientesSeleccionados.map((item) => (item.id === id ? { ...item, cantidad } : item)),
    )

    // Si estamos editando este ingrediente, actualizar también el estado de edición
    if (editingIngrediente && editingIngrediente.id === id) {
      setEditingIngrediente({ ...editingIngrediente, cantidad })
    }
  }

  const handleUpdateUnidad = (id: string, nuevaUnidad: string) => {
    const ingrediente = ingredientesSeleccionados.find((item) => item.id === id)
    if (!ingrediente) return

    // Calcular el nuevo precio basado en la unidad seleccionada
    const nuevoPrecio = calcularPrecioPorUnidad(ingrediente.precio_actual, ingrediente.unidad_medida, nuevaUnidad)

    setIngredientesSeleccionados(
      ingredientesSeleccionados.map((item) =>
        item.id === id
          ? {
              ...item,
              unidad_seleccionada: nuevaUnidad,
              precio_por_unidad_seleccionada: nuevoPrecio,
            }
          : item,
      ),
    )

    // Si estamos editando este ingrediente, actualizar también el estado de edición
    if (editingIngrediente && editingIngrediente.id === id) {
      setEditingIngrediente({
        ...editingIngrediente,
        unidad_seleccionada: nuevaUnidad,
        precio_por_unidad_seleccionada: nuevoPrecio,
      })
    }
  }

  const handleFinishEditing = () => {
    setEditingIngrediente(null)
  }

  const handleAddAllIngredientes = () => {
    if (ingredientesSeleccionados.length === 0) {
      toast({
        title: "No hay ingredientes",
        description: "Agrega al menos un ingrediente a la lista",
        variant: "destructive",
      })
      return
    }

    console.log("Agregando todos los ingredientes:", ingredientesSeleccionados.length)

    // Agregar cada ingrediente al platillo
    for (const item of ingredientesSeleccionados) {
      console.log("Agregando ingrediente:", item.descripcion)

      const ingrediente = {
        id: item.id,
        clave: item.clave,
        descripcion: item.descripcion,
        unidad_medida: item.unidad_medida,
        unidad_seleccionada: item.unidad_seleccionada || item.unidad_medida,
        precio_actual: item.precio_actual,
        precio_por_unidad_seleccionada: item.precio_por_unidad_seleccionada || item.precio_actual,
        categoria: item.categoria,
        tipo_ingrediente: item.tipo_ingrediente,
      }

      onAddIngrediente(ingrediente, item.cantidad)
    }

    toast({
      title: "Ingredientes agregados",
      description: `Se agregaron ${ingredientesSeleccionados.length} ingredientes al platillo`,
      variant: "default",
    })

    setOpen(false)
    setIngredientesSeleccionados([])
    setEditingIngrediente(null)
    setSearchTerm("")
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setFilteredIngredientes(allIngredientes)
  }

  // Calcular el costo total de los ingredientes seleccionados
  const calcularCostoTotal = () => {
    return ingredientesSeleccionados.reduce((total, item) => {
      const precioAplicar = item.precio_por_unidad_seleccionada || item.precio_actual
      return total + precioAplicar * item.cantidad
    }, 0)
  }

  // Obtener el precio efectivo según la unidad seleccionada
  const getPrecioEfectivo = (item: IngredienteSeleccionado) => {
    return item.precio_por_unidad_seleccionada || item.precio_actual
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={className}>
          <Plus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Agregar Ingredientes
            {ingredientesSeleccionados.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {ingredientesSeleccionados.length} seleccionados
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Sección superior: Ingredientes seleccionados - altura fija */}
          {ingredientesSeleccionados.length > 0 && (
            <Card className="border-dashed shrink-0">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">Ingredientes seleccionados</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Total: {formatCurrency(calcularCostoTotal())}</span>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAddAllIngredientes}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Agregar todos al platillo
                    </Button>
                  </div>
                </div>

                {/* Lista de ingredientes seleccionados con altura máxima */}
                <div className="border rounded-md">
                  <ScrollArea className="h-[150px]">
                    <div className="p-2 space-y-2">
                      {ingredientesSeleccionados.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-md",
                            editingIngrediente?.id === item.id ? "bg-muted" : "bg-card hover:bg-muted/50",
                            "border",
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.descripcion}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.clave}
                              {item.categoria && ` • ${item.categoria.nombre}`}
                              {item.tipo_ingrediente && ` • ${item.tipo_ingrediente}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingIngrediente?.id === item.id ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={editingIngrediente.cantidad}
                                    onChange={(e) =>
                                      handleUpdateCantidad(item.id, Number.parseFloat(e.target.value) || 0)
                                    }
                                    className="w-20 h-8"
                                  />
                                  <Select
                                    value={editingIngrediente.unidad_seleccionada || editingIngrediente.unidad_medida}
                                    onValueChange={(value) => handleUpdateUnidad(item.id, value)}
                                  >
                                    <SelectTrigger className="w-[100px] h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getUnidadesCompatibles(item.unidad_medida).map((unidad) => (
                                        <SelectItem key={unidad} value={unidad}>
                                          {unidad}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <span className="text-sm text-muted-foreground">
                                    {formatCurrency(getPrecioEfectivo(editingIngrediente))} /{" "}
                                    {editingIngrediente.unidad_seleccionada || editingIngrediente.unidad_medida}
                                  </span>
                                  <Button size="sm" variant="outline" onClick={handleFinishEditing}>
                                    Listo
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-sm">
                                  {item.cantidad} {item.unidad_seleccionada || item.unidad_medida}
                                </span>
                                <span className="text-sm font-medium">
                                  {formatCurrency(getPrecioEfectivo(item) * item.cantidad)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditIngrediente(item)}
                                  className="h-8 w-8"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveIngrediente(item.id)}
                                  className="h-8 w-8 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección inferior: Búsqueda de ingredientes - ocupa el resto del espacio */}
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-4 flex flex-col h-full">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="buscar">Buscar Ingrediente</TabsTrigger>
                  <TabsTrigger value="crear">Crear Nuevo Ingrediente</TabsTrigger>
                </TabsList>

                <TabsContent value="buscar" className="flex-1 flex flex-col overflow-hidden mt-0">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar ingrediente por nombre o clave..."
                        className="pl-8 pr-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={handleClearSearch}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-4">Cargando ingredientes...</div>
                  ) : filteredIngredientes.length > 0 ? (
                    <div className="border rounded-md flex-1 overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="sticky top-0 bg-background">Clave</TableHead>
                              <TableHead className="sticky top-0 bg-background">Descripción</TableHead>
                              <TableHead className="sticky top-0 bg-background">Unidad</TableHead>
                              <TableHead className="sticky top-0 bg-background">Precio</TableHead>
                              <TableHead className="sticky top-0 bg-background"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredIngredientes.map((ingrediente) => {
                              // Mostrar el precio según la unidad base
                              const unidadNorm = ingrediente.unidad_medida.toLowerCase()
                              let precioMostrar = ingrediente.precio_actual
                              let unidadMostrar = ingrediente.unidad_medida

                              // Si es kilo, mostrar precio por kilo (multiplicar por 1000)
                              if (unidadNorm.includes("kilo") || unidadNorm.includes("kg")) {
                                precioMostrar = ingrediente.precio_actual * 1000
                                unidadMostrar = "Kilo"
                              }
                              // Si es litro, mostrar precio por litro (multiplicar por 1000)
                              else if (unidadNorm.includes("litro") || unidadNorm.includes("lt")) {
                                precioMostrar = ingrediente.precio_actual * 1000
                                unidadMostrar = "Litro"
                              }

                              return (
                                <TableRow key={ingrediente.id}>
                                  <TableCell className="font-mono text-sm">{ingrediente.clave || "-"}</TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{ingrediente.descripcion}</p>
                                      {ingrediente.categoria && (
                                        <p className="text-xs text-muted-foreground">
                                          {ingrediente.categoria.nombre}
                                          {ingrediente.tipo_ingrediente && ` • ${ingrediente.tipo_ingrediente}`}
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>{unidadMostrar}</TableCell>
                                  <TableCell>{formatCurrency(precioMostrar)}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => handleSelectIngrediente(ingrediente)}
                                    >
                                      Seleccionar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  ) : searchTerm ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No se encontraron ingredientes que coincidan con "{searchTerm}"
                    </div>
                  ) : allIngredientes.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No hay ingredientes disponibles en la base de datos.</p>
                      <p className="text-sm mt-2">Por favor, importa o crea ingredientes primero.</p>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">Cargando ingredientes...</div>
                  )}
                </TabsContent>

                <TabsContent value="crear" className="space-y-4 pt-4">
                  <div className="text-center py-8">
                    <p>Función para crear nuevos ingredientes en desarrollo.</p>
                    <p className="text-muted-foreground mt-2">
                      Por favor, utiliza la sección de{" "}
                      <a href="/ingredientes" className="text-primary underline">
                        Ingredientes
                      </a>{" "}
                      para crear nuevos ingredientes.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
