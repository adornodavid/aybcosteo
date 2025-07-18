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

// Importar acciones de imagen
import { uploadImage, deleteImage } from "@/app/actions/recetas-image-actions"

// --- Interfaces ---
interface PlatilloData {
  id: number
  nombre: string
  descripcion: string
  instruccionespreparacion: string | null
  tiempopreparacion: string | null
  imgurl: string | null
  costototal: number | null
}

interface IngredientePlatillo {
  id: number // id de ingredientesxplatillo
  ingredienteid: number
  nombre: string
  cantidad: number
  ingredientecostoparcial: number
  unidad: string // Añadir esta línea
}

interface RecetaPlatillo {
  id: number // id de recetasxplatillo
  recetaid: number
  nombre: string
  recetacostoparcial: number
}

interface DropdownItem {
  id: number
  nombre: string
}

interface UnidadMedidaItem {
  id: number
  descripcion: string
  calculoconversion: number
}

// --- Componente Principal ---
export default function EditarPlatilloPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platilloId = searchParams.get("getPlatilloId")

  // --- Estados ---
  const [currentStep, setCurrentStep] = useState(1)
  const [platilloData, setPlatilloData] = useState<PlatilloData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false) // Nuevo estado para la carga de imagen
  const [showAnimation, setShowAnimation] = useState(false) // Nuevo estado para la animación

  // Estados para Etapa 2: Ingredientes
  const [ingredientesPlatillo, setIngredientesPlatillo] = useState<IngredientePlatillo[]>([])
  const [ingredientesDropdown, setIngredientesDropdown] = useState<DropdownItem[]>([])
  const [unidadesMedidaDropdown, setUnidadesMedidaDropdown] = useState<UnidadMedidaItem[]>([])
  const [selectedIngredienteId, setSelectedIngredienteId] = useState<string>("")
  const [cantidadIngrediente, setCantidadIngrediente] = useState<string>("")
  const [selectedUnidadMedidaId, setSelectedUnidadMedidaId] = useState<string>("")
  const [costoIngrediente, setCostoIngrediente] = useState<string>("")
  const [showConfirmDeleteIngrediente, setShowConfirmDeleteIngrediente] = useState(false)
  const [ingredienteToDelete, setIngredienteToDelete] = useState<number | null>(null) // id de ingredientesxplatillo
  const [showIngredienteExistsDialog, setShowIngredienteExistsDialog] = useState(false) // Nuevo estado para el modal de ingrediente existente

  // Estados para Etapa 2: Recetas
  const [recetasPlatillo, setRecetasPlatillo] = useState<RecetaPlatillo[]>([])
  const [recetasDropdown, setRecetasDropdown] = useState<DropdownItem[]>([])
  const [selectedRecetaId, setSelectedRecetaId] = useState<string>("")
  const [costoReceta, setCostoReceta] = useState<string>("")
  const [showConfirmDeleteReceta, setShowConfirmDeleteReceta] = useState(false)
  const [recetaToDelete, setRecetaToDelete] = useState<number | null>(null) // id de recetasxplatillo
  const [showRecetaExistsDialog, setShowRecetaExistsDialog] = useState(false) // Nuevo estado para el modal de sub-receta existente

  const canAdvanceToStep2 = useMemo(() => {
    return platilloData?.nombre && platilloData?.descripcion
  }, [platilloData])

  const canFinalizePlatillo = useMemo(() => {
    return ingredientesPlatillo.length >= 2
  }, [ingredientesPlatillo])

  // --- Carga de datos del platillo ---
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
          .select("id, nombre, descripcion, instruccionespreparacion, tiempopreparacion, imgurl, costototal")
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

  // --- Carga de dropdowns e ingredientes/recetas existentes para Etapa 2 ---
  useEffect(() => {
    const loadStep2Data = async () => {
      if (!platilloId || currentStep !== 2) return

      setLoading(true)
      try {
        // Obtener HotelId del platillo
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

        // Cargar ingredientes para dropdown
        if (hotelIdForDropdowns !== null) {
          const { data: ingredientesData, error: ingredientesError } = await supabase
            .from("ingredientes")
            .select("id, nombre")
            .eq("hotelid", hotelIdForDropdowns)
            .order("nombre")

          if (ingredientesError) {
            console.error("Error al cargar ingredientes dropdown:", ingredientesError)
            toast.error("Error al cargar lista de ingredientes.")
          } else {
            setIngredientesDropdown(ingredientesData || [])
          }
        }

        // Cargar unidades de medida para dropdown
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

        // Cargar recetas para dropdown (filtradas por hotel del platillo)
        if (hotelIdForDropdowns !== null) {
          const { data: recetasData, error: recetasError } = await supabase
            .from("recetas")
            .select(`
              id, nombre, activo,
              ingredientesxreceta!inner(
                ingredientes!inner(
                  hotelid
                )
              )
            `)
            .eq("activo", true)
            .eq("ingredientesxreceta.ingredientes.hotelid", hotelIdForDropdowns)
            .order("nombre")

          if (recetasError) {
            console.error("Error al cargar sub-recetas dropdown:", recetasError)
            toast.error("Error al cargar lista de sub-recetas.")
          } else {
            // Filtrar recetas únicas si hay duplicados por el join
            const uniqueRecetas = Array.from(
              new Map((recetasData || []).map((r: any) => [r.id, { id: r.id, nombre: r.nombre }])).values(),
            )
            setRecetasDropdown(uniqueRecetas)
          }
        }

        // Cargar ingredientes existentes del platillo
        const { data: existingIngredientes, error: ingXPlatilloError } = await supabase
          .from("ingredientesxplatillo")
          .select(`
            id, cantidad, ingredientecostoparcial,
            ingredientes(id, nombre, tipounidadmedida(descripcion))
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
              unidad: item.ingredientes?.tipounidadmedida?.descripcion, // Mapear la descripción de la unidad
            })),
          )
        }

        // Cargar recetas existentes del platillo
        const { data: existingRecetas, error: recXPlatilloError } = await supabase
          .from("recetasxplatillo")
          .select(`
            id, recetacostoparcial,
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

  // --- Handlers de Inputs Etapa 1 ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setPlatilloData((prev) => (prev ? { ...prev, [id]: value } : null))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      // If file selection is cancelled, revert to current image URL
      setImageUrl(platilloData?.imgurl || null)
      return
    }

    // Client-side validation
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
      const { data, error } = await uploadImage(file, "imagenes") // Use the server action
      if (error) {
        console.error("Error al subir imagen:", error)
        toast.error("Error al subir imagen: " + error.message)
        setImageUrl(platilloData?.imgurl || null) // Revert to original on error
      } else if (data) {
        setImageUrl(data.publicUrl)
        toast.success("Imagen subida correctamente.")
      }
    } catch (e: any) {
      console.error("Error inesperado al subir imagen:", e)
      toast.error("Error inesperado al subir imagen: " + e.message)
      setImageUrl(platilloData?.imgurl || null) // Revert to original on error
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleDeleteImage = async () => {
    if (!imageUrl) return

    setIsUploadingImage(true) // Use this state to disable buttons during deletion
    try {
      const { success, error } = await deleteImage(imageUrl, "imagenes") // Use the server action
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

  // --- Handlers de Inputs Etapa 2 (Ingredientes) ---
  const handleIngredienteDropdownChange = async (value: string) => {
    setSelectedIngredienteId(value)
    if (value) {
      try {
        const { data, error } = await supabase
          .from("ingredientes")
          .select("costo, unidadmedidaid")
          .eq("id", value)
          .single()

        if (error) {
          console.error("Error al obtener costo/unidad de ingrediente:", error)
          toast.error("Error al cargar costo/unidad del ingrediente.")
          setCostoIngrediente("")
          setSelectedUnidadMedidaId("")
          return
        }
        if (data) {
          setCostoIngrediente(data.costo ? data.costo.toString() : "")
          setSelectedUnidadMedidaId(data.unidadmedidaid ? data.unidadmedidaid.toString() : "")
        }
      } catch (error) {
        console.error("Error inesperado al obtener costo/unidad de ingrediente:", error)
        toast.error("Error inesperado al cargar costo/unidad del ingrediente.")
        setCostoIngrediente("")
        setSelectedUnidadMedidaId("")
      }
    } else {
      setCostoIngrediente("")
      setSelectedUnidadMedidaId("")
    }
  }

  // --- Handlers de Inputs Etapa 2 (Recetas) ---
  const handleRecetaDropdownChange = async (value: string) => {
    setSelectedRecetaId(value)
    if (value) {
      try {
        const { data, error } = await supabase
          .from("recetas")
          .select("costo")
          .eq("id", value)
          .eq("activo", true)
          .single()

        if (error) {
          console.error("Error al obtener costo de sub-receta:", error)
          toast.error("Error al cargar costo de la sub-receta.")
          setCostoReceta("")
          return
        }
        if (data) {
          setCostoReceta(data.costo ? data.costo.toString() : "")
        }
      } catch (error) {
        console.error("Error inesperado al obtener costo de sub-receta:", error)
        toast.error("Error inesperado al cargar costo de la sub-receta.")
        setCostoReceta("")
      }
    } else {
      setCostoReceta("")
    }
  }

  // --- Navegación entre etapas ---
  const handleNextStep = async () => {
    if (!platilloData?.nombre || !platilloData?.descripcion) {
      toast.error("Favor de llenar la información faltante (Nombre y Descripción).")
      return
    }

    setIsSubmitting(true)
    try {
      const { error: updateError } = await supabase
        .from("platillos")
        .update({
          nombre: platilloData.nombre,
          descripcion: platilloData.descripcion,
          imgurl: imageUrl, // Usar el imageUrl que ya fue actualizado por handleImageChange
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
  }

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  // --- CRUD Ingredientes ---
  const handleAddIngrediente = async () => {
    if (!selectedIngredienteId || !cantidadIngrediente || !selectedUnidadMedidaId || !costoIngrediente) {
      toast.error("Favor de llenar la información faltante para el ingrediente.")
      return
    }

    setIsSubmitting(true)
    try {
      // --- INICIO DE LA NUEVA VALIDACIÓN ---
      const { data: existingIngrediente, error: checkError } = await supabase
        .from("ingredientesxplatillo")
        .select("id")
        .eq("platilloid", platilloId)
        .eq("ingredienteid", Number.parseInt(selectedIngredienteId))
        .single()

      // Si hay un error y no es el error de "no rows found" (PGRST116), lo manejamos
      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error al verificar ingrediente existente:", checkError)
        toast.error("Error al verificar ingrediente existente: " + checkError.message)
        setIsSubmitting(false)
        return
      }

      // Si se encontró un ingrediente existente, mostramos el diálogo y salimos
      if (existingIngrediente) {
        setShowIngredienteExistsDialog(true)
        setIsSubmitting(false)
        return // Detiene la ejecución de la función
      }
      // --- FIN DE LA NUEVA VALIDACIÓN ---

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
          ingredientes(id, nombre, tipounidadmedida(descripcion))
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
            unidad: data.ingredientes?.tipounidadmedida?.descripcion, // Mapear la descripción de la unidad
          },
        ])
        toast.success("Ingrediente agregado correctamente.")
        // Limpiar inputs
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

  const handleDeleteIngrediente = async () => {
    if (ingredienteToDelete === null) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("ingredientesxplatillo").delete().eq("id", ingredienteToDelete) // Eliminar por el ID de la tabla intermedia

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

  // --- CRUD Recetas ---
  const handleAddReceta = async () => {
    if (!selectedRecetaId || !costoReceta) {
      toast.error("Favor de llenar la información faltante para la sub-receta.")
      return
    }

    setIsSubmitting(true)
    try {
      // --- INICIO DE LA NUEVA VALIDACIÓN ---
      const { data: existingReceta, error: checkError } = await supabase
        .from("recetasxplatillo")
        .select("id")
        .eq("platilloid", platilloId)
        .eq("recetaid", Number.parseInt(selectedRecetaId))
        .single()

      // Si hay un error y no es el error de "no rows found" (PGRST116), lo manejamos
      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error al verificar sub-receta existente:", checkError)
        toast.error("Error al verificar sub-receta existente: " + checkError.message)
        setIsSubmitting(false)
        return
      }

      // Si se encontró una sub-receta existente, mostramos el diálogo y salimos
      if (existingReceta) {
        setShowRecetaExistsDialog(true)
        setIsSubmitting(false)
        return // Detiene la ejecución de la función
      }
      // --- FIN DE LA NUEVA VALIDACIÓN ---

      const costoNum = Number.parseFloat(costoReceta)
      if (isNaN(costoNum)) {
        toast.error("Valor de costo de sub-receta inválido.")
        setIsSubmitting(false)
        return
      }

      const { data, error } = await supabase
        .from("recetasxplatillo")
        .insert({
          platilloid: platilloId,
          recetaid: Number.parseInt(selectedRecetaId),
          recetacostoparcial: costoNum,
          activo: true,
          fechacreacion: new Date().toISOString(),
          fechamodificacion: new Date().toISOString(),
        })
        .select(`
          id, recetacostoparcial,
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
          },
        ])
        toast.success("Sub-Receta agregada correctamente.")
        // Limpiar inputs
        setSelectedRecetaId("")
        setCostoReceta("")
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
      const { error } = await supabase.from("recetasxplatillo").delete().eq("id", recetaToDelete) // Eliminar por el ID de la tabla intermedia

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

  // --- Actualización Final del Platillo (Costo Total e Histórico) ---
  const handleFinalUpdatePlatillo = async () => {
    if (!platilloId) {
      toast.error("ID de receta no proporcionado para la actualización final.")
      return
    }

    if (!canFinalizePlatillo) {
      toast.error("Debe registrar al menos 2 ingredientes para finalizar la actualización de la receta.")
      return
    }

    setIsSubmitting(true)
    setShowAnimation(true) // Mostrar animación

    try {
      const [supabaseResult] = await Promise.all([
        (async () => {
          // 1. Calcular costo total del platillo
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

          // 2. Actualizar costototal en la tabla platillos
          const { error: updatePlatilloError } = await supabase
            .from("platillos")
            .update({ costototal: nuevoCostoTotal })
            .eq("id", platilloId)

          if (updatePlatilloError) throw updatePlatilloError

          // 3. Insertar en la tabla historico (ingredientes)
          const { data: platilloMenus, error: platilloMenusError } = await supabase
            .from("platillosxmenu")
            .select(`
              menuid,
              menus!inner(
                restauranteid,
                restaurantes!inner(hotelid)
              )
            `)
            .eq("platilloid", platilloId)

          if (platilloMenusError) throw platilloMenusError

          const historicoIngredientesToInsert = []
          for (const menuAssoc of platilloMenus) {
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
              })
            }
          }

          if (historicoIngredientesToInsert.length > 0) {
            const { error: insertIngredientesHistoricoError } = await supabase
              .from("historico")
              .insert(historicoIngredientesToInsert)
            if (insertIngredientesHistoricoError) throw insertIngredientesHistoricoError
          }

          // 4. Insertar en la tabla historico (recetas)
          const historicoRecetasToInsert = []
          for (const menuAssoc of platilloMenus) {
            const hotelId = menuAssoc.menus.restaurantes.hotelid
            const restauranteId = menuAssoc.menus.restauranteid
            const menuId = menuAssoc.menuid

            for (const rec of recetasPlatillo) {
              historicoRecetasToInsert.push({
                hotelid: hotelId,
                restauranteid: restauranteId,
                menuid: menuId,
                platilloid: platilloId,
                ingredienteid: null,
                recetaid: rec.recetaid,
                cantidad: null,
                costo: rec.recetacostoparcial,
                activo: true,
                fechacreacion: new Date().toISOString(),
              })
            }
          }

          if (historicoRecetasToInsert.length > 0) {
            const { error: insertRecetasHistoricoError } = await supabase
              .from("historico")
              .insert(historicoRecetasToInsert)
            if (insertRecetasHistoricoError) throw insertRecetasHistoricoError
          }
          return { success: true } // Indicar éxito de las operaciones de Supabase
        })(),
        new Promise((resolve) => setTimeout(resolve, 5000)), // Mínimo 5 segundos de animación
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
      setShowAnimation(false) // Ocultar animación
      setIsSubmitting(false)
    }
  }

  // --- Renderizado ---
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Título y Botón Regresar */}
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

      {/* Etapa 1: Información Básica */}
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
                maxLength={500} // Ajustar según necesidad
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
                maxLength={150} // Ajustar según necesidad
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
            <Button
              id="btnActualizarPlatillo"
              name="btnActualizarPlatillo"
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting || isUploadingImage}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Actualizar y Siguiente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Etapa 2: Ingredientes y Recetas */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Etapa 2: Ingredientes de la Receta</CardTitle>
              <CardDescription>Agrega, actualiza o elimina ingredientes de tu receta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulario para agregar ingrediente */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <label htmlFor="ddlIngredientes" className="text-sm font-medium">
                    Ingrediente
                  </label>
                  <Select
                    name="ddlIngredientes"
                    value={selectedIngredienteId}
                    onValueChange={handleIngredienteDropdownChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="ddlIngredientes">
                      <SelectValue placeholder="Selecciona un ingrediente" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredientesDropdown.map((ing) => (
                        <SelectItem key={ing.id} value={ing.id.toString()}>
                          {ing.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    disabled={true} // Siempre bloqueado
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
                    disabled={true} // Siempre bloqueado
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

              {/* Tabla de ingredientes agregados */}
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
              {/* Formulario para agregar receta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
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
                  <label htmlFor="txtCostoReceta" className="text-sm font-medium">
                    Costo Sub-Receta
                  </label>
                  <Input
                    id="txtCostoReceta"
                    name="txtCostoReceta"
                    type="text"
                    value={costoReceta}
                    readOnly
                    disabled={true} // Siempre bloqueado
                    placeholder="Costo de la sub-receta"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    id="btnAgregarReceta"
                    name="btnAgregarReceta"
                    type="button"
                    onClick={handleAddReceta}
                    disabled={isSubmitting}
                    className="bg-green-800 hover:bg-green-900 text-white"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Sub-Receta
                  </Button>
                </div>
              </div>

              {/* Tabla de recetas agregadas */}
              <div className="rounded-md border mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sub-Receta</TableHead>
                      <TableHead>Costo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recetasPlatillo.length > 0 ? (
                      recetasPlatillo.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell>{rec.nombre}</TableCell>
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
                        <TableCell colSpan={3} className="h-24 text-center">
                          No hay sub-recetas agregadas.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Botones de navegación y finalización */}
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
              disabled={isSubmitting || !canFinalizePlatillo}
              className="bg-green-800 hover:bg-green-900 text-white"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Actualizar Receta Completa
            </Button>
          </div>
        </div>
      )}

      {/* Dialogo de Ingrediente Existente */}
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

      {/* Dialogo de Sub-Receta Existente */}
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

      {/* Animación de Carga */}
      {showAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl">
            <div className="relative w-24 h-24 mb-4">
            <Image
              src="https://nxtrsibnomdqmzcrwedc.supabase.co/storage/v1/object/public/imagenes/AnimationGif/EditarReceta.gif"
              alt="Procesando..."
              width={300} // Ajusta el tamaño según sea necesario
              height={300} // Ajusta el tamaño según sea necesario
              unoptimized // Importante para GIFs externos
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
