import { useState } from "react"
import { View, Text, StyleSheet, Modal, Pressable, TextInput } from "react-native"
import Svg, { Circle, Defs, LinearGradient, Stop, Path } from "react-native-svg"

interface CalorieOverviewProps {
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  calorieGoal: number
  darkMode?: boolean
  addBurnedCaloriesToGoal?: boolean
  caloriesBurned?: number
  onCaloriesBurnedChange?: (value: number) => void
}

export default function CalorieOverview({
  totals,
  calorieGoal,
  darkMode = false,
  addBurnedCaloriesToGoal,
  caloriesBurned = 0,
  onCaloriesBurnedChange,
}: CalorieOverviewProps) {
  const [burnedModalVisible, setBurnedModalVisible] = useState(false)
  const [burnedInput, setBurnedInput] = useState("")
  const caloriesConsumed = totals.calories
  const caloriesRemaining = Math.max(0, calorieGoal - caloriesConsumed)
  const caloriesOver = Math.max(0, caloriesConsumed - calorieGoal)
  const percentage = calorieGoal > 0 ? Math.min(100, (caloriesConsumed / calorieGoal) * 100) : 0
  const circumference = 2 * Math.PI * 50
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
  const isOverTarget = caloriesConsumed > calorieGoal
  const theme = darkMode ? { card: "#111827", text: "#f9fafb", label: "#9ca3af", over: "#f87171" } : { card: "#ffffff", text: "#111827", label: "#6b7280", over: "#ef4444" }

  const openBurnedModal = () => {
    setBurnedInput(String(caloriesBurned))
    setBurnedModalVisible(true)
  }
  const saveBurned = () => {
    const v = parseInt(burnedInput, 10)
    if (!isNaN(v) && v >= 0 && onCaloriesBurnedChange) onCaloriesBurnedChange(v)
    setBurnedModalVisible(false)
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.container}>
        <View style={[styles.textContainer, styles.textContainerShrink]}>
          {isOverTarget ? (
            <>
              <Text style={[styles.calories, { color: theme.over }]} numberOfLines={1}>+{caloriesOver.toLocaleString()}</Text>
              <Text style={[styles.label, { color: theme.label }]} numberOfLines={1}>Calories over target</Text>
              <Text style={[styles.consumed, { color: theme.label }]} numberOfLines={1}>{caloriesConsumed} / {calorieGoal} consumed</Text>
            </>
          ) : (
            <>
              <Text style={[styles.calories, { color: theme.text }]} numberOfLines={1}>{caloriesRemaining.toLocaleString()}</Text>
              <Text style={[styles.label, { color: theme.label }]} numberOfLines={1}>Calories left</Text>
              <Text style={[styles.consumed, { color: theme.label }]} numberOfLines={1}>{caloriesConsumed} / {calorieGoal} consumed</Text>
            </>
          )}
          {addBurnedCaloriesToGoal && onCaloriesBurnedChange && (
            <Pressable style={styles.burnedRow} onPress={openBurnedModal}>
              <Text style={[styles.burnedLabel, { color: theme.label }]}>Exercise: {caloriesBurned} cal burned</Text>
              <Text style={[styles.burnedTap, { color: theme.label }]}>Tap to edit</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.circleContainer}>
          <Svg width={128} height={128} viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <Circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="url(#gradientProgress)"
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
            />
            <Defs>
              <LinearGradient id="gradientProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#6b7280" />
                <Stop offset="100%" stopColor="#374151" />
              </LinearGradient>
            </Defs>
          </Svg>
          <View style={styles.iconContainer}>
            <Svg
              width={32}
              height={32}
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.text}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </Svg>
          </View>
        </View>
      </View>

      <Modal visible={burnedModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setBurnedModalVisible(false)} />
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Calories burned (exercise)</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.label }]}
              value={burnedInput}
              onChangeText={setBurnedInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.label}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={() => setBurnedModalVisible(false)}>
                <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={saveBurned}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
  },
  textContainerShrink: {
    flexShrink: 1,
    maxWidth: "55%",
  },
  calories: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    marginBottom: 2,
  },
  consumed: {
    fontSize: 11,
    marginTop: 2,
  },
  burnedRow: {
    marginTop: 8,
  },
  burnedLabel: { fontSize: 12 },
  burnedTap: { fontSize: 11, marginTop: 2 },
  circleContainer: {
    width: 128,
    height: 128,
    position: "relative",
  },
  iconContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    position: "relative",
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalCancel: { flex: 1, padding: 12, alignItems: "center" },
  modalCancelText: { fontSize: 16 },
  modalSave: { flex: 1, backgroundColor: "#111827", padding: 12, borderRadius: 8, alignItems: "center" },
  modalSaveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
})
