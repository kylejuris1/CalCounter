import { useState } from "react"
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Alert } from "react-native"
import { useGoals } from "../hooks/useGoals"
import { useTheme } from "../hooks/useTheme"
import { useSupabaseAuth } from "../hooks/useSupabaseAuth"
import { useOnboarding } from "../hooks/useOnboarding"
import { linkGuest, ensureAppUser, deleteAccount } from "../services/api"
import { supabase } from "../services/supabase"
import { requestNotificationPermission } from "../services/notifications"
import GoalEditorModal from "./goal-editor-modal"
import OtpModal from "./otp-modal"

interface SettingsProps {
  revenueCat: ReturnType<typeof import("../hooks/useRevenueCat").useRevenueCat>
  resetOnboarding?: () => Promise<void>
  onClearLocalData?: () => Promise<void>
}

export default function Settings({ revenueCat, resetOnboarding, onClearLocalData }: SettingsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const { darkMode: darkModeEnabled, setDarkMode: setDarkModeEnabled } = useTheme()
  const { goals, updateCalorieGoal, updateMacroGoals } = useGoals()
  const { user, loading: authLoading, isAuthenticated, sendOtp, verifyOtp, signOut } = useSupabaseAuth()
  const { guestId, clearGuestId } = useOnboarding()
  const [calorieModalVisible, setCalorieModalVisible] = useState(false)
  const [macroModalVisible, setMacroModalVisible] = useState(false)
  const [signInModalVisible, setSignInModalVisible] = useState(false)
  const [clearDataModalVisible, setClearDataModalVisible] = useState(false)

  const isLight = !darkModeEnabled
  const theme = isLight ? lightTheme : darkTheme

  const handleVerifySignIn = async (email: string, otpCode: string) => {
    await verifyOtp(email, otpCode)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (token) {
      if (guestId) {
        await linkGuest(guestId, token)
        await clearGuestId()
        Alert.alert("Success", "Your account is linked. Your data will sync across devices.")
      } else {
        await ensureAppUser(token)
        Alert.alert("Success", "You are now signed in.")
      }
    } else {
      Alert.alert("Success", "You are now signed in.")
    }
  }

  const handleVerifyClearData = async (email: string, otpCode: string) => {
    await verifyOtp(email, otpCode)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      throw new Error("Session not found after verification.")
    }
    await deleteAccount(token)
    await onClearLocalData?.()
    await resetOnboarding?.()
    await signOut()
    Alert.alert("Account deleted", "Your account data has been removed.")
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      Alert.alert("Signed out", "You have been signed out.")
    } catch (error) {
      Alert.alert("Sign out failed", error instanceof Error ? error.message : "Unable to sign out.")
    }
  }

  const handleClearAllDataPress = () => {
    Alert.alert(
      "Clear all data",
      "Enter your email and verify with OTP. Your account data will be permanently deleted from our servers and local data will be cleared.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: () => setClearDataModalVisible(true) },
      ]
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

      {/* Account: Sign in when not authenticated, or current user + Sign Out when signed in */}
      {authLoading ? (
        <View style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Account</Text>
          <Text style={[styles.settingValue, { color: theme.muted }]}>Checking...</Text>
        </View>
      ) : !isAuthenticated ? (
        <Pressable
          style={[styles.signInButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => setSignInModalVisible(true)}
        >
          <Text style={[styles.signInButtonText, { color: theme.text }]}>Sign in</Text>
        </Pressable>
      ) : (
        <>
          <View style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Signed in as</Text>
            <Text style={[styles.settingValue, { color: theme.muted }]} numberOfLines={1}>
              {user?.email ?? "Unknown"}
            </Text>
          </View>
          <Pressable
            style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={handleSignOut}
          >
            <Text style={[styles.settingLabel, { color: theme.text }]}>Sign Out</Text>
            <Text style={[styles.settingValue, { color: theme.muted }]}>→</Text>
          </Pressable>
        </>
      )}

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text>
        <Pressable
          style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => setCalorieModalVisible(true)}
        >
          <Text style={[styles.settingLabel, { color: theme.text }]}>Daily Calorie Goal</Text>
          <Text style={[styles.settingValue, { color: theme.muted }]}>{goals.calorieGoal} kcal</Text>
        </Pressable>
        <Pressable
          style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => setMacroModalVisible(true)}
        >
          <Text style={[styles.settingLabel, { color: theme.text }]}>Macro Targets</Text>
          <Text style={[styles.settingValue, { color: theme.muted }]}>
            P: {goals.proteinGoal}g | C: {goals.carbsGoal}g | F: {goals.fatGoal}g
          </Text>
        </Pressable>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
        <View style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={async (value) => {
              setNotificationsEnabled(value)
              if (value) {
                const granted = await requestNotificationPermission()
                if (!granted) {
                  setNotificationsEnabled(false)
                  Alert.alert(
                    "Notifications",
                    "Permission was denied. You can enable it later in your device settings."
                  )
                }
              }
            }}
            trackColor={{ false: "#374151", true: "#f97316" }}
            thumbColor="#ffffff"
          />
        </View>
        <View style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: "#374151", true: "#f97316" }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Data</Text>
        <Pressable
          style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={handleClearAllDataPress}
        >
          <Text style={[styles.settingLabel, { color: theme.text }]}>Clear All Data</Text>
          <Text style={[styles.settingValue, styles.dangerText]}>→</Text>
        </Pressable>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
        <View style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Version</Text>
          <Text style={[styles.settingValue, { color: theme.muted }]}>1.0.0</Text>
        </View>
        <Pressable style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Privacy Policy</Text>
          <Text style={[styles.settingValue, { color: theme.muted }]}>→</Text>
        </Pressable>
        <Pressable style={[styles.settingItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Terms of Service</Text>
          <Text style={[styles.settingValue, { color: theme.muted }]}>→</Text>
        </Pressable>
      </View>

      <GoalEditorModal
        visible={calorieModalVisible}
        onClose={() => setCalorieModalVisible(false)}
        type="calorie"
        currentGoals={goals}
        onSave={async (values) => {
          await updateCalorieGoal(values.calorieGoal)
        }}
        light={isLight}
      />
      <GoalEditorModal
        visible={macroModalVisible}
        onClose={() => setMacroModalVisible(false)}
        type="macro"
        currentGoals={goals}
        onSave={async (values) => {
          await updateMacroGoals(values.proteinGoal, values.carbsGoal, values.fatGoal)
        }}
        light={isLight}
      />

      <OtpModal
        visible={signInModalVisible}
        onClose={() => setSignInModalVisible(false)}
        mode="signin"
        onSendOtp={sendOtp}
        onVerify={handleVerifySignIn}
        light={isLight}
      />
      <OtpModal
        visible={clearDataModalVisible}
        onClose={() => setClearDataModalVisible(false)}
        mode="delete"
        onSendOtp={sendOtp}
        onVerify={handleVerifyClearData}
        light={isLight}
      />
    </ScrollView>
  )
}

const lightTheme = {
  bg: "#f9fafb",
  text: "#111827",
  muted: "#6b7280",
  cardBg: "#ffffff",
  border: "#e5e7eb",
}

const darkTheme = {
  bg: "#000000",
  text: "#ffffff",
  muted: "#9ca3af",
  cardBg: "#111827",
  border: "#374151",
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  signInButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
  },
  dangerText: {
    color: "#ef4444",
  },
})
