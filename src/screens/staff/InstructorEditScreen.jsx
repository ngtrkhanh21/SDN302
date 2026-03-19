import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import instructorService from "../../services/instructor-service";

function extractEntity(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload || null;
}

export default function InstructorEditScreen({ route, navigation }) {
  const instructorId = route?.params?.instructorId || "";

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    qualificationsText: "",
    jobTitle: "",
    salary: "0",
    profilePicUrl: "",
  });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const qualifications = useMemo(
    () =>
      String(form.qualificationsText || "")
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    [form.qualificationsText],
  );

  const fillForm = useCallback((entity) => {
    const qualificationsText = Array.isArray(entity?.qualifications)
      ? entity.qualifications.join("\n")
      : "";

    setForm({
      fullName: entity?.fullName || "",
      email: entity?.email || "",
      phoneNumber: entity?.phoneNumber || "",
      qualificationsText,
      jobTitle: entity?.jobTitle || "",
      salary: String(entity?.salary ?? 0),
      profilePicUrl: entity?.profilePicUrl || "",
    });
  }, []);

  const loadInstructorDetail = useCallback(async () => {
    if (!instructorId) {
      Alert.alert("Lỗi", "Thiếu instructorId.");
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    try {
      const response =
        await instructorService.getInstructorDetail(instructorId);
      const entity = extractEntity(response) || null;
      if (entity) {
        fillForm(entity);
      }
    } catch (error) {
      console.warn("Failed to load instructor detail", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Không thể tải thông tin giảng viên.";
      Alert.alert("Lỗi", message);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [fillForm, instructorId, navigation]);

  useEffect(() => {
    loadInstructorDetail();
  }, [loadInstructorDetail]);

  const validate = () => {
    if (!form.fullName.trim()) {
      return "Vui lòng nhập họ và tên.";
    }

    if (!form.email.trim()) {
      return "Vui lòng nhập email.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Email không đúng định dạng.";
    }

    if (!form.phoneNumber.trim()) {
      return "Vui lòng nhập số điện thoại.";
    }

    const salaryNumber = Number(form.salary || 0);
    if (Number.isNaN(salaryNumber) || salaryNumber < 0) {
      return "Lương phải là số hợp lệ.";
    }

    if (form.profilePicUrl && !String(form.profilePicUrl).startsWith("http")) {
      return "Ảnh đại diện phải là URL hợp lệ (http/https).";
    }

    return "";
  };

  const handleUpdate = async () => {
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
      salary: Number(form.salary || 0),
      profilePicUrl: form.profilePicUrl.trim(),
    };

    setIsSaving(true);
    try {
      await instructorService.updateInstructor(instructorId, payload);
      Alert.alert("Thành công", "Đã cập nhật thông tin giảng viên.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.warn("Failed to update instructor", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Không thể cập nhật giảng viên.";
      Alert.alert("Lỗi", message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cập nhật Giảng viên</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.formCard}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput
          style={styles.input}
          value={form.fullName}
          onChangeText={(value) => setField("fullName", value)}
          placeholder="Nhập họ và tên"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={(value) => setField("email", value)}
          placeholder="example@gmail.com"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={form.phoneNumber}
          onChangeText={(value) => setField("phoneNumber", value)}
          placeholder="Nhập số điện thoại"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Chứng chỉ</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.qualificationsText}
          onChangeText={(value) => setField("qualificationsText", value)}
          placeholder="Mỗi chứng chỉ một dòng hoặc ngăn cách bằng dấu phẩy"
          placeholderTextColor="#94a3b8"
          multiline
        />

        <Text style={styles.label}>Chức danh</Text>
        <TextInput
          style={styles.input}
          value={form.jobTitle}
          onChangeText={(value) => setField("jobTitle", value)}
          placeholder="Nhập chức danh"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Lương</Text>
        <TextInput
          style={styles.input}
          value={form.salary}
          onChangeText={(value) => setField("salary", value)}
          placeholder="0"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Ảnh đại diện (URL)</Text>
        <TextInput
          style={styles.input}
          value={form.profilePicUrl}
          onChangeText={(value) => setField("profilePicUrl", value)}
          placeholder="https://..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.updateBtn, isSaving && styles.btnDisabled]}
          onPress={handleUpdate}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Lưu cập nhật</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
  },
  header: {
    backgroundColor: "#2d98da",
    paddingTop: 24,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#fff",
  },
  scroll: {
    flex: 1,
  },
  formCard: {
    padding: 14,
    paddingBottom: 24,
  },
  label: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d7e2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  updateBtn: {
    marginTop: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#2563eb",
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
