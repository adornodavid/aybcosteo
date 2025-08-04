"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Image from "next/image"

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

import { uploadImage, deleteImage } from "@/app/actions/recetas-image-actions"
import {
  getPlatilloTotalCost,
  searchIngredientes as searchPlatilloIngredientes,
  getRecetas as getRecetasForDropdown, // Importar la función getRecetas de platillos-wizard-actions
  getUnidadesMedidaByIngrediente, // Importar la función para obtener la unidad de medida del ingrediente
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
  cantidad: number // Añadido para la cantidad usada de la sub-receta en este platillo
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
  cantidad: number | null // Cantidad base de la receta
  tipounidadmedida: {
    descripcion: string
  } | null // Unidad base de la receta
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

  const [currentStep, setCurrentStep] = useState(1)
  const [platilloData, setPlatilloData] = useState<PlatilloData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  // Estados para AlertDialog de errores
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

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
  const [recetasDropdown, setRecetasDropdown] = useState<RecetaDropdownItem[]>([]) // Usar RecetaDropdownItem
  const [selectedRecetaId, setSelectedRecetaId] = useState<string>("")
  const [costoReceta, setCostoReceta] = useState<string>("")
  // NUEVOS ESTADOS PARA SUB-RECETAS
  const [selectedRecetaCantidad, setSelectedRecetaCantidad] = useState("1") // Para txtCantidad (number)
  const [selectedRecetaCant, setSelectedRecetaCant] = useState("1") // Para txtCant (range)
  const [selectedRecetaUnidadBase, setSelectedRecetaUnidadBase] = useState("") // Para txtUnidadBase (text)
  const [maxRangeReceta, setMaxRangeReceta] = useState(1) // Para el max del input range
  const [showConfirmDeleteReceta, setShowConfirmDeleteReceta] = useState(false)
  const [recetaToDelete, setRecetaToDelete] = useState<number | null>(null)
  const [showRecetaExistsDialog, setShowRecetaExistsDialog] = useState(false)

  const [totalCostoPlatillo, setTotalCostoPlatillo] = useState<number | null>(null)
  const [costoAdministrativoPlatillo, setCostoAdministrativoPlatillo] = useState<number | null>(null)
  const [precioSugeridoPlatillo, setPrecioSugeridoPlatillo] = useState<number | null>(null)

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
          setImageUrl(data.imgurl)
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
  }, [platilloId, router])

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
          // Usar la acción getRecetas para obtener las sub-recetas con sus detalles
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
          ) // Asegurarse de seleccionar 'cantidad'
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
              cantidad: item.cantidad, // Asignar la cantidad
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
      } catch (error) {
        console.error("Error al cargar costos para la Etapa 3:", error)
        toast.error("Error al cargar costos para el resumen.")
      } finally {
        setLoading(false)
      }
    }

    loadStep3Data()
  }, [platilloId, currentStep])

  // NUEVO EFECTO: Debounce para la búsqueda de ingredientes
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
          // NO ocultar el dropdown aquí, se controla con onBlur
        } else {
          setFilteredIngredientes([])
        }
      } else {
        setFilteredIngredientes([])
        // NO ocultar el dropdown aquí, se controla con onBlur
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [ingredienteSearchTerm, platilloId])

  // NUEVO EFECTO: Sincronizar el input de búsqueda con el ingrediente seleccionado
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
    // REMOVED: else { setIngredienteSearchTerm(""); setCostoIngrediente(""); }
    // Esta era la causa principal de que el input se limpiara al escribir sin un ingrediente seleccionado.
  }, [selectedIngredienteId, ingredientesDropdown, filteredIngredientes])

  // NUEVO EFECTO: Actualizar inputs de cantidad y unidad base para sub-recetas
  useEffect(() => {
    if (!selectedRecetaId) {
      setMaxRangeReceta(1)
      setSelectedRecetaCantidad("1")
      setSelectedRecetaCant("1")
      setSelectedRecetaUnidadBase("")
      setCostoReceta("") // Limpiar costo de receta si no hay receta seleccionada
      return
    }
    const selectedReceta = recetasDropdown.find((r) => r.id.toString() === selectedRecetaId)
    if (selectedReceta) {
      const baseCantidad = selectedReceta.cantidad && selectedReceta.cantidad > 0 ? selectedReceta.cantidad : 1
      setMaxRangeReceta(baseCantidad)
      setSelectedRecetaCantidad("1") // Reset to 1 when new recipe is selected
      setSelectedRecetaCant("1") // Reset to 1 when new recipe is selected
      setSelectedRecetaUnidadBase(selectedReceta.tipounidadmedida?.descripcion || "N/A")
      setCostoReceta(selectedReceta.costo?.toString() || "0") // Set costo de receta
    }
  }, [selectedRecetaId, recetasDropdown])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setPlatilloData((prev) => (prev ? { ...prev, [id]: value } : null))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImageUrl(platilloData?.imgurl || null)
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 25 Megabytes.")
      return
    }
    if (
      !file.type.includes("jpeg") &&
      !file.type.includes("jpg") &&
      !file.type.includes("png") &&
      !file.type.includes("webp")
    ) {
      toast.error("Solo se permiten formatos .jpg, .jpeg, .png o .webp.")
      return
    }

    setIsUploadingImage(true)
    try {
      const { data, error } = await uploadImage(file, "imagenes")
      if (error) {
        console.error("Error al subir imagen:", error)
        toast.error("Error al subir imagen: " + error.message)
        setImageUrl(platilloData?.imgurl || null)
      } else if (data) {
        setImageUrl(data.publicUrl)
        toast.success("Imagen subida correctamente.")
      }
    } catch (e: any) {
      console.error("Error inesperado al subir imagen:", e)
      toast.error("Error inesperado al subir imagen: " + e.message)
      setImageUrl(platilloData?.imgurl || null)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleDeleteImage = async () => {
    if (!imageUrl) return

    setIsUploadingImage(true)
    try {
      const { success, error } = await deleteImage(imageUrl, "imagenes")
      if (error) {
        console.error("Error al eliminar imagen:", error)
        toast.error("Error al eliminar imagen: " + error.message)
      } else if (success) {
        setImageUrl(null)
        toast.success("Imagen eliminada correctamente.")
      }
    } catch (e: any) {
      console.error("Error inesperado al eliminar imagen:", e)
      toast.error("Error inesperado al eliminar imagen: " + e.message)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleIngredienteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setIngredienteSearchTerm(term)
    // Si el usuario empieza a escribir después de haber seleccionado un ingrediente,
    // se asume que quiere buscar uno nuevo, así que se limpia el ID seleccionado.
    const selectedIng =
      ingredientesDropdown.find((i) => i.id.toString() === selectedIngredienteId) ||
      filteredIngredientes.find((i) => i.id.toString() === selectedIngredienteId)
    if (selectedIngredienteId && selectedIng && term !== `${selectedIng.codigo} - ${selectedIng.nombre}`) {
      setSelectedIngredienteId("") // Esto limpia el ID seleccionado
      setCostoIngrediente("") // También limpia el costo asociado
      setSelectedUnidadMedidaId("") // Limpiar la unidad de medida también
    }
    // Si el término de búsqueda es vacío, también limpiar el ID seleccionado
    if (term === "") {
      setSelectedIngredienteId("")
      setCostoIngrediente("")
      setSelectedUnidadMedidaId("") // Limpiar la unidad de medida también
    }
  }

  const handleSelectIngredienteFromDropdown = async (ing: DropdownItem) => {
    setSelectedIngredienteId(ing.id.toString())
    setIngredienteSearchTerm(`${ing.codigo} - ${ing.nombre}`)
    setCostoIngrediente(ing.costo?.toString() || "0")
    setShowIngredienteDropdown(false)

    // NUEVO: Obtener y establecer la unidad de medida del ingrediente seleccionado
    try {
      const units = await getUnidadesMedidaByIngrediente(ing.id)
      if (units.length > 0) {
        setSelectedUnidadMedidaId(units[0].id.toString())
      } else {
        setSelectedUnidadMedidaId("") // Limpiar si no se encuentra la unidad
      }
    } catch (error) {
      console.error("Error al obtener la unidad para el ingrediente seleccionado:", error)
      setSelectedUnidadMedidaId("") // Limpiar en caso de error
    }
  }

  // NUEVO MANEJADOR: Para el input numérico de cantidad de sub-receta
  const handleCantidadRecetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value)
    if (isNaN(value) || value < 1) {
      value = 1
    }
    if (value > maxRangeReceta) {
      value = maxRangeReceta
    }
    setSelectedRecetaCantidad(value.toString())
    setSelectedRecetaCant(value.toString()) // Sincronizar con el input de rango
  }

  // NUEVO MANEJADOR: Para el input de rango de cantidad de sub-receta
  const handleCantRecetaRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSelectedRecetaCant(value)
    setSelectedRecetaCantidad(value) // Sincronizar con el input numérico
  }

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!platilloData?.nombre || !platilloData?.descripcion) {
        setErrorMessage("Favor de llenar la información faltante (Nombre y Descripción).")
        setShowErrorDialog(true)
        return
      }

      setIsSubmitting(true)
      try {
        const { error: updateError } = await supabase
          .from("platillos")
          .update({
            nombre: platilloData.nombre,
            descripcion: platilloData.descripcion,
            imgurl: imageUrl,
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

        toast.success("Información básica de la receta actualizada correctamente.")
        setCurrentStep(2)
      } catch (error) {
        console.error("Error inesperado al actualizar receta:", error)
        toast.error("Error inesperado al actualizar receta.")
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
        setIngredienteSearchTerm("") // Clear search term after adding
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
      const recetaBaseCantidad = maxRangeReceta // This is the 'cantidad' from the recetas table

      if (isNaN(costoNum) || isNaN(cantidadIngresada) || cantidadIngresada <= 0) {
        toast.error("Valores de cantidad o costo de sub-receta inválidos.")
        setIsSubmitting(false)
        return
      }

      // NEW CALCULATION: costo / (cantidad_base_receta / cantidad_ingresada)
      const recetacostoparcial = (costoNum / recetaBaseCantidad) * cantidadIngresada

      const { data, error } = await supabase
        .from("recetasxplatillo")
        .insert({
          platilloid: platilloId,
          recetaid: Number.parseInt(selectedRecetaId),
          recetacostoparcial: recetacostoparcial, // Use the new calculated value
          cantidad: cantidadIngresada, // Store the quantity used for this platillo
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
            cantidad: data.cantidad, // Asignar la cantidad
          },
        ])
        toast.success("Sub-Receta agregada correctamente.")
        setSelectedRecetaId("")
        setCostoReceta("")
        setSelectedRecetaCantidad("1") // Reset
        setSelectedRecetaCant("1") // Reset
        setSelectedRecetaUnidadBase("") // Reset
        setMaxRangeReceta(1) // Reset
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

    setIsSubmitting(true)
    setShowAnimation(true)

    try {
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

          const { data: platillosxMenuEntries, error: platillosxMenuError } = await supabase
            .from("platillosxmenu")
            .select("id, precioventa")
            .eq("platilloid", platilloId)

          if (platillosxMenuError) {
            console.error("Error al obtener entradas de platillosxmenu para margen de utilidad:", platillosxMenuError)
            throw new Error("Error al obtener datos de platillosxmenu para el cálculo del margen de utilidad.")
          }

          if (platillosxMenuEntries && platillosxMenuEntries.length > 0) {
            for (const entry of platillosxMenuEntries) {
              if (entry.precioventa !== null) {
                const margenUtilidadCalculado = entry.precioventa - costoAdministrativoCalculado

                const { error: updateMargenUtilidadError } = await supabase
                  .from("platillosxmenu")
                  .update({ margenutilidad: margenUtilidadCalculado })
                  .eq("id", entry.id)

                if (updateMargenUtilidadError) {
                  console.error(
                    `Error al actualizar margenutilidad para platillosxmenu ID ${entry.id}:`,
                    updateMargenUtilidadError,
                  )
                  throw updateMargenUtilidadError
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

          // Get today's date in YYYY-MM-DD format for comparison with `fechacreacion`
          const today = new Date().toISOString().split("T")[0]

          for (const menuAssoc of platilloMenus) {
            // 1. Check for existing records for today for this platilloId and menuId
            const { data: existingHistorico, error: checkHistoricoError } = await supabase
              .from("historico")
              .select("idrec") // Just need to know if any exist
              .eq("platilloid", platilloId)
              .eq("menuid", menuAssoc.menuid)
              .eq("fechacreacion", today) // Assuming fechacreacion is a DATE type in DB

            if (checkHistoricoError) {
              console.error("Error checking existing historico records:", checkHistoricoError)
              throw new Error("Error al verificar registros históricos existentes.")
            }

            // 2. If records exist, perform delete
            if (existingHistorico && existingHistorico.length > 0) {
              console.log(
                `Deleting existing historico records for platilloId: ${platilloId}, menuId: ${menuAssoc.menuid}, date: ${today}`,
              )
              const { error: deleteHistoricoError } = await supabase
                .from("historico")
                .delete()
                .eq("platilloid", platilloId)
                .eq("menuid", menuAssoc.menuid)
                .eq("fechacreacion", today)

              if (deleteHistoricoError) {
                console.error("Error deleting existing historico records:", deleteHistoricoError)
                throw new Error("Error al eliminar registros históricos existentes.")
              }
            }

            let costoporcentual = null
            const precioVenta = menuAssoc.precioventa
            if (precioVenta !== null && precioVenta > 0) {
              costoporcentual = (costoAdministrativoCalculado / precioVenta) * 100
            }

            const historicoIngredientesToInsert = []
            const hotelId = menuAssoc.menus.restaurantes.hotelid
            const restauranteId = menuAssoc.menus.restaurantes.restauranteid
            const menuId = menuAssoc.menuid

            for (const ing of ingredientesPlatillo) {
              historicoIngredientesToInsert.push({
                hotelid: hotelId,
                restauranteid: restauranteId,
                menuid: menuId,
                platilloid: platilloId,
                ingredienteid: ing.ingredienteid,
                recetaid: null,
                cantidad: ing.cantidad,
                costo: ing.ingredientecostoparcial,
                activo: true,
                fechacreacion: new Date().toISOString(),
                precioventa: precioVenta,
                costoporcentual: costoporcentual, // Agregado el costoporcentual
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
                menuid: menuId,
                platilloid: platilloId,
                ingredienteid: null,
                recetaid: rec.recetaid,
                cantidad: rec.cantidad, // Usar la cantidad de la sub-receta
                costo: rec.recetacostoparcial,
                activo: true,
                fechacreacion: new Date().toISOString(),
                precioventa: precioVenta,
                costoporcentual: costoporcentual, // Agregado el costoporcentual
              })
            }

            if (historicoRecetasToInsert.length > 0) {
              const { error: insertRecetasHistoricoError } = await supabase
                .from("historico")
                .insert(historicoRecetasToInsert)
              if (insertRecetasHistoricoError) throw insertRecetasHistoricoError
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
        setSelectedRecetaCantidad("1") // Reset to 1 when new recipe is selected
        setSelectedRecetaCant("1") // Reset to 1 when new recipe is selected
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

      {/* AlertDialog para errores */}
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
                disabled={isUploadingImage}
              />
              {isUploadingImage && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo imagen...
                </div>
              )}
              {imageUrl && (
                <div className="mt-4 flex items-center space-x-4">
                  <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt="Previsualización de imagen"
                      layout="fill"
                      objectFit="cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 rounded-full h-6 w-6"
                      onClick={handleDeleteImage}
                      disabled={isUploadingImage}
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
                disabled={isSubmitting || isUploadingImage}
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
                    onFocus={() => setShowIngredienteDropdown(true)} // Mostrar dropdown al enfocar
                    onBlur={() => setTimeout(() => setShowIngredienteDropdown(false), 100)} // Ocultar con un pequeño delay
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
                {/* NUEVOS INPUTS PARA CANTIDAD Y UNIDAD BASE DE SUB-RECETA */}
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
                {/* FIN NUEVOS INPUTS */}
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
                {imageUrl && (
                  <div className="mt-4">
                    <span className="font-medium">Imagen:</span>
                    <div className="relative w-32 h-32 mt-2 border rounded-md overflow-hidden">
                      <Image
                        src={imageUrl || "/placeholder.svg"}
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
                src="https://nxtrsibnomdqmzcrwedc.supabase.co/storage/v1/object/public/imagenes/AnimationGif/EditarReceta.gif"
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
