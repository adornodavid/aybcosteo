import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { UserSession } from "@/lib/types-sistema-costeo"

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

if (!secretKey) {
  // Este error se lanzará si SESSION_SECRET no está definida.
  // Es crucial que esta variable esté configurada.
  throw new Error("SESSION_SECRET environment variable is not set.")
}

const SESSION_NAME = "session"

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20 days from now") // Duración de 20 días
    .sign(encodedKey)
}

export async function decrypt(session: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload
  } catch (error) {
    console.error("Failed to verify session:", error)
    return null
  }
}

export async function createSession(sessionData: UserSession) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 20) // 20 days
  const session = await encrypt(sessionData)

  cookies().set(SESSION_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  })
}

export async function deleteSession() {
  cookies().delete(SESSION_NAME)
}

export async function getSession(): Promise<UserSession | null> {
  const session = cookies().get(SESSION_NAME)?.value
  if (!session) return null
  return decrypt(session) as Promise<UserSession | null>
}
