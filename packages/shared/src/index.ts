import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "En az 8 karakter"),
  displayName: z.string().min(2).max(50),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

export type PublicUser = {
  id: string
  email: string
  displayName: string
  createdAt: string
}

export type AuthResponse = { token: string; user: PublicUser }