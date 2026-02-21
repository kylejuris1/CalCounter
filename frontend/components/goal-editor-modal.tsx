import { useState, useEffect } from "react"
import { View, Text, Modal, Pressable, StyleSheet, TextInput, Alert } from "react-native"

interface GoalEditorModalProps {
  visible: boolean
  onClose: () => void
  type: "calorie" | "macro"
  currentGoals?: {
    calorieGoal?: number
    proteinGoal?: number
    carbsGoal?: number
    fatGoal?: number
  }
  onSave: (values: any) => void
  light?: boolean
}

export default function GoalEditorModal({
  visible,
  onClose,
  type,
  currentGoals,
  onSave,
  light = false,
}: GoalEditorModalProps) {
  const isLight = light
  const theme = isLight ? lightModalTheme : darkModalTheme
  const [calorieGoal, setCalorieGoal] = useState("")
  const [proteinGoal, setProteinGoal] = useState("")
  const [carbsGoal, setCarbsGoal] = useState("")
  const [fatGoal, setFatGoal] = useState("")

  useEffect(() => {
    if (visible && currentGoals) {
      if (type === "calorie") {
        setCalorieGoal(currentGoals.calorieGoal?.toString() || "2000")
      } else {
        setProteinGoal(currentGoals.proteinGoal?.toString() || "150")
        setCarbsGoal(currentGoals.carbsGoal?.toString() || "200")
        setFatGoal(currentGoals.fatGoal?.toString() || "65")
      }
    }
  }, [visible, currentGoals, type])

  const handleSave = () => {
    if (type === "calorie") {
      const calories = parseInt(calorieGoal)
      if (isNaN(calories) || calories < 0) {
        Alert.alert("Invalid Input", "Please enter a valid calorie goal")
        return
      }
      onSave({ calorieGoal: calories })
    } else {
      const protein = parseInt(proteinGoal)
      const carbs = parseInt(carbsGoal)
      const fat = parseInt(fatGoal)
      
      if (isNaN(protein) || protein < 0 || isNaN(carbs) || carbs < 0 || isNaN(fat) || fat < 0) {
        Alert.alert("Invalid Input", "Please enter valid macro goals")
        return
      }
      onSave({ proteinGoal: protein, carbsGoal: carbs, fatGoal: fat })
    }
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.modalBg, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {type === "calorie" ? "Daily Calorie Goal" : "Macro Targets"}
          </Text>

          {type === "calorie" ? (
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.muted }]}>Calories per day</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                value={calorieGoal}
                onChangeText={setCalorieGoal}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor={theme.placeholder}
              />
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.muted }]}>Protein (grams)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  value={proteinGoal}
                  onChangeText={setProteinGoal}
                  keyboardType="numeric"
                  placeholder="150"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.muted }]}>Carbs (grams)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  value={carbsGoal}
                  onChangeText={setCarbsGoal}
                  keyboardType="numeric"
                  placeholder="200"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.muted }]}>Fats (grams)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  value={fatGoal}
                  onChangeText={setFatGoal}
                  keyboardType="numeric"
                  placeholder="65"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
            </>
          )}

          <View style={styles.buttonContainer}>
            <Pressable style={[styles.button, { backgroundColor: theme.cancelBg }]} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: theme.cancelText }]}>Cancel</Text>
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

const darkModalTheme = {
  modalBg: "#111827",
  border: "#374151",
  text: "#ffffff",
  muted: "#9ca3af",
  inputBg: "#1f2937",
  placeholder: "#6b7280",
  cancelBg: "#374151",
  cancelText: "#ffffff",
}

const lightModalTheme = {
  modalBg: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  inputBg: "#f9fafb",
  placeholder: "#9ca3af",
  cancelBg: "#e5e7eb",
  cancelText: "#374151",
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
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
  cancelButtonText: {
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

