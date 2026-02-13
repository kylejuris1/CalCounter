import { View, Text, StyleSheet, ScrollView } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"

interface WeeklyData {
  [key: string]: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

interface AnalyticsProps {
  weeklyData: WeeklyData
}

export default function Analytics({ weeklyData }: AnalyticsProps) {
  const screenWidth = Dimensions.get("window").width

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

  // Calculate weekly totals
  const weeklyTotals = Object.values(weeklyData).reduce(
    (totals, day) => ({
      calories: totals.calories + day.calories,
      protein: totals.protein + day.protein,
      carbs: totals.carbs + day.carbs,
      fat: totals.fat + day.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const chartConfig = {
    backgroundColor: "#000000",
    backgroundGradientFrom: "#000000",
    backgroundGradientTo: "#000000",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#ffffff",
    },
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Analytics</Text>

      {/* Weekly Calories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Calories</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={calorieData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      {/* Weekly Macros */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Macros</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={macroData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
            <Text style={styles.legendText}>Protein</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#f97316" }]} />
            <Text style={styles.legendText}>Carbs</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
            <Text style={styles.legendText}>Fats</Text>
          </View>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyTotals.calories.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Calories</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(weeklyTotals.protein)}g</Text>
            <Text style={styles.statLabel}>Total Protein</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(weeklyTotals.carbs)}g</Text>
            <Text style={styles.statLabel}>Total Carbs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(weeklyTotals.fat)}g</Text>
            <Text style={styles.statLabel}>Total Fats</Text>
          </View>
        </View>
      </View>
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
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
    gap: 12,
  },
  statCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    borderWidth: 1,
    borderColor: "#374151",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
})

