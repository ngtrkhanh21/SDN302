import React, { useEffect, useState } from "react";
import {
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
import categoryService from "../../services/category-service";
import courseService from "../../services/course-service";
import useAuthStore from "../../store/auth-store";

const AUDIENCE_OPTIONS = ["all", "beginner", "intermediate", "advanced"];
const RISK_OPTIONS = ["low", "medium", "high"];

const OPTION_LABELS = {
  all: "Tất cả",
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

function ChipSelector({ label, options, value, onChange }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, value === opt && styles.chipSelected]}
            onPress={() => onChange(opt)}
          >
            <Text
              style={[
                styles.chipText,
                value === opt && styles.chipTextSelected,
              ]}
            >
              {OPTION_LABELS[opt] || opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function UploadCourseScreen({ route, navigation }) {
  const user = useAuthStore((state) => state.user);

  const courseToEdit = route?.params?.courseToEdit ?? null;
  const isEditMode = !!courseToEdit;

  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCatId = (c) =>
    c?.category_id?._id || c?.category_id?.id || c?.category_id || "";

  const [title, setTitle] = useState(
    courseToEdit?.name || courseToEdit?.title || "",
  );
  const [price, setPrice] = useState(
    courseToEdit?.price != null ? String(courseToEdit.price) : "",
  );
  const [discount, setDiscount] = useState(
    courseToEdit?.discount != null ? String(courseToEdit.discount) : "0",
  );
  const [content, setContent] = useState(courseToEdit?.content || "");
  const [categoryId, setCategoryId] = useState(getCatId(courseToEdit));
  const [imageUrl, setImageUrl] = useState(courseToEdit?.imageUrl || "");
  const [targetAudience, setTargetAudience] = useState(
    courseToEdit?.targetAudience || "all",
  );
  const [riskLevel, setRiskLevel] = useState(courseToEdit?.riskLevel || "low");

  // Re-fill when switching courses in Edit
  useEffect(() => {
    if (courseToEdit) {
      setTitle(courseToEdit.name || courseToEdit.title || "");
      setPrice(courseToEdit.price != null ? String(courseToEdit.price) : "");
      setDiscount(
        courseToEdit.discount != null ? String(courseToEdit.discount) : "0",
      );
      setContent(courseToEdit.content || "");
      setCategoryId(getCatId(courseToEdit));
      setImageUrl(courseToEdit.imageUrl || "");
      setTargetAudience(courseToEdit.targetAudience || "all");
      setRiskLevel(courseToEdit.riskLevel || "low");
    }
  }, [courseToEdit?._id || courseToEdit?.id]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        const cats = res?.data || res || [];
        const catList = Array.isArray(cats) ? cats : [];
        setCategories(catList);
        if (!isEditMode && catList.length > 0 && !categoryId) {
          setCategoryId(catList[0]._id || catList[0].id);
        }
      } catch (error) {
        console.warn("Failed to load categories", error);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !price.trim() || !categoryId) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập tiêu đề, nội dung, giá và danh mục khóa học.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: title.trim(),
        content: content.trim(),
        price: Number(price),
        discount: Number(discount) || 0,
        category_id: categoryId,
        user_id: user?._id || user?.id,
        imageUrl: imageUrl.trim(),
        targetAudience,
        riskLevel,
      };

      if (isEditMode) {
        const courseId = courseToEdit._id || courseToEdit.id;
        await courseService.updateCourse(courseId, payload);
        Alert.alert("Thành công!", "Đã cập nhật khóa học.", [
          { text: "OK", onPress: () => navigation.navigate("MyCourses") },
        ]);
      } else {
        await courseService.createCourse(payload);
        Alert.alert("Đã đăng!", "Khóa học của bạn đã được xuất bản.", [
          {
            text: "OK",
            onPress: () => {
              setTitle("");
              setPrice("");
              setDiscount("0");
              setContent("");
              setImageUrl("");
              setTargetAudience("all");
              setRiskLevel("low");
              navigation.navigate("MyCourses");
            },
          },
        ]);
      }
    } catch (error) {
      console.warn("Submit error:", JSON.stringify(error.response?.data));
      const msg =
        error.response?.data?.message ||
        (isEditMode
          ? "Không thể cập nhật khóa học."
          : "Không thể tạo khóa học.");
      Alert.alert("Lỗi", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidImage = imageUrl.startsWith("http");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <Text style={styles.headerTitle}>
          {isEditMode ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isEditMode
            ? "Cập nhật thông tin khóa học bên dưới."
            : "Chia sẻ kỹ năng nghệ thuật của bạn!"}
        </Text>

        {/* Image Preview */}
        {hasValidImage && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        )}

        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.label}>Tiêu đề khóa học *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Màu nước cơ bản"
            value={title}
            onChangeText={setTitle}
          />

          {/* Category */}
          <Text style={styles.label}>Danh mục *</Text>
          <View style={styles.pickerContainer}>
            {categories.length === 0 ? (
              <Text style={styles.pickerPlaceholder}>Đang tải danh mục...</Text>
            ) : (
              <View style={styles.chipRow}>
                {categories.map((cat) => {
                  const id = cat._id || cat.id;
                  const isSelected = id === categoryId;
                  return (
                    <TouchableOpacity
                      key={String(id)}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setCategoryId(id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {cat.name || "Chưa đặt tên"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Audience */}
          <ChipSelector
            label="Đối tượng học"
            options={AUDIENCE_OPTIONS}
            value={targetAudience}
            onChange={setTargetAudience}
          />

          {/* Risk Level */}
          <ChipSelector
            label="Mức độ rủi ro"
            options={RISK_OPTIONS}
            value={riskLevel}
            onChange={setRiskLevel}
          />

          {/* Price */}
          <Text style={styles.label}>Giá (VND) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: 50000"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          {/* Discount */}
          <Text style={styles.label}>Giảm giá (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={discount}
            onChangeText={setDiscount}
          />

          {/* Image URL */}
          <Text style={styles.label}>URL ảnh bìa</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
          {imageUrl.length > 0 && !hasValidImage && (
            <Text style={styles.hintText}>
              ⚠️ URL nên bắt đầu bằng https://
            </Text>
          )}

          {/* Content */}
          <Text style={styles.label}>Mô tả / Nội dung *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Học viên sẽ học được gì trong khóa học này?"
            multiline
            numberOfLines={5}
            value={content}
            onChangeText={setContent}
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting
                ? "Đang lưu..."
                : isEditMode
                  ? "💾 Lưu thay đổi"
                  : "🚀 Đăng khóa học"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffeaa7",
    padding: 24,
    paddingTop: 56,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#d35400",
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 15, color: "#636e72", marginBottom: 16 },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#f1f2f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2d3436",
  },
  textArea: { height: 120, textAlignVertical: "top" },
  hintText: { fontSize: 12, color: "#e17055", marginTop: 4 },
  pickerContainer: { backgroundColor: "#f1f2f6", borderRadius: 12, padding: 8 },
  pickerPlaceholder: { fontSize: 14, color: "#636e72" },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#dfe6e9",
    marginRight: 6,
    marginBottom: 6,
  },
  chipSelected: { backgroundColor: "#fdcb6e" },
  chipText: { fontSize: 13, color: "#2d3436" },
  chipTextSelected: { fontWeight: "700", color: "#2d3436" },
  submitButton: {
    backgroundColor: "#e17055",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 32,
  },
  disabledBtn: { opacity: 0.7 },
  submitBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
