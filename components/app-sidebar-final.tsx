"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getSession } from "@/app/actions/session-actions"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useNavigationGuard } from "@/contexts/navigation-guard-context"

interface SessionData {
  UsuarioId: number
  Email: string
  NombreCompleto: string
  HotelId: number
  RolId: number
  Permisos: string
  SesionActiva: boolean
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false)
  const { attemptNavigation } = useNavigationGuard()

  useEffect(() => {
    const loadSession = async () => {
      const session = await getSession()
      setSessionData(session)
    }
    loadSession()
  }, [])

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) => (prev.includes(menuName) ? prev.filter((name) => name !== menuName) : [...prev, menuName]))
  }

  const isActive = (href: string) => pathname === href

  const handleNavigationClick = useCallback(
    async (href: string) => {
      const canProceed = await attemptNavigation(href)
      if (canProceed) {
        router.push(href)
        setIsOffcanvasOpen(false) // Cerrar offcanvas al navegar
      }
    },
    [attemptNavigation, router],
  )

  const userRolId = Number(sessionData?.RolId ?? 0)
  const isAdminRole = [1, 2, 3, 4].includes(userRolId)

  const allMenuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Icons.LayoutDashboard,
      hasSubmenu: false,
    },
    {
      name: "Insumos",
      icon: Icons.Package,
      hasSubmenu: true,
      submenu: [
        { name: "Ingredientes", href: "/ingredientes", icon: Icons.Salad },
        { name: "Categorías", href: "/categorias", icon: Icons.Package },
      ],
    },
    {
      name: "Cocina",
      icon: Icons.Utensils,
      hasSubmenu: true,
      submenu: [
        { name: "Recetas", href: "/platillos", icon: Icons.Utensils },
        { name: "Sub-Recetas", href: "/recetas", icon: Icons.FileText },
      ],
    },
    {
      name: "Menús",
      icon: Icons.Menu,
      hasSubmenu: true,
      submenu: [{ name: "Gestión de Menús", href: "/menus", icon: Icons.Menu }],
    },
    {
      name: "Reporte y Análisis",
      icon: Icons.BarChart,
      hasSubmenu: true,
      submenu: [
        { name: "Análisis de Costos", href: "/analisiscostos", icon: Icons.TrendingUp },
        { name: "Reportes Completos ", href: "/margenesutilidad", icon: Icons.PieChart },
      ],
    },
    {
      name: "Gestión Hotelera",
      icon: Icons.Hotel,
      hasSubmenu: true,
      submenu: [
        { name: "Hoteles", href: "/hoteles", icon: Icons.Hotel },
        { name: "Restaurantes", href: "/restaurantes", icon: Icons.Building },
      ],
    },
    {
      name: "Administración",
      icon: Icons.UsersRound,
      hasSubmenu: true,
      onlyAdmin: true,
      submenu: [
        { name: "Usuarios", href: "/admin/usuarios", icon: Icons.User },
        { name: "Bitacora Usuarios", href: "/control-usuarios", icon: Icons.UsersRound },
        { name: "Importación de Datos", href: "/importar", icon: Icons.FileUp },
        { name: "Carga de Ventas", href: "/cargaventas", icon: Icons.Tag },
      ],
    },
    {
      name: "Perfil",
      icon: Icons.User,
      hasSubmenu: true,
      submenu: [
        { name: "Perfil", href: "/perfil", icon: Icons.User },
        { name: "Cerrar Sesión", href: "/logout", icon: Icons.LogOut },
      ],
    },
  ]

  const menuItems = allMenuItems.filter((item: any) => !item.onlyAdmin || isAdminRole)

  return (
    <>
      {/* Sidebar compacta de 100px */}
      <div className="w-[90px] h-screen bg-[#1F4F58] text-white flex flex-col fixed left-0 top-0 z-40">
        {/* Logo compacto — altura alineada con el AppHeader (h-14) */}
        <div className="h-14 border-b border-[#528A94] flex items-center justify-center">
          <div className="w-8 h-8 bg-[#E8F0F1] rounded flex items-center justify-center">
            <Icons.Utensils className="w-4 h-4 text-[#1F4F58]" />
          </div>
        </div>

        {/* Navegación compacta */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-2">
            {/* Botón hamburguesa para offcanvas */}
            <Sheet open={isOffcanvasOpen} onOpenChange={setIsOffcanvasOpen}>
              <SheetTrigger asChild>
                <button className="w-full flex justify-center items-center p-3 rounded-md text-white hover:bg-[#2D6470] transition-colors">
                  <Icons.Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-[#1F4F58] border-r-0">
                {/* Contenido completo de la sidebar offcanvas */}
                <div className="h-full flex flex-col">
                  {/* Logo */}
                  <div className="p-4 border-b border-[#528A94]">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                        <Icons.Utensils className="w-5 h-5 text-black" />
                      </div>
                      <span className="font-bold text-lg text-white">Sistema de Costeo</span>
                    </div>
                  </div>

                  {/* Nombre del usuario */}
                  <div className="p-4 border-b border-[#528A94]">
                    <div className="flex items-center space-x-2">
                      <Icons.User className="w-5 h-5 text-white" />
                      <span className="text-sm font-medium text-white">{sessionData?.NombreCompleto || "Usuario"}</span>
                    </div>
                  </div>

                  {/* Navegación completa */}
                  <nav className="flex-1 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {menuItems.map((item) => (
                        <div key={item.name}>
                          {!item.hasSubmenu ? (
                            <button
                              onClick={() => handleNavigationClick(item.href!)}
                              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                                isActive(item.href!)
                                  ? "bg-[#7BAEB8] text-white shadow-sm"
                                  : "text-white hover:bg-[#2D6470] hover:text-white"
                              }`}
                            >
                              <item.icon className="w-5 h-5 text-white" />
                              <span>{item.name}</span>
                            </button>
                          ) : (
                            <Collapsible
                              open={openMenus.includes(item.name)}
                              onOpenChange={() => toggleMenu(item.name)}
                            >
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start space-x-3 px-3 py-2 text-sm font-medium text-white hover:bg-[#2D6470] hover:text-white"
                                >
                                  <item.icon className="w-5 h-5 text-white" />
                                  <span className="flex-1 text-left">{item.name}</span>
                                  {openMenus.includes(item.name) ? (
                                    <Icons.ChevronDown className="w-4 h-4 text-white" />
                                  ) : (
                                    <Icons.ChevronRight className="w-4 h-4 text-white" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="ml-6 mt-1 space-y-1">
                                {item.submenu?.map((subItem) => (
                                  <button
                                    key={subItem.name}
                                    onClick={() => handleNavigationClick(subItem.href)}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors w-full ${
                                      isActive(subItem.href)
                                        ? "bg-[#7BAEB8] text-white shadow-sm"
                                        : "text-white hover:bg-[#2D6470] hover:text-white"
                                    }`}
                                  >
                                    <subItem.icon className="w-4 h-4 text-white" />
                                    <span>{subItem.name}</span>
                                  </button>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </div>
                      ))}
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Iconos de navegación directa */}
            <button
              onClick={() => handleNavigationClick("/dashboard")}
              className={`w-full flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${
                isActive("/dashboard") ? "bg-[#7BAEB8] text-white shadow-sm" : "text-white hover:bg-[#2D6470]"
              }`}
              title="Dashboard"
            >
              <Icons.LayoutDashboard className="w-6 h-6" />
              <span className="text-[10px] font-medium leading-tight">Dashboard</span>
            </button>

            <button
              onClick={() => handleNavigationClick("/platillos")}
              className={`w-full flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${
                isActive("/platillos") ? "bg-[#7BAEB8] text-white shadow-sm" : "text-white hover:bg-[#2D6470]"
              }`}
              title="Recetas"
            >
              <Icons.Utensils className="w-6 h-6" />
              <span className="text-[10px] font-medium leading-tight">Recetas</span>
            </button>

            <button
              onClick={() => handleNavigationClick("/recetas")}
              className={`w-full flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${
                isActive("/recetas") ? "bg-[#7BAEB8] text-white shadow-sm" : "text-white hover:bg-[#2D6470]"
              }`}
              title="Sub-Recetas"
            >
              <Icons.FileText className="w-6 h-6" />
              <span className="text-[10px] font-medium leading-tight">Sub-Recetas</span>
            </button>

            <button
              onClick={() => handleNavigationClick("/menus")}
              className={`w-full flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${
                isActive("/menus") ? "bg-[#7BAEB8] text-white shadow-sm" : "text-white hover:bg-[#2D6470]"
              }`}
              title="Menús"
            >
              <Icons.BookOpen className="w-6 h-6" />
              <span className="text-[10px] font-medium leading-tight">Menús</span>
            </button>

            {isAdminRole && (
              <button
                onClick={() => handleNavigationClick("/control-usuarios")}
                className={`w-full flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${
                  isActive("/control-usuarios") ? "bg-[#7BAEB8] text-white shadow-sm" : "text-white hover:bg-[#2D6470]"
                }`}
                title="Bitacora Usuarios"
              >
                <Icons.UsersRound className="w-6 h-6" />
                <span className="text-[10px] font-medium leading-tight text-center">Bitacora Usuarios</span>
              </button>
            )}

            {/*<button
              onClick={() => handleNavigationClick("/ingredientes")}
              className={`w-full flex justify-center items-center p-3 rounded-md transition-colors ${
                isActive("/ingredientes") ? "bg-[#7BAEB8] text-white shadow-sm" : "text-white hover:bg-[#2D6470]"
              }`}
              title="Ingredientes"
            >
              <Icons.Salad className="w-6 h-6" />
              
            </button>
            
            <button
              onClick={() => handleNavigationClick("/platillos")}
              className={`w-full flex justify-center items-center p-3 rounded-md transition-colors ${
                isActive("/platillos") ? "bg-[#7BAEB8] text-white shadow-sm" : "text-white hover:bg-[#2D6470]"
              }`}
              title="Recetas"
            >
              <Icons.Utensils className="w-6 h-6" />
            </button>

            <button
              onClick={() => handleNavigationClick("/recetas")}
              className={`w-full flex justify-center items-center p-3 rounded-md transition-colors ${
                isActive("/recetas") ? "bg-[#7BAEB8] text-white shadow-sm" : "text-white hover:bg-[#2D6470]"
              }`}
              title="Sub-Recetas"
            >
              <Icons.FileText className="w-6 h-6" />
            </button>

            <button
              onClick={() => handleNavigationClick("/perfil")}
              className={`w-full flex justify-center items-center p-3 rounded-md transition-colors ${
                isActive("/perfil") ? "bg-[#7BAEB8] text-white shadow-sm" : "text-white hover:bg-[#2D6470]"
              }`}
              title="Perfil"
            >
              <Icons.User className="w-6 h-6" />
            </button>*/}
          </div>
        </nav>
      </div>
    </>
  )
}
