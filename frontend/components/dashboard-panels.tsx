import { useState, useRef } from "react"
import { View, Text, ScrollView, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Pressable } from "react-native"
import Svg, { Path } from "react-native-svg"
import CalorieOverview from "./calorie-overview"
import MacroCircles from "./macro-circles"
import RecentlyUploaded from "./recently-uploaded"
import type { FoodItem } from "../hooks/useFoodData"
import { useWater } from "../hooks/useWater"

function WaterIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="#93c5fd" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2.69c-1.5 2.12-4 5.31-4 8a4 4 0 1 0 8 0c0-2.69-2.5-5.88-4-8z" />
    </Svg>
  )
}

const SCREEN_WIDTH = Dimensions.get("window").width
const HORIZONTAL_PADDING = 16
// Parent ScrollView has paddingHorizontal 16, so visible width is screen - 32
const PANEL_WIDTH = SCREEN_WIDTH - 32

interface DashboardPanelsProps {
  selectedDate: string
  totals: { calories: number; protein: number; carbs: number; fat: number }
  calorieGoal: number
  macroGoals: { protein: number; carbs: number; fat: number }
  foods: FoodItem[]
  onDeleteFood: (id: string) => void
  onUpdateFood: (food: FoodItem) => void
  darkMode?: boolean
  addBurnedCaloriesToGoal?: boolean
  caloriesBurned?: number
  onCaloriesBurnedChange?: (value: number) => void
}

export default function DashboardPanels({
  selectedDate,
  totals,
  calorieGoal,
  macroGoals,
  foods,
  onDeleteFood,
  onUpdateFood,
  darkMode = false,
  addBurnedCaloriesToGoal,
  caloriesBurned = 0,
  onCaloriesBurnedChange,
}: DashboardPanelsProps) {
  const [panelIndex, setPanelIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const { waterMl, addWater, removeWater } = useWater(selectedDate)

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x
    const index = Math.round(x / PANEL_WIDTH)
    if (index !== panelIndex) setPanelIndex(index)
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Panel 1: Calories + Macros */}
        <View style={[styles.panel, { width: PANEL_WIDTH }]}>
          <CalorieOverview
            totals={totals}
            calorieGoal={calorieGoal}
            darkMode={darkMode}
            addBurnedCaloriesToGoal={addBurnedCaloriesToGoal}
            caloriesBurned={caloriesBurned}
            onCaloriesBurnedChange={onCaloriesBurnedChange}
          />
          <MacroCircles totals={totals} macroGoals={macroGoals} />
        </View>

        {/* Panel 2: Fiber, Sugar, Sodium, Water */}
        <View style={[styles.panel, { width: PANEL_WIDTH }]}>
          <View style={styles.microCardRow}>
            <MicroCard label="Fiber" value="38g" unit="left" iconColor="#9333ea" />
            <MicroCard label="Sugar" value="68g" unit="left" iconColor="#ec4899" />
            <MicroCard label="Sodium" value="2300" valueUnit="mg" unit="left" iconColor="#eab308" />
          </View>
          <View style={styles.waterCard}>
            <View style={styles.waterRow}>
              <WaterIcon />
              <Text style={styles.waterLabel}>Water</Text>
              <Text style={styles.waterValue}>{waterMl} ml</Text>
            </View>
            <View style={styles.waterButtons}>
              <Pressable style={styles.waterButtonOuter} onPress={removeWater}>
                <Text style={styles.waterButtonText}>−</Text>
              </Pressable>
              <Pressable style={[styles.waterButtonOuter, styles.waterButtonPlus]} onPress={addWater}>
                <Text style={styles.waterButtonPlusText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Dots above "Recently uploaded" to show which panel is active */}
      <View style={styles.dots}>
        <View style={[styles.dot, panelIndex === 0 && styles.dotActive]} />
        <View style={[styles.dot, panelIndex === 1 && styles.dotActive]} />
      </View>

      <RecentlyUploaded foods={foods} onDelete={onDeleteFood} onUpdate={onUpdateFood} />
    </View>
  )
}

function MicroCard({
  label,
  value,
  valueUnit,
  unit,
  iconColor,
}: {
  label: string
  value: string
  valueUnit?: string
  unit: string
  iconColor: string
}) {
  const valueText = valueUnit != null ? `${value} ${valueUnit}` : value
  return (
    <View style={styles.microCard}>
      <View>
        <Text style={styles.microValue}>{valueText}</Text>
        <Text style={styles.microLabel}>{label} {unit}</Text>
      </View>
      <View style={[styles.microIconCircle, { borderColor: iconColor }]}>
        <View style={[styles.microIconInner, { backgroundColor: iconColor }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {},
  panel: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#9ca3af",
  },
  dotActive: {
    backgroundColor: "#374151",
    borderColor: "#374151",
  },
  microCardRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  microCard: {
    flex: 1,
    minHeight: 120,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  microValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  microLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  microIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  microIconInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  waterCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  waterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  waterValue: {
    fontSize: 16,
    color: "#6b7280",
  },
  waterButtons: {
    flexDirection: "row",
    gap: 12,
  },
  waterButtonOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  waterButtonText: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
  },
  waterButtonPlus: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  waterButtonPlusText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
  },
})
