"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Check, ChevronDown, ChevronRight, ExternalLink } from "lucide-react"

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

interface Endpoint {
  method: HttpMethod
  path: string
  description: string
  params?: { name: string; type: string; required: boolean; description: string }[]
  example?: string
  responseExample?: string
}

interface Resource {
  id: string
  name: string
  description: string
  endpoints: Endpoint[]
}

const API_KEY = "ayb-costeo-api-key-2024"
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://tu-dominio.vercel.app"

const resources: Resource[] = [
  {
    id: "autenticacion",
    name: "Autenticación",
    description: "Todas las peticiones requieren una API Key válida.",
    endpoints: [],
  },
  {
    id: "hoteles",
    name: "Hoteles",
    description: "Consultar hoteles registrados en el sistema.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/hoteles",
        description: "Listar todos los hoteles activos",
        params: [
          { name: "activo", type: "boolean", required: false, description: "Filtrar por estado (true/false)" },
          { name: "search", type: "string", required: false, description: "Buscar por nombre" },
          { name: "limit", type: "number", required: false, description: "Cantidad de resultados (default: 100)" },
          { name: "offset", type: "number", required: false, description: "Desplazamiento para paginación (default: 0)" },
        ],
        example: `curl -X GET "${BASE_URL}/api/v1/hoteles?activo=true" \\
  -H "x-api-key: ${API_KEY}"`,
        responseExample: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Hotel Playa Azul",
      "acronimo": "HPA",
      "direccion": "Av. del Mar 100",
      "activo": true,
      "fechacreacion": "2024-01-01"
    }
  ],
  "meta": { "limit": 100, "offset": 0 }
}`,
      },
    ],
  },
  {
    id: "restaurantes",
    name: "Restaurantes",
    description: "Consultar restaurantes asociados a hoteles.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/restaurantes",
        description: "Listar restaurantes",
        params: [
          { name: "hotelid", type: "number", required: false, description: "Filtrar por ID de hotel" },
          { name: "activo", type: "boolean", required: false, description: "Filtrar por estado" },
          { name: "search", type: "string", required: false, description: "Buscar por nombre" },
          { name: "limit", type: "number", required: false, description: "Cantidad de resultados" },
          { name: "offset", type: "number", required: false, description: "Desplazamiento para paginación" },
        ],
        example: `curl -X GET "${BASE_URL}/api/v1/restaurantes?hotelid=1" \\
  -H "x-api-key: ${API_KEY}"`,
        responseExample: `{
  "success": true,
  "data": [
    {
      "id": 3,
      "nombre": "Restaurante La Terraza",
      "direccion": "Piso 8",
      "activo": true,
      "hotelid": 1,
      "hoteles": { "id": 1, "nombre": "Hotel Playa Azul" }
    }
  ]
}`,
      },
    ],
  },
  {
    id: "ingredientes",
    name: "Ingredientes",
    description: "Consultar ingredientes con precios y categorías.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/ingredientes",
        description: "Listar ingredientes con categoría y unidad de medida",
        params: [
          { name: "hotelid", type: "number", required: false, description: "Filtrar por hotel" },
          { name: "categoriaid", type: "number", required: false, description: "Filtrar por categoría" },
          { name: "activo", type: "boolean", required: false, description: "Filtrar por estado" },
          { name: "search", type: "string", required: false, description: "Buscar por nombre" },
          { name: "limit", type: "number", required: false, description: "Cantidad de resultados" },
          { name: "offset", type: "number", required: false, description: "Desplazamiento" },
        ],
        example: `curl -X GET "${BASE_URL}/api/v1/ingredientes?hotelid=1&search=pollo" \\
  -H "x-api-key: ${API_KEY}"`,
        responseExample: `{
  "success": true,
  "data": [
    {
      "id": 42,
      "nombre": "Pollo entero",
      "codigo": "ING-042",
      "costo": 85.50,
      "conversion": 1,
      "porcentajemerma": 15,
      "activo": true,
      "categoriaingredientes": { "id": 2, "descripcion": "Proteínas" },
      "tipounidadmedida": { "id": 1, "descripcion": "Kilogramo" }
    }
  ]
}`,
      },
      {
        method: "GET",
        path: "/api/v1/ingredientes/:id",
        description: "Obtener ingrediente por ID con detalle completo",
        params: [],
        example: `curl -X GET "${BASE_URL}/api/v1/ingredientes/42" \\
  -H "x-api-key: ${API_KEY}"`,
        responseExample: `{
  "success": true,
  "data": {
    "id": 42,
    "nombre": "Pollo entero",
    "codigo": "ING-042",
    "costo": 85.50,
    "hoteles": { "id": 1, "nombre": "Hotel Playa Azul" },
    ...
  }
}`,
      },
    ],
  },
  {
    id: "platillos",
    name: "Platillos",
    description: "Consultar platillos con costos totales e ingredientes.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/platillos",
        description: "Listar platillos con costo total calculado",
        params: [
          { name: "hotelid", type: "number", required: false, description: "Filtrar por hotel" },
          { name: "activo", type: "boolean", required: false, description: "Filtrar por estado" },
          { name: "search", type: "string", required: false, description: "Buscar por nombre" },
          { name: "limit", type: "number", required: false, description: "Cantidad de resultados" },
          { name: "offset", type: "number", required: false, description: "Desplazamiento" },
        ],
        example: `curl -X GET "${BASE_URL}/api/v1/platillos?hotelid=1&activo=true" \\
  -H "x-api-key: ${API_KEY}"`,
        responseExample: `{
  "success": true,
  "data": [
    {
      "id": 10,
      "nombre": "Filete de res al grill",
      "costototal": 145.80,
      "tipofamilia": "Carnes",
      "activo": true,
      "hoteles": { "id": 1, "nombre": "Hotel Playa Azul" }
    }
  ]
}`,
      },
      {
        method: "GET",
        path: "/api/v1/platillos/:id",
        description: "Obtener platillo con todos sus ingredientes y recetas incluidas",
        params: [],
        example: `curl -X GET "${BASE_URL}/api/v1/platillos/10" \\
  -H "x-api-key: ${API_KEY}"`,
        responseExample: `{
  "success": true,
  "data": {
    "id": 10,
    "nombre": "Filete de res al grill",
    "costototal": 145.80,
    "ingredientes": [
      {
        "cantidad": 0.3,
        "ingredientecostoparcial": 25.65,
        "ingredientes": { "nombre": "Pollo entero", "costo": 85.50 }
      }
    ],
    "recetas": [...]
  }
}`,
      },
    ],
  },
  {
    id: "recetas",
    name: "Recetas",
    description: "Consultar sub-recetas registradas en el sistema.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/recetas",
        description: "Listar recetas",
        params: [
          { name: "hotelid", type: "number", required: false, description: "Filtrar por hotel" },
          { name: "activo", type: "boolean", required: false, description: "Filtrar por estado" },
          { name: "search", type: "string", required: false, description: "Buscar por nombre" },
          { name: "limit", type: "number", required: false, description: "Cantidad de resultados" },
          { name: "offset", type: "number", required: false, description: "Desplazamiento" },
        ],
        example: `curl -X GET "${BASE_URL}/api/v1/recetas?hotelid=1" \\
  -H "x-api-key: ${API_KEY}"`,
        responseExample: `{
  "success": true,
  "data": [
    {
      "id": 5,
      "nombre": "Salsa de tomate base",
      "costo": 12.30,
      "cantidad": 1,
      "activo": true
    }
  ]
}`,
      },
    ],
  },
  {
    id: "menus",
    name: "Menus",
    description: "Consultar menús con platillos, precios de venta y márgenes.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/menus",
        description: "Listar menús por restaurante",
        params: [
          { name: "restauranteid", type: "number", required: false, description: "Filtrar por restaurante" },
          { name: "activo", type: "boolean", required: false, description: "Filtrar por estado" },
          { name: "search", type: "string", required: false, description: "Buscar por nombre" },
          { name: "limit", type: "number", required: false, description: "Cantidad de resultados" },
          { name: "offset", type: "number", required: false, description: "Desplazamiento" },
        ],
        example: `curl -X GET "${BASE_URL}/api/v1/menus?restauranteid=3" \\
  -H "x-api-key: ${API_KEY}"`,
        responseExample: `{
  "success": true,
  "data": [
    {
      "id": 7,
      "nombre": "Menú Verano 2024",
      "activo": true,
      "restaurantes": { "id": 3, "nombre": "La Terraza" }
    }
  ]
}`,
      },
      {
        method: "GET",
        path: "/api/v1/menus/:id",
        description: "Obtener menú completo con platillos, precios de venta, IVA y márgenes",
        params: [],
        example: `curl -X GET "${BASE_URL}/api/v1/menus/7" \\
  -H "x-api-key: ${API_KEY}"`,
        responseExample: `{
  "success": true,
  "data": {
    "id": 7,
    "nombre": "Menú Verano 2024",
    "platillos": [
      {
        "precioventa": 350.00,
        "precioconiva": 406.00,
        "margenutilidad": 58,
        "platillos": { "nombre": "Filete de res al grill", "costototal": 145.80 }
      }
    ],
    "resumen": {
      "total_platillos": 12,
      "costo_total_menu": 1250.60,
      "precio_venta_total": 3800.00
    }
  }
}`,
      },
    ],
  },
]

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="p-1.5 rounded hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800/50 transition-colors"
      >
        <span className={`text-xs font-bold px-2 py-1 rounded border font-mono ${methodColors[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm text-slate-200 font-mono flex-1">{endpoint.path}</code>
        <span className="text-slate-400 text-sm hidden md:block">{endpoint.description}</span>
        {open ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-700/50 p-4 space-y-4 bg-slate-900/30">
          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Parámetros</h4>
              <div className="space-y-1">
                {endpoint.params.map((p) => (
                  <div key={p.name} className="flex items-start gap-3 text-sm py-2 border-b border-slate-800">
                    <code className="text-emerald-400 font-mono text-xs w-28 shrink-0">{p.name}</code>
                    <span className="text-slate-500 text-xs w-16 shrink-0">{p.type}</span>
                    {p.required ? (
                      <span className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">requerido</span>
                    ) : (
                      <span className="text-xs text-slate-500 shrink-0">opcional</span>
                    )}
                    <span className="text-slate-400">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.example && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Ejemplo de petición</h4>
              <div className="bg-slate-950 rounded-lg border border-slate-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
                  <span className="text-xs text-slate-500">cURL</span>
                  <CopyButton text={endpoint.example} />
                </div>
                <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">{endpoint.example}</pre>
              </div>
            </div>
          )}

          {endpoint.responseExample && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Ejemplo de respuesta</h4>
              <div className="bg-slate-950 rounded-lg border border-slate-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
                  <span className="text-xs text-slate-500">JSON</span>
                  <CopyButton text={endpoint.responseExample} />
                </div>
                <pre className="p-4 text-xs text-emerald-300/80 overflow-x-auto font-mono leading-relaxed">{endpoint.responseExample}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("autenticacion")
  const [copied, setCopied] = useState(false)

  const copyApiKey = () => {
    navigator.clipboard.writeText(API_KEY)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center">
              <span className="text-xs font-bold text-white">AyB</span>
            </div>
            <span className="font-semibold text-white text-sm">AyB Costeo</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 text-sm">API Reference</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden md:block">v1.0.0</span>
            <a
              href="/api/v1"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded transition-colors"
            >
              <ExternalLink size={12} />
              API Explorer
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="sticky top-14 p-4 space-y-1">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-2 py-1 mb-3">Recursos</p>
            {resources.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setActiveSection(r.id)
                  document.getElementById(r.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeSection === r.id
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6 md:p-8 space-y-12">
          {/* Hero */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 text-balance">API Reference</h1>
            <p className="text-slate-400 text-base leading-relaxed">
              La API de AyB Costeo te permite acceder a toda la información de ingredientes, platillos, recetas y menús desde cualquier sistema externo mediante peticiones HTTP estándar.
            </p>
          </div>

          {/* Auth section */}
          <section id="autenticacion">
            <h2 className="text-xl font-semibold text-white mb-1">Autenticación</h2>
            <p className="text-slate-400 text-sm mb-4">
              Todas las peticiones deben incluir una API Key válida. Puedes enviarla de dos formas:
            </p>

            <div className="grid gap-3 md:grid-cols-2 mb-6">
              <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1 font-medium">Opción 1: Header personalizado</p>
                <code className="text-sm text-emerald-300 font-mono">x-api-key: {"<tu-api-key>"}</code>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1 font-medium">Opción 2: Bearer Token</p>
                <code className="text-sm text-emerald-300 font-mono">Authorization: Bearer {"<tu-api-key>"}</code>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Tu API Key</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyApiKey}
                  className="h-7 px-2 text-slate-400 hover:text-white"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span className="ml-1 text-xs">{copied ? "Copiado" : "Copiar"}</span>
                </Button>
              </div>
              <code className="text-base text-emerald-400 font-mono tracking-wide">{API_KEY}</code>
              <p className="text-xs text-slate-600 mt-2">
                Para producción, configura la variable de entorno <code className="text-slate-400">API_SECRET_KEY</code> en tu proyecto de Vercel.
              </p>
            </div>

            <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
              <p className="text-xs text-amber-400 font-medium mb-1">Respuestas de error de autenticación</p>
              <div className="space-y-1 text-xs text-slate-400">
                <div><code className="text-amber-300">401</code> — No se envió ninguna API Key</div>
                <div><code className="text-amber-300">403</code> — La API Key es inválida</div>
              </div>
            </div>
          </section>

          {/* Formato de respuesta */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-1">Formato de respuesta</h2>
            <p className="text-slate-400 text-sm mb-4">Todas las respuestas siguen el mismo formato JSON.</p>
            <div className="bg-slate-950 rounded-lg border border-slate-700/50 overflow-hidden">
              <pre className="p-4 text-xs text-emerald-300/80 font-mono leading-relaxed overflow-x-auto">{`// Respuesta exitosa
{
  "success": true,
  "data": [...],          // array o objeto con los datos
  "meta": {               // solo en listados
    "limit": 100,
    "offset": 0
  }
}

// Respuesta de error
{
  "success": false,
  "error": "Descripción del error"
}`}</pre>
            </div>
          </section>

          {/* Endpoints por recurso */}
          {resources.filter((r) => r.endpoints.length > 0).map((resource) => (
            <section key={resource.id} id={resource.id}>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-semibold text-white">{resource.name}</h2>
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                  {resource.endpoints.length} endpoint{resource.endpoints.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <p className="text-slate-400 text-sm mb-4">{resource.description}</p>
              {resource.endpoints.map((endpoint, i) => (
                <EndpointCard key={i} endpoint={endpoint} />
              ))}
            </section>
          ))}

          {/* Ejemplo de conexión desde otros sistemas */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-1">Ejemplos de integración</h2>
            <p className="text-slate-400 text-sm mb-4">Cómo conectarte desde otros lenguajes o sistemas.</p>

            <div className="space-y-4">
              {[
                {
                  lang: "JavaScript / Node.js",
                  code: `const response = await fetch('${BASE_URL}/api/v1/menus/7', {
  headers: {
    'x-api-key': '${API_KEY}'
  }
});
const { data } = await response.json();
console.log(data.platillos);`,
                },
                {
                  lang: "Python",
                  code: `import requests

headers = {'x-api-key': '${API_KEY}'}
response = requests.get(
    '${BASE_URL}/api/v1/platillos?hotelid=1',
    headers=headers
)
data = response.json()
print(data['data'])`,
                },
                {
                  lang: "PHP",
                  code: `$ch = curl_init('${BASE_URL}/api/v1/hoteles');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: ${API_KEY}'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = json_decode(curl_exec($ch), true);
print_r($response['data']);`,
                },
              ].map(({ lang, code }) => (
                <div key={lang} className="bg-slate-950 rounded-lg border border-slate-700/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50 bg-slate-900/50">
                    <span className="text-xs text-slate-400 font-medium">{lang}</span>
                    <CopyButton text={code} />
                  </div>
                  <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">{code}</pre>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
