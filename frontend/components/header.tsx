import { View, Text, Pressable, StyleSheet } from "react-native"

interface HeaderProps {
  onLogoClick?: () => void
  darkMode?: boolean
}

export default function Header({ onLogoClick, darkMode = false }: HeaderProps) {
  const c = darkMode ? darkStyles : styles
  return (
    <View style={c.container}>
      <View style={c.content}>
        <Pressable onPress={onLogoClick} style={c.logoContainer}>
          <View style={c.logoCircle}>
            <Text style={c.logoText}>C</Text>
          </View>
          <Text style={c.title}>CalCounter</Text>
        </Pressable>
        <View style={c.badge}>
          <Text style={c.badgeIcon}>⚡</Text>
          <Text style={c.badgeText}>15</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 8,
  },
  badge: {
    backgroundColor: "#e5e7eb",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeIcon: {
    color: "#111827",
    fontSize: 14,
  },
  badgeText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
})

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 8,
  },
  badge: {
    backgroundColor: "#374151",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeIcon: {
    color: "#ffffff",
    fontSize: 14,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
})
