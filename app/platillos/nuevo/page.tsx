"use client"

/* ==================================================
  Imports
================================================== */
import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UploadCloud, HelpCircle, ChefHat, Utensils, ListChecks, Receipt, CheckCircle2, Lock, Save } from "lucide-react"
import { toast } from "sonner"
import { Suspense } from "react"
import Loading from "./loading"
import Image from "next/image" // Importar Image de next/image

import * as actions from "@/app/actions/platillos-wizard-actions"
import { useNavigationGuard } from "@/contexts/navigation-guard-context" // Importar el hook del contexto
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Interfaces para los datos cargados
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
  costo: number | null
  codigo: string // Añadido el campo codigo
}
interface Receta {
  id: number
  nombre: string
  costo: number | null
  cantidad: number | null // Añadido para la cantidad base de la receta
  unidadbaseid: number | null // Añadido para la unidad base de la receta
  tipounidadmedida: {
    descripcion: string
  } | null // Añadido para la descripción de la unidad base
}
interface UnidadMedida {
  id: number
  descripcion: string
  calculoconversion: number | null // Necesario para el cálculo en el cliente
}
interface IngredienteAgregada {
  id: number
  nombre: string
  cantidad: number
  ingredientecostoparcial: number
  unidad: string // Añadir esta línea
  costoUnitarioEfectivo?: number
}
interface RecetaAgregada {
  id: number
  nombre: string
  recetacostoparcial: number
  cantidad?: number
  costoUnitarioEfectivo?: number
}

const MAX_IMAGE_SIZE_MB = 10
const MAX_IMAGE_DIMENSION = 500

