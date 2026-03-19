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
import postService from "../../services/post-service";
import useAuthStore from "../../store/auth-store";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=00b894&color=fff";

export default function PostManageScreen({ navigation }) {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    try {
      const data = await postService.getPosts();
      const list = data?.data || data || [];
      const arr = Array.isArray(list) ? list : [];
      setPosts(arr);
      applySearch(arr, search);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách bài viết.");
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
        (p) =>
          (p.title || "").toLowerCase().includes(lq) ||
          (p.content || "").toLowerCase().includes(lq),
      ),
    );
  };

  useEffect(() => {
    loadPosts();
  }, []);
  useEffect(() => {
    applySearch(posts, search);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleDelete = (post) => {
    Alert.alert("Xoá bài viết", `Xoá "${post.title}"?`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          try {
            await postService.deletePost(post._id || post.id);
            loadPosts();
          } catch {
            Alert.alert("Lỗi", "Không thể xóa bài viết.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const hasImg = item.blogImgUrl && item.blogImgUrl.startsWith("http");
    const date = item.created_at
      ? new Date(item.created_at).toLocaleDateString("vi-VN")
      : "";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate("AdminBlogDetail", {
            blogId: item._id,
            blogData: item,
          })
        }
      >
        {hasImg && (
          <Image
            source={{ uri: item.blogImgUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.cardBody}>
          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title || "Chưa đặt tiêu đề"}
          </Text>
          <Text style={styles.postContent} numberOfLines={3}>
            {item.content || ""}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.postDate}>📅 {date}</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.deleteBtnText}>🗑 Xoá</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Blog và bài viết</Text>
          <Text style={styles.subtitle}>{filtered.length} bài viết</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AdminAddBlog")}
        >
          <Text style={styles.addBtnText}>＋ Viết</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="🔍  Tìm kiếm bài viết..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#b2bec3"
      />

      {isLoading ? (
        <ActivityIndicator
          color="#00b894"
          size="large"
          style={{ marginTop: 32 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => String(item._id || i)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có bài viết nào.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#55efc4",
    paddingTop: 56,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#00b894" },
  subtitle: { fontSize: 13, color: "#2d3436", marginTop: 2 },
  addBtn: {
    backgroundColor: "#00b894",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#00b894",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2d3436",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImage: { width: "100%", height: 180 },
  cardBody: { padding: 16 },
  postTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2d3436",
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: "#636e72",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postDate: { fontSize: 12, color: "#b2bec3" },
  deleteBtn: {
    backgroundColor: "#d63031",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  deleteBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  emptyText: {
    textAlign: "center",
    color: "#2d3436",
    marginTop: 40,
    fontSize: 15,
  },
});
