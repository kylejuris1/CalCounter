import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@calorie_watcher_calories_burned';

export function useCaloriesBurned() {
  const [byDate, setByDate] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        setByDate(raw ? JSON.parse(raw) : {});
      } catch (e) {
        console.error('Error loading calories burned:', e);
      }
    })();
  }, []);

  const getCaloriesBurned = useCallback(
    (dateStr: string): number => byDate[dateStr] ?? 0,
    [byDate]
  );

  const setCaloriesBurned = useCallback(async (dateStr: string, value: number) => {
    const next = { ...byDate, [dateStr]: Math.max(0, value) };
    setByDate(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [byDate]);

  return { getCaloriesBurned, setCaloriesBurned, caloriesBurnedByDate: byDate };
}
