import { View, Text, Pressable, StyleSheet } from "react-native"

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={() => onTabChange("today")} style={styles.tab}>
        <View style={[styles.tabContent, activeTab === "today" && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === "today" && styles.activeTabText]}>
        Today
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={() => onTabChange("yesterday")} style={styles.tabLast}>
        <View style={[styles.tabContent, activeTab === "yesterday" && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === "yesterday" && styles.activeTabText]}>
        Yesterday
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    marginTop: 24,
    marginBottom: 32,
  },
  tab: {
    paddingBottom: 16,
    marginRight: 24,
  },
  tabLast: {
    paddingBottom: 16,
  },
  tabContent: {
    paddingBottom: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#ffffff",
  },
  tabText: {
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#ffffff",
  },
})
