import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import postService from "../../services/post-service";
import useAuthStore from "../../store/auth-store";

function extractEntity(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload || null;
}

export default function StaffBlogFormScreen({ route, navigation }) {
  const { user } = useAuthStore();
  const { mode = "create", blogId, initialData } = route.params || {};

  const isEditMode = useMemo(() => mode === "edit", [mode]);

  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [blogImgUrl, setBlogImgUrl] = useState(initialData?.blogImgUrl || "");
  const [isLoading, setIsLoading] = useState(isEditMode && !initialData);
  const [isSaving, setIsSaving] = useState(false);

  const loadDetailForEdit = useCallback(async () => {
    if (!isEditMode || !blogId || initialData) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await postService.getPostById(blogId);
      const detail = extractEntity(response);
      setTitle(detail?.title || "");
      setContent(detail?.content || "");
      setBlogImgUrl(detail?.blogImgUrl || "");
    } catch (error) {
      console.warn("Failed to load blog for edit", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu để chỉnh sửa.");
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [blogId, initialData, isEditMode, navigation]);

  useEffect(() => {
    loadDetailForEdit();
  }, [loadDetailForEdit]);

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề bài viết.");
      return false;
    }

    if (!content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung bài viết.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      blogImgUrl: blogImgUrl.trim(),
    };

    if (!isEditMode) {
      payload.user_id = user?._id || user?.id || "";
    }

    try {
      setIsSaving(true);
      if (isEditMode) {
        await postService.updatePost(blogId, payload);
        Alert.alert("Thành công", "Đã cập nhật bài viết.", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        await postService.createPost(payload);
        Alert.alert("Thành công", "Đã tạo bài viết mới.", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.warn("Failed to save blog", error);
      const message =
        error?.response?.data?.message || "Không thể lưu bài viết.";
      Alert.alert("Lỗi", message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#8e44ad" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#2c3e50" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>
          {isEditMode ? "Chỉnh sửa bài viết" : "Thêm bài viết"}
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, isSaving && styles.disabledBtn]}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Tiêu đề *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Nhập tiêu đề bài viết"
          style={styles.input}
          placeholderTextColor="#95a5a6"
        />

        <Text style={styles.label}>Nội dung *</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Nhập nội dung bài viết"
          style={[styles.input, styles.contentInput]}
          placeholderTextColor="#95a5a6"
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Ảnh (URL)</Text>
        <TextInput
          value={blogImgUrl}
          onChangeText={setBlogImgUrl}
          placeholder="https://example.com/image.jpg"
          style={styles.input}
          placeholderTextColor="#95a5a6"
          autoCapitalize="none"
          keyboardType="url"
        />

        {!!blogImgUrl && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Xem trước ảnh</Text>
            <Image
              source={{ uri: blogImgUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f6fa",
  },
  topBar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#2c3e50",
    marginHorizontal: 10,
  },
  saveBtn: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#8e44ad",
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.7,
  },
  formContainer: {
    padding: 14,
    paddingBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#2c3e50",
    fontSize: 14,
  },
  contentInput: {
    minHeight: 170,
    lineHeight: 21,
  },
  previewCard: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  previewTitle: {
    fontSize: 13,
    color: "#7f8c8d",
    marginBottom: 8,
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    backgroundColor: "#ecf0f1",
  },
});
