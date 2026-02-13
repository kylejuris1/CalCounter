import { View, Text, Pressable, StyleSheet } from "react-native"

interface HeaderProps {
  onLogoClick?: () => void
}

export default function Header({ onLogoClick }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Pressable onPress={onLogoClick} style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.title}>Calorie Watcher</Text>
        </Pressable>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>⚡</Text>
          <Text style={styles.badgeText}>15</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
    backgroundColor: "#f97316",
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
