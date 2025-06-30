"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { procesarInicioSesionMejorado } from "@/app/actions/login-actions-mejorado"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  // Obtener fecha actual
  const currentDate = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Función validateLogin como especificaste
  const validateLogin = async () => {
    const txtCorreo = document.getElementById("txtCorreo") as HTMLInputElement
    const txtPassword = document.getElementById("txtPassword") as HTMLInputElement

    // Validación 1: Verificar si el correo está vacío
    if (!txtCorreo.value.trim()) {
      alert("Por favor introduce tu Correo de acceso")
      txtCorreo.focus()
      return
    }

    // Validación 2: Verificar si la contraseña está vacía o tiene menos de 4 caracteres
    if (!txtPassword.value || txtPassword.value.length < 4) {
      alert("Por favor introduce tu password correctamente.")
      txtPassword.focus()
      return
    }

    // Si pasa las validaciones, proceder con el backend
    setLoading(true)
    try {
      const result = await procesarInicioSesionMejorado(txtCorreo.value, txtPassword.value)

      if (result.success) {
        setModalMessage(result.message)
        setIsSuccess(true)
        setShowModal(true)

        // Redirigir al dashboard después de mostrar el modal
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      } else {
        setModalMessage(result.message)
        setIsSuccess(false)
        setShowModal(true)
      }
    } catch (error) {
      setModalMessage("Error de conexión. Intente nuevamente.")
      setIsSuccess(false)
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleLimpiar = () => {
    const form = document.getElementById("frmLogin") as HTMLFormElement
    if (form) {
      form.reset()
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: "relative",
      }}
    >
      {/* Patrón de fondo decorativo */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.3,
        }}
      />

      {/* 1. Logo de aplicación */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: "480px" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 25px",
                color: "white",
                fontSize: "48px",
                fontWeight: "bold",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                border: "4px solid rgba(255,255,255,0.2)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-2px",
                  left: "-2px",
                  right: "-2px",
                  bottom: "-2px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  zIndex: -1,
                }}
              />
              SC
            </div>
            <h1
              style={{
                fontSize: "48px",
                fontWeight: "700",
                margin: "0 0 12px",
                color: "white",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                letterSpacing: "-1px",
              }}
            >
              Sistema de Costeo
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "20px",
                margin: 0,
                fontWeight: "300",
              }}
            >
              Gestión Hotelera y Restaurantes
            </p>
          </div>

          {/* 2. Sección de formulario */}
          <div
            style={{
              backgroundColor: "white",
              padding: "60px 50px",
              borderRadius: "20px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              position: "relative",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h2
                style={{
                  fontSize: "32px",
                  fontWeight: "600",
                  margin: "0 0 12px",
                  color: "#2d3748",
                  letterSpacing: "-0.5px",
                }}
              >
                Iniciar Sesión
              </h2>
              <p
                style={{
                  color: "#718096",
                  fontSize: "16px",
                  margin: 0,
                  fontWeight: "400",
                }}
              >
                Ingrese sus credenciales de acceso
              </p>
            </div>

            <form id="frmLogin" name="frmLogin">
              {/* Input Correo */}
              <div style={{ marginBottom: "30px" }}>
                <label
                  htmlFor="txtCorreo"
                  style={{
                    display: "block",
                    marginBottom: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#2d3748",
                  }}
                >
                  Correo Electrónico
                </label>
                <input
                  type="text"
                  id="txtCorreo"
                  name="txtCorreo"
                  maxLength={50}
                  style={{
                    width: "100%",
                    padding: "18px 20px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    transition: "all 0.3s ease",
                    outline: "none",
                    backgroundColor: "#f7fafc",
                    fontFamily: "inherit",
                  }}
                  placeholder="ejemplo@correo.com"
                  disabled={loading}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#667eea"
                    e.target.style.backgroundColor = "white"
                    e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0"
                    e.target.style.backgroundColor = "#f7fafc"
                    e.target.style.boxShadow = "none"
                  }}
                />
              </div>

              {/* Input Contraseña */}
              <div style={{ marginBottom: "30px" }}>
                <label
                  htmlFor="txtPassword"
                  style={{
                    display: "block",
                    marginBottom: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#2d3748",
                  }}
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  id="txtPassword"
                  name="txtPassword"
                  maxLength={150}
                  style={{
                    width: "100%",
                    padding: "18px 20px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    transition: "all 0.3s ease",
                    outline: "none",
                    backgroundColor: "#f7fafc",
                    fontFamily: "inherit",
                  }}
                  placeholder="Ingrese su contraseña"
                  disabled={loading}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#667eea"
                    e.target.style.backgroundColor = "white"
                    e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0"
                    e.target.style.backgroundColor = "#f7fafc"
                    e.target.style.boxShadow = "none"
                  }}
                />
              </div>

              {/* Botón Validar */}
              <div style={{ marginBottom: "20px", position: "relative" }}>
                <input
                  type="button"
                  id="btnValidar"
                  name="btnValidar"
                  value={loading ? "VALIDANDO..." : "VALIDAR"}
                  disabled={loading}
                  onClick={validateLogin}
                  style={{
                    width: "100%",
                    padding: "18px 60px 18px 20px",
                    background: loading
                      ? "linear-gradient(135deg, #a0aec0 0%, #718096 100%)"
                      : "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    boxShadow: loading ? "none" : "0 10px 20px rgba(26, 32, 44, 0.3)",
                    transform: loading ? "none" : "translateY(0)",
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "linear-gradient(135deg, #2d3748 0%, #4a5568 100%)"
                      e.currentTarget.style.transform = "translateY(-2px)"
                      e.currentTarget.style.boxShadow = "0 15px 30px rgba(26, 32, 44, 0.4)"
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)"
                      e.currentTarget.style.transform = "translateY(0)"
                      e.currentTarget.style.boxShadow = "0 10px 20px rgba(26, 32, 44, 0.3)"
                    }
                  }}
                />
                {!loading && (
                  <Send
                    size={20}
                    style={{
                      position: "absolute",
                      right: "30px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "white",
                    }}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleLimpiar}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  backgroundColor: "white",
                  color: "#718096",
                  border: "2px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = "#f7fafc"
                    e.currentTarget.style.borderColor = "#cbd5e0"
                    e.currentTarget.style.color = "#4a5568"
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = "white"
                    e.currentTarget.style.borderColor = "#e2e8f0"
                    e.currentTarget.style.color = "#718096"
                  }
                }}
              >
                Limpiar
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Pie de página con fecha y ubicación actual */}
      <footer
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(255,255,255,0.2)",
          padding: "35px 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "40px",
              marginBottom: "18px",
              fontSize: "16px",
              color: "#4a5568",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 16px",
                backgroundColor: "rgba(102, 126, 234, 0.1)",
                borderRadius: "20px",
              }}
            >
              <span style={{ fontSize: "20px" }}>📅</span>
              <span style={{ fontWeight: "500" }}>{currentDate}</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 16px",
                backgroundColor: "rgba(118, 75, 162, 0.1)",
                borderRadius: "20px",
              }}
            >
              <span style={{ fontSize: "20px" }}>📍</span>
              <span style={{ fontWeight: "500" }}>México</span>
            </div>
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#718096",
              fontWeight: "400",
            }}
          >
            © 2024 Sistema de Costeo - Gestión Hotelera. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* Modal para mostrar mensajes */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "20px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
              }}
            >
              {isSuccess ? "✅" : "❌"}
            </div>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "20px",
                color: "#2d3748",
              }}
            >
              {isSuccess ? "¡Éxito!" : "Error"}
            </h3>
            <p
              style={{
                fontSize: "16px",
                color: "#4a5568",
                marginBottom: "30px",
                lineHeight: "1.5",
              }}
            >
              {modalMessage}
            </p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: "12px 24px",
                backgroundColor: isSuccess ? "#48bb78" : "#f56565",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.9"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1"
              }}
            >
              Cerrar
            </button>
            {isSuccess && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#718096",
                  marginTop: "15px",
                  margin: "15px 0 0 0",
                }}
              >
                Redirigiendo al dashboard en 3 segundos...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
