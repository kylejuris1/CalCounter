import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = '@calorie_watcher_onboarding_complete';
const ONBOARDING_ANSWERS_KEY = '@calorie_watcher_onboarding_answers';
export const GUEST_ID_KEY = '@calorie_watcher_guest_id';

export type DietType = 'classic' | 'pescatarian' | 'vegetarian' | 'vegan';
export type GoalType = 'eat_healthier' | 'boost_energy' | 'stay_motivated' | 'feel_better_body';
export type GoalChoiceType = 'lose' | 'maintain' | 'gain';
export type GenderType = 'male' | 'female' | 'other';

export type WhereHeardType =
  | 'tik_tok' | 'youtube' | 'google' | 'play_store' | 'facebook'
  | 'friend_or_family' | 'tv' | 'instagram' | 'x' | 'other';

export interface OnboardingAnswers {
  gender?: GenderType;
  /** 1 = 0-2, 4 = 3-5, 7 = 6+ */
  workoutsPerWeek?: number;
  whereHeard?: WhereHeardType;
  triedOtherApps?: boolean;
  weightKg?: number;
  heightCm?: number;
  birthDate?: string; // YYYY-MM-DD
  goal?: GoalChoiceType; // lose / maintain / gain
  desiredWeight?: number;
  desiredWeightUnit?: 'kg' | 'lbs';
  weightLossSpeedPerWeek?: number; // e.g. 0.2, 1.5, 3.0
  obstacles?: string[];
  diet?: DietType;
  accomplish?: GoalType; // what would you like to accomplish
  rolloverCalories?: boolean;
  addBurnedCaloriesToGoal?: boolean;
  notificationsEnabled?: boolean;
  referralCode?: string;
}

export interface RecommendedGoals {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  sodiumGoal?: number;
  fiberGoal?: number;
  sugarGoal?: number;
  waterGoalMl?: number;
}

const GOALS_STORAGE_KEY = '@calorie_watcher_goals';

/**
 * Compute recommended daily calories and macros from onboarding answers.
 * Uses Mifflin-St Jeor BMR, activity factor, goal-based adjustment, and diet-based macro split.
 */
export function computeRecommendations(answers: OnboardingAnswers): RecommendedGoals {
  const { weightKg, heightCm, birthDate, gender, diet, goal, accomplish, weightLossSpeedPerWeek } = answers;
  const hasBodyInputs = typeof weightKg === 'number' && typeof heightCm === 'number' && birthDate && gender;

  let bmr = 1600; // fallback
  if (hasBodyInputs && weightKg > 0 && heightCm > 0) {
    const age = birthDate ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 30;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
    bmr = Math.max(800, Math.min(4000, bmr));
  }

  const activityFactor = 1.375; // light-moderate
  let tdee = bmr * activityFactor;

  // Goal (lose/maintain/gain): adjust calories so the plan matches the user's aim
  // ~500 kcal/day deficit per 1 lb/week loss; similar surplus for gain
  const speed = typeof weightLossSpeedPerWeek === 'number' && weightLossSpeedPerWeek > 0 ? weightLossSpeedPerWeek : 1;
  const dailyDelta = Math.round(speed * 500); // 500 cal/day per 1 lb/week
  if (goal === 'lose') {
    tdee -= dailyDelta;
  } else if (goal === 'gain') {
    tdee += dailyDelta;
  }
  // Accomplish-based tweak
  if (accomplish === 'feel_better_body') {
    tdee -= 100;
  } else if (accomplish === 'eat_healthier' || accomplish === 'boost_energy') {
    tdee -= 50;
  }
  const calorieGoal = Math.round(Math.max(1200, Math.min(4000, tdee)));

  // Protein: higher for body comp / muscle, moderate for others. Scale by weight if available.
  const proteinPerKg = accomplish === 'feel_better_body' || accomplish === 'stay_motivated' ? 1.8 : 1.2;
  const proteinBase = hasBodyInputs && weightKg ? Math.round(weightKg * proteinPerKg) : (accomplish === 'feel_better_body' ? 140 : 120);
  const proteinGoal = Math.max(50, Math.min(250, proteinBase));

  // Carbs and fat from remaining calories. Diet tweaks (vegan/vegetarian often higher carb).
  const remainingKcal = calorieGoal - proteinGoal * 4;
  const carbRatio = diet === 'vegan' || diet === 'vegetarian' ? 0.55 : 0.50;
  const carbsGoal = Math.round(Math.max(80, Math.min(350, (remainingKcal * carbRatio) / 4)));
  const fatKcal = remainingKcal - carbsGoal * 4;
  const fatGoal = Math.round(Math.max(30, Math.min(120, fatKcal / 9)));

  // Sodium: ~2300 mg default, scale slightly by calories
  const sodiumGoal = Math.round(2000 + (calorieGoal - 2000) * 0.05);
  // Fiber: 14g per 1000 kcal
  const fiberGoal = Math.round(Math.max(25, Math.min(45, (calorieGoal / 1000) * 14)));
  // Sugar: ~10% of calories from sugar, ~4 kcal/g
  const sugarGoal = Math.round(Math.max(30, Math.min(80, (calorieGoal * 0.1) / 4)));
  // Water: ~35 ml per kg body weight, or ~2.5 L default
  const waterGoalMl = hasBodyInputs && weightKg ? Math.round(weightKg * 35) : 2500;

  return {
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    sodiumGoal: Math.max(1500, Math.min(3500, sodiumGoal)),
    fiberGoal,
    sugarGoal,
    waterGoalMl,
  };
}

