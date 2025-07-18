// Tipos para la base de datos generados por Supabase CLI
// Esto asume que tienes un archivo database.types.ts generado por Supabase CLI
// Si no lo tienes, necesitarás generarlo o definir tus tipos de tabla aquí manualmente.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: {
          created_at: string
          id: number
          nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hoteles: {
        Row: {
          activo: boolean
          created_at: string
          direccion: string | null
          email: string | null
          id: number
          nombre: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: number
          nombre: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: number
          nombre?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ingredientes: {
        Row: {
          activo: boolean
          cantidad_por_presentacion: number | null
          categoria_id: number | null
          clave: string
          conversion_a_unidad_base: number | null
          created_at: string
          descripcion: string
          id: number
          imagen_url: string | null
          status_id: number | null
          tipo_id: number | null
          unidad_medida_id: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          cantidad_por_presentacion?: number | null
          categoria_id?: number | null
          clave: string
          conversion_a_unidad_base?: number | null
          created_at?: string
          descripcion: string
          id?: number
          imagen_url?: string | null
          status_id?: number | null
          tipo_id?: number | null
          unidad_medida_id?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          cantidad_por_presentacion?: number | null
          categoria_id?: number | null
          clave?: string
          conversion_a_unidad_base?: number | null
          created_at?: string
          descripcion?: string
          id?: number
          imagen_url?: string | null
          status_id?: number | null
          tipo_id?: number | null
          unidad_medida_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_categoria_id_fkey"
            columns: ["categoria_id"]
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_status_id_fkey"
            columns: ["status_id"]
            referencedRelation: "status_ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_tipo_id_fkey"
            columns: ["tipo_id"]
            referencedRelation: "tipos_ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_unidad_medida_id_fkey"
            columns: ["unidad_medida_id"]
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_platillos: {
        Row: {
          created_at: string
          id: number
          menu_id: number
          platillo_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          menu_id: number
          platillo_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          menu_id?: number
          platillo_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_platillos_menu_id_fkey"
            columns: ["menu_id"]
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_platillos_platillo_id_fkey"
            columns: ["platillo_id"]
            referencedRelation: "platillos"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: number
          nombre: string
          restaurante_id: number
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: number
          nombre: string
          restaurante_id: number
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: number
          nombre?: string
          restaurante_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menus_restaurante_id_fkey"
            columns: ["restaurante_id"]
            referencedRelation: "restaurantes"
            referencedColumns: ["id"]
          },
        ]
      }
      platillos: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: number
          imagen_url: string | null
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: number
          imagen_url?: string | null
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: number
          imagen_url?: string | null
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      platillos_ingredientes: {
        Row: {
          cantidad: number
          created_at: string
          id: number
          ingrediente_id: number
          platillo_id: number
          updated_at: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: number
          ingrediente_id: number
          platillo_id: number
          updated_at?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: number
          ingrediente_id?: number
          platillo_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platillos_ingredientes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platillos_ingredientes_platillo_id_fkey"
            columns: ["platillo_id"]
            referencedRelation: "platillos"
            referencedColumns: ["id"]
          },
        ]
      }
      precios_unitarios: {
        Row: {
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          ingrediente_id: number
          precio: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio: string
          id?: number
          ingrediente_id: number
          precio: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          ingrediente_id?: number
          precio?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "precios_unitarios_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurantes: {
        Row: {
          activo: boolean
          created_at: string
          direccion: string | null
          email: string | null
          hotel_id: number | null
          id: number
          imagen_url: string | null
          nombre: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          email?: string | null
          hotel_id?: number | null
          id?: number
          imagen_url?: string | null
          nombre: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          direccion?: string | null
          email?: string | null
          hotel_id?: number | null
          id?: number
          imagen_url?: string | null
          nombre?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurantes_hotel_id_fkey"
            columns: ["hotel_id"]
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
        ]
      }
      status_ingredientes: {
        Row: {
          created_at: string
          id: number
          nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tipos_ingredientes: {
        Row: {
          created_at: string
          id: number
          nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      unidades_medida: {
        Row: {
          abreviatura: string | null
          created_at: string
          id: number
          nombre: string
          updated_at: string | null
        }
        Insert: {
          abreviatura?: string | null
          created_at?: string
          id?: number
          nombre: string
          updated_at?: string | null
        }
        Update: {
          abreviatura?: string | null
          created_at?: string
          id?: number
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          hotel_id: number | null
          id: string
          nombre: string | null
          rol_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          hotel_id?: number | null
          id: string
          nombre?: string | null
          rol_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          hotel_id?: number | null
          id?: string
          nombre?: string | null
          rol_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_hotel_id_fkey"
            columns: ["hotel_id"]
            referencedRelation: "hoteles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_rol_id_fkey"
            columns: ["rol_id"]
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_filtered_hoteles_by_role: {
        Args: {
          p_rol_id: number
          p_hotel_id: number
        }
        Returns: {
          value: string
          label: string
        }[]
      }
      get_filtered_restaurantes: {
        Args: {
          p_search_term: string
          p_hotel_id: number
          p_restaurante_id: number
          p_offset: number
          p_limit: number
          p_rol_id: number
          p_session_hotel_id: number
        }
        Returns: {
          id: number
          folio: number
          hotel: string
          nombre: string
          direccion: string
          imagen: string
          estatus: boolean
          hotel_id: number
          telefono: string
          email: string
        }[]
      }
      get_filtered_restaurantes_by_role: {
        Args: {
          p_rol_id: number
          p_hotel_id: number
        }
        Returns: {
          value: string
          label: string
        }[]
      }
      get_platillos_by_filter: {
        Args: {
          p_search_term: string
          p_offset: number
          p_limit: number
        }
        Returns: {
          id: number
          nombre: string
          descripcion: string
          imagen_url: string
          costo_total: number
        }[]
      }
      get_platillos_by_filter_v2: {
        Args: {
          p_search_term: string
          p_offset: number
          p_limit: number
        }
        Returns: {
          id: number
          nombre: string
          descripcion: string
          imagen_url: string
          costo_total: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// Custom types for the application
export interface DropdownOption {
  value: string
  label: string
}

export interface Restaurante {
  id: number
  nombre: string
  direccion: string | null
  telefono: string | null
  email: string | null
  hotel_id: number | null
  imagen_url: string | null
  activo: boolean
  created_at: string
  updated_at: string | null
  HotelAsignado?: string // Propiedad para el nombre del hotel en el listado
}

export interface RestauranteTableRow {
  Folio: number
  Hotel: string
  Nombre: string
  Direccion: string | null
  Imagen: string | null
  Estatus: boolean
  id: number // Para uso interno en acciones
  hotel_id: number | null // Para uso interno en formulario de edición
  telefono: string | null
  email: string | null
}

export interface UserSession {
  id: string
  email: string | null
  rol_id: number | null
  hotel_id: number | null
  nombre: string | null
}

// Tipos para las entidades de la aplicación
export type Ingrediente = Database["public"]["Tables"]["ingredientes"]["Row"]
export type Categoria = Database["public"]["Tables"]["categorias"]["Row"]
export type PrecioUnitario = Database["public"]["Tables"]["precios_unitarios"]["Row"]
export type Platillo = Database["public"]["Tables"]["platillos"]["Row"]
export type PlatilloIngrediente = Database["public"]["Tables"]["platillos_ingredientes"]["Row"]
export type MenuRestaurante = Database["public"]["Tables"]["menu_platillos"]["Row"]
export type UnidadMedida = Database["public"]["Tables"]["unidades_medida"]["Row"]
export type Rol = Database["public"]["Tables"]["roles"]["Row"]
export type Usuario = Database["public"]["Tables"]["users"]["Row"]

export interface Permiso {
  id: number
  nombre: string | null
  activo: boolean | null
  created_at: string
}

export interface PermisoPorRol {
  id: number
  rol_id: number | null
  permiso_id: number | null
  activo: boolean | null
  created_at: string
  rol_nombre?: string
  permiso_nombre?: string
}

export interface PlatilloIngredienteDetalle extends PlatilloIngrediente {
  ingrediente_nombre: string
  ingrediente_precio_unitario: number
  ingrediente_unidad_medida: string
  costo_ingrediente: number // Cantidad * Precio Unitario
}

export interface Menu {
  id: number
  nombre: string
  descripcion?: string | null
  restaurante_id: number
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface MenuPlatillo {
  id: number // Asumiendo que platillosxmenu tiene un ID
  menuid: number // Usar 'menuid' según tu BD
  platilloid: number // Usar 'platilloid' según tu BD
  precioventa?: number | null // Usar 'precioventa' según tu BD
  margenutilidad?: number | null // Usar 'margenutilidad' según tu BD
  activo: boolean
  fechacreacion?: string // Usar 'fechacreacion' según tu BD
  // Relación para obtener detalles del platillo
  platillos?: {
    id: number
    nombre: string
    descripcion: string | null
    imgurl: string | null // Usar 'imgurl'
    costototal: number | null // Usar 'costototal'
    activo: boolean
  } | null
}

// Tipos para sesión de usuario
export type Session = {
  user: {
    id: string
    email: string | null
    user_metadata: {
      rol_id: number
      hotel_id: number | null
    }
  }
}

// Tipos para datos de sesión con cookies
export interface DatosSesion {
  UsuarioId: string // UUID de Supabase Auth
  Email: string
  NombreCompleto: string | null
  HotelId: number
  RolId: number
  Permisos: string
  SesionActiva: boolean
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  currentPage: number
  totalPages: number
}

// Tipos para formularios
export interface LoginForm {
  email: string
  password: string
}

export interface HotelFormData {
  nombre: string
  acronimo?: string
  direccion?: string
  telefono?: string
  email?: string
}

export interface RestauranteFormData {
  nombre: string
  direccion?: string
  telefono?: string
  email?: string
  hotel_id: number
}

export interface IngredienteForm {
  clave: string
  descripcion: string
  categoria_id: number
  tipo_id?: number
  unidad_medida_id: number
  cantidad_por_presentacion?: number
  conversion_a_unidad_base?: number
  status_id: number
  activo: boolean
}

export interface PlatilloForm {
  nombre: string
  descripcion?: string
  imagen_url?: string
}

export interface MenuFormData {
  nombre: string
  descripcion?: string
  restaurante_id: number
}

// Tipos para filtros de búsqueda
export interface HotelFilters {
  acronimo?: string
  nombre?: string
}

export interface RestauranteFilters {
  nombre?: string
  hotel_id?: number
}

export interface IngredienteFilters {
  clave?: string
  descripcion?: string
  categoria_id?: number
  status_id?: number
}

export interface PlatilloFilters {
  nombre?: string
  descripcion?: string
}

// Tipos para estadísticas
export interface EstadisticasGenerales {
  totalHoteles: number
  totalRestaurantes: number
  totalIngredientes: number
  totalPlatillos: number
  totalMenus: number
}

export interface EstadisticasRestaurantes {
  totalRestaurantes: number
  restaurantesActivos: number
}

export interface EstadisticasIngredientes {
  totalIngredientes: number
  ingredientesActivos: number
  ingredientesPorCategoria: { categoria: string; total: number }[]
}

export interface EstadisticasPlatillos {
  totalPlatillos: number
  platillosActivos: number
  costoPromedio: number
}

export interface AnalisisCosto {
  platillo_id: number
  nombre_platillo: string
  costo_total: number
  ingredientes: {
    ingrediente_id: number
    nombre_ingrediente: string
    cantidad: number
    precio_unitario: number
    costo_parcial: number
    porcentaje_costo: number
  }[]
}

export interface UsuarioHotel {
  id: number
  usuario_id: number
  hotel_id: number
  created_at: string
  usuario_nombre?: string
  hotel_nombre?: string
}
