"use client"

import { useUserSession } from "@/hooks/use-user-session"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function UserInfo() {
  const { profile, loading } = useUserSession()

  if (loading) {
    return (
      <div className="flex items-center space-x-3 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="flex items-center space-x-3 p-4 border rounded-lg bg-card">
      <Avatar>
        <AvatarFallback>{profile.nombre?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{profile.nombre}</p>
        <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        <div className="flex items-center gap-2 mt-1">
          {profile.rol && (
            <Badge variant="secondary" className="text-xs">
              {profile.rol}
            </Badge>
          )}
          {profile.hotel_nombre && (
            <Badge variant="outline" className="text-xs">
              {profile.hotel_nombre}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
