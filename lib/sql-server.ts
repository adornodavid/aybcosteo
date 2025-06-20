import sql from "mssql"

// Configuración de conexión a SQL Server
const config: sql.config = {
  server: process.env.SQL_SERVER_HOST || "localhost",
  port: Number.parseInt(process.env.SQL_SERVER_PORT || "1433"),
  database: process.env.SQL_SERVER_DATABASE || "SistemaCosteo",
  user: process.env.SQL_SERVER_USER || "",
  password: process.env.SQL_SERVER_PASSWORD || "",
  options: {
    encrypt: process.env.SQL_SERVER_ENCRYPT === "true", // Para Azure
    trustServerCertificate: process.env.SQL_SERVER_TRUST_CERT === "true", // Para desarrollo local
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

// Pool de conexiones
let pool: sql.ConnectionPool | null = null

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = new sql.ConnectionPool(config)
    await pool.connect()
  }
  return pool
}

// Función para ejecutar queries
export async function executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    const connection = await getConnection()
    const request = connection.request()

    // Agregar parámetros si existen
    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param)
      })
    }

    const result = await request.query(query)
    return result.recordset
  } catch (error) {
    console.error("Error ejecutando query:", error)
    throw error
  }
}

// Función para ejecutar procedimientos almacenados
export async function executeProcedure<T = any>(procedureName: string, params?: Record<string, any>): Promise<T[]> {
  try {
    const connection = await getConnection()
    const request = connection.request()

    // Agregar parámetros si existen
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value)
      })
    }

    const result = await request.execute(procedureName)
    return result.recordset
  } catch (error) {
    console.error("Error ejecutando procedimiento:", error)
    throw error
  }
}

// Cerrar conexión
export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}

// Tipos TypeScript para las tablas
export interface Hotel {
  id: number
  nombre: string
  shortname?: string
  descripcion?: string
  direccion?: string
  telefono?: string
  email?: string
  activo: boolean
  created_at: Date
  updated_at: Date
}

export interface Restaurante {
  id: number
  hotel_id?: number
  nombre: string
  descripcion?: string
  direccion?: string
  telefono?: string
  email?: string
  activo: boolean
  created_at: Date
  updated_at: Date
  hotel?: Hotel
}

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  created_at: Date
  updated_at: Date
}

export interface Ingrediente {
  id: number
  clave: string
  descripcion: string
  categoria_id?: number
  status: string
  tipo?: string
  unidad_medida: string
  cantidad_por_presentacion: number
  conversion?: string
  restaurante_id: number
  created_at: Date
  updated_at: Date
  categoria?: Categoria
  restaurante?: Restaurante
  precio_actual?: PrecioUnitario
}

export interface PrecioUnitario {
  id: number
  ingrediente_id: number
  precio: number
  fecha_inicio: Date
  fecha_fin?: Date
  notas?: string
  created_at: Date
  ingrediente?: Ingrediente
}

export interface Platillo {
  id: number
  nombre: string
  descripcion?: string
  instrucciones?: string
  imagen_url?: string
  costo_total: number
  tiempo_preparacion?: number
  porciones: number
  restaurante_id: number
  activo: boolean
  created_at: Date
  updated_at: Date
  restaurante?: Restaurante
  ingredientes?: PlatilloIngrediente[]
}

export interface PlatilloIngrediente {
  id: number
  platillo_id: number
  ingrediente_id: number
  cantidad: number
  unidad_usada: string
  costo_parcial: number
  created_at: Date
  platillo?: Platillo
  ingrediente?: Ingrediente
}

export interface Menu {
  id: number
  nombre: string
  descripcion?: string
  restaurante_id: number
  imagen_url?: string
  activo: boolean
  created_at: Date
  updated_at: Date
  restaurante?: Restaurante
  platillos?: MenuPlatillo[]
}

export interface MenuPlatillo {
  id: number
  menu_id: number
  platillo_id: number
  precio_venta: number
  disponible: boolean
  created_at: Date
  updated_at: Date
  menu?: Menu
  platillo?: Platillo
}
