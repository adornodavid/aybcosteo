import { createClientComponentClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs" // Importar createServerComponentClient
import type { Database } from "@/lib/types-sistema-costeo" // Asegúrate de que esta ruta sea correcta
import { cookies } from "next/headers" // Importar cookies para el cliente de servidor

// Define the database schema types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database }> =
  PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][Extract<
        keyof Database[PublicTableNameOrOptions["schema"]]["Tables"],
        string
      >]
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions]
      : never

export type TablesInsert<PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database }> =
  PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][Extract<
        keyof Database[PublicTableNameOrOptions["schema"]]["Tables"],
        string
      >]["Insert"]
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions]["Insert"]
      : never

export type TablesUpdate<PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database }> =
  PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][Extract<
        keyof Database[PublicTableNameOrOptions["schema"]]["Tables"],
        string
      >]["Update"]
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions]["Update"]
      : never

export type Enums<PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database }> =
  PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][Extract<
        keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"],
        string
      >]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
      ? PublicSchema["Enums"][PublicEnumNameOrOptions]
      : never

// Client-side Supabase client
export const createClient = () => createClientComponentClient<Database>()

// Instancia principal de Supabase (para uso en cliente)
export const supabase = createClient()

{/*// Nueva función para crear un cliente Supabase para Server Components
export const createServerSupabaseClientWrapper = () => createServerComponentClient<Database>({ cookies })
*/}
// Exportación por defecto
export default supabase
