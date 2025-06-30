"use client"

import type * as React from "react"
import {
  Hotel,
  Package,
  ChefHat,
  Menu,
  BarChart3,
  Settings,
  Home,
  Building2,
  Users,
  Tags,
  Utensils,
  BookOpen,
  User,
  LogOut,
  TrendingUp,
  Percent,
  FileBarChart,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// Navegación exacta según tus especificaciones
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
      ],
    },
    {
      title: "Reporte y Análisis",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Análisis de Costos",
          url: "/analisis-costos",
          icon: TrendingUp,
        },
        {
          title: "Márgenes de Utilidad",
          url: "/margenes-utilidad",
          icon: Percent,
        },
        {
          title: "Reporte Comparativo",
          url: "/reporte-comparativo",
          icon: FileBarChart,
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
      ],
    },
    {
      title: "Perfil",
      url: "#",
      icon: User,
      items: [
        {
          title: "Perfil",
          url: "/perfil",
          icon: User,
        },
        {
          title: "Cerrar Sesión",
          url: "/cerrar-sesion",
          icon: LogOut,
        },
      ],
    },
  ],
}

export function AppSidebarFinal({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
