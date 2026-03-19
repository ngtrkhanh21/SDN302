import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
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
import userService from "../../services/user-service";

function extractEntity(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload || null;
}

export default function StaffBlogDetailScreen({ route, navigation }) {
  const { blogId, blogData } = route.params || {};
  const [blog, setBlog] = useState(blogData || null);
  const [authorName, setAuthorName] = useState("Đang cập nhật");
  const [isLoading, setIsLoading] = useState(!blogData);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAuthorName = useCallback(async (userId) => {
    if (!userId) {
      setAuthorName("Không xác định");
      return;
    }

    try {
      const userResponse = await userService.getUserById(userId);
      const user = extractEntity(userResponse);
      setAuthorName(user?.name || "Không xác định");
    } catch (error) {
      console.warn("Failed to load blog author", error);
      setAuthorName("Không xác định");
    }
  }, []);

  const loadDetail = useCallback(async () => {
    const id = blogId || blogData?._id;
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await postService.getPostById(id);
      const detail = extractEntity(response);
      setBlog(detail);
      await loadAuthorName(detail?.user_id);
    } catch (error) {
      console.warn("Failed to load blog detail", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết bài viết.");
    } finally {
      setIsLoading(false);
    }
  }, [blogData?._id, blogId, loadAuthorName]);

  useEffect(() => {
    if (blogData?.user_id) {
      loadAuthorName(blogData.user_id);
    }
    loadDetail();
  }, [blogData?.user_id, loadAuthorName, loadDetail]);

  const handleDelete = () => {
    if (!blog?._id) {
      return;
    }

    Alert.alert(
      "Xóa bài viết",
      `Bạn có chắc muốn xóa \"${blog.title || "bài viết này"}\"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await postService.deletePost(blog._id);
              Alert.alert("Thành công", "Đã xóa bài viết.", [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.warn("Failed to delete blog", error);
              Alert.alert("Lỗi", "Không thể xóa bài viết.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#8e44ad" />
      </View>
    );
  }

  if (!blog) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.notFoundText}>Không tìm thấy bài viết.</Text>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasImage = !!blog.blogImgUrl;
  const createdAt = blog.created_at
    ? new Date(blog.created_at).toLocaleString("vi-VN")
    : "Không xác định";

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#2c3e50" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          Chi tiết bài viết
        </Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("StaffBlogForm", {
              mode: "edit",
              blogId: blog._id,
              initialData: blog,
            })
          }
          style={styles.iconBtn}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#8e44ad" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {hasImage ? (
          <Image
            source={{ uri: blog.blogImgUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons
              name="image-off"
              size={40}
              color="#95a5a6"
            />
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.title}>{blog.title || "Không có tiêu đề"}</Text>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="account" size={16} color="#7f8c8d" />
            <Text style={styles.metaText}>Người đăng: {authorName}</Text>
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar" size={16} color="#7f8c8d" />
            <Text style={styles.metaText}>Ngày tạo: {createdAt}</Text>
          </View>

          <Text style={styles.sectionTitle}>Nội dung</Text>
          <Text style={styles.contentText}>
            {blog.content || "Không có nội dung"}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              navigation.navigate("StaffBlogForm", {
                mode: "edit",
                blogId: blog._id,
                initialData: blog,
              })
            }
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Chỉnh sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, isDeleting && styles.disabledBtn]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="delete" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Xóa</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
    padding: 24,
  },
  notFoundText: {
    fontSize: 15,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  secondaryBtn: {
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2c3e50",
  },
  topBar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 22,
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
    marginHorizontal: 12,
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 28,
  },
  coverImage: {
    width: "100%",
    height: 210,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#ecf0f1",
  },
  imagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: "#555",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2c3e50",
    marginTop: 10,
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: "#34495e",
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#8e44ad",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
