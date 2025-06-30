"use client"

import type * as React from "react"
import {
  Hotel,
  Package,
  ChefHat,
  Menu,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Home,
  Building2,
  Users,
  Scale,
  Tags,
  Utensils,
  BookOpen,
  History,
  Shield,
  UserCheck,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// Navegación corregida basada en el diagrama de BD
const data = {
  user: {
    name: "Usuario Sistema",
    email: "usuario@hotel.com",
    avatar: "/placeholder-user.jpg",
  },
  teams: [
    {
      name: "Sistema de Costeo",
      logo: Hotel,
      plan: "Hotelero",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Gestión Hotelera",
      url: "#",
      icon: Hotel,
      items: [
        {
          title: "Hoteles",
          url: "/hoteles",
          icon: Building2,
        },
        {
          title: "Restaurantes",
          url: "/restaurantes",
          icon: Utensils,
        },
      ],
    },
    {
      title: "Insumos",
      url: "#",
      icon: Package,
      items: [
        {
          title: "Ingredientes",
          url: "/ingredientes",
          icon: Package,
        },
        {
          title: "Categorías",
          url: "/categorias",
          icon: Tags,
        },
        {
          title: "Unidades de Medida",
          url: "/unidades",
          icon: Scale,
        },
      ],
    },
    {
      title: "Cocina",
      url: "#",
      icon: ChefHat,
      items: [
        {
          title: "Platillos",
          url: "/platillos",
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
      url: "#",
      icon: Menu,
      items: [
        {
          title: "Gestión de Menús",
          url: "/menus",
          icon: Menu,
        },
        {
          title: "Platillos por Menú",
          url: "/platillos-menu",
          icon: Utensils,
        },
      ],
    },
    {
      title: "Reportes y Análisis",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Histórico de Costos",
          url: "/historico",
          icon: History,
        },
        {
          title: "Análisis de Precios",
          url: "/analisis",
          icon: BarChart3,
        },
        {
          title: "Comparativa Hoteles",
          url: "/comparativa",
          icon: Building2,
        },
      ],
    },
    {
      title: "Importación",
      url: "#",
      icon: FileSpreadsheet,
      items: [
        {
          title: "Importar Excel",
          url: "/importar",
          icon: FileSpreadsheet,
        },
        {
          title: "Plantillas",
          url: "/plantillas",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      title: "Administración",
      url: "#",
      icon: Settings,
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
          title: "Configuración",
          url: "/configuracion",
          icon: Settings,
        },
      ],
    },
  ],
}

export function AppSidebarCorregido({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
