import { useState, useRef, useCallback, useEffect } from "react"
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native"
import Svg, { Circle } from "react-native-svg"

const SCREEN_WIDTH = Dimensions.get("window").width
const HORIZONTAL_PADDING = 32
const PAGE_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING
const PAGE_PADDING = 16
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING * 2
const GAP = 6
const SIZE = Math.floor((CONTENT_WIDTH - 6 * GAP) / 7)
const STROKE = 3
const RADIUS = Math.max(0, (SIZE - STROKE) / 2)
const CX = SIZE / 2
const CY = SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Returns Monday–Sunday for the week that is `weekOffset` weeks from the current week. weekOffset 0 = this week. */
function getWeekDates(weekOffset: number): { dateStr: string; dayNum: number }[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = (dayOfWeek + 6) % 7
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() - mondayOffset)
  const weekStart = new Date(thisMonday)
  weekStart.setDate(thisMonday.getDate() + weekOffset * 7)
  const out: { dateStr: string; dayNum: number }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    out.push({
      dateStr: d.toISOString().split("T")[0],
      dayNum: d.getDate(),
    })
  }
  return out
}

interface DailyTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface TabNavigationProps {
  selectedDate: string
  onDateChange: (dateStr: string) => void
  totalsByDate?: (dateStr: string) => DailyTotals
  calorieGoal?: number
}

export default function TabNavigation({
  selectedDate,
  onDateChange,
  totalsByDate,
  calorieGoal = 2000,
}: TabNavigationProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const isScrollingRef = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: PAGE_WIDTH, animated: false })
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isScrollingRef.current) return
      const x = e.nativeEvent.contentOffset.x
      if (x < PAGE_WIDTH * 0.3) {
        isScrollingRef.current = true
        setWeekOffset((prev) => prev - 1)
        scrollRef.current?.scrollTo({ x: PAGE_WIDTH, animated: false })
        setTimeout(() => { isScrollingRef.current = false }, 100)
      } else if (x > PAGE_WIDTH * 1.7) {
        isScrollingRef.current = true
        setWeekOffset((prev) => prev + 1)
        scrollRef.current?.scrollTo({ x: PAGE_WIDTH, animated: false })
        setTimeout(() => { isScrollingRef.current = false }, 100)
      }
    },
    []
  )

  const weekDates = getWeekDates(weekOffset)

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.pagedContent}
        style={styles.scrollView}
        decelerationRate="fast"
      >
        {/* Previous week */}
        <View style={[styles.weekPage, { width: PAGE_WIDTH }]}>
          <View style={styles.weekRow}>
            {getWeekDates(weekOffset - 1).map(({ dateStr, dayNum }) => {
              const isSelected = dateStr === selectedDate
              const totals = totalsByDate?.(dateStr) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
              const progressPct = calorieGoal > 0 ? Math.min(100, (totals.calories / calorieGoal) * 100) : 0
              const strokeDasharray = `${(progressPct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`
              return (
                <Pressable
                  key={dateStr}
                  onPress={() => onDateChange(dateStr)}
                  style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                >
                  <View style={styles.ringWrapper}>
                    <Svg width={SIZE} height={SIZE} style={[styles.ringSvg, { transform: [{ rotate: "-90deg" }] }]}>
                      <Circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth={STROKE} />
                      <Circle
                        cx={CX}
                        cy={CY}
                        r={RADIUS}
                        fill="none"
                        stroke={isSelected ? "#9ca3af" : "#d1d5db"}
                        strokeWidth={STROKE}
                        strokeDasharray={strokeDasharray}
                        strokeLinecap="round"
                      />
                    </Svg>
                    <View style={styles.dayNumOverlay}>
                      <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{dayNum}</Text>
                    </View>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>
        {/* Current week */}
        <View style={[styles.weekPage, { width: PAGE_WIDTH }]}>
          <View style={styles.weekRow}>
            {weekDates.map(({ dateStr, dayNum }) => {
              const isSelected = dateStr === selectedDate
              const totals = totalsByDate?.(dateStr) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
              const progressPct = calorieGoal > 0 ? Math.min(100, (totals.calories / calorieGoal) * 100) : 0
              const strokeDasharray = `${(progressPct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`
              return (
                <Pressable
                  key={dateStr}
                  onPress={() => onDateChange(dateStr)}
                  style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                >
                  <View style={styles.ringWrapper}>
                    <Svg width={SIZE} height={SIZE} style={[styles.ringSvg, { transform: [{ rotate: "-90deg" }] }]}>
                      <Circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth={STROKE} />
                      <Circle
                        cx={CX}
                        cy={CY}
                        r={RADIUS}
                        fill="none"
                        stroke={isSelected ? "#9ca3af" : "#d1d5db"}
                        strokeWidth={STROKE}
                        strokeDasharray={strokeDasharray}
                        strokeLinecap="round"
                      />
                    </Svg>
                    <View style={styles.dayNumOverlay}>
                      <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{dayNum}</Text>
                    </View>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>
        {/* Next week */}
        <View style={[styles.weekPage, { width: PAGE_WIDTH }]}>
          <View style={styles.weekRow}>
            {getWeekDates(weekOffset + 1).map(({ dateStr, dayNum }) => {
              const isSelected = dateStr === selectedDate
              const totals = totalsByDate?.(dateStr) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
              const progressPct = calorieGoal > 0 ? Math.min(100, (totals.calories / calorieGoal) * 100) : 0
              const strokeDasharray = `${(progressPct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`
              return (
                <Pressable
                  key={dateStr}
                  onPress={() => onDateChange(dateStr)}
                  style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                >
                  <View style={styles.ringWrapper}>
                    <Svg width={SIZE} height={SIZE} style={[styles.ringSvg, { transform: [{ rotate: "-90deg" }] }]}>
                      <Circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth={STROKE} />
                      <Circle
                        cx={CX}
                        cy={CY}
                        r={RADIUS}
                        fill="none"
                        stroke={isSelected ? "#9ca3af" : "#d1d5db"}
                        strokeWidth={STROKE}
                        strokeDasharray={strokeDasharray}
                        strokeLinecap="round"
                      />
                    </Svg>
                    <View style={styles.dayNumOverlay}>
                      <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{dayNum}</Text>
                    </View>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
  },
  scrollView: {},
  pagedContent: {
    flexDirection: "row",
  },
  weekPage: {
    paddingHorizontal: PAGE_PADDING,
    justifyContent: "center",
    alignItems: "center",
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: GAP,
    width: CONTENT_WIDTH,
    maxWidth: "100%",
  },
  dayPill: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#d1d5db",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  dayPillSelected: {
    backgroundColor: "#e5e7eb",
    borderStyle: "solid",
    borderColor: "#9ca3af",
  },
  ringWrapper: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringSvg: {
    position: "absolute",
  },
  dayNumOverlay: {
    alignItems: "center",
    justifyContent: "center",
    width: SIZE,
    height: SIZE,
  },
  dayText: {
    fontSize: SIZE >= 36 ? 14 : 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  dayTextSelected: {
    color: "#111827",
  },
})
