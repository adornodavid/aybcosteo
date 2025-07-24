"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { crearOActualizarRestaurante } from "@/app/actions/restaurantes-actions"
import { Loader2 } from "@/components/ui/loader2"
import { ImageUpload } from "@/components/ui/image-upload"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import type { Restaurante, DropdownOption } from "@/lib/types-sistema-costeo"
import { TriangleAlert } from "lucide-react" // Importar el icono de alerta

const formSchema = z.object({
  hddAccion: z.string().optional(),
  hddEdicionRestauranteId: z.string().optional(),
  txtEdicionRestauranteNombre: z.string().max(150, "Máximo 150 caracteres"),
  txtEdicionRestauranteDireccion: z.string().max(255, "Máximo 255 caracteres").optional().nullable(),
  ddlEdicionHotel: z.string(),
  hddEdicionImagen: z.string().optional().nullable(),
  activo: z.boolean().default(true), // Añadir el campo activo al esquema
})

interface RestauranteFormProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Restaurante | null
  hotels: DropdownOption[]
}

export function RestauranteForm({ isOpen, onClose, initialData, hotels }: RestauranteFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imagen_url || null)
  const [showTopLevelAlert, setShowTopLevelAlert] = useState(false) // Nuevo estado para la alerta superior

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hddAccion: initialData ? "Editar" : "Nuevo",
      hddEdicionRestauranteId: initialData?.id ? String(initialData.id) : "0",
      txtEdicionRestauranteNombre: initialData?.nombre || "",
      txtEdicionRestauranteDireccion: initialData?.direccion || "",
      ddlEdicionHotel: initialData?.hotel_id ? String(initialData.hotel_id) : "0",
      hddEdicionImagen: initialData?.imagen_url || null,
      activo: initialData?.activo ?? true, // Establecer el valor inicial para activo
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        hddAccion: initialData ? "Editar" : "Nuevo",
        hddEdicionRestauranteId: initialData?.id ? String(initialData.id) : "0",
        txtEdicionRestauranteNombre: initialData?.nombre || "",
        txtEdicionRestauranteDireccion: initialData?.direccion || "",
        ddlEdicionHotel: initialData?.hotel_id ? String(initialData.hotel_id) : "0",
        hddEdicionImagen: initialData?.imagen_url || null,
        activo: initialData?.activo ?? true,
      })
      setImageUrl(initialData?.imagen_url || null)
      setShowTopLevelAlert(false) // Reset alert on open
    }
  }, [isOpen, initialData, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validación manual para la alerta superior
    const isNombreEmpty = !values.txtEdicionRestauranteNombre || values.txtEdicionRestauranteNombre.trim() === ""
    const isHotelNotSelected = values.ddlEdicionHotel === "0"
    const isDireccionEmpty =
      !values.txtEdicionRestauranteDireccion || values.txtEdicionRestauranteDireccion.trim() === ""

    if (isNombreEmpty || isHotelNotSelected || isDireccionEmpty) {
      setShowTopLevelAlert(true)
      setIsSubmitting(false) // Asegurar que el botón no se quede en estado de envío
      return // Detener el envío del formulario
    }

    setShowTopLevelAlert(false) // Ocultar la alerta si la validación manual pasa

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("hddAccion", values.hddAccion || "")
    formData.append("hddEdicionRestauranteId", values.hddEdicionRestauranteId || "0")
    formData.append("txtEdicionRestauranteNombre", values.txtEdicionRestauranteNombre)
    formData.append("txtEdicionRestauranteDireccion", values.txtEdicionRestauranteDireccion || "")
    formData.append("ddlEdicionHotel", values.ddlEdicionHotel)
    formData.append("hddEdicionImagen", imageUrl || "") // Usar el estado de la imagen
    formData.append("activo", values.activo.toString()) // Añadir el estado activo al FormData

    const { success, message, error } = await crearOActualizarRestaurante(formData)

    if (success) {
      toast({
        title: "Éxito",
        description: message,
      })
      onClose()
    } else {
      toast({
        title: "Error",
        description: error || message,
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Restaurante" : "Crear Nuevo Restaurante"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Modifica los detalles del restaurante existente."
              : "Ingresa la información para crear un nuevo restaurante."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="frmRestaurantes"
          name="frmRestaurantes"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-4"
        >
          <input type="hidden" id="hddAccion" name="hddAccion" {...form.register("hddAccion")} />
          <input
            type="hidden"
            id="hddEdicionRestauranteId"
            name="hddEdicionRestauranteId"
            {...form.register("hddEdicionRestauranteId")}
          />
          <input
            type="hidden"
            id="hddEdicionImagen"
            name="hddEdicionImagen"
            {...form.register("hddEdicionImagen")}
            value={imageUrl || ""}
          />

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="txtEdicionRestauranteNombre" className="text-right">
              Nombre
            </Label>
            <Input
              id="txtEdicionRestauranteNombre"
              className="col-span-3"
              maxLength={150}
              {...form.register("txtEdicionRestauranteNombre", {
                onChange: () => setShowTopLevelAlert(false), // Ocultar alerta al cambiar
              })}
            />
            {form.formState.errors.txtEdicionRestauranteNombre && (
              <p className="col-span-4 text-right text-red-500 text-xs">
                {form.formState.errors.txtEdicionRestauranteNombre.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ddlEdicionHotel" className="text-right">
              Hotel
            </Label>
            <Select
              onValueChange={(value) => {
                form.setValue("ddlEdicionHotel", value)
                setShowTopLevelAlert(false) // Ocultar alerta al cambiar
              }}
              value={form.watch("ddlEdicionHotel")}
            >
              <SelectTrigger id="ddlEdicionHotel" className="col-span-3">
                <SelectValue placeholder="Selecciona un hotel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Selecciona un hotel</SelectItem>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.value} value={hotel.value}>
                    {hotel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.ddlEdicionHotel && (
              <p className="col-span-4 text-right text-red-500 text-xs">
                {form.formState.errors.ddlEdicionHotel.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="txtEdicionRestauranteDireccion" className="text-right">
              Dirección
            </Label>
            <Textarea
              id="txtEdicionRestauranteDireccion"
              className="col-span-3"
              maxLength={255}
              {...form.register("txtEdicionRestauranteDireccion", {
                onChange: () => setShowTopLevelAlert(false), // Ocultar alerta al cambiar
              })}
            />
            {form.formState.errors.txtEdicionRestauranteDireccion && (
              <p className="col-span-4 text-right text-red-500 text-xs">
                {form.formState.errors.txtEdicionRestauranteDireccion.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image-upload" className="text-right">
              Imagen
            </Label>
            <div className="col-span-3">
              <ImageUpload
                id="image-upload"
                currentImageUrl={imageUrl}
                onImageUploadSuccess={(url) => {
                  setImageUrl(url)
                  form.setValue("hddEdicionImagen", url)
                }}
                onImageRemove={() => {
                  setImageUrl(null)
                  form.setValue("hddEdicionImagen", null)
                }}
              />
            </div>
          </div>

          {initialData && ( // Solo mostrar el switch de activo/inactivo en edición
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activo" className="text-right">
                Activo
              </Label>
              <Switch
                id="activo"
                checked={form.watch("activo")}
                onCheckedChange={(checked) => form.setValue("activo", checked)}
                className="col-span-3"
              />
            </div>
          )}

          {showTopLevelAlert && (
            <div className="bg-yellow-100 text-yellow-800 p-3 mb-4 rounded-md flex items-center gap-2">
              <TriangleAlert className="h-5 w-5" />
              <span>Por favor, completa el nombre, hotel y dirección del restaurante.</span>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Registrar Restaurante"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
