import { useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const THEME_KEY = "@calorie_watcher_dark_mode"

export function useTheme() {
  const [darkMode, setDarkModeState] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((value) => {
        setDarkModeState(value === "true")
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value)
    AsyncStorage.setItem(THEME_KEY, value ? "true" : "false").catch(() => {})
  }, [])

  return { darkMode, setDarkMode, loaded }
}
