import { useEffect, useRef, useState } from "react"
import { Animated, Pressable, StyleSheet, Text, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

const GRAD_COLORS = ["#fb5b15", "#f5216b", "#fbbf24"] as const
const GRAD_START = { x: 0, y: 0 }
const GRAD_END = { x: 1, y: 1 }

export default function Index() {
  const [count, setCount] = useState(0)
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: true,
      }),
    )
    anim.start()
    return () => anim.stop()
  }, [shimmer])

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 180],
  })

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍔</Text>
      <Text style={styles.title}>FoodApp</Text>
      <Text style={styles.subtitle}>React Native + Expo web starter çalışıyor 🎉</Text>

      <Pressable
        onPress={() => setCount((c) => c + 1)}
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.9 : 1 }]}
      >
        <LinearGradient
          colors={GRAD_COLORS}
          start={GRAD_START}
          end={GRAD_END}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[styles.shine, { transform: [{ translateX }, { rotate: "18deg" }] }]}
        />
        <Text style={styles.buttonLabel}>Bana dokun • {count}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
    backgroundColor: "#0b0b0f",
  },
  emoji: { fontSize: 64 },
  title: { fontSize: 34, fontWeight: "800", color: "#fff" },
  subtitle: {
    fontSize: 15,
    color: "#9ca3af",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    height: 56,
    minWidth: 220,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  shine: {
    position: "absolute",
    top: -40,
    bottom: -40,
    width: 60,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
})