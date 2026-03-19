import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";
import instructorService from "../../services/instructor-service";
import useAuthStore from "../../store/auth-store";

export default function SearchScreen({ navigation }) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || user?.phone || "",
    qualificationsText: "",
    jobTitle: "",
    profilePicUrl: user?.avatar || user?.profilePicUrl || "",
    note: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: user?.name || user?.fullName || "",
      email: user?.email || "",
    }));
  }, [user?.name, user?.fullName, user?.email]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const qualifications = useMemo(
    () =>
      form.qualificationsText
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    [form.qualificationsText],
  );

  const validate = () => {
    if (!form.fullName.trim()) {
      return "Tài khoản chưa có họ và tên. Vui lòng cập nhật hồ sơ trước.";
    }
    if (!form.email.trim()) {
      return "Tài khoản chưa có email. Vui lòng cập nhật hồ sơ trước.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Email không đúng định dạng.";
    }
    if (!form.phoneNumber.trim()) {
      return "Vui lòng nhập số điện thoại.";
    }
    if (!qualifications.length) {
      return "Vui lòng nhập ít nhất 1 chứng chỉ.";
    }
    if (!form.jobTitle.trim()) {
      return "Vui lòng nhập chức danh công việc.";
    }
    return "";
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert("Thiếu thông tin", validationError);
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      qualifications,
      jobTitle: form.jobTitle.trim(),
      profilePicUrl: form.profilePicUrl.trim(),
      note: form.note.trim(),
    };

    setIsSubmitting(true);
    try {
      await instructorService.becomeInstructor(payload);
      Alert.alert(
        "Gửi thành công",
        "Yêu cầu trở thành giảng viên đã được gửi. Vui lòng chờ xét duyệt.",
      );
      setForm((prev) => ({
        ...prev,
        qualificationsText: "",
        jobTitle: "",
        note: "",
      }));
      navigation.navigate("Home");
    } catch (error) {
      console.warn("Failed to submit become-instructor request", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Không thể gửi yêu cầu lúc này.";
      Alert.alert("Lỗi", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Đăng ký trở thành giảng viên</Text>
      <Text style={styles.subtitle}>
        Gửi thông tin để đội ngũ kiểm duyệt xét duyệt hồ sơ của bạn.
      </Text>

      <Text style={styles.label}>Họ và tên</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        value={form.fullName}
        editable={false}
        selectTextOnFocus={false}
        placeholder="Họ và tên từ tài khoản"
        placeholderTextColor="#7f8c8d"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        value={form.email}
        editable={false}
        selectTextOnFocus={false}
        placeholder="Email từ tài khoản"
        placeholderTextColor="#7f8c8d"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Số điện thoại</Text>
      <TextInput
        style={styles.input}
        value={form.phoneNumber}
        onChangeText={(value) => setField("phoneNumber", value)}
        placeholder="Nhập số điện thoại"
        placeholderTextColor="#7f8c8d"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Chứng chỉ</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={form.qualificationsText}
        onChangeText={(value) => setField("qualificationsText", value)}
        placeholder="Nhập chứng chỉ, ngăn cách bằng dấu phẩy hoặc xuống dòng"
        placeholderTextColor="#7f8c8d"
        multiline
      />

      <Text style={styles.label}>Chức danh công việc</Text>
      <TextInput
        style={styles.input}
        value={form.jobTitle}
        onChangeText={(value) => setField("jobTitle", value)}
        placeholder="Ví dụ: Art Teacher"
        placeholderTextColor="#7f8c8d"
      />

      <Text style={styles.label}>Ảnh (URL)</Text>
      <TextInput
        style={styles.input}
        value={form.profilePicUrl}
        onChangeText={(value) => setField("profilePicUrl", value)}
        placeholder="https://..."
        placeholderTextColor="#7f8c8d"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Ghi chú</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={form.note}
        onChangeText={(value) => setField("note", value)}
        placeholder="Giới thiệu ngắn về kinh nghiệm giảng dạy của bạn"
        placeholderTextColor="#7f8c8d"
        multiline
      />

      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Gửi yêu cầu</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8fb",
  },
  content: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 32,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 18,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe4ee",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  readOnlyInput: {
    backgroundColor: "#eef2f7",
    color: "#334155",
  },
  submitButton: {
    marginTop: 22,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 13,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
