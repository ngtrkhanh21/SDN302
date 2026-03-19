// src/screens/shared/EditProfileScreen.jsx
import { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import authService from "../../services/auth-service";
import useAuthStore from "../../store/auth-store";

export default function EditProfileScreen({ navigation }) {
  const { user, updateUserProfileLocally } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [dob, setDob] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authService.getCurrentUser();
        const u = data?.data || data;
        setName(u?.name || "");
        setDob(u?.date_of_birth?.slice(0, 10) || "");
      } catch (e) {
        console.warn("get-me failed", e);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!name || !dob) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ tên và ngày sinh.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.updateCurrentUser({
        name,
        date_of_birth: dob,
      });
      await updateUserProfileLocally({ name });
      Alert.alert("Thành công", "Đã cập nhật hồ sơ.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.warn("update-me failed", e);
      Alert.alert("Lỗi", "Không thể cập nhật hồ sơ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>

      <TextInput
        style={styles.input}
        placeholder="Họ và tên"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Ngày sinh (YYYY-MM-DD)"
        value={dob}
        onChangeText={setDob}
      />
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Đang lưu..." : "Lưu"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffeaa7",
    padding: 24,
    paddingTop: 48,
  },
  back: { marginBottom: 8 },
  backText: { fontSize: 18, fontWeight: "700", color: "#e17055" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#e17055",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#fd79a8",
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
