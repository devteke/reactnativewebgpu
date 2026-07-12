import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
import { authRoutes } from "./routes/auth"

const app = Fastify({ logger: true })
await app.register(cors, { origin: true })
await app.register(authRoutes)

const port = Number(process.env.PORT ?? 4000)
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => console.log(`🚀 API http://localhost:${port}`))