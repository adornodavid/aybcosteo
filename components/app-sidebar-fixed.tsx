"use client"

import type * as React from "react"
import {
  Building2,
  ChefHat,
  DollarSign,
  Home,
  Hotel,
  Package,
  Settings,
  Users,
  UtensilsCrossed,
  FileText,
  BarChart3,
  Upload,
  Scale,
  History,
  UserCheck,
  Shield,
  BookOpen,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { NavMainSimple } from "@/components/nav-main-simple"

// Datos de navegación
const data = {
  user: {
    name: "Usuario Sistema",
    email: "admin@sistema.com",
    avatar: "/placeholder-user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Gestión",
      icon: Settings,
      items: [
        {
          title: "Hoteles",
          url: "/hoteles",
          icon: Hotel,
        },
        {
          title: "Restaurantes",
          url: "/restaurantes",
          icon: Building2,
        },
        {
          title: "Categorías",
          url: "/categorias",
          icon: Package,
        },
        {
          title: "Unidades",
          url: "/unidades",
          icon: Scale,
        },
      ],
    },
    {
      title: "Ingredientes",
      icon: Package,
      items: [
        {
          title: "Ver Ingredientes",
          url: "/ingredientes",
          icon: Package,
        },
        {
          title: "Nuevo Ingrediente",
          url: "/ingredientes/nuevo",
          icon: Package,
        },
        {
          title: "Precios",
          url: "/precios",
          icon: DollarSign,
        },
      ],
    },
    {
      title: "Platillos",
      icon: ChefHat,
      items: [
        {
          title: "Ver Platillos",
          url: "/platillos",
          icon: ChefHat,
        },
        {
          title: "Crear Platillo",
          url: "/platillos/crear",
          icon: ChefHat,
        },
        {
          title: "Recetas",
          url: "/recetas",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Menús",
      icon: UtensilsCrossed,
      items: [
        {
          title: "Ver Menús",
          url: "/menus",
          icon: UtensilsCrossed,
        },
      ],
    },
    {
      title: "Reportes",
      icon: BarChart3,
      items: [
        {
          title: "Análisis",
          url: "/analisis",
          icon: BarChart3,
        },
        {
          title: "Histórico",
          url: "/historico",
          icon: History,
        },
      ],
    },
    {
      title: "Importar",
      icon: Upload,
      items: [
        {
          title: "Importar Datos",
          url: "/importar",
          icon: Upload,
        },
        {
          title: "Excel Correcto",
          url: "/importar/excel-correcto",
          icon: FileText,
        },
        {
          title: "Análisis Excel",
          url: "/importar/analisis-excel",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Administración",
      icon: Shield,
      items: [
        {
          title: "Usuarios",
          url: "/usuarios",
          icon: Users,
        },
        {
          title: "Roles",
          url: "/roles",
          icon: UserCheck,
        },
        {
          title: "Permisos",
          url: "/permisos",
          icon: Shield,
        },
        {
          title: "Actualizar Status",
          url: "/actualizar-status",
          icon: Settings,
        },
      ],
    },
  ],
}

export function AppSidebarFixed({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ChefHat className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Sistema de Costeo</span>
            <span className="truncate text-xs">Gestión Hotelera</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMainSimple items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
