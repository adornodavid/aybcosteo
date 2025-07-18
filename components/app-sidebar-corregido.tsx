"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Utensils,
  Apple,
  DollarSign,
  Building,
  Hotel,
  Users,
  Shield,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  FileText,
  BarChart,
  History,
  Package,
  Scale,
  ListChecks,
  Plus,
  Upload,
  Menu,
  Key,
  RefreshCw,
} from "lucide-react"
import { logout } from "@/app/actions/login-backend-actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

// Definir los iconos que se usan en el sidebar
export const Icons = {
  LayoutDashboard,
  Utensils,
  Salad: Apple,
  DollarSign,
  Building,
  Hotel,
  Users,
  Shield,
  Settings,
  LogOut,
  FileText,
  BarChart,
  History,
  Package,
  Scale,
  ListChecks,
  Plus,
  Upload,
  Menu,
  Key,
  RefreshCw,
  FileUp: Upload,
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean
  links: {
    title: string
    label?: string
    icon: React.ElementType
    variant: "default" | "ghost"
    href: string
    submenu?: {
      title: string
      href: string
      icon: React.ElementType
    }[]
  }[]
}

export function AppSidebar({ isCollapsed, links, className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => (prev.includes(title) ? prev.filter((group) => group !== title) : [...prev, title]))
  }

  return (
    <div
      data-collapsed={isCollapsed}
      className={cn("group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2", className)}
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary rounded-lg">
              <img src="/placeholder-logo.svg" alt="Logo" className="h-6 w-6" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold">Sistema de Costeo</h1>
                <p className="text-xs text-muted-foreground">Gestión de Ingredientes</p>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          {links.map((link, index) =>
            link.submenu ? (
              <div key={index} className="relative mb-1">
                <Button
                  variant={pathname.startsWith(link.href) ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isCollapsed && "h-9 w-9",
                    pathname.startsWith(link.href) && "bg-primary text-primary-foreground",
                  )}
                  onClick={() => toggleGroup(link.title)}
                >
                  <link.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <>
                      {link.title}
                      {openGroups.includes(link.title) ? (
                        <ChevronUp className="ml-auto h-4 w-4 transition-transform" />
                      ) : (
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform" />
                      )}
                    </>
                  )}
                </Button>
                {!isCollapsed && openGroups.includes(link.title) && (
                  <div className="ml-4 mt-1 grid gap-1">
                    {link.submenu.map((subLink, subIndex) => (
                      <Link key={subIndex} href={subLink.href}>
                        <Button
                          variant={pathname === subLink.href ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start",
                            pathname === subLink.href && "bg-accent text-accent-foreground",
                          )}
                        >
                          <subLink.icon className="mr-3 h-4 w-4" />
                          {subLink.title}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={index} href={link.href}>
                <Button
                  variant={pathname === link.href ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start mb-1",
                    isCollapsed && "h-9 w-9",
                    pathname === link.href && "bg-primary text-primary-foreground",
                  )}
                >
                  <link.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <>
                      {link.title}
                      {link.label && (
                        <span className={cn("ml-auto", pathname === link.href && "text-background dark:text-white")}>
                          {link.label}
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            ),
          )}
        </ScrollArea>
      </nav>

      {/* Botón de logout */}
      <div className="mt-auto px-2 py-4 border-t">
        <Button variant="ghost" className={cn("w-full justify-start", isCollapsed && "h-9 w-9")} onClick={handleLogout}>
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Cerrar Sesión"}
        </Button>
      </div>
    </div>
  )
}
