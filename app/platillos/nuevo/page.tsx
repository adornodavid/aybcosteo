"use client"

/* ==================================================
  Imports
================================================== */
import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UploadCloud } from "lucide-react"
import { toast } from "sonner"
import { Suspense } from "react"
import Loading from "./loading"
import Image from "next/image" // Importar Image de next/image

import * as actions from "@/app/actions/platillos-wizard-actions"
import { useNavigationGuard } from "@/contexts/navigation-guard-context" // Importar el hook del contexto

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
}
interface RecetaAgregada {
  id: number
  nombre: string
  recetacostoparcial: number
}

const MAX_IMAGE_SIZE_MB = 10
const MAX_IMAGE_DIMENSION = 500

export default function NuevoPlatilloPage() {
  const router = useRouter()
  const { setGuard } = useNavigationGuard() // Obtener setGuard del contexto

  // --- ESTADO GENERAL ---
  const [etapa, setEtapa] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCookingAnimation, setShowCookingAnimation] = useState(false) // Nuevo estado para la animación

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
        const Costoporcentual = (costoAdministrativoPlatillo / precioVentaNum) * 100

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
      setEtapa(2)
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
    setEtapa(3)
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
      setIngredientesAgregados(result.ingredientes)
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
      setRecetasAgregadas(result.recetas)
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

  const handleRegistroCompleto = async () => {
    if (!menuNom) {
      toast.error("La receta no se encuentra asignada a ningun Menu, favor de llenar la informacion.")
      return
    }

    if (!precioVenta || Number(precioVenta) <= 0) {
      setErrorMessage("Favor de ingresar un precio de venta válido.")
      setShowErrorDialog(true)
      return
    }

    const precioVentaNum = Number(precioVenta)
    const costoAdmin = costoAdministrativoPlatillo || 0
    const precioConIVANum = Number(precioConIVA)
    const costoPorcentualNum = Number(costoPorcentual)

    if (precioVentaNum < (precioSugeridoPlatillo || 0)) {
      setErrorMessage(
        `El precio de venta no puede ser menor al precio mínimo sugerido ($${(precioSugeridoPlatillo || 0).toFixed(2)}).`,
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
        ),
        new Promise((resolve) => setTimeout(resolve, 6000)), // Mínimo 6 segundos de animación
      ])

      if (result.success) {
        setValidaRegistroId(1)
        setEtapa(5) // Cambiar a la nueva Etapa 5
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

  // Esta función es llamada por el AlertDialog y resuelve la promesa de navegación
  const handleLeavePage = useCallback(
    async (confirm: boolean) => {
      setShowLeaveConfirm(false) // Cerrar el modal
      if (confirm) {
        if (platilloId) {
          const result = await actions.cancelarRegistro(platilloId)
          if (result.success) {
            toast.info("Registro cancelado y datos depurados.")
          } else {
            toast.error(result.error || "Error al cancelar el registro y depurar datos.")
          }
        }
        resolveNavigationRef.current?.(true) // Resolver la promesa con true (proceder)
      } else {
        resolveNavigationRef.current?.(false) // Resolver la promesa con false (cancelar)
      }
      resolveNavigationRef.current = null // Limpiar la referencia
    },
    [platilloId],
  )

  // Esta es la función que se registra en el NavigationGuardContext
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
              <AlertDialogTitle>¿Estás seguro que deseas abandonar el registro de receta?</AlertDialogTitle>
              <AlertDialogDescription>Se perderá la información cargada previamente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => handleLeavePage(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleLeavePage(true)}>Aceptar</AlertDialogAction>
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

        {/* Animación de cocinando */}
        {showCookingAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl">
              <div className="relative w-24 h-24 mb-4">
                <Image
                  src="https://nxtrsibnomdqmzcrwedc.supabase.co/storage/v1/object/public/imagenes/AnimationGif/RegistroReceta.gif"
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
          <div className="mt-2 grid grid-cols-5 text-center text-sm">
            {" "}
            {/* Ajustado a 5 columnas */}
            <div className={etapa >= 1 ? "font-bold text-[#58e0be]" : "text-muted-foreground"}>Info. Básica</div>
            <div className={etapa >= 2 ? "font-bold text-[#58e0be]" : "text-muted-foreground"}>Asignar Menú</div>
            <div className={etapa >= 3 ? "font-bold text-[#58e0be]" : "text-muted-foreground"}>Contenido</div>
            <div className={etapa >= 4 ? "font-bold text-[#58e0be]" : "text-muted-foreground"}>Resumen</div>
            <div className={etapa >= 5 ? "font-bold text-[#58e0be]" : "text-muted-foreground"}>Finalizado</div>{" "}
            {/* Nueva etapa */}
          </div>
        </div>

        {/* --- ETAPA 1: INFORMACIÓN BÁSICA --- */}
        {etapa === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Etapa 1: Información Básica de la Receta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      disabled={platilloId !== null}
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
                      disabled={platilloId !== null}
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
                      disabled={platilloId !== null}
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
                      disabled={platilloId !== null}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ImagenFile">Cargar Imagen (Opcional: .jpg, &lt;10MB, 500x500px)</Label>
                  <div className="flex h-64 w-full items-center justify-center rounded-md border-2 border-dashed">
                    {imagenPreview ? (
                      <img
                        src={imagenPreview || "/placeholder.svg"}
                        alt="Vista previa"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                        <p>Arrastra o selecciona una imagen</p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="ImagenFile"
                    name="ImagenFile"
                    type="file"
                    accept="image/jpeg, image/jpg, image/png, image/webp" // Aceptar más formatos si el backend los soporta
                    onChange={handleImageChange}
                    className="mt-2"
                    disabled={platilloId !== null}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                id="btnRegistrarPlatillo"
                name="btnRegistrarPlatillo"
                onClick={handleRegistrarPlatillo}
                disabled={isSubmitting || platilloId !== null}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar y Continuar
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* --- ETAPA 2: ASIGNAR A MENÚ --- */}
        {etapa === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Etapa 2: Asignar a un Menú</CardTitle>
              <CardDescription>Es requerido asignar la receta a un Menú para su completo registro.</CardDescription>
            </CardHeader>
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
            <CardFooter className="flex justify-between">
              {/*<Button variant="outline" onClick={() => setEtapa(1)}>
              Anterior
            </Button>*/}
              <Button id="btnContinuar" name="btnContinuar" onClick={handleContinuarEtapa2} disabled={!menuId}>
                Continuar
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* --- ETAPA 3: CONTENIDO --- */}
        {etapa === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agregar Ingredientes</CardTitle>
              </CardHeader>
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
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Costo Parcial</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredientesAgregados.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell>{i.nombre}</TableCell>
                          <TableCell>{i.cantidad}</TableCell>
                          <TableCell>{i.unidad}</TableCell>
                          <TableCell className="text-right">${i.ingredientecostoparcial.toFixed(2)}</TableCell>
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

            <Card>
              <CardHeader>
                <CardTitle>Agregar Sub-Recetas</CardTitle>
              </CardHeader>
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
                    <Label htmlFor="txtCant">Rango de Cantidad</Label>
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
                  {/* FIN NUEVOS INPUTS */}
                  <div>
                    <Label htmlFor="txtCostoReceta">Costo Sub-Receta</Label>
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
                        <TableHead className="text-right">Costo Parcial</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recetasAgregadas.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.nombre}</TableCell>
                          <TableCell className="text-right">${r.recetacostoparcial.toFixed(2)}</TableCell>
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
              <Button variant="outline" onClick={() => setEtapa(2)}>
                Anterior
              </Button>
              <Button
                id="btnContinuarIngrediente"
                name="btnContinuarIngrediente"
                onClick={() => setEtapa(4)}
                disabled={ingredientesAgregados.length === 0 && recetasAgregadas.length === 0} // Habilitar si hay ingredientes O recetas
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* --- ETAPA 4: RESUMEN --- */}
        {etapa === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Etapa 4: Resumen y Confirmación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold">Información de la Receta</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Nombre:</strong> {nombre}
                    </p>
                    <p>
                      <strong>Descripción:</strong> {descripcion}
                    </p>
                    {instrucciones && (
                      <p>
                        <strong>Instrucciones:</strong> {instrucciones}
                      </p>
                    )}
                    {tiempo && (
                      <p>
                        <strong>Tiempo:</strong> {tiempo} minutos
                      </p>
                    )}
                    {imagenPreview && (
                      <div className="mt-2">
                        <strong>Imagen:</strong>
                        <img
                          src={imagenPreview || "/placeholder.svg"}
                          alt="Vista previa"
                          className="mt-1 h-24 w-24 object-cover rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Asignación</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Hotel:</strong> {hoteles.find((h) => h.id.toString() === hotelId)?.nombre}
                    </p>
                    <p>
                      <strong>Restaurante:</strong>{" "}
                      {restaurantes.find((r) => r.id.toString() === restauranteId)?.nombre}
                    </p>
                    <p>
                      <strong>Menú:</strong> {menuNom}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Contenido de la Receta</h3>
                {ingredientesAgregados.length > 0 && (
                  <>
                    <h4 className="mb-1 font-medium">Ingredientes:</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead className="text-right">Costo Parcial</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ingredientesAgregados.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell>{i.nombre}</TableCell>
                            <TableCell>{i.cantidad}</TableCell>
                            <TableCell className="text-right">${i.ingredientecostoparcial.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
                {recetasAgregadas.length > 0 && (
                  <>
                    <h4 className="mt-4 mb-1 font-medium">Sub-Recetas:</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead className="text-right">Costo Parcial</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recetasAgregadas.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.nombre}</TableCell>
                            <TableCell className="text-right">${r.recetacostoparcial.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
                {ingredientesAgregados.length === 0 && recetasAgregadas.length === 0 && (
                  <p className="text-muted-foreground">No se han agregado ingredientes ni sub-recetas.</p>
                )}
              </div>
              {totalCostoPlatillo !== null && (
                <div className="mt-2 text-right text-xl font-semibold text-gray-700">
                  Costo de Elaboracion: ${totalCostoPlatillo.toFixed(2)}
                </div>
              )}
              <div className="text-right text-base font-semibold text-gray-700">Variacion Precios: 5%</div>
              {costoAdministrativoPlatillo !== null && (
                <div className="mt-6 text-right text-2xl font-bold border-t-4 border-[#58e0be] pt-4">
                  Costo Total: ${costoAdministrativoPlatillo.toFixed(2)}
                </div>
              )}
              {/* Línea 1107 del código anterior, el nuevo contenido va después de este div */}
              {precioSugeridoPlatillo !== null && (
                <div className="mt-6 text-right text-lg text-black-600">
                  <span className="text-yellow-600">*</span> Precio Mínimo: ${precioSugeridoPlatillo.toFixed(2)}
                </div>
              )}
              {/* NUEVOS INPUTS PRECIO VENTA, COSTO% Y PRECIO CON IVA */}
              <div className="mt-4 flex justify-end gap-4">
                <div className="w-48">
                  <Label htmlFor="txtCostoPorcentual">Costo%</Label>
                  <Input
                    id="txtCostoPorcentual"
                    name="txtCostoPorcentual"
                    type="text"
                    value={`${costoPorcentual}%`}
                    className={`text-right ${Number(costoPorcentual) > 30.0 ? "bg-red-100" : "bg-green-100"}`}
                    disabled
                  />
                </div>
                <div className="w-64">
                  <Label htmlFor="txtPrecioVenta">Precio Venta</Label>
                  <Input
                    id="txtPrecioVenta"
                    name="txtPrecioVenta"
                    type="text"
                    value={precioVenta}
                    onChange={handlePrecioVentaChange}
                    placeholder="0.00"
                    className="text-right"
                    required
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <div className="w-64">
                  <Label htmlFor="txtPrecioConIVA">Precio con IVA</Label>
                  <Input
                    id="txtPrecioConIVA"
                    name="txtPrecioConIVA"
                    type="text"
                    value={`$${precioConIVA}`}
                    className="text-right"
                    disabled
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setEtapa(3)}>
                Anterior
              </Button>
              <Button
                id="btnRegistroCompleto"
                name="btnRegistroCompleto"
                onClick={handleRegistroCompleto}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registro Completo de Platillo
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* --- ETAPA 5: REGISTRO COMPLETADO --- */}
        {etapa === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>¡Registro Completado!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-lg font-semibold text-green-600">
                El registro del platillo/receta se realizó correctamente y sin errores.
              </p>
              <p className="text-md text-gray-700">En {countdown} segundos serás dirigido a la página de platillos.</p>
              <Button onClick={() => router.push("/platillos")}>Regresar a Platillos</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Suspense>
  )
}
