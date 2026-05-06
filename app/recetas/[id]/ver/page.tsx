"use client"

/* ==================================================
  Imports
================================================== */
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
  updateIngredienteCantidadEnReceta,
  updateSubRecetaCantidadEnReceta,
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
import { Loader2, ArrowLeft, PlusCircle, Trash2, XCircle, CheckCircle2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

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
  const [activeTab, setActiveTab] = useState("informacion")
  const [recetaData, setRecetaData] = useState<RecetaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  // Estados para AlertDialog de errores
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Estado para modal de éxito
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

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

  // ===== Edición inline de cantidad en tablas =====
  const [editingIngCantidad, setEditingIngCantidad] = useState<Record<number, string>>({})
  const [editingSubCantidad, setEditingSubCantidad] = useState<Record<number, string>>({})

  const canAdvanceToStep2 = useMemo(() => {
    return recetaData?.nombre && recetaData?.notaspreparacion
  }, [recetaData])

  const canFinalizeReceta = useMemo(() => {
    return ingredientesReceta.length >= 1
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
      if (!recetaId) return

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
  }, [recetaId])

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
      if (!recetaId) return

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
  }, [recetaId])

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

  const handleSaveBasicInfo = async () => {
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
        return
      }

      setSuccessMessage("La información básica de la sub-receta se guardó correctamente.")
      setShowSuccessDialog(true)
      setTimeout(() => setShowSuccessDialog(false), 2500)
    } catch (error) {
      console.error("Error inesperado al actualizar receta:", error)
      toast.error("Error inesperado al actualizar receta.")
    } finally {
      setIsSubmitting(false)
    }
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

  // ===== Edición inline de cantidad de ingredientes en tabla =====
  const handleIngCantidadChange = (ingredienteid: number, value: string) => {
    setEditingIngCantidad((prev) => ({ ...prev, [ingredienteid]: value }))
  }

  const handleIngCantidadBlur = async (ingredienteid: number) => {
    const draft = editingIngCantidad[ingredienteid]
    if (draft === undefined) return
    const num = Number.parseFloat(draft)
    const ing = ingredientesReceta.find((i) => i.ingredienteid === ingredienteid)
    if (!ing) return
    if (Number.isNaN(num) || num <= 0) {
      toast.error("Cantidad inválida.")
      setEditingIngCantidad((prev) => {
        const { [ingredienteid]: _omit, ...rest } = prev
        return rest
      })
      return
    }
    if (num === ing.cantidad) {
      setEditingIngCantidad((prev) => {
        const { [ingredienteid]: _omit, ...rest } = prev
        return rest
      })
      return
    }

    const result = await updateIngredienteCantidadEnReceta(recetaId, ingredienteid, num)
    if (!result.success) {
      toast.error("Error al actualizar cantidad: " + (result.error?.message || ""))
      setEditingIngCantidad((prev) => {
        const { [ingredienteid]: _omit, ...rest } = prev
        return rest
      })
      return
    }
    setIngredientesReceta((prev) =>
      prev.map((i) =>
        i.ingredienteid === ingredienteid
          ? { ...i, cantidad: num, ingredientecostoparcial: result.nuevoParcial ?? i.ingredientecostoparcial }
          : i,
      ),
    )
    setTotalCostoReceta((prev) => {
      const sumIng = ingredientesReceta.reduce(
        (acc, i) => acc + (i.ingredienteid === ingredienteid ? (result.nuevoParcial ?? 0) : i.ingredientecostoparcial),
        0,
      )
      const sumSub = subRecetasSeleccionadas.reduce((acc, s) => acc + s.ingredientecostoparcial, 0)
      return sumIng + sumSub
    })
    setEditingIngCantidad((prev) => {
      const { [ingredienteid]: _omit, ...rest } = prev
      return rest
    })
    toast.success("Cantidad de ingrediente actualizada.")
  }

  // ===== Edición inline de cantidad de sub-recetas en tabla =====
  const handleSubCantidadChange = (subRecetaId: number, value: string) => {
    setEditingSubCantidad((prev) => ({ ...prev, [subRecetaId]: value }))
  }

  const handleSubCantidadBlur = async (subRecetaId: number) => {
    const draft = editingSubCantidad[subRecetaId]
    if (draft === undefined) return
    const num = Number.parseFloat(draft)
    const sub = subRecetasSeleccionadas.find((s) => s.recetaId === subRecetaId)
    if (!sub) return
    if (Number.isNaN(num) || num <= 0) {
      toast.error("Cantidad inválida.")
      setEditingSubCantidad((prev) => {
        const { [subRecetaId]: _omit, ...rest } = prev
        return rest
      })
      return
    }
    if (num === sub.cantidad) {
      setEditingSubCantidad((prev) => {
        const { [subRecetaId]: _omit, ...rest } = prev
        return rest
      })
      return
    }

    const result = await updateSubRecetaCantidadEnReceta(recetaId, subRecetaId, num)
    if (!result.success) {
      toast.error("Error al actualizar cantidad: " + (result.error?.message || ""))
      setEditingSubCantidad((prev) => {
        const { [subRecetaId]: _omit, ...rest } = prev
        return rest
      })
      return
    }
    setSubRecetasSeleccionadas((prev) =>
      prev.map((s) =>
        s.recetaId === subRecetaId
          ? { ...s, cantidad: num, ingredientecostoparcial: result.nuevoParcial ?? s.ingredientecostoparcial }
          : s,
      ),
    )
    setTotalCostoReceta((prev) => {
      const sumIng = ingredientesReceta.reduce((acc, i) => acc + i.ingredientecostoparcial, 0)
      const sumSub = subRecetasSeleccionadas.reduce(
        (acc, s) => acc + (s.recetaId === subRecetaId ? (result.nuevoParcial ?? 0) : s.ingredientecostoparcial),
        0,
      )
      return sumIng + sumSub
    })
    setEditingSubCantidad((prev) => {
      const { [subRecetaId]: _omit, ...rest } = prev
      return rest
    })
    toast.success("Cantidad de sub-receta actualizada.")
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

  // Calcular el costo en base a la cantidad de la sub-receta
  const calcularCostoReceta = () => {
    const costoTotal = Number.parseFloat(txtCostoReceta) || 0
    const cantidadIngresada = Number.parseFloat(txtCantidadReceta) || 0
    if (maxCantidadReceta > 0 && cantidadIngresada > 0) {
      return (costoTotal / maxCantidadReceta) * cantidadIngresada
    }
    return 0
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

      // Cambiado: removido la verificación de error.code !== "PGRST116"
      if (checkError) {
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
    <div className="container mx-auto max-w-6xl p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consulta de Sub-Receta</h1>
          <p className="text-muted-foreground">Vista de solo lectura — no editable</p>
        </div>
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

      {/* ===== TOP SECTION: Image + Info Panel ===== */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left: Image */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 md:w-40 md:h-40 border rounded-lg overflow-hidden bg-gray-50">
                {imageUrl ? (
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={recetaData?.nombre || "Imagen de la sub-receta"}
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
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              {/* Column 1: Información Básica */}
              <div>
                <h3 className="text-sm font-semibold text-blue-700 mb-1">Información Básica</h3>
                <div className="space-y-0.5 text-xs">
                  <p><span className="font-semibold text-blue-700">ID:</span> {recetaData?.id}</p>
                  <p><span className="font-semibold text-blue-700">Nombre:</span> {recetaData?.nombre}</p>
                  {recetaData?.notaspreparacion && (
                    <p><span className="font-semibold text-blue-700">Notas:</span> {recetaData.notaspreparacion}</p>
                  )}
                  <p>
                    <span className="font-semibold text-blue-700">Estatus:</span>{" "}
                    <Badge variant="default" className="bg-green-600 text-white ml-1">Activa</Badge>
                  </p>
                </div>
              </div>

              {/* Column 2: Costos */}
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-1">Costos</h3>
                <div className="space-y-0.5 text-xs">
                  <p>
                    <span className="font-semibold text-orange-600">Costo Total:</span>{" "}
                    <span className="font-bold">{formatCurrency(totalCostoReceta)}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-orange-600">Ingredientes:</span>{" "}
                    {ingredientesReceta.length}
                  </p>
                  <p>
                    <span className="font-semibold text-orange-600">Sub-Recetas:</span>{" "}
                    {subRecetasSeleccionadas.length}
                  </p>
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
            value="resumen"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-6 py-3"
          >
            Resumen
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB: Información Básica ===== */}
        <TabsContent value="informacion">
        <Card>
          <CardHeader>
            <CardTitle>Actualizar Información Básica</CardTitle>
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
                readOnly
                disabled
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
                readOnly
                disabled
                placeholder="Instrucciones detalladas para la preparación"
                className="min-h-[100px]"
              />
            </div>
            {imageUrl && (
              <div>
                <label className="text-sm font-medium">Imagen</label>
                <div className="mt-2 relative w-24 h-24 border rounded-md overflow-hidden">
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt="Imagen de la sub-receta"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        {/* ===== TAB: Ingredientes ===== */}
        <TabsContent value="ingredientes">
          <Card>
            <CardHeader>
              <CardTitle>Ingredientes de la Sub-Receta</CardTitle>
              <CardDescription>Listado de ingredientes (solo lectura).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border mt-6">
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
                    {ingredientesReceta.length > 0 ? (
                      ingredientesReceta.map((ing) => (
                        <TableRow key={ing.id}>
                          <TableCell>{ing.nombre}</TableCell>
                          <TableCell>{ing.cantidad}</TableCell>
                          <TableCell>{ing.unidadmedidadescripcion}</TableCell>
                          <TableCell>{formatCurrency(ing.ingredientecostoparcial)}</TableCell>
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
        </TabsContent>

        {/* ===== TAB: Sub-Recetas ===== */}
        <TabsContent value="subrecetas">
          <Card>
            <CardHeader>
              <CardTitle>Sub-Recetas Anidadas</CardTitle>
              <CardDescription>Listado de sub-recetas (solo lectura).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subRecetasSeleccionadas.length > 0 ? (
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
              ) : (
                <p className="text-muted-foreground text-center py-4">No hay sub-recetas anidadas.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: Resumen ===== */}
        <TabsContent value="resumen">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Sub-Receta</CardTitle>
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

              {/* Elaboración de la Sub-Receta */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Elaboración de la Sub-Receta</h3>
                {(ingredientesReceta.length > 0 || subRecetasSeleccionadas.length > 0) ? (
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
                        {ingredientesReceta.map((ing) => (
                          <TableRow key={`ing-${ing.id}`}>
                            <TableCell className="w-[10%]">
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Ingrediente</Badge>
                            </TableCell>
                            <TableCell className="w-[25%]">{ing.nombre}</TableCell>
                            <TableCell className="w-[15%] text-right">
                              {formatCurrency(ing.cantidad ? ing.ingredientecostoparcial / ing.cantidad : 0)}
                            </TableCell>
                            <TableCell className="w-[15%] text-center">{ing.unidadmedidadescripcion || "N/A"}</TableCell>
                            <TableCell className="w-[10%] text-center text-green-600">{ing.cantidad}</TableCell>
                            <TableCell className="w-[25%] text-right text-green-600">{formatCurrency(ing.ingredientecostoparcial)}</TableCell>
                          </TableRow>
                        ))}
                        {subRecetasSeleccionadas.map((rec) => (
                          <TableRow key={`rec-${rec.id}`}>
                            <TableCell className="w-[10%]">
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">Sub-Receta</Badge>
                            </TableCell>
                            <TableCell className="w-[25%]">{rec.nombre}</TableCell>
                            <TableCell className="w-[15%] text-right">
                              {formatCurrency(rec.cantidad ? rec.ingredientecostoparcial / rec.cantidad : 0)}
                            </TableCell>
                            <TableCell className="w-[15%] text-center">N/A</TableCell>
                            <TableCell className="w-[10%] text-center text-green-600">{rec.cantidad}</TableCell>
                            <TableCell className="w-[25%] text-right text-green-600">{formatCurrency(rec.ingredientecostoparcial)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="border-t-2 border-blue-500 px-4 py-2 flex justify-end">
                      <span className="text-sm font-semibold text-gray-700">Total Costo Parcial:{" "}
                        <span className="text-base font-bold text-orange-600">
                          {formatCurrency(
                            ingredientesReceta.reduce((sum, ing) => sum + (ing.ingredientecostoparcial || 0), 0) +
                            subRecetasSeleccionadas.reduce((sum, rec) => sum + (rec.ingredientecostoparcial || 0), 0)
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay ingredientes ni sub-recetas agregados.</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="mt-2 text-right text-xl font-semibold text-gray-700">
                  Costo Total de la Sub-Receta: {formatCurrency(totalCostoReceta)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center mt-6">
        <Button
          id="btnEditarSubReceta"
          name="btnEditarSubReceta"
          type="button"
          onClick={() => router.push(`/recetas/${recetaId}/editar`)}
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          Editar Sub-Receta
        </Button>
      </div>

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

      {/* Modal de éxito */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl text-green-700">
              ¡Guardado exitoso!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-gray-600">
              {successMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => setShowSuccessDialog(false)}
              className="bg-green-700 hover:bg-green-800"
            >
              Aceptar
            </AlertDialogAction>
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
                src="/images/design-mode/EditarReceta%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29(1).gif"
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
