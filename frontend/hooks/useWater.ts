import { useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const WATER_KEY_PREFIX = "@calorie_watcher_water_"
const STEP_ML = 250

export function useWater(dateStr: string) {
  const [waterMl, setWaterMl] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(WATER_KEY_PREFIX + dateStr)
      .then((value) => {
        setWaterMl(value != null ? parseInt(value, 10) || 0 : 0)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [dateStr])

  const persist = useCallback(
    (ml: number) => {
      setWaterMl(ml)
      AsyncStorage.setItem(WATER_KEY_PREFIX + dateStr, String(ml)).catch(() => {})
    },
    [dateStr]
  )

  const addWater = useCallback(() => {
    persist(Math.max(0, waterMl + STEP_ML))
  }, [waterMl, persist])

  const removeWater = useCallback(() => {
    persist(Math.max(0, waterMl - STEP_ML))
  }, [waterMl, persist])

  return { waterMl, addWater, removeWater, loaded }
}
