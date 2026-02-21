import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, Modal, Text, ActivityIndicator, Pressable, Alert } from "react-native"
import { StatusBar } from "expo-status-bar"
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context"
import { CustomPurchaseControllerProvider, SuperwallProvider, usePlacement } from "./services/superwallCompat"
import "./app/globals.css"
import Header from "./components/header"
import TabNavigation from "./components/tab-navigation"
import DashboardPanels from "./components/dashboard-panels"
import BottomNav from "./components/bottom-nav"
import Analytics from "./components/analytics"
import Settings from "./components/settings"
import CameraModal from "./components/camera-modal"
import FloatingActionButton from "./components/floating-action-button"
import LandingPage from "./components/landing/LandingPage"
import OnboardingFlow from "./components/onboarding/OnboardingFlow"
import { useFoodData } from "./hooks/useFoodData"
import { useGoals } from "./hooks/useGoals"
import { useTheme } from "./hooks/useTheme"
import { useRevenueCat } from "./hooks/useRevenueCat"
import { useOnboarding } from "./hooks/useOnboarding"
import {
  initializeRevenueCat,
  purchaseProductByIdentifier,
  restorePurchases,
} from "./services/revenuecat"

const SUPERWALL_API_KEY = process.env.EXPO_PUBLIC_SUPERWALL_PUBLIC_API_KEY ?? ""

function AppContent() {
  const { isComplete, isLoading, setOnboardingComplete, resetOnboarding } = useOnboarding()
  const [showOnboarding, setShowOnboarding] = useState(false)

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    )
  }
  if (!isComplete && !showOnboarding) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <LandingPage
          onGetStarted={() => setShowOnboarding(true)}
          onSignIn={() => setOnboardingComplete()}
        />
      </SafeAreaView>
    )
  }
  if (!isComplete && showOnboarding) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <OnboardingFlow onComplete={() => {}} onBackToLanding={() => setShowOnboarding(false)} />
      </SafeAreaView>
    )
  }
  return <MainApp resetOnboarding={resetOnboarding} />
}

function MainApp({ resetOnboarding }: { resetOnboarding?: () => Promise<void> }) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [activePage, setActivePage] = useState("home")
  const [cameraVisible, setCameraVisible] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { darkMode } = useTheme()
  const { addFood, getFoodsForDate, getTotalsForDate, getWeeklyData, deleteFood, updateFood, clearAllFoods } = useFoodData()
  const { goals, updateWeight, updateGoalWeight, updateHeight } = useGoals()
  const revenueCat = useRevenueCat()
  usePlacement({
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

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]} edges={["top"]}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <View style={[styles.mainContainer, darkMode && styles.mainContainerDark]}>
        {/* Header */}
        <Header onLogoClick={handleLogoClick} darkMode={darkMode} />

        {/* Main Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activePage === "home" && (
            <>
              <TabNavigation
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                totalsByDate={getTotalsForDate}
                calorieGoal={goals.calorieGoal}
              />
              <DashboardPanels
                selectedDate={selectedDate}
                totals={getTotalsForDate(selectedDate)}
                calorieGoal={goals.calorieGoal}
                macroGoals={{
                  protein: goals.proteinGoal,
                  carbs: goals.carbsGoal,
                  fat: goals.fatGoal,
                }}
                foods={getFoodsForDate(selectedDate)}
                onDeleteFood={deleteFood}
                onUpdateFood={updateFood}
              />
            </>
          )}

          {activePage === "analytics" && (
            <Analytics
              weeklyData={getWeeklyData()}
              darkMode={darkMode}
              weightKg={goals.weightKg}
              heightCm={goals.heightCm}
              goalWeightKg={goals.goalWeightKg}
              onUpdateWeight={updateWeight}
              onUpdateGoalWeight={updateGoalWeight}
              onUpdateHeight={updateHeight}
            />
          )}

          {activePage === "settings" && (
            <Settings
              revenueCat={revenueCat}
              resetOnboarding={resetOnboarding}
              onClearLocalData={async () => {
                await clearAllFoods()
                await resetOnboarding?.()
              }}
            />
          )}
        </ScrollView>

        {/* Floating Action Button - only show on home page */}
        {activePage === "home" && (
          <FloatingActionButton onPress={() => setCameraVisible(true)} />
        )}

        {/* Bottom Navigation */}
        <BottomNav activePage={activePage} onPageChange={setActivePage} darkMode={darkMode} />
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
            <ActivityIndicator size="large" color="#111827" />
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
    <SafeAreaProvider>
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
        <AppContent />
      </CustomPurchaseControllerProvider>
    </SuperwallProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  containerDark: {
    backgroundColor: "#000000",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  mainContainerDark: {
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 200,
    paddingTop: 8,
  },
  pageContainer: {
    paddingVertical: 32,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  processingText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  processingSubtext: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
})
