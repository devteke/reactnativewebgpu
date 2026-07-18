import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";

const queryClient = new QueryClient();
const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: "#0a0a0f" },
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={screenOptions} />
      </AuthProvider>
    </QueryClientProvider>
  );
}