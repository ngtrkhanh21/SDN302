import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import courseService from "../../services/course-service";
import reviewService from "../../services/review-service";

const AUDIENCE_COLORS = {
  all: "#6c5ce7",
  beginner: "#00b894",
  intermediate: "#fdcb6e",
  advanced: "#e17055",
};
const RISK_COLORS = { low: "#00b894", medium: "#fdcb6e", high: "#d63031" };

export default function AdminCourseDetailScreen({ route, navigation }) {
  const { courseId, courseData } = route.params;
  const [course, setCourse] = useState(courseData || null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(!courseData);

  useEffect(() => {
    if (!courseData) {
      // Only fetch if not passed from list
      courseService
        .getCourseDetail(courseId)
        .then((res) => {
          let c = res?.data || res || null;
          if (Array.isArray(c)) c = c[0];
          setCourse(c);
        })
        .catch(() => Alert.alert("Lỗi", "Không thể tải khóa học."))
        .finally(() => setIsLoading(false));
    }
    reviewService
      .getReviewsByCourse(courseId)
      .then((res) => {
        const list = res?.data || res || [];
        setReviews(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [courseId]);

  const handleRemove = () => {
    Alert.alert("Xóa khóa học", `Xóa "${course?.name}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await courseService.deleteCourse(courseId);
            Alert.alert("Đã xóa", "Khóa học đã được xóa.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } catch {
            Alert.alert("Lỗi", "Không thể xóa khóa học.");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#0984e3" size="large" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: "#636e72" }}>Không tìm thấy khóa học.</Text>
      </View>
    );
  }

  const hasImage = course.imageUrl && course.imageUrl.startsWith("http");
  const audience = course.targetAudience || "all";
  const risk = course.riskLevel || "low";
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
    course.status === "published"
      ? "Đã xuất bản"
      : course.status === "pending"
        ? "Chờ duyệt"
        : course.status;
  const avgRating = reviews.length
    ? (
        reviews.reduce((s, r) => s + (r.rating || r.star || 0), 0) /
        reviews.length
      ).toFixed(1)
    : null;
  const finalPrice =
    course.discount > 0
      ? course.price * (1 - course.discount / 100)
      : course.price;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#0984e3" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {course.name || "Chi tiết khóa học"}
        </Text>
        <TouchableOpacity style={styles.removeHeaderBtn} onPress={handleRemove}>
          <Text style={{ fontSize: 20 }}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Cover Image */}
      {hasImage ? (
        <Image
          source={{ uri: course.imageUrl }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={{ fontSize: 52 }}>🎨</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Name + Status badge */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{course.name}</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  course.status === "published" ? "#d1fae5" : "#fef3c7",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: course.status === "published" ? "#059669" : "#d97706",
                },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Price + Discount + Rating */}
        <View style={styles.statsRow}>
          {course.price > 0 ? (
            <>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {Number(course.price).toLocaleString("vi-VN")}đ
                </Text>
                <Text style={styles.statLabel}>Giá gốc</Text>
              </View>
              {course.discount > 0 && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: "#d63031" }]}>
                      -{course.discount}%
                    </Text>
                    <Text style={styles.statLabel}>Giảm giá</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: "#059669" }]}>
                      {Number(finalPrice).toLocaleString("vi-VN")}đ
                    </Text>
                    <Text style={styles.statLabel}>Sau giảm</Text>
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: "#059669" }]}>
                Miễn phí
              </Text>
              <Text style={styles.statLabel}>Giá</Text>
            </View>
          )}
          {avgRating && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>⭐ {avgRating}</Text>
                <Text style={styles.statLabel}>{reviews.length} đánh giá</Text>
              </View>
            </>
          )}
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
              { backgroundColor: (RISK_COLORS[risk] || "#00b894") + "25" },
            ]}
          >
            <Text
              style={[
                styles.tagText,
                { color: RISK_COLORS[risk] || "#00b894" },
              ]}
            >
              ⚠️ Mức độ: {riskLabel}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>Mô tả</Text>
        <Text style={styles.description}>
          {course.content || "Chưa có mô tả."}
        </Text>

        {/* Gallery */}
        {course.imageUrls && course.imageUrls.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Hình ảnh ({course.imageUrls.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
            >
              {course.imageUrls.map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: img }}
                  style={styles.galleryImage}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Videos */}
        {course.videoUrls && course.videoUrls.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Video ({course.videoUrls.length})
            </Text>
            <View style={styles.videoList}>
              {course.videoUrls.map((v, i) => (
                <View key={i} style={styles.videoItem}>
                  <Text style={styles.videoIcon}>🎥</Text>
                  <Text style={styles.videoText} numberOfLines={1}>
                    {v}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Course Info Table */}
        <Text style={styles.sectionTitle}>Thông tin khoá học</Text>
        <View style={styles.infoCard}>
          <InfoRow
            label="Ngày tạo"
            value={
              course.created_at
                ? new Date(course.created_at).toLocaleString("vi-VN")
                : "—"
            }
          />
          <InfoRow
            label="Cập nhật"
            value={
              course.updated_at
                ? new Date(course.updated_at).toLocaleString("vi-VN")
                : "—"
            }
            last
          />
        </View>

        {/* Reviews */}
        {reviews.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Đánh giá ({reviews.length})</Text>
            {reviews.slice(0, 5).map((r, i) => (
              <View key={String(r._id || i)} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>
                    {r.user?.name || r.user_name || "Ẩn danh"}
                  </Text>
                  <Text style={{ fontSize: 13 }}>
                    {"⭐".repeat(r.rating || r.star || 0)}
                  </Text>
                </View>
                <Text style={styles.reviewComment}>
                  {r.comment || r.content || ""}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Remove Button */}
        <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
          <Text style={styles.removeBtnText}>🗑 Xoá khoá học này</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  backBtn: { padding: 8, marginRight: 8 },
  topBarTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#2d3436" },
  removeHeaderBtn: { padding: 8 },
  coverImage: { width: "100%", height: 220 },
  coverPlaceholder: {
    width: "100%",
    height: 160,
    backgroundColor: "#dfe6e9",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 20 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 8,
  },
  title: { flex: 1, fontSize: 22, fontWeight: "800", color: "#2d3436" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 16, fontWeight: "800", color: "#0984e3" },
  statLabel: { fontSize: 11, color: "#b2bec3", marginTop: 3 },
  statDivider: { width: 1, height: 36, backgroundColor: "#f1f2f6" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  tagText: { fontSize: 13, fontWeight: "600" },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 10,
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    color: "#636e72",
    lineHeight: 22,
    marginBottom: 20,
  },
  galleryImage: {
    width: 140,
    height: 100,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: "#dfe6e9",
  },
  videoList: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  videoIcon: { fontSize: 18, marginRight: 12 },
  videoText: { flex: 1, fontSize: 14, color: "#0984e3" },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  infoLabel: { fontSize: 14, color: "#b2bec3" },
  infoValue: {
    fontSize: 14,
    color: "#2d3436",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reviewerName: { fontSize: 14, fontWeight: "700", color: "#2d3436" },
  reviewComment: { fontSize: 14, color: "#636e72" },
  removeBtn: {
    backgroundColor: "#d63031",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  removeBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