export default function NuevoPlatilloPage() {
  const router = useRouter()
  const { setGuard } = useNavigationGuard() // Obtener setGuard del contexto

  // --- ESTADO GENERAL ---
  const [etapa, setEtapa] = useState(1)
  const [maxEtapaAlcanzada, setMaxEtapaAlcanzada] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCookingAnimation, setShowCookingAnimation] = useState(false) // Nuevo estado para la animación

  const formatCurrency = (amount: number | null) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount || 0)

  const goToEtapa = (target: number) => {
    if (target <= maxEtapaAlcanzada) setEtapa(target)
  }
  const advanceToEtapa = (target: number) => {
    setEtapa(target)
    setMaxEtapaAlcanzada((prev) => Math.max(prev, target))
  }

  // Modal de cambios guardados
  const [showSavedModal, setShowSavedModal] = useState(false)
  const [savedModalMessage, setSavedModalMessage] = useState("")

  // Modal de confirmación al registrar sin precio
  const [showSinPrecioDialog, setShowSinPrecioDialog] = useState(false)

  // Edición inline de cantidad en tablas
  const [editingIngCantidad, setEditingIngCantidad] = useState<Record<number, string>>({})
  const [editingRecCantidad, setEditingRecCantidad] = useState<Record<number, string>>({})

  // --- ESTADO DE DATOS Y PROCESO ---
  const [platilloId, setPlatilloId] = useState<number | null>(null)
  const [validaRegistroId, setValidaRegistroId] = useState(0)
  const [menuNom, setMenuNom] = useState("")
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false) // Nuevo estado para el modal de éxito
  const [showDuplicateRecetaModal, setShowDuplicateRecetaModal] = useState(false) // Nuevo estado para el modal de duplicidad de receta
  const [showDuplicateIngredienteModal, setShowDuplicateIngredienteModal] = useState(false) // Nuevo estado para el modal de duplicidad de ingrediente
  const [nextPath, setNextPath] = useState("")
  const resolveNavigationRef = useRef<((value: boolean) => void) | null>(null) // Para resolver la promesa de navegación
  const [countdown, setCountdown] = useState(10) // Nuevo estado para el contador
  const [showErrorDialog, setShowErrorDialog] = useState(false) // Nuevo estado para el AlertDialog de error
  const [errorMessage, setErrorMessage] = useState("") // Nuevo estado para el mensaje de error

  // --- ETAPA 1: INFO BÁSICA ---
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [instrucciones, setInstrucciones] = useState("")
  const [tiempo, setTiempo] = useState("")
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  // --- ETAPA 2: MENÚ ---
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [hotelId, setHotelId] = useState<string>("")
  const [restauranteId, setRestauranteId] = useState<string>("")
  const [menuId, setMenuId] = useState<string>("")

  // --- ETAPA 3: CONTENIDO ---
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]) // Todos los ingredientes para el hotel
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]) // Ahora se carga dinámicamente
  const [ingredientesAgregados, setIngredientesAgregados] = useState<IngredienteAgregada[]>([])
  const [recetasAgregadas, setRecetasAgregadas] = useState<RecetaAgregada[]>([])

  // Formulario de ingredientes (para el nuevo input de búsqueda)
  const [ingredienteSearchTerm, setIngredienteSearchTerm] = useState("")
  const [filteredIngredientes, setFilteredIngredientes] = useState<Ingrediente[]>([]) // Resultados de la búsqueda
  const [showIngredienteDropdown, setShowIngredienteDropdown] = useState(false)

  const [selIngredienteId, setSelIngredienteId] = useState("")
  const [selIngredienteCantidad, setSelIngredienteCantidad] = useState("")
  const [selIngredienteUnidad, setSelIngredienteUnidad] = useState("")
  const [selIngredienteCosto, setSelIngredienteCosto] = useState("")

  // Formulario de recetas
  const [selRecetaId, setSelRecetaId] = useState("")
  const [selRecetaCosto, setSelRecetaCosto] = useState("")
  // NUEVOS ESTADOS PARA SUB-RECETAS
  const [selRecetaCantidad, setSelRecetaCantidad] = useState("1") // Para txtCantidad (number)
  const [selRecetaCant, setSelRecetaCant] = useState("1") // Para txtCant (range)
  const [selRecetaUnidadBase, setSelRecetaUnidadBase] = useState("") // Para txtUnidadBase (text)
  const [maxRangeReceta, setMaxRangeReceta] = useState(1) // Para el max del input range

  // --- ETAPA 4: RESUMEN ---
  const [totalCostoPlatillo, setTotalCostoPlatillo] = useState<number | null>(null) // Nuevo estado para el costo total
  const [costoAdministrativoPlatillo, setCostoAdministrativoPlatillo] = useState<number | null>(null) // Nuevo estado para el costo administrativo
  const [precioSugeridoPlatillo, setPrecioSugeridoPlatillo] = useState<number | null>(null) // Nuevo estado para el precio sugerido
  const [precioVenta, setPrecioVenta] = useState("") // Nuevo estado para el precio de venta
  // NUEVOS ESTADOS PARA LOS INPUTS ADICIONALES
  const [costoPorcentual, setCostoPorcentual] = useState("0.00") // Estado para el costo porcentual
  const [precioConIVA, setPrecioConIVA] = useState("0.00") // Estado para el precio con IVA

  // --- EFECTOS ---

  // 1. Verificar sesión y cargar datos iniciales (hoteles, ingredientes, recetas)
  useEffect(() => {
    const initialize = async () => {
      try {
        const sessionData = await actions.obtenerVariablesSesion()
        if (sessionData.SesionActiva !== "true" || !sessionData.RolId || sessionData.RolId === "0") {
          router.push("/login")
          return
        }

        const auxHotelid = [1, 2, 3, 4].includes(Number(sessionData.RolId)) ? -1 : Number(sessionData.HotelId)
        const [hotelesData] = await Promise.all([actions.getHoteles(auxHotelid)])

        setHoteles(hotelesData)

        if (hotelesData.length > 0) {
          setHotelId(hotelesData[0].id.toString())
        }
      } catch (error) {
        console.error("Error verificando sesión o cargando datos:", error)
        toast.error("Error al inicializar la página. Redirigiendo al login.")
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [router])

  // 2. Cargar dropdowns dependientes (restaurantes, menus, ingredientes, recetas)
  useEffect(() => {
    if (!hotelId) return
    const hotelNum = Number.parseInt(hotelId, 10)

    actions.getRestaurantes(hotelNum).then((data) => {
      setRestaurantes(data)
      setRestauranteId(data[0]?.id.toString() || "")
    })

    actions.getIngredientes(hotelNum).then(setIngredientes) // Carga todos los ingredientes para el hotel
    actions.getRecetas(hotelNum).then(setRecetas)
  }, [hotelId])

  useEffect(() => {
    if (!restauranteId) return
    actions.getMenus(Number.parseInt(restauranteId, 10), Number.parseInt(hotelId, 10)).then((data) => {
      setMenus(data)
      setMenuId(data[0]?.id.toString() || "")
    })
  }, [restauranteId, hotelId]) // Depende de hotelId también

  // 3. Actualizar costos de inputs bloqueados
  useEffect(() => {
    const ingrediente = ingredientes.find((i) => i.id.toString() === selIngredienteId)
    setSelIngredienteCosto(ingrediente?.costo?.toString() || "0")
  }, [selIngredienteId, ingredientes])

  useEffect(() => {
    const receta = recetas.find((r) => r.id.toString() === selRecetaId)
    setSelRecetaCosto(receta?.costo?.toString() || "0")
  }, [selRecetaId, recetas])

  // NUEVO EFECTO: Cargar unidades de medida basadas en el ingrediente seleccionado
  useEffect(() => {
    if (!selIngredienteId) {
      setUnidades([]) // Limpiar unidades si no hay ingrediente seleccionado
      setSelIngredienteUnidad("") // Limpiar unidad seleccionada
      return
    }
    const loadUnits = async () => {
      const data = await actions.getUnidadesMedidaByIngrediente(Number(selIngredienteId))
      setUnidades(data)
      if (data.length > 0) {
        setSelIngredienteUnidad(data[0].id.toString()) // Auto-seleccionar la única unidad
      } else {
        setSelIngredienteUnidad("")
      }
    }
    loadUnits()
  }, [selIngredienteId])

  // NUEVO EFECTO: Actualizar inputs de cantidad y unidad base para sub-recetas
  useEffect(() => {
    if (!selRecetaId) {
      setMaxRangeReceta(1)
      setSelRecetaCantidad("1")
      setSelRecetaCant("1")
      setSelRecetaUnidadBase("")
      return
    }
    const selectedReceta = recetas.find((r) => r.id.toString() === selRecetaId)
    if (selectedReceta) {
      const baseCantidad = selectedReceta.cantidad && selectedReceta.cantidad > 0 ? selectedReceta.cantidad : 1
      setMaxRangeReceta(baseCantidad)
      setSelRecetaCantidad("1") // Reset to 1 when new recipe is selected
      setSelRecetaCant("1") // Reset to 1 when new recipe is selected
      setSelRecetaUnidadBase(selectedReceta.tipounidadmedida?.descripcion || "N/A")
    }
  }, [selRecetaId, recetas])

  // NUEVO EFECTO: Cargar costo total del platillo en la etapa de resumen
  useEffect(() => {
    if (etapa === 4 && platilloId !== null) {
      const fetchTotalCost = async () => {
        const { totalCost, costoAdministrativo, precioSugerido } = await actions.getPlatilloTotalCost(platilloId)
        setTotalCostoPlatillo(totalCost)
        setCostoAdministrativoPlatillo(costoAdministrativo) // Set the new state
        setPrecioSugeridoPlatillo(precioSugerido) // Set the new state for suggested price
      }
      fetchTotalCost()
    }
  }, [etapa, platilloId])

  // NUEVO EFECTO: Calcular costo porcentual y precio con IVA cuando cambie el precio de venta o costo total
  useEffect(() => {
    if (precioVenta && costoAdministrativoPlatillo !== null) {
      const precioVentaNum = Number(precioVenta)
      if (precioVentaNum > 0) {
        /*const { Costoporcentual } =  platillosActions.calcularCostoPorcentual(
          costoAdministrativoPlatillo,
          precioVentaNum,
        )*/
        const Costoporcentual = (totalCostoPlatillo / precioVentaNum) * 100

        console.log("dil1", costoAdministrativoPlatillo)
        console.log("dil2", precioVentaNum)
        console.log("dil3", Costoporcentual)

        setCostoPorcentual(Costoporcentual.toFixed(2))

        //const precioConIVACalculado = platillosActions.calcularPrecioConIVA(precioVentaNum)
        const precioConIVACalculado = precioVentaNum * 0.16 + precioVentaNum
        setPrecioConIVA(precioConIVACalculado.toFixed(2))
      } else {
        setCostoPorcentual("0.00")
        setPrecioConIVA("0.00")
      }
    } else {
      setCostoPorcentual("0.00")
      setPrecioConIVA("0.00")
    }
  }, [precioVenta, costoAdministrativoPlatillo])

  // NUEVO EFECTO: Contador de tiempo para la Etapa 5 y redirección automática
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (etapa === 5) {
      setCountdown(10) // Reiniciar contador al entrar a la etapa 5
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(timer)
            router.push("/platillos") // Redirigir al llegar a 0
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer) // Limpiar el intervalo al salir de la etapa o desmontar
  }, [etapa, router])

  // NUEVO EFECTO: Debounce para la búsqueda de ingredientes
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (hotelId && ingredienteSearchTerm.length >= 2) {
        // Solo buscar si hay al menos 2 caracteres
        const results = await actions.searchIngredientes(Number(hotelId), ingredienteSearchTerm)
        setFilteredIngredientes(results)
        setShowIngredienteDropdown(true)
      } else {
        setFilteredIngredientes([])
        setShowIngredienteDropdown(false)
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(delayDebounceFn)
  }, [ingredienteSearchTerm, hotelId])

  // NUEVO EFECTO: Sincronizar el input de búsqueda con el ingrediente seleccionado
  useEffect(() => {
    if (selIngredienteId) {
      const selected = ingredientes.find((i) => i.id.toString() === selIngredienteId)
      if (selected) {
        setIngredienteSearchTerm(`${selected.codigo} - ${selected.nombre}`)
      }
    } else {
      setIngredienteSearchTerm("") // Limpiar el término de búsqueda si selIngredienteId se limpia
    }
  }, [selIngredienteId, ingredientes])

  // 4. Lógica para evitar abandono de página (para F5 y cierre de pestaña)
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (platilloId && validaRegistroId === 0) {
        e.preventDefault()
        e.returnValue = ""
      }
    },
    [platilloId, validaRegistroId],
  )

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [handleBeforeUnload])

  // --- MANEJADORES DE EVENTOS ---

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImagenFile(null)
      setImagenPreview(null)
      toast.error("No se seleccionó ningún archivo.")
      return
    }

    // Client-side preview using FileReader
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagenPreview(reader.result as string)
    }

    reader.readAsDataURL(file)

    setImagenFile(file) // Store the file for potential later use in FormData
  }

  const handleRegistrarPlatillo = async () => {
    if (!nombre || !descripcion) {
      setErrorMessage("Favor de llenar la información faltante (Nombre y Descripción son obligatorios).")
      setShowErrorDialog(true)
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("nombre", nombre)
    formData.append("descripcion", descripcion)
    formData.append("instruccionespreparacion", instrucciones || "") // Se envía vacío si no hay valor
    formData.append("tiempopreparacion", tiempo || "") // Se envía vacío si no hay valor
    if (imagenFile) {
      formData.append("imagen", imagenFile)
    }

    const result = await actions.registrarPlatilloBasico(formData)
    if (result.success && result.platilloId) {
      setPlatilloId(result.platilloId)
      toast.success("Información básica guardada. Continue con el siguiente paso.")
      advanceToEtapa(2)
    } else {
      setErrorMessage(result.error || "Ocurrió un error al registrar la receta.")
      setShowErrorDialog(true)
    }
    setIsSubmitting(false)
  }

  const handleContinuarEtapa2 = () => {
    if (!menuId) {
      toast.error("Debe seleccionar un menú.")
      return
    }
    const menu = menus.find((m) => m.id.toString() === menuId)
    setMenuNom(menu?.nombre || "")
    advanceToEtapa(3)
  }

  const handleGuardarCambiosEtapa1 = async () => {
    if (!platilloId) return
    if (!nombre || !descripcion) {
      setErrorMessage("Favor de llenar la información faltante (Nombre y Descripción son obligatorios).")
      setShowErrorDialog(true)
      return
    }
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("nombre", nombre)
    formData.append("descripcion", descripcion)
    formData.append("instruccionespreparacion", instrucciones || "")
    formData.append("tiempopreparacion", tiempo || "")
    if (imagenFile) {
      formData.append("imagen", imagenFile)
    }
    const result = await actions.actualizarPlatilloBasico(platilloId, formData)
    if (result.success) {
      setSavedModalMessage("La información básica de la receta se actualizó correctamente.")
      setShowSavedModal(true)
    } else {
      setErrorMessage(result.error || "No se pudieron guardar los cambios.")
      setShowErrorDialog(true)
    }
    setIsSubmitting(false)
  }

  const handleIngredienteCantidadChange = (id: number, value: string) => {
    setEditingIngCantidad((prev) => ({ ...prev, [id]: value }))
    const num = Number.parseFloat(value)
    if (!isNaN(num) && num > 0) {
      setIngredientesAgregados((prev) =>
        prev.map((ing) => {
          if (ing.id !== id) return ing
          const cu = ing.costoUnitarioEfectivo ?? (ing.cantidad > 0 ? ing.ingredientecostoparcial / ing.cantidad : 0)
          return { ...ing, cantidad: num, ingredientecostoparcial: num * cu, costoUnitarioEfectivo: cu }
        }),
      )
    }
  }

  const handleIngredienteCantidadBlur = async (id: number) => {
    const ing = ingredientesAgregados.find((i) => i.id === id)
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

    const cu = ing.costoUnitarioEfectivo ?? (ing.cantidad > 0 ? ing.ingredientecostoparcial / ing.cantidad : 0)
    const newParcial = num * cu

    const { error } = await supabase
      .from("ingredientesxplatillo")
      .update({
        cantidad: num,
        ingredientecostoparcial: newParcial,
        fechamodificacion: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar cantidad: " + error.message)
      return
    }

    setIngredientesAgregados((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, cantidad: num, ingredientecostoparcial: newParcial, costoUnitarioEfectivo: cu } : i,
      ),
    )
    setEditingIngCantidad((prev) => {
      const { [id]: _omit, ...rest } = prev
      return rest
    })
  }

  const handleRecetaCantidadChange = (id: number, value: string) => {
    setEditingRecCantidad((prev) => ({ ...prev, [id]: value }))
    const num = Number.parseFloat(value)
    if (!isNaN(num) && num > 0) {
      setRecetasAgregadas((prev) =>
        prev.map((rec) => {
          if (rec.id !== id) return rec
          const cant = rec.cantidad ?? 1
          const cu = rec.costoUnitarioEfectivo ?? (cant > 0 ? rec.recetacostoparcial / cant : 0)
          return { ...rec, cantidad: num, recetacostoparcial: num * cu, costoUnitarioEfectivo: cu }
        }),
      )
    }
  }

  const handleRecetaCantidadBlur = async (id: number) => {
    const rec = recetasAgregadas.find((r) => r.id === id)
    if (!rec) return

    const draft = editingRecCantidad[id]
    const cantBase = rec.cantidad ?? 1
    const num = draft !== undefined ? Number.parseFloat(draft) : cantBase

    if (isNaN(num) || num <= 0) {
      toast.error("Cantidad inválida.")
      setEditingRecCantidad((prev) => {
        const { [id]: _omit, ...rest } = prev
        return rest
      })
      return
    }

    const cu = rec.costoUnitarioEfectivo ?? (cantBase > 0 ? rec.recetacostoparcial / cantBase : 0)
    const newParcial = num * cu

    const { error } = await supabase
      .from("recetasxplatillo")
      .update({
        cantidad: num,
        recetacostoparcial: newParcial,
        fechamodificacion: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar cantidad: " + error.message)
      return
    }

    setRecetasAgregadas((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, cantidad: num, recetacostoparcial: newParcial, costoUnitarioEfectivo: cu } : r,
      ),
    )
    setEditingRecCantidad((prev) => {
      const { [id]: _omit, ...rest } = prev
      return rest
    })
  }

  const handleIngredienteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setIngredienteSearchTerm(term)
    // Si el usuario empieza a escribir después de haber seleccionado un ingrediente,
    // se asume que quiere buscar uno nuevo, así que se limpia el ID seleccionado.
    const selectedIng = ingredientes.find((i) => i.id.toString() === selIngredienteId)
    if (selIngredienteId && selectedIng && term !== `${selectedIng.codigo} - ${selectedIng.nombre}`) {
      setSelIngredienteId("")
    }
  }

  const handleSelectIngredienteFromDropdown = (ing: Ingrediente) => {
    setSelIngredienteId(ing.id.toString())
    setIngredienteSearchTerm(`${ing.codigo} - ${ing.nombre}`)
    setShowIngredienteDropdown(false)
  }

  const handleAgregarIngrediente = async () => {
    if (!selIngredienteId || !selIngredienteCantidad || !selIngredienteUnidad) {
      setErrorMessage("Favor de llenar la información faltante del ingrediente.")
      setShowErrorDialog(true)
      return
    }

    setIsSubmitting(true)
    const result = await actions.agregarIngrediente(
      platilloId!,
      Number(selIngredienteId),
      Number(selIngredienteCantidad),
      Number(selIngredienteUnidad),
    )

    if (result.success && result.ingredientes) {
      setIngredientesAgregados(
        result.ingredientes.map((i: any) => ({
          ...i,
          costoUnitarioEfectivo: i.cantidad && i.cantidad > 0 ? i.ingredientecostoparcial / i.cantidad : 0,
        })),
      )
      toast.success("Ingrediente agregado.")
      // Limpiar inputs
      setSelIngredienteId("") // Esto activará el useEffect para limpiar ingredienteSearchTerm
      setSelIngredienteCantidad("")
      setSelIngredienteUnidad("")
      setSelIngredienteCosto("")
    } else {
      // Si el error es el de duplicidad, mostrar el AlertDialog
      if (result.error === "No es posible agregar este ingrediente, puesto que ya se encuentra agregado a la receta.") {
        setShowDuplicateIngredienteModal(true)
      } else {
        setErrorMessage(result.error || "No se pudo agregar el ingrediente.")
        setShowErrorDialog(true)
      }
    }
    setIsSubmitting(false)
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
    setSelRecetaCantidad(value.toString())
    setSelRecetaCant(value.toString()) // Sincronizar con el input de rango
  }

  // NUEVO MANEJADOR: Para el input de rango de cantidad de sub-receta
  const handleCantRecetaRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSelRecetaCant(value)
    setSelRecetaCantidad(value) // Sincronizar con el input numérico
  }

  // NUEVO MANEJADOR: Para el input de precio de venta (solo números)
  const handlePrecioVentaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Solo permitir números y punto decimal
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPrecioVenta(value)
    }
  }

  const handleAgregarReceta = async () => {
    if (!selRecetaId || !selRecetaCantidad || Number(selRecetaCantidad) < 1) {
      toast.error("Favor de seleccionar una sub-receta e ingresar una cantidad válida.")
      return
    }
    if (Number(selRecetaCantidad) > maxRangeReceta) {
      toast.error(`La cantidad no puede ser mayor a la cantidad base de la sub-receta (${maxRangeReceta}).`)
      return
    }

    setIsSubmitting(true)
    const result = await actions.agregarReceta(platilloId!, Number(selRecetaId), Number(selRecetaCantidad))

    if (result.success && result.recetas) {
      setRecetasAgregadas(
        result.recetas.map((r: any) => ({
          ...r,
          costoUnitarioEfectivo: r.cantidad && r.cantidad > 0 ? r.recetacostoparcial / r.cantidad : 0,
        })),
      )
      toast.success("Sub-Receta agregada.")
      setSelRecetaId("")
      setSelRecetaCosto("")
      setSelRecetaCantidad("1") // Reset
      setSelRecetaCant("1") // Reset
      setSelRecetaUnidadBase("") // Reset
      setMaxRangeReceta(1) // Reset
    } else {
      // Si el error es el de duplicidad, mostrar el AlertDialog
      if (result.error === "No es posible agregar esta Sub-Receta, puesto que ya se encuentra agregada a la receta.") {
        setShowDuplicateRecetaModal(true)
      } else {
        toast.error(result.error || "No se pudo agregar la sub-receta.")
      }
    }
    setIsSubmitting(false)
  }

  const handleEliminarIngrediente = async (ingredienteXPlatilloId: number) => {
    setIsSubmitting(true)
    const result = await actions.eliminarIngredienteDePlatillo(platilloId!, ingredienteXPlatilloId)

    if (result.success) {
      setIngredientesAgregados((prev) => prev.filter((i) => i.id !== ingredienteXPlatilloId))
      toast.success("Ingrediente eliminado de la receta.")
    } else {
      toast.error(result.error || "No se pudo eliminar el ingrediente de la receta.")
    }
    setIsSubmitting(false)
  }

  const handleEliminarReceta = async (IdToDelete: number) => {
    setIsSubmitting(true)
    const result = await actions.eliminarRecetaDePlatillo(platilloId!, IdToDelete)

    if (result.success) {
      console.log("Se elimino la subreceta")
      setRecetasAgregadas((prev) => prev.filter((r) => r.id !== IdToDelete))
      toast.success("Sub-Receta eliminada de la receta.")
    } else {
      toast.error(result.error || "No se pudo eliminar la sub-receta de la receta.")
      console.log(result.error)
    }
    setIsSubmitting(false)
  }

  const handleRegistroCompleto = async (forzarSinPrecio = false) => {
    if (!menuNom) {
      toast.error("La receta no se encuentra asignada a ningun Menu, favor de llenar la informacion.")
      return
    }

    // Si no hay precio y el usuario no ha confirmado registrar sin él → modal de confirmación
    if (!forzarSinPrecio && (!precioVenta || Number(precioVenta) <= 0)) {
      setShowSinPrecioDialog(true)
      return
    }

    const precioVentaNum = forzarSinPrecio ? 0 : Number(precioVenta)
    const costoAdmin = costoAdministrativoPlatillo || 0
    const precioConIVANum = forzarSinPrecio ? 0 : Number(precioConIVA)
    const costoPorcentualNum = forzarSinPrecio ? 0 : Number(costoPorcentual)

    // Validación del precio mínimo sugerido sólo si hay precio capturado
    if (!forzarSinPrecio && precioConIVANum < (precioSugeridoPlatillo || 0)) {
      setErrorMessage(
        `El precio con IVA no puede ser menor al precio mínimo sugerido ($${(precioSugeridoPlatillo || 0).toFixed(2)}).`,
      )
      setShowErrorDialog(true)
      return
    }

    setIsSubmitting(true)
    setShowCookingAnimation(true) // Mostrar la animación de cocinando

    try {
      // Ejecutar la acción y el temporizador de 6 segundos en paralelo
      const [result] = await Promise.all([
        actions.finalizarRegistro(
          platilloId!,
          Number(menuId),
          precioVentaNum,
          costoAdmin,
          precioConIVANum,
          costoPorcentualNum,
          Number(hotelId), // Agregar el hotelId como parámetro
        ),
        new Promise((resolve) => setTimeout(resolve, 6000)), // Mínimo 6 segundos de animación
      ])

      if (result.success) {
        setValidaRegistroId(1)
        advanceToEtapa(5) // Cambiar a la nueva Etapa 5
      } else {
        toast.error(result.error || "Error al finalizar el registro.")
      }
    } catch (error) {
      console.error("Error al finalizar el registro:", error)
      toast.error("Ocurrió un error inesperado al finalizar el registro.")
    } finally {
      setShowCookingAnimation(false) // Ocultar la animación
      setIsSubmitting(false)
    }
  }

  // Esta función es llamada por el AlertDialog y resuelve la promesa de navegación.
  // - Si la receta NO está vinculada a un menú (validaRegistroId === 0): se borra en background.
  // - Si ya tiene menú vinculado: no entra al modal porque el guard ya está desactivado.
  // La navegación se resuelve INMEDIATAMENTE — la limpieza corre fire-and-forget para no bloquear.
  const handleLeavePage = useCallback(
    (confirm: boolean) => {
      setShowLeaveConfirm(false)
      if (confirm) {
        resolveNavigationRef.current?.(true)
        resolveNavigationRef.current = null
        // Sólo borrar si no hay menú asignado todavía
        if (platilloId && validaRegistroId === 0) {
          actions
            .cancelarRegistro(platilloId)
            .then((r) => {
              if (!r.success) console.error("Error al cancelar registro:", r.error)
            })
            .catch((e) => console.error("Error inesperado en cancelarRegistro:", e))
        }
      } else {
        resolveNavigationRef.current?.(false)
        resolveNavigationRef.current = null
      }
    },
    [platilloId, validaRegistroId],
  )

  // Esta es la función que se registra en el NavigationGuardProvider
  const checkLeaveAndConfirm = useCallback(
    async (targetPath: string): Promise<boolean> => {
      if (platilloId && validaRegistroId === 0) {
        return new Promise<boolean>((resolve) => {
          resolveNavigationRef.current = resolve // Almacenar la función resolve de la promesa
          setShowLeaveConfirm(true) // Mostrar el modal
          setNextPath(targetPath) // Guardar la ruta a la que se intenta navegar
        })
      }
      return true // No hay proceso incompleto, se puede navegar libremente
    },
    [platilloId, validaRegistroId],
  )

  // Efecto para registrar/desregistrar la guardia de navegación en el contexto
  useEffect(() => {
    if (platilloId !== null && validaRegistroId === 0) {
      // Si hay un platillo en proceso y no está validado como completo
      setGuard(checkLeaveAndConfirm)
    } else {
      // Si no hay proceso o ya está completo, desregistrar la guardia
      setGuard(null)
    }
    // Limpiar al desmontar el componente
    return () => {
      setGuard(null)
    }
  }, [platilloId, validaRegistroId, setGuard, checkLeaveAndConfirm])

  // --- RENDERIZADO ---

  if (loading) {
    return <Loading />
  }

  const progressValue = (etapa / 5) * 100 // Ajustar el cálculo del progreso para 5 etapas

  return (
    <Suspense fallback={<Loading />}>
      <div className="container mx-auto max-w-5xl p-6">
        {/* Modal de confirmación de abandono */}
        <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Abandonar el registro de receta?</AlertDialogTitle>
              <AlertDialogDescription>
                La receta aún no se ha vinculado a un menú. Si sales ahora, la receta y su contenido se eliminarán para no dejar datos incompletos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => handleLeavePage(false)}>Permanecer</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleLeavePage(true)}>Salir y descartar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de éxito de registro (Mantenido según la solicitud) */}
        <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¡Registro Exitoso!</AlertDialogTitle>
              <AlertDialogDescription>Receta registrada exitosamente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => router.push("/platillos")}>Aceptar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de duplicidad de sub-receta */}
        <AlertDialog open={showDuplicateRecetaModal} onOpenChange={setShowDuplicateRecetaModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Error al agregar Sub-Receta</AlertDialogTitle>
              <AlertDialogDescription>
                No es posible agregar esta Sub-Receta, puesto que ya se encuentra agregada a la receta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowDuplicateRecetaModal(false)}>Aceptar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Nuevo Modal de duplicidad de ingrediente */}
        <AlertDialog open={showDuplicateIngredienteModal} onOpenChange={setShowDuplicateIngredienteModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Error al agregar Ingrediente</AlertDialogTitle>
              <AlertDialogDescription>
                No es posible agregar este ingrediente, puesto que ya se encuentra agregado a la receta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowDuplicateIngredienteModal(false)}>Aceptar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Nuevo Modal de error de validación (para handleRegistrarPlatillo y handleAgregarIngrediente) */}
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

        {/* Modal de confirmación: registrar sin precio */}
        <AlertDialog open={showSinPrecioDialog} onOpenChange={setShowSinPrecioDialog}>
          <AlertDialogContent className="max-w-md p-0 overflow-hidden border-0">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-6 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/25 p-3 backdrop-blur-sm shadow-lg ring-2 ring-white/30">
                  <HelpCircle className="h-7 w-7" />
                </div>
                <div>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-white text-left">
                      ¿Registrar sin precio?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-white/90 text-left mt-1">
                      No se ha asignado ningún precio de venta a la receta. ¿Realmente deseas continuar con el registro?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-white flex flex-col gap-2">
              <Button
                onClick={() => {
                  setShowSinPrecioDialog(false)
                  handleRegistroCompleto(true)
                }}
                disabled={isSubmitting}
                className="bg-[#5d8f72] hover:bg-[#44785a] text-white"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Sí, registrar sin precio
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSinPrecioDialog(false)}
                disabled={isSubmitting}
                className="text-gray-500 hover:bg-gray-100"
              >
                Cancelar
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de cambios guardados */}
        <AlertDialog open={showSavedModal} onOpenChange={setShowSavedModal}>
          <AlertDialogContent className="max-w-md p-0 overflow-hidden border-0">
            <div className="bg-gradient-to-br from-[#58e0be] to-[#5d8f72] px-6 py-6 text-white text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm shadow-lg ring-4 ring-white/20 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <AlertDialogHeader className="mt-4">
                <AlertDialogTitle className="text-2xl font-bold text-white text-center">
                  ¡Cambios guardados!
                </AlertDialogTitle>
                <AlertDialogDescription className="text-white/90 text-center mt-1">
                  {savedModalMessage}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <div className="px-6 py-4 bg-white flex justify-center">
              <AlertDialogAction
                onClick={() => setShowSavedModal(false)}
                className="bg-[#5d8f72] hover:bg-[#44785a] text-white min-w-[120px]"
              >
                Continuar
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Animación de cocinando */}
        {showCookingAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl">
              <div className="relative w-24 h-24 mb-4">
                <Image
                  src="/images/design-mode/RegistroReceta%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29(1).gif"
                  alt="Cocinando"
                  width={200}
                  height={200}
                  className="absolute inset-0 animate-bounce-slow" // Animación de rebote lento
                />
                {/*
              <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-[#58e0be]" />{" "}
              */}
                {/* Icono giratorio */}
              </div>
              <p className="text-lg font-semibold text-gray-800">Cocinando tu receta...</p>
              <p className="text-sm text-gray-600">Esto puede tomar unos segundos.</p>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Registro de nueva receta</h1>
          {/* El botón "Regresar" ahora simplemente llama a router.push,
            la intercepción la manejará el NavigationGuardProvider */}
          {/*<Button id="btnRegresar" name="btnRegresar" variant="outline" onClick={() => router.push("/platillos")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Regresar
        </Button>*/}
        </div>

        <div className="mb-8">
          <Progress value={progressValue} className="h-2 [&>*]:bg-[#58e0be]" />
          <div className="mt-4 grid grid-cols-5 gap-2">
            {[
              { num: 1, label: "Info. Básica", icon: ChefHat },
              { num: 2, label: "Asignar Menú", icon: Utensils },
              { num: 3, label: "Contenido", icon: ListChecks },
              { num: 4, label: "Resumen", icon: Receipt },
              { num: 5, label: "Finalizado", icon: CheckCircle2 },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = etapa === tab.num
              const isCompleted = etapa > tab.num || (tab.num < 5 && validaRegistroId === 1)
              const isUnlocked = tab.num <= maxEtapaAlcanzada
              const isLocked = !isUnlocked
              return (
                <button
                  key={tab.num}
                  type="button"
                  onClick={() => goToEtapa(tab.num)}
                  disabled={isLocked}
                  className={[
                    "group relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all duration-300",
                    isActive
                      ? "border-[#58e0be] bg-gradient-to-br from-[#58e0be]/15 to-[#58e0be]/5 shadow-lg shadow-[#58e0be]/20 scale-[1.03]"
                      : isCompleted
                        ? "border-[#5d8f72]/40 bg-[#5d8f72]/5 hover:border-[#5d8f72] hover:bg-[#5d8f72]/10 cursor-pointer"
                        : isUnlocked
                          ? "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                          : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-br from-[#58e0be] to-[#5d8f72] text-white shadow-md"
                        : isCompleted
                          ? "bg-[#5d8f72] text-white"
                          : isUnlocked
                            ? "bg-gray-200 text-gray-600"
                            : "bg-gray-200 text-gray-400",
                    ].join(" ")}
                  >
                    {isCompleted && !isActive ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                    {isActive && (
                      <span className="absolute -inset-1 rounded-full border-2 border-[#58e0be] animate-ping opacity-40"></span>
                    )}
                  </div>
                  <span
                    className={[
                      "text-xs font-semibold tracking-tight",
                      isActive ? "text-[#3a7d6a]" : isCompleted ? "text-[#5d8f72]" : "text-gray-500",
                    ].join(" ")}
                  >
                    {tab.label}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                    Paso {tab.num}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* --- ETAPA 1: INFORMACIÓN BÁSICA --- */}
        {etapa === 1 && (
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="bg-gradient-to-r from-[#58e0be] to-[#5d8f72] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                  <ChefHat className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Información Básica de la Receta</CardTitle>
                  <CardDescription className="text-white/85">
                    {platilloId
                      ? "La receta ya fue registrada. Puedes editar los datos y guardar los cambios."
                      : "Captura los datos generales para iniciar el registro."}
                  </CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="txtNombrePlatilloNuevo">Nombre Receta *</Label>
                    <Input
                      id="txtNombrePlatilloNuevo"
                      name="txtNombrePlatilloNuevo"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      maxLength={150}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="txtDescripcionPlatillo">Descripción *</Label>
                    <Textarea
                      id="txtDescripcionPlatillo"
                      name="txtDescripcionPlatillo"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      maxLength={150}
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="txtPlatilloInstrucciones">Instrucciones de Elaboración</Label>
                    <Textarea
                      id="txtPlatilloInstrucciones"
                      name="txtPlatilloInstrucciones"
                      value={instrucciones}
                      onChange={(e) => setInstrucciones(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="txtPlatilloTiempo">Tiempo Preparación (minutos)</Label>
                    <Input
                      id="txtPlatilloTiempo"
                      name="txtPlatilloTiempo"
                      type="number"
                      value={tiempo}
                      onChange={(e) => setTiempo(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ImagenFile">Cargar Imagen (Opcional: .jpg, &lt;10MB, 500x500px)</Label>
                  <div className="flex h-64 w-full items-center justify-center rounded-md border-2 border-dashed border-[#58e0be]/40 bg-[#58e0be]/5">
                    {imagenPreview ? (
                      <img
                        src={imagenPreview || "/placeholder.svg"}
                        alt="Vista previa"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-[#5d8f72]/60" />
                        <p className="text-sm text-gray-600">Arrastra o selecciona una imagen</p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="ImagenFile"
                    name="ImagenFile"
                    type="file"
                    accept="image/jpeg, image/jpg, image/png, image/webp"
                    onChange={handleImageChange}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2 bg-gray-50/50 border-t">
              {platilloId ? (
                <>
                  <Button
                    id="btnGuardarCambiosEtapa1"
                    name="btnGuardarCambiosEtapa1"
                    onClick={handleGuardarCambiosEtapa1}
                    disabled={isSubmitting}
                    className="bg-[#5d8f72] hover:bg-[#44785a] text-white"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                  </Button>
                  <Button
                    onClick={() => goToEtapa(2)}
                    disabled={maxEtapaAlcanzada < 2}
                    variant="outline"
                  >
                    Siguiente paso
                  </Button>
                </>
              ) : (
                <Button
                  id="btnRegistrarPlatillo"
                  name="btnRegistrarPlatillo"
                  onClick={handleRegistrarPlatillo}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#58e0be] to-[#5d8f72] hover:from-[#46c9a8] hover:to-[#44785a] text-white shadow-md"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar y Continuar
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {/* --- ETAPA 2: ASIGNAR A MENÚ --- */}
        {etapa === 2 && (
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="bg-gradient-to-r from-[#58e0be] to-[#5d8f72] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                  <Utensils className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Asignar a un Menú</CardTitle>
                  <CardDescription className="text-white/85">Es requerido asignar la receta a un Menú para su completo registro.</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="ddlHotel">Hotel</Label>
                  <Select value={hotelId} onValueChange={setHotelId}>
                    <SelectTrigger id="ddlHotel" name="ddlHotel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hoteles.map((h) => (
                        <SelectItem key={h.id} value={h.id.toString()}>
                          {h.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ddlRestaurante">Restaurante</Label>
                  <Select value={restauranteId} onValueChange={setRestauranteId} disabled={!hotelId}>
                    <SelectTrigger id="ddlRestaurante" name="ddlRestaurante">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurantes.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ddlMenu">Menú</Label>
                  <Select value={menuId} onValueChange={setMenuId} disabled={!restauranteId}>
                    <SelectTrigger id="ddlMenu" name="ddlMenu">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {menus.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50/50 border-t">
              <Button variant="outline" onClick={() => goToEtapa(1)}>
                Anterior
              </Button>
              <Button
                id="btnContinuar"
                name="btnContinuar"
                onClick={handleContinuarEtapa2}
                disabled={!menuId}
                className="bg-gradient-to-r from-[#58e0be] to-[#5d8f72] hover:from-[#46c9a8] hover:to-[#44785a] text-white shadow-md"
              >
                Continuar
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* --- ETAPA 3: CONTENIDO --- */}
        {etapa === 3 && (
          <div className="space-y-6">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="bg-gradient-to-r from-[#58e0be] to-[#5d8f72] px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                    <ListChecks className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Agregar Ingredientes</CardTitle>
                    <CardDescription className="text-white/85">Selecciona cada ingrediente que forma parte de tu receta.</CardDescription>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="md:col-span-2 relative">
                    {" "}
                    {/* Añadido relative para el posicionamiento del dropdown */}
                    <Label htmlFor="txtIngredienteSearch">Ingrediente</Label>
                    <Input
                      id="txtIngredienteSearch"
                      name="txtIngredienteSearch"
                      value={ingredienteSearchTerm}
                      onChange={handleIngredienteSearchChange}
                      onFocus={() =>
                        ingredienteSearchTerm.length >= 2 &&
                        filteredIngredientes.length > 0 &&
                        setShowIngredienteDropdown(true)
                      }
                      onBlur={() => setTimeout(() => setShowIngredienteDropdown(false), 100)} // Pequeño delay para permitir el click
                      placeholder="Buscar por código o nombre..."
                      autoComplete="off"
                    />
                    {showIngredienteDropdown && filteredIngredientes.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                        {filteredIngredientes.map((ing) => (
                          <div
                            key={ing.id}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                            onMouseDown={() => handleSelectIngredienteFromDropdown(ing)} // Usar onMouseDown
                          >
                            {ing.codigo} - {ing.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="txtCantidadIngrediente">Cantidad</Label>
                    <Input
                      id="txtCantidadIngrediente"
                      name="txtCantidadIngrediente"
                      type="number"
                      value={selIngredienteCantidad}
                      onChange={(e) => setSelIngredienteCantidad(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ddlUnidadMedida">Unidad</Label>
                    <Select
                      value={selIngredienteUnidad}
                      onValueChange={setSelIngredienteUnidad}
                      disabled={!selIngredienteId || unidades.length === 0} // Deshabilitar si no hay ingrediente o unidades
                    >
                      <SelectTrigger id="ddlUnidadMedida" name="ddlUnidadMedida">
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.descripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="txtCostoIngrediente">Costo Ingrediente</Label>
                  <Input id="txtCostoIngrediente" name="txtCostoIngrediente" value={selIngredienteCosto} disabled />
                </div>
                <div className="flex justify-end">
                  <Button
                    id="btnAgregarIngrediente"
                    name="btnAgregarIngrediente"
                    onClick={handleAgregarIngrediente}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Agregar Ingrediente
                  </Button>
                </div>
                {ingredientesAgregados.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-[140px]">Cantidad</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Costo Parcial</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredientesAgregados.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell>{i.nombre}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingIngCantidad[i.id] ?? String(i.cantidad)}
                              onChange={(e) => handleIngredienteCantidadChange(i.id, e.target.value)}
                              onBlur={() => handleIngredienteCantidadBlur(i.id)}
                              className="h-9 w-28 text-right focus-visible:ring-[#58e0be]"
                            />
                          </TableCell>
                          <TableCell>{i.unidad}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${i.ingredientecostoparcial.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleEliminarIngrediente(i.id)}
                              disabled={isSubmitting}
                            >
                              Eliminar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="bg-gradient-to-r from-[#5d8f72] to-[#3a7d6a] px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                    <ChefHat className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Agregar Sub-Recetas</CardTitle>
                    <CardDescription className="text-white/85">Suma sub-recetas previamente creadas como parte de la receta.</CardDescription>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                  <div className="col-span-6">
                    <Label htmlFor="ddlReceta">Sub-Receta</Label>
                    <Select value={selRecetaId} onValueChange={setSelRecetaId}>
                      <SelectTrigger
                        id="ddlReceta"
                        name="ddlReceta"
                        className="flex h-10 w-96 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                      >
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {recetas.map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.nombre} {/* Revertido para mostrar el nombre de la receta */}
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
                      value={selRecetaCantidad}
                      onChange={handleCantidadRecetaChange}
                      min="1"
                      max={maxRangeReceta}
                      disabled={!selRecetaId || maxRangeReceta === 0}
                      className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="txtCant">Cantidad por unidad</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              Rango de cantidad, favor de seleccionar la cantidad requerida de la subreceta que utiliza
                              para esta Receta, la linea define el rango de la cantidad minima y maxima que se puede
                              utilizar con esta subreceta
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="txtCant"
                      name="txtCant"
                      type="range"
                      value={selRecetaCant}
                      onChange={handleCantRecetaRangeChange}
                      min="1"
                      max={maxRangeReceta}
                      disabled={!selRecetaId || maxRangeReceta === 0}
                    />
                    {/* INICIO: Código reemplazado */}
                    <div className="text-sm text-muted-foreground mt-1 flex items-center justify-between">
                      <span>
                        {selRecetaCantidad} / {maxRangeReceta} {selRecetaUnidadBase}
                      </span>
                      {selRecetaId && selRecetaCantidad && selRecetaCosto && (
                        <span className="font-semibold text-primary">
                          Costo: ${((Number(selRecetaCosto) / maxRangeReceta) * Number(selRecetaCantidad)).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {/* FIN: Código reemplazado */}
                  </div>
                  <div>
                    <Label htmlFor="txtUnidadBase">Unidad Base</Label>
                    <Input
                      id="txtUnidadBase"
                      name="txtUnidadBase"
                      className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      type="text"
                      value={selRecetaUnidadBase}
                      disabled
                    />
                  </div>
                  <div className="w-[180px]">
                    <Label htmlFor="txtCostoReceta">Costo Total Sub-Receta</Label>
                    <Input id="txtCostoReceta" name="txtCostoReceta" value={selRecetaCosto} disabled />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    id="btnAgregarReceta"
                    name="btnAgregarReceta"
                    onClick={handleAgregarReceta}
                    disabled={
                      isSubmitting ||
                      !selRecetaId ||
                      Number(selRecetaCantidad) < 1 ||
                      Number(selRecetaCantidad) > maxRangeReceta
                    }
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Agregar Receta
                  </Button>
                </div>
                {recetasAgregadas.length > 0 && (
                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-[140px]">Cantidad</TableHead>
                        <TableHead className="text-right">Costo Parcial</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recetasAgregadas.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.nombre}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingRecCantidad[r.id] ?? String(r.cantidad ?? 1)}
                              onChange={(e) => handleRecetaCantidadChange(r.id, e.target.value)}
                              onBlur={() => handleRecetaCantidadBlur(r.id)}
                              className="h-9 w-28 text-right focus-visible:ring-[#58e0be]"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${r.recetacostoparcial.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleEliminarReceta(r.id)}
                              disabled={isSubmitting}
                            >
                              Eliminar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => goToEtapa(2)}>
                Anterior
              </Button>
              <Button
                id="btnContinuarIngrediente"
                name="btnContinuarIngrediente"
                onClick={() => advanceToEtapa(4)}
                disabled={ingredientesAgregados.length === 0 && recetasAgregadas.length === 0}
                className="bg-gradient-to-r from-[#58e0be] to-[#5d8f72] hover:from-[#46c9a8] hover:to-[#44785a] text-white shadow-md"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* --- ETAPA 4: RESUMEN --- */}
        {etapa === 4 && (
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="bg-gradient-to-r from-[#58e0be] to-[#5d8f72] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Resumen y Confirmación</CardTitle>
                  <CardDescription className="text-white/85">Revisa la información, define el precio de venta y completa el registro.</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 pt-6">
              {/* Header info: receta + asignación */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-gradient-to-br from-[#58e0be]/5 to-transparent p-4">
                  <h3 className="mb-2 text-sm font-bold text-[#3a7d6a] uppercase tracking-wide">Información de la Receta</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><span className="font-semibold">Nombre:</span> {nombre}</p>
                    <p><span className="font-semibold">Descripción:</span> {descripcion}</p>
                    {instrucciones && <p><span className="font-semibold">Instrucciones:</span> {instrucciones}</p>}
                    {tiempo && <p><span className="font-semibold">Tiempo:</span> {tiempo} min</p>}
                    {imagenPreview && (
                      <img
                        src={imagenPreview || "/placeholder.svg"}
                        alt="Vista previa"
                        className="mt-2 h-20 w-20 object-cover rounded-md ring-1 ring-gray-200"
                      />
                    )}
                  </div>
                </div>
                <div className="rounded-lg border bg-gradient-to-br from-[#5d8f72]/5 to-transparent p-4">
                  <h3 className="mb-2 text-sm font-bold text-[#3a7d6a] uppercase tracking-wide">Asignación</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><span className="font-semibold">Hotel:</span> {hoteles.find((h) => h.id.toString() === hotelId)?.nombre}</p>
                    <p><span className="font-semibold">Restaurante:</span> {restaurantes.find((r) => r.id.toString() === restauranteId)?.nombre}</p>
                    <p><span className="font-semibold">Menú:</span> {menuNom}</p>
                  </div>
                </div>
              </div>

              {/* Elaboración de la Receta */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Elaboración de la Receta</h3>
                {(ingredientesAgregados.length > 0 || recetasAgregadas.length > 0) ? (
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
                        {ingredientesAgregados.map((ing) => {
                          const costoUnit = ing.costoUnitarioEfectivo ?? (ing.cantidad > 0 ? ing.ingredientecostoparcial / ing.cantidad : 0)
                          return (
                            <TableRow key={`ing-${ing.id}`}>
                              <TableCell className="w-[10%]">
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Ingrediente</Badge>
                              </TableCell>
                              <TableCell className="w-[25%]">{ing.nombre}</TableCell>
                              <TableCell className="w-[15%] text-right">{formatCurrency(costoUnit)}</TableCell>
                              <TableCell className="w-[15%] text-center">{ing.unidad || "N/A"}</TableCell>
                              <TableCell className="w-[10%] text-center text-green-600">{ing.cantidad}</TableCell>
                              <TableCell className="w-[25%] text-right text-green-600">{formatCurrency(ing.ingredientecostoparcial)}</TableCell>
                            </TableRow>
                          )
                        })}
                        {recetasAgregadas.map((rec) => {
                          const cant = rec.cantidad ?? 1
                          const costoUnit = rec.costoUnitarioEfectivo ?? (cant > 0 ? rec.recetacostoparcial / cant : 0)
                          return (
                            <TableRow key={`rec-${rec.id}`}>
                              <TableCell className="w-[10%]">
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">Sub-Receta</Badge>
                              </TableCell>
                              <TableCell className="w-[25%]">{rec.nombre}</TableCell>
                              <TableCell className="w-[15%] text-right">{formatCurrency(costoUnit)}</TableCell>
                              <TableCell className="w-[15%] text-center">N/A</TableCell>
                              <TableCell className="w-[10%] text-center text-green-600">{cant}</TableCell>
                              <TableCell className="w-[25%] text-right text-green-600">{formatCurrency(rec.recetacostoparcial)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    <div className="border-t-2 border-blue-500 px-4 py-2 flex justify-end">
                      <span className="text-sm font-semibold text-gray-700">Total Costo Parcial:{" "}
                        <span className="text-base font-bold text-orange-600">
                          {formatCurrency(
                            ingredientesAgregados.reduce((sum, ing) => sum + (ing.ingredientecostoparcial || 0), 0) +
                            recetasAgregadas.reduce((sum, rec) => sum + (rec.recetacostoparcial || 0), 0)
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
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50/50 border-t">
              <Button variant="outline" onClick={() => goToEtapa(3)}>
                Anterior
              </Button>
              <Button
                id="btnRegistroCompleto"
                name="btnRegistroCompleto"
                onClick={() => handleRegistroCompleto()}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#58e0be] to-[#5d8f72] hover:from-[#46c9a8] hover:to-[#44785a] text-white shadow-md"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registro Completo de Platillo
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* --- ETAPA 5: REGISTRO COMPLETADO --- */}
        {etapa === 5 && (
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="bg-gradient-to-r from-[#5d8f72] to-[#3a7d6a] px-6 py-6 text-white text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl text-white">¡Registro Completado!</CardTitle>
            </div>
            <CardContent className="space-y-4 text-center pt-6">
              <p className="text-lg font-semibold text-[#5d8f72]">
                El registro del platillo/receta se realizó correctamente y sin errores.
              </p>
              <p className="text-md text-gray-700">En {countdown} segundos serás dirigido a la página de platillos.</p>
              <Button
                onClick={() => router.push("/platillos")}
                className="bg-[#5d8f72] hover:bg-[#44785a] text-white"
              >
                Regresar a Platillos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Suspense>
  )
}
