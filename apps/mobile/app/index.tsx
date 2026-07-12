import { Redirect } from "expo-router"
import { View, ActivityIndicator, StyleSheet } from "react-native"
import { useAuthStore } from "../src/store/authStore"

export default function Index() {
    const token = useAuthStore((s) => s.token)
    const hydrated = useAuthStore((s) => s.hydrated)

    if (!hydrated) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#fff" />
            </View>
        )
    }
    return <Redirect href={token ? "/(app)/home" : "/(auth)/login"} />
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0b0b0f" },
})