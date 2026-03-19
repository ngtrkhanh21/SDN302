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
import postService from "../../services/post-service";

export default function AdminBlogDetailScreen({ route, navigation }) {
  const { blogId, blogData } = route.params;
  const [blog, setBlog] = useState(blogData || null);
  const [isLoading, setIsLoading] = useState(!blogData);

  useEffect(() => {
    if (!blogData) {
      postService
        .getPostById(blogId)
        .then((res) => {
          const b = res?.data || res || null;
          setBlog(b);
        })
        .catch(() => Alert.alert("Lỗi", "Không thể tải bài viết."))
        .finally(() => setIsLoading(false));
    }
  }, [blogId]);

  const handleDelete = () => {
    Alert.alert("Xoá bài viết", `Xoá "${blog?.title}"?`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          try {
            await postService.deletePost(blogId);
            Alert.alert("Đã xoá", "Bài viết đã được xoá.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } catch {
            Alert.alert("Lỗi", "Không thể xóa bài viết.");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00b894" size="large" />
      </View>
    );
  }

  if (!blog) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: "#636e72" }}>Không tìm thấy bài viết.</Text>
      </View>
    );
  }

  const hasImg = blog.blogImgUrl && blog.blogImgUrl.startsWith("http");
  const createdAt = blog.created_at
    ? new Date(blog.created_at).toLocaleString("vi-VN")
    : "—";
  const updatedAt = blog.updated_at
    ? new Date(blog.updated_at).toLocaleString("vi-VN")
    : "—";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Top Nav */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#00b894" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {blog.title}
        </Text>
        <TouchableOpacity style={styles.deleteHeaderBtn} onPress={handleDelete}>
          <Text style={{ fontSize: 20 }}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Cover Image */}
      {hasImg ? (
        <Image
          source={{ uri: blog.blogImgUrl }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={{ fontSize: 52 }}>📝</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Title */}
        <Text style={styles.title}>{blog.title}</Text>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>📅 {createdAt}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        <Text style={styles.content}>{blog.content}</Text>

        {/* Info card */}
        <Text style={styles.sectionTitle}>Thông tin</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Ngày tạo" value={createdAt} />
          <InfoRow label="Cập nhật" value={updatedAt} last />
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>🗑 Xoá bài viết này</Text>
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
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: { padding: 8, marginRight: 8 },
  topBarTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#2d3436" },
  deleteHeaderBtn: { padding: 8 },
  coverImage: { width: "100%", height: 240 },
  coverPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2d3436",
    marginBottom: 10,
  },
  metaRow: { flexDirection: "row", marginBottom: 16 },
  metaText: { fontSize: 13, color: "#b2bec3", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#f1f2f6", marginBottom: 20 },
  content: { fontSize: 16, color: "#2d3436", lineHeight: 26, marginBottom: 28 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
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
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  deleteBtn: {
    backgroundColor: "#d63031",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  deleteBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
