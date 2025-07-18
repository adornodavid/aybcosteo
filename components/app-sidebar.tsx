"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Package2,
  Home,
  Utensils,
  ChefHat,
  BookText,
  DollarSign,
  Building2,
  Scale,
  Users,
  ShieldCheck,
  Settings,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUserSession } from "@/hooks/use-user-session"
import { useEffect, useState } from "react"

export function AppSidebar() {
  const pathname = usePathname()
  const { session, loading } = useUserSession()
  const [userRolId, setUserRolId] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && session) {
      setUserRolId(session.user?.user_metadata?.rol_id || null)
    }
  }, [session, loading])

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard", roles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { href: "/ingredientes", icon: Package2, label: "Ingredientes", roles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { href: "/platillos", icon: ChefHat, label: "Platillos", roles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { href: "/recetas", icon: BookText, label: "Recetas", roles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { href: "/precios", icon: DollarSign, label: "Precios", roles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { href: "/restaurantes", icon: Utensils, label: "Restaurantes", roles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { href: "/hoteles", icon: Building2, label: "Hoteles", roles: [1, 2, 3, 4] }, // Only roles 1,2,3,4
    { href: "/unidades", icon: Scale, label: "Unidades de Medida", roles: [1, 2, 3, 4] }, // Only roles 1,2,3,4
    { href: "/categorias", icon: Scale, label: "Categorías", roles: [1, 2, 3, 4] }, // Only roles 1,2,3,4
    { href: "/usuarios", icon: Users, label: "Usuarios", roles: [1, 2] }, // Only roles 1,2
    { href: "/roles", icon: ShieldCheck, label: "Roles", roles: [1] }, // Only role 1
    { href: "/permisos", icon: ShieldCheck, label: "Permisos", roles: [1] }, // Only role 1
    { href: "/config", icon: Settings, label: "Configuración", roles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  ]

  if (loading) {
    return (
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="#"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">Sistema de Costeo</span>
          </Link>
          {/* Loading skeleton for nav items */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </nav>
      </aside>
    )
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="#"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Sistema de Costeo</span>
        </Link>
        <TooltipProvider>
          {navItems.map((item) => {
            // Check if userRolId is available and if it's included in the item's allowed roles
            const hasPermission = userRolId !== null && item.roles.includes(userRolId)
            if (!hasPermission) {
              return null // Don't render if no permission
            }
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                      pathname === item.href && "bg-accent text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        {/* Future settings or user profile links */}
      </nav>
    </aside>
  )
}
