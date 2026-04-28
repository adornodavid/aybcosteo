"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Lock,
  Pencil,
} from "lucide-react"
import {
  obtenerHoteles,
  obtenerCategoriasIngredientes,
  obtenerTipoUnidadMedida,
  obtenerIngredientePorId,
  actualizarInsumo,
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

interface EditarInsumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredienteId: number | null
  onSuccess?: () => void
}

export function EditarInsumoDialog({ open, onOpenChange, ingredienteId, onSuccess }: EditarInsumoDialogProps) {
  const { toast } = useToast()

  const [loadingDatos, setLoadingDatos] = useState(false)
  const [hoteles, setHoteles] = useState<Hotel[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])

  const [hotelId, setHotelId] = useState("")
  const [hotelNombre, setHotelNombre] = useState("")
  const [codigo, setCodigo] = useState("")
  const [nombre, setNombre] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [unidadId, setUnidadId] = useState("")
  const [costo, setCosto] = useState("")
  const [conversion, setConversion] = useState("")
  const [porcentajeMerma, setPorcentajeMerma] = useState("")
  const [codigoRapsodia, setCodigoRapsodia] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  useEffect(() => {
    if (!open || !ingredienteId) return
    cargarTodo()
  }, [open, ingredienteId])

  const cargarTodo = async () => {
    setLoadingDatos(true)
    try {
      const [resHoteles, resCats, resUnis, resIng] = await Promise.all([
        obtenerHoteles(),
        obtenerCategoriasIngredientes(),
        obtenerTipoUnidadMedida(),
        obtenerIngredientePorId(ingredienteId!),
      ])

      if (resHoteles.success) setHoteles(resHoteles.data)
      if (resCats.success) setCategorias(resCats.data)
      if (resUnis.success) setUnidades(resUnis.data)

      if (resIng.success && resIng.data) {
        const ing = resIng.data as any
        setHotelId(ing.hotelid?.toString() || "")
        setHotelNombre(ing.hotel?.nombre || "")
        setCodigo(ing.codigo || "")
        setNombre(ing.nombre || "")
        setCategoriaId(ing.categoriaid?.toString() || "")
        setUnidadId(ing.unidadmedidaid?.toString() || "")
        setCosto(ing.costo?.toString() || "")
        setConversion(ing.conversion?.toString() || "")
        setPorcentajeMerma(ing.porcentajemerma?.toString() || "")
        setCodigoRapsodia(ing.codigorapsodia || "")
      } else {
        toast({
          title: "Error",
          description: resIng.error || "No se pudo cargar el insumo",
          variant: "destructive",
        })
        onOpenChange(false)
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Error cargando datos",
        variant: "destructive",
      })
    } finally {
      setLoadingDatos(false)
    }
  }

  const handleSubmit = async () => {
    if (!ingredienteId) return

    if (!nombre.trim()) {
      toast({ title: "Falta nombre", description: "Captura el nombre del insumo.", variant: "destructive" })
      return
    }
    if (!unidadId) {
      toast({ title: "Falta unidad", description: "Selecciona una unidad de medida.", variant: "destructive" })
      return
    }
    const costoNum = Number.parseFloat(costo)
    if (Number.isNaN(costoNum) || costoNum < 0) {
      toast({ title: "Costo inválido", description: "Captura un costo unitario válido.", variant: "destructive" })
      return
    }
    const conversionNum = conversion === "" ? 1 : Number.parseFloat(conversion)
    if (Number.isNaN(conversionNum) || conversionNum <= 0) {
      toast({ title: "Conversión inválida", description: "Si capturas conversión debe ser mayor a 0.", variant: "destructive" })
      return
    }
    const mermaNum = porcentajeMerma === "" ? 0 : Number.parseFloat(porcentajeMerma)
    if (Number.isNaN(mermaNum) || mermaNum < 0 || mermaNum > 1) {
      toast({ title: "Merma inválida", description: "El porcentaje de merma debe estar entre 0 y 1.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const result = await actualizarInsumo(ingredienteId, {
        nombre: nombre.trim(),
        categoriaid: categoriaId ? Number.parseInt(categoriaId) : null,
        unidadmedidaid: Number.parseInt(unidadId),
        costo: costoNum,
        conversion: conversionNum,
        porcentajemerma: mermaNum,
        codigorapsodia: codigoRapsodia.trim() || null,
      })

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el insumo",
          variant: "destructive",
        })
        return
      }

      setShowSuccessDialog(true)
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Error al actualizar insumo",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessDialog(false)
    onSuccess?.()
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-0">
          <div className="bg-[#528A94] px-6 py-5 text-white">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Pencil className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">Editar Insumo</DialogTitle>
                  <DialogDescription className="text-white/80 mt-1">
                    Modifica los datos del insumo. Hotel y Código no pueden ser cambiados.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-5 bg-[#f3f7f8]">
            {loadingDatos ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#528A94]" />
                <span className="ml-3 text-gray-600">Cargando datos del insumo...</span>
              </div>
            ) : (
              <>
                {/* Hotel + Código (read-only) */}
                <div className="bg-white rounded-lg border border-[#528A94]/20 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <Label className="text-sm font-semibold text-gray-700">Datos no editables</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-[#528A94]" />
                        Hotel
                      </Label>
                      <Input value={hotelNombre} disabled className="bg-gray-100 text-gray-600 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2 text-sm">
                        <Tag className="h-3.5 w-3.5 text-[#528A94]" />
                        Código
                      </Label>
                      <Input value={codigo} disabled className="bg-gray-100 text-gray-600 cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                {/* Campos editables */}
                <div className="bg-white rounded-lg border border-[#528A94]/20 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Pencil className="h-4 w-4 text-[#528A94]" />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#528A94] focus:border-[#528A94] text-sm"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#528A94] focus:border-[#528A94] text-sm"
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
                        maxLength={50}
                        className="focus-visible:ring-[#528A94]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="px-6 py-4 bg-white border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || loadingDatos}
              className="bg-[#5d8f72] hover:bg-[#44785a] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de éxito */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md p-0 overflow-hidden border-0">
          <div className="bg-gradient-to-br from-[#58e0be] to-[#5d8f72] px-6 py-6 text-white text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm shadow-lg ring-4 ring-white/20 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-white">¡Cambios guardados!</h3>
            <p className="text-white/90 mt-1 text-sm">
              La información del insumo se actualizó correctamente.
            </p>
          </div>
          <div className="px-6 py-4 bg-white flex justify-center">
            <Button
              onClick={handleSuccessClose}
              className="bg-[#5d8f72] hover:bg-[#44785a] text-white min-w-[120px]"
            >
              Continuar
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
