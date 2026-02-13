import { useState, useRef } from "react"
import { View, Text, Modal, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native"
import { CameraView, CameraType, useCameraPermissions } from "expo-camera"
import * as ImagePicker from "expo-image-picker"
import { uploadAndAnalyzeFood } from "../services/api"

interface CameraModalProps {
  visible: boolean
  onClose: () => void
  onFoodAnalyzed?: (data: any) => void
  onProcessingStart?: () => void
  onProcessingStop?: () => void
}

export default function CameraModal({ visible, onClose, onFoodAnalyzed, onProcessingStart, onProcessingStop }: CameraModalProps) {
  const [facing, setFacing] = useState<CameraType>("back")
  const [permission, requestPermission] = useCameraPermissions()
  const [isProcessing, setIsProcessing] = useState(false)
  const cameraRef = useRef<CameraView>(null)

  if (!permission) {
    return null
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need access to your camera to take photos of your food.
            </Text>
            <Pressable style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Grant Permission</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonSecondary]} onPress={onClose}>
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    )
  }

  const takePicture = async () => {
    if (!cameraRef.current) return

    try {
      setIsProcessing(true)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      })

      if (photo?.uri) {
        console.log('Photo taken, URI:', photo.uri)
        // Close modal immediately after taking picture
        onClose()
        
        // Notify that processing is starting
        onProcessingStart?.()
        
        // Upload and analyze in background
        try {
          const result = await uploadAndAnalyzeFood(photo.uri)
          console.log('Analysis result:', result)
          onFoodAnalyzed?.(result.data)
        } catch (error: any) {
          console.error("Analysis error:", error)
          const errorMessage = error?.message || "Failed to analyze food. Please check your network connection and ensure the backend server is running."
          Alert.alert("Error", errorMessage)
          onProcessingStop?.()
        }
      }
    } catch (error) {
      console.error("Camera error:", error)
      Alert.alert("Error", "Failed to take picture. Please try again.")
      onClose()
      onProcessingStop?.()
    } finally {
      setIsProcessing(false)
    }
  }

  const pickImage = async () => {
    try {
      setIsProcessing(true)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        console.log('Image picked, URI:', result.assets[0].uri)
        // Close modal immediately after picking image
        onClose()
        
        // Notify that processing is starting
        onProcessingStart?.()
        
        // Upload and analyze in background
        try {
          const analysis = await uploadAndAnalyzeFood(result.assets[0].uri)
          console.log('Analysis result:', analysis)
          onFoodAnalyzed?.(analysis.data)
        } catch (error: any) {
          console.error("Analysis error:", error)
          const errorMessage = error?.message || "Failed to analyze food. Please check your network connection and ensure the backend server is running."
          Alert.alert("Error", errorMessage)
          onProcessingStop?.()
        }
      }
    } catch (error) {
      console.error("Image picker error:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
      onClose()
      onProcessingStop?.()
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === "back" ? "front" : "back"))
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.cameraContainer}>
          {/* CameraView without children */}
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          />
          
          {/* Camera controls positioned absolutely outside CameraView */}
          <View style={styles.cameraControls}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>

            <View style={styles.bottomControls}>
              <Pressable style={styles.galleryButton} onPress={pickImage} disabled={isProcessing}>
                <Text style={styles.galleryButtonText}>📷</Text>
              </Pressable>

              <Pressable
                style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </Pressable>

              <Pressable style={styles.flipButton} onPress={toggleCameraFacing} disabled={isProcessing}>
                <Text style={styles.flipButtonText}>🔄</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryButtonText: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#000000",
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ffffff",
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipButtonText: {
    fontSize: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#000000",
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#9ca3af",
    marginBottom: 32,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#f97316",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#374151",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: "#9ca3af",
  },
})
