"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase" // Ensure supabase is imported
import { toast } from "sonner"
import Image from "next/image"

import {
  getRecetaDetails,
  updateRecetaBasicInfo,
  getIngredientesByRecetaId,
  getHotelIdFromRecetaIngredients,
  getUnidadMedidaForDropdown,
  searchIngredientes,
  checkIngredienteExistsInReceta,
  addIngredienteToReceta,
  deleteIngredienteFromReceta,
  updateRecetaCostoAndHistorico,
  getRecetasForRecetaDropdown,
  getSubRecetasByRecetaId,
  checkSubRecetaExistsInReceta,
  addSubRecetaToReceta,
  deleteSubRecetaFromReceta,
} from "@/app/actions/recetas-actions"
import { uploadImage, deleteImage } from "@/app/actions/recetas-image-actions"

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
import { Slider } from "@/components/ui/slider"

interface RecetaData {
  id: number
  nombre: string
  notaspreparacion: string | null
  imgurl: string | null
  costo: number | null
  cantidad: number | null
  unidadbaseid: number | null
}

interface IngredienteReceta {
  id: number
  ingredienteid: number
  nombre: string
  cantidad: number
  ingredientecostoparcial: number
  unidadmedidadescripcion: string
}

interface DropdownItem {
  id: number
  nombre: string
  codigo: string
  costo: number | null
  unidadmedidaid: number | null // Added unidadmedidaid
}

interface UnidadMedidaItem {
  id: number
  descripcion: string
  calculoconversion: number
}

interface RecetaEditPageProps {
  params: {
    id: string
  }
}

interface Receta {
  id: number
  nombre: string
  costo: number | null
  cantidad: number | null
  unidadbaseid: number | null
}

interface SubRecetaDisplay {
  id: number
  recetaId: number
  nombre: string
  cantidad: number
  costototal: number
  ingredientecostoparcial: number
}

