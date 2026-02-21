import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Goals {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  weightKg?: number;
  heightCm?: number;
  goalWeightKg?: number;
}

const STORAGE_KEY = '@calorie_watcher_goals';
const DEFAULT_GOALS: Goals = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
};

export function useGoals() {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [isLoading, setIsLoading] = useState(true);

  // Load goals from storage on mount
  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setGoals(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGoals = async (newGoals: Goals) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
      setGoals(newGoals);
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  const updateCalorieGoal = async (calories: number) => {
    const newGoals = { ...goals, calorieGoal: Math.max(0, calories) };
    await saveGoals(newGoals);
  };

  const updateMacroGoals = async (protein: number, carbs: number, fat: number) => {
    const newGoals = {
      ...goals,
      proteinGoal: Math.max(0, protein),
      carbsGoal: Math.max(0, carbs),
      fatGoal: Math.max(0, fat),
    };
    await saveGoals(newGoals);
  };

  const updateWeight = async (weightKg: number) => {
    const newGoals = { ...goals, weightKg: Math.max(0, weightKg) };
    await saveGoals(newGoals);
  };

  const updateGoalWeight = async (goalWeightKg: number) => {
    const newGoals = { ...goals, goalWeightKg: Math.max(0, goalWeightKg) };
    await saveGoals(newGoals);
  };

  const updateHeight = async (heightCm: number) => {
    const newGoals = { ...goals, heightCm: Math.max(0, heightCm) };
    await saveGoals(newGoals);
  };

  const resetToDefaults = async () => {
    await saveGoals(DEFAULT_GOALS);
  };

  return {
    goals,
    isLoading,
    updateCalorieGoal,
    updateMacroGoals,
    updateWeight,
    updateGoalWeight,
    updateHeight,
    resetToDefaults,
  };
}

