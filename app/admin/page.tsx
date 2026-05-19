import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Users, ShieldCheck, ChevronRight, LayoutDashboard, ClipboardList, BookOpen } from "lucide-react"
import { requireAdmin } from "@/lib/admin-guard"

interface ModuleItem {
  title: string
  description: string
  icon: typeof Users
  href: string
  soloSuperAdmin?: boolean
  border: string
  gradient: string
  topBar: string
  iconText: string
  iconBg: string
  iconBgHover: string
  titleHover: string
  chevron: string
  ringHover: string
}

const modules: ModuleItem[] = [
  {
    title: "Usuarios",
    description: "Crear, editar y administrar los usuarios del sistema",
    icon: Users,
    href: "/admin/usuarios",
    border: "border-lime-200",
    gradient: "from-lime-50 to-transparent",
    topBar: "bg-gradient-to-r from-lime-200 via-lime-400 to-lime-200",
    iconText: "text-lime-600",
    iconBg: "bg-lime-600/10",
    iconBgHover: "group-hover:bg-lime-600/20",
    titleHover: "group-hover:text-lime-700",
    chevron: "text-lime-600",
    ringHover: "hover:border-lime-400",
  },
  {
    title: "Bitacora Usuarios",
    description: "Revisar accesos y actividad de los usuarios",
    icon: ClipboardList,
    href: "/control-usuarios",
    border: "border-blue-200",
    gradient: "from-blue-50 to-transparent",
    topBar: "bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200",
    iconText: "text-blue-600",
    iconBg: "bg-blue-600/10",
    iconBgHover: "group-hover:bg-blue-600/20",
    titleHover: "group-hover:text-blue-700",
    chevron: "text-blue-600",
    ringHover: "hover:border-blue-400",
  },
  {
    title: "Bitácora",
    description: "Bitácora de movimientos por usuario",
    icon: BookOpen,
    href: "/control-usuarios/bitacora",
    border: "border-amber-200",
    gradient: "from-amber-50 to-transparent",
    topBar: "bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200",
    iconText: "text-amber-600",
    iconBg: "bg-amber-600/10",
    iconBgHover: "group-hover:bg-amber-600/20",
    titleHover: "group-hover:text-amber-700",
    chevron: "text-amber-600",
    ringHover: "hover:border-amber-400",
  },
]

export default async function AdminPage() {
  const session = await requireAdmin()
  const esSuperAdmin = session.RolId === 1
  const modulosVisibles = modules.filter((m) => !m.soloSuperAdmin || esSuperAdmin)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-gradient-to-r from-lime-50 to-transparent rounded-xl border border-lime-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-lime-600/10">
            <LayoutDashboard className="h-5 w-5 text-lime-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">
              Módulos de administración del sistema
              {esSuperAdmin && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-lime-700">
                  <ShieldCheck className="h-3 w-3" />
                  SuperAdmin
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modulosVisibles.map((mod) => {
          const Icon = mod.icon
          return (
            <Link key={mod.href} href={mod.href}>
              <Card
                className={`cursor-pointer group transition-all duration-200 overflow-hidden ${mod.border} ${mod.ringHover} hover:shadow-md`}
              >
                <div className={`h-1 w-full ${mod.topBar}`} />
                <CardContent
                  className={`flex flex-col items-center text-center gap-4 py-10 bg-gradient-to-br ${mod.gradient}`}
                >
                  <div className={`rounded-full p-4 transition-colors ${mod.iconBg} ${mod.iconBgHover}`}>
                    <Icon className={`h-8 w-8 ${mod.iconText}`} />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold transition-colors ${mod.titleHover}`}>{mod.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1 px-2">{mod.description}</p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 ${mod.chevron} opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all`}
                  />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
