"use client"

/* ==================================================
  Imports
================================================== */
import type React from "react"

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
import { crearOActualizarRestaurante, uploadImage } from "@/app/actions/restaurantes-actions"
import { Loader2 } from "@/components/ui/loader2"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import type { Restaurante, DropdownOption } from "@/lib/types-sistema-costeo"
import { TriangleAlert, UploadCloud } from "lucide-react" // Asegúrate de que UploadCloud esté aquí

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imagen_url || null)
  const [showTopLevelAlert, setShowTopLevelAlert] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImageUrl(URL.createObjectURL(file)) // Para previsualización local
    } else {
      setSelectedFile(null)
      setImageUrl(initialData?.imagen_url || null) // Vuelve a la imagen inicial o null si no hay archivo
    }
  }

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
      setSelectedFile(null) // Resetear el archivo seleccionado
      setShowTopLevelAlert(false)
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
      setIsSubmitting(false)
      return
    }

    setShowTopLevelAlert(false)

    setIsSubmitting(true)
    let finalImageUrl = imageUrl // Inicia con la URL actual (puede ser la existente o la previsualización local)

    if (selectedFile) {
      // Solo subir si se seleccionó un nuevo archivo
      const uploadFormData = new FormData()
      uploadFormData.append("file", selectedFile)
      const { success: uploadSuccess, url: uploadedUrl, error: uploadError } = await uploadImage(uploadFormData)

      if (!uploadSuccess) {
        toast({
          title: "Error al subir imagen",
          description: uploadError || "No se pudo subir la imagen.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      finalImageUrl = uploadedUrl // Usar la URL generada por Supabase
    } else if (initialData?.imagen_url && !imageUrl) {
      // Si había una imagen inicial pero el usuario la eliminó
      finalImageUrl = null
    }
    // Si no hay nuevo archivo y no hay imagen inicial, finalImageUrl permanece null.
    // Si no hay nuevo archivo pero existe una imagen inicial y no fue eliminada, finalImageUrl mantiene la URL inicial.

    const formData = new FormData()
    formData.append("hddAccion", values.hddAccion || "")
    formData.append("hddEdicionRestauranteId", values.hddEdicionRestauranteId || "0")
    formData.append("txtEdicionRestauranteNombre", values.txtEdicionRestauranteNombre)
    formData.append("txtEdicionRestauranteDireccion", values.txtEdicionRestauranteDireccion || "")
    formData.append("ddlEdicionHotel", values.ddlEdicionHotel)
    formData.append("hddEdicionImagen", finalImageUrl || "") // Usar la URL final de la imagen
    formData.append("activo", values.activo.toString())

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
            <Label htmlFor="image-upload-input" className="text-right">
              Imagen
            </Label>
            <div className="col-span-3 flex flex-col items-center gap-2">
              <label
                htmlFor="image-upload-input"
                className="flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt="Previsualización"
                    className="h-full w-full object-cover rounded-md"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="h-8 w-8" />
                    <span className="mt-2 text-sm">Subir imagen</span>
                  </div>
                )}
              </label>
              <input
                id="image-upload-input"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />
              {imageUrl && (
                <Button
                  type="button" // Importante: cambiar a type="button" para evitar que envíe el formulario
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null)
                    setImageUrl(null)
                    form.setValue("hddEdicionImagen", null)
                    // Resetear el input de archivo para permitir subir la misma imagen de nuevo
                    const fileInput = document.getElementById("image-upload-input") as HTMLInputElement
                    if (fileInput) fileInput.value = ""
                  }}
                >
                  Eliminar imagen
                </Button>
              )}
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
