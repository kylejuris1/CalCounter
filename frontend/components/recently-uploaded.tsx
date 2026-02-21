import { useState } from "react"
import { View, Text, Image, StyleSheet, Pressable, Alert } from "react-native"
import Svg, { Path } from "react-native-svg"
import { FoodItem } from "../hooks/useFoodData"
import EditFoodModal from "./edit-food-modal"

interface RecentlyUploadedProps {
  foods: FoodItem[]
  onDelete: (id: string) => void
  onUpdate: (food: FoodItem) => void
}

export default function RecentlyUploaded({ foods, onDelete, onUpdate }: RecentlyUploadedProps) {
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null)

  const handleDelete = (food: FoodItem) => {
    Alert.alert(
      "Delete Food Item",
      `Are you sure you want to delete "${food.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(food.id),
        },
      ]
  )
}

  if (foods.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recently uploaded</Text>
        <View style={styles.emptyCard}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageText}>🥗</Text>
          </View>
          <View style={styles.placeholderLines}>
            <View style={styles.placeholderLine} />
            <View style={styles.placeholderLineShort} />
          </View>
        </View>
        <Text style={styles.tapHint}>Tap + to add your first meal of the day</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recently uploaded</Text>

      <View style={styles.foodsList}>
        {foods.slice(0, 10).map((food) => (
          <View key={food.id} style={styles.foodCard}>
            {food.imageUrl ? (
              <Image source={{ uri: food.imageUrl }} style={styles.foodImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imageText}>🍽️</Text>
              </View>
            )}

            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{food.name}</Text>
              {food.quantity && (
                <Text style={styles.quantityText}>{food.quantity}</Text>
              )}
              <View style={styles.caloriesRow}>
                <View style={styles.dot} />
                <Text style={styles.caloriesText}>{food.calories} kcal</Text>
              </View>

              <View style={styles.macrosRow}>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: "#ef4444" }]} />
                  <Text style={styles.macroText}>{food.protein}g</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: "#f97316" }]} />
                  <Text style={styles.macroText}>{food.carbs}g</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: "#3b82f6" }]} />
                  <Text style={styles.macroText}>{food.fat}g</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <Text style={styles.time}>{food.time}</Text>
              <View style={styles.actionButtons}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => setEditingFood(food)}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </Svg>
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDelete(food)}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M3 6h18" />
                    <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </Svg>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>

      <EditFoodModal
        visible={editingFood !== null}
        onClose={() => setEditingFood(null)}
        food={editingFood}
        onSave={(updatedFood) => {
          onUpdate(updatedFood)
          setEditingFood(null)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  foodsList: {},
  foodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  placeholderLines: {
    flex: 1,
    marginLeft: 16,
  },
  placeholderLine: {
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 8,
    width: "70%",
  },
  placeholderLineShort: {
    height: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    width: "50%",
  },
  tapHint: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  imageText: {
    fontSize: 32,
  },
  foodInfo: {
    flex: 1,
    marginLeft: 16,
  },
  foodName: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 14,
  },
  quantityText: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 2,
    marginBottom: 4,
  },
  caloriesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
    marginRight: 4,
  },
  caloriesText: {
    color: "#6b7280",
    fontSize: 12,
  },
  macrosRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  macroText: {
    fontSize: 12,
    color: "#6b7280",
  },
  actionsContainer: {
    alignItems: "flex-end",
    marginLeft: 16,
  },
  time: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  foodImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
})
