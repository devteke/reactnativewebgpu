import { useEffect } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { queryClient } from "../src/api/queryClient"
import { useAuthStore } from "../src/store/authStore"

const screenOptions = { headerShown: false }

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate)
  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={screenOptions} />
    </QueryClientProvider>
  )
}