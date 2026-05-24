import { useAccessibility } from "@/contexts/AccessibilityContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { getFontSizeValue } from "@/utils/fontSizes";
import { markSessionStarted } from "@/utils/sessionSecurity";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useContext, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../firebase/firebase";

const Login: React.FC = () => {
  const router = useRouter();
  const { fontSize } = useAccessibility();
  const { theme } = useContext(ThemeContext);
  const textSize = getFontSizeValue(fontSize);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill all fields.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      await markSessionStarted();
      router.replace("/profile");
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.message || "Login failed. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
        <View style={styles.logoCircle}>
          <Ionicons name="shield-checkmark" size={40} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text, fontSize: textSize + 10 }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
          Please sign in to your TwinXCare account
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textDim }]}>Email Address</Text>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={20} color={theme.textDim} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="admin@twinxcare.com"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textDim }]}>Password</Text>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textDim} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { fontSize: textSize, color: theme.primary }]}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/register")} style={styles.footerLink}>
          <Text style={{ color: theme.textDim }}>
            Don&apos;t have an account? <Text style={{ color: theme.primary, fontWeight: '700' }}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  card: {
    padding: 32,
    borderRadius: 32,
    width: '100%',
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(129, 173, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  errorContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLink: {
    marginTop: 24,
  },
});

export default Login;
