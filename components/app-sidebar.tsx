"use client"

import type * as React from "react"
import { Hotel, Package, ChefHat, Menu, BarChart3, FileSpreadsheet, Settings, Home } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// Datos de navegación actualizados para el nuevo sistema
const data = {
  user: {
    name: "Usuario Sistema",
    email: "usuario@hotel.com",
    avatar: "/avatars/shadcn.jpg",
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
        },
        {
          title: "Restaurantes",
          url: "/restaurantes",
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
        },
        {
          title: "Categorías",
          url: "/categorias",
        },
        {
          title: "Unidades de Medida",
          url: "/unidades",
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
        },
        {
          title: "Recetas",
          url: "/recetas",
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
        },
        {
          title: "Análisis de Precios",
          url: "/analisis-precios",
        },
      ],
    },
    {
      title: "Reportes",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Análisis de Costos",
          url: "/reportes/costos",
        },
        {
          title: "Márgenes de Utilidad",
          url: "/reportes/margenes",
        },
        {
          title: "Comparativa Hoteles",
          url: "/reportes/hoteles",
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
        },
        {
          title: "Plantillas",
          url: "/plantillas",
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
        },
        {
          title: "Roles",
          url: "/roles",
        },
        {
          title: "Configuración",
          url: "/configuracion",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
