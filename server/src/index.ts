import "dotenv/config"
import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { authRoutes } from "./routes/auth"

const app = new Hono()
app.use("/*", cors())
app.get("/", (c) => c.text("🍔 Food API çalışıyor"))
app.route("/auth", authRoutes)

const port = Number(process.env.PORT ?? 4000)
serve({ fetch: app.fetch, port }, () =>
  console.log(`🚀 API http://localhost:${port}`),
)