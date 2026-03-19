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
import cartService from "../../services/cart-service";
import courseService from "../../services/course-service";
import reviewService from "../../services/review-service";
import { formatVnd, getCoursePricing } from "../../utils/pricing";

const STAR = "⭐";
const AUDIENCE_COLORS = {
  all: "#6c5ce7",
  beginner: "#00b894",
  intermediate: "#fdcb6e",
  advanced: "#e17055",
};
const RISK_COLORS = { low: "#00b894", medium: "#fdcb6e", high: "#d63031" };

function resolveCourseDetailPayload(payload) {
  let current = payload;

  for (let i = 0; i < 6; i += 1) {
    if (Array.isArray(current)) {
      current = current[0] || null;
    }

    if (!current || typeof current !== "object") {
      return null;
    }

    const looksLikeCourse =
      current._id ||
      current.id ||
      current.name ||
      current.slug ||
      current.price != null ||
      current.discount != null;

    if (looksLikeCourse) {
      return current;
    }

    current =
      current.data ||
      current.course ||
      current.item ||
      current.result ||
      current.payload ||
      null;
  }

  return null;
}

const HTML_ENTITY_MAP = {
  amp: "&",
  apos: "'",
  quot: '"',
  lt: "<",
  gt: ">",
  nbsp: " ",
  agrave: "à",
  aacute: "á",
  acirc: "â",
  atilde: "ã",
  auml: "ä",
  aring: "å",
  egrave: "è",
  eacute: "é",
  ecirc: "ê",
  euml: "ë",
  igrave: "ì",
  iacute: "í",
  icirc: "î",
  iuml: "ï",
  ograve: "ò",
  oacute: "ó",
  ocirc: "ô",
  otilde: "õ",
  ouml: "ö",
  ugrave: "ù",
  uacute: "ú",
  ucirc: "û",
  uuml: "ü",
  yacute: "ý",
  yuml: "ÿ",
  ccedil: "ç",
  ntilde: "ñ",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
};

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_match, dec) =>
      String.fromCharCode(Number.parseInt(dec, 10) || 0),
    )
    .replace(/&#x([\da-f]+);/gi, (_match, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16) || 0),
    )
    .replace(/&([a-z]+);/gi, (match, name) => {
      const decoded = HTML_ENTITY_MAP[String(name || "").toLowerCase()];
      return decoded ?? match;
    });
}

function sanitizeCourseDescription(value) {
  if (!value) {
    return "";
  }

  const html = String(value);
  const textWithBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*p\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "- ")
    .replace(/<\s*\/\s*li\s*>/gi, "\n")
    .replace(/<\s*\/\s*(ul|ol|div|h1|h2|h3|h4|h5|h6)\s*>/gi, "\n");

  const withoutTags = textWithBreaks.replace(/<[^>]+>/g, "");
  const decoded = decodeHtmlEntities(withoutTags);

  return decoded
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/(^|\n)-\s*\n+/g, "$1- ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export default function CourseDetailScreen({ route, navigation }) {
  const { courseId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);

  const loadCourse = async () => {
    setIsLoading(true);
    try {
      const [courseData, reviewData] = await Promise.all([
        courseService.getCourseDetail(courseId),
        reviewService.getReviewsByCourse(courseId).catch(() => ({ data: [] })),
      ]);
      const resolvedCourse = resolveCourseDetailPayload(courseData);
      setCourse(resolvedCourse);
      const rList = reviewData?.data || reviewData || [];
      setReviews(Array.isArray(rList) ? rList : []);
    } catch (error) {
      console.warn("Failed to load course detail", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết khóa học.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const handleAddToCart = async () => {
    try {
      await cartService.addCourseToCart(courseId);
      Alert.alert("Đã thêm", "Khóa học đã được thêm vào giỏ hàng!", [
        {
          text: "Vào giỏ hàng",
          onPress: () => navigation.navigate("MainTabs", { screen: "Cart" }),
        },
        { text: "Tiếp tục", style: "cancel" },
      ]);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "Không thể thêm khóa học vào giỏ hàng.";
      Alert.alert("Lỗi", msg);
    }
  };

  const handleRate = () => {
    navigation.navigate("Feedback", { courseId });
  };

  const handleTrialLearn = () => {
    navigation.navigate("CoursePlayer", {
      courseId,
      courseName: course?.name || "Khóa học",
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#e17055" size="large" />
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

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || r.star || 0), 0) /
          reviews.length
        ).toFixed(1)
      : null;

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
  const { originalPrice, discountPercent, finalPrice } =
    getCoursePricing(course);
  const descriptionText = sanitizeCourseDescription(course.content);

  return (
    <View style={styles.container}>
      {/* Absolute Back Button to float over header */}
      <View style={styles.headerArea}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#e17055" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course.name || "Chi tiết"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Cover Image */}
        {hasImage ? (
          <Image
            source={{ uri: course.imageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={{ fontSize: 50 }}>🎨</Text>
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.title}>
            {course.name || "Khóa học chưa đặt tên"}
          </Text>
          <Text style={styles.meta}>
            {course.category?.name ||
              course.category_id ||
              "Dành cho học viên nhí"}
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.pricePanel}>
              {originalPrice > 0 && discountPercent > 0 ? (
                <View style={styles.priceOldRow}>
                  <Text style={styles.priceOld}>
                    {formatVnd(originalPrice)}
                  </Text>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>
                      -{discountPercent}%
                    </Text>
                  </View>
                </View>
              ) : null}

              <Text style={styles.priceFinal}>
                {originalPrice > 0 ? formatVnd(finalPrice) : "Miễn phí"}
              </Text>
              <Text style={styles.statLabel}>Giá khóa học</Text>
            </View>

            {avgRating && (
              <View style={styles.ratingBox}>
                <Text style={[styles.ratingValue, { color: "#f39c12" }]}>
                  {STAR} {avgRating}
                </Text>
                <Text style={styles.statLabel}>{reviews.length} đánh giá</Text>
              </View>
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
                {audience === "all" ? "🏫" : "🎯"} {audienceLabel}
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
                ⚠️ Mức độ: {riskLabel}
              </Text>
            </View>
          </View>

          {/* Gallery Images */}
          {course.imageUrls && course.imageUrls.length > 0 && (
            <View style={styles.gallerySection}>
              <Text style={styles.sectionTitle}>Thư viện ảnh</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.galleryScroll}
              >
                {course.imageUrls.map((img, i) => (
                  <Image
                    key={i}
                    source={{ uri: img }}
                    style={styles.galleryImage}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Videos */}
          {course.videoUrls && course.videoUrls.length > 0 && (
            <View style={styles.gallerySection}>
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
            </View>
          )}

          {/* Description */}
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.content}>
            {descriptionText || "Chưa có mô tả."}
          </Text>

          {/* Trial / Watch lessons */}
          <TouchableOpacity style={styles.trialBtn} onPress={handleTrialLearn}>
            <Text style={styles.trialBtnText}>▶ Xem bài học (Player)</Text>
          </TouchableOpacity>

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>
                Đánh giá học viên ({reviews.length})
              </Text>
              {reviews.slice(0, 5).map((r, i) => (
                <View
                  key={String(r._id || r.id || i)}
                  style={styles.reviewCard}
                >
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>
                      {r.user?.name || r.user_name || "Học viên"}
                    </Text>
                    <Text style={styles.reviewStars}>
                      {"★".repeat(r.rating || r.star || 0)}
                      {"☆".repeat(5 - (r.rating || r.star || 0))}
                    </Text>
                  </View>
                  <Text style={styles.reviewComment}>
                    {r.comment || r.content || ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.rateBtn} onPress={handleRate}>
          <Text style={styles.bottomText}>Đánh giá</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
          <Text style={styles.bottomText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#ffeaa7",
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1, backgroundColor: "#ffeaa7" },
  headerArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffeaa7",
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#e17055" },
  coverImage: { width: "100%", height: 240 },
  coverPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#fab1a0",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#d63031", marginBottom: 4 },
  meta: { fontSize: 15, color: "#e17055", fontWeight: "600", marginBottom: 20 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pricePanel: { flex: 1 },
  priceOldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  priceOld: {
    fontSize: 14,
    color: "#9aa0a6",
    textDecorationLine: "line-through",
  },
  priceBadge: {
    backgroundColor: "#ffe5e5",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d63031",
  },
  priceFinal: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#d63031",
  },
  ratingBox: {
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingValue: { fontSize: 18, fontWeight: "800" },
  statLabel: {
    fontSize: 12,
    color: "#b2bec3",
    marginTop: 4,
    fontWeight: "600",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { fontSize: 13, fontWeight: "700" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2d3436",
    marginBottom: 12,
    marginTop: 8,
  },
  content: { fontSize: 15, color: "#636e72", lineHeight: 24, marginBottom: 24 },
  gallerySection: { marginBottom: 24 },
  galleryScroll: { flexDirection: "row" },
  galleryImage: {
    width: 140,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#dfe6e9",
  },
  videoList: { backgroundColor: "#fff", borderRadius: 16, padding: 12 },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  videoIcon: { fontSize: 18, marginRight: 12 },
  videoText: { flex: 1, fontSize: 14, color: "#0984e3" },
  trialBtn: {
    backgroundColor: "#00cec9",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#00cec9",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  trialBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  reviewsSection: { marginTop: 8 },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewUser: { fontSize: 14, fontWeight: "800", color: "#2d3436" },
  reviewStars: { fontSize: 14, color: "#fdcb6e" },
  reviewComment: { fontSize: 14, color: "#636e72", lineHeight: 20 },
  bottomRow: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: "#ffeaa7",
    borderTopWidth: 1,
    borderTopColor: "#ffeaa7",
  },
  rateBtn: {
    flex: 1,
    backgroundColor: "#74b9ff",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 16,
  },
  addBtn: {
    flex: 1.5,
    backgroundColor: "#e17055",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 16,
    shadowColor: "#e17055",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
