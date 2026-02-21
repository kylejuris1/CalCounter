import { View, Text, StyleSheet } from "react-native"
import Svg, { Circle, Defs, LinearGradient, Stop, Path } from "react-native-svg"

interface CalorieOverviewProps {
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  calorieGoal: number
}

export default function CalorieOverview({ totals, calorieGoal }: CalorieOverviewProps) {
  const caloriesConsumed = totals.calories
  const caloriesRemaining = Math.max(0, calorieGoal - caloriesConsumed)
  const caloriesOver = Math.max(0, caloriesConsumed - calorieGoal)
  const percentage = Math.min(100, (caloriesConsumed / calorieGoal) * 100)
  const circumference = 2 * Math.PI * 50
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
  const isOverTarget = caloriesConsumed > calorieGoal

  return (
    <View style={styles.card}>
      <View style={styles.container}>
        <View style={styles.textContainer}>
          {isOverTarget ? (
            <>
              <Text style={[styles.calories, styles.overText]}>+{caloriesOver.toLocaleString()}</Text>
              <Text style={styles.label}>Calories over target</Text>
              <Text style={styles.consumed}>{caloriesConsumed} / {calorieGoal} consumed</Text>
            </>
          ) : (
            <>
              <Text style={[styles.calories, styles.remainingText]}>{caloriesRemaining.toLocaleString()}</Text>
              <Text style={styles.label}>Calories left</Text>
              <Text style={styles.consumed}>{caloriesConsumed} / {calorieGoal} consumed</Text>
            </>
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
              stroke="#111827"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </Svg>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
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
  calories: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  remainingText: {
    color: "#111827",
  },
  overText: {
    color: "#ef4444",
  },
  label: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 4,
  },
  consumed: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
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
})
