/**
 * Request notification permissions. Call when user enables notifications in Settings or onboarding.
 * Returns true if permission granted, false otherwise.
 * Uses dynamic import to avoid loading expo-notifications (and ExpoPushTokenManager) at app startup,
 * which causes "Cannot find native module ExpoPushTokenManager" when running in Expo Go or before native rebuild.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const Notifications = await import("expo-notifications")
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    if (existingStatus === "granted") return true
    const { status } = await Notifications.requestPermissionsAsync()
    return status === "granted"
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (message.includes("ExpoPushTokenManager") || message.includes("native module")) {
      console.warn("[notifications] Native notifications module not available (e.g. Expo Go). Rebuild the app for full support.")
    }
    return false
  }
}
