import { View, Text, StyleSheet } from "react-native"
import Svg, { Circle } from "react-native-svg"

interface MacroCirclesProps {
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  macroGoals: {
    protein: number
    carbs: number
    fat: number
  }
}

export default function MacroCircles({ totals, macroGoals }: MacroCirclesProps) {
  const macros = [
    {
      label: "Protein",
      consumed: totals.protein,
      goal: macroGoals.protein,
      color: "#ef4444",
      percentage: Math.min(100, (totals.protein / macroGoals.protein) * 100),
    },
    {
      label: "Carbs",
      consumed: totals.carbs,
      goal: macroGoals.carbs,
      color: "#f97316",
      percentage: Math.min(100, (totals.carbs / macroGoals.carbs) * 100),
    },
    {
      label: "Fats",
      consumed: totals.fat,
      goal: macroGoals.fat,
      color: "#3b82f6",
      percentage: Math.min(100, (totals.fat / macroGoals.fat) * 100),
    },
  ].map(macro => {
    const remaining = Math.max(0, macro.goal - macro.consumed)
    const over = Math.max(0, macro.consumed - macro.goal)
    const isOver = macro.consumed > macro.goal
    
    return {
      ...macro,
      remaining,
      over,
      isOver,
      displayValue: isOver ? `+${Math.round(over)}g` : `${Math.round(remaining)}g`,
      displayLabel: isOver ? "over" : "left",
    }
  })

  return (
    <View style={styles.card}>
      <View style={styles.container}>
        {macros.map((macro, index) => {
          const circumference = 2 * Math.PI * 32
          const strokeDasharray = `${(macro.percentage / 100) * circumference} ${circumference}`
          const isLast = index === macros.length - 1

          return (
            <View key={index} style={[styles.macroItem, isLast && styles.lastMacroItem]}>
              <View style={styles.circleContainer}>
                <Svg width={80} height={80} viewBox="0 0 80 80" style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <Circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke={macro.color}
                    strokeWidth="10"
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
              <Text style={styles.value}>
                {macro.displayValue}
              </Text>
              <Text style={styles.label}>{macro.label} {macro.displayLabel}</Text>
            </View>
          )
        })}
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
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
    marginRight: 8,
  },
  lastMacroItem: {
    marginRight: 0,
  },
  circleContainer: {
    width: 80,
    height: 80,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    color: "#111827",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
})
