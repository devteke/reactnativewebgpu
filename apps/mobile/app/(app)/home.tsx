import { View, Text, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { useMe } from "../../src/api/auth"
import { useAuthStore } from "../../src/store/authStore"
import { GpuButton } from "../../src/components/GpuButton"

export default function Home() {
  const router = useRouter()
  const { data: user } = useMe()
  const storeUser = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const current = user ?? storeUser

  const onSignOut = async () => {
    await signOut()
    router.replace("/(auth)/login")
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hello}>Merhaba, {current?.displayName ?? "..."} 👋</Text>
      <Text style={styles.sub}>{current?.email}</Text>
      <View style={styles.spacer} />
      <GpuButton label="Çıkış Yap" onPress={onSignOut} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 8, backgroundColor: "#0b0b0f" },
  hello: { fontSize: 26, fontWeight: "800", color: "#fff" },
  sub: { fontSize: 15, color: "#9ca3af" },
  spacer: { height: 24 },
})