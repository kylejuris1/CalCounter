import { View, Text, Pressable, StyleSheet } from "react-native"
import Svg, { Path, Circle, Line } from "react-native-svg"

interface BottomNavProps {
  activePage: string
  onPageChange: (page: string) => void
}

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  )
}

function AnalyticsIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Line x1="12" y1="2" x2="12" y2="22" />
      <Line x1="4" y1="18" x2="4" y2="12" />
      <Line x1="20" y1="12" x2="20" y2="18" />
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

export default function BottomNav({ activePage, onPageChange }: BottomNavProps) {
  const pages = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "analytics", label: "Analytics", icon: AnalyticsIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {pages.map((page) => {
          const IconComponent = page.icon
          const isActive = activePage === page.id
          const iconColor = isActive ? "#ffffff" : "#6b7280"

          return (
            <Pressable
            key={page.id}
              onPress={() => onPageChange(page.id)}
              style={styles.tab}
            >
              <IconComponent color={iconColor} />
              <Text style={[styles.label, isActive && styles.activeLabel]}>
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
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 80,
    width: "100%",
  },
  tab: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 4,
  },
  activeLabel: {
    color: "#ffffff",
  },
})
