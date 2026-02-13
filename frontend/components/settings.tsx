import { useState } from "react"
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Alert } from "react-native"
import { useGoals } from "../hooks/useGoals"
import { PAYWALL_RESULT } from "react-native-purchases-ui"
import { REVENUECAT_ENTITLEMENT_ID, REVENUECAT_PRODUCTS } from "../services/revenuecat"
import { useRevenueCat } from "../hooks/useRevenueCat"
import GoalEditorModal from "./goal-editor-modal"

interface SettingsProps {
  revenueCat: ReturnType<typeof useRevenueCat>
}

export default function Settings({ revenueCat }: SettingsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkModeEnabled, setDarkModeEnabled] = useState(true)
  const { goals, updateCalorieGoal, updateMacroGoals } = useGoals()
  const [calorieModalVisible, setCalorieModalVisible] = useState(false)
  const [macroModalVisible, setMacroModalVisible] = useState(false)
  const [activePurchase, setActivePurchase] = useState<string | null>(null)

  const handlePaywallIfNeeded = async () => {
    try {
      const result = await revenueCat.showPaywallIfNeeded()
      const unlocked = revenueCat.getPaywallSuccess(result)

      if (unlocked) {
        Alert.alert("Success", "Your premium access is active.")
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

  const handleShowPaywall = async () => {
    try {
      const result = await revenueCat.showPaywall()

      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        Alert.alert("Success", "Your premium access is active.")
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
      const hasEntitlement = Boolean(info.entitlements.active[REVENUECAT_ENTITLEMENT_ID])

      if (hasEntitlement) {
        Alert.alert("Restored", "Your Harba Media Pro subscription is active.")
      } else {
        Alert.alert("No purchases found", "No active purchases were restored for this account.")
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

      Alert.alert("Purchase successful", `${productId} purchase completed.`)
    } catch (error) {
      Alert.alert("Purchase failed", error instanceof Error ? error.message : "Unable to complete purchase.")
    } finally {
      setActivePurchase(null)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      {/* Subscription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Harba Media Pro</Text>
          <Text style={[styles.settingValue, revenueCat.isPro ? styles.successText : styles.warningText]}>
            {revenueCat.isPro ? "Active" : "Inactive"}
          </Text>
        </View>
        <Pressable
          style={styles.settingItem}
          onPress={handlePaywallIfNeeded}
          disabled={!revenueCat.isReady || revenueCat.actionStatus === "loading"}
        >
          <Text style={styles.settingLabel}>Unlock Harba Media Pro</Text>
          <Text style={styles.settingValue}>→</Text>
        </Pressable>
        <Pressable
          style={styles.settingItem}
          onPress={handleShowPaywall}
          disabled={!revenueCat.isReady || revenueCat.actionStatus === "loading"}
        >
          <Text style={styles.settingLabel}>Open Paywall</Text>
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
          <Text style={styles.settingLabel}>Manage Subscription</Text>
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

      {/* Direct Purchases (Debug) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direct Purchases (Debug)</Text>
        <Pressable
          style={styles.settingItem}
          onPress={() => handleDirectPurchase("monthly")}
          disabled={activePurchase !== null}
        >
          <Text style={styles.settingLabel}>Buy Monthly ({REVENUECAT_PRODUCTS.monthly})</Text>
          <Text style={styles.settingValue}>{activePurchase === "monthly" ? "..." : "→"}</Text>
        </Pressable>
        <Pressable
          style={styles.settingItem}
          onPress={() => handleDirectPurchase("yearly")}
          disabled={activePurchase !== null}
        >
          <Text style={styles.settingLabel}>Buy Yearly ({REVENUECAT_PRODUCTS.yearly})</Text>
          <Text style={styles.settingValue}>{activePurchase === "yearly" ? "..." : "→"}</Text>
        </Pressable>
        <Pressable
          style={styles.settingItem}
          onPress={() => handleDirectPurchase("lifetime")}
          disabled={activePurchase !== null}
        >
          <Text style={styles.settingLabel}>Buy Lifetime ({REVENUECAT_PRODUCTS.lifetime})</Text>
          <Text style={styles.settingValue}>{activePurchase === "lifetime" ? "..." : "→"}</Text>
        </Pressable>
        <Pressable
          style={styles.settingItem}
          onPress={() => handleDirectPurchase("consumable")}
          disabled={activePurchase !== null}
        >
          <Text style={styles.settingLabel}>Buy 500 Credits ($4.99) ({REVENUECAT_PRODUCTS.consumable})</Text>
          <Text style={styles.settingValue}>{activePurchase === "consumable" ? "..." : "→"}</Text>
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
  dangerText: {
    color: "#ef4444",
  },
  successText: {
    color: "#22c55e",
  },
  warningText: {
    color: "#f59e0b",
  },
})
