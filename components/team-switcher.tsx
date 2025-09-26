"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "./ui/loader2"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase"
import type { Hotel } from "@/lib/types-sistema-costeo"

interface TeamSwitcherProps {
  hotels: Hotel[]
  selectedHotel: Hotel | null
  onSelectHotel: (hotel: Hotel) => void
}

export function TeamSwitcher({ hotels, selectedHotel, onSelectHotel }: TeamSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const [newHotelName, setNewHotelName] = React.useState("")
  const [isCreatingHotel, setIsCreatingHotel] = React.useState(false)
  const { refreshSession } = useAuth()
  const { toast } = useToast()

  const supabase = createClient() // Client-side Supabase client

  const handleCreateHotel = async () => {
    if (!newHotelName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del hotel no puede estar vacío.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingHotel(true)
    try {
      const { data, error } = await supabase.from("hoteles").insert({ nombre: newHotelName }).select().single()

      if (error) {
        throw error
      }

      toast({
        title: "Éxito",
        description: `Hotel "${data.nombre}" creado exitosamente.`,
      })
      setNewHotelName("")
      setShowNewTeamDialog(false)
      setOpen(false)
      await refreshSession() // Refresh session to get updated hotel list
    } catch (error: any) {
      console.error("Error creating hotel:", error)
      toast({
        title: "Error",
        description: `No se pudo crear el hotel: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsCreatingHotel(false)
    }
  }

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Seleccionar hotel"
            className={cn("w-[200px] justify-between", !selectedHotel && "text-muted-foreground")}
          >
            {selectedHotel ? (
              <>
                <Avatar className="mr-2 h-5 w-5">
                  <AvatarImage
                    src={`/images/design-mode/%24%7BselectedHotel.id%7D%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29.png`}
                    alt={selectedHotel.nombre}
                    className="grayscale"
                  />
                  <AvatarFallback>{selectedHotel.nombre.charAt(0)}</AvatarFallback>
                </Avatar>
                {selectedHotel.nombre}
              </>
            ) : (
              "Seleccionar hotel..."
            )}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Buscar hotel..." />
              <CommandEmpty>No se encontraron hoteles.</CommandEmpty>
              <CommandGroup heading="Hoteles">
                {hotels.map((hotel) => (
                  <CommandItem
                    key={hotel.id}
                    onSelect={() => {
                      onSelectHotel(hotel)
                      setOpen(false)
                    }}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={`/images/design-mode/%24%7Bhotel.id%7D%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29%281%29.png`}
                        alt={hotel.nombre}
                        className="grayscale"
                      />
                      <AvatarFallback>{hotel.nombre.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {hotel.nombre}
                    <Check
                      className={cn("ml-auto h-4 w-4", selectedHotel?.id === hotel.id ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setShowNewTeamDialog(true)
                    }}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Crear nuevo hotel
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear hotel</DialogTitle>
          <DialogDescription>Añade un nuevo hotel a tu cuenta.</DialogDescription>
        </DialogHeader>
        <div>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del hotel</Label>
              <Input
                id="name"
                placeholder="Hotel Ejemplo"
                value={newHotelName}
                onChange={(e) => setNewHotelName(e.target.value)}
                disabled={isCreatingHotel}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewTeamDialog(false)} disabled={isCreatingHotel}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleCreateHotel} disabled={isCreatingHotel}>
            {isCreatingHotel ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
