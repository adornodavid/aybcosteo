"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, ChevronDown } from "lucide-react"
import { obtenerHeaderUsuario } from "@/app/actions/perfil-actions"

function initials(nombre: string | null | undefined) {
  if (!nombre) return "?"
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export function AppHeader() {
  const router = useRouter()
  const { user } = useAuth()
  const [imgurl, setImgurl] = useState<string | null>(null)
  const [nombre, setNombre] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.UsuarioId) return
    let cancelled = false
    obtenerHeaderUsuario(user.UsuarioId as any).then((data) => {
      if (cancelled || !data) return
      setImgurl(data.imgurl)
      setNombre(data.nombrecompleto ?? user.NombreCompleto ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [user?.UsuarioId, user?.NombreCompleto])

  // Si no hay sesión, no renderizar (evita el flicker en /login y rutas públicas).
  if (!user) return null

  const displayNombre = nombre ?? user.NombreCompleto ?? "Usuario"
  const displayEmail = user.Email ?? ""

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-[#528A94] bg-[#F1F6F7] shadow-sm flex items-center justify-end px-4 md:px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full pl-1.5 pr-2 py-1 hover:bg-[#528A94]/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#528A94]"
            aria-label="Menú de usuario"
          >
            <Avatar className="h-9 w-9 ring-1 ring-[#528A94]/40">
              <AvatarImage src={imgurl || undefined} alt={displayNombre} />
              <AvatarFallback className="bg-gradient-to-br from-[#1F4F58] to-[#528A94] text-white text-xs font-semibold">
                {initials(displayNombre)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-slate-800 max-w-[160px] truncate">
                {displayNombre}
              </span>
              {displayEmail && (
                <span className="text-[10px] text-slate-600 max-w-[160px] truncate">
                  {displayEmail}
                </span>
              )}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-0.5">
              <span className="text-sm font-semibold text-slate-900 truncate">{displayNombre}</span>
              {displayEmail && (
                <span className="text-xs text-slate-500 truncate">{displayEmail}</span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => router.push("/perfil")}
            className="cursor-pointer"
          >
            <User className="h-4 w-4 mr-2" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => router.push("/logout")}
            className="cursor-pointer text-rose-700 focus:text-rose-700 focus:bg-rose-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
