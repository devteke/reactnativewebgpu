import { Platform } from "react-native"
import * as SecureStore from "expo-secure-store"

// Web'de SecureStore yok; localStorage kullan. Native'de SecureStore.
export const storage = {
  get: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(key) ?? null
    return SecureStore.getItemAsync(key)
  },
  set: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(key, value)
      return
    }
    await SecureStore.setItemAsync(key, value)
  },
  del: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      globalThis.localStorage?.removeItem(key)
      return
    }
    await SecureStore.deleteItemAsync(key)
  },
}