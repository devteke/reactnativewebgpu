import { create } from "zustand"
import type { PublicUser } from "@app/shared"
import { storage } from "./secureStorage"

const TOKEN_KEY = "auth_token"

type AuthState = {
  token: string | null
  user: PublicUser | null
  hydrated: boolean
  setAuth: (token: string, user: PublicUser) => Promise<void>
  setUser: (user: PublicUser) => void
  signOut: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  setAuth: async (token, user) => {
    await storage.set(TOKEN_KEY, token)
    set({ token, user })
  },
  setUser: (user) => set({ user }),
  signOut: async () => {
    await storage.del(TOKEN_KEY)
    set({ token: null, user: null })
  },
  hydrate: async () => {
    const token = await storage.get(TOKEN_KEY)
    set({ token: token ?? null, hydrated: true })
  },
}))