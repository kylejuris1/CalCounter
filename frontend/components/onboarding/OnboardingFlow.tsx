import React, { useState, useCallback, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native"
import Slider from "@react-native-community/slider"
import Icon from "react-native-vector-icons/Ionicons"
import { LineChart } from "react-native-chart-kit"
import {
  useOnboarding,
  computeRecommendations,
  saveOnboardingGoals,
  saveOnboardingBodyToGoals,
  type DietType,
  type GoalType,
  type GoalChoiceType,
  type GenderType,
  type WhereHeardType,
  type OnboardingAnswers,
} from "../../hooks/useOnboarding"
import { usePlacement } from "../../services/superwallCompat"
import { submitGuestOnboarding } from "../../services/api"

const TOTAL_STEPS = 27
const ONBOARDING_PAYWALL_PLACEMENT = "buy_credits"
/** Step index for "We want you to try CalCounter for free" - Continue triggers Superwall paywall */
const TRY_FREE_STEP = 26

const OBSTACLE_OPTIONS = [
  { id: "consistency", label: "Lack of consistency", icon: "bar-chart" as const },
  { id: "eating_habits", label: "Unhealthy eating habits", icon: "restaurant" as const },
  { id: "support", label: "Lack of support", icon: "people" as const },
  { id: "schedule", label: "Busy schedule", icon: "calendar" as const },
  { id: "meal_inspiration", label: "Lack of meal inspiration", icon: "nutrition" as const },
]

/** 0-2 -> workoutsPerWeek 1, 3-5 -> 4, 6+ -> 7 */
const WORKOUT_OPTIONS = [
  { id: "0-2" as const, label: "0 - 2", sublabel: "Workouts now and then", value: 1 },
  { id: "3-5" as const, label: "3 - 5", sublabel: "A few workouts per week", value: 4 },
  { id: "6+" as const, label: "6+", sublabel: "Dedicated athlete", value: 7 },
]

const WHERE_HEARD_OPTIONS: { id: WhereHeardType; label: string; icon: string }[] = [
  { id: "tik_tok", label: "Tik Tok", icon: "musical-notes" },
  { id: "youtube", label: "YouTube", icon: "logo-youtube" },
  { id: "google", label: "Google", icon: "logo-google" },
  { id: "play_store", label: "Play Store", icon: "storefront" },
  { id: "facebook", label: "Facebook", icon: "logo-facebook" },
  { id: "friend_or_family", label: "Friend or Family", icon: "people" },
  { id: "tv", label: "TV", icon: "tv" },
  { id: "instagram", label: "Instagram", icon: "logo-instagram" },
  { id: "x", label: "X", icon: "logo-twitter" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal" },
]

const WEIGHT_SPEED_OPTIONS = [
  { id: 0.2, label: "0.2 lbs", sublabel: "Slow and Steady", icon: "🦥" },
  { id: 1.5, label: "1.5 lbs", sublabel: "Moderate", icon: "🐰" },
  { id: 3.0, label: "3.0 lbs", sublabel: "Fast", icon: "🐇" },
]

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const FEET = Array.from({ length: 7 }, (_, i) => i + 2)
const INCHES = Array.from({ length: 12 }, (_, i) => i)
const LBS_RANGE = Array.from({ length: 321 }, (_, i) => i + 80)
const KG_RANGE = Array.from({ length: 146 }, (_, i) => i + 35)
const CM_RANGE = Array.from({ length: 151 }, (_, i) => i + 100)
const YEARS = Array.from({ length: 81 }, (_, i) => 2010 - i)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const WHEEL_ITEM_HEIGHT = 44
const WHEEL_VISIBLE_HEIGHT = 220

function WheelPicker({
  items,
  selectedValue,
  onValueChange,
  style,
}: {
  items: { label: string; value: number }[]
  selectedValue: number
  onValueChange: (value: number) => void
  style?: object
}) {
  const scrollRef = React.useRef<ScrollView>(null)
  const isProgrammaticScroll = React.useRef(false)
  const selectedIndex = Math.max(
    0,
    items.findIndex((i) => i.value === selectedValue)
  )
  const centerOffset = WHEEL_VISIBLE_HEIGHT / 2 - WHEEL_ITEM_HEIGHT / 2
  const maxScrollY = Math.max(0, 2 * centerOffset + items.length * WHEEL_ITEM_HEIGHT - WHEEL_VISIBLE_HEIGHT)

  useEffect(() => {
    const y = Math.max(0, Math.min(selectedIndex * WHEEL_ITEM_HEIGHT, maxScrollY))
    isProgrammaticScroll.current = true
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: false })
      setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 100)
    }, 50)
    return () => clearTimeout(t)
  }, [selectedIndex, maxScrollY])

  const pendingValueRef = React.useRef<number | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const emitValue = useCallback(
    (value: number) => {
      if (value !== selectedValue) onValueChange(value)
    },
    [selectedValue, onValueChange]
  )

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammaticScroll.current) return
      const y = e.nativeEvent.contentOffset.y
      const index = Math.round(y / WHEEL_ITEM_HEIGHT)
      const clamped = Math.max(0, Math.min(index, items.length - 1))
      const value = items[clamped].value
      const snapY = Math.max(0, Math.min(clamped * WHEEL_ITEM_HEIGHT, maxScrollY))
      scrollRef.current?.scrollTo({ y: snapY, animated: true })
      if (debounceRef.current) clearTimeout(debounceRef.current)
      pendingValueRef.current = value
      debounceRef.current = setTimeout(() => {
        if (pendingValueRef.current != null) {
          emitValue(pendingValueRef.current)
          pendingValueRef.current = null
        }
        debounceRef.current = null
      }, 150)
    },
    [items, maxScrollY, emitValue]
  )

  const handleMomentumScrollEnd = handleScrollEnd
  const handleScrollEndDrag = handleScrollEnd

  const snapOffsets = items.map((_, i) => Math.min(i * WHEEL_ITEM_HEIGHT, maxScrollY))

  return (
    <View style={[styles.wheelWrap, style]} collapsable={false}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        contentContainerStyle={{
          paddingVertical: centerOffset,
        }}
        style={styles.wheelScroll}
      >
        {items.map((item) => (
          <View key={item.value} style={styles.wheelItem}>
            <Text style={styles.wheelItemText}>{item.label}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.wheelHighlight} pointerEvents="none" />
    </View>
  )
}

const HORIZONTAL_WHEEL_ITEM_WIDTH = 44
const HORIZONTAL_WHEEL_VISIBLE_WIDTH = Math.min(Dimensions.get("window").width - 48, 340)

function HorizontalWheelPicker({
  items,
  selectedValue,
  onValueChange,
  style,
}: {
  items: { label: string; value: number }[]
  selectedValue: number
  onValueChange: (value: number) => void
  style?: object
}) {
  const scrollRef = React.useRef<ScrollView>(null)
  const isProgrammaticScroll = React.useRef(false)
  const selectedIndex = Math.max(
    0,
    items.findIndex((i) => i.value === selectedValue)
  )
  const centerOffset = HORIZONTAL_WHEEL_VISIBLE_WIDTH / 2 - HORIZONTAL_WHEEL_ITEM_WIDTH / 2

  useEffect(() => {
    const x = Math.max(0, selectedIndex * HORIZONTAL_WHEEL_ITEM_WIDTH - centerOffset)
    isProgrammaticScroll.current = true
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x, animated: false })
      setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 100)
    }, 50)
    return () => clearTimeout(t)
  }, [selectedIndex, centerOffset])

  const pendingValueRef = React.useRef<number | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const emitValue = useCallback(
    (value: number) => {
      if (value !== selectedValue) onValueChange(value)
    },
    [selectedValue, onValueChange]
  )

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammaticScroll.current) return
      const x = e.nativeEvent.contentOffset.x
      const index = Math.round((x + centerOffset) / HORIZONTAL_WHEEL_ITEM_WIDTH)
      const clamped = Math.max(0, Math.min(index, items.length - 1))
      const value = items[clamped].value
      const snapX = Math.max(0, clamped * HORIZONTAL_WHEEL_ITEM_WIDTH - centerOffset)
      scrollRef.current?.scrollTo({ x: snapX, animated: true })
      if (debounceRef.current) clearTimeout(debounceRef.current)
      pendingValueRef.current = value
      debounceRef.current = setTimeout(() => {
        if (pendingValueRef.current != null) {
          emitValue(pendingValueRef.current)
          pendingValueRef.current = null
        }
        debounceRef.current = null
      }, 150)
    },
    [items, centerOffset, emitValue]
  )

  const handleMomentumScrollEnd = handleScrollEnd
  const handleScrollEndDrag = handleScrollEnd

  const snapOffsets = items.map((_, i) => Math.max(0, i * HORIZONTAL_WHEEL_ITEM_WIDTH - centerOffset))

  return (
    <View style={[styles.horizontalWheelWrap, style]} collapsable={false}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        contentContainerStyle={{
          paddingHorizontal: centerOffset,
        }}
        style={styles.horizontalWheelScroll}
      >
        {items.map((item) => (
          <View key={item.value} style={styles.horizontalWheelItem}>
            <Text style={styles.horizontalWheelItemText}>{item.label}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.horizontalWheelHighlight} pointerEvents="none" />
    </View>
  )
}

interface OnboardingFlowProps {
  onComplete: () => void
  onBackToLanding?: () => void
}

export default function OnboardingFlow({ onComplete, onBackToLanding }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const { answers, setAnswers, setOnboardingComplete, setGuestId } = useOnboarding()
  const [referralCode, setReferralCode] = useState(answers.referralCode ?? "")
  const [weightInput, setWeightInput] = useState(answers.weightKg != null ? String(answers.weightKg) : "")
  const [heightInput, setHeightInput] = useState(answers.heightCm != null ? String(answers.heightCm) : "")
  const [birthDateInput, setBirthDateInput] = useState(answers.birthDate ?? "")
  const [desiredWeightInput, setDesiredWeightInput] = useState(
    answers.desiredWeight != null ? String(answers.desiredWeight) : ""
  )
  const [useImperial, setUseImperial] = useState(true)
  const [heightFeet, setHeightFeet] = useState(5)
  const [heightInches, setHeightInches] = useState(6)
  const [weightLbs, setWeightLbs] = useState(150)
  const [localHeightCm, setLocalHeightCm] = useState(170)
  const [localWeightKg, setLocalWeightKg] = useState(68)
  const [birthMonth, setBirthMonth] = useState(0)
  const [birthDay, setBirthDay] = useState(0)
  const [birthYear, setBirthYear] = useState(30)
  const [desiredWeightSlider, setDesiredWeightSlider] = useState(answers.desiredWeight ?? 150)
  const [isLoadingPlan, setIsLoadingPlan] = useState(false)
  const step5SyncedRef = React.useRef(false)
  const step8SyncedRef = React.useRef(false)
  const { registerPlacement } = usePlacement()

  useEffect(() => {
    if (step !== 5) {
      step5SyncedRef.current = false
      return
    }
    if (step5SyncedRef.current) return
    step5SyncedRef.current = true
    if (answers.weightKg != null) {
      setWeightLbs(Math.round(answers.weightKg * 2.20462))
      setLocalWeightKg(answers.weightKg)
    }
    if (answers.heightCm != null) {
      const totalInches = answers.heightCm / 2.54
      const feet = Math.floor(totalInches / 12)
      const inches = Math.round(totalInches - feet * 12)
      const clampedFeet = Math.max(3, Math.min(8, feet))
      const clampedInches = Math.max(0, Math.min(11, inches))
      setHeightFeet(clampedFeet)
      setHeightInches(clampedInches)
      setLocalHeightCm(answers.heightCm)
    }
  }, [step, answers.weightKg, answers.heightCm])

  useEffect(() => {
    if (step !== 8) {
      step8SyncedRef.current = false
      return
    }
    if (step8SyncedRef.current) return
    step8SyncedRef.current = true
    if (answers.desiredWeight != null) {
      const unit = answers.desiredWeightUnit ?? "lbs"
      const min = unit === "lbs" ? 80 : 35
      const max = unit === "lbs" ? 400 : 180
      const clamped = Math.max(min, Math.min(max, Math.round(answers.desiredWeight)))
      setDesiredWeightSlider(clamped)
    }
  }, [step, answers.desiredWeight, answers.desiredWeightUnit])

  const progress = (step + 1) / TOTAL_STEPS

  const completeOnboarding = useCallback(async () => {
    const recommended = computeRecommendations(answers)
    try {
      const { guestId } = await submitGuestOnboarding(answers, recommended)
      await setGuestId(guestId)
    } catch (e) {
      console.warn("[Onboarding] Failed to save to server (continuing locally)", e)
    }
    await saveOnboardingGoals(recommended)
    await saveOnboardingBodyToGoals(answers)
    await setOnboardingComplete()
    onComplete()
  }, [answers, setOnboardingComplete, setGuestId, onComplete])

  const goNext = useCallback(() => {
    if (step === TRY_FREE_STEP) {
      registerPlacement({
        placement: ONBOARDING_PAYWALL_PLACEMENT,
        params: { source: "onboarding_try_free" },
      })
        .then(async () => {
          try {
            const { getCustomerInfo } = await import("../../services/revenuecat")
            const info = await getCustomerInfo()
            const hasHarbaMediaPro = Boolean(
              info.entitlements.active["Harba Media Pro"] ||
              info.entitlements.active["harba_media_pro"] ||
              info.entitlements.active["harba-media-pro"]
            )
            if (hasHarbaMediaPro) {
              const { scheduleFreeTrialReminders } = await import("../../services/notifications")
              await scheduleFreeTrialReminders(3)
            }
          } catch (e) {
            console.warn("[Onboarding] reminder scheduling skipped", e)
          }
          await completeOnboarding()
        })
        .catch(completeOnboarding)
      return
    }
    if (step === 22) {
      setIsLoadingPlan(true)
      setStep(23)
      return
    }
    if (step === 23) return
    if (step === 24) {
      setStep(25)
      return
    }
    setStep((s) => s + 1)
  }, [step, completeOnboarding, registerPlacement])


  const goBack = useCallback(() => {
    if (step === 23 && isLoadingPlan) return
    if (step === 0) {
      onBackToLanding?.()
      return
    }
    setStep((s) => Math.max(0, s - 1))
  }, [step, isLoadingPlan, onBackToLanding])

  const canContinue = (): boolean => {
    if (step === 0) return answers.gender != null
    if (step === 1) return answers.workoutsPerWeek != null
    if (step === 2) return true
    if (step === 3) return answers.triedOtherApps != null
    if (step === 4) return true
    if (step === 5) return true
    if (step === 6) return true
    if (step === 7) return answers.goal != null
    if (step === 8) return true
    if (step === 9) return true
    if (step === 10) return answers.weightLossSpeedPerWeek != null
    if (step === 11) return true
    if (step === 12) return (answers.obstacles?.length ?? 0) > 0
    if (step === 13) return answers.diet != null
    if (step === 14) return answers.accomplish != null
    if (step >= 15) return true
    return false
  }

  const handleContinue = () => {
    if (step === 5) {
      if (useImperial) {
        const cm = (heightFeet * 12 + heightInches) * 2.54
        const kg = weightLbs * 0.453592
        setAnswers({ heightCm: Math.round(cm), weightKg: Math.round(kg * 10) / 10 })
      } else {
        setAnswers({ heightCm: localHeightCm, weightKg: localWeightKg })
      }
    }
    if (step === 6) {
      const y = YEARS[birthYear]
      const m = String(birthMonth + 1).padStart(2, "0")
      const dayNum = birthDay >= 0 && birthDay < DAYS.length ? DAYS[birthDay] : 1
      const d = String(dayNum).padStart(2, "0")
      setAnswers({ birthDate: `${y}-${m}-${d}` })
    }
    if (step === 8) {
      setAnswers({ desiredWeight: desiredWeightSlider, desiredWeightUnit: answers.desiredWeightUnit ?? "lbs" })
    }
    if (step === 21) setAnswers({ referralCode: referralCode.trim() || undefined })
    goNext()
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <StepGender
            selected={answers.gender}
            onSelect={(gender) => setAnswers({ gender })}
          />
        )}
        {step === 1 && (
          <StepWorkouts
            selected={answers.workoutsPerWeek}
            onSelect={(workoutsPerWeek) => setAnswers({ workoutsPerWeek })}
          />
        )}
        {step === 2 && (
          <StepWhereHeard
            value={answers.whereHeard}
            onChange={(whereHeard: WhereHeardType) => setAnswers({ whereHeard })}
          />
        )}
        {step === 3 && (
          <StepTriedOtherApps
            value={answers.triedOtherApps}
            onSelect={(triedOtherApps) => setAnswers({ triedOtherApps })}
          />
        )}
        {step === 4 && <StepLongTermResults />}
        {step === 5 && (
          <StepHeightWeight
            useImperial={useImperial}
            onToggleUnit={() => setUseImperial((v) => !v)}
            heightFeet={heightFeet}
            heightInches={heightInches}
            weightLbs={weightLbs}
            localHeightCm={localHeightCm}
            localWeightKg={localWeightKg}
            onHeightFeetChange={setHeightFeet}
            onHeightInchesChange={setHeightInches}
            onWeightLbsChange={setWeightLbs}
            onLocalHeightCmChange={setLocalHeightCm}
            onLocalWeightKgChange={setLocalWeightKg}
          />
        )}
        {step === 6 && (
          <StepBirthday
            monthIndex={birthMonth}
            dayIndex={birthDay}
            yearIndex={birthYear}
            onMonthChange={setBirthMonth}
            onDayChange={setBirthDay}
            onYearChange={setBirthYear}
          />
        )}
        {step === 7 && (
          <StepGoal
            selected={answers.goal}
            onSelect={(goal) => setAnswers({ goal })}
          />
        )}
        {step === 8 && (
          <StepDesiredWeight
            value={desiredWeightSlider}
            onValueChange={setDesiredWeightSlider}
            unit={answers.desiredWeightUnit ?? "lbs"}
            onUnitChange={(u) => {
              const currentUnit = answers.desiredWeightUnit ?? "lbs"
              if (u === currentUnit) return
              const current = desiredWeightSlider
              const converted =
                u === "kg" ? Math.round((current / 2.205) * 10) / 10 : Math.round((current * 2.205) * 10) / 10
              const clamped = u === "kg" ? Math.max(35, Math.min(180, converted)) : Math.max(80, Math.min(400, converted))
              setAnswers({ desiredWeightUnit: u })
              setDesiredWeightSlider(clamped)
            }}
            goal={answers.goal}
          />
        )}
        {step === 9 && <StepRealisticTarget answers={answers} />}
        {step === 10 && (
          <StepWeightSpeed
            selected={answers.weightLossSpeedPerWeek}
            onSelect={(weightLossSpeedPerWeek) => setAnswers({ weightLossSpeedPerWeek })}
          />
        )}
        {step === 11 && <StepLoseTwice />}
        {step === 12 && (
          <StepObstacles
            selected={answers.obstacles ?? []}
            onSelect={(obstacles) => setAnswers({ obstacles })}
          />
        )}
        {step === 13 && (
          <StepDiet selected={answers.diet} onSelect={(diet) => setAnswers({ diet })} />
        )}
        {step === 14 && (
          <StepAccomplish
            selected={answers.accomplish}
            onSelect={(accomplish) => setAnswers({ accomplish })}
          />
        )}
        {step === 15 && <StepGreatPotential />}
        {step === 16 && <StepThankYou />}
        {step === 17 && (
          <StepNotifications
            value={answers.notificationsEnabled}
            onSelect={(notificationsEnabled) => setAnswers({ notificationsEnabled })}
          />
        )}
        {step === 18 && (
          <StepBurnedCalories
            value={answers.addBurnedCaloriesToGoal}
            onSelect={(addBurnedCaloriesToGoal) => setAnswers({ addBurnedCaloriesToGoal })}
          />
        )}
        {step === 19 && (
          <StepRollover
            value={answers.rolloverCalories}
            onSelect={(rolloverCalories) => setAnswers({ rolloverCalories })}
          />
        )}
        {step === 20 && <StepRating />}
        {step === 21 && (
          <StepReferral value={referralCode} onChangeText={setReferralCode} />
        )}
        {step === 22 && <StepTimeToGenerate />}
        {step === 23 && (
          <StepSettingUp
            answers={answers}
            onPlanReady={(plan) => {
              saveOnboardingGoals(plan).then(() => {
                setIsLoadingPlan(false)
                setStep(24)
              })
            }}
          />
        )}
        {step === 24 && <StepPlanReady answers={answers} />}
        {step === 25 && <StepCreateAccount />}
        {step === TRY_FREE_STEP && <StepTryFree />}
      </ScrollView>

      {step < 23 && (
        <Pressable
          style={[styles.continueButton, !canContinue() && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue()}
        >
          <Text style={[styles.continueButtonText, !canContinue() && styles.continueButtonTextDisabled]}>
            Continue
          </Text>
        </Pressable>
      )}
      {step === 23 && isLoadingPlan && (
        <View style={styles.continueButton}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
      {step === 23 && !isLoadingPlan && (
        <Pressable style={styles.continueButton} onPress={goNext}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      )}
      {(step === 24 || step === 25 || step === TRY_FREE_STEP) && (
        <Pressable style={styles.continueButton} onPress={goNext}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      )}
    </View>
  )
}

function StepGender({
  selected,
  onSelect,
}: {
  selected?: GenderType
  onSelect: (g: GenderType) => void
}) {
  const options: { id: GenderType; label: string; icon: string }[] = [
    { id: "female", label: "Female", icon: "female" },
    { id: "male", label: "Male", icon: "male" },
    { id: "other", label: "Other", icon: "person" },
  ]
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Choose your Gender</Text>
      <Text style={styles.subtitle}>This will be used to calibrate your custom plan.</Text>
      {options.map((opt) => (
        <Pressable
          key={opt.id}
          style={[styles.optionCard, selected === opt.id && styles.optionCardSelected]}
          onPress={() => onSelect(opt.id)}
        >
          <View style={[styles.optionIconWrap, selected === opt.id && styles.optionIconWrapSelected]}>
            <Icon name={opt.icon as any} size={22} color={selected === opt.id ? "#fff" : "#111827"} />
          </View>
          <Text style={[styles.optionCardText, selected === opt.id && styles.optionCardTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function StepWorkouts({
  selected,
  onSelect,
}: {
  selected?: number
  onSelect: (n: number) => void
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>How many workouts do you do per week?</Text>
      <Text style={styles.subtitle}>This will be used to calibrate your custom plan.</Text>
      {WORKOUT_OPTIONS.map((opt) => (
        <Pressable
          key={opt.id}
          style={[styles.optionCard, selected === opt.value && styles.optionCardSelected]}
          onPress={() => onSelect(opt.value)}
        >
          <View style={[styles.optionIconWrap, selected === opt.value && styles.optionIconWrapSelected]}>
            {opt.id === "0-2" && <View style={styles.dotIcon}><View style={[styles.singleDot, selected === opt.value && styles.dotSelected]} /></View>}
            {opt.id === "3-5" && (
              <View style={styles.dotIcon}>
                <View style={[styles.triDot, styles.triDotTop, selected === opt.value && styles.dotSelected]} />
                <View style={[styles.triDot, styles.triDotLeft, selected === opt.value && styles.dotSelected]} />
                <View style={[styles.triDot, styles.triDotRight, selected === opt.value && styles.dotSelected]} />
              </View>
            )}
            {opt.id === "6+" && (
              <View style={styles.dotIcon}>
                {[0, 1, 2].map((r) => (
                  <View key={r} style={styles.sixDotRow}>
                    {[0, 1].map((c) => (
                      <View key={c} style={[styles.smallDot, selected === opt.value && styles.smallDotSelected]} />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
          <View style={styles.optionCardContent}>
            <Text style={[styles.optionCardText, selected === opt.value && styles.optionCardTextSelected]}>
              {opt.label}
            </Text>
            <Text style={[styles.optionCardSubtext, selected === opt.value && styles.optionCardSubtextSelected]}>
              {opt.sublabel}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

function StepWhereHeard({
  value,
  onChange,
}: {
  value?: WhereHeardType
  onChange: (s: WhereHeardType) => void
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Where did you hear about us?</Text>
      <Text style={styles.subtitle}>(optional)</Text>
      {WHERE_HEARD_OPTIONS.map((opt) => (
        <Pressable
          key={opt.id}
          style={[styles.optionCard, value === opt.id && styles.optionCardSelected]}
          onPress={() => onChange(opt.id)}
        >
          <View style={[styles.optionIconWrap, value === opt.id && styles.optionIconWrapSelected]}>
            <Icon name={opt.icon as any} size={22} color={value === opt.id ? "#fff" : "#111827"} />
          </View>
          <Text style={[styles.optionCardText, value === opt.id && styles.optionCardTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function StepTriedOtherApps({
  value,
  onSelect,
}: {
  value?: boolean
  onSelect: (v: boolean) => void
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Have you tried other calorie tracking apps?</Text>
      <View style={styles.twoButtons}>
        <Pressable
          style={[styles.halfButton, value === false && styles.halfButtonSelected]}
          onPress={() => onSelect(false)}
        >
          <Icon name="thumbs-down" size={24} color={value === false ? "#fff" : "#111827"} style={styles.halfButtonIcon} />
          <Text style={value === false ? styles.halfButtonText : styles.halfButtonTextUnselected}>No</Text>
        </Pressable>
        <Pressable
          style={[styles.halfButton, value === true && styles.halfButtonSelected]}
          onPress={() => onSelect(true)}
        >
          <Icon name="thumbs-up" size={24} color={value === true ? "#fff" : "#111827"} style={styles.halfButtonIcon} />
          <Text style={value === true ? styles.halfButtonText : styles.halfButtonTextUnselected}>Yes</Text>
        </Pressable>
      </View>
    </View>
  )
}

const CHART_WIDTH = Math.min(Dimensions.get("window").width - 88, 320)
const lineChartConfig = {
  backgroundColor: "#f3f4f6",
  backgroundGradientFrom: "#f3f4f6",
  backgroundGradientTo: "#f3f4f6",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: { borderRadius: 12 },
  propsForDots: { r: "4" },
}

const TRADITIONAL_DIET_COLOR = "#dc2626"

function StepLongTermResults() {
  const labels = ["Month 1", "", "", "", "", "Month 6"]
  const calCounterData = [100, 88, 76, 68, 60, 52]
  const traditionalData = [100, 90, 85, 88, 92, 95]
  const chartData = {
    labels,
    datasets: [
      { data: calCounterData, color: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`, strokeWidth: 2 },
      { data: traditionalData, color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`, strokeWidth: 2 },
    ],
  }
  const chartConfigWithNoYLabels = {
    ...lineChartConfig,
    formatYLabel: () => "",
    formatXLabel: (value: string, index: number) => (index === 0 ? "Month 1" : index === 5 ? "Month 6" : ""),
  }
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>CalCounter creates long-term results</Text>
      <View style={styles.chartCard}>
        <Text style={styles.chartCardTitle}>Your weight</Text>
        <LineChart
          data={chartData}
          width={CHART_WIDTH}
          height={180}
          chartConfig={chartConfigWithNoYLabels}
          bezier
          style={[styles.lineChart, styles.lineChartNoYAxis]}
          withInnerLines={true}
          withOuterLines={false}
          withHorizontalLabels={false}
          fromZero={false}
          yAxisSuffix=""
          segments={4}
        />
        <View style={styles.chartLegend}>
          <View style={styles.chartLegendPill}>
            <Icon name="nutrition" size={14} color="#ffffff" />
            <Text style={styles.chartLegendText}>CalCounter</Text>
            <Text style={styles.chartLegendText}>Weight</Text>
          </View>
          <Text style={[styles.chartLegendTraditional, { color: TRADITIONAL_DIET_COLOR }]}>Traditional diet</Text>
        </View>
        <Text style={styles.chartStat}>
          80% of CalCounter users maintain their weight loss even 6 months later
        </Text>
      </View>
    </View>
  )
}

function StepHeightWeight({
  useImperial,
  onToggleUnit,
  heightFeet,
  heightInches,
  weightLbs,
  localHeightCm,
  localWeightKg,
  onHeightFeetChange,
  onHeightInchesChange,
  onWeightLbsChange,
  onLocalHeightCmChange,
  onLocalWeightKgChange,
}: {
  useImperial: boolean
  onToggleUnit: () => void
  heightFeet: number
  heightInches: number
  weightLbs: number
  localHeightCm: number
  localWeightKg: number
  onHeightFeetChange: (n: number) => void
  onHeightInchesChange: (n: number) => void
  onWeightLbsChange: (n: number) => void
  onLocalHeightCmChange: (n: number) => void
  onLocalWeightKgChange: (n: number) => void
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Height & Weight</Text>
      <Text style={styles.subtitle}>This will be taken into account when calculating your daily nutrition goals.</Text>
      <View style={styles.unitToggleRow}>
        <Text style={[styles.unitToggleLabel, useImperial && styles.unitToggleLabelActive]}>Imperial</Text>
        <Switch value={!useImperial} onValueChange={onToggleUnit} trackColor={{ false: "#d1d5db", true: "#111827" }} thumbColor="#fff" />
        <Text style={[styles.unitToggleLabel, !useImperial && styles.unitToggleLabelActive]}>Metric</Text>
      </View>
      {useImperial ? (
        <>
          <Text style={styles.pickerLabel}>Height</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerWrap}>
              <WheelPicker
                items={FEET.map((n) => ({ label: `${n} ft`, value: n }))}
                selectedValue={heightFeet}
                onValueChange={onHeightFeetChange}
              />
            </View>
            <View style={styles.pickerWrap}>
              <WheelPicker
                items={INCHES.map((n) => ({ label: `${n} in`, value: n }))}
                selectedValue={heightInches}
                onValueChange={onHeightInchesChange}
              />
            </View>
          </View>
          <Text style={styles.pickerLabel}>Weight</Text>
          <View style={styles.pickerWrap}>
            <WheelPicker
              items={LBS_RANGE.map((n) => ({ label: `${n} lb`, value: n }))}
              selectedValue={weightLbs}
              onValueChange={onWeightLbsChange}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.pickerLabel}>Height</Text>
          <View style={styles.pickerWrap}>
            <WheelPicker
              items={CM_RANGE.map((n) => ({ label: `${n} cm`, value: n }))}
              selectedValue={localHeightCm}
              onValueChange={onLocalHeightCmChange}
            />
          </View>
          <Text style={styles.pickerLabel}>Weight</Text>
          <View style={styles.pickerWrap}>
            <WheelPicker
              items={KG_RANGE.map((n) => ({ label: `${n} kg`, value: n }))}
              selectedValue={localWeightKg}
              onValueChange={onLocalWeightKgChange}
            />
          </View>
        </>
      )}
    </View>
  )
}

function StepBirthday({
  monthIndex,
  dayIndex,
  yearIndex,
  onMonthChange,
  onDayChange,
  onYearChange,
}: {
  monthIndex: number
  dayIndex: number
  yearIndex: number
  onMonthChange: (n: number) => void
  onDayChange: (n: number) => void
  onYearChange: (n: number) => void
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>When were you born?</Text>
      <Text style={styles.subtitle}>This will be taken into account when calculating your daily nutrition goals.</Text>
      <View style={styles.pickerRow}>
        <View style={styles.pickerWrap}>
          <WheelPicker
            items={MONTHS.map((m, i) => ({ label: m, value: i }))}
            selectedValue={monthIndex}
            onValueChange={onMonthChange}
          />
        </View>
        <View style={styles.pickerWrap}>
          <WheelPicker
            items={DAYS.map((d) => ({ label: String(d).padStart(2, "0"), value: d - 1 }))}
            selectedValue={dayIndex}
            onValueChange={onDayChange}
          />
        </View>
        <View style={styles.pickerWrap}>
          <WheelPicker
            items={YEARS.map((y, i) => ({ label: String(y), value: i }))}
            selectedValue={yearIndex}
            onValueChange={onYearChange}
          />
        </View>
      </View>
    </View>
  )
}

function StepGoal({
  selected,
  onSelect,
}: {
  selected?: GoalChoiceType
  onSelect: (g: GoalChoiceType) => void
}) {
  const options: { id: GoalChoiceType; label: string; icon: string }[] = [
    { id: "lose", label: "Lose Weight", icon: "trending-down" },
    { id: "maintain", label: "Maintain", icon: "remove" },
    { id: "gain", label: "Gain Weight", icon: "trending-up" },
  ]
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>What is your goal?</Text>
      <Text style={styles.subtitle}>This helps us generate a plan for your calorie intake.</Text>
      {options.map((opt) => (
        <Pressable
          key={opt.id}
          style={[styles.optionCard, selected === opt.id && styles.optionCardSelected]}
          onPress={() => onSelect(opt.id)}
        >
          <View style={[styles.optionIconWrap, selected === opt.id && styles.optionIconWrapSelected]}>
            <Icon name={opt.icon as any} size={22} color={selected === opt.id ? "#fff" : "#111827"} />
          </View>
          <Text style={[styles.optionCardTextCentered, selected === opt.id && styles.optionCardTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function StepDesiredWeight({
  value,
  onValueChange,
  unit,
  onUnitChange,
  goal,
}: {
  value: number
  onValueChange: (n: number) => void
  unit: "lbs" | "kg"
  onUnitChange: (u: "lbs" | "kg") => void
  goal?: GoalChoiceType
}) {
  const isLbs = unit === "lbs"
  const min = isLbs ? 80 : 35
  const max = isLbs ? 400 : 180
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const valueInRange = Math.max(min, Math.min(max, Math.round(value)))
  const items = range.map((n) => ({ label: `${n} ${unit}`, value: n }))
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>What is your desired weight?</Text>
      <Text style={styles.subtitle}>
        {goal === "lose" ? "Lose Weight" : goal === "gain" ? "Gain Weight" : "Maintain"}
      </Text>
      <View style={[styles.unitToggleRow, styles.unitToggleRowCentered]}>
        <Pressable style={[styles.unitChip, isLbs && styles.unitChipActive]} onPress={() => onUnitChange("lbs")}>
          <Text style={[styles.unitChipText, isLbs && styles.unitChipTextActive]}>Lbs</Text>
        </Pressable>
        <Pressable style={[styles.unitChip, !isLbs && styles.unitChipActive]} onPress={() => onUnitChange("kg")}>
          <Text style={[styles.unitChipText, !isLbs && styles.unitChipTextActive]}>Kg</Text>
        </Pressable>
      </View>
      <Text style={styles.valueDisplay}>
        {valueInRange} {unit}
      </Text>
      <WheelPicker
        items={items}
        selectedValue={valueInRange}
        onValueChange={(n) => onValueChange(n)}
        style={styles.desiredWeightWheel}
      />
    </View>
  )
}

function StepRealisticTarget({ answers }: { answers: OnboardingAnswers }) {
  const currentKg = answers.weightKg ?? 70
  const unit = answers.desiredWeightUnit ?? "lbs"
  const currentInUnit = unit === "lbs" ? currentKg * 2.20462 : currentKg
  const desired = answers.desiredWeight ?? currentInUnit - 5
  const diffRounded = Math.round(Math.abs(currentInUnit - desired) + Number.EPSILON)
  return (
    <View style={[styles.stepRoot, styles.centeredStep, { flex: 1 }]}>
      <Text style={styles.realisticTitle}>
        Losing <Text style={styles.realisticHighlight}>{diffRounded} {unit}</Text> is a realistic target. It's not hard at all!
      </Text>
      <Text style={styles.realisticSubtext}>
        90% of users say that the change is obvious after using CalCounter and it is not easy to rebound.
      </Text>
    </View>
  )
}

const WEIGHT_SPEED_MIN = 0.2
const WEIGHT_SPEED_MAX = 3.0
const WEIGHT_SPEED_STEP = 0.1

function StepWeightSpeed({
  selected,
  onSelect,
}: {
  selected?: number
  onSelect: (n: number) => void
}) {
  const value = selected != null ? selected : 1.0
  const rounded = Math.round(value * 10) / 10
  const setDefaultRef = React.useRef(false)
  useEffect(() => {
    if (!setDefaultRef.current && selected == null) {
      setDefaultRef.current = true
      onSelect(1.0)
    }
  }, [selected, onSelect])
  const sublabel =
    rounded <= 0.5 ? "Slow and Steady" : rounded <= 1.5 ? "Moderate" : "Fast"
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>How fast do you want to reach your goal?</Text>
      <Text style={styles.subtitle}>Lose weight speed per week (lbs)</Text>
      <Text style={styles.valueDisplay}>{rounded.toFixed(1)} lbs</Text>
      <View style={styles.speedIconsRow}>
        <View style={styles.speedIconWrap}>
          <Icon name="hourglass-outline" size={28} color="#111827" />
        </View>
        <View style={styles.speedIconWrap}>
          <Icon name="walk-outline" size={28} color="#111827" />
        </View>
        <View style={styles.speedIconWrap}>
          <Icon name="flash-outline" size={28} color="#111827" />
        </View>
      </View>
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderMinMax}>{WEIGHT_SPEED_MIN} lbs</Text>
        <Slider
          style={styles.sliderNative}
          minimumValue={WEIGHT_SPEED_MIN}
          maximumValue={WEIGHT_SPEED_MAX}
          step={WEIGHT_SPEED_STEP}
          value={value}
          onValueChange={onSelect}
          minimumTrackTintColor="#111827"
          maximumTrackTintColor="#e5e7eb"
          thumbTintColor="#111827"
        />
        <Text style={styles.sliderMinMax}>{WEIGHT_SPEED_MAX} lbs</Text>
      </View>
      <View style={styles.speedLabelCard}>
        <Text style={styles.speedLabelText}>{sublabel}</Text>
      </View>
    </View>
  )
}

function StepLoseTwice() {
  return (
    <View style={styles.stepRoot}>
      <Text style={[styles.title, styles.textCenter]}>
        Lose twice as much weight with CalCounter vs on your own
      </Text>
      <View style={styles.comparisonCard}>
        <View style={styles.comparisonColumn}>
          <Text style={[styles.comparisonLabel, styles.textCenter]}>Without CalCounter</Text>
          <View style={styles.comparisonBarSpacer} />
          <View style={styles.comparisonBarSmall}>
            <Text style={styles.comparisonBarText}>20%</Text>
          </View>
        </View>
        <View style={styles.comparisonColumnDark}>
          <Text style={[styles.comparisonLabel, styles.comparisonLabelLight, styles.textCenter]}>With CalCounter</Text>
          <View style={styles.comparisonBarLarge}>
            <Text style={styles.comparisonBarTextLight}>2X</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.subtitle, styles.textCenter]}>CalCounter makes it easy and holds you accountable</Text>
    </View>
  )
}

function StepObstacles({
  selected,
  onSelect,
}: {
  selected: string[]
  onSelect: (ids: string[]) => void
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) onSelect(selected.filter((x) => x !== id))
    else onSelect([...selected, id])
  }
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>What's stopping you from reaching your goals?</Text>
      {OBSTACLE_OPTIONS.map((opt) => (
        <Pressable
          key={opt.id}
          style={[styles.optionCard, selected.includes(opt.id) && styles.optionCardSelected]}
          onPress={() => toggle(opt.id)}
        >
          <View style={[styles.optionIconWrap, selected.includes(opt.id) && styles.optionIconWrapSelected]}>
            <Icon name={opt.icon as any} size={22} color={selected.includes(opt.id) ? "#fff" : "#111827"} />
          </View>
          <Text style={[styles.optionCardText, selected.includes(opt.id) && styles.optionCardTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function StepDiet({
  selected,
  onSelect,
}: {
  selected?: DietType
  onSelect: (d: DietType) => void
}) {
  const options: { id: DietType; label: string; icon: string }[] = [
    { id: "classic", label: "Classic", icon: "restaurant" },
    { id: "pescatarian", label: "Pescatarian", icon: "fish" },
    { id: "vegetarian", label: "Vegetarian", icon: "leaf" },
    { id: "vegan", label: "Vegan", icon: "leaf-outline" },
  ]
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Do you follow a specific diet?</Text>
      {options.map((opt) => (
        <Pressable
          key={opt.id}
          style={[styles.optionCard, selected === opt.id && styles.optionCardSelected]}
          onPress={() => onSelect(opt.id)}
        >
          <View style={[styles.optionIconWrap, selected === opt.id && styles.optionIconWrapSelected]}>
            <Icon name={opt.icon as any} size={22} color={selected === opt.id ? "#fff" : "#111827"} />
          </View>
          <Text style={[styles.optionCardText, selected === opt.id && styles.optionCardTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function StepAccomplish({
  selected,
  onSelect,
}: {
  selected?: GoalType
  onSelect: (g: GoalType) => void
}) {
  const options: { id: GoalType; label: string; icon: string }[] = [
    { id: "eat_healthier", label: "Eat and live healthier", icon: "nutrition" },
    { id: "boost_energy", label: "Boost my energy and mood", icon: "sunny" },
    { id: "stay_motivated", label: "Stay motivated and consistent", icon: "barbell" },
    { id: "feel_better_body", label: "Feel better about my body", icon: "body" },
  ]
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>What would you like to accomplish?</Text>
      {options.map((opt) => (
        <Pressable
          key={opt.id}
          style={[styles.optionCard, selected === opt.id && styles.optionCardSelected]}
          onPress={() => onSelect(opt.id)}
        >
          <View style={[styles.optionIconWrap, selected === opt.id && styles.optionIconWrapSelected]}>
            <Icon name={opt.icon as any} size={22} color={selected === opt.id ? "#fff" : "#111827"} />
          </View>
          <Text style={[styles.optionCardText, selected === opt.id && styles.optionCardTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function StepGreatPotential() {
  const labels = ["3 Days", "7 Days", "30 Days"]
  const potentialData = [30, 55, 95]
  const chartData = {
    labels,
    datasets: [{ data: potentialData, color: (opacity = 1) => `rgba(194, 65, 12, ${opacity})`, strokeWidth: 2 }],
  }
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>You have great potential to crush your goal</Text>
      <View style={styles.chartCard}>
        <Text style={styles.chartCardTitle}>Your weight transition</Text>
        <LineChart
          data={chartData}
          width={CHART_WIDTH}
          height={180}
          chartConfig={{
            ...lineChartConfig,
            color: (opacity = 1) => `rgba(194, 65, 12, ${opacity})`,
          }}
          bezier
          style={styles.lineChart}
          withInnerLines={true}
          withOuterLines={false}
          fromZero
          yAxisSuffix="%"
          segments={4}
        />
      </View>
    </View>
  )
}

function StepThankYou() {
  return (
    <View style={styles.stepRoot}>
      <View style={styles.thankYouCircle}>
        <View style={styles.thankYouCircleInner}>
          <Icon name="lock-closed" size={48} color="#111827" />
        </View>
      </View>
      <Text style={[styles.title, styles.textCenter]}>Thank you for trusting us!</Text>
      <View style={styles.privacyCard}>
        <Text style={[styles.privacyText, styles.textCenter]}>Your privacy and security matter to us.</Text>
        <Text style={[styles.privacySubtext, styles.textCenter]}>
          We promise to always keep your personal information private and secure.
        </Text>
      </View>
    </View>
  )
}

function StepNotifications({
  value,
  onSelect,
}: {
  value?: boolean
  onSelect: (v: boolean) => void
}) {
  const handleAllow = async () => {
    const { requestNotificationPermission } = await import("../../services/notifications")
    await requestNotificationPermission()
    onSelect(true)
  }
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Reach your goals with notifications</Text>
      <View style={styles.twoButtons}>
        <Pressable
          style={[styles.halfButton, value === false && styles.halfButtonSelected]}
          onPress={() => onSelect(false)}
        >
          <Icon name="notifications-off" size={22} color={value === false ? "#fff" : "#111827"} style={styles.halfButtonIcon} />
          <Text style={value === false ? styles.halfButtonText : styles.halfButtonTextUnselected}>Don't Allow</Text>
        </Pressable>
        <Pressable
          style={[styles.halfButton, value === true && styles.halfButtonSelected]}
          onPress={handleAllow}
        >
          <Icon name="notifications" size={22} color={value === true ? "#fff" : "#111827"} style={styles.halfButtonIcon} />
          <Text style={value === true ? styles.halfButtonText : styles.halfButtonTextUnselected}>Allow</Text>
        </Pressable>
      </View>
    </View>
  )
}

const RUNNER_IMAGE_URI = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800"

function StepBurnedCalories({
  value,
  onSelect,
}: {
  value?: boolean
  onSelect: (v: boolean) => void
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Add calories burned back to your daily goal?</Text>
      <View style={styles.runnerCard}>
        <Image source={{ uri: RUNNER_IMAGE_URI }} style={styles.runnerBackgroundImage} resizeMode="cover" />
        <View style={styles.runnerOverlay}>
          <Text style={styles.runnerOverlayLabel}>Today's goal</Text>
          <View style={styles.runnerOverlayRow}>
            <Icon name="flame" size={20} color="#111827" />
            <Text style={styles.runnerOverlayValue}>500 Cals</Text>
          </View>
          <View style={styles.runnerOverlayRow}>
            <Icon name="walk" size={18} color="#111827" />
            <Text style={styles.runnerOverlayText}>Running</Text>
            <Text style={styles.runnerOverlayCals}>+100 cals</Text>
          </View>
        </View>
      </View>
      <View style={styles.twoButtons}>
        <Pressable
          style={[styles.halfButton, value === false && styles.halfButtonSelected]}
          onPress={() => onSelect(false)}
        >
          <Icon name="close-circle" size={22} color={value === false ? "#fff" : "#111827"} style={styles.halfButtonIcon} />
          <Text style={value === false ? styles.halfButtonText : styles.halfButtonTextUnselected}>No</Text>
        </Pressable>
        <Pressable
          style={[styles.halfButton, value === true && styles.halfButtonSelected]}
          onPress={() => onSelect(true)}
        >
          <Icon name="flash" size={22} color={value === true ? "#fff" : "#111827"} style={styles.halfButtonIcon} />
          <Text style={value === true ? styles.halfButtonText : styles.halfButtonTextUnselected}>Yes</Text>
        </Pressable>
      </View>
    </View>
  )
}

function StepRollover({
  value,
  onSelect,
}: {
  value?: boolean
  onSelect: (v: boolean) => void
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Rollover extra calories to the next day?</Text>
      <View style={styles.rolloverPill}>
        <Text style={styles.rolloverHintText}>Rollover up to <Text style={styles.rolloverCalsHighlight}>200 cals</Text></Text>
      </View>
      <View style={styles.rolloverInfographic}>
        <View style={styles.rolloverCard}>
          <View>
            <View style={styles.rolloverCardHeader}>
              <Icon name="flame" size={16} color="#dc2626" />
              <Text style={styles.rolloverCardTitleRed}>Yesterday</Text>
            </View>
            <Text style={styles.rolloverBigText}>350/500</Text>
          </View>
          <View style={styles.rolloverCircleWrap}>
            <View style={[styles.rolloverCircle, styles.rolloverCirclePartial]} />
            <Text style={styles.rolloverBubbleTextPlain}>150 left</Text>
          </View>
        </View>
        <View style={styles.rolloverCard}>
          <View>
            <View style={styles.rolloverCardHeader}>
              <Icon name="flame" size={16} color="#374151" />
              <Text style={styles.rolloverCardTitle}>Today</Text>
            </View>
            <Text style={styles.rolloverBigText}>350/650</Text>
            <View style={styles.rolloverRolledPill}>
              <Icon name="arrow-undo" size={14} color="#3b82f6" />
              <Text style={styles.rolloverRolledText}>+150</Text>
            </View>
          </View>
          <View style={styles.rolloverCircleWrap}>
            <View style={[styles.rolloverCircle, styles.rolloverCirclePartial2]} />
            <Text style={styles.rolloverBubbleTextPlain}>150+
150</Text>
          </View>
        </View>
      </View>
      <View style={styles.twoButtons}>
        <Pressable
          style={[styles.halfButton, value === false && styles.halfButtonSelected]}
          onPress={() => onSelect(false)}
        >
          <Icon name="close-circle" size={22} color={value === false ? "#fff" : "#111827"} style={styles.halfButtonIcon} />
          <Text style={value === false ? styles.halfButtonText : styles.halfButtonTextUnselected}>No</Text>
        </Pressable>
        <Pressable
          style={[styles.halfButton, value === true && styles.halfButtonSelected]}
          onPress={() => onSelect(true)}
        >
          <Icon name="refresh" size={22} color={value === true ? "#fff" : "#111827"} style={styles.halfButtonIcon} />
          <Text style={value === true ? styles.halfButtonText : styles.halfButtonTextUnselected}>Yes</Text>
        </Pressable>
      </View>
    </View>
  )
}

function StepRating() {
  return (
    <View style={styles.stepRoot}>
      <Text style={[styles.title, styles.textCenter]}>Give us a rating</Text>
      <View style={styles.ratingCard}>
        <Text style={styles.ratingScore}>4.8</Text>
        <View style={styles.ratingStarsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Icon key={i} name="star" size={24} color="#f59e0b" />
          ))}
        </View>
        <Text style={styles.ratingCount}>100K+ App Ratings</Text>
      </View>
      <Text style={[styles.socialProof, styles.textCenter]}>CalCounter was made for people like you</Text>
      <View style={styles.ratingAvatars}>
        <View style={styles.ratingAvatar}>
          <Image source={{ uri: "https://i.pravatar.cc/100?img=1" }} style={styles.ratingAvatarImage} />
        </View>
        <View style={[styles.ratingAvatar, styles.ratingAvatarOverlap]}>
          <Image source={{ uri: "https://i.pravatar.cc/100?img=2" }} style={styles.ratingAvatarImage} />
        </View>
        <View style={[styles.ratingAvatar, styles.ratingAvatarOverlap]}>
          <Image source={{ uri: "https://i.pravatar.cc/100?img=3" }} style={styles.ratingAvatarImage} />
        </View>
      </View>
      <Text style={[styles.userCount, styles.textCenter]}>2M+ CalCounter Users</Text>
      <View style={styles.testimonialCard}>
        <View style={styles.testimonialHeader}>
          <View style={styles.testimonialAvatar}>
            <Image source={{ uri: "https://i.pravatar.cc/100?img=12" }} style={styles.testimonialAvatarImage} />
          </View>
          <View style={styles.testimonialMeta}>
            <Text style={styles.testimonialName}>Jake Sullivan</Text>
            <View style={styles.testimonialStars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Icon key={i} name="star" size={14} color="#f59e0b" />
              ))}
            </View>
          </View>
        </View>
        <Text style={styles.testimonialQuote}>
          I lost 15 lbs in 2 months! I was about to go on Ozempic but decided to give this app a shot and it worked.
        </Text>
      </View>
    </View>
  )
}

function StepReferral({
  value,
  onChangeText,
}: {
  value: string
  onChangeText: (s: string) => void
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Enter referral code</Text>
      <Text style={styles.subtitle}>(optional)</Text>
      <Text style={styles.hint}>You can skip this step</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Referral Code"
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="characters"
        autoCorrect={false}
      />
    </View>
  )
}

function StepTimeToGenerate() {
  return (
    <View style={[styles.stepRoot, styles.centeredStep, { flex: 1 }]}>
      <View style={styles.allDoneCircle}>
        <Icon name="checkmark" size={48} color="#ea580c" />
      </View>
      <View style={styles.allDoneRow}>
        <View style={styles.allDoneCheckBadge}>
          <Icon name="checkmark-circle" size={20} color="#ea580c" />
        </View>
        <Text style={styles.allDoneCheck}>All done!</Text>
      </View>
      <Text style={[styles.title, styles.textCenter]}>Time to generate your custom plan!</Text>
    </View>
  )
}

const SETUP_STEPS = [
  "Calculating calories...",
  "Calculating carbs...",
  "Calculating protein...",
  "Calculating fats...",
  "Calculating sodium...",
  "Calculating fiber...",
  "Calculating sugar...",
  "Calculating water...",
  "Saving your plan...",
]

function StepSettingUp({
  answers,
  onPlanReady,
}: {
  answers: OnboardingAnswers
  onPlanReady: (plan: import("../../hooks/useOnboarding").RecommendedGoals) => void
}) {
  const [progress, setProgress] = useState(0)
  const [stepLabel, setStepLabel] = useState(SETUP_STEPS[0])

  useEffect(() => {
    const plan = computeRecommendations(answers)
    let step = 0
    const totalSteps = SETUP_STEPS.length
    const interval = setInterval(() => {
      if (step < totalSteps) {
        setStepLabel(SETUP_STEPS[step])
        setProgress(Math.min(100, Math.round(((step + 1) / totalSteps) * 100)))
        step += 1
      }
      if (step >= totalSteps) {
        clearInterval(interval)
        setProgress(100)
        setStepLabel("Done!")
        onPlanReady(plan)
      }
    }, 400)
    return () => clearInterval(interval)
  }, [answers, onPlanReady])

  return (
    <View style={styles.stepRoot}>
      <Text style={styles.percentText}>{progress}%</Text>
      <Text style={styles.title}>We're setting up everything for you</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.loadingSubtext}>{stepLabel}</Text>
      <View style={styles.planCard}>
        <Text style={styles.planCardTitle}>Daily recommendation for</Text>
        <Text style={styles.planCardItem}>• Calories</Text>
        <Text style={styles.planCardItem}>• Carbs</Text>
        <Text style={styles.planCardItem}>• Protein</Text>
        <Text style={styles.planCardItem}>• Fats</Text>
        <Text style={styles.planCardItem}>• Sodium</Text>
        <Text style={styles.planCardItem}>• Fiber</Text>
        <Text style={styles.planCardItem}>• Sugar</Text>
        <Text style={styles.planCardItem}>• Water</Text>
      </View>
    </View>
  )
}

function StepPlanReady({ answers }: { answers: OnboardingAnswers }) {
  const recommended = computeRecommendations(answers)
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Congratulations your custom plan is ready!</Text>
      <View style={styles.planSummary}>
        <Text style={styles.planSummaryTitle}>Daily Recommendation</Text>
        <Text style={styles.planSummarySub}>You can edit this any time</Text>
        <View style={styles.planSummaryRow}>
          <Text style={styles.planSummaryLabel}>Calories</Text>
          <Text style={styles.planSummaryValue}>{recommended.calorieGoal}</Text>
        </View>
        <View style={styles.planSummaryRow}>
          <Text style={styles.planSummaryLabel}>Carbs</Text>
          <Text style={styles.planSummaryValue}>{recommended.carbsGoal}g</Text>
        </View>
        <View style={styles.planSummaryRow}>
          <Text style={styles.planSummaryLabel}>Protein</Text>
          <Text style={styles.planSummaryValue}>{recommended.proteinGoal}g</Text>
        </View>
        <View style={styles.planSummaryRow}>
          <Text style={styles.planSummaryLabel}>Fats</Text>
          <Text style={styles.planSummaryValue}>{recommended.fatGoal}g</Text>
        </View>
        {recommended.sodiumGoal != null && (
          <View style={styles.planSummaryRow}>
            <Text style={styles.planSummaryLabel}>Sodium</Text>
            <Text style={styles.planSummaryValue}>{recommended.sodiumGoal}mg</Text>
          </View>
        )}
        {recommended.fiberGoal != null && (
          <View style={styles.planSummaryRow}>
            <Text style={styles.planSummaryLabel}>Fiber</Text>
            <Text style={styles.planSummaryValue}>{recommended.fiberGoal}g</Text>
          </View>
        )}
        {recommended.sugarGoal != null && (
          <View style={styles.planSummaryRow}>
            <Text style={styles.planSummaryLabel}>Sugar</Text>
            <Text style={styles.planSummaryValue}>{recommended.sugarGoal}g</Text>
          </View>
        )}
        {recommended.waterGoalMl != null && (
          <View style={styles.planSummaryRow}>
            <Text style={styles.planSummaryLabel}>Water</Text>
            <Text style={styles.planSummaryValue}>{recommended.waterGoalMl} ml</Text>
          </View>
        )}
      </View>
    </View>
  )
}

function StepCreateAccount() {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>Create an account</Text>
      <Text style={styles.subtitle}>Sign in later from Settings to sync across devices.</Text>
    </View>
  )
}

function StepTryFree() {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.title}>We want you to try CalCounter for free</Text>
      <Text style={styles.subtitle}>
        Start your free trial to use AI calorie scanning and track your progress.
      </Text>
      <View style={styles.trialReminderRow}>
        <Icon name="notifications-outline" size={18} color="#111827" />
        <Text style={styles.trialReminderText}>
          We will send you a reminder before your free trial ends.
        </Text>
      </View>
      <Text style={styles.noPayment}>✓ No Payment Due Now</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 20,
    color: "#111827",
  },
  backArrowDisabled: {
    color: "#9ca3af",
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#111827",
    borderRadius: 3,
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  stepRoot: { paddingTop: 24 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 24,
  },
  hint: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: "#111827",
    backgroundColor: "#111827",
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionIconWrapSelected: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  optionCardContent: {
    flex: 1,
  },
  optionCardText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  optionCardTextCentered: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    flex: 1,
  },
  optionCardTextSelected: {
    color: "#ffffff",
  },
  optionCardSubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  optionCardSubtextSelected: {
    color: "rgba(255,255,255,0.9)",
  },
  dotIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  singleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#111827",
  },
  triDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#111827",
  },
  triDotTop: { top: 10, left: 17 },
  triDotLeft: { bottom: 10, left: 10 },
  triDotRight: { bottom: 10, right: 10 },
  sixDotRow: {
    flexDirection: "row",
    gap: 4,
  },
  smallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#111827",
  },
  smallDotSelected: {
    backgroundColor: "#fff",
  },
  dotSelected: {
    backgroundColor: "#fff",
  },
  halfButtonIcon: {
    marginRight: 4,
  },
  halfButtonTextUnselected: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  textInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  unitToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  unitToggleRowCentered: {
    alignSelf: "center",
  },
  unitToggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  unitToggleLabelActive: {
    color: "#111827",
  },
  unitChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  unitChipActive: {
    backgroundColor: "#111827",
  },
  unitChipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  unitChipTextActive: {
    color: "#fff",
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  pickerWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 120,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    overflow: "hidden",
  },
  wheelWrap: {
    flex: 1,
    minWidth: 0,
    height: WHEEL_VISIBLE_HEIGHT,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  desiredWeightWheel: {
    marginTop: 12,
    alignSelf: "stretch",
  },
  wheelScroll: {
    height: WHEEL_VISIBLE_HEIGHT,
  },
  wheelHighlight: {
    position: "absolute",
    left: 8,
    right: 8,
    top: (WHEEL_VISIBLE_HEIGHT - WHEEL_ITEM_HEIGHT) / 2,
    height: WHEEL_ITEM_HEIGHT,
    backgroundColor: "rgba(229, 231, 235, 0.8)",
    borderRadius: 10,
    zIndex: 0,
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  wheelItemText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  horizontalWheelWrap: {
    height: 56,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    marginVertical: 16,
  },
  horizontalWheelScroll: {
    height: 56,
  },
  horizontalWheelItem: {
    width: HORIZONTAL_WHEEL_ITEM_WIDTH,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  horizontalWheelItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  horizontalWheelHighlight: {
    position: "absolute",
    left: "50%",
    marginLeft: -HORIZONTAL_WHEEL_ITEM_WIDTH / 2,
    top: 8,
    width: HORIZONTAL_WHEEL_ITEM_WIDTH,
    height: 40,
    backgroundColor: "rgba(229, 231, 235, 0.8)",
    borderRadius: 8,
    zIndex: 0,
  },
  picker: {
    height: 120,
    color: "#111827",
  },
  pickerItem: {
    fontSize: 18,
    color: "#111827",
  },
  centeredStep: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  realisticTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  realisticHighlight: {
    color: "#f97316",
  },
  realisticSubtext: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  sliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  sliderOption: {
    alignItems: "center",
    flex: 1,
  },
  sliderEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  sliderOptionLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  sliderOptionLabelSelected: {
    color: "#111827",
    fontWeight: "600",
  },
  speedIconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  speedIconWrap: {
    alignItems: "center",
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  sliderNative: {
    flex: 1,
    height: 40,
  },
  sliderMinMax: {
    fontSize: 12,
    color: "#6b7280",
    minWidth: 44,
  },
  speedLabelCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  speedLabelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  valueDisplay: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  twoButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  halfButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  halfButtonSelected: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  halfButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  chartCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  chartCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 120,
    justifyContent: "flex-end",
  },
  chartLine: {
    height: 4,
    backgroundColor: "#111827",
    borderRadius: 2,
    marginBottom: 8,
    width: "80%",
  },
  chartLineRed: {
    backgroundColor: "#dc2626",
    width: "70%",
  },
  chartStat: {
    fontSize: 14,
    color: "#111827",
    marginTop: 12,
    textAlign: "center",
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  lineChartNoYAxis: {
    paddingLeft: 0,
    marginLeft: -8,
  },
  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  chartLegendPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  chartLegendText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  chartLegendTraditional: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  textCenter: {
    textAlign: "center",
  },
  comparisonCard: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 20,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
  },
  comparisonColumn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 200,
  },
  comparisonColumnDark: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 200,
  },
  comparisonBarSpacer: {
    flex: 1,
    minHeight: 24,
  },
  comparisonBarSmall: {
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  comparisonBarLarge: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 12,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    marginTop: 12,
  },
  comparisonBarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  comparisonBarTextLight: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  comparisonLeft: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  comparisonRight: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  comparisonLabelLight: {
    color: "#ffffff",
  },
  comparisonValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#9ca3af",
  },
  comparisonValueLight: {
    color: "#ffffff",
  },
  thankYouCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#e9d5ff",
    borderWidth: 2,
    borderColor: "#c4b5fd",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    alignSelf: "center",
  },
  thankYouCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  privacyCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  privacyText: {
    fontSize: 16,
    color: "#111827",
    marginBottom: 8,
  },
  privacySubtext: {
    fontSize: 14,
    color: "#6b7280",
  },
  runnerCard: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    minHeight: 180,
    backgroundColor: "#e5e7eb",
  },
  runnerBackgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  runnerOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  runnerOverlayLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  runnerOverlayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  runnerOverlayValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  runnerOverlayText: {
    fontSize: 14,
    color: "#111827",
  },
  runnerOverlayCals: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  rolloverPill: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  rolloverHint: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  rolloverHintText: {
    fontSize: 14,
    color: "#374151",
  },
  rolloverCalsHighlight: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  rolloverInfographic: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  rolloverCard: {
    flex: 1,
    minHeight: 160,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "space-between",
  },
  rolloverCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  rolloverCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  rolloverCardTitleRed: {
    fontSize: 14,
    fontWeight: "600",
    color: "#dc2626",
  },
  rolloverBigText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  rolloverCircleWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  rolloverCircle: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: "#111827",
  },
  rolloverCirclePartial: {
    borderRightColor: "transparent",
    borderTopColor: "transparent",
    transform: [{ rotate: "-90deg" }],
  },
  rolloverCirclePartial2: {
    borderRightColor: "transparent",
    borderTopColor: "transparent",
    transform: [{ rotate: "-45deg" }],
  },
  rolloverBubbleTextPlain: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 14,
  },
  rolloverRolledPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  rolloverRolledText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  ratingCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  ratingScore: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  ratingStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginVertical: 8,
  },
  ratingStars: {
    fontSize: 18,
    color: "#f59e0b",
    marginVertical: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  ratingAvatars: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  ratingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingAvatarOverlap: {
    marginLeft: -12,
  },
  ratingAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  testimonialCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  testimonialHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  testimonialAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  testimonialAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  testimonialMeta: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  testimonialStars: {
    flexDirection: "row",
    gap: 2,
  },
  testimonialQuote: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  socialProof: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  userCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  allDoneCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fed7aa",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    alignSelf: "center",
  },
  allDoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  allDoneCheckBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
  },
  allDoneCheck: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  percentText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  planCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  planCardItem: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 4,
  },
  planSummary: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  planSummaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  planSummarySub: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  planSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  planSummaryLabel: {
    fontSize: 16,
    color: "#374151",
  },
  planSummaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  noPayment: {
    fontSize: 16,
    color: "#059669",
    marginTop: 16,
  },
  trialReminderRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trialReminderText: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
  continueButton: {
    backgroundColor: "#111827",
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
  continueButtonTextDisabled: {
    color: "#9ca3af",
  },
})