export default function RecetaEditPage({ params }: RecetaEditPageProps) {
  const router = useRouter()
  const recetaId = params.id

  const [currentStep, setCurrentStep] = useState(1)
  const [recetaData, setRecetaData] = useState<RecetaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  // Estados para AlertDialog de errores
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [ingredientesReceta, setIngredientesReceta] = useState<IngredienteReceta[]>([])
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

  const [totalCostoReceta, setTotalCostoReceta] = useState<number | null>(null)

  const [recetas, setRecetas] = useState<Receta[]>([])
  const [subRecetasSeleccionadas, setSubRecetasSeleccionadas] = useState<SubRecetaDisplay[]>([])
  const [ddlRecetas, setDdlRecetas] = useState("")
  const [txtCantidadReceta, setTxtCantidadReceta] = useState("")
  const [cantidadRangoReceta, setCantidadRangoReceta] = useState([1])
  const [txtCostoReceta, setTxtCostoReceta] = useState("")
  const [txtUnidadReceta, setTxtUnidadReceta] = useState("")
  const [maxCantidadReceta, setMaxCantidadReceta] = useState(1)
  const [showSubRecetaExistsDialog, setShowSubRecetaExistsDialog] = useState(false)

  const canAdvanceToStep2 = useMemo(() => {
    return recetaData?.nombre && recetaData?.notaspreparacion
  }, [recetaData])

  const canFinalizeReceta = useMemo(() => {
    return ingredientesReceta.length >= 2
  }, [ingredientesReceta])

  useEffect(() => {
    const fetchRecetaData = async () => {
      if (!recetaId) {
        toast.error("ID de receta no proporcionado.")
        setLoading(false)
        router.push("/recetas")
        return
      }

      try {
        const { data, error } = await getRecetaDetails(recetaId)

        if (error) {
          console.error("Error al cargar datos de la receta:", error)
          toast.error("Error al cargar datos de la receta.")
          router.push("/recetas")
          return
        }

        if (data) {
          setRecetaData(data)
          setImageUrl(data.imgurl)
        }
      } catch (error) {
        console.error("Error inesperado al cargar receta:", error)
        toast.error("Error inesperado al cargar receta.")
        router.push("/recetas")
      } finally {
        setLoading(false)
      }
    }

    fetchRecetaData()
  }, [recetaId, router])

  useEffect(() => {
    const loadStep2Data = async () => {
      if (!recetaId || currentStep !== 2) return

      setLoading(true)
      try {
        const { data: hotelData, error: hotelError } = await getHotelIdFromRecetaIngredients(recetaId)

        let hotelIdForDropdowns: number | null = null
        if (hotelError) {
          console.error("Error al obtener HotelId para dropdowns:", hotelError)
          toast.error("Error al cargar datos de hotel para dropdowns.")
        } else if (hotelData) {
          hotelIdForDropdowns = hotelData.id
        }

        const { data: unidadesData, error: unidadesError } = await getUnidadMedidaForDropdown()
        if (unidadesError) {
          console.error("Error al cargar unidades de medida dropdown:", unidadesError)
          toast.error("Error al cargar unidades de medida.")
        } else {
          setUnidadesMedidaDropdown(unidadesData || [])
        }

        const { data: existingIngredientes, error: ingXRecetaError } = await getIngredientesByRecetaId(recetaId)
        if (ingXRecetaError) {
          console.error("Error al cargar ingredientes de la receta:", ingXRecetaError)
          toast.error("Error al cargar ingredientes de la receta.")
        } else {
          setIngredientesReceta(existingIngredientes || [])
        }

        // Cargar recetas disponibles para agregar
        if (hotelIdForDropdowns !== null) {
          const { data: recetasData, error: recetasError } = await getRecetasForRecetaDropdown(
            hotelIdForDropdowns,
            recetaId,
          )
          if (recetasError) {
            console.error("Error al cargar recetas dropdown:", recetasError)
            toast.error("Error al cargar recetas disponibles.")
          } else {
            setRecetas(recetasData || [])
          }
        }

        // Cargar sub-recetas existentes
        const { data: existingSubRecetas, error: subRecetasError } = await getSubRecetasByRecetaId(recetaId)
        if (subRecetasError) {
          console.error("Error al cargar sub-recetas de la receta:", subRecetasError)
          toast.error("Error al cargar sub-recetas de la receta.")
        } else {
          setSubRecetasSeleccionadas(existingSubRecetas || [])
        }
      } catch (error) {
        console.error("Error inesperado al cargar datos de la Etapa 2:", error)
        toast.error("Error inesperado al cargar datos de la Etapa 2.")
      } finally {
        setLoading(false)
      }
    }

    loadStep2Data()
  }, [recetaId, currentStep])

  useEffect(() => {
    if (ddlRecetas) {
      const recetaSeleccionada = recetas.find((r) => r.id.toString() === ddlRecetas)
      if (recetaSeleccionada) {
        const maxCantidad = recetaSeleccionada.cantidad || 1
        setMaxCantidadReceta(maxCantidad)
        setTxtCostoReceta(recetaSeleccionada.costo?.toString() || "0")

        // Obtener la descripción de la unidad de medida
        const unidadMedida = unidadesMedidaDropdown.find((u) => u.id === recetaSeleccionada.unidadbaseid)
        setTxtUnidadReceta(unidadMedida?.descripcion || "Sin unidad")

        // Si la cantidad actual excede el máximo, ajustarla
        const cantidadActual = Number.parseFloat(txtCantidadReceta) || 1
        if (cantidadActual > maxCantidad) {
          setTxtCantidadReceta(maxCantidad.toString())
          setCantidadRangoReceta([maxCantidad])
        } else if (cantidadActual >= 1) {
          setCantidadRangoReceta([cantidadActual])
        } else {
          setTxtCantidadReceta("1")
          setCantidadRangoReceta([1])
        }
      }
    } else {
      setTxtCostoReceta("")
      setTxtUnidadReceta("")
      setMaxCantidadReceta(1)
      setTxtCantidadReceta("")
      setCantidadRangoReceta([1])
    }
  }, [ddlRecetas, recetas, unidadesMedidaDropdown, txtCantidadReceta])

  useEffect(() => {
    const loadStep3Data = async () => {
      if (!recetaId || currentStep !== 3) return

      setLoading(true)
      try {
        // Fetch the sum of recetacostoparcial from recetasxplatillo
        const { data: sumData, error: sumError } = await supabase
          .from("ingredientesxreceta")
          .select("ingredientecostoparcial")
          .eq("recetaid", recetaId)

        if (sumError) {
          console.error("Error al cargar costo total de sub-recetas:", sumError)
          toast.error("Error al cargar costo total de sub-recetas.")
        } else {
          const calculatedTotal = (sumData || []).reduce((sum, item) => sum + (item.ingredientecostoparcial || 0), 0)
          setTotalCostoReceta(calculatedTotal)
        }
      } catch (error) {
        console.error("Error inesperado al cargar costos para la Etapa 3:", error)
        toast.error("Error inesperado al cargar costos para el resumen.")
      } finally {
        setLoading(false)
      }
    }

    loadStep3Data()
  }, [recetaId, currentStep])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (recetaId && ingredienteSearchTerm.length >= 2) {
        const { data: hotelData, error: hotelError } = await getHotelIdFromRecetaIngredients(recetaId)

        let hotelIdForSearch: number | null = null
        if (hotelError) {
          console.error("Error al obtener HotelId para búsqueda:", hotelError)
        } else if (hotelData) {
          hotelIdForSearch = hotelData.id
        }

        if (hotelIdForSearch !== null) {
          const results = await searchIngredientes(hotelIdForSearch, ingredienteSearchTerm)
          setFilteredIngredientes(results)
          setShowIngredienteDropdown(true)
        } else {
          setFilteredIngredientes([])
        }
      } else {
        setFilteredIngredientes([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [ingredienteSearchTerm, recetaId])

  useEffect(() => {
    if (selectedIngredienteId) {
      const selected =
        ingredientesDropdown.find((i) => i.id.toString() === selectedIngredienteId) ||
        filteredIngredientes.find((i) => i.id.toString() === selectedIngredienteId)
      if (selected) {
        setIngredienteSearchTerm(`${selected.codigo} - ${selected.nombre}`)
        setCostoIngrediente(selected.costo?.toString() || "0")
        setSelectedUnidadMedidaId(selected.unidadmedidaid?.toString() || "") // Set unidadmedidaid
      }
    } else {
      // Mantener el término de búsqueda si no hay un ingrediente seleccionado
      // setIngredienteSearchTerm("")
      // setCostoIngrediente("")
      setSelectedUnidadMedidaId("") // Clear unidadmedidaid
    }
  }, [selectedIngredienteId, ingredientesDropdown, filteredIngredientes])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setRecetaData((prev) => (prev ? { ...prev, [id]: value } : null))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImageUrl(recetaData?.imgurl || null)
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
        setImageUrl(recetaData?.imgurl || null)
      } else if (data) {
        setImageUrl(data.publicUrl)
        toast.success("Imagen subida correctamente.")
      }
    } catch (e: any) {
      console.error("Error inesperado al subir imagen:", e)
      toast.error("Error inesperado al subir imagen: " + e.message)
      setImageUrl(recetaData?.imgurl || null)
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
    const selectedIng =
      ingredientesDropdown.find((i) => i.id.toString() === selectedIngredienteId) ||
      filteredIngredientes.find((i) => i.id.toString() === selectedIngredienteId)
    if (term === "") {
      // Si el término de búsqueda está vacío, limpiar selección
      setSelectedIngredienteId("")
      setCostoIngrediente("")
      setSelectedUnidadMedidaId("") // Clear unidadmedidaid
    } else if (selectedIngredienteId && selectedIng && term !== `${selectedIng.codigo} - ${selectedIng.nombre}`) {
      setSelectedIngredienteId("")
      setCostoIngrediente("")
      setSelectedUnidadMedidaId("") // Clear unidadmedidaid
    }
  }

  const handleSelectIngredienteFromDropdown = (ing: DropdownItem) => {
    setSelectedIngredienteId(ing.id.toString())
    setIngredienteSearchTerm(`${ing.codigo} - ${ing.nombre}`)
    setCostoIngrediente(ing.costo?.toString() || "0")
    setSelectedUnidadMedidaId(ing.unidadmedidaid?.toString() || "") // Set unidadmedidaid
    setShowIngredienteDropdown(false)
  }

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!recetaData?.nombre || !recetaData?.notaspreparacion) {
        setErrorMessage("Favor de llenar la información faltante (Nombre y Notas de Preparación).")
        setShowErrorDialog(true)
        return
      }

      setIsSubmitting(true)
      try {
        const { success, error } = await updateRecetaBasicInfo(
          recetaId,
          recetaData.nombre,
          recetaData.notaspreparacion,
          imageUrl,
        )

        if (error) {
          console.error("Error al actualizar receta:", error)
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
      if (!canFinalizeReceta) {
        toast.error("Debe registrar al menos 2 ingredientes para pasar al resumen.")
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
      const { data: existingIngrediente, error: checkError } = await checkIngredienteExistsInReceta(
        recetaId,
        Number.parseInt(selectedIngredienteId),
      )

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

      const { success, error } = await addIngredienteToReceta(
        recetaId,
        Number.parseInt(selectedIngredienteId),
        cantidadNum,
        selectedUnidadMedidaId,
        costoNum,
      )

      if (error) {
        console.error("Error al agregar ingrediente:", error)
        toast.error("Error al agregar ingrediente: " + error.message)
        return
      }

      if (success) {
        const { data: updatedIngredientes, error: fetchError } = await getIngredientesByRecetaId(recetaId)
        if (fetchError) {
          console.error("Error al recargar ingredientes:", fetchError)
          toast.error("Error al recargar ingredientes después de agregar.")
          return
        }
        setIngredientesReceta(updatedIngredientes || [])
        toast.success("Ingrediente agregado correctamente.")
        setSelectedIngredienteId("")
        setCantidadIngrediente("")
        setSelectedUnidadMedidaId("")
        setCostoIngrediente("")
      }
    } catch (error) {
      console.error("Error inesperado al agregar ingrediente:", error)
      toast.error("Error inesperado al agregar ingrediente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteIngrediente = async (Ingredienteid: number) => {
    
    //if (ingredienteToDelete === null) return

    setIsSubmitting(true)
    try {
      const { success, error } = await deleteIngredienteFromReceta(Ingredienteid, recetaId)

      if (error) {
        console.error("Error al eliminar ingrediente:", error)
        toast.error("Error al eliminar ingrediente: " + error.message)
        return
      }

      if (success) {
        setIngredientesReceta((prev) => prev.filter((ing) => ing.ingredienteid !== Ingredienteid))
        toast.success("Ingrediente eliminado correctamente.")
      }
    } catch (error) {
      console.error("Error inesperado al eliminar ingrediente:", error)
      toast.error("Error inesperado al eliminar ingrediente.")
    } finally {
      setShowConfirmDeleteIngrediente(false)
      setIngredienteToDelete(null)
      setIsSubmitting(false)
    }
  }

  // Función para manejar cambios en el input de cantidad de receta
  const handleCantidadRecetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    const numeroValor = Number.parseFloat(valor) || 0

    if (numeroValor > maxCantidadReceta) {
      setTxtCantidadReceta(maxCantidadReceta.toString())
      setCantidadRangoReceta([maxCantidadReceta])
      toast.warning(`La cantidad no puede exceder ${maxCantidadReceta}`)
    } else if (numeroValor < 1 && valor !== "") {
      setTxtCantidadReceta("1")
      setCantidadRangoReceta([1])
    } else {
      setTxtCantidadReceta(valor)
      if (numeroValor >= 1) {
        setCantidadRangoReceta([numeroValor])
      }
    }
  }

  // Función para manejar cambios en el slider de cantidad de receta
  const handleCantidadRangoRecetaChange = (value: number[]) => {
    const nuevaCantidad = value[0]
    setCantidadRangoReceta([nuevaCantidad])
    setTxtCantidadReceta(nuevaCantidad.toString())
  }

  const handleAddSubReceta = async () => {
    if (!ddlRecetas || !txtCantidadReceta) {
      toast.error("Favor de llenar la información de la sub-receta.")
      return
    }

    setIsSubmitting(true)
    try {
      const { data: existingSubReceta, error: checkError } = await checkSubRecetaExistsInReceta(
        recetaId,
        Number.parseInt(ddlRecetas),
      )

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error al verificar sub-receta existente:", checkError)
        toast.error("Error al verificar sub-receta existente: " + checkError.message)
        setIsSubmitting(false)
        return
      }

      if (existingSubReceta) {
        setShowSubRecetaExistsDialog(true)
        setIsSubmitting(false)
        return
      }

      const recetaSeleccionada = recetas.find((r) => r.id.toString() === ddlRecetas)
      if (!recetaSeleccionada) {
        toast.error("Sub-receta no encontrada")
        setIsSubmitting(false)
        return
      }

      const cantidad = Number.parseFloat(txtCantidadReceta)
      const costoSubReceta = recetaSeleccionada.costo || 0
      const cantidadMaxima = recetaSeleccionada.cantidad || 1

      const { success, error } = await addSubRecetaToReceta(
        recetaId,
        Number.parseInt(ddlRecetas),
        cantidad,
        costoSubReceta,
        cantidadMaxima,
      )

      if (error) {
        console.error("Error al agregar sub-receta:", error)
        toast.error("Error al agregar sub-receta: " + error.message)
        return
      }

      if (success) {
        const { data: updatedSubRecetas, error: fetchError } = await getSubRecetasByRecetaId(recetaId)
        if (fetchError) {
          console.error("Error al recargar sub-recetas:", fetchError)
          toast.error("Error al recargar sub-recetas después de agregar.")
          return
        }
        setSubRecetasSeleccionadas(updatedSubRecetas || [])
        toast.success("Sub-receta agregada correctamente.")
        setDdlRecetas("")
        setTxtCantidadReceta("")
        setCantidadRangoReceta([1])
        setTxtCostoReceta("")
        setTxtUnidadReceta("")
        setMaxCantidadReceta(1)
      }
    } catch (error) {
      console.error("Error inesperado al agregar sub-receta:", error)
      toast.error("Error inesperado al agregar sub-receta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubReceta = async (subRecetaId: number) => {
    setIsSubmitting(true)
    try {
      const { success, error } = await deleteSubRecetaFromReceta(subRecetaId, recetaId)

      if (error) {
        console.error("Error al eliminar sub-receta:", error)
        toast.error("Error al eliminar sub-receta: " + error.message)
        return
      }

      if (success) {
        setSubRecetasSeleccionadas((prev) => prev.filter((rec) => rec.recetaId !== subRecetaId))
        toast.success("Sub-receta eliminada correctamente.")
      }
    } catch (error) {
      console.error("Error inesperado al eliminar sub-receta:", error)
      toast.error("Error inesperado al eliminar sub-receta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalUpdateReceta = async () => {
    if (!recetaId) {
      toast.error("ID de receta no proporcionado para la actualización final.")
      return
    }

    if (!canFinalizeReceta) {
      toast.error("Debe registrar al menos 2 ingredientes para finalizar la actualización de la receta.")
      return
    }

    setIsSubmitting(true)
    setShowAnimation(true)

    try {
      const [result] = await Promise.all([
        updateRecetaCostoAndHistorico(recetaId),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ])

      if (result.success) {
        toast.success(
          "Receta Actualizada correctamente, Se actualizó la información así como el nuevo costo de la receta",
        )
        router.push("/recetas")
      } else {
        toast.error("Error al actualizar costo total de la receta o histórico: " + result.error?.message)
      }
    } catch (error: any) {
      console.error("Error inesperado al actualizar costo total de la receta o histórico:", error)
      toast.error("Error inesperado al actualizar costo total de la receta o histórico: " + error.message)
    } finally {
      setShowAnimation(false)
      setIsSubmitting(false)
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

  if (!recetaData) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 text-center">
        <h1 className="text-2xl font-bold">Receta no encontrada.</h1>
        <Button onClick={() => router.push("/recetas")} className="mt-4">
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
        <h1 className="text-3xl font-bold tracking-tight">Actualizar Sub-Receta</h1>
        <Button
          id="btnRegresarActRecetas"
          name="btnRegresarActRecetas"
          type="button"
          variant="outline"
          onClick={() => router.push("/recetas")}
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
            <CardTitle>Etapa 1: Actualizar Información Básica de la Sub-Receta</CardTitle>
            <CardDescription>Actualiza los detalles principales de tu sub-receta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="nombre" className="text-sm font-medium">
                Nombre de la Sub-Receta
              </label>
              <Input
                id="nombre"
                name="txtNombreRecetaActualizar"
                type="text"
                maxLength={150}
                value={recetaData.nombre || ""}
                onChange={handleInputChange}
                placeholder="Nombre de la sub-receta"
              />
            </div>
            <div>
              <label htmlFor="notaspreparacion" className="text-sm font-medium">
                Notas de Preparación
              </label>
              <Textarea
                id="notaspreparacion"
                name="txtNotasRecetaActualizar"
                maxLength={500}
                value={recetaData.notaspreparacion || ""}
                onChange={handleInputChange}
                placeholder="Instrucciones detalladas para la preparación"
                className="min-h-[100px]"
              />
            </div>
            <div>
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
                id="btnActualizarReceta"
                name="btnActualizarReceta"
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
              <CardTitle>Etapa 2: Ingredientes de la Sub-Receta</CardTitle>
              <CardDescription>Agrega, actualiza o elimina ingredientes de tu sub-receta.</CardDescription>
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
                    {ingredientesReceta.length > 0 ? (
                      ingredientesReceta.map((ing) => (
                        <TableRow key={ing.id}>
                          <TableCell>{ing.nombre}</TableCell>
                          <TableCell>{ing.cantidad}</TableCell>
                          <TableCell>{ing.unidadmedidadescripcion}</TableCell>
                          <TableCell>{formatCurrency(ing.ingredientecostoparcial)}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  title="Eliminar Ingrediente"
                                  //onClick={() => setIngredienteToDelete(ing.ingredienteid)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que deseas eliminar este ingrediente de la receta?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setIngredienteToDelete(null)}>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction  onClick={() => handleDeleteIngrediente(ing.ingredienteid)}>Confirmar</AlertDialogAction>
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

          {/* Nueva sección para agregar sub-recetas */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">Agregar Sub-Receta</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="ddlRecetas" className="text-sm font-medium">
                  Sub-Receta
                </label>
                <Select name="ddlRecetas" value={ddlRecetas} onValueChange={setDdlRecetas}>
                  <SelectTrigger id="ddlRecetas">
                    <SelectValue placeholder="Seleccionar sub-receta" />
                  </SelectTrigger>
                  <SelectContent>
                    {recetas.map((receta) => (
                      <SelectItem key={receta.id} value={receta.id.toString()}>
                        {receta.nombre} - {formatCurrency(receta.costo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="txtCostoReceta" className="text-sm font-medium">
                  Costo
                </label>
                <Input
                  type="text"
                  id="txtCostoReceta"
                  name="txtCostoReceta"
                  value={txtCostoReceta}
                  disabled
                  placeholder="Seleccione una sub-receta"
                />
              </div>
              <div>
                <label htmlFor="txtUnidadReceta" className="text-sm font-medium">
                  Unidad
                </label>
                <Input
                  type="text"
                  id="txtUnidadReceta"
                  name="txtUnidadReceta"
                  value={txtUnidadReceta}
                  disabled
                  placeholder="Seleccione una sub-receta"
                />
              </div>
            </div>

            {ddlRecetas && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="txtCantidadReceta" className="text-sm font-medium">
                    Cantidad
                  </label>
                  <Input
                    type="number"
                    id="txtCantidadReceta"
                    name="txtCantidadReceta"
                    value={txtCantidadReceta}
                    onChange={handleCantidadRecetaChange}
                    min="1"
                    max={maxCantidadReceta}
                    step="any"
                    placeholder={`Máximo: ${maxCantidadReceta}`}
                  />
                </div>
                <div>
                  <label htmlFor="cantidadRangoReceta" className="text-sm font-medium">
                    Cantidad Rango: {cantidadRangoReceta[0]}
                  </label>
                  <div className="px-2 py-2">
                    <Slider
                      id="cantidadRangoReceta"
                      min={1}
                      max={maxCantidadReceta}
                      step={0.1}
                      value={cantidadRangoReceta}
                      onValueChange={handleCantidadRangoRecetaChange}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1</span>
                      <span>{maxCantidadReceta}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                type="button"
                id="btnAgregarSubReceta"
                name="btnAgregarSubReceta"
                onClick={handleAddSubReceta}
                disabled={isSubmitting}
                className="bg-blue-800 hover:bg-blue-900 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Sub-Receta
              </Button>
            </div>

            {/* Tabla de sub-recetas seleccionadas */}
            {subRecetasSeleccionadas.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-3">Sub-Recetas Agregadas</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Costo Parcial</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subRecetasSeleccionadas.map((receta) => (
                        <TableRow key={receta.id}>
                          <TableCell>{receta.nombre}</TableCell>
                          <TableCell>{receta.cantidad}</TableCell>
                          <TableCell>{formatCurrency(receta.ingredientecostoparcial)}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" title="Eliminar Sub-Receta">
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
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSubReceta(receta.recetaId)}>
                                    Confirmar       
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

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
              disabled={isSubmitting || !canFinalizeReceta}
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
              <CardTitle>Etapa 3: Resumen de la Sub-Receta</CardTitle>
              <CardDescription>Revisa la información y los costos de tu sub-receta antes de finalizar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Información Básica</h3>
                <p>
                  <span className="font-medium">Nombre:</span> {recetaData?.nombre}
                </p>
                <p>
                  <span className="font-medium">Notas de Preparación:</span> {recetaData?.notaspreparacion}
                </p>
                {imageUrl && (
                  <div className="mt-4">
                    <span className="font-medium">Imagen:</span>
                    <div className="relative w-32 h-32 mt-2 border rounded-md overflow-hidden">
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt="Imagen de la receta"
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Ingredientes Agregados</h3>
                {ingredientesReceta.length > 0 ? (
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
                        {ingredientesReceta.map((ing) => (
                          <TableRow key={ing.id}>
                            <TableCell>{ing.nombre}</TableCell>
                            <TableCell>{ing.cantidad}</TableCell>
                            <TableCell>{ing.unidadmedidadescripcion}</TableCell>
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

              {/* Tabla de sub-recetas en el resumen */}
              {subRecetasSeleccionadas.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Sub-Recetas Agregadas</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Costo Parcial</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subRecetasSeleccionadas.map((receta) => (
                          <TableRow key={receta.id}>
                            <TableCell>{receta.nombre}</TableCell>
                            <TableCell>{receta.cantidad}</TableCell>
                            <TableCell>{formatCurrency(receta.ingredientecostoparcial)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="mt-2 text-right text-xl font-semibold text-gray-700">
                  Costo Total de la Sub-Receta: {formatCurrency(totalCostoReceta)}
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
              id="btnActualizarCompletoReceta"
              name="btnActualizarCompletoReceta"
              type="button"
              onClick={handleFinalUpdateReceta}
              disabled={isSubmitting || !canFinalizeReceta}
              className="bg-green-800 hover:bg-green-900 text-white"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Actualizar Sub-Receta Completa
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={showIngredienteExistsDialog} onOpenChange={setShowIngredienteExistsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ingrediente ya existe</AlertDialogTitle>
            <AlertDialogDescription>
              No puedes agregar este ingrediente, ya que ya está incluido en esta sub-receta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowIngredienteExistsDialog(false)}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubRecetaExistsDialog} onOpenChange={setShowSubRecetaExistsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sub-receta ya existe</AlertDialogTitle>
            <AlertDialogDescription>
              No puedes agregar esta sub-receta, ya que ya está incluida en esta sub-receta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSubRecetaExistsDialog(false)}>Aceptar</AlertDialogAction>
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
            <p className="text-lg font-semibold text-gray-800">Actualizando sub-receta...</p>
            <p className="text-sm text-gray-600">Esto puede tomar unos segundos.</p>
          </div>
        </div>
      )}
    </div>
  )
}
