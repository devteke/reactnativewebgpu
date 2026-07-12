import { useMutation, useQuery } from "@tanstack/react-query"
import type { AuthResponse, PublicUser, RegisterInput, LoginInput } from "@app/shared"
import { api } from "./client"
import { useAuthStore } from "../store/authStore"

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => setAuth(data.token, data.user),
  })
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => setAuth(data.token, data.user),
  })
}

export function useMe() {
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)
  return useQuery({
    queryKey: ["me", token],
    enabled: !!token,
    queryFn: async () => {
      const data = await api<{ user: PublicUser }>("/auth/me", { token: token! })
      setUser(data.user)
      return data.user
    },
  })
}