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
          <Circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
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
              <Stop offset="0%" stopColor="#4a90e2" />
              <Stop offset="100%" stopColor="#357abd" />
            </LinearGradient>
          </Defs>
        </Svg>
        <View style={styles.iconContainer}>
          <Svg
            width={32}
            height={32}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </Svg>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  textContainer: {
    flex: 1,
  },
  calories: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  remainingText: {
    color: "#10b981", // Green for remaining
  },
  overText: {
    color: "#ef4444", // Red for over target
  },
  label: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 4,
  },
  consumed: {
    color: "#6b7280",
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
