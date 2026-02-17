import { useState } from "react"
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Alert, TextInput } from "react-native"
import { useGoals } from "../hooks/useGoals"
import { PAYWALL_RESULT } from "react-native-purchases-ui"
import { REVENUECAT_CREDITS_PRODUCT_IDS, REVENUECAT_PRODUCTS } from "../services/revenuecat"
import { useRevenueCat } from "../hooks/useRevenueCat"
import { useSupabaseAuth } from "../hooks/useSupabaseAuth"
import GoalEditorModal from "./goal-editor-modal"

interface SettingsProps {
  revenueCat: ReturnType<typeof useRevenueCat>
}

export default function Settings({ revenueCat }: SettingsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkModeEnabled, setDarkModeEnabled] = useState(true)
  const { goals, updateCalorieGoal, updateMacroGoals } = useGoals()
  const { user, loading: authLoading, isAuthenticated, sendOtp, verifyOtp, signOut } = useSupabaseAuth()
  const [calorieModalVisible, setCalorieModalVisible] = useState(false)
  const [macroModalVisible, setMacroModalVisible] = useState(false)
  const [activePurchase, setActivePurchase] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [authActionLoading, setAuthActionLoading] = useState(false)

  const handleShowPaywall = async () => {
    try {
      const result = await revenueCat.showPaywall()

      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        Alert.alert("Success", "Purchase completed successfully.")
        return
      }

      if (result === PAYWALL_RESULT.CANCELLED) {
        Alert.alert("Purchase cancelled", "You can try again anytime.")
        return
      }

      Alert.alert("Paywall closed", "No purchase was completed.")
    } catch (error) {
      Alert.alert("Paywall error", error instanceof Error ? error.message : "Unable to open paywall.")
    }
  }

  const handleRestore = async () => {
    try {
      const info = await revenueCat.restore()
      const restoredCreditsPurchases = info.nonSubscriptionTransactions.filter(
        (transaction) => REVENUECAT_CREDITS_PRODUCT_IDS.includes(transaction.productIdentifier as typeof REVENUECAT_CREDITS_PRODUCT_IDS[number])
      )

      if (restoredCreditsPurchases.length > 0) {
        Alert.alert("Restored", `Found ${restoredCreditsPurchases.length} credits purchase(s).`)
      } else {
        Alert.alert("No purchases found", "No credits purchases were restored for this account.")
      }
    } catch (error) {
      Alert.alert("Restore failed", error instanceof Error ? error.message : "Unable to restore purchases.")
    }
  }

  const handleOpenCustomerCenter = async () => {
    try {
      await revenueCat.openSubscriptionCenter()
    } catch (error) {
      Alert.alert(
        "Customer Center error",
        error instanceof Error ? error.message : "Unable to open Customer Center."
      )
    }
  }

  const handleDirectPurchase = async (productId: keyof typeof REVENUECAT_PRODUCTS) => {
    setActivePurchase(productId)
    try {
      const result = await revenueCat.purchaseByProductId(REVENUECAT_PRODUCTS[productId])
      if (result.userCancelled) {
        Alert.alert("Purchase cancelled", "No charges were made.")
        return
      }

      Alert.alert("Purchase successful", "500 credits purchased successfully.")
    } catch (error) {
      Alert.alert("Purchase failed", error instanceof Error ? error.message : "Unable to complete purchase.")
    } finally {
      setActivePurchase(null)
    }
  }

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.")
      return
    }

    setAuthActionLoading(true)
    try {
      await sendOtp(email.trim().toLowerCase())
      Alert.alert("OTP sent", "Check your email for the verification code.")
    } catch (error) {
      Alert.alert("OTP error", error instanceof Error ? error.message : "Failed to send OTP.")
    } finally {
      setAuthActionLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!email.trim() || !otpCode.trim()) {
      Alert.alert("Missing info", "Enter your email and OTP code.")
      return
    }

    setAuthActionLoading(true)
    try {
      await verifyOtp(email.trim().toLowerCase(), otpCode.trim())
      setOtpCode("")
      Alert.alert("Success", "You are now signed in.")
    } catch (error) {
      Alert.alert("Verification failed", error instanceof Error ? error.message : "Failed to verify OTP.")
    } finally {
      setAuthActionLoading(false)
    }
  }

  const handleSignOut = async () => {
    setAuthActionLoading(true)
    try {
      await signOut()
      Alert.alert("Signed out", "You have been signed out.")
    } catch (error) {
      Alert.alert("Sign out failed", error instanceof Error ? error.message : "Unable to sign out.")
    } finally {
      setAuthActionLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      {/* Authentication */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Status</Text>
          <Text style={styles.settingValue}>
            {authLoading ? "Checking..." : isAuthenticated ? "Signed In" : "Signed Out"}
          </Text>
        </View>
        {isAuthenticated ? (
          <>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Account</Text>
              <Text style={styles.settingValue}>{user?.email ?? "Unknown"}</Text>
            </View>
            <Pressable
              style={styles.settingItem}
              onPress={handleSignOut}
              disabled={authActionLoading}
            >
              <Text style={styles.settingLabel}>Sign Out</Text>
              <Text style={styles.settingValue}>{authActionLoading ? "..." : "→"}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Pressable
              style={styles.settingItem}
              onPress={handleSendOtp}
              disabled={authActionLoading}
            >
              <Text style={styles.settingLabel}>Send OTP</Text>
              <Text style={styles.settingValue}>{authActionLoading ? "..." : "→"}</Text>
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP code"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              keyboardType="number-pad"
              value={otpCode}
              onChangeText={setOtpCode}
            />
            <Pressable
              style={styles.settingItem}
              onPress={handleVerifyOtp}
              disabled={authActionLoading}
            >
              <Text style={styles.settingLabel}>Verify OTP</Text>
              <Text style={styles.settingValue}>{authActionLoading ? "..." : "→"}</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* RevenueCat Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credits</Text>
        <Pressable
          style={styles.settingItem}
          onPress={handleShowPaywall}
          disabled={!revenueCat.isReady || revenueCat.actionStatus === "loading"}
        >
          <Text style={styles.settingLabel}>Open Credits Paywall</Text>
          <Text style={styles.settingValue}>→</Text>
        </Pressable>
        <Pressable
          style={styles.settingItem}
          onPress={handleRestore}
          disabled={!revenueCat.isReady || revenueCat.actionStatus === "loading"}
        >
          <Text style={styles.settingLabel}>Restore Purchases</Text>
          <Text style={styles.settingValue}>→</Text>
        </Pressable>
        <Pressable
          style={styles.settingItem}
          onPress={handleOpenCustomerCenter}
          disabled={!revenueCat.isReady || revenueCat.actionStatus === "loading"}
        >
          <Text style={styles.settingLabel}>Open Customer Center</Text>
          <Text style={styles.settingValue}>→</Text>
        </Pressable>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>RevenueCat Status</Text>
          <Text style={styles.settingValue}>{revenueCat.isReady ? "Connected" : "Initializing..."}</Text>
        </View>
        {revenueCat.lastError ? (
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Billing Error</Text>
            <Text style={[styles.settingValue, styles.dangerText]}>{revenueCat.lastError}</Text>
          </View>
        ) : null}
      </View>

      {/* Direct Purchase */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direct Purchase</Text>
        <Pressable
          style={styles.settingItem}
          onPress={() => handleDirectPurchase("credits500")}
          disabled={activePurchase !== null}
        >
          <Text style={styles.settingLabel}>Buy 500 Credits ($4.99) ({REVENUECAT_PRODUCTS.credits500})</Text>
          <Text style={styles.settingValue}>{activePurchase === "credits500" ? "..." : "→"}</Text>
        </Pressable>
        <Pressable
          style={styles.settingItem}
          onPress={() => handleDirectPurchase("credits1000")}
          disabled={activePurchase !== null}
        >
          <Text style={styles.settingLabel}>Buy 1000 Credits ($9.99) ({REVENUECAT_PRODUCTS.credits1000})</Text>
          <Text style={styles.settingValue}>{activePurchase === "credits1000" ? "..." : "→"}</Text>
        </Pressable>
        <Pressable
          style={styles.settingItem}
          onPress={() => handleDirectPurchase("credits2000")}
          disabled={activePurchase !== null}
        >
          <Text style={styles.settingLabel}>Buy 2000 Credits ($19.99) ({REVENUECAT_PRODUCTS.credits2000})</Text>
          <Text style={styles.settingValue}>{activePurchase === "credits2000" ? "..." : "→"}</Text>
        </Pressable>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Pressable style={styles.settingItem}>
          <Text style={styles.settingLabel}>Edit Profile</Text>
          <Text style={styles.settingValue}>→</Text>
        </Pressable>
        <Pressable 
          style={styles.settingItem}
          onPress={() => setCalorieModalVisible(true)}
        >
          <Text style={styles.settingLabel}>Daily Calorie Goal</Text>
          <Text style={styles.settingValue}>{goals.calorieGoal} kcal</Text>
        </Pressable>
        <Pressable 
          style={styles.settingItem}
          onPress={() => setMacroModalVisible(true)}
        >
          <Text style={styles.settingLabel}>Macro Targets</Text>
          <Text style={styles.settingValue}>
            P: {goals.proteinGoal}g | C: {goals.carbsGoal}g | F: {goals.fatGoal}g
          </Text>
        </Pressable>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#374151", true: "#f97316" }}
            thumbColor="#ffffff"
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
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
        <Text style={styles.sectionTitle}>Data</Text>
        <Pressable style={styles.settingItem}>
          <Text style={styles.settingLabel}>Export Data</Text>
          <Text style={styles.settingValue}>→</Text>
        </Pressable>
        <Pressable style={styles.settingItem}>
          <Text style={styles.settingLabel}>Clear All Data</Text>
          <Text style={[styles.settingValue, styles.dangerText]}>→</Text>
        </Pressable>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Version</Text>
          <Text style={styles.settingValue}>1.0.0</Text>
        </View>
        <Pressable style={styles.settingItem}>
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <Text style={styles.settingValue}>→</Text>
        </Pressable>
        <Pressable style={styles.settingItem}>
          <Text style={styles.settingLabel}>Terms of Service</Text>
          <Text style={styles.settingValue}>→</Text>
        </Pressable>
      </View>

      {/* Goal Editor Modals */}
      <GoalEditorModal
        visible={calorieModalVisible}
        onClose={() => setCalorieModalVisible(false)}
        type="calorie"
        currentGoals={goals}
        onSave={async (values) => {
          await updateCalorieGoal(values.calorieGoal)
        }}
      />
      <GoalEditorModal
        visible={macroModalVisible}
        onClose={() => setMacroModalVisible(false)}
        type="macro"
        currentGoals={goals}
        onSave={async (values) => {
          await updateMacroGoals(values.proteinGoal, values.carbsGoal, values.fatGoal)
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  settingLabel: {
    fontSize: 16,
    color: "#ffffff",
  },
  settingValue: {
    fontSize: 16,
    color: "#9ca3af",
  },
  input: {
    backgroundColor: "#111827",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    color: "#ffffff",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  dangerText: {
    color: "#ef4444",
  },
})
