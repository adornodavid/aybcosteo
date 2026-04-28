"use client"

/* ==================================================
  Imports
================================================== */
import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, ArrowLeft, PlusCircle, Trash2, XCircle, HelpCircle, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

import { deleteImage } from "@/app/actions/recetas-image-actions"
import {
  getPlatilloTotalCost,
  searchIngredientes as searchPlatilloIngredientes,
  getRecetas as getRecetasForDropdown,
  getUnidadesMedidaByIngrediente,
} from "@/app/actions/platillos-wizard-actions"
import { Label } from "@/components/ui/label"

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
  costoUnitarioEfectivo: number
}

interface RecetaPlatillo {
  id: number
  recetaid: number
  nombre: string
  recetacostoparcial: number
  cantidad: number
  costoUnitarioEfectivo: number
}

interface DropdownItem {
  id: number
  nombre: string
  codigo: string
  costo: number | null
}

interface RecetaDropdownItem {
  id: number
  nombre: string
  costo: number | null
  cantidad: number | null
  tipounidadmedida: {
    descripcion: string
  } | null
}

interface UnidadMedidaItem {
  id: number
  descripcion: string
  calculoconversion: number
}

interface MenuAsociado {
  menuid: number
  nombre: string
  precioventa: number | null
  precioconiva: number | null
}

