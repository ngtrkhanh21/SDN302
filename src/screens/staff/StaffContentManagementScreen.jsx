import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import postService from "../../services/post-service";
import userService from "../../services/user-service";

function extractList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  return [];
}

function extractEntity(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload || null;
}

export default function StaffContentManagementScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [authorsMap, setAuthorsMap] = useState({});

  const loadPosts = useCallback(async (withLoader = true) => {
    if (withLoader) {
      setIsLoading(true);
    }

    try {
      const postsResponse = await postService.getPosts();
      const postList = extractList(postsResponse).filter(
        (item) => !item?.isDeleted,
      );
      setPosts(postList);

      const userIds = [
        ...new Set(postList.map((item) => item?.user_id).filter(Boolean)),
      ];
      if (userIds.length === 0) {
        setAuthorsMap({});
        return;
      }

      const userResults = await Promise.allSettled(
        userIds.map((userId) => userService.getUserById(userId)),
      );

      const nextAuthorsMap = {};
      userResults.forEach((result, idx) => {
        const userId = userIds[idx];

        if (result.status === "fulfilled") {
          const userEntity = extractEntity(result.value);
          nextAuthorsMap[userId] = userEntity?.name || "Không xác định";
          return;
        }

        nextAuthorsMap[userId] = "Không xác định";
      });

      setAuthorsMap(nextAuthorsMap);
    } catch (error) {
      console.warn("Failed to load posts", error);
      Alert.alert("Lỗi", "Không thể tải danh sách bài viết.");
    } finally {
      if (withLoader) {
        setIsLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts(true);
    }, [loadPosts]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts(false);
  };

  const handleDelete = (blog) => {
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
              await postService.deletePost(blog._id);
              Alert.alert("Thành công", "Đã xóa bài viết.");
              loadPosts(false);
            } catch (error) {
              console.warn("Failed to delete post", error);
              Alert.alert("Lỗi", "Không thể xóa bài viết.");
            }
          },
        },
      ],
    );
  };

  const renderPostItem = ({ item }) => {
    const imageUrl = item.blogImgUrl || item.imageUrl || "";
    const hasImage = !!imageUrl;
    const createdDate = item.created_at
      ? new Date(item.created_at).toLocaleDateString("vi-VN")
      : "Không xác định";
    const authorName = authorsMap[item.user_id] || "Không xác định";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() =>
          navigation.navigate("StaffBlogDetail", {
            blogId: item._id,
            blogData: item,
          })
        }
      >
        {hasImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons
              name="image-off"
              size={38}
              color="#bdc3c7"
            />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title || "Không có tiêu đề"}
          </Text>

          <Text style={styles.postContent} numberOfLines={3}>
            {item.content || "Không có nội dung"}
          </Text>

          <View style={styles.infoLine}>
            <MaterialCommunityIcons name="account" size={15} color="#7f8c8d" />
            <Text style={styles.infoText} numberOfLines={1}>
              Người đăng: {authorName}
            </Text>
          </View>

          <View style={styles.infoLine}>
            <MaterialCommunityIcons name="calendar" size={15} color="#7f8c8d" />
            <Text style={styles.infoText}>Ngày tạo: {createdDate}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                navigation.navigate("StaffBlogForm", {
                  mode: "edit",
                  blogId: item._id,
                  initialData: item,
                })
              }
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
              <Text style={styles.actionText}>Chỉnh sửa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
            >
              <MaterialCommunityIcons name="delete" size={16} color="#fff" />
              <Text style={styles.actionText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="folder-open" size={64} color="#bdc3c7" />
      <Text style={styles.emptyText}>Không có bài viết</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quản lí bài viết</Text>
          <Text style={styles.headerSubtitle}>
            Quản lý bài viết trong hệ thống
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() =>
            navigation.navigate("StaffBlogForm", { mode: "create" })
          }
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8e44ad" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  header: {
    backgroundColor: "#8e44ad",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#f5dfff",
    marginTop: 4,
  },
  addBtn: {
    backgroundColor: "#2d98da",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  postImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#ecf0f1",
  },
  imagePlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: {
    padding: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 8,
  },
  postContent: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    marginBottom: 10,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: "#7f8c8d",
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  editBtn: {
    flex: 1,
    padding: 9,
    borderRadius: 6,
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deleteBtn: {
    flex: 1,
    padding: 9,
    borderRadius: 6,
    backgroundColor: "#e74c3c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#95a5a6",
    marginTop: 12,
    fontWeight: "500",
  },
});
