import { Redirect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { GpuButton } from "@/components/GpuButton";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍔</Text>
      <Text style={styles.hi}>Merhaba, {user.displayName}</Text>
      <Text style={styles.sub}>{user.email}</Text>
      <View style={styles.spacer} />
      <GpuButton label="Çıkış Yap" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f", padding: 24, justifyContent: "center", gap: 8 },
  emoji: { fontSize: 48, textAlign: "center" },
  hi: { color: "#ffffff", fontSize: 24, fontWeight: "800", textAlign: "center" },
  sub: { color: "#9a9aa5", fontSize: 14, textAlign: "center" },
  spacer: { height: 24 },
});