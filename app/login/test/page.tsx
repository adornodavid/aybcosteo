export default function TestPage() {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Página de prueba funcionando</h1>
      <p>Si ves esto, la ruta /login/test funciona correctamente</p>
      <a href="/login" style={{ color: "blue", textDecoration: "underline" }}>
        Ir a Login
      </a>
    </div>
  )
}
