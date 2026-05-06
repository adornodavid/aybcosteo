// Catálogo único de actividades de bitácora.
// Usar siempre estas constantes (nunca strings literales) para que la columna
// `actividad` sea consistente y agregable en reportes.

export const BITACORA_MODULOS = {
  PLATILLOS: "platillos",
  RECETAS: "recetas",
  MENUS: "menus",
  RESTAURANTES: "restaurantes",
  HOTELES: "hoteles",
  INGREDIENTES: "ingredientes",
  IMPORTAR: "importar",
  CARGAVENTAS: "cargaventas",
  USUARIOS: "usuarios",
} as const

export type BitacoraModulo = (typeof BITACORA_MODULOS)[keyof typeof BITACORA_MODULOS]

export const BITACORA_ACTIVIDADES = {
  // Platillos
  CREAR_PLATILLO: "Crear platillo",
  ACTUALIZAR_PLATILLO: "Actualizar platillo",
  ELIMINAR_PLATILLO: "Eliminar platillo",

  // Recetas / sub-recetas
  CREAR_RECETA: "Crear receta",
  ACTUALIZAR_RECETA: "Actualizar receta",
  ELIMINAR_RECETA: "Eliminar receta",

  // Menús
  CREAR_MENU: "Crear menú",
  ACTUALIZAR_MENU: "Actualizar menú",
  ELIMINAR_MENU: "Eliminar menú",

  // Restaurantes
  CREAR_RESTAURANTE: "Crear restaurante",
  ACTUALIZAR_RESTAURANTE: "Actualizar restaurante",
  ELIMINAR_RESTAURANTE: "Eliminar restaurante",

  // Hoteles
  CREAR_HOTEL: "Crear hotel",
  ACTUALIZAR_HOTEL: "Actualizar hotel",
  ELIMINAR_HOTEL: "Eliminar hotel",

  // Ingredientes / Insumos
  CREAR_INGREDIENTE: "Crear insumo",
  ACTUALIZAR_INGREDIENTE: "Actualizar insumo",
  ELIMINAR_INGREDIENTE: "Eliminar insumo",

  // Importar insumos (flujo de 4 pasos)
  IMPORTAR_INSUMOS_CARGA: "Importar insumos: carga de archivo",
  IMPORTAR_INSUMOS_BUSQUEDA: "Importar insumos: búsqueda por hotel",
  IMPORTAR_INSUMOS_HISTORICO: "Actualizar histórico de ingredientes",
  IMPORTAR_INSUMOS_INGREDIENTES: "Actualizar ingredientes desde conversión",
  IMPORTAR_INSUMOS_RESPALDO: "Respaldar histórico de recetas",
  IMPORTAR_INSUMOS_RECALCULO: "Recalcular costos en cascada",
  IMPORTAR_INSUMOS_REGISTRO: "Registrar insumos nuevos",

  // Carga de ventas
  CARGAVENTAS_ASIGNAR_CODIGO: "Asignar código a platillo",
  CARGAVENTAS_QUITAR_CODIGO: "Quitar código de platillo",
  CARGAVENTAS_ASIGNAR_BULK: "Asignar códigos en lote",

  // Usuarios (administración)
  CREAR_USUARIO: "Crear usuario",
  ACTUALIZAR_USUARIO: "Actualizar usuario",
  ELIMINAR_USUARIO: "Eliminar usuario",
} as const

export type BitacoraActividad = (typeof BITACORA_ACTIVIDADES)[keyof typeof BITACORA_ACTIVIDADES]
