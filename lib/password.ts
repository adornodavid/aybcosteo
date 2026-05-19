import bcrypt from "bcryptjs"

const BCRYPT_PREFIXES = ["$2a$", "$2b$", "$2y$"]

export function isBcryptHash(value: string | null | undefined): boolean {
  if (!value) return false
  return BCRYPT_PREFIXES.some((p) => value.startsWith(p)) && value.length === 60
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false
  if (isBcryptHash(stored)) {
    return bcrypt.compare(plain, stored)
  }
  return plain === stored
}
