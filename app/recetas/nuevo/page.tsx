"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
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
import { Loader2, ArrowLeft, Plus, CheckCircle, ImageIcon, X, Trash2 } from "lucide-react"
import { getSession } from "@/app/actions/session-actions"
import { toast } from "sonner"
import { useNavigationGuard } from "@/contexts/navigation-guard-context"
import { getUnidadMedidaForRecetaIngrediente, registrarRecetaConImagen } from "@/app/actions/recetas-wizard-actions"
import Image from "next/image"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

interface SessionData {
  UsuarioId: string | null
  Email: string | null
  NombreCompleto: string | null
  HotelId: string | null
  RolId: string | null
  SesionActiva: boolean | null
}

interface DropdownItem {
  id: number
  nombre: string
}

interface UnidadMedida {
  id: number
  descripcion: string
  calculoconversion: number | null
}

interface Ingrediente {
  id: number
  nombre: string
  costo: number | null
  codigo: string
}

interface IngredienteRecetaDisplay {
  id: number
  ingredienteId: number
  nombre: string
  cantidad: number
  ingredientecostoparcial: number
}

interface Receta {
  id: number
  nombre: string
  costo: number | null
  cantidad: number | null
  unidadbaseid: number | null
}

export default function NuevaRecetaPage() {
  const router = useRouter()
  const { setGuard, attemptNavigation } = useNavigationGuard()

  const [sesion, setSesion] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false)

  // Estados para AlertDialog de errores
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [etapaActual, setEtapaActual] = useState(1)
  const recetaId = useRef<number | null>(null)
  const urlName = useRef<string | null>(null)
  const [validaRegistroId, setValidaRegistroId] = useState(0)

  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false)
  const [mostrarModalExito, setMostrarModalExito] = useState(false)
  const [mostrarModalIngredienteDuplicado, setMostrarModalIngredienteDuplicado] = useState(false)
  const [mostrarModalFaltanDatosEtapa2, setMostrarModalFaltanDatosEtapa2] = useState(false)
  const navegacionPendiente = useRef<string | null>(null)

  const [hoteles, setHoteles] = useState<DropdownItem[]>([])
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([])
  const [ingredientesReceta, setIngredientesReceta] = useState<IngredienteRecetaDisplay[]>([])

  // Estados para sub-recetas (después de los estados de ingredientes)
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [recetasSeleccionadas, setRecetasSeleccionadas] = useState<any[]>([])
  const [ddlRecetas, setDdlRecetas] = useState("")
  const [txtCantidadReceta, setTxtCantidadReceta] = useState("")
  const [cantidadRangoReceta, setCantidadRangoReceta] = useState([1])
  const [txtCostoReceta, setTxtCostoReceta] = useState("")
  const [txtUnidadReceta, setTxtUnidadReceta] = useState("")
  const [maxCantidadReceta, setMaxCantidadReceta] = useState(1)

  const [txtNombreRecetaNuevo, setTxtNombreRecetaNuevo] = useState("")
  const [txtNotasReceta, setTxtNotasReceta] = useState("")
  const [ddlHotel, setDdlHotel] = useState("")
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [etapa1Bloqueada, setEtapa1Bloqueada] = useState(false)

  const [txtCantidadSubReceta, setTxtCantidadSubReceta] = useState("")
  const [ddlUnidadBaseSubReceta, setDdlUnidadBaseSubReceta] = useState("")

  const [ingredienteSearchTerm, setIngredienteSearchTerm] = useState("")
  const [filteredIngredientes, setFilteredIngredientes] = useState<Ingrediente[]>([])
  const [showIngredienteDropdown, setShowIngredienteDropdown] = useState(false)

  const [ddlIngredientes, setDdlIngredientes] = useState("")
  const [txtCantidadIngrediente, setTxtCantidadIngrediente] = useState("")
  const [ddlUnidadMedida, setDdlUnidadMedida] = useState("")
  const [txtCostoIngrediente, setTxtCostoIngrediente] = useState("")
  const [isUnidadMedidaDisabled, setIsUnidadMedidaDisabled] = useState(false)

  useEffect(() => {
    const cargarSesionYValidar = async () => {
      try {
        const datosSession = await getSession()

        if (!datosSession || datosSession.SesionActiva !== true) {
          router.push("/login")
          return
        }

        if (!datosSession.RolId || datosSession.RolId === "0") {
          router.push("/login")
          return
        }

        setSesion(datosSession)
      } catch (err) {
        console.error("Error cargando sesión:", err)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    cargarSesionYValidar()
  }, [router])

  useEffect(() => {
    if (sesion) {
      cargarHoteles(sesion)
      cargarUnidadesMedida()
    }
  }, [sesion])

  useEffect(() => {
    if (ddlHotel) {
      cargarIngredientes(ddlHotel)
      cargarRecetas(ddlHotel)
    }
  }, [ddlHotel])

  // Efecto para sincronizar cantidad y rango de receta
  useEffect(() => {
    if (ddlRecetas) {
      const recetaSeleccionada = recetas.find((r) => r.id.toString() === ddlRecetas)
      if (recetaSeleccionada) {
        const maxCantidad = recetaSeleccionada.cantidad || 1
        setMaxCantidadReceta(maxCantidad)
        setTxtCostoReceta(recetaSeleccionada.costo?.toString() || "0")

        // Obtener la descripción de la unidad de medida
        const unidadMedida = unidadesMedida.find((u) => u.id === recetaSeleccionada.unidadbaseid)
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
  }, [ddlRecetas, recetas, unidadesMedida])

  const actualizarCostoIngrediente = useCallback(
    (ingredienteId: string) => {
      const ingrediente = ingredientes.find((i) => i.id.toString() === ingredienteId)
      setTxtCostoIngrediente(ingrediente?.costo?.toString() || "0")
    },
    [ingredientes],
  )

  useEffect(() => {
    if (ddlIngredientes) {
      actualizarCostoIngrediente(ddlIngredientes)
      const fetchAndSetUnidad = async () => {
        const unidades = await getUnidadMedidaForRecetaIngrediente(Number(ddlIngredientes))
        if (unidades.length > 0) {
          setDdlUnidadMedida(unidades[0].id.toString())
          setIsUnidadMedidaDisabled(false)
        } else {
          setDdlUnidadMedida("")
        }
      }
      fetchAndSetUnidad()
    } else {
      setDdlUnidadMedida("")
      setIsUnidadMedidaDisabled(false)
    }
  }, [ddlIngredientes, actualizarCostoIngrediente])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (ddlHotel && ingredienteSearchTerm.length >= 2) {
        const results = await searchIngredientes(Number(ddlHotel), ingredienteSearchTerm)
        setFilteredIngredientes(results)
        setShowIngredienteDropdown(true)
      } else {
        setFilteredIngredientes([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [ingredienteSearchTerm, ddlHotel])

  useEffect(() => {
    if (ddlIngredientes) {
      const selected =
        ingredientes.find((i) => i.id.toString() === ddlIngredientes) ||
        filteredIngredientes.find((i) => i.id.toString() === ddlIngredientes)
      if (selected) {
        setIngredienteSearchTerm(`${selected.codigo} - ${selected.nombre}`)
        setTxtCostoIngrediente(selected.costo?.toString() || "0")
      }
    }
  }, [ddlIngredientes, ingredientes, filteredIngredientes])

  const checkLeaveAndConfirm = useCallback(
    async (targetPath: string): Promise<boolean> => {
      if (recetaId.current && validaRegistroId === 0) {
        navegacionPendiente.current = targetPath
        setMostrarModalConfirmacion(true)
        return false
      }
      return true
    },
    [recetaId.current, validaRegistroId, setMostrarModalConfirmacion],
  )

  useEffect(() => {
    setGuard(checkLeaveAndConfirm)
    return () => setGuard(null)
  }, [setGuard, checkLeaveAndConfirm])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (recetaId.current && validaRegistroId === 0) {
        e.preventDefault()
        e.returnValue =
          "¿Estás seguro que deseas abandonar el registro de sub-receta? Se perderá la información cargada previamente"
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [recetaId.current, validaRegistroId])

  const cargarHoteles = useCallback(async (sessionData: SessionData) => {
    try {
      const rolId = Number.parseInt(sessionData.RolId || "0", 10)
      const hotelIdSesion = Number.parseInt(sessionData.HotelId || "0", 10)

      let auxHotelid: number

      if (![1, 2, 3, 4].includes(rolId)) {
        auxHotelid = hotelIdSesion
      } else {
        auxHotelid = -1
      }

      let query = supabaseClient.from("hoteles").select("id, nombre")

      if (auxHotelid !== -1) {
        query = query.eq("id", auxHotelid)
      }

      const { data, error } = await query.order("nombre", { ascending: true })

      if (error) {
        console.error("Error al cargar hoteles:", error)
        toast.error(`Error al cargar hoteles: ${error.message}`)
        return
      }

      setHoteles(data || [])
      if (data && data.length > 0) {
        setDdlHotel(data[0].id.toString())
      }
    } catch (error: any) {
      console.error("Error cargando hoteles:", error)
      toast.error("Error al cargar hoteles")
    }
  }, [])

  const cargarIngredientes = useCallback(async (hotelId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("ingredientes")
        .select("id, nombre, codigo, costo")
        .eq("hotelid", Number(hotelId))
        .eq("activo", true)
        .order("nombre", { ascending: true })

      if (error) {
        console.error("Error al cargar ingredientes:", error)
        toast.error("Error al cargar ingredientes")
        return
      }

      setIngredientes(data || [])
    } catch (error: any) {
      console.error("Error cargando ingredientes:", error)
      toast.error("Error al cargar ingredientes")
    }
  }, [])

  const searchIngredientes = useCallback(async (hotelId: number, searchTerm: string): Promise<Ingrediente[]> => {
    let query = supabaseClient.from("ingredientes").select("id, nombre, codigo, costo").eq("hotelid", hotelId)

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      query = query.or(`nombre.ilike.%${lowerCaseSearchTerm}%,codigo.ilike.%${lowerCaseSearchTerm}%`)
    }

    const { data, error } = await query.order("nombre", { ascending: true })
    if (error) {
      console.error("Error searching ingredientes:", error)
      return []
    }
    return data || []
  }, [])

  const cargarUnidadesMedida = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient.from("tipounidadmedida").select("id, descripcion, calculoconversion")

      if (error) {
        console.error("Error al cargar unidades de medida:", error)
        toast.error("Error al cargar unidades de medida")
        return
      }

      setUnidadesMedida(data || [])
    } catch (error: any) {
      console.error("Error cargando unidades de medida:", error)
      toast.error("Error al cargar unidades de medida")
    }
  }, [])

  const cargarRecetas = useCallback(async (hotelId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("recetas")
        .select("id, nombre, costo, cantidad, unidadbaseid")
        .eq("hotelid", Number(hotelId))
        .eq("activo", true)
        .order("nombre", { ascending: true })

      if (error) {
        console.error("Error al cargar recetas:", error)
        toast.error("Error al cargar recetas")
        return
      }

      setRecetas(data || [])
    } catch (error: any) {
      console.error("Error cargando recetas:", error)
      toast.error("Error al cargar recetas")
    }
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImagenFile(null)
      setImagenPreview(null)
      toast.error("No se seleccionó ningún archivo.")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagenPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setImagenFile(file)
  }

  const handleRemoveImage = () => {
    setImagenFile(null)
    setImagenPreview(null)
    urlName.current = null
    toast.info("Imagen eliminada")
  }

  const btnRegistrarReceta = async () => {
    if (!txtNombreRecetaNuevo.trim() || !txtNotasReceta.trim() || !ddlHotel) {
      setErrorMessage("Favor de llenar la información faltante.")
      setShowErrorDialog(true)
      return
    }

    try {
      const formData = new FormData()
      formData.append("nombre", txtNombreRecetaNuevo)
      formData.append("notaspreparacion", txtNotasReceta)
      formData.append("hotelId", ddlHotel)
      formData.append("cantidad", txtCantidadSubReceta || "0")
      formData.append("unidadBaseId", ddlUnidadBaseSubReceta || "0")

      if (imagenFile) {
        formData.append("imagen", imagenFile)
      }

      const result = await registrarRecetaConImagen(formData)

      if (result.success && result.recetaId) {
        recetaId.current = result.recetaId
        urlName.current = result.imgUrl || null
        setEtapa1Bloqueada(true)
        setEtapaActual(2)
        toast.success("Información básica registrada. Agregue los ingredientes.")
      } else {
        throw new Error(result.error || "Error al registrar receta.")
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // ✅ FUNCIÓN CORREGIDA: Sin usar relaciones directas
  const cargarIngredientesReceta = useCallback(async () => {
    if (!recetaId.current) return

    try {
      // 1. Obtener ingredientes de la receta
      const { data: ingredientesRecetaData, error: ingredientesError } = await supabaseClient
        .from("ingredientesxreceta")
        .select("id, elementoid, cantidad, ingredientecostoparcial")
        .eq("recetaid", recetaId.current)
        .eq("tiposegmentoid", 1)

      if (ingredientesError) {
        console.error("Error al cargar ingredientes de la receta:", ingredientesError)
        toast.error("Error al cargar ingredientes de la receta")
        return
      }

      if (!ingredientesRecetaData || ingredientesRecetaData.length === 0) {
        setIngredientesReceta([])
        return
      }

      // 2. Obtener los IDs de ingredientes únicos
      const ingredienteIds = [...new Set(ingredientesRecetaData.map((item) => item.elementoid))]

      // 3. Consultar los nombres de los ingredientes por separado
      const { data: ingredientesData, error: nombresError } = await supabaseClient
        .from("ingredientes")
        .select("id, nombre")
        .in("id", ingredienteIds)

      if (nombresError) {
        console.error("Error al cargar nombres de ingredientes:", nombresError)
        toast.error("Error al cargar nombres de ingredientes")
        return
      }

      // 4. Combinar los datos manualmente
      const ingredientesFormateados = ingredientesRecetaData.map((item) => {
        const ingredienteInfo = ingredientesData?.find((ing) => ing.id === item.elementoid)
        return {
          id: item.id,
          ingredienteId: item.elementoid,
          nombre: ingredienteInfo?.nombre || "Ingrediente no encontrado",
          cantidad: item.cantidad,
          ingredientecostoparcial: item.ingredientecostoparcial,
        }
      })

      setIngredientesReceta(ingredientesFormateados)
    } catch (error: any) {
      console.error("Error cargando ingredientes de receta:", error)
      toast.error("Error al cargar ingredientes de la receta")
    }
  }, [])

  const cargarRecetasReceta = useCallback(async () => {
    if (!recetaId.current) return

    try {
      // 1. Obtener recetas de la receta principal
      const { data: recetasRecetaData, error: recetasError } = await supabaseClient
        .from("ingredientesxreceta")
        .select("id, elementoid, cantidad, ingredientecostoparcial")
        .eq("recetaid", recetaId.current)
        .eq("tiposegmentoid", 2) // 2 para recetas

      if (recetasError) {
        console.error("Error al cargar recetas de la receta:", recetasError)
        return
      }

      if (!recetasRecetaData || recetasRecetaData.length === 0) {
        setRecetasSeleccionadas([])
        return
      }

      // 2. Obtener los IDs de recetas únicos
      const recetaIds = [...new Set(recetasRecetaData.map((item) => item.elementoid))]

      // 3. Consultar los nombres de las recetas por separado
      const { data: recetasData, error: nombresError } = await supabaseClient
        .from("recetas")
        .select("id, nombre, costo")
        .in("id", recetaIds)

      if (nombresError) {
        console.error("Error al cargar nombres de recetas:", nombresError)
        return
      }

      // 4. Combinar los datos manualmente
      const recetasFormateadas = recetasRecetaData.map((item) => {
        const recetaInfo = recetasData?.find((rec) => rec.id === item.elementoid)
        return {
          id: item.id,
          recetaId: item.elementoid,
          nombre: recetaInfo?.nombre || "Receta no encontrada",
          cantidad: item.cantidad,
          costototal: recetaInfo?.costo || 0,
          ingredientecostoparcial: item.ingredientecostoparcial,
        }
      })

      setRecetasSeleccionadas(recetasFormateadas)
    } catch (error: any) {
      console.error("Error cargando recetas de receta:", error)
    }
  }, [])

  const handleIngredienteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setIngredienteSearchTerm(term)
    const selectedIng =
      ingredientes.find((i) => i.id.toString() === ddlIngredientes) ||
      filteredIngredientes.find((i) => i.id.toString() === ddlIngredientes)
    if (term === "") {
      setDdlIngredientes("")
      setTxtCostoIngrediente("")
    } else if (ddlIngredientes && selectedIng && term !== `${selectedIng.codigo} - ${selectedIng.nombre}`) {
      setDdlIngredientes("")
      setTxtCostoIngrediente("")
    }
  }

  const handleSelectIngredienteFromDropdown = (ing: Ingrediente) => {
    setDdlIngredientes(ing.id.toString())
    setIngredienteSearchTerm(`${ing.codigo} - ${ing.nombre}`)
    setTxtCostoIngrediente(ing.costo?.toString() || "0")
    setShowIngredienteDropdown(false)
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

  const btnAgregarIngrediente = async () => {
    if (!ddlIngredientes || !txtCantidadIngrediente || !ddlUnidadMedida) {
      setErrorMessage("Favor de llenar la información faltante")
      setShowErrorDialog(true)
      return
    }

    if (!recetaId.current) {
      toast.error("Error: ID de receta no disponible. Vuelve a la etapa 1.")
      return
    }

    try {
      const { data: existingIngrediente, error: checkError } = await supabaseClient
        .from("ingredientesxreceta")
        .select("id")
        .eq("recetaid", recetaId.current)
        .eq("elementoid", Number.parseInt(ddlIngredientes))
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error al verificar ingrediente existente:", checkError)
        toast.error("Error al verificar ingrediente existente: " + checkError.message)
        return
      }

      if (existingIngrediente) {
        setMostrarModalIngredienteDuplicado(true)
        return
      }

      let CalculoConversion = 1

      const unidadSeleccionada = unidadesMedida.find((u) => u.id.toString() === ddlUnidadMedida)
      if (unidadSeleccionada && unidadSeleccionada.calculoconversion !== null) {
        CalculoConversion = unidadSeleccionada.calculoconversion
      } else {
        toast.error("No se pudo obtener el factor de conversión para la unidad de medida seleccionada.")
        return
      }

      const cantidad = Number.parseFloat(txtCantidadIngrediente)
      const costoUnitario = Number.parseFloat(txtCostoIngrediente)
      const costoParcial = cantidad * CalculoConversion * costoUnitario

      const { error: insertError } = await supabaseClient.from("ingredientesxreceta").insert({
        recetaid: recetaId.current,
        tiposegmentoid: 1,
        elementoid: Number.parseInt(ddlIngredientes),
        cantidad: cantidad,
        ingredientecostoparcial: costoParcial,
        activo: true,
        fechacreacion: new Date().toISOString(),
        fechamodificacion: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error al agregar ingrediente:", insertError)
        toast.error(`Error al agregar ingrediente: ${insertError.message}`)
        return
      }

      await cargarIngredientesReceta()

      setDdlIngredientes("")
      setIngredienteSearchTerm("")
      setTxtCantidadIngrediente("")
      setTxtCostoIngrediente("")
      setDdlUnidadMedida("")
      setIsUnidadMedidaDisabled(false)

      toast.success("Ingrediente agregado")
    } catch (error: any) {
      console.error("Error inesperado al agregar ingrediente:", error)
      toast.error("Error inesperado al agregar ingrediente")
    }
  }

  const handleEliminarIngredienteReceta = async (ingredienteIdToDelete: number) => {
    if (!recetaId.current) {
      toast.error("Error: ID de receta no disponible para eliminar ingrediente.")
      return
    }

    try {
      const { error } = await supabaseClient
        .from("ingredientesxreceta")
        .delete()
        .eq("recetaid", recetaId.current)
        .eq("elementoid", ingredienteIdToDelete)

      if (error) {
        console.error("Error al eliminar ingrediente de la receta:", error)
        toast.error(`Error al eliminar ingrediente: ${error.message}`)
        return
      }

      toast.success("Ingrediente eliminado de la sub-receta.")
      await cargarIngredientesReceta()
    } catch (error: any) {
      console.error("Error inesperado al eliminar ingrediente:", error)
      toast.error("Error inesperado al eliminar ingrediente.")
    }
  }

  const btnAgregarReceta = async () => {
    if (!ddlRecetas || !txtCantidadReceta) {
      setErrorMessage("Favor de llenar la información de la receta")
      setShowErrorDialog(true)
      return
    }

    if (!recetaId.current) {
      toast.error("Error: ID de receta no disponible.")
      return
    }

    try {
      const { data: existingReceta, error: checkError } = await supabaseClient
        .from("ingredientesxreceta")
        .select("id")
        .eq("recetaid", recetaId.current)
        .eq("elementoid", Number.parseInt(ddlRecetas))
        .eq("tiposegmentoid", 2)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error al verificar receta existente:", checkError)
        toast.error("Error al verificar receta existente: " + checkError.message)
        return
      }

      if (existingReceta) {
        toast.error("Esta receta ya está agregada")
        return
      }

      const recetaSeleccionada = recetas.find((r) => r.id.toString() === ddlRecetas)
      if (!recetaSeleccionada) {
        toast.error("Receta no encontrada")
        return
      }

      const cantidad = Number.parseFloat(txtCantidadReceta)
      const costoParcial = (recetaSeleccionada.costo || 0) / (recetaSeleccionada.cantidad / cantidad)

      const { error: insertError } = await supabaseClient.from("ingredientesxreceta").insert({
        recetaid: recetaId.current,
        tiposegmentoid: 2, // 2 para recetas
        elementoid: Number.parseInt(ddlRecetas),
        cantidad: cantidad,
        ingredientecostoparcial: costoParcial,
        activo: true,
        fechacreacion: new Date().toISOString(),
        fechamodificacion: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error al agregar receta:", insertError)
        toast.error(`Error al agregar receta: ${insertError.message}`)
        return
      }

      await cargarRecetasReceta()

      setDdlRecetas("")
      setTxtCantidadReceta("")
      setCantidadRangoReceta([1])
      setTxtCostoReceta("")
      setTxtUnidadReceta("")
      setMaxCantidadReceta(1)

      toast.success("Receta agregada")
    } catch (error: any) {
      console.error("Error inesperado al agregar receta:", error)
      toast.error("Error inesperado al agregar receta")
    }
  }

  const handleEliminarRecetaReceta = async (recetaIdToDelete: number) => {
    if (!recetaId.current) {
      toast.error("Error: ID de receta no disponible para eliminar receta.")
      return
    }

    try {
      const { error } = await supabaseClient
        .from("ingredientesxreceta")
        .delete()
        .eq("recetaid", recetaId.current)
        .eq("elementoid", recetaIdToDelete)
        .eq("tiposegmentoid", 2)

      if (error) {
        console.error("Error al eliminar receta de la receta:", error)
        toast.error(`Error al eliminar receta: ${error.message}`)
        return
      }

      toast.success("Receta eliminada de la sub-receta.")
      await cargarRecetasReceta()
    } catch (error: any) {
      console.error("Error inesperado al eliminar receta:", error)
      toast.error("Error inesperado al eliminar receta.")
    }
  }

  const btnRegistroCompletoReceta = async () => {
    if (!recetaId.current) {
      toast.error("Error: ID de receta no disponible.")
      return
    }

    setShowLoadingAnimation(true)

    try {
      const [sumDataResult] = await Promise.all([
        supabaseClient.from("ingredientesxreceta").select("ingredientecostoparcial").eq("recetaid", recetaId.current),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ])

      const { data: sumData, error: sumError } = sumDataResult

      if (sumError) {
        console.error("Error al obtener suma de costos:", sumError)
        toast.error(`Error al calcular costo total: ${sumError.message}`)
        return
      }

      const costoTotal = (sumData || []).reduce((sum, item) => sum + (item.ingredientecostoparcial || 0), 0)

      const { error: updateError } = await supabaseClient
        .from("recetas")
        .update({
          costo: costoTotal,
          cantidad: Number.parseFloat(txtCantidadSubReceta),
          unidadbaseid: Number.parseInt(ddlUnidadBaseSubReceta),
        })
        .eq("id", recetaId.current)

      if (updateError) {
        console.error("Error al actualizar costo de receta:", updateError)
        toast.error(`Error al actualizar costo de receta: ${updateError.message}`)
        return
      }

      toast.success("Sub-receta registrada correctamente")

      setValidaRegistroId(1)
    } catch (error: any) {
      console.error("Error inesperado al completar registro:", error)
      toast.error("Error inesperado al completar el registro")
    } finally {
      setShowLoadingAnimation(false)
      setMostrarModalExito(true)
    }
  }

  const btnRegresarReceta = async () => {
    const canProceed = await attemptNavigation("/recetas")
    if (canProceed) {
      router.push("/recetas")
    }
  }

  const manejarConfirmacionSalida = async () => {
    if (recetaId.current) {
      try {
        await supabaseClient.from("ingredientesxreceta").delete().eq("recetaid", recetaId.current)

        if (validaRegistroId === 0) {
          await supabaseClient.from("recetas").delete().eq("id", recetaId.current)
          if (urlName.current) {
            const bucketName = "imagenes"
            const pathInBucket = urlName.current.split(`${bucketName}/`)[1]
            if (pathInBucket) {
              await supabaseClient.storage.from(bucketName).remove([pathInBucket])
            }
          }
        }
      } catch (error) {
        console.error("Error al limpiar datos:", error)
        toast.error("Error al limpiar datos incompletos.")
      }
    }

    setMostrarModalConfirmacion(false)
    if (navegacionPendiente.current) {
      router.push(navegacionPendiente.current)
      navegacionPendiente.current = null
    }
  }

  const manejarCancelarSalida = () => {
    setMostrarModalConfirmacion(false)
    navegacionPendiente.current = null
  }

  const manejarModalExito = () => {
    setMostrarModalExito(false)
    router.push("/recetas")
  }

  const manejarModalIngredienteDuplicado = () => {
    setMostrarModalIngredienteDuplicado(false)
  }

  const btnAnterior = () => {
    if (etapaActual > 1) setEtapaActual(etapaActual - 1)
  }

  // Cargar ingredientes cuando se cambia a etapa 2
  useEffect(() => {
    if (etapaActual === 2 && recetaId.current) {
      cargarIngredientesReceta()
      cargarRecetasReceta()
    }
  }, [etapaActual, cargarIngredientesReceta, cargarRecetasReceta])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {showLoadingAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl">
            <div className="relative w-24 h-24 mb-4">
              <Image
                src="https://nxtrsibnomdqmzcrwedc.supabase.co/storage/v1/object/public/imagenes/AnimationGif/RegistrarSubReceta.gif"
                alt="Procesando..."
                width={400}
                height={400}
                unoptimized
                className="absolute inset-0 animate-bounce-slow"
              />
            </div>
            <p className="text-lg font-semibold text-gray-800">Registrando Sub-receta...</p>
            <p className="text-sm text-gray-600">Esto puede tomar unos segundos.</p>
          </div>
        </div>
      )}

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

      <AlertDialog open={mostrarModalConfirmacion} onOpenChange={setMostrarModalConfirmacion}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro que deseas abandonar el registro de sub-receta?</AlertDialogTitle>
            <AlertDialogDescription>Se perderá la información cargada previamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={manejarCancelarSalida}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={manejarConfirmacionSalida}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={mostrarModalExito} onOpenChange={setMostrarModalExito}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sub-Receta registrada exitosamente.</AlertDialogTitle>
            <AlertDialogDescription>
              La sub-receta ha sido registrada correctamente con todos sus ingredientes y costo calculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={manejarModalExito}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={mostrarModalIngredienteDuplicado} onOpenChange={setMostrarModalIngredienteDuplicado}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ingrediente Duplicado</AlertDialogTitle>
            <AlertDialogDescription>
              No puedes agregar este ingrediente, ya que ya está incluido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={manejarModalIngredienteDuplicado}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={mostrarModalFaltanDatosEtapa2} onOpenChange={setMostrarModalFaltanDatosEtapa2}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Datos Faltantes</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, ingresa la cantidad y selecciona la unidad base de la sub-receta para poder continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMostrarModalFaltanDatosEtapa2(false)}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            onClick={btnRegresarReceta}
            variant="outline"
            size="sm"
            type="button"
            id="btnRegresarReceta"
            name="btnRegresarReceta"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Regresar
          </Button>
          <h1 className="text-3xl font-bold">Registro de nueva Sub-Receta</h1>
        </div>
      </div>

      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{ width: `${(etapaActual / 3) * 100}%`, backgroundColor: "#ade06e" }}
          />
        </div>
        <p className="text-right text-sm text-muted-foreground mt-1">Etapa {etapaActual} de 3</p>
      </div>

      {etapaActual > 1 && (
        <Button onClick={btnAnterior} variant="secondary" size="sm" className="mb-4">
          Anterior
        </Button>
      )}

      {etapaActual === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 1: Registrar información básica de la sub-receta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="txtNombreRecetaNuevo">Nombre de la Sub-Receta</Label>
                  <Input
                    type="text"
                    id="txtNombreRecetaNuevo"
                    name="txtNombreRecetaNuevo"
                    maxLength={150}
                    value={txtNombreRecetaNuevo}
                    onChange={(e) => setTxtNombreRecetaNuevo(e.target.value)}
                    disabled={etapa1Bloqueada}
                  />
                </div>
                <div>
                  <Label htmlFor="txtNotasReceta">Notas de Preparación</Label>
                  <Textarea
                    id="txtNotasReceta"
                    name="txtNotasReceta"
                    maxLength={150}
                    value={txtNotasReceta}
                    onChange={(e) => setTxtNotasReceta(e.target.value)}
                    disabled={etapa1Bloqueada}
                    rows={6}
                    className="min-h-[120px]"
                  />
                </div>
                <div>
                  <Label htmlFor="ddlHotel">Hotel</Label>
                  <Select name="ddlHotel" value={ddlHotel} onValueChange={setDdlHotel} disabled={etapa1Bloqueada}>
                    <SelectTrigger id="ddlHotel">
                      <SelectValue placeholder="Seleccionar hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hoteles.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id.toString()}>
                          {hotel.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="ImagenFile">Cargar Imagen (.jpg, &lt;25MB, max 500x500)</Label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                  <div className="text-center">
                    {imagenPreview ? (
                      <div className="relative mx-auto h-32 w-32 object-cover rounded-md">
                        <img
                          src={imagenPreview || "/placeholder.svg"}
                          alt="Vista previa"
                          className="h-full w-full object-cover rounded-md"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={handleRemoveImage}
                          disabled={etapa1Bloqueada}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                    )}
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        htmlFor="ImagenFile"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Sube un archivo</span>
                        <Input
                          type="file"
                          id="ImagenFile"
                          name="ImagenFile"
                          className="sr-only"
                          onChange={handleFileUpload}
                          accept="image/jpeg, image/jpg, image/png, image/webp"
                          disabled={etapa1Bloqueada}
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-600">JPG hasta 25MB, 500x500px</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                id="btnRegistrarReceta"
                name="btnRegistrarReceta"
                onClick={btnRegistrarReceta}
                disabled={etapa1Bloqueada}
              >
                Registrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {etapaActual === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 2: Registrar ingredientes</CardTitle>
            <CardDescription>Agregue al menos 2 ingredientes para poder continuar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg bg-slate-50">
              <h3 className="font-semibold mb-4">Agregar la Cantidad total y el Tipo de Unidad de la Sub-Receta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="txtCantidad">Cantidad</Label>
                  <Input
                    type="number"
                    id="txtCantidad"
                    name="txtCantidad"
                    value={txtCantidadSubReceta}
                    onChange={(e) => setTxtCantidadSubReceta(e.target.value)}
                    min="0"
                    step="any"
                  />
                </div>
                <div>
                  <Label htmlFor="ddlUnidadBase">Unidad Base</Label>
                  <Select name="ddlUnidadBase" value={ddlUnidadBaseSubReceta} onValueChange={setDdlUnidadBaseSubReceta}>
                    <SelectTrigger id="ddlUnidadBase">
                      <SelectValue placeholder="Seleccionar unidad base" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesMedida.map((unidad) => (
                        <SelectItem key={unidad.id} value={unidad.id.toString()}>
                          {unidad.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Mostrar secciones solo si hay cantidad y unidad base */}
            {txtCantidadSubReceta && ddlUnidadBaseSubReceta && (
              <>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">Agregar Ingrediente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                    <div className="md:col-span-2 relative">
                      <Label htmlFor="txtIngredienteSearch">Ingrediente</Label>
                      <Input
                        id="txtIngredienteSearch"
                        name="txtIngredienteSearch"
                        value={ingredienteSearchTerm}
                        onChange={handleIngredienteSearchChange}
                        onFocus={() => setShowIngredienteDropdown(true)}
                        onBlur={() => setTimeout(() => setShowIngredienteDropdown(false), 100)}
                        placeholder="Buscar por código o nombre..."
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
                      <Label htmlFor="txtCantidadIngrediente">Cantidad</Label>
                      <Input
                        type="number"
                        id="txtCantidadIngrediente"
                        name="txtCantidadIngrediente"
                        value={txtCantidadIngrediente}
                        onChange={(e) => setTxtCantidadIngrediente(e.target.value)}
                        min="0"
                        step="any"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ddlUnidadMedida">Unidad Medida</Label>
                      <Select
                        name="ddlUnidadMedida"
                        value={ddlUnidadMedida}
                        onValueChange={setDdlUnidadMedida}
                        disabled={true}
                      >
                        <SelectTrigger id="ddlUnidadMedida">
                          <SelectValue placeholder="Seleccionar unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidadesMedida.map((unidad) => (
                            <SelectItem key={unidad.id} value={unidad.id.toString()}>
                              {unidad.descripcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="txtCostoIngrediente">Costo Ingrediente</Label>
                      <Input
                        type="text"
                        id="txtCostoIngrediente"
                        name="txtCostoIngrediente"
                        value={txtCostoIngrediente}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      id="btnAgregarIngrediente"
                      name="btnAgregarIngrediente"
                      onClick={btnAgregarIngrediente}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar ingrediente
                    </Button>
                  </div>

                  {ingredientesReceta.length > 0 && (
                    <div className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Costo Parcial</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ingredientesReceta.map((ingrediente) => (
                            <TableRow key={ingrediente.id}>
                              <TableCell>{ingrediente.id}</TableCell>
                              <TableCell>{ingrediente.nombre}</TableCell>
                              <TableCell>{ingrediente.cantidad}</TableCell>
                              <TableCell>${ingrediente.ingredientecostoparcial.toFixed(3)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleEliminarIngredienteReceta(ingrediente.ingredienteId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Nueva sección para agregar sub-recetas - Solo mostrar si hay cantidad y unidad base */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">Agregar Sub-Receta</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="ddlRecetas">Sub-Receta</Label>
                      <Select name="ddlRecetas" value={ddlRecetas} onValueChange={setDdlRecetas}>
                        <SelectTrigger id="ddlRecetas">
                          <SelectValue placeholder="Seleccionar sub-receta" />
                        </SelectTrigger>
                        <SelectContent>
                          {recetas.map((receta) => (
                            <SelectItem key={receta.id} value={receta.id.toString()}>
                              {receta.nombre} - ${receta.costo?.toFixed(2) || "0.00"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="txtCostoReceta">Costo</Label>
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
                      <Label htmlFor="txtUnidadReceta">Unidad</Label>
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
                        <Label htmlFor="txtCantidadReceta">Cantidad</Label>
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
                        <Label htmlFor="cantidadRangoReceta">Cantidad Rango: {cantidadRangoReceta[0]}</Label>
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
                    <Button type="button" id="btnAgregarReceta" name="btnAgregarReceta" onClick={btnAgregarReceta}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar sub-receta
                    </Button>
                  </div>
                  {/* Tabla de sub-recetas seleccionadas */}
                  {recetasSeleccionadas.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-3">Sub-Recetas Agregadas</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Costo Parcial</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recetasSeleccionadas.map((receta) => (
                            <TableRow key={receta.id}>
                              <TableCell>{receta.id}</TableCell>
                              <TableCell>{receta.nombre}</TableCell>
                              <TableCell>{receta.cantidad}</TableCell>
                              <TableCell>${receta.ingredientecostoparcial.toFixed(3)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleEliminarRecetaReceta(receta.recetaId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                id="btnContinuarIngrediente"
                name="btnContinuarIngrediente"
                onClick={() => {
                  if (!txtCantidadSubReceta || !ddlUnidadBaseSubReceta) {
                    setMostrarModalFaltanDatosEtapa2(true)
                    return
                  }
                  setEtapaActual(3)
                }}
                disabled={ingredientesReceta.length < 1}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {etapaActual === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 3: Resumen y Confirmación</CardTitle>
            <CardDescription>Revise la información antes de finalizar el registro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 border rounded-lg space-y-4 bg-slate-50">
              <h3 className="text-xl font-semibold border-b pb-2">Detalles de la Sub-Receta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre</p>
                  <p className="text-lg text-gray-800">{txtNombreRecetaNuevo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Hotel</p>
                  <p className="text-lg text-gray-800">
                    {hoteles.find((h) => h.id.toString() === ddlHotel)?.nombre || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Cantidad de Sub-Receta</p>
                  <p className="text-lg text-gray-800">{txtCantidadSubReceta || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unidad Base de Sub-Receta</p>
                  <p className="text-lg text-gray-800">
                    {unidadesMedida.find((u) => u.id.toString() === ddlUnidadBaseSubReceta)?.descripcion || "N/A"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Notas de Preparación</p>
                  <p className="text-lg text-gray-800">{txtNotasReceta}</p>
                </div>
              </div>
              {imagenPreview && (
                <div className="space-y-2">
                  <Label className="text-base font-medium">Imagen de la Sub-Receta</Label>
                  <img
                    src={imagenPreview || "/placeholder.svg"}
                    alt="Vista previa de la receta"
                    className="h-48 w-auto object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border rounded-lg space-y-4 bg-slate-50">
              <h3 className="text-xl font-semibold border-b pb-2">Ingredientes</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Costo Parcial</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientesReceta.map((ingrediente) => (
                    <TableRow key={ingrediente.id}>
                      <TableCell>{ingrediente.id}</TableCell>
                      <TableCell>{ingrediente.nombre}</TableCell>
                      <TableCell>{ingrediente.cantidad}</TableCell>
                      <TableCell>${ingrediente.ingredientecostoparcial.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Tabla de sub-recetas en el resumen */}
              {recetasSeleccionadas.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3">Sub-Recetas</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Costo Parcial</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recetasSeleccionadas.map((receta) => (
                        <TableRow key={receta.id}>
                          <TableCell>{receta.id}</TableCell>
                          <TableCell>{receta.nombre}</TableCell>
                          <TableCell>{receta.cantidad}</TableCell>
                          <TableCell>${receta.ingredientecostoparcial.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-green-100 rounded-lg flex justify-between items-center">
              <span className="font-bold text-lg">Costo Total de la Sub-Receta:</span>
              <Badge className="text-xl">
                $
                {(
                  ingredientesReceta.reduce((sum, i) => sum + i.ingredientecostoparcial, 0) +
                  recetasSeleccionadas.reduce((sum, r) => sum + r.ingredientecostoparcial, 0)
                ).toFixed(2)}
              </Badge>
            </div>

            <Button
              type="button"
              id="btnRegistroCompletoReceta"
              name="btnRegistroCompletoReceta"
              onClick={btnRegistroCompletoReceta}
              className="w-full text-lg py-6"
            >
              <CheckCircle className="mr-2" /> Registrar Sub-Receta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