export async function saveOnboardingGoals(plan: RecommendedGoals): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    const merged = { ...existing, ...plan };
    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('[Onboarding] saveOnboardingGoals failed', e);
    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(plan));
  }
}

/** Merge onboarding weight/height/goal weight into stored goals so Progress tab shows them. */
export async function saveOnboardingBodyToGoals(answers: OnboardingAnswers): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
    const goals = raw ? JSON.parse(raw) : {};
    const goalWeightKg =
      answers.desiredWeight != null
        ? (answers.desiredWeightUnit === 'lbs'
            ? answers.desiredWeight * 0.453592
            : answers.desiredWeight)
        : undefined;
    const next = {
      ...goals,
      ...(answers.weightKg != null && { weightKg: answers.weightKg }),
      ...(answers.heightCm != null && { heightCm: answers.heightCm }),
      ...(goalWeightKg != null && { goalWeightKg }),
      ...(answers.addBurnedCaloriesToGoal != null && { addBurnedCaloriesToGoal: answers.addBurnedCaloriesToGoal }),
      ...(answers.rolloverCalories != null && { rolloverCalories: answers.rolloverCalories }),
    };
    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('[Onboarding] saveOnboardingBodyToGoals failed', e);
  }
}

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [answers, setAnswersState] = useState<OnboardingAnswers>({});
  const [guestId, setGuestIdState] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [completeRaw, answersRaw, guestIdRaw] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
          AsyncStorage.getItem(ONBOARDING_ANSWERS_KEY),
          AsyncStorage.getItem(GUEST_ID_KEY),
        ]);
        setIsComplete(completeRaw === 'true');
        if (answersRaw) {
          setAnswersState(JSON.parse(answersRaw));
        }
        setGuestIdState(guestIdRaw || null);
      } catch (e) {
        console.error('[Onboarding] load failed', e);
        setIsComplete(false);
      }
    })();
  }, []);

  const setOnboardingComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setIsComplete(true);
  }, []);

  const setGuestId = useCallback(async (id: string) => {
    await AsyncStorage.setItem(GUEST_ID_KEY, id);
    setGuestIdState(id);
  }, []);

  const clearGuestId = useCallback(async () => {
    await AsyncStorage.removeItem(GUEST_ID_KEY);
    setGuestIdState(null);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    await AsyncStorage.removeItem(ONBOARDING_ANSWERS_KEY);
    await AsyncStorage.removeItem(GUEST_ID_KEY);
    setIsComplete(false);
    setAnswersState({});
    setGuestIdState(null);
  }, []);

  const setAnswers = useCallback(async (next: OnboardingAnswers | ((prev: OnboardingAnswers) => OnboardingAnswers)) => {
    setAnswersState((prev) => {
      const nextAnswers = typeof next === 'function' ? next(prev) : { ...prev, ...next };
      AsyncStorage.setItem(ONBOARDING_ANSWERS_KEY, JSON.stringify(nextAnswers)).catch(console.error);
      return nextAnswers;
    });
  }, []);

  return {
    isComplete,
    isLoading: isComplete === null,
    answers,
    guestId,
    setOnboardingComplete,
    setGuestId,
    clearGuestId,
    resetOnboarding,
    setAnswers,
  };
}
