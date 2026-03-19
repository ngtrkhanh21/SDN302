import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import courseService from "../../services/course-service";

const AUDIENCE_COLORS = {
  all: "#6c5ce7",
  beginner: "#00b894",
  intermediate: "#fdcb6e",
  advanced: "#e17055",
};
const RISK_COLORS = { low: "#00b894", medium: "#fdcb6e", high: "#d63031" };

export default function CourseApproveScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  const loadCourses = async () => {
    try {
      const data = await courseService.getCourses();
      const list = data?.data || data || [];
      const arr = Array.isArray(list) ? list : [];
      setCourses(arr);
      applySearch(arr, search);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách khóa học.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const applySearch = (list, q) => {
    if (!q.trim()) {
      setFiltered(list);
      return;
    }
    const lq = q.toLowerCase();
    setFiltered(
      list.filter(
        (c) =>
          (c.name || c.title || "").toLowerCase().includes(lq) ||
          (c.content || "").toLowerCase().includes(lq),
      ),
    );
  };

  useEffect(() => {
    loadCourses();
  }, []);
  useEffect(() => {
    applySearch(courses, search);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const handleDelete = (course) => {
    Alert.alert("Xóa khóa học", `Xóa "${course.name || course.title}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await courseService.deleteCourse(course._id || course.id);
            loadCourses();
          } catch {
            Alert.alert("Lỗi", "Không thể xóa khóa học.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const courseId = item._id || item.id;
    const title = item.name || item.title || "Khóa học chưa đặt tên";
    const hasImage = item.imageUrl && item.imageUrl.startsWith("http");
    const audience = item.targetAudience || "all";
    const risk = item.riskLevel || "low";
    const status = item.status || "published";
    const audienceLabel =
      audience === "all"
        ? "Tất cả"
        : audience === "beginner"
          ? "Cơ bản"
          : audience === "intermediate"
            ? "Trung cấp"
            : audience === "advanced"
              ? "Nâng cao"
              : audience;
    const riskLabel =
      risk === "low"
        ? "Thấp"
        : risk === "medium"
          ? "Trung bình"
          : risk === "high"
            ? "Cao"
            : risk;
    const statusLabel =
      status === "published"
        ? "Đã xuất bản"
        : status === "pending"
          ? "Chờ duyệt"
          : status;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("AdminCourseDetail", {
            courseId,
            courseName: title,
            courseData: item,
          })
        }
      >
        {/* Image */}
        {hasImage ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>🎨</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          {/* Header */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {title}
            </Text>
            <View
              style={[
                styles.statusBadge,
                status === "published"
                  ? styles.statusPublished
                  : styles.statusPending,
              ]}
            >
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            <View
              style={[
                styles.tag,
                {
                  backgroundColor:
                    (AUDIENCE_COLORS[audience] || "#6c5ce7") + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: AUDIENCE_COLORS[audience] || "#6c5ce7" },
                ]}
              >
                👥 {audienceLabel}
              </Text>
            </View>
            <View
              style={[
                styles.tag,
                { backgroundColor: (RISK_COLORS[risk] || "#00b894") + "20" },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: RISK_COLORS[risk] || "#00b894" },
                ]}
              >
                ⚠️ {riskLabel}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.courseMeta} numberOfLines={2}>
            {item.content || "Chưa có mô tả."}
          </Text>

          {/* Price + Actions */}
          <View style={styles.footerRow}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {item.price > 0
                  ? `${Number(item.price).toLocaleString("vi-VN")} VND`
                  : "Miễn phí"}
              </Text>
              {item.discount > 0 && (
                <Text style={styles.discountBadge}>-{item.discount}%</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.removeBtnText}>🗑 Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Duyệt khóa học</Text>
      <Text style={styles.subtitle}>
        {filtered.length} khóa học · Chạm để xem chi tiết
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍  Tìm khóa học..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#b2bec3"
      />

      {isLoading ? (
        <ActivityIndicator
          color="#0984e3"
          size="large"
          style={{ marginTop: 32 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => String(item._id || item.id || index)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không tìm thấy khóa học nào.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#74b9ff",
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0984e3", marginBottom: 2 },
  subtitle: { fontSize: 14, color: "#dfe6e9", marginBottom: 12 },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2d3436",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: { width: "100%", height: 160 },
  imagePlaceholder: {
    width: "100%",
    height: 90,
    backgroundColor: "#dfe6e9",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: { fontSize: 36 },
  cardBody: { padding: 14 },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  courseTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
    marginRight: 8,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPublished: { backgroundColor: "#dff9fb" },
  statusPending: { backgroundColor: "#fef3c7" },
  statusText: { fontSize: 11, fontWeight: "700", color: "#4834d4" },
  tagsRow: { flexDirection: "row", marginBottom: 8, gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  tagText: { fontSize: 12, fontWeight: "600" },
  courseMeta: {
    fontSize: 13,
    color: "#636e72",
    lineHeight: 19,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  price: { fontSize: 15, fontWeight: "700", color: "#0984e3" },
  discountBadge: {
    backgroundColor: "#00b894",
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  removeBtn: {
    backgroundColor: "#d63031",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  removeBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  emptyText: {
    textAlign: "center",
    color: "#dfe6e9",
    marginTop: 40,
    fontSize: 15,
  },
});
