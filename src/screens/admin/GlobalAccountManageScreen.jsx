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
import userService from "../../services/user-service";

const ROLE_MAP = {
  0: { label: "Quản trị viên", color: "#d63031", bg: "#ffe8e6" },
  1: { label: "Nhân viên", color: "#0984e3", bg: "#e3f2fd" },
  2: { label: "Học viên", color: "#00b894", bg: "#e8f8f5" },
  3: { label: "Giảng viên", color: "#6c5ce7", bg: "#f0edff" },
};

const VERIFY_MAP = {
  0: { label: "Chưa xác minh", color: "#fdcb6e" },
  1: { label: "Đã xác minh", color: "#00b894" },
};

export default function GlobalAccountManageScreen() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null); // null = all

  const loadUsers = async () => {
    try {
      const res = await userService.getAllUsers();
      const list = res?.data || res || [];
      // Remove admin (role === 0) from the list
      const arr = Array.isArray(list) ? list.filter((u) => u.role !== 0) : [];
      setUsers(arr);
      applyFilters(arr, search, selectedRole);
    } catch (error) {
      console.warn("Failed to load users", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể tải danh sách tài khoản.",
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (list, q, role) => {
    let result = list;
    if (q.trim()) {
      const lq = q.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(lq) ||
          (u.email || "").toLowerCase().includes(lq) ||
          (u.username || "").toLowerCase().includes(lq),
      );
    }
    if (role !== null) {
      result = result.filter((u) => u.role === role);
    }
    setFiltered(result);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters(users, search, selectedRole);
  }, [search, selectedRole]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const renderUser = ({ item }) => {
    const role = ROLE_MAP[item.role] || {
      label: "Không xác định",
      color: "#636e72",
      bg: "#f1f2f6",
    };
    const verify = VERIFY_MAP[item.verify] || {
      label: "Không xác định",
      color: "#b2bec3",
    };
    const dob = item.date_of_birth
      ? new Date(item.date_of_birth).toLocaleDateString("vi-VN")
      : null;
    const hasAvatar = item.avatar && item.avatar.startsWith("http");

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          {/* Avatar */}
          {hasAvatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(item.name || item.username || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name || item.username || "Chưa có tên"}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>
            {dob && <Text style={styles.userMeta}>🎂 {dob}</Text>}
            {item.location ? (
              <Text style={styles.userMeta}>📍 {item.location}</Text>
            ) : null}
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: role.bg }]}>
            <Text style={[styles.badgeText, { color: role.color }]}>
              {role.label}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#f1f2f6" }]}>
            <Text style={[styles.badgeText, { color: verify.color }]}>
              {verify.label}
            </Text>
          </View>
          {item.bio ? (
            <View style={[styles.badge, { backgroundColor: "#f1f2f6" }]}>
              <Text
                style={[styles.badgeText, { color: "#636e72" }]}
                numberOfLines={1}
              >
                {item.bio.slice(0, 24)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const roleFilters = [
    { label: "Tất cả", value: null },
    { label: "Nhân viên", value: 1 },
    { label: "Học viên", value: 2 },
    { label: "Giảng viên", value: 3 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý tài khoản</Text>
      <Text style={styles.subtitle}>Tìm thấy {filtered.length} tài khoản</Text>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="🔍  Tìm theo tên, email hoặc username..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#b2bec3"
      />

      {/* Role filter chips */}
      <View style={styles.filterRow}>
        {roleFilters.map((f) => (
          <TouchableOpacity
            key={String(f.value)}
            style={[
              styles.filterChip,
              selectedRole === f.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedRole(f.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedRole === f.value && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator
          color="#e17055"
          size="large"
          style={{ marginTop: 32 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => String(item._id || index)}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không tìm thấy tài khoản nào.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffeaa7",
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#e17055", marginBottom: 2 },
  subtitle: { fontSize: 14, color: "#636e72", marginBottom: 12 },
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 6,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#dfe6e9",
  },
  filterChipActive: { backgroundColor: "#e17055", borderColor: "#e17055" },
  filterChipText: { fontSize: 13, color: "#636e72", fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 54, height: 54, borderRadius: 27, marginRight: 12 },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#e17055",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarInitial: { fontSize: 22, fontWeight: "800", color: "#fff" },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 2,
  },
  userEmail: { fontSize: 13, color: "#636e72", marginBottom: 2 },
  userMeta: { fontSize: 12, color: "#b2bec3" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  emptyText: {
    textAlign: "center",
    color: "#b2bec3",
    marginTop: 40,
    fontSize: 15,
  },
});
