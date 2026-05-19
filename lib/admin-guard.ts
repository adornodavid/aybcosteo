import { redirect } from "next/navigation"
import { getSession } from "@/app/actions/session-actions"

const ADMIN_ROLES = new Set<number>([1, 2, 3, 4])

export async function requireAdmin() {
  const session = await getSession()
  if (!session || !session.SesionActiva) {
    redirect("/login")
  }
  if (!ADMIN_ROLES.has(session.RolId)) {
    redirect("/sin-permisos")
  }
  return session
}

export function esRolAdmin(rolid: number | null | undefined): boolean {
  return rolid != null && ADMIN_ROLES.has(Number(rolid))
}
