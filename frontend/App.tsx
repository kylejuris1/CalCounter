import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, Modal, Text, ActivityIndicator, Pressable, Alert } from "react-native"
import { StatusBar } from "expo-status-bar"
import { SafeAreaView } from "react-native-safe-area-context"
import { CustomPurchaseControllerProvider, SuperwallProvider, usePlacement } from "./services/superwallCompat"
import "./app/globals.css"
import Header from "./components/header"
import TabNavigation from "./components/tab-navigation"
import CalorieOverview from "./components/calorie-overview"
import MacroCircles from "./components/macro-circles"
import RecentlyUploaded from "./components/recently-uploaded"
import BottomNav from "./components/bottom-nav"
import Analytics from "./components/analytics"
import Settings from "./components/settings"
import CameraModal from "./components/camera-modal"
import FloatingActionButton from "./components/floating-action-button"
import { useFoodData } from "./hooks/useFoodData"
import { useGoals } from "./hooks/useGoals"
import { useRevenueCat } from "./hooks/useRevenueCat"
import {
  initializeRevenueCat,
  purchaseProductByIdentifier,
  restorePurchases,
} from "./services/revenuecat"

const SUPERWALL_API_KEY = process.env.EXPO_PUBLIC_SUPERWALL_PUBLIC_API_KEY ?? ""
const BUY_CREDITS_PLACEMENT = "buy_credits"

function MainApp() {
  const [activeTab, setActiveTab] = useState("today")
  const [activePage, setActivePage] = useState("home")
  const [cameraVisible, setCameraVisible] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { addFood, getTodayFoods, getTodayTotals, getWeeklyData, deleteFood, updateFood } = useFoodData()
  const { goals } = useGoals()
  const revenueCat = useRevenueCat()
  const { registerPlacement } = usePlacement({
    onError: (error: unknown) => {
      Alert.alert("Paywall error", error instanceof Error ? error.message : String(error))
    },
  })

  // Suppress Expo update errors
  useEffect(() => {
    // Suppress console errors about updates
    const originalError = console.error
    console.error = (...args: any[]) => {
      const message = args.join(' ')
      if (message.includes('download remote update') || 
          message.includes('Updates') ||
          message.includes('expo-updates') ||
          message.includes('Remote update')) {
        // Suppress update-related errors
        return
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  const handleLogoClick = () => {
    setActivePage("home")
  }

  const handleProcessingStart = () => {
    setIsProcessing(true)
  }

  const handleProcessingStop = () => {
    setIsProcessing(false)
  }

  const handleFoodAnalyzed = async (data: any) => {
    try {
      await addFood(data)
      console.log("Food added to storage:", data)
    } catch (error) {
      console.error("Error saving food:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCameraClose = () => {
    setCameraVisible(false)
  }

  const handleBuyCredits = async () => {
    try {
      await registerPlacement({
        placement: BUY_CREDITS_PLACEMENT,
        params: {
          source: "home",
          screen: activePage,
        },
      })
    } catch (error) {
      Alert.alert("Paywall error", error instanceof Error ? error.message : "Unable to open credits paywall.")
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        {/* Header */}
        <Header onLogoClick={handleLogoClick} />

        {/* Main Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activePage === "home" && (
            <>
              {/* Tab Navigation */}
              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Calorie Overview */}
              <CalorieOverview totals={getTodayTotals()} calorieGoal={goals.calorieGoal} />

              {/* Macro Circles */}
              <MacroCircles 
                totals={getTodayTotals()} 
                macroGoals={{
                  protein: goals.proteinGoal,
                  carbs: goals.carbsGoal,
                  fat: goals.fatGoal,
                }}
              />

              <Pressable style={styles.buyCreditsButton} onPress={handleBuyCredits}>
                <Text style={styles.buyCreditsButtonText}>Buy Credits</Text>
              </Pressable>

              {/* Recently Uploaded */}
              <RecentlyUploaded 
                foods={getTodayFoods()} 
                onDelete={deleteFood}
                onUpdate={updateFood}
              />
            </>
          )}

          {activePage === "analytics" && (
            <Analytics weeklyData={getWeeklyData()} />
          )}

          {activePage === "settings" && (
            <Settings revenueCat={revenueCat} />
          )}
        </ScrollView>

        {/* Floating Action Button - only show on home page */}
        {activePage === "home" && (
          <FloatingActionButton onPress={() => setCameraVisible(true)} />
        )}

        {/* Bottom Navigation */}
        <BottomNav activePage={activePage} onPageChange={setActivePage} />
      </View>

      {/* Camera Modal */}
      <CameraModal
        visible={cameraVisible}
        onClose={handleCameraClose}
        onFoodAnalyzed={handleFoodAnalyzed}
        onProcessingStart={handleProcessingStart}
        onProcessingStop={handleProcessingStop}
      />

      {/* Processing Overlay */}
      <Modal
        visible={isProcessing}
        transparent
        animationType="fade"
      >
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.processingText}>Analyzing your food...</Text>
            <Text style={styles.processingSubtext}>This may take a few seconds</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default function App() {
  useEffect(() => {
    initializeRevenueCat().catch((error) => {
      console.error("[RevenueCat] Initialization failed", error)
    })
  }, [])

  return (
    <SuperwallProvider
      apiKeys={{ android: SUPERWALL_API_KEY, ios: SUPERWALL_API_KEY }}
      options={{
        manualPurchaseManagement: true,
      }}
      onConfigurationError={(error) => {
        console.error("[Superwall] Configuration failed", error)
      }}
    >
      <CustomPurchaseControllerProvider
        controller={{
          onPurchase: async ({ productId }: { productId: string }) => {
            try {
              const result = await purchaseProductByIdentifier(productId)
              if (result.userCancelled) {
                return { type: "cancelled" as const }
              }
              return { type: "purchased" as const }
            } catch (error) {
              return {
                type: "failed" as const,
                error: error instanceof Error ? error.message : "Purchase failed",
              }
            }
          },
          onPurchaseRestore: async () => {
            try {
              await restorePurchases()
              return { type: "restored" as const }
            } catch (error) {
              return {
                type: "failed" as const,
                error: error instanceof Error ? error.message : "Restore failed",
              }
            }
          },
        }}
      >
        <MainApp />
      </CustomPurchaseControllerProvider>
    </SuperwallProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  pageContainer: {
    paddingVertical: 32,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingContainer: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
    minWidth: 200,
  },
  processingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  processingSubtext: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  buyCreditsButton: {
    marginTop: 16,
    marginBottom: 20,
    alignSelf: "center",
    backgroundColor: "#f97316",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buyCreditsButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
})
