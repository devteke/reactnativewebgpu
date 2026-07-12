import { Hono } from "hono"
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

export const authRoutes = new Hono()

authRoutes.post("/register", async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)
  const { email, password, displayName } = parsed.data

  const existing = await db.select().from(users).where(eq(users.email, email))
  if (existing.length) return c.json({ error: "Email zaten kayıtlı" }, 409)

  const passwordHash = await hashPassword(password)
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, displayName })
    .returning()
  return c.json({ token: signToken(user.id), user: toPublic(user) })
})

authRoutes.post("/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)
  const { email, password } = parsed.data

  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return c.json({ error: "Geçersiz email veya şifre" }, 401)
  return c.json({ token: signToken(user.id), user: toPublic(user) })
})

authRoutes.get("/me", async (c) => {
  const auth = c.req.header("authorization")
  if (!auth?.startsWith("Bearer ")) return c.json({ error: "Token yok" }, 401)
  try {
    const { sub } = verifyToken(auth.slice(7))
    const [user] = await db.select().from(users).where(eq(users.id, sub))
    if (!user) return c.json({ error: "Kullanıcı bulunamadı" }, 401)
    return c.json({ user: toPublic(user) })
  } catch {
    return c.json({ error: "Geçersiz token" }, 401)
  }
})