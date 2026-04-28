"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Building2,
  Tag,
  Package,
  Layers,
  Ruler,
  DollarSign,
  ArrowLeftRight,
  Percent,
  Hash,
  CheckCircle2,
  Loader2,
  XCircle,
  Sparkles,
  AlertTriangle,
} from "lucide-react"
import {
  obtenerHoteles,
  obtenerCategoriasIngredientes,
  obtenerTipoUnidadMedida,
  validarCodigoIngrediente,
  registrarInsumo,
} from "@/app/actions/ingredientes-actions"

interface Hotel {
  id: number
  nombre: string
}
interface Categoria {
  id: number
  descripcion: string
}
interface UnidadMedida {
  id: number
  descripcion: string
}

interface RegistrarInsumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type CodigoStatus = "idle" | "validating" | "valid" | "invalid"

const REQUIRED_LABELS: Record<string, string> = {
  hotel: "Hotel",
  codigo: "Código (validado)",
  nombre: "Nombre",
  unidadId: "Unidad de medida",
  costo: "Costo unitario",
}

export function RegistrarInsumoDialog({ open, onOpenChange, onSuccess }: RegistrarInsumoDialogProps) {
  const { toast } = useToast()

  const [loadingCatalogos, setLoadingCatalogos] = useState(false)
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])

  const [hotelId, setHotelId] = useState("")
  const [codigo, setCodigo] = useState("")
  const [codigoStatus, setCodigoStatus] = useState<CodigoStatus>("idle")
  const [nombre, setNombre] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [unidadId, setUnidadId] = useState("")
  const [costo, setCosto] = useState("")
  const [conversion, setConversion] = useState("")
  const [porcentajeMerma, setPorcentajeMerma] = useState("")
  const [codigoRapsodia, setCodigoRapsodia] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [missingFields, setMissingFields] = useState<string[]>([])
  const [missingDialogOpen, setMissingDialogOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    resetForm()
    cargarCatalogos()
  }, [open])

  const resetForm = () => {
    setHotelId("")
    setCodigo("")
    setCodigoStatus("idle")
    setNombre("")
    setCategoriaId("")
    setUnidadId("")
    setCosto("")
    setConversion("")
    setPorcentajeMerma("")
    setCodigoRapsodia("")
    setSubmitting(false)
    setMissingFields([])
    setMissingDialogOpen(false)
  }

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true)
    try {
      const [resHoteles, resCats, resUnis] = await Promise.all([
        obtenerHoteles(),
        obtenerCategoriasIngredientes(),
        obtenerTipoUnidadMedida(),
      ])
      if (resHoteles.success) setHoteles(resHoteles.data)
      if (resCats.success) setCategorias(resCats.data)
      if (resUnis.success) setUnidades(resUnis.data)
    } catch (e: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los catálogos.",
        variant: "destructive",
      })
    } finally {
      setLoadingCatalogos(false)
    }
  }

  const hotelSeleccionado = hotelId !== ""
  const codigoValidado = codigoStatus === "valid"

  const handleHotelChange = (value: string) => {
    setHotelId(value)
    setCodigo("")
    setCodigoStatus("idle")
  }

  const handleCodigoChange = (value: string) => {
    setCodigo(value)
    if (codigoStatus !== "idle") setCodigoStatus("idle")
  }

  const handleValidarCodigo = async () => {
    if (!codigo.trim()) {
      toast({
        title: "Código vacío",
        description: "Escribe un código antes de validar.",
        variant: "destructive",
      })
      return
    }
    setCodigoStatus("validating")
    try {
      const result = await validarCodigoIngrediente(codigo.trim(), Number.parseInt(hotelId))
      if (!result.success) {
        setCodigoStatus("idle")
        toast({
          title: "Error",
          description: result.error || "No se pudo validar el código",
          variant: "destructive",
        })
        return
      }
      if (result.exists) {
        setCodigoStatus("invalid")
        toast({
          title: "Código duplicado",
          description: "Ya existe un insumo con ese código en el hotel seleccionado.",
          variant: "destructive",
        })
      } else {
        setCodigoStatus("valid")
        toast({
          title: "Código disponible",
          description: "Puedes continuar con el registro.",
        })
      }
    } catch (e: any) {
      setCodigoStatus("idle")
      toast({
        title: "Error",
        description: e.message || "Error al validar código",
        variant: "destructive",
      })
    }
  }

  const obtenerCamposFaltantes = (): string[] => {
    const faltantes: string[] = []
    if (!hotelSeleccionado) faltantes.push(REQUIRED_LABELS.hotel)
    if (!codigoValidado) faltantes.push(REQUIRED_LABELS.codigo)
    if (!nombre.trim()) faltantes.push(REQUIRED_LABELS.nombre)
    if (!unidadId) faltantes.push(REQUIRED_LABELS.unidadId)
    const costoNum = Number.parseFloat(costo)
    if (costo === "" || Number.isNaN(costoNum) || costoNum < 0) faltantes.push(REQUIRED_LABELS.costo)
    return faltantes
  }

  const handleSubmit = async () => {
    const faltantes = obtenerCamposFaltantes()
    if (faltantes.length > 0) {
      setMissingFields(faltantes)
      setMissingDialogOpen(true)
      return
    }

    const costoNum = Number.parseFloat(costo)
    const conversionNum = conversion === "" ? 1 : Number.parseFloat(conversion)
    const mermaNum = porcentajeMerma === "" ? 0 : Number.parseFloat(porcentajeMerma)

    if (Number.isNaN(conversionNum) || conversionNum <= 0) {
      toast({
        title: "Conversión inválida",
        description: "Si capturas conversión debe ser mayor a 0.",
        variant: "destructive",
      })
      return
    }
    if (Number.isNaN(mermaNum) || mermaNum < 0 || mermaNum > 1) {
      toast({
        title: "Merma inválida",
        description: "El porcentaje de merma debe estar entre 0 y 1 (ej: 0.05 = 5%).",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await registrarInsumo({
        codigo: codigo.trim(),
        hotelid: Number.parseInt(hotelId),
        nombre: nombre.trim(),
        categoriaid: categoriaId ? Number.parseInt(categoriaId) : (null as any),
        unidadmedidaid: Number.parseInt(unidadId),
        costo: costoNum,
        conversion: conversionNum,
        porcentajemerma: mermaNum,
        codigorapsodia: codigoRapsodia.trim() || null,
      })

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "No se pudo registrar el insumo",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Insumo registrado",
        description: `${nombre} se registró correctamente.`,
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Error al registrar insumo",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const fieldsDisabled = !hotelSeleccionado || !codigoValidado

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-0">
          <div className="bg-[#528A94] px-6 py-5 text-white">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">Registrar Insumo</DialogTitle>
                  <DialogDescription className="text-white/80 mt-1">
                    Captura la información del nuevo insumo. Los campos obligatorios están marcados con
                    <span className="text-red-200 font-bold mx-1">*</span>.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-5 bg-[#f3f7f8]">
            {/* Paso 1: Hotel */}
            <div className="bg-white rounded-lg border border-[#528A94]/20 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#528A94] text-white font-semibold text-sm">
                  1
                </div>
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Building2 className="h-4 w-4 text-[#528A94]" />
                  Hotel <span className="text-red-500">*</span>
                </Label>
              </div>
              <select
                value={hotelId}
                onChange={(e) => handleHotelChange(e.target.value)}
                disabled={loadingCatalogos}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#528A94] focus:border-[#528A94] disabled:bg-gray-100"
              >
                <option value="">Selecciona un hotel...</option>
                {hoteles.map((h) => (
                  <option key={h.id} value={h.id.toString()}>
                    {h.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Paso 2: Código */}
            <div
              className={`bg-white rounded-lg border p-4 shadow-sm transition-all ${
                hotelSeleccionado ? "border-[#528A94]/20" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full font-semibold text-sm ${
                    hotelSeleccionado ? "bg-[#528A94] text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  2
                </div>
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Tag className="h-4 w-4 text-[#528A94]" />
                  Código <span className="text-red-500">*</span>
                </Label>
                {codigoStatus === "valid" && (
                  <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-100 border border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Disponible
                  </Badge>
                )}
                {codigoStatus === "invalid" && (
                  <Badge className="ml-auto bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    En uso
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={codigo}
                  onChange={(e) => handleCodigoChange(e.target.value)}
                  placeholder="Ej: ABT001"
                  disabled={!hotelSeleccionado}
                  maxLength={50}
                  className="flex-1 focus-visible:ring-[#528A94]"
                />
                <Button
                  type="button"
                  onClick={handleValidarCodigo}
                  disabled={!hotelSeleccionado || !codigo.trim() || codigoStatus === "validating"}
                  className="min-w-[100px] bg-[#528A94] hover:bg-[#3f6e77] text-white"
                >
                  {codigoStatus === "validating" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Validar"
                  )}
                </Button>
              </div>
            </div>

            {/* Paso 3: Resto de campos */}
            <div
              className={`bg-white rounded-lg border p-4 shadow-sm transition-all ${
                codigoValidado ? "border-[#528A94]/20" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full font-semibold text-sm ${
                    codigoValidado ? "bg-[#528A94] text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  3
                </div>
                <Label className="text-base font-semibold text-gray-800">Información del insumo</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm">
                    <Package className="h-3.5 w-3.5 text-gray-500" />
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre del insumo"
                    disabled={fieldsDisabled}
                    maxLength={150}
                    className="focus-visible:ring-[#528A94]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm">
                    <Ruler className="h-3.5 w-3.5 text-gray-500" />
                    Unidad de medida <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={unidadId}
                    onChange={(e) => setUnidadId(e.target.value)}
                    disabled={fieldsDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#528A94] focus:border-[#528A94] disabled:bg-gray-100 text-sm"
                  >
                    <option value="">Selecciona...</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id.toString()}>
                        {u.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                    Costo unitario <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    placeholder="0.00"
                    disabled={fieldsDisabled}
                    className="focus-visible:ring-[#528A94]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm">
                    <Layers className="h-3.5 w-3.5 text-gray-500" />
                    Categoría <span className="text-xs text-gray-400">(opcional)</span>
                  </Label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    disabled={fieldsDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#528A94] focus:border-[#528A94] disabled:bg-gray-100 text-sm"
                  >
                    <option value="">Selecciona...</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-gray-500" />
                    Conversión <span className="text-xs text-gray-400">(opcional)</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={conversion}
                    onChange={(e) => setConversion(e.target.value)}
                    placeholder="1"
                    disabled={fieldsDisabled}
                    className="focus-visible:ring-[#528A94]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm">
                    <Percent className="h-3.5 w-3.5 text-gray-500" />
                    Porcentaje merma <span className="text-xs text-gray-400">(opcional, 0-1)</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={porcentajeMerma}
                    onChange={(e) => setPorcentajeMerma(e.target.value)}
                    placeholder="0.05"
                    disabled={fieldsDisabled}
                    className="focus-visible:ring-[#528A94]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm">
                    <Hash className="h-3.5 w-3.5 text-gray-500" />
                    Código Rapsodia <span className="text-xs text-gray-400">(opcional)</span>
                  </Label>
                  <Input
                    value={codigoRapsodia}
                    onChange={(e) => setCodigoRapsodia(e.target.value)}
                    placeholder="Opcional"
                    disabled={fieldsDisabled}
                    maxLength={50}
                    className="focus-visible:ring-[#528A94]"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-white border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#5d8f72] hover:bg-[#44785a] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Registrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de campos faltantes */}
      <Dialog open={missingDialogOpen} onOpenChange={setMissingDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Faltan campos obligatorios</h3>
                <p className="text-white/90 text-sm mt-0.5">Revisa los siguientes campos antes de continuar</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 bg-white">
            <ul className="space-y-2">
              {missingFields.map((field, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 px-3 py-2 rounded-md bg-amber-50 border border-amber-200"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium text-amber-900">{field}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
            <Button
              onClick={() => setMissingDialogOpen(false)}
              className="bg-[#528A94] hover:bg-[#3f6e77] text-white"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
