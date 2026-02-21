import { View, Text, StyleSheet } from "react-native"
import Svg, { Circle, Path } from "react-native-svg"

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

  const MacroIcon = ({ type }: { type: "protein" | "carbs" | "fat" }) => {
    const color = type === "protein" ? "#ef4444" : type === "carbs" ? "#f97316" : "#3b82f6"
    if (type === "protein") {
      return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M8 6c0-1.5 1.5-3 4-3s4 1.5 4 3v4c0 1.5-1.5 3-4 3s-4-1.5-4-3V6z" />
          <Path d="M12 10v10M9 14h6" />
        </Svg>
      )
    }
    if (type === "carbs") {
      return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M8 4v16M12 6v12M16 4v16M5 8h14M5 16h14" />
        </Svg>
      )
    }
    return (
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="#93c5fd" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2.69c-1.5 2.12-4 5.31-4 8a4 4 0 1 0 8 0c0-2.69-2.5-5.88-4-8z" />
      </Svg>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.container}>
        {macros.map((macro, index) => {
          const circumference = 2 * Math.PI * 32
          const strokeDasharray = `${(macro.percentage / 100) * circumference} ${circumference}`
          const isLast = index === macros.length - 1
          const iconType = macro.label === "Protein" ? "protein" : macro.label === "Carbs" ? "carbs" : "fat"

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
                <View style={styles.circleIconOverlay}>
                  <MacroIcon type={iconType} />
                </View>
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
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  circleIconOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
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
