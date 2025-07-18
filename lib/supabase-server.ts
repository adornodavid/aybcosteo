import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/types-sistema-costeo"

// Server-side Supabase client
export const createServerSupabaseClient = () => createServerComponentClient<Database>({ cookies })
