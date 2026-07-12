import type { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { registerSchema, loginSchema } from "@app/shared"
import { db } from "../db"
import { users } from "../db/schema"
import { hashPassword, verifyPassword, signToken, verifyToken } from "../auth"

const toPublic = (u: typeof users.$inferSelect) => ({
  id: u.id,
  email: u.email,
  displayName: u.displayName,
  createdAt: u.createdAt.toISOString(),
})

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const { email, password, displayName } = parsed.data

    const existing = await db.select().from(users).where(eq(users.email, email))
    if (existing.length) return reply.code(409).send({ error: "Email zaten kayıtlı" })

    const passwordHash = await hashPassword(password)
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, displayName })
      .returning()
    return reply.send({ token: signToken(user.id), user: toPublic(user) })
  })

  app.post("/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
    const { email, password } = parsed.data

    const [user] = await db.select().from(users).where(eq(users.email, email))
    if (!user || !(await verifyPassword(password, user.passwordHash)))
      return reply.code(401).send({ error: "Geçersiz email veya şifre" })
    return reply.send({ token: signToken(user.id), user: toPublic(user) })
  })

  app.get("/auth/me", async (req, reply) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith("Bearer ")) return reply.code(401).send({ error: "Token yok" })
    try {
      const { sub } = verifyToken(auth.slice(7))
      const [user] = await db.select().from(users).where(eq(users.id, sub))
      if (!user) return reply.code(401).send({ error: "Kullanıcı bulunamadı" })
      return reply.send({ user: toPublic(user) })
    } catch {
      return reply.code(401).send({ error: "Geçersiz token" })
    }
  })
}