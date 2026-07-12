import { useState } from "react"
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { useLogin } from "../../src/api/auth"
import { GpuButton } from "../../src/components/GpuButton"

export default function Login() {
    const router = useRouter()
    const login = useLogin()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const onSubmit = () => {
        login.mutate(
            { email, password },
            { onSuccess: () => router.replace("/(app)/home") },
        )
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Text style={styles.title}>🍔 Tekrar hoş geldin</Text>
            <Text style={styles.subtitle}>Hesabına giriş yap</Text>
            <TextInput
                style={styles.input}
                placeholder="E-posta"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Şifre"
                placeholderTextColor="#6b7280"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            {login.isError ? (
                <Text style={styles.error}>{(login.error as Error).message}</Text>
            ) : null}
            <GpuButton
                label={login.isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
                onPress={onSubmit}
                disabled={login.isPending}
            />
            <Link href="/(auth)/register" style={styles.link}>
                Hesabın yok mu? Kayıt ol
            </Link>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: "#0b0b0f" },
    title: { fontSize: 28, fontWeight: "800", color: "#fff" },
    subtitle: { fontSize: 15, color: "#9ca3af", marginBottom: 12 },
    input: {
        backgroundColor: "#16161d",
        borderColor: "#26262f",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: "#fff",
        fontSize: 16,
    },
    error: { color: "#f87171", fontSize: 13 },
    link: { color: "#fb923c", textAlign: "center", marginTop: 8, fontSize: 14 },
})