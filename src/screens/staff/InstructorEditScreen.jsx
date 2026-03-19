import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import instructorService from "../../services/instructor-service";
import userService from "../../services/user-service";

function extractEntity(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload || null;
}

function isValidImageUri(uri) {
  if (typeof uri !== "string") {
    return false;
  }

  return /^(https?:\/\/|file:\/\/|content:\/\/|data:image\/)/i.test(uri.trim());
}

function normalizeImageUrl(url) {
  if (typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return trimmed;
}

function pickAvatarUrl(detail, user) {
  const candidates = [
    detail?.profilePicUrl,
    detail?.profilePicURL,
    detail?.profilePic,
    detail?.avatar,
    detail?.user?.profilePicUrl,
    detail?.user?.avatar,
    user?.profilePicUrl,
    user?.profilePicURL,
    user?.profilePic,
    user?.avatar,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate);
    if (isValidImageUri(normalized)) {
      return normalized;
    }
  }

  return "";
}

export default function InstructorEditScreen({ route, navigation }) {
  const instructorId = route?.params?.instructorId || "";

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
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

  const fillForm = useCallback((entity, initialAvatar = "") => {
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
      profilePicUrl: initialAvatar,
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
        let user = null;

        if (entity.user_id) {
          try {
            const userResponse = await userService.getUserById(entity.user_id);
            user = extractEntity(userResponse) || null;
          } catch (userError) {
            console.warn(
              "Failed to load related user in edit screen",
              userError,
            );
          }
        }

        setUserInfo(user);
        const avatarUrl = pickAvatarUrl(entity, user);
        fillForm(entity, avatarUrl);
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

    return "";
  };

  const handlePickAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Cần quyền truy cập",
          "Vui lòng cấp quyền thư viện ảnh để chọn ảnh đại diện.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const selectedUri = result.assets?.[0]?.uri || "";
      if (selectedUri) {
        setField("profilePicUrl", selectedUri);
      }
    } catch (error) {
      console.warn("Failed to pick avatar image", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh đại diện.");
    }
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
        <Text style={[styles.label, styles.firstLabel]}>Ảnh đại diện</Text>
        <View style={styles.avatarSectionTop}>
          {isValidImageUri(form.profilePicUrl) ? (
            <Image
              source={{ uri: form.profilePicUrl }}
              style={styles.avatarPreviewLarge}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholderLarge}>
              <MaterialCommunityIcons
                name="account"
                size={44}
                color="#94a3b8"
              />
            </View>
          )}

          <View style={styles.avatarActionsTop}>
            <TouchableOpacity
              style={styles.pickImageBtn}
              onPress={handlePickAvatar}
            >
              <MaterialCommunityIcons
                name="image-plus"
                size={18}
                color="#fff"
              />
              <Text style={styles.pickImageText}>Đổi ảnh đại diện</Text>
            </TouchableOpacity>

            {form.profilePicUrl ||
            userInfo?.avatar ||
            userInfo?.profilePicUrl ? (
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setField("profilePicUrl", "")}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color="#ef4444"
                />
                <Text style={styles.removeImageText}>Xóa ảnh đã chọn</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

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
  firstLabel: {
    marginTop: 0,
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
  avatarSectionTop: {
    borderWidth: 1,
    borderColor: "#d0d7e2",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  avatarPreviewLarge: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#e5e7eb",
  },
  avatarPlaceholderLarge: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActionsTop: {
    flex: 1,
    gap: 8,
  },
  pickImageBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pickImageText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  removeImageBtn: {
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  removeImageText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "700",
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
