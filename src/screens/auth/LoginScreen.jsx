import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import useAuthStore from "../../store/auth-store";

export default function LoginScreen({ navigation }) {
  const { login, initializeAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      Alert.alert("Đăng nhập thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.title}>ArtFun</Text>
        <Text style={styles.subtitle}>Học tập sắc màu cho trẻ nhỏ</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chào mừng quay lại!</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Mật khẩu"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Đang đăng nhập..." : "Bắt đầu thôi!"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoToRegister}>
          <Text style={styles.linkText}>
            Bạn mới ở đây?{" "}
            <Text style={styles.linkHighlight}>Tạo tài khoản ngay</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: "#ffeaa7",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#e17055",
  },
  subtitle: {
    fontSize: 16,
    color: "#2d3436",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: "#0984e3",
  },
  input: {
    backgroundColor: "#f1f2f6",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#ff7675",
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  linkText: {
    textAlign: "center",
    color: "#636e72",
    marginTop: 4,
  },
  linkHighlight: {
    color: "#0984e3",
    fontWeight: "600",
  },
});