export default function EditarPlatilloPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platilloId = searchParams.get("getPlatilloId")
  const menuNombre = searchParams.get("getMenuNombre")

  const [activeTab, setActiveTab] = useState("informacion")
  const [platilloData, setPlatilloData] = useState<PlatilloData | null>(null)
  const [savedPlatilloData, setSavedPlatilloData] = useState<PlatilloData | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)
  const [menusAsociados, setMenusAsociados] = useState<MenuAsociado[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  // Estados para AlertDialog de errores
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Estado para modal de éxito
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // Modal de aviso: precio se propaga a multiples menús
  const [showMultiMenuDialog, setShowMultiMenuDialog] = useState(false)
  const [multiMenuCount, setMultiMenuCount] = useState(0)

  // Estados para manejo de imagen
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)

  const [ingredientesPlatillo, setIngredientesPlatillo] = useState<IngredientePlatillo[]>([])
  const [ingredientesDropdown, setIngredientesDropdown] = useState<DropdownItem[]>([])
  const [unidadesMedidaDropdown, setUnidadesMedidaDropdown] = useState<UnidadMedidaItem[]>([])

  const [ingredienteSearchTerm, setIngredienteSearchTerm] = useState("")
  const [filteredIngredientes, setFilteredIngredientes] = useState<DropdownItem[]>([])
  const [showIngredienteDropdown, setShowIngredienteDropdown] = useState(false)

  const [selectedIngredienteId, setSelectedIngredienteId] = useState<string>("")
  const [cantidadIngrediente, setCantidadIngrediente] = useState<string>("")
  const [selectedUnidadMedidaId, setSelectedUnidadMedidaId] = useState<string>("")
  const [costoIngrediente, setCostoIngrediente] = useState<string>("")
  const [showConfirmDeleteIngrediente, setShowConfirmDeleteIngrediente] = useState(false)
  const [ingredienteToDelete, setIngredienteToDelete] = useState<number | null>(null)
  const [showIngredienteExistsDialog, setShowIngredienteExistsDialog] = useState(false)

  const [recetasPlatillo, setRecetasPlatillo] = useState<RecetaPlatillo[]>([])
  const [recetasDropdown, setRecetasDropdown] = useState<RecetaDropdownItem[]>([])
  const [selectedRecetaId, setSelectedRecetaId] = useState<string>("")
  const [costoReceta, setCostoReceta] = useState<string>("")
  const [selectedRecetaCantidad, setSelectedRecetaCantidad] = useState("1")
  const [selectedRecetaCant, setSelectedRecetaCant] = useState("1")
  const [selectedRecetaUnidadBase, setSelectedRecetaUnidadBase] = useState("")
  const [maxRangeReceta, setMaxRangeReceta] = useState(1)
  const [showConfirmDeleteReceta, setShowConfirmDeleteReceta] = useState(false)
  const [recetaToDelete, setRecetaToDelete] = useState<number | null>(null)
  const [showRecetaExistsDialog, setShowRecetaExistsDialog] = useState(false)

  const [totalCostoPlatillo, setTotalCostoPlatillo] = useState<number | null>(null)
  const [costoAdministrativoPlatillo, setCostoAdministrativoPlatillo] = useState<number | null>(null)
  const [precioSugeridoPlatillo, setPrecioSugeridoPlatillo] = useState<number | null>(null)

  const [precioVenta, setPrecioVenta] = useState<string>("")
  const [costoPorcentual, setCostoPorcentual] = useState<string>("")
  const [precioConIVA, setPrecioConIVA] = useState<string>("")

  // Track if tab data has been loaded
  const [ingredientesLoaded, setIngredientesLoaded] = useState(false)
  const [costosLoaded, setCostosLoaded] = useState(false)

  const formatCurrency = (amount: number | null) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount || 0)

  /* ==================================================
    Data Loading
  ================================================== */

  // Load platillo basic data on mount
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
          setSavedPlatilloData(data)
          setImageUrl(data.imgurl)
          setImagenPreview(data.imgurl)
        }

        if (menuNombre) {
          const { data: menuData, error: menuError } = await supabase
            .from("menus")
            .select("id")
            .eq("nombre", menuNombre)
            .single()

          if (menuError) {
            console.error("Error al obtener menuId por nombre:", menuError)
            toast.error("Error al obtener información del menú.")
          } else if (menuData) {
            setMenuId(menuData.id)
          }
        } else {
          const { data: platilloMenuData, error: platilloMenuError } = await supabase
            .from("platillosxmenu")
            .select(`
              menuid,
              menus!inner(id, nombre)
            `)
            .eq("platilloid", platilloId)
            .limit(1)
            .single()

          if (platilloMenuError) {
            console.error("Error al obtener menú asociado al platillo:", platilloMenuError)
          } else if (platilloMenuData) {
            setMenuId(platilloMenuData.menuid)
          }
        }

        // Load associated menus for the info panel
        const { data: menusData, error: menusError } = await supabase
          .from("platillosxmenu")
          .select(`
            menuid,
            precioventa,
            precioconiva,
            menus!inner(nombre)
          `)
          .eq("platilloid", platilloId)

        if (!menusError && menusData) {
          setMenusAsociados(
            menusData.map((m: any) => ({
              menuid: m.menuid,
              nombre: m.menus.nombre,
              precioventa: m.precioventa,
              precioconiva: m.precioconiva,
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

  // Load ingredientes/recetas data when tab is selected
  const loadIngredientesData = useCallback(async () => {
    if (!platilloId || ingredientesLoaded) return

    setLoading(true)
    try {
      const { data: hotelData, error: hotelError } = await supabase
        .from("platillosxmenu")
        .select(`
          menus!inner(
            restaurantes!inner(
              hoteles!inner(id)
            )
          )
        `)
        .eq("platilloid", platilloId)
        .limit(1)
        .single()

      let hotelIdForDropdowns: number | null = null
      if (hotelError) {
        console.error("Error al obtener HotelId para dropdowns:", hotelError)
        toast.error("Error al cargar datos de hotel para dropdowns.")
      } else if (hotelData) {
        hotelIdForDropdowns = hotelData.menus.restaurantes.hoteles.id
      }

      const { data: unidadesData, error: unidadesError } = await supabase
        .from("tipounidadmedida")
        .select("id, descripcion, calculoconversion")
        .order("descripcion")

      if (unidadesError) {
        console.error("Error al cargar unidades de medida dropdown:", unidadesError)
        toast.error("Error al cargar unidades de medida.")
      } else {
        setUnidadesMedidaDropdown(unidadesData || [])
      }

      if (hotelIdForDropdowns !== null) {
        const recetasData = await getRecetasForDropdown(hotelIdForDropdowns)
        setRecetasDropdown(recetasData)
      }

      const { data: existingIngredientes, error: ingXPlatilloError } = await supabase
        .from("ingredientesxplatillo")
        .select(`
          id, cantidad, ingredientecostoparcial,
          ingredientes(id, nombre, tipounidadmedida(descripcion), codigo, costo)
        `)
        .eq("platilloid", platilloId)

      if (ingXPlatilloError) {
        console.error("Error al cargar ingredientes de la receta:", ingXPlatilloError)
        toast.error("Error al cargar ingredientes de la receta.")
      } else {
        setIngredientesPlatillo(
          (existingIngredientes || []).map((item: any) => ({
            id: item.id,
            ingredienteid: item.ingredientes.id,
            nombre: item.ingredientes.nombre,
            cantidad: item.cantidad,
            ingredientecostoparcial: item.ingredientecostoparcial,
            unidad: item.ingredientes?.tipounidadmedida?.descripcion,
            costounitario: item.ingredientes?.costo || 0,
            costoUnitarioEfectivo:
              item.cantidad && item.cantidad > 0 ? item.ingredientecostoparcial / item.cantidad : 0,
          })),
        )
      }

      const { data: existingRecetas, error: recXPlatilloError } = await supabase
        .from("recetasxplatillo")
        .select(`
          id, recetacostoparcial, cantidad,
          recetas(id, nombre)
        `)
        .eq("platilloid", platilloId)

      if (recXPlatilloError) {
        console.error("Error al cargar sub-recetas de la receta:", recXPlatilloError)
        toast.error("Error al cargar sub-recetas de la receta.")
      } else {
        setRecetasPlatillo(
          (existingRecetas || []).map((item: any) => ({
            id: item.id,
            recetaid: item.recetas.id,
            nombre: item.recetas.nombre,
            recetacostoparcial: item.recetacostoparcial,
            cantidad: item.cantidad,
            costoUnitarioEfectivo:
              item.cantidad && item.cantidad > 0 ? item.recetacostoparcial / item.cantidad : 0,
          })),
        )
      }

      setIngredientesLoaded(true)
    } catch (error) {
      console.error("Error inesperado al cargar datos de ingredientes:", error)
      toast.error("Error inesperado al cargar datos de ingredientes.")
    } finally {
      setLoading(false)
    }
  }, [platilloId, ingredientesLoaded])

  // Load costos data when tab is selected
  const loadCostosData = useCallback(async () => {
    if (!platilloId || costosLoaded) return

    setLoading(true)
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
      toast.error("Error al cargar costos para el resumen.")
    } finally {
      setLoading(false)
    }
  }, [platilloId, menuId, costosLoaded])

  // Handle tab change - load data on demand
  useEffect(() => {
    if (activeTab === "ingredientes" || activeTab === "subrecetas") {
      loadIngredientesData()
    } else if (activeTab === "costos") {
      loadIngredientesData() // Need ingredientes for final save
      loadCostosData()
    }
  }, [activeTab, loadIngredientesData, loadCostosData])

  // Debounced ingredient search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (platilloId && ingredienteSearchTerm.length >= 2) {
        const { data: hotelData, error: hotelError } = await supabase
          .from("platillosxmenu")
          .select(`
            menus!inner(
              restaurantes!inner(
                hoteles!inner(id)
              )
            )
          `)
          .eq("platilloid", platilloId)
          .limit(1)
          .single()

        let hotelIdForSearch: number | null = null
        if (hotelError) {
          console.error("Error al obtener HotelId para búsqueda:", hotelError)
        } else if (hotelData) {
          hotelIdForSearch = hotelData.menus.restaurantes.hoteles.id
        }

        if (hotelIdForSearch !== null) {
          const results = await searchPlatilloIngredientes(hotelIdForSearch, ingredienteSearchTerm)
          setFilteredIngredientes(results)
        } else {
          setFilteredIngredientes([])
        }
      } else {
        setFilteredIngredientes([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [ingredienteSearchTerm, platilloId])

  useEffect(() => {
    if (selectedIngredienteId) {
      const selected =
        ingredientesDropdown.find((i) => i.id.toString() === selectedIngredienteId) ||
        filteredIngredientes.find((i) => i.id.toString() === selectedIngredienteId)
      if (selected) {
        setIngredienteSearchTerm(`${selected.codigo} - ${selected.nombre}`)
        setCostoIngrediente(selected.costo?.toString() || "0")
      }
    }
  }, [selectedIngredienteId, ingredientesDropdown, filteredIngredientes])

  useEffect(() => {
    if (!selectedRecetaId) {
      setMaxRangeReceta(1)
      setSelectedRecetaCantidad("1")
      setSelectedRecetaCant("1")
      setSelectedRecetaUnidadBase("")
      setCostoReceta("")
      return
    }
    const selectedReceta = recetasDropdown.find((r) => r.id.toString() === selectedRecetaId)
    if (selectedReceta) {
      const baseCantidad = selectedReceta.cantidad && selectedReceta.cantidad > 0 ? selectedReceta.cantidad : 1
      setMaxRangeReceta(baseCantidad)
      setSelectedRecetaCantidad("1")
      setSelectedRecetaCant("1")
      setSelectedRecetaUnidadBase(selectedReceta.tipounidadmedida?.descripcion || "N/A")
      setCostoReceta(selectedReceta.costo?.toString() || "0")
    }
  }, [selectedRecetaId, recetasDropdown])

  /* ==================================================
    Event Handlers
  ================================================== */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setPlatilloData((prev) => (prev ? { ...prev, [id]: value } : null))
  }

  const handlePrecioVentaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPrecioVenta(value)

    if (value && !isNaN(Number(value)) && costoAdministrativoPlatillo) {
      const precioVentaNum = Number(value)
      const Costoporcentual = (costoAdministrativoPlatillo / precioVentaNum) * 100
      setCostoPorcentual(Costoporcentual.toFixed(2))

      const precioConIVACalculado = precioVentaNum * 0.16 + precioVentaNum
      setPrecioConIVA(precioConIVACalculado.toFixed(2))
    } else {
      setCostoPorcentual("")
      setPrecioConIVA("")
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedImageFile(null)
      setImagenPreview(null)
      if (platilloData?.imgurl) {
        setImagenPreview(platilloData.imgurl)
      }
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 25 Megabytes.")
      setSelectedImageFile(null)
      setImagenPreview(null)
      return
    }
    if (
      !file.type.includes("jpeg") &&
      !file.type.includes("jpg") &&
      !file.type.includes("png") &&
      !file.type.includes("webp")
    ) {
      toast.error("Solo se permiten formatos .jpg, .jpeg, .png o .webp.")
      setSelectedImageFile(null)
      setImagenPreview(null)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagenPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setSelectedImageFile(file)
  }

  const handleDeleteImage = async () => {
    if (selectedImageFile) {
      setSelectedImageFile(null)
      setImagenPreview(null)
      if (platilloData?.imgurl) {
        setImageUrl(platilloData.imgurl)
        setImagenPreview(platilloData.imgurl)
      } else {
        setImageUrl(null)
      }
      toast.success("Previsualización de imagen eliminada.")
      return
    }

    if (!imageUrl) return

    setIsSubmitting(true)
    try {
      const { success, error } = await deleteImage(imageUrl, "imagenes")
      if (error) {
        console.error("Error al eliminar imagen:", error)
        toast.error("Error al eliminar imagen: " + error.message)
      } else if (success) {
        setImageUrl(null)
        setImagenPreview(null)
        toast.success("Imagen eliminada correctamente.")
      }
    } catch (e: any) {
      console.error("Error inesperado al eliminar imagen:", e)
      toast.error("Error inesperado al eliminar imagen: " + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateBasicInfo = async () => {
    if (!platilloData?.nombre || !platilloData?.descripcion) {
      setErrorMessage("Favor de llenar la información faltante (Nombre y Descripción).")
      setShowErrorDialog(true)
      return
    }

    setIsSubmitting(true)
    let finalImgUrl = platilloData.imgurl

    try {
      if (selectedImageFile) {
        const fileExt = selectedImageFile.name.split(".").pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `Platillos/${fileName}`

        const { error: uploadError } = await supabase.storage.from("imagenes").upload(filePath, selectedImageFile)
        if (uploadError) {
          throw new Error(`Error al subir imagen: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage.from("imagenes").getPublicUrl(filePath)
        finalImgUrl = urlData.publicUrl
        toast.success("Nueva imagen subida correctamente.")
      } else if (imagenPreview === null && platilloData.imgurl !== null) {
        finalImgUrl = null
      }

      const { error: updateError } = await supabase
        .from("platillos")
        .update({
          nombre: platilloData.nombre,
          descripcion: platilloData.descripcion,
          imgurl: finalImgUrl,
          instruccionespreparacion: platilloData.instruccionespreparacion,
          tiempopreparacion: platilloData.tiempopreparacion,
        })
        .eq("id", platilloId)

      if (updateError) {
        console.error("Error al actualizar receta:", updateError)
        toast.error("Error al actualizar información de la receta.")
        setIsSubmitting(false)
        return
      }

      setImageUrl(finalImgUrl)
      setPlatilloData((prev) => (prev ? { ...prev, imgurl: finalImgUrl } : null))
      setSavedPlatilloData((prev) => prev ? { ...prev, nombre: platilloData.nombre, descripcion: platilloData.descripcion, instruccionespreparacion: platilloData.instruccionespreparacion, tiempopreparacion: platilloData.tiempopreparacion, imgurl: finalImgUrl } : null)
      setSelectedImageFile(null)
      setImagenPreview(finalImgUrl)

      setShowSuccessDialog(true)
      setTimeout(() => setShowSuccessDialog(false), 2500)
    } catch (error: any) {
      console.error("Error inesperado al actualizar receta:", error)
      toast.error("Error inesperado al actualizar receta: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleIngredienteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setIngredienteSearchTerm(term)
    const selectedIng =
      ingredientesDropdown.find((i) => i.id.toString() === selectedIngredienteId) ||
      filteredIngredientes.find((i) => i.id.toString() === selectedIngredienteId)
    if (selectedIngredienteId && selectedIng && term !== `${selectedIng.codigo} - ${selectedIng.nombre}`) {
      setSelectedIngredienteId("")
      setCostoIngrediente("")
      setSelectedUnidadMedidaId("")
    }
    if (term === "") {
      setSelectedIngredienteId("")
      setCostoIngrediente("")
      setSelectedUnidadMedidaId("")
    }
  }

  const handleSelectIngredienteFromDropdown = async (ing: DropdownItem) => {
    setSelectedIngredienteId(ing.id.toString())
    setIngredienteSearchTerm(`${ing.codigo} - ${ing.nombre}`)
    setCostoIngrediente(ing.costo?.toString() || "0")
    setShowIngredienteDropdown(false)

    try {
      const units = await getUnidadesMedidaByIngrediente(ing.id)
      if (units.length > 0) {
        setSelectedUnidadMedidaId(units[0].id.toString())
      } else {
        setSelectedUnidadMedidaId("")
      }
    } catch (error) {
      console.error("Error al obtener la unidad para el ingrediente seleccionado:", error)
      setSelectedUnidadMedidaId("")
    }
  }

  const handleCantidadRecetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value)
    if (isNaN(value) || value < 1) {
      value = 1
    }
    if (value > maxRangeReceta) {
      value = maxRangeReceta
    }
    setSelectedRecetaCantidad(value.toString())
    setSelectedRecetaCant(value.toString())
  }

  const handleCantRecetaRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSelectedRecetaCant(value)
    setSelectedRecetaCantidad(value)
  }

  // ===== Edicion inline de cantidad en tablas Ingredientes / Sub-Recetas =====
  const [editingIngCantidad, setEditingIngCantidad] = useState<Record<number, string>>({})
  const [editingRecCantidad, setEditingRecCantidad] = useState<Record<number, string>>({})

  const handleIngredienteCantidadChange = (id: number, value: string) => {
    setEditingIngCantidad((prev) => ({ ...prev, [id]: value }))
    const num = Number.parseFloat(value)
    if (!isNaN(num) && num > 0) {
      setIngredientesPlatillo((prev) =>
        prev.map((ing) =>
          ing.id === id
            ? { ...ing, cantidad: num, ingredientecostoparcial: num * ing.costoUnitarioEfectivo }
            : ing,
        ),
      )
    }
  }

  const handleIngredienteCantidadBlur = async (id: number) => {
    const ing = ingredientesPlatillo.find((i) => i.id === id)
    if (!ing) return

    const draft = editingIngCantidad[id]
    const num = draft !== undefined ? Number.parseFloat(draft) : ing.cantidad

    if (isNaN(num) || num <= 0) {
      toast.error("Cantidad inválida.")
      setEditingIngCantidad((prev) => {
        const { [id]: _omit, ...rest } = prev
        return rest
      })
      return
    }

    const newParcial = num * ing.costoUnitarioEfectivo

    const { error } = await supabase
      .from("ingredientesxplatillo")
      .update({
        cantidad: num,
        ingredientecostoparcial: newParcial,
        fechamodificacion: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error al actualizar cantidad de ingrediente:", error)
      toast.error("Error al actualizar cantidad: " + error.message)
      return
    }

    setIngredientesPlatillo((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad: num, ingredientecostoparcial: newParcial } : i)),
    )
    setEditingIngCantidad((prev) => {
      const { [id]: _omit, ...rest } = prev
      return rest
    })
    setCostosLoaded(false)
  }

  const handleRecetaCantidadChange = (id: number, value: string) => {
    setEditingRecCantidad((prev) => ({ ...prev, [id]: value }))
    const num = Number.parseFloat(value)
    if (!isNaN(num) && num > 0) {
      setRecetasPlatillo((prev) =>
        prev.map((rec) =>
          rec.id === id
            ? { ...rec, cantidad: num, recetacostoparcial: num * rec.costoUnitarioEfectivo }
            : rec,
        ),
      )
    }
  }

  const handleRecetaCantidadBlur = async (id: number) => {
    const rec = recetasPlatillo.find((r) => r.id === id)
    if (!rec) return

    const draft = editingRecCantidad[id]
    const num = draft !== undefined ? Number.parseFloat(draft) : rec.cantidad

    if (isNaN(num) || num <= 0) {
      toast.error("Cantidad inválida.")
      setEditingRecCantidad((prev) => {
        const { [id]: _omit, ...rest } = prev
        return rest
      })
      return
    }

    const newParcial = num * rec.costoUnitarioEfectivo

    const { error } = await supabase
      .from("recetasxplatillo")
      .update({
        cantidad: num,
        recetacostoparcial: newParcial,
        fechamodificacion: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error al actualizar cantidad de sub-receta:", error)
      toast.error("Error al actualizar cantidad: " + error.message)
      return
    }

    setRecetasPlatillo((prev) =>
      prev.map((r) => (r.id === id ? { ...r, cantidad: num, recetacostoparcial: newParcial } : r)),
    )
    setEditingRecCantidad((prev) => {
      const { [id]: _omit, ...rest } = prev
      return rest
    })
    setCostosLoaded(false)
  }

  const handleAddIngrediente = async () => {
    if (!selectedIngredienteId || !cantidadIngrediente || !selectedUnidadMedidaId || !costoIngrediente) {
      toast.error("Favor de llenar la información faltante para el ingrediente.")
      return
    }

    setIsSubmitting(true)
    try {
      const { data: existingIngrediente, error: checkError } = await supabase
        .from("ingredientesxplatillo")
        .select("id")
        .eq("platilloid", platilloId)
        .eq("ingredienteid", Number.parseInt(selectedIngredienteId))
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error al verificar ingrediente existente:", checkError)
        toast.error("Error al verificar ingrediente existente: " + checkError.message)
        setIsSubmitting(false)
        return
      }

      if (existingIngrediente) {
        setShowIngredienteExistsDialog(true)
        setIsSubmitting(false)
        return
      }

      const cantidadNum = Number.parseFloat(cantidadIngrediente)
      const costoNum = Number.parseFloat(costoIngrediente)
      const unidadMedida = unidadesMedidaDropdown.find((u) => u.id.toString() === selectedUnidadMedidaId)

      if (isNaN(cantidadNum) || isNaN(costoNum) || !unidadMedida) {
        toast.error("Valores de cantidad o costo inválidos, o unidad de medida no encontrada.")
        setIsSubmitting(false)
        return
      }

      const calculoConversion = unidadMedida.calculoconversion || 1
      const ingredienteCostoParcial = cantidadNum * calculoConversion * costoNum

      const { data, error } = await supabase
        .from("ingredientesxplatillo")
        .insert({
          platilloid: platilloId,
          ingredienteid: Number.parseInt(selectedIngredienteId),
          cantidad: cantidadNum,
          ingredientecostoparcial: ingredienteCostoParcial,
          activo: true,
          fechacreacion: new Date().toISOString(),
          fechamodificacion: new Date().toISOString(),
        })
        .select(`
          id, cantidad, ingredientecostoparcial,
          ingredientes(id, nombre, costo, tipounidadmedida(descripcion))
        `)
        .single()

      if (error) {
        console.error("Error al agregar ingrediente:", error)
        toast.error("Error al agregar ingrediente: " + error.message)
        return
      }

      if (data) {
        setIngredientesPlatillo((prev) => [
          ...prev,
          {
            id: data.id,
            ingredienteid: data.ingredientes.id,
            nombre: data.ingredientes.nombre,
            cantidad: data.cantidad,
            ingredientecostoparcial: data.ingredientecostoparcial,
            unidad: data.ingredientes?.tipounidadmedida?.descripcion,
            costounitario: data.ingredientes?.costo || 0,
            costoUnitarioEfectivo:
              data.cantidad && data.cantidad > 0 ? data.ingredientecostoparcial / data.cantidad : 0,
          },
        ])
        toast.success("Ingrediente agregado correctamente.")
        setSelectedIngredienteId("")
        setCantidadIngrediente("")
        setSelectedUnidadMedidaId("")
        setCostoIngrediente("")
        setIngredienteSearchTerm("")
        // Reset costos so they reload with new data
        setCostosLoaded(false)
      }
    } catch (error) {
      console.error("Error inesperado al agregar ingrediente:", error)
      toast.error("Error inesperado al agregar ingrediente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteIngrediente = async (ingredienteToDeletes: number) => {
    if (ingredienteToDeletes === null) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("ingredientesxplatillo").delete().eq("id", ingredienteToDeletes)

      if (error) {
        console.error("Error al eliminar ingrediente:", error)
        toast.error("Error al eliminar ingrediente: " + error.message)
        return
      }

      setIngredientesPlatillo((prev) => prev.filter((ing) => ing.id !== ingredienteToDeletes))
      toast.success("Ingrediente eliminado correctamente.")
      setCostosLoaded(false)
    } catch (error) {
      console.error("Error inesperado al eliminar ingrediente:", error)
      toast.error("Error inesperado al eliminar ingrediente.")
    } finally {
      setShowConfirmDeleteIngrediente(false)
      setIngredienteToDelete(null)
      setIsSubmitting(false)
    }
  }

  const handleAddReceta = async () => {
    if (!selectedRecetaId || !selectedRecetaCantidad || Number(selectedRecetaCantidad) < 1) {
      toast.error("Favor de seleccionar una sub-receta e ingresar una cantidad válida.")
      return
    }
    if (Number(selectedRecetaCantidad) > maxRangeReceta) {
      toast.error(`La cantidad no puede ser mayor a la cantidad base de la sub-receta (${maxRangeReceta}).`)
      return
    }

    setIsSubmitting(true)
    try {
      const { data: existingReceta, error: checkError } = await supabase
        .from("recetasxplatillo")
        .select("id")
        .eq("platilloid", platilloId)
        .eq("recetaid", Number.parseInt(selectedRecetaId))
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error al verificar sub-receta existente:", checkError)
        toast.error("Error al verificar sub-receta existente: " + checkError.message)
        setIsSubmitting(false)
        return
      }

      if (existingReceta) {
        setShowRecetaExistsDialog(true)
        setIsSubmitting(false)
        return
      }

      const costoNum = Number.parseFloat(costoReceta)
      const cantidadIngresada = Number.parseFloat(selectedRecetaCantidad)
      const recetaBaseCantidad = maxRangeReceta

      if (isNaN(costoNum) || isNaN(cantidadIngresada) || cantidadIngresada <= 0) {
        toast.error("Valores de cantidad o costo de sub-receta inválidos.")
        setIsSubmitting(false)
        return
      }

      const recetacostoparcial = (costoNum / recetaBaseCantidad) * cantidadIngresada

      const { data, error } = await supabase
        .from("recetasxplatillo")
        .insert({
          platilloid: platilloId,
          recetaid: Number.parseInt(selectedRecetaId),
          recetacostoparcial: recetacostoparcial,
          cantidad: cantidadIngresada,
          activo: true,
          fechacreacion: new Date().toISOString(),
          fechamodificacion: new Date().toISOString(),
        })
        .select(`
          id, recetacostoparcial, cantidad,
          recetas(id, nombre)
        `)
        .single()

      if (error) {
        console.error("Error al agregar sub-receta:", error)
        toast.error("Error al agregar sub-receta: " + error.message)
        return
      }

      if (data) {
        setRecetasPlatillo((prev) => [
          ...prev,
          {
            id: data.id,
            recetaid: data.recetas.id,
            nombre: data.recetas.nombre,
            recetacostoparcial: data.recetacostoparcial,
            cantidad: data.cantidad,
            costoUnitarioEfectivo:
              data.cantidad && data.cantidad > 0 ? data.recetacostoparcial / data.cantidad : 0,
          },
        ])
        toast.success("Sub-Receta agregada correctamente.")
        setSelectedRecetaId("")
        setCostoReceta("")
        setSelectedRecetaCantidad("1")
        setSelectedRecetaCant("1")
        setSelectedRecetaUnidadBase("")
        setMaxRangeReceta(1)
        setCostosLoaded(false)
      }
    } catch (error) {
      console.error("Error inesperado al agregar sub-receta:", error)
      toast.error("Error inesperado al agregar sub-receta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReceta = async (recetaToDeletes: number) => {
    if (recetaToDeletes === null) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("recetasxplatillo").delete().eq("id", recetaToDeletes)

      if (error) {
        console.error("Error al eliminar sub-receta:", error)
        toast.error("Error al eliminar sub-receta: " + error.message)
        return
      }

      setRecetasPlatillo((prev) => prev.filter((rec) => rec.id !== recetaToDeletes))
      toast.success("Sub-Receta eliminada correctamente.")
      setCostosLoaded(false)
    } catch (error) {
      console.error("Error inesperado al eliminar sub-receta:", error)
      toast.error("Error inesperado al eliminar sub-receta.")
    } finally {
      setShowConfirmDeleteReceta(false)
      setRecetaToDelete(null)
      setIsSubmitting(false)
    }
  }

  const handleRecetaDropdownChange = async (recetaId: string) => {
    setSelectedRecetaId(recetaId)
    if (recetaId) {
      const selectedReceta = recetasDropdown.find((r) => r.id.toString() === recetaId)
      if (selectedReceta) {
        setCostoReceta(selectedReceta.costo?.toString() || "0")
        const baseCantidad = selectedReceta.cantidad && selectedReceta.cantidad > 0 ? selectedReceta.cantidad : 1
        setMaxRangeReceta(baseCantidad)
        setSelectedRecetaCantidad("1")
        setSelectedRecetaCant("1")
        setSelectedRecetaUnidadBase(selectedReceta.tipounidadmedida?.descripcion || "N/A")
      } else {
        setCostoReceta("0")
        setMaxRangeReceta(1)
        setSelectedRecetaCantidad("1")
        setSelectedRecetaCant("1")
        setSelectedRecetaUnidadBase("")
      }
    } else {
      setCostoReceta("")
      setMaxRangeReceta(1)
      setSelectedRecetaCantidad("1")
      setSelectedRecetaCant("1")
      setSelectedRecetaUnidadBase("")
    }
  }

  const handleFinalUpdatePlatillo = async (confirmadoMultiMenu = false) => {
    if (!platilloId) {
      toast.error("ID de receta no proporcionado para la actualización final.")
      return
    }

    if (ingredientesPlatillo.length === 0 && recetasPlatillo.length === 0) {
      toast.error("Debe registrar al menos 1 ingrediente o 1 sub-receta para finalizar la actualización de la receta.")
      return
    }

    if (!precioVenta || isNaN(Number(precioVenta))) {
      toast.error("Debe ingresar un precio de venta válido.")
      return
    }

    const precioConIVAValidacion = Number(precioConIVA)
    if (precioConIVAValidacion < (precioSugeridoPlatillo || 0)) {
      setErrorMessage(
        `El precio con IVA no puede ser menor al precio mínimo sugerido ($${(precioSugeridoPlatillo || 0).toFixed(2)}).`,
      )
      setShowErrorDialog(true)
      return
    }

    // Precheck: si la receta está vinculada a más de un menú, avisar al usuario
    if (!confirmadoMultiMenu) {
      const { count, error: countError } = await supabase
        .from("platillosxmenu")
        .select("*", { count: "exact", head: true })
        .eq("platilloid", platilloId)

      if (!countError && count !== null && count > 1) {
        setMultiMenuCount(count)
        setShowMultiMenuDialog(true)
        return
      }
    }

    setIsSubmitting(true)
    setShowAnimation(true)

    try {
      const precioVentaNum = Number(precioVenta)
      const costoPorcentualNum = Number(costoPorcentual)
      const precioConIVANum = Number(precioConIVA)

      const [supabaseResult] = await Promise.all([
        (async () => {
          const { data: ingredientesCostos, error: ingCostosError } = await supabase
            .from("ingredientesxplatillo")
            .select("ingredientecostoparcial")
            .eq("platilloid", platilloId)

          if (ingCostosError) throw ingCostosError

          const { data: recetasCostos, error: recCostosError } = await supabase
            .from("recetasxplatillo")
            .select("recetacostoparcial")
            .eq("platilloid", platilloId)

          if (recCostosError) throw recCostosError

          const totalIngredientesCosto = (ingredientesCostos || []).reduce(
            (sum, item) => sum + item.ingredientecostoparcial,
            0,
          )
          const totalRecetasCosto = (recetasCostos || []).reduce((sum, item) => sum + item.recetacostoparcial, 0)
          const nuevoCostoTotal = totalIngredientesCosto + totalRecetasCosto

          const { error: updatePlatilloError } = await supabase
            .from("platillos")
            .update({ costototal: nuevoCostoTotal })
            .eq("id", platilloId)

          if (updatePlatilloError) throw updatePlatilloError

          const { data: configData, error: configError } = await supabase
            .from("configuraciones")
            .select("valorfloat")
            .eq("id", 1)
            .single()

          if (configError || !configData) {
            console.error("Error al obtener valorfloat de configuraciones:", configError)
            throw new Error("No se pudo obtener el valor de configuración para el cálculo administrativo.")
          }

          const valorFloatConfig = configData.valorfloat
          const costoAdministrativoCalculado = nuevoCostoTotal * valorFloatConfig + nuevoCostoTotal

          const { error: updateCostoAdministrativoError } = await supabase
            .from("platillos")
            .update({ costoadministrativo: costoAdministrativoCalculado })
            .eq("id", platilloId)

          if (updateCostoAdministrativoError) throw updateCostoAdministrativoError

          // El precio de venta se propaga a TODOS los menús relacionados con este platillo,
          // independientemente del menú desde el cual se editó. Un platillo tiene un único precio.
          const margenUtilidadCalculado = precioVentaNum - costoAdministrativoCalculado

          const { error: updatePlatillosxMenuError } = await supabase
            .from("platillosxmenu")
            .update({
              precioventa: precioVentaNum,
              precioconiva: precioConIVANum,
              margenutilidad: margenUtilidadCalculado,
            })
            .eq("platilloid", platilloId)

          if (updatePlatillosxMenuError) {
            console.error(`Error al actualizar precios en platillosxmenu para platilloId ${platilloId}:`, updatePlatillosxMenuError)
            throw updatePlatillosxMenuError
          }

          const { data: platilloMenus, error: platilloMenusError } = await supabase
            .from("platillosxmenu")
            .select(`
              precioventa,
              menuid,
              menus!inner(
                restauranteid,
                restaurantes!inner(hotelid)
              )
            `)
            .eq("platilloid", platilloId)

          if (platilloMenusError) throw platilloMenusError

          const today = new Date()
          const currentMonth = today.getMonth() + 1
          const currentYear = today.getFullYear()

          for (const menuAssoc of platilloMenus) {
            const hotelId = menuAssoc.menus.restaurantes.hotelid
            const restauranteId = menuAssoc.menus.restauranteid
            const menuIdAssoc = menuAssoc.menuid
            const PrecioAssoc = menuAssoc.precioventa

            const CostoAssoc = (costoAdministrativoCalculado / PrecioAssoc) * 100

            const { data: existingHistoricoMonth, error: checkHistoricoMonthError } = await supabase
              .from("historico")
              .select("idrec, ingredienteid, recetaid")
              .eq("platilloid", platilloId)
              .eq("menuid", menuIdAssoc)
              .gte("fechacreacion", `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`)
              .lt("fechacreacion", `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-01`)

            if (checkHistoricoMonthError) {
              console.error("Error checking existing historico records for month:", checkHistoricoMonthError)
              throw new Error("Error al verificar registros históricos del mes.")
            }

            if (existingHistoricoMonth && existingHistoricoMonth.length > 0) {
              const { error: deleteHistoricoError } = await supabase
                .from("historico")
                .delete()
                .eq("platilloid", platilloId)
                .eq("menuid", menuIdAssoc)
                .gte("fechacreacion", `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`)
                .lt("fechacreacion", `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-01`)

              if (deleteHistoricoError) {
                console.error("Error deleting existing historico records:", deleteHistoricoError)
                throw new Error("Error al eliminar registros históricos existentes.")
              }

              const historicoIngredientesToInsert = []
              for (const ing of ingredientesPlatillo) {
                historicoIngredientesToInsert.push({
                  hotelid: hotelId,
                  restauranteid: restauranteId,
                  menuid: menuIdAssoc,
                  platilloid: platilloId,
                  ingredienteid: ing.ingredienteid,
                  recetaid: null,
                  cantidad: ing.cantidad,
                  costo: ing.ingredientecostoparcial,
                  activo: true,
                  fechacreacion: new Date().toISOString(),
                  precioventa: PrecioAssoc,
                  costoporcentual: CostoAssoc,
                })
              }

              if (historicoIngredientesToInsert.length > 0) {
                const { error: insertIngredientesHistoricoError } = await supabase
                  .from("historico")
                  .insert(historicoIngredientesToInsert)
                if (insertIngredientesHistoricoError) throw insertIngredientesHistoricoError
              }

              const historicoRecetasToInsert = []
              for (const rec of recetasPlatillo) {
                historicoRecetasToInsert.push({
                  hotelid: hotelId,
                  restauranteid: restauranteId,
                  menuid: menuIdAssoc,
                  platilloid: platilloId,
                  ingredienteid: null,
                  recetaid: rec.recetaid,
                  cantidad: rec.cantidad,
                  costo: rec.recetacostoparcial,
                  activo: true,
                  fechacreacion: new Date().toISOString(),
                  precioventa: PrecioAssoc,
                  costoporcentual: CostoAssoc,
                })
              }

              if (historicoRecetasToInsert.length > 0) {
                const { error: insertRecetasHistoricoError } = await supabase
                  .from("historico")
                  .insert(historicoRecetasToInsert)
                if (insertRecetasHistoricoError) throw insertRecetasHistoricoError
              }
            } else {
              const historicoIngredientesToInsert = []
              for (const ing of ingredientesPlatillo) {
                historicoIngredientesToInsert.push({
                  hotelid: hotelId,
                  restauranteid: restauranteId,
                  menuid: menuIdAssoc,
                  platilloid: platilloId,
                  ingredienteid: ing.ingredienteid,
                  recetaid: null,
                  cantidad: ing.cantidad,
                  costo: ing.ingredientecostoparcial,
                  activo: true,
                  fechacreacion: new Date().toISOString(),
                  precioventa: precioVentaNum,
                  costoporcentual: costoPorcentualNum,
                })
              }

              if (historicoIngredientesToInsert.length > 0) {
                const { error: insertIngredientesHistoricoError } = await supabase
                  .from("historico")
                  .insert(historicoIngredientesToInsert)
                if (insertIngredientesHistoricoError) throw insertIngredientesHistoricoError
              }

              const historicoRecetasToInsert = []
              for (const rec of recetasPlatillo) {
                historicoRecetasToInsert.push({
                  hotelid: hotelId,
                  restauranteid: restauranteId,
                  menuid: menuIdAssoc,
                  platilloid: platilloId,
                  ingredienteid: null,
                  recetaid: rec.recetaid,
                  cantidad: rec.cantidad,
                  costo: rec.recetacostoparcial,
                  activo: true,
                  fechacreacion: new Date().toISOString(),
                  precioventa: precioVentaNum,
                  costoporcentual: costoPorcentualNum,
                })
              }

              if (historicoRecetasToInsert.length > 0) {
                const { error: insertRecetasHistoricoError } = await supabase
                  .from("historico")
                  .insert(historicoRecetasToInsert)
                if (insertRecetasHistoricoError) throw insertRecetasHistoricoError
              }
            }
          }
          return { success: true }
        })(),
        new Promise((resolve) => setTimeout(resolve, 100)),
      ])

      if (supabaseResult && supabaseResult.success) {
        setSavedPlatilloData((prev) => prev ? { ...prev, costototal: totalCostoPlatillo, costoadministrativo: costoAdministrativoPlatillo } : null)
        setShowSuccessDialog(true)
        setTimeout(() => setShowSuccessDialog(false), 2500)
      }
    } catch (error: any) {
      console.error("Error al actualizar costo total de la receta o histórico:", error)
      toast.error("Error al actualizar costo total de la receta o histórico: " + error.message)
    } finally {
      setShowAnimation(false)
      setIsSubmitting(false)
    }
  }

  /* ==================================================
    Render
  ================================================== */

  if (loading && !platilloData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  if (!platilloData) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 text-center">
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
          <h1 className="text-3xl font-bold tracking-tight">Información de Receta</h1>
          <p className="text-muted-foreground">Información completa de la receta</p>
        </div>
        <Button
          id="btnRegresarActPlatillos"
          name="btnRegresarActPlatillos"
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
                {(imagenPreview || imageUrl) ? (
                  <Image
                    src={imagenPreview || imageUrl || "/placeholder.svg"}
                    alt={savedPlatilloData?.nombre || "Imagen del platillo"}
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
              {/* Column 1: Información Básica */}
              <div>
                <h3 className="text-sm font-semibold text-blue-700 mb-1">Información Básica</h3>
                <div className="space-y-0.5 text-xs">
                  <p><span className="font-semibold text-blue-700">ID:</span> {savedPlatilloData?.id}</p>
                  <p><span className="font-semibold text-blue-700">Nombre:</span> {savedPlatilloData?.nombre}</p>
                  <p><span className="font-semibold text-blue-700">Descripción:</span> {savedPlatilloData?.descripcion}</p>
                  {savedPlatilloData?.instruccionespreparacion && (
                    <p><span className="font-semibold text-blue-700">Instrucciones:</span> {savedPlatilloData.instruccionespreparacion}</p>
                  )}
                  {savedPlatilloData?.tiempopreparacion && (
                    <p><span className="font-semibold text-blue-700">Tiempo Prep.:</span> {savedPlatilloData.tiempopreparacion}</p>
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
                    <span className="font-semibold text-orange-600">Costo Elaboración:</span>{" "}
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

              {/* Column 3: Menú Asociado */}
              <div>
                <h3 className="text-sm font-semibold text-purple-700 mb-1">Menú Asociado</h3>
                <div className="space-y-0.5 text-xs">
                  {(() => {
                    const menuActual = menusAsociados.find((m) => m.menuid === menuId)
                    return menuActual ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{menuActual.nombre}</Badge>
                        {menuActual.precioventa && (
                          <span className="text-muted-foreground">{formatCurrency(menuActual.precioventa)}</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Sin menú asociado</p>
                    )
                  })()}
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
            Información Básica
          </TabsTrigger>
          <TabsTrigger
            value="ingredientes"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-6 py-3"
          >
            Ingredientes
          </TabsTrigger>
          <TabsTrigger
            value="subrecetas"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-6 py-3"
          >
            Sub-Recetas
          </TabsTrigger>
          <TabsTrigger
            value="costos"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-6 py-3"
          >
            Resumen de Precio
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB: Información Básica ===== */}
        <TabsContent value="informacion">
          <Card>
            <CardHeader>
              <CardTitle>Actualizar Información Básica</CardTitle>
              <CardDescription>Actualiza los detalles principales de tu receta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="nombre" className="text-sm font-medium">
                  Nombre de la Receta
                </label>
                <Input
                  id="nombre"
                  name="txtNombrePlatilloActualizar"
                  type="text"
                  maxLength={150}
                  value={platilloData.nombre || ""}
                  onChange={handleInputChange}
                  placeholder="Nombre del platillo"
                />
              </div>
              <div>
                <label htmlFor="descripcion" className="text-sm font-medium">
                  Descripción
                </label>
                <Input
                  id="descripcion"
                  name="txtDescripcionPlatilloActualizar"
                  type="text"
                  maxLength={150}
                  value={platilloData.descripcion || ""}
                  onChange={handleInputChange}
                  placeholder="Descripción del platillo"
                />
              </div>
              <div>
                <label htmlFor="instruccionespreparacion" className="text-sm font-medium">
                  Instrucciones de Elaboración
                </label>
                <Textarea
                  id="instruccionespreparacion"
                  name="txtPlatilloInstruccionesActualizar"
                  maxLength={500}
                  value={platilloData.instruccionespreparacion || ""}
                  onChange={handleInputChange}
                  placeholder="Instrucciones detalladas para la preparación"
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <label htmlFor="tiempopreparacion" className="text-sm font-medium">
                  Tiempo de Preparación
                </label>
                <Textarea
                  id="tiempopreparacion"
                  name="txtPlatilloTiempoActualizar"
                  maxLength={150}
                  value={platilloData.tiempopreparacion || ""}
                  onChange={handleInputChange}
                  placeholder="Ej: 30 minutos, 1 hora"
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="ImagenFile" className="text-sm font-medium">
                  Cargar Imagen
                </label>
                <Input
                  id="ImagenFile"
                  name="ImagenFile"
                  type="file"
                  accept="image/jpeg, image/jpg, image/png, image/webp"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />
                {isSubmitting && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo imagen...
                  </div>
                )}
                {(imagenPreview || imageUrl) && (
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                      <Image
                        src={imagenPreview || imageUrl || "/placeholder.svg"}
                        alt="Previsualización de imagen"
                        layout="fill"
                        objectFit="cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 rounded-full h-6 w-6"
                        onClick={handleDeleteImage}
                        disabled={isSubmitting}
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="sr-only">Eliminar imagen</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center pt-4 justify-end">
                <Button
                  id="btnActualizarPlatillo"
                  name="btnActualizarPlatillo"
                  type="button"
                  onClick={handleUpdateBasicInfo}
                  disabled={isSubmitting}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar Información
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: Ingredientes ===== */}
        <TabsContent value="ingredientes">
          <Card>
            <CardHeader>
              <CardTitle>Ingredientes de la Receta</CardTitle>
              <CardDescription>Agrega, actualiza o elimina ingredientes de tu receta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Cargando ingredientes...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 relative">
                      <label htmlFor="txtIngredienteSearch" className="text-sm font-medium">
                        Ingrediente
                      </label>
                      <Input
                        id="txtIngredienteSearch"
                        name="txtIngredienteSearch"
                        value={ingredienteSearchTerm}
                        onChange={handleIngredienteSearchChange}
                        onFocus={() => setShowIngredienteDropdown(true)}
                        onBlur={() => setTimeout(() => setShowIngredienteDropdown(false), 100)}
                        placeholder="Buscar por código o nombre..."
                        disabled={isSubmitting}
                        autoComplete="off"
                      />
                      {showIngredienteDropdown && filteredIngredientes.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                          {filteredIngredientes.map((ing) => (
                            <div
                              key={ing.id}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                              onMouseDown={() => handleSelectIngredienteFromDropdown(ing)}
                            >
                              {ing.codigo} - {ing.nombre}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="txtCantidadIngrediente" className="text-sm font-medium">
                        Cantidad
                      </label>
                      <Input
                        id="txtCantidadIngrediente"
                        name="txtCantidadIngrediente"
                        type="number"
                        step="0.01"
                        value={cantidadIngrediente}
                        onChange={(e) => setCantidadIngrediente(e.target.value)}
                        placeholder="Cantidad"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="ddlUnidadMedida" className="text-sm font-medium">
                        Unidad de Medida
                      </label>
                      <Select
                        name="ddlUnidadMedida"
                        value={selectedUnidadMedidaId}
                        onValueChange={setSelectedUnidadMedidaId}
                        disabled={true}
                      >
                        <SelectTrigger id="ddlUnidadMedida">
                          <SelectValue placeholder="Unidad de Medida" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidadesMedidaDropdown.map((um) => (
                            <SelectItem key={um.id} value={um.id.toString()}>
                              {um.descripcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="txtCostoIngrediente" className="text-sm font-medium">
                        Costo Unitario
                      </label>
                      <Input
                        id="txtCostoIngrediente"
                        name="txtCostoIngrediente"
                        type="text"
                        value={costoIngrediente}
                        readOnly
                        disabled={true}
                        placeholder="Costo"
                      />
                    </div>
                    <div className="lg:col-span-4 flex justify-end">
                      <Button
                        id="btnAgregarIngrediente"
                        name="btnAgregarIngrediente"
                        type="button"
                        onClick={handleAddIngrediente}
                        disabled={isSubmitting}
                        className="bg-green-800 hover:bg-green-900 text-white"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Ingrediente
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border mt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead>Costo Parcial</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ingredientesPlatillo.length > 0 ? (
                          ingredientesPlatillo.map((ing) => (
                            <TableRow key={ing.id}>
                              <TableCell>{ing.nombre}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingIngCantidad[ing.id] ?? String(ing.cantidad)}
                                  onChange={(e) => handleIngredienteCantidadChange(ing.id, e.target.value)}
                                  onBlur={() => handleIngredienteCantidadBlur(ing.id)}
                                  className="h-8 w-24"
                                />
                              </TableCell>
                              <TableCell>{ing.unidad}</TableCell>
                              <TableCell>{formatCurrency(ing.ingredientecostoparcial)}</TableCell>
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      title="Eliminar Ingrediente"
                                      onClick={() => setIngredienteToDelete(ing.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Estás seguro de que deseas eliminar este ingrediente del platillo?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setIngredienteToDelete(null)}>
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteIngrediente(ing.id)}>Confirmar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              No hay ingredientes agregados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {ingredientesPlatillo.length > 0 && (
                    <div className="flex justify-end mt-3 pr-2">
                      <p className="text-sm font-semibold text-gray-700">
                        Total Costo Parcial:{" "}
                        <span className="text-base font-bold text-orange-600">
                          {formatCurrency(ingredientesPlatillo.reduce((sum, ing) => sum + (ing.ingredientecostoparcial || 0), 0))}
                        </span>
                      </p>
                    </div>
                  )}
                  <div className="flex items-center pt-4 justify-end">
                    <Button
                      type="button"
                      onClick={handleUpdateBasicInfo}
                      disabled={isSubmitting}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Guardar Información
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: Sub-Recetas ===== */}
        <TabsContent value="subrecetas">
          <Card>
            <CardHeader>
              <CardTitle>Sub-Recetas de la Receta</CardTitle>
              <CardDescription>Agrega, actualiza o elimina sub-recetas de tu receta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Cargando sub-recetas...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="col-span-full">
                      <label htmlFor="ddlReceta" className="text-sm font-medium">
                        Sub-Receta
                      </label>
                      <Select
                        name="ddlReceta"
                        value={selectedRecetaId}
                        onValueChange={handleRecetaDropdownChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="ddlReceta">
                          <SelectValue placeholder="Selecciona una sub-receta" />
                        </SelectTrigger>
                        <SelectContent>
                          {recetasDropdown.map((rec) => (
                            <SelectItem key={rec.id} value={rec.id.toString()}>
                              {rec.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="txtCantidad">Cantidad</Label>
                      <Input
                        id="txtCantidad"
                        name="txtCantidad"
                        type="number"
                        value={selectedRecetaCantidad}
                        onChange={handleCantidadRecetaChange}
                        min="1"
                        max={maxRangeReceta}
                        disabled={!selectedRecetaId || maxRangeReceta === 0}
                      />
                    </div>

                    <div className="col-span-2 w-[300px]">
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="txtCant">Porcion de Cantidad</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                Rango de cantidad, favor de seleccionar la cantidad requerida de la subreceta que utiliza para
                                esta Receta, la linea define el rango de la cantidad minima y maxima que se puede utilizar con
                                esta subreceta.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="txtCant"
                        name="txtCant"
                        type="range"
                        value={selectedRecetaCant}
                        onChange={handleCantRecetaRangeChange}
                        min="1"
                        max={maxRangeReceta}
                        disabled={!selectedRecetaId || maxRangeReceta === 0}
                      />
                      <div className="mt-2 text-sm text-muted-foreground flex items-center justify-between">
                        <span>
                          {selectedRecetaCantidad} / {maxRangeReceta} {selectedRecetaUnidadBase || "unidades"}
                        </span>
                        {selectedRecetaId && selectedRecetaCantidad && costoReceta && (
                          <span className="font-semibold text-primary">
                            Costo: {formatCurrency((Number(costoReceta) / maxRangeReceta) * Number(selectedRecetaCantidad))}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="txtUnidadBase">Unidad Base</Label>
                      <Input
                        id="txtUnidadBase"
                        name="txtUnidadBase"
                        type="text"
                        value={selectedRecetaUnidadBase}
                        disabled
                      />
                    </div>
                    <div>
                      <label htmlFor="txtCostoReceta" className="text-sm font-medium">
                        Costo Total Sub-Receta
                      </label>
                      <Input
                        id="txtCostoReceta"
                        name="txtCostoReceta"
                        type="text"
                        value={costoReceta}
                        readOnly
                        disabled={true}
                        placeholder="Costo de la sub-receta"
                      />
                    </div>
                    <div className="md:col-span-full flex justify-end">
                      <Button
                        id="btnAgregarReceta"
                        name="btnAgregarReceta"
                        type="button"
                        onClick={handleAddReceta}
                        disabled={
                          isSubmitting ||
                          !selectedRecetaId ||
                          Number(selectedRecetaCantidad) < 1 ||
                          Number(selectedRecetaCantidad) > maxRangeReceta
                        }
                        className="bg-green-800 hover:bg-green-900 text-white"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Sub-Receta
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border mt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sub-Receta</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Costo</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recetasPlatillo.length > 0 ? (
                          recetasPlatillo.map((rec) => (
                            <TableRow key={rec.id}>
                              <TableCell>{rec.nombre}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingRecCantidad[rec.id] ?? String(rec.cantidad)}
                                  onChange={(e) => handleRecetaCantidadChange(rec.id, e.target.value)}
                                  onBlur={() => handleRecetaCantidadBlur(rec.id)}
                                  className="h-8 w-24"
                                />
                              </TableCell>
                              <TableCell>{formatCurrency(rec.recetacostoparcial)}</TableCell>
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      title="Eliminar Receta"
                                      onClick={() => setRecetaToDelete(rec.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Estás seguro de que deseas eliminar esta sub-receta de la receta?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setRecetaToDelete(null)}>
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteReceta(rec.id)}>Confirmar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              No hay sub-recetas agregadas.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                      {recetasPlatillo.length > 0 && (
                        <tfoot>
                          <tr className="border-t">
                            <td colSpan={2} className="p-2 text-right text-sm font-semibold text-gray-700">
                              Total Costo:
                            </td>
                            <td className="p-2 text-sm font-bold text-orange-600">
                              {formatCurrency(recetasPlatillo.reduce((sum, rec) => sum + (rec.recetacostoparcial || 0), 0))}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </Table>
                  </div>
                  <div className="flex items-center pt-4 justify-end">
                    <Button
                      type="button"
                      onClick={handleUpdateBasicInfo}
                      disabled={isSubmitting}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Guardar Información
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: Resumen de Precio ===== */}
        <TabsContent value="costos">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Precio</CardTitle>
              <CardDescription>Revisa los costos y establece el precio de venta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Cargando costos...</span>
                </div>
              ) : (
                <>
                  {/* Elaboración de la Receta */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Elaboración de la Receta</h3>
                    {(ingredientesPlatillo.length > 0 || recetasPlatillo.length > 0) ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[10%]">Tipo</TableHead>
                              <TableHead className="w-[25%]">Nombre</TableHead>
                              <TableHead className="w-[15%] text-right">Costo</TableHead>
                              <TableHead className="w-[15%] text-center">Unidad de Medida</TableHead>
                              <TableHead className="w-[10%] text-center text-green-600">Cantidad</TableHead>
                              <TableHead className="w-[25%] text-right text-green-600">Costo Parcial</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ingredientesPlatillo.map((ing) => (
                              <TableRow key={`ing-${ing.id}`}>
                                <TableCell className="w-[10%]">
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Ingrediente</Badge>
                                </TableCell>
                                <TableCell className="w-[25%]">{ing.nombre}</TableCell>
                                <TableCell className="w-[15%] text-right">{formatCurrency(ing.costounitario)}</TableCell>
                                <TableCell className="w-[15%] text-center">{ing.unidad || "N/A"}</TableCell>
                                <TableCell className="w-[10%] text-center text-green-600">{ing.cantidad}</TableCell>
                                <TableCell className="w-[25%] text-right text-green-600">{formatCurrency(ing.ingredientecostoparcial)}</TableCell>
                              </TableRow>
                            ))}
                            {recetasPlatillo.map((rec) => (
                              <TableRow key={`rec-${rec.id}`}>
                                <TableCell className="w-[10%]">
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">Sub-Receta</Badge>
                                </TableCell>
                                <TableCell className="w-[25%]">{rec.nombre}</TableCell>
                                <TableCell className="w-[15%] text-right">{formatCurrency(rec.recetacostoparcial / (rec.cantidad || 1))}</TableCell>
                                <TableCell className="w-[15%] text-center">N/A</TableCell>
                                <TableCell className="w-[10%] text-center text-green-600">{rec.cantidad}</TableCell>
                                <TableCell className="w-[25%] text-right text-green-600">{formatCurrency(rec.recetacostoparcial)}</TableCell>
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

                  {/* Cost summary + Price inputs */}
                  <div className="flex flex-col items-end gap-4 mt-2">
                    {/* Desglose de Costos */}
                    <div className="w-full md:w-[480px] rounded-lg border bg-white p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Desglose de Costos</h3>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Costo de Elaboración</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(totalCostoPlatillo)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Variación de Precios</span>
                        <span className="font-semibold text-gray-800">5%</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t-2 border-[#58e0be]">
                        <span className="text-sm font-bold text-gray-900">Costo Total</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(costoAdministrativoPlatillo)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-yellow-600 font-medium">* Precio Mínimo Sugerido</span>
                        <span className="font-semibold text-yellow-600">{formatCurrency(precioSugeridoPlatillo)}</span>
                      </div>
                    </div>

                    {/* Precio de Venta */}
                    <div className="w-full md:w-[480px] rounded-lg border bg-gray-50 px-4 py-3">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Precio de Venta</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor="txtPrecioVenta" className="text-[11px] text-gray-500">Precio Venta</Label>
                          <Input
                            id="txtPrecioVenta"
                            name="txtPrecioVenta"
                            type="number"
                            step="0.01"
                            value={precioVenta}
                            onChange={handlePrecioVentaChange}
                            placeholder="0.00"
                            className="text-center h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor="txtPrecioConIVA" className="text-[11px] text-gray-500">Precio con IVA</Label>
                          <Input
                            id="txtPrecioConIVA"
                            name="txtPrecioConIVA"
                            type="text"
                            value={precioConIVA}
                            readOnly
                            className="text-center h-7 text-xs"
                            placeholder="0.00"
                            disabled
                          />
                        </div>
                        <div>
                          <Label htmlFor="txtCostoPorcentual" className="text-[11px] text-gray-500">Costo %</Label>
                          <Input
                            id="txtCostoPorcentual"
                            name="txtCostoPorcentual"
                            type="text"
                            value={costoPorcentual}
                            readOnly
                            disabled
                            className={`text-center h-7 text-xs font-semibold ${
                              costoPorcentual && Number(costoPorcentual) > 30.0
                                ? "bg-red-100 border-red-300 text-red-700"
                                : "bg-green-100 border-green-300 text-green-700"
                            }`}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      id="btnActualizarCompletoPlatillo"
                      name="btnActualizarCompletoPlatillo"
                      type="button"
                      onClick={() => handleFinalUpdatePlatillo()}
                      disabled={isSubmitting || (ingredientesPlatillo.length === 0 && recetasPlatillo.length === 0)}
                      className="bg-green-800 hover:bg-green-900 text-white"
                    >
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Actualizar Receta
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== Dialogs ===== */}
      {/* Modal: precio se propagará a múltiples menús */}
      <AlertDialog open={showMultiMenuDialog} onOpenChange={setShowMultiMenuDialog}>
        <AlertDialogContent className="max-w-md p-0 overflow-hidden border-0">
          <div className="bg-gradient-to-br from-[#528A94] to-[#3a7d6a] px-6 py-6 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/25 p-3 backdrop-blur-sm shadow-lg ring-2 ring-white/30">
                <Info className="h-7 w-7" />
              </div>
              <div>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold text-white text-left">
                    Precio compartido en {multiMenuCount} menús
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-white/90 text-left mt-1">
                    Esta receta está vinculada a <strong className="text-white">{multiMenuCount} menús</strong>. El nuevo precio de venta se aplicará a todos ellos para mantener consistencia.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-white flex flex-col gap-2">
            <Button
              onClick={() => {
                setShowMultiMenuDialog(false)
                handleFinalUpdatePlatillo(true)
              }}
              disabled={isSubmitting}
              className="bg-[#5d8f72] hover:bg-[#44785a] text-white"
            >
              Continuar y actualizar todos
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowMultiMenuDialog(false)}
              disabled={isSubmitting}
              className="text-gray-500 hover:bg-gray-100"
            >
              Cancelar
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error de Validación</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-700">Actualización Exitosa</AlertDialogTitle>
            <AlertDialogDescription>
              La información de la receta ha sido actualizada correctamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)} className="bg-green-700 hover:bg-green-800">Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showIngredienteExistsDialog} onOpenChange={setShowIngredienteExistsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ingrediente ya existe</AlertDialogTitle>
            <AlertDialogDescription>
              No puedes agregar este ingrediente, ya que ya está incluido en esta receta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowIngredienteExistsDialog(false)}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRecetaExistsDialog} onOpenChange={setShowRecetaExistsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sub-Receta ya existe</AlertDialogTitle>
            <AlertDialogDescription>
              No es posible agregar esta sub-receta, puesto que ya se encuentra agregada a la receta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowRecetaExistsDialog(false)}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl">
            <div className="relative w-24 h-24 mb-4">
              <Image
                src="/images/design-mode/EditarReceta%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29(1).gif"
                alt="Procesando..."
                width={300}
                height={300}
                unoptimized
                className="absolute inset-0 animate-bounce-slow"
              />
            </div>
            <p className="text-lg font-semibold text-gray-800">Actualizando receta...</p>
            <p className="text-sm text-gray-600">Esto puede tomar unos segundos.</p>
          </div>
        </div>
      )}
    </div>
  )
}
