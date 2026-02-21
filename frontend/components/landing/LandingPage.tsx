import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"

interface LandingPageProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <View style={styles.container}>
      {/* Phone mockup - app preview in frame, matching reference style */}
      <View style={styles.phoneMockup}>
        <View style={styles.phoneFrame}>
          <View style={styles.phoneNotch} />
          <View style={styles.phoneScreen}>
            <View style={styles.mockHeader}>
              <Text style={styles.mockHeaderTitle}>Today</Text>
            </View>
            <View style={styles.mockCalorieRow}>
              <Text style={styles.mockCalorieLabel}>Calories</Text>
              <Text style={styles.mockCalorieValue}>1,429</Text>
            </View>
            <View style={styles.mockBar}>
              <View style={[styles.mockBarFill, { width: "65%" }]} />
            </View>
            <View style={styles.mockMealCard}>
              <View style={styles.mockMealLine} />
              <View style={styles.mockMealLineShort} />
              <View style={styles.mockMealStats}>
                <Text style={styles.mockStat}>460 cal</Text>
                <Text style={styles.mockStat}>45g C</Text>
                <Text style={styles.mockStat}>25g P</Text>
              </View>
            </View>
            <View style={styles.mockMealCard}>
              <View style={styles.mockMealLine} />
              <View style={styles.mockMealLineShort} />
              <View style={styles.mockMealStats}>
                <Text style={styles.mockStat}>320 cal</Text>
                <Text style={styles.mockStat}>38g C</Text>
                <Text style={styles.mockStat}>12g P</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.headline}>CalCounter</Text>
      <Text style={styles.subhead}>
        Track meals, hit your goals, and build habits that last.
      </Text>

      <Pressable style={styles.getStartedButton} onPress={onGetStarted}>
        <Text style={styles.getStartedText}>Get Started</Text>
      </Pressable>
      <Pressable style={styles.signInTouchable} onPress={onSignIn}>
        <Text style={styles.signInText}>
          Already have an account? <Text style={styles.signInLink}>Sign in</Text>
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  phoneMockup: {
    marginBottom: 28,
  },
  phoneFrame: {
    width: 200,
    height: 400,
    borderRadius: 32,
    backgroundColor: "#111827",
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  phoneNotch: {
    width: 72,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#1f2937",
    marginBottom: 6,
  },
  phoneScreen: {
    flex: 1,
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 22,
    overflow: "hidden",
    padding: 12,
  },
  mockHeader: {
    marginBottom: 12,
  },
  mockHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  mockCalorieRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  mockCalorieLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  mockCalorieValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  mockBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  mockBarFill: {
    height: "100%",
    backgroundColor: "#111827",
    borderRadius: 4,
  },
  mockMealCard: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mockMealLine: {
    height: 8,
    backgroundColor: "#d1d5db",
    borderRadius: 4,
    marginBottom: 6,
    width: "85%",
  },
  mockMealLineShort: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    marginBottom: 8,
    width: "50%",
  },
  mockMealStats: {
    flexDirection: "row",
    gap: 8,
  },
  mockStat: {
    fontSize: 10,
    color: "#6b7280",
  },
  headline: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  subhead: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  getStartedButton: {
    width: "100%",
    backgroundColor: "#111827",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 0,
  },
  getStartedText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
  signInTouchable: {
    paddingVertical: 4,
    marginTop: 0,
  },
  signInText: {
    fontSize: 15,
    color: "#6b7280",
  },
  signInLink: {
    color: "#111827",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
})
