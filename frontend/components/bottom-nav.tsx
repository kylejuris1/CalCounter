import { View, Text, Pressable, StyleSheet } from "react-native"
import Svg, { Path, Circle, Rect } from "react-native-svg"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface BottomNavProps {
  activePage: string
  onPageChange: (page: string) => void
  darkMode?: boolean
}

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  )
}

function ProgressIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="12" width="4" height="9" rx="1" />
      <Rect x="10" y="8" width="4" height="13" rx="1" />
      <Rect x="17" y="4" width="4" height="17" rx="1" />
    </Svg>
  )
}

function SettingsIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  )
}

export default function BottomNav({ activePage, onPageChange, darkMode = false }: BottomNavProps) {
  const insets = useSafeAreaInsets()
  const pages = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "analytics", label: "Progress", icon: ProgressIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ]
  const c = darkMode ? darkStyles : styles
  const iconColorActive = darkMode ? "#ffffff" : "#111827"
  const iconColorInactive = darkMode ? "#9ca3af" : "#6b7280"

  return (
    <View style={[c.container, { paddingBottom: insets.bottom }]}>
      <View style={c.content}>
        {pages.map((page) => {
          const IconComponent = page.icon
          const isActive = activePage === page.id
          const iconColor = isActive ? iconColorActive : iconColorInactive

          return (
            <Pressable
              key={page.id}
              onPress={() => onPageChange(page.id)}
              style={c.tab}
            >
              <View style={[c.iconWrap, isActive && c.iconWrapActive]}>
                <IconComponent color={iconColor} />
              </View>
              <Text style={[c.label, isActive && c.activeLabel]}>
                {page.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 72,
    width: "100%",
  },
  tab: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "#e5e7eb",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 4,
  },
  activeLabel: {
    color: "#111827",
  },
})

const darkStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 72,
    width: "100%",
  },
  tab: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "#374151",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9ca3af",
    marginTop: 4,
  },
  activeLabel: {
    color: "#ffffff",
  },
})
