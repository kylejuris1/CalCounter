import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FoodItem {
  id: string;
  name: string;
  time: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  quantity?: string;
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const STORAGE_KEY = '@calorie_watcher_foods';

export function useFoodData() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load foods from storage on mount
  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFoods(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading foods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFoods = async (newFoods: FoodItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFoods));
      setFoods(newFoods);
    } catch (error) {
      console.error('Error saving foods:', error);
    }
  };

  const addFood = async (foodData: any) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const dateStr = now.toISOString().split('T')[0];

    // Handle multiple food items from analysis
    const newFoods: FoodItem[] = foodData.foodItems?.map((item: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      name: item.name || 'Unknown Food',
      time: timeStr,
      date: dateStr,
      calories: Math.round(item.calories || 0),
      protein: Math.round(item.protein || 0),
      carbs: Math.round(item.carbs || 0),
      fat: Math.round(item.fat || 0),
      imageUrl: foodData.imageUrl,
      quantity: item.quantity,
    })) || [];

    const updatedFoods = [...newFoods, ...foods];
    await saveFoods(updatedFoods);
    return newFoods;
  };

  const getTodayFoods = (): FoodItem[] => {
    const today = new Date().toISOString().split('T')[0];
    return foods.filter(food => food.date === today);
  };

  const getTodayTotals = (): DailyTotals => {
    const todayFoods = getTodayFoods();
    return todayFoods.reduce(
      (totals, food) => ({
        calories: totals.calories + food.calories,
        protein: totals.protein + food.protein,
        carbs: totals.carbs + food.carbs,
        fat: totals.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getWeeklyData = () => {
    const weekData: { [key: string]: DailyTotals } = {};
    const today = new Date();
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayFoods = foods.filter(food => food.date === dateStr);
      weekData[dayName] = dayFoods.reduce(
        (totals, food) => ({
          calories: totals.calories + food.calories,
          protein: totals.protein + food.protein,
          carbs: totals.carbs + food.carbs,
          fat: totals.fat + food.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    }

    return weekData;
  };

  const deleteFood = async (id: string) => {
    const updatedFoods = foods.filter(food => food.id !== id);
    await saveFoods(updatedFoods);
  };

  const updateFood = async (updatedFood: FoodItem) => {
    const updatedFoods = foods.map(food => 
      food.id === updatedFood.id ? updatedFood : food
    );
    await saveFoods(updatedFoods);
  };

  const clearAllFoods = async () => {
    await saveFoods([]);
  };

  return {
    foods,
    isLoading,
    addFood,
    getTodayFoods,
    getTodayTotals,
    getWeeklyData,
    deleteFood,
    updateFood,
    clearAllFoods,
  };
}

