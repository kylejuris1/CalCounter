import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"

interface WeeklyData {
  [key: string]: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
}

interface AnalyticsProps {
  weeklyData: WeeklyData
  darkMode?: boolean
  weightKg?: number
  heightCm?: number
  goalWeightKg?: number
  onUpdateWeight?: (kg: number) => Promise<void>
  onUpdateGoalWeight?: (kg: number) => Promise<void>
  onUpdateHeight?: (cm: number) => Promise<void>
  onUpdateBodyMetrics?: (updates: { weightKg?: number; goalWeightKg?: number; heightCm?: number }) => Promise<void>
}

/** Days until next Sunday (0 if today is Sunday). */
function daysUntilNextSunday(): number {
  const today = new Date()
  const day = today.getDay()
  return day === 0 ? 7 : 7 - day
}

export default function Analytics({
  weeklyData,
  darkMode = false,
  weightKg,
  heightCm,
  goalWeightKg,
  onUpdateWeight,
  onUpdateGoalWeight,
  onUpdateHeight,
  onUpdateBodyMetrics,
}: AnalyticsProps) {
  const screenWidth = Dimensions.get("window").width
  const s = darkMode ? styles : lightStyles
  const [weightModalVisible, setWeightModalVisible] = useState(false)
  const [currentWeightInput, setCurrentWeightInput] = useState("")
  const [goalWeightInput, setGoalWeightInput] = useState("")
  const [heightInput, setHeightInput] = useState("")
  const nextWeighInDays = daysUntilNextSunday()
  const chartConfig = darkMode
    ? {
        backgroundColor: "#000000",
        backgroundGradientFrom: "#000000",
        backgroundGradientTo: "#000000",
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: "4", strokeWidth: "2", stroke: "#ffffff" },
      }
    : {
        backgroundColor: "#ffffff",
        backgroundGradientFrom: "#f9fafb",
        backgroundGradientTo: "#f9fafb",
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: "4", strokeWidth: "2", stroke: "#374151" },
      }

  const labels = Object.keys(weeklyData)
  const calorieData = {
    labels: labels.length > 0 ? labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: labels.length > 0 
          ? labels.map(day => weeklyData[day].calories)
          : [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const macroData = {
    labels: labels.length > 0 ? labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: labels.length > 0
          ? labels.map(day => weeklyData[day].protein)
          : [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: labels.length > 0
          ? labels.map(day => weeklyData[day].carbs)
          : [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: labels.length > 0
          ? labels.map(day => weeklyData[day].fat)
          : [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const openWeightModal = () => {
    setCurrentWeightInput(weightKg != null ? String(weightKg) : "")
    setGoalWeightInput(goalWeightKg != null ? String(goalWeightKg) : "")
    setHeightInput(heightCm != null ? String(heightCm) : "")
    setWeightModalVisible(true)
  }

  const saveWeight = async () => {
    const cw = parseFloat(currentWeightInput)
    const gw = parseFloat(goalWeightInput)
    const h = parseFloat(heightInput)
    if (isNaN(cw) || cw < 0) {
      Alert.alert("Invalid", "Enter a valid current weight (kg).")
      return
    }
    if (isNaN(gw) || gw < 0) {
      Alert.alert("Invalid", "Enter a valid goal weight (kg).")
      return
    }
    if (onUpdateBodyMetrics) {
      await onUpdateBodyMetrics({
        weightKg: cw,
        goalWeightKg: gw,
        ...(Number.isFinite(h) && h > 0 ? { heightCm: h } : {}),
      })
    } else {
      await onUpdateWeight?.(cw)
      await onUpdateGoalWeight?.(gw)
      if (!isNaN(h) && h > 0) await onUpdateHeight?.(h)
    }
    setWeightModalVisible(false)
  }

  const bmi = weightKg != null && heightCm != null && heightCm > 0
    ? weightKg / ((heightCm / 100) ** 2)
    : null

  // Calculate weekly totals
  const weeklyTotals = Object.values(weeklyData).reduce(
    (totals, day) => ({
      calories: totals.calories + day.calories,
      protein: totals.protein + day.protein,
      carbs: totals.carbs + day.carbs,
      fat: totals.fat + day.fat,
      fiber: (totals.fiber ?? 0) + (day.fiber ?? 0),
      sugar: (totals.sugar ?? 0) + (day.sugar ?? 0),
      sodium: (totals.sodium ?? 0) + (day.sodium ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  )

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Progress</Text>

      {/* Weight panel */}
      <View style={s.section}>
        <Pressable style={s.weightPanel} onPress={openWeightModal}>
          <View style={s.weightRow}>
            <Text style={s.weightLabel}>Current weight</Text>
            <Text style={s.weightValue}>{weightKg != null ? `${weightKg} kg` : "—"}</Text>
          </View>
          <View style={s.weightRow}>
            <Text style={s.weightLabel}>Goal weight</Text>
            <Text style={s.weightValue}>{goalWeightKg != null ? `${goalWeightKg} kg` : "—"}</Text>
          </View>
          <View style={[s.weightRow, s.weightRowLast]}>
            <Text style={s.weightLabel}>Next weight-in</Text>
            <Text style={s.weightValue}>{nextWeighInDays}d</Text>
          </View>
        </Pressable>
      </View>

      {/* Weekly Calories */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Weekly Calories</Text>
        <View style={s.chartContainer}>
          <View style={s.chartWrapper}>
            <LineChart
              data={calorieData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={[s.chart, s.chartLeftFix]}
            />
          </View>
        </View>
      </View>

      {/* Weekly Macros */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Weekly Macros</Text>
        <View style={s.chartContainer}>
          <View style={s.chartWrapper}>
            <LineChart
              data={macroData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={[s.chart, s.chartLeftFix]}
            />
          </View>
        </View>
        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: "#ef4444" }]} />
            <Text style={s.legendText}>Protein</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: "#f97316" }]} />
            <Text style={s.legendText}>Carbs</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: "#3b82f6" }]} />
            <Text style={s.legendText}>Fats</Text>
          </View>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>This Week</Text>
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{weeklyTotals.calories.toLocaleString()}</Text>
            <Text style={s.statLabel}>Total Calories</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{Math.round(weeklyTotals.protein)}g</Text>
            <Text style={s.statLabel}>Total Protein</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{Math.round(weeklyTotals.carbs)}g</Text>
            <Text style={s.statLabel}>Total Carbs</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{Math.round(weeklyTotals.fat)}g</Text>
            <Text style={s.statLabel}>Total Fats</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{Math.round(weeklyTotals.fiber ?? 0)}g</Text>
            <Text style={s.statLabel}>Fiber</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{Math.round(weeklyTotals.sugar ?? 0)}g</Text>
            <Text style={s.statLabel}>Sugar</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{Math.round(weeklyTotals.sodium ?? 0)}</Text>
            <Text style={s.statLabel}>Sodium (mg)</Text>
          </View>
        </View>
      </View>

      {/* BMI */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>BMI</Text>
        <View style={s.bmiCard}>
          <Text style={s.bmiValue}>
            {bmi != null ? bmi.toFixed(1) : "—"}
          </Text>
          <Text style={s.bmiLabel}>
            {bmi != null ? (bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese") : "Set weight & height in Progress"}
          </Text>
        </View>
      </View>

      <Modal visible={weightModalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, darkMode ? s.modalCardDark : s.modalCardLight]}>
            <Text style={[s.modalTitle, { color: darkMode ? "#fff" : "#111827" }]}>Weight</Text>
            <View style={s.modalRow}>
              <Text style={[s.modalLabel, { color: darkMode ? "#9ca3af" : "#6b7280" }]}>Current (kg)</Text>
              <TextInput
                style={[s.modalInput, darkMode ? s.modalInputDark : s.modalInputLight]}
                value={currentWeightInput}
                onChangeText={setCurrentWeightInput}
                keyboardType="decimal-pad"
                placeholder="70"
                placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
              />
            </View>
            <View style={s.modalRow}>
              <Text style={[s.modalLabel, { color: darkMode ? "#9ca3af" : "#6b7280" }]}>Goal (kg)</Text>
              <TextInput
                style={[s.modalInput, darkMode ? s.modalInputDark : s.modalInputLight]}
                value={goalWeightInput}
                onChangeText={setGoalWeightInput}
                keyboardType="decimal-pad"
                placeholder="65"
                placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
              />
            </View>
            <View style={s.modalRow}>
              <Text style={[s.modalLabel, { color: darkMode ? "#9ca3af" : "#6b7280" }]}>Height (cm)</Text>
              <TextInput
                style={[s.modalInput, darkMode ? s.modalInputDark : s.modalInputLight]}
                value={heightInput}
                onChangeText={setHeightInput}
                keyboardType="decimal-pad"
                placeholder="170"
                placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
              />
            </View>
            <View style={s.modalButtons}>
              <Pressable style={s.modalCancel} onPress={() => setWeightModalVisible(false)}>
                <Text style={[s.modalCancelText, { color: darkMode ? "#fff" : "#374151" }]}>Cancel</Text>
              </Pressable>
              <Pressable style={s.modalSave} onPress={saveWeight}>
                <Text style={s.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  chartWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLeftFix: {
    marginLeft: -36,
  },
  weightPanel: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  weightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  weightRowLast: {
    marginBottom: 0,
  },
  weightLabel: {
    fontSize: 16,
    color: "#9ca3af",
  },
  weightValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  bmiCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  bmiLabel: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
  },
  modalCardDark: {
    backgroundColor: "#111827",
    borderColor: "#374151",
  },
  modalCardLight: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalRow: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  modalInputDark: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
    color: "#ffffff",
  },
  modalInputLight: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
    color: "#111827",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#374151",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSave: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f97316",
  },
  modalSaveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
  },
  statCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
    width: "31%",
    minWidth: 100,
    borderWidth: 1,
    borderColor: "#374151",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },
})

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chartWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLeftFix: {
    marginLeft: -36,
  },
  weightPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  weightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  weightRowLast: {
    marginBottom: 0,
  },
  weightLabel: {
    fontSize: 16,
    color: "#6b7280",
  },
  weightValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  bmiCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  bmiLabel: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
  },
  modalCardDark: {
    backgroundColor: "#111827",
    borderColor: "#374151",
  },
  modalCardLight: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalRow: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  modalInputDark: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
    color: "#ffffff",
  },
  modalInputLight: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
    color: "#111827",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSave: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f97316",
  },
  modalSaveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: "#6b7280",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    width: "31%",
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
  },
})

