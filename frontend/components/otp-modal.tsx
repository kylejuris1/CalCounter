import { useState } from "react"
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"

export type OtpModalMode = "signin" | "delete"

interface OtpModalProps {
  visible: boolean
  onClose: () => void
  mode: OtpModalMode
  onSendOtp: (email: string) => Promise<void>
  onVerify: (email: string, otpCode: string) => Promise<void>
  light?: boolean
}

export default function OtpModal({
  visible,
  onClose,
  mode,
  onSendOtp,
  onVerify,
  light = true,
}: OtpModalProps) {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLight = light
  const bg = isLight ? "#ffffff" : "#111827"
  const cardBg = isLight ? "#f9fafb" : "#1f2937"
  const text = isLight ? "#111827" : "#ffffff"
  const muted = isLight ? "#6b7280" : "#9ca3af"
  const border = isLight ? "#e5e7eb" : "#374151"
  const danger = "#ef4444"

  const reset = () => {
    setStep("email")
    setEmail("")
    setOtpCode("")
    setError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError("Please enter your email address.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onSendOtp(trimmed)
      setStep("otp")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedOtp = otpCode.trim()
    if (!trimmedEmail || !trimmedOtp) {
      setError("Enter your email and OTP code.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onVerify(trimmedEmail, trimmedOtp)
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.")
    } finally {
      setLoading(false)
    }
  }

  const title = mode === "signin" ? "Sign in" : "Clear all data"
  const verifyLabel = mode === "signin" ? "Verify and sign in" : "Verify and delete account"

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.card, { backgroundColor: bg }]}>
          <Text style={[styles.title, { color: text }]}>{title}</Text>

          {step === "email" ? (
            <>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor: border, color: text }]}
                placeholder="Email address"
                placeholderTextColor={muted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null) }}
              />
              <Pressable
                style={[styles.primaryButton, { backgroundColor: isLight ? "#111827" : "#f97316" }]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send OTP</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.mutedText, { color: muted }]}>{email}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor: border, color: text }]}
                placeholder="Enter OTP code"
                placeholderTextColor={muted}
                autoCapitalize="none"
                keyboardType="number-pad"
                value={otpCode}
                onChangeText={(t) => { setOtpCode(t); setError(null) }}
              />
              <Pressable
                style={[styles.primaryButton, { backgroundColor: mode === "delete" ? danger : isLight ? "#111827" : "#f97316" }]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>{verifyLabel}</Text>
                )}
              </Pressable>
              <Pressable onPress={() => setStep("email")}>
                <Text style={[styles.link, { color: muted }]}>Change email</Text>
              </Pressable>
            </>
          )}

          {error ? <Text style={[styles.error, { color: danger }]}>{error}</Text> : null}

          <Pressable onPress={handleClose} style={styles.cancelWrap}>
            <Text style={[styles.cancel, { color: muted }]}>Cancel</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  card: {
    width: "86%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginBottom: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  mutedText: {
    fontSize: 14,
    marginBottom: 8,
  },
  link: {
    fontSize: 14,
    marginBottom: 12,
  },
  error: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  cancelWrap: {
    marginTop: 8,
    alignItems: "center",
  },
  cancel: {
    fontSize: 16,
  },
})
