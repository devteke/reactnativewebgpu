import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me"

export const hashPassword = (p: string) => bcrypt.hash(p, 10)
export const verifyPassword = (p: string, hash: string) => bcrypt.compare(p, hash)
export const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" })
export const verifyToken = (token: string) =>
  jwt.verify(token, JWT_SECRET) as { sub: string }