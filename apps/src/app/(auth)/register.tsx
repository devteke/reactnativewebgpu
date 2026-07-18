import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { registerSchema } from "@/lib/schemas";
import { useAuth } from "@/lib/auth";
import { GpuButton } from "@/components/GpuButton";

export default function RegisterScreen() {
  const { setSession } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: api.register,
    onSuccess: (res) => {
      setSession(res);
      router.replace("/");
    },
  });

  const onSubmit = () => {
    setFormError(null);
    const parsed = registerSchema.safeParse({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
      return;
    }
    mutation.mutate(parsed.data);
  };

  const error =
    formError ?? (mutation.error instanceof Error ? mutation.error.message : null);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍕</Text>
      <Text style={styles.title}>Hesap oluştur</Text>

      <TextInput style={styles.input} placeholder="Ad" placeholderTextColor="#6b6b76" value={displayName} onChangeText={setDisplayName} />
      <TextInput style={styles.input} placeholder="E-posta" placeholderTextColor="#6b6b76" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Şifre (en az 8 karakter)" placeholderTextColor="#6b6b76" secureTextEntry value={password} onChangeText={setPassword} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <GpuButton
        label={mutation.isPending ? "Oluşturuluyor..." : "Kayıt Ol"}
        onPress={onSubmit}
        disabled={mutation.isPending}
      />

      <Link href="/login" style={styles.link}>Zaten hesabın var mı? Giriş yap</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f", padding: 24, justifyContent: "center", gap: 14 },
  emoji: { fontSize: 44, textAlign: "center" },
  title: { color: "#ffffff", fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  input: {
    backgroundColor: "#16161d",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#ffffff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#26262f",
  },
  error: { color: "#ff6b6b", fontSize: 13, textAlign: "center" },
  link: { color: "#fbbf24", textAlign: "center", marginTop: 8, fontWeight: "600" },
});