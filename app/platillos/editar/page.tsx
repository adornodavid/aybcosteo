"use client"

/* ==================================================
  Imports
================================================== */
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid" // Importar uuidv4

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
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
import { Loader2, ArrowLeft, PlusCircle, Trash2, XCircle } from "lucide-react"

import { deleteImage } from "@/app/actions/recetas-image-actions" // Mantener deleteImage
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
}

interface RecetaPlatillo {
  id: number
  recetaid: number
  nombre: string
  recetacostoparcial: number
  cantidad: number
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

export default function EditarPlatilloPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platilloId = searchParams.get("getPlatilloId")
  //const menuId = searchParams.get("getMenuId") // Obtener menuId de los parámetros
  const menuNombre = searchParams.get("getMenuNombre")

  const [currentStep, setCurrentStep] = useState(1)
  const [platilloData, setPlatilloData] = useState<PlatilloData | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  // Estados para AlertDialog de errores
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Estados para manejo de imagen
  const [imageUrl, setImageUrl] = useState<string | null>(null) // URL de la imagen guardada en DB
  const [imagenPreview, setImagenPreview] = useState<string | null>(null) // URL para previsualización local
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null) // Archivo de imagen seleccionado

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

  // Nuevos estados para los inputs adicionales
  const [precioVenta, setPrecioVenta] = useState<string>("")
  const [costoPorcentual, setCostoPorcentual] = useState<string>("")
  const [precioConIVA, setPrecioConIVA] = useState<string>("")

  const canAdvanceToStep2 = useMemo(() => {
    return platilloData?.nombre && platilloData?.descripcion
  }, [platilloData])

  const canFinalizePlatillo = useMemo(() => {
    return ingredientesPlatillo.length >= 2
  }, [ingredientesPlatillo])

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
          setImageUrl(data.imgurl) // Establecer la URL de la imagen guardada
          setImagenPreview(data.imgurl) // También establecer la previsualización inicial
        }
		
    console.log("nombre", menuNombre)
		// Obtener el menuId basándose en el nombre del menú si se proporciona
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
            console.log("MenuId obtenido:", menuData.id)
          }
        } else {
          // Si no se proporciona menuNombre, intentar obtener el primer menú asociado al platillo
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
            console.log("MenuId obtenido desde platillosxmenu:", platilloMenuData.menuid)
          }
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

  useEffect(() => {
    const loadStep2Data = async () => {
      if (!platilloId || currentStep !== 2) return

      setLoading(true)
      try {
        const { data: hotelData, error: hotelError } = await supabase
          .from("platillosxmenu")
          .select(
            `
            menus!inner(
              restaurantes!inner(
                hoteles!inner(id)
              )
            )
          `,
          )
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
          .select(
            `
          id, cantidad, ingredientecostoparcial,
          ingredientes(id, nombre, tipounidadmedida(descripcion), codigo, costo)
        `,
          )
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
            })),
          )
        }

        const { data: existingRecetas, error: recXPlatilloError } = await supabase
          .from("recetasxplatillo")
          .select(
            `
          id, recetacostoparcial, cantidad,
          recetas(id, nombre)
        `,
          )
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
            })),
          )
        }
      } catch (error) {
        console.error("Error inesperado al cargar datos de la Etapa 2:", error)
        toast.error("Error inesperado al cargar datos de la Etapa 2.")
      } finally {
        setLoading(false)
      }
    }

    loadStep2Data()
  }, [platilloId, currentStep])

  useEffect(() => {
    const loadStep3Data = async () => {
      if (!platilloId || currentStep !== 3) return

      setLoading(true)
      try {
        const { totalCost, costoAdministrativo, precioSugerido } = await getPlatilloTotalCost(Number(platilloId))
        setTotalCostoPlatillo(totalCost)
        setCostoAdministrativoPlatillo(costoAdministrativo)
        setPrecioSugeridoPlatillo(precioSugerido)

        // Cargar precio de venta existente si existe
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
            // Calcular automáticamente los otros valores

            /*const costoPorcentualCalculado = calcularCostoPorcentual(
              costoAdministrativo || 0,
              platilloMenuData.precioventa,
            )
            */
            console.log("wwwwa", menuId)
            console.log("wa", platilloMenuData.precioventa)

            const precioConIVACalculado = platilloMenuData.precioventa * 0.16 + platilloMenuData.precioventa
            setPrecioConIVA(precioConIVACalculado.toFixed(2))
            //const precioConIVACalculado = calcularPrecioConIVA(platilloMenuData.precioventa)
            //setCostoPorcentual(costoPorcentualCalculado.toFixed(2))
            //setPrecioConIVA(precioConIVACalculado.toFixed(2))
          }
          if (platilloMenuData.precioconiva) {
            setPrecioConIVA(platilloMenuData.precioconiva.toString())
          }
        }
      } catch (error) {
        console.error("Error al cargar costos para la Etapa 3:", error)
        toast.error("Error al cargar costos para el resumen.")
      } finally {
        setLoading(false)
      }
    }

    loadStep3Data()
  }, [platilloId, currentStep])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (platilloId && ingredienteSearchTerm.length >= 2) {
        const { data: hotelData, error: hotelError } = await supabase
          .from("platillosxmenu")
          .select(
            `
            menus!inner(
              restaurantes!inner(
                hoteles!inner(id)
              )
            )
          `,
          )
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
      //const costoPorcentualCalculado = calcularCostoPorcentual(costoAdministrativoPlatillo, precioVentaNum)
      //const precioConIVACalculado = calcularPrecioConIVA(precioVentaNum)

      //setCostoPorcentual(costoPorcentualCalculado.toFixed(2))
      //setPrecioConIVA(precioConIVACalculado.toFixed(2))
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

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!platilloData?.nombre || !platilloData?.descripcion) {
        setErrorMessage("Favor de llenar la información faltante (Nombre y Descripción).")
        setShowErrorDialog(true)
        return
      }

      setIsSubmitting(true)
      let finalImgUrl = platilloData.imgurl

      try {
        // Lógica de carga de imagen similar a registrarPlatilloBasico
        if (selectedImageFile) {
          const fileExt = selectedImageFile.name.split(".").pop()
          const fileName = `${uuidv4()}.${fileExt}`
          const filePath = `Platillos/${fileName}` // Usar la carpeta "Platillos"

          const { error: uploadError } = await supabase.storage.from("imagenes").upload(filePath, selectedImageFile)
          if (uploadError) {
            throw new Error(`Error al subir imagen: ${uploadError.message}`)
          }

          const { data: urlData } = supabase.storage.from("imagenes").getPublicUrl(filePath)
          finalImgUrl = urlData.publicUrl
          toast.success("Nueva imagen subida correctamente.")
        } else if (imagenPreview === null && platilloData.imgurl !== null) {
          // Si la previsualización es nula y había una imagen original, significa que se eliminó
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
        setSelectedImageFile(null)
        setImagenPreview(finalImgUrl)

        toast.success("Información básica de la receta actualizada correctamente.")
        setCurrentStep(2)
      } catch (error: any) {
        console.error("Error inesperado al actualizar receta:", error)
        toast.error("Error inesperado al actualizar receta: " + error.message)
      } finally {
        setIsSubmitting(false)
      }
    } else if (currentStep === 2) {
      if (ingredientesPlatillo.length === 0 && recetasPlatillo.length === 0) {
        toast.error("Debe registrar al menos 1 ingrediente o 1 sub-receta para pasar al resumen.")
        return
      }
      setCurrentStep(3)
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handleIngredienteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setIngredienteSearchTerm(term)
    const selectedIng =
      ingredientesDropdown.find((i) => i.id.toString() === selectedIngredienteId) ||
      filteredIngredientes.find((i) => i.id.toString() === selectedIngredienteId)
    if (selectedIngredienteId && selectedIng && term !== `${selectedIng.codigo} - ${selected.nombre}`) {
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
        .select(
          `
        id, cantidad, ingredientecostoparcial,
        ingredientes(id, nombre, tipounidadmedida(descripcion))
      `,
        )
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
          },
        ])
        toast.success("Ingrediente agregado correctamente.")
        setSelectedIngredienteId("")
        setCantidadIngrediente("")
        setSelectedUnidadMedidaId("")
        setCostoIngrediente("")
        setIngredienteSearchTerm("")
      }
    } catch (error) {
      console.error("Error inesperado al agregar ingrediente:", error)
      toast.error("Error inesperado al agregar ingrediente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteIngrediente = async () => {
    if (ingredienteToDelete === null) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("ingredientesxplatillo").delete().eq("id", ingredienteToDelete)

      if (error) {
        console.error("Error al eliminar ingrediente:", error)
        toast.error("Error al eliminar ingrediente: " + error.message)
        return
      }

      setIngredientesPlatillo((prev) => prev.filter((ing) => ing.id !== ingredienteToDelete))
      toast.success("Ingrediente eliminado correctamente.")
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
        .select(
          `
          id, recetacostoparcial, cantidad,
          recetas(id, nombre)
        `,
        )
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
          },
        ])
        toast.success("Sub-Receta agregada correctamente.")
        setSelectedRecetaId("")
        setCostoReceta("")
        setSelectedRecetaCantidad("1")
        setSelectedRecetaCant("1")
        setSelectedRecetaUnidadBase("")
        setMaxRangeReceta(1)
      }
    } catch (error) {
      console.error("Error inesperado al agregar sub-receta:", error)
      toast.error("Error inesperado al agregar sub-receta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReceta = async () => {
    if (recetaToDelete === null) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("recetasxplatillo").delete().eq("id", recetaToDelete)

      if (error) {
        console.error("Error al eliminar sub-receta:", error)
        toast.error("Error al eliminar sub-receta: " + error.message)
        return
      }

      setRecetasPlatillo((prev) => prev.filter((rec) => rec.id !== recetaToDelete))
      toast.success("Sub-Receta eliminada correctamente.")
    } catch (error) {
      console.error("Error inesperado al eliminar sub-receta:", error)
      toast.error("Error inesperado al eliminar sub-receta.")
    } finally {
      setShowConfirmDeleteReceta(false)
      setRecetaToDelete(null)
      setIsSubmitting(false)
    }
  }

  const handleFinalUpdatePlatillo = async () => {
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

          // Actualizar platillosxmenu solo para el menuId específico si se proporciona
          console.log("menu",menuId)
          if (menuId) {
            const margenUtilidadCalculado = precioVentaNum - costoAdministrativoCalculado

            const { error: updatePlatillosxMenuError } = await supabase
              .from("platillosxmenu")
              .update({
                precioventa: precioVentaNum,
                precioconiva: precioConIVANum,
                margenutilidad: margenUtilidadCalculado,
              })
              .eq("platilloid", platilloId)
              .eq("menuid", menuId)

            if (updatePlatillosxMenuError) {
              console.error(`Error al actualizar platillosxmenu para menuId ${menuId}:`, updatePlatillosxMenuError)
              throw updatePlatillosxMenuError
            }
          } else {
            // Si no hay menuId específico, actualizar todos los registros del platillo
            const { data: platillosxMenuEntries, error: platillosxMenuError } = await supabase
              .from("platillosxmenu")
              .select("id")
              .eq("platilloid", platilloId)

            if (platillosxMenuError) {
              console.error("Error al obtener entradas de platillosxmenu:", platillosxMenuError)
              throw new Error("Error al obtener datos de platillosxmenu.")
            }

            if (platillosxMenuEntries && platillosxMenuEntries.length > 0) {
              for (const entry of platillosxMenuEntries) {
                const margenUtilidadCalculado = precioVentaNum - costoAdministrativoCalculado

                const { error: updatePlatillosxMenuError } = await supabase
                  .from("platillosxmenu")
                  .update({
                    precioventa: precioVentaNum,
                    precioconiva: precioConIVANum,
                    margenutilidad: margenUtilidadCalculado,
                  })
                  .eq("id", entry.id)

                if (updatePlatillosxMenuError) {
                  console.error(`Error al actualizar platillosxmenu para ID ${entry.id}:`, updatePlatillosxMenuError)
                  throw updatePlatillosxMenuError
                }
              }
            }
          }

          const { data: platilloMenus, error: platilloMenusError } = await supabase
            .from("platillosxmenu")
            .select(
              `
            precioventa,
            menuid,
            menus!inner(
              restauranteid,
              restaurantes!inner(hotelid)
            )
          `,
            )
            .eq("platilloid", platilloId)

          if (platilloMenusError) throw platilloMenusError

          const today = new Date()
          const currentMonth = today.getMonth() + 1 // getMonth() returns 0-11, so add 1
          const currentYear = today.getFullYear()

          for (const menuAssoc of platilloMenus) {
            const hotelId = menuAssoc.menus.restaurantes.hotelid
            const restauranteId = menuAssoc.menus.restaurantes.restauranteid
            const menuIdAssoc = menuAssoc.menuid
            const PrecioAssoc = menuAssoc.precioventa

             const CostoAssoc = ((costoAdministrativoCalculado / PrecioAssoc)*100)
            // Verificar si existe registro del mismo mes para este platilloid y menuid
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
              // Existe registro del mismo mes - BORRAR y volver a INSERTAR
              console.log(
                `Deleting and re-inserting historico records for platilloId: ${platilloId}, menuId: ${menuIdAssoc}, month: ${currentMonth}/${currentYear}`,
              )

              // Borrar todos los registros del mismo mes para este platilloid y menuid
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

              // Insertar nuevos registros con datos actualizados
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
              // No existe registro del mismo mes - hacer INSERT
              console.log(
                `Inserting new historico records for platilloId: ${platilloId}, menuId: ${menuIdAssoc}, month: ${currentMonth}/${currentYear}`,
              )

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
        toast.success(
          "Receta Actualizada correctamente, Se actualizó la información así como el nuevo costo de la receta",
        )
        router.push("/platillos")
      }
    } catch (error: any) {
      console.error("Error al actualizar costo total de la receta o histórico:", error)
      toast.error("Error al actualizar costo total de la receta o histórico: " + error.message)
    } finally {
      setShowAnimation(false)
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

  if (loading) {
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

  const formatCurrency = (amount: number | null) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount || 0)

  return (
    <div className="container mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Actualizar Receta</h1>
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

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 1: Actualizar Información Básica del a Receta</CardTitle>
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
            <div className="flex items-center p-6 pt-4 justify-end">
              <Button
                id="btnActualizarPlatillo"
                name="btnActualizarPlatillo"
                type="button"
                onClick={handleNextStep}
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Actualizar y Siguiente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Etapa 2: Ingredientes de la Receta</CardTitle>
              <CardDescription>Agrega, actualiza o elimina ingredientes de tu receta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          <TableCell>{ing.cantidad}</TableCell>
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
                                  <AlertDialogAction onClick={handleDeleteIngrediente}>Confirmar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No hay ingredientes agregados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sub-Recetas de la Receta</CardTitle>
              <CardDescription>Agrega, actualiza o elimina sub-recetas de tu receta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                <div className="col-span-2">
                  <Label htmlFor="txtCant">Rango de Cantidad</Label>
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
                    Costo Sub-Receta
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
                          <TableCell>{rec.cantidad}</TableCell>
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
                                  <AlertDialogAction onClick={handleDeleteReceta}>Confirmar</AlertDialogAction>
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
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting || (ingredientesPlatillo.length === 0 && recetasPlatillo.length === 0)}
              className="bg-black text-white hover:bg-gray-800"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Etapa 3: Resumen de la Receta</CardTitle>
              <CardDescription>Revisa la información y los costos de tu receta antes de finalizar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Información Básica</h3>
                <p>
                  <span className="font-medium">Nombre:</span> {platilloData?.nombre}
                </p>
                <p>
                  <span className="font-medium">Descripción:</span> {platilloData?.descripcion}
                </p>
                {platilloData?.instruccionespreparacion && (
                  <p>
                    <span className="font-medium">Instrucciones:</span> {platilloData.instruccionespreparacion}
                  </p>
                )}
                {platilloData?.tiempopreparacion && (
                  <p>
                    <span className="font-medium">Tiempo de Preparación:</span> {platilloData.tiempopreparacion}
                  </p>
                )}
                {(imagenPreview || imageUrl) && (
                  <div className="mt-4">
                    <span className="font-medium">Imagen:</span>
                    <div className="relative w-32 h-32 mt-2 border rounded-md overflow-hidden">
                      <Image
                        src={imagenPreview || imageUrl || "/placeholder.svg"}
                        alt="Imagen del platillo"
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Ingredientes Agregados</h3>
                {ingredientesPlatillo.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead>Costo Parcial</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ingredientesPlatillo.map((ing) => (
                          <TableRow key={ing.id}>
                            <TableCell>{ing.nombre}</TableCell>
                            <TableCell>{ing.cantidad}</TableCell>
                            <TableCell>{ing.unidad}</TableCell>
                            <TableCell>{formatCurrency(ing.ingredientecostoparcial)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay ingredientes agregados.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Sub-Recetas Agregadas</h3>
                {recetasPlatillo.length > 0 ? (
                  <div className="rounded-md border">
                    <Table className="table-fixed w-full caption-bottom text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-64 h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                            Sub-Receta
                          </TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead className="w-16 h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                            Costo
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recetasPlatillo.map((rec) => (
                          <TableRow key={rec.id}>
                            <TableCell>{rec.nombre}</TableCell>
                            <TableCell>{rec.cantidad}</TableCell>
                            <TableCell>{formatCurrency(rec.recetacostoparcial)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay sub-recetas agregadas.</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="mt-2 text-right text-xl font-semibold text-gray-700">
                  Costo de Elaboracion: {formatCurrency(totalCostoPlatillo)}
                </p>
                <h3 className="text-right text-base font-semibold text-gray-700">Variacion de Precios: 5%</h3>
                <p className="mt-6 text-right text-2xl font-bold border-t-4 border-[#58e0be] pt-4">
                  Costo Total: {formatCurrency(costoAdministrativoPlatillo)}
                </p>
                <p className="mt-6 text-right text-lg text-black-600">
                  <span className="text-yellow-600">*</span>Precio Mínimo: {formatCurrency(precioSugeridoPlatillo)}
                </p>
              </div>

              {/* Nuevos inputs agregados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 border rounded-lg bg-gray-50">
                <div>
                  <Label htmlFor="txtCostoPorcentual">Costo%</Label>
                  <Input
                    id="txtCostoPorcentual"
                    name="txtCostoPorcentual"
                    type="text"
                    value={costoPorcentual}
                    readOnly
                    disabled
                    className={`text-center ${
                      costoPorcentual && Number(costoPorcentual) > 30.0
                        ? "bg-red-100 border-red-300"
                        : "bg-green-100 border-green-300"
                    }`}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="txtPrecioVenta">Precio Venta</Label>
                  <Input
                    id="txtPrecioVenta"
                    name="txtPrecioVenta"
                    type="number"
                    step="0.01"
                    value={precioVenta}
                    onChange={handlePrecioVentaChange}
                    placeholder="0.00"
                    className="text-center"
                  />
                </div>
                <div className="col-span-1"></div>
                <div className="col-span-1">
                  <Label htmlFor="txtPrecioConIVA">Precio con IVA</Label>
                  <Input
                    id="txtPrecioConIVA"
                    name="txtPrecioConIVA"
                    type="text"
                    value={precioConIVA}
                    readOnly
                    className="text-center"
                    placeholder="0.00"
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button
              id="btnActualizarCompletoPlatillo"
              name="btnActualizarCompletoPlatillo"
              type="button"
              onClick={handleFinalUpdatePlatillo}
              disabled={isSubmitting || (ingredientesPlatillo.length === 0 && recetasPlatillo.length === 0)}
              className="bg-green-800 hover:bg-green-900 text-white"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Actualizar Receta Completa
            </Button>
          </div>
        </div>
      )}

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
