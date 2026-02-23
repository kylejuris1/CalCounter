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

/**
 * Schedule daily free-trial reminder notifications for the next N days.
 * Returns true if scheduling succeeded, false otherwise.
 */
export async function scheduleFreeTrialReminders(days: number = 3): Promise<boolean> {
  try {
    const granted = await requestNotificationPermission()
    if (!granted) return false

    const Notifications = await import("expo-notifications")
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000

    for (let i = 1; i <= days; i += 1) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "CalCounter Reminder",
          body: "Your free trial is active. Keep tracking today and review your subscription before trial end.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(now + i * dayMs),
        },
      })
    }
    return true
  } catch (e) {
    console.warn("[notifications] Failed to schedule trial reminders", e)
    return false
  }
}
