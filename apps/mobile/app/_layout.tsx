import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"

const screenOptions = { headerShown: false }

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={screenOptions} />
    </>
  )
}