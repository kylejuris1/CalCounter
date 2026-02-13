import { View, Pressable, StyleSheet } from "react-native"
import Svg, { Path } from "react-native-svg"

interface FABProps {
  onPress: () => void
}

export default function FloatingActionButton({ onPress }: FABProps) {
  return (
    <Pressable style={styles.fab} onPress={onPress}>
      <View style={styles.fabInner}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <Path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </Svg>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
})

