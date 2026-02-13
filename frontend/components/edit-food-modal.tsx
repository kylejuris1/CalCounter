import { useState, useEffect } from "react"
import { View, Text, Modal, Pressable, StyleSheet, TextInput, Alert } from "react-native"
import { FoodItem } from "../hooks/useFoodData"

interface EditFoodModalProps {
  visible: boolean
  onClose: () => void
  food: FoodItem | null
  onSave: (updatedFood: FoodItem) => void
}

export default function EditFoodModal({
  visible,
  onClose,
  food,
  onSave,
}: EditFoodModalProps) {
  const [name, setName] = useState("")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fat, setFat] = useState("")

  useEffect(() => {
    if (visible && food) {
      setName(food.name)
      setCalories(food.calories.toString())
      setProtein(food.protein.toString())
      setCarbs(food.carbs.toString())
      setFat(food.fat.toString())
    }
  }, [visible, food])

  const handleSave = () => {
    if (!food) return

    const cal = parseInt(calories) || 0
    const prot = parseInt(protein) || 0
    const carb = parseInt(carbs) || 0
    const fatVal = parseInt(fat) || 0

    if (name.trim() === "") {
      Alert.alert("Invalid Input", "Food name cannot be empty")
      return
    }

    const updatedFood: FoodItem = {
      ...food,
      name: name.trim(),
      calories: Math.max(0, cal),
      protein: Math.max(0, prot),
      carbs: Math.max(0, carb),
      fat: Math.max(0, fatVal),
    }

    onSave(updatedFood)
    onClose()
  }

  if (!food) return null

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Edit Food Item</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Food Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Food name"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Calories</Text>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#6b7280"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#6b7280"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#6b7280"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#6b7280"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#374151",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 12,
    color: "#ffffff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#374151",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#f97316",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

