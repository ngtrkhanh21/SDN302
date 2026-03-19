import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import instructorService from "../../services/instructor-service";
import userService from "../../services/user-service";

const ROLE_LABELS = {
  0: "Quản trị viên",
  1: "Nhân viên",
  2: "Học viên",
  3: "Giảng viên",
};

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

function formatRole(role) {
  if (typeof role === "number") {
    return ROLE_LABELS[role] || `Vai trò ${role}`;
  }

  if (typeof role === "string") {
    const normalized = role.toLowerCase();
    if (normalized === "admin") return "Quản trị viên";
    if (normalized === "staff") return "Nhân viên";
    if (normalized === "instructor" || normalized === "teacher")
      return "Giảng viên";
    if (normalized === "customer" || normalized === "student")
      return "Học viên";
    return role;
  }

  return "Không xác định";
}

function formatDate(value) {
  if (!value) {
    return "Không xác định";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Không xác định";
  }

  return date.toLocaleDateString("vi-VN");
}

function isValidImage(url) {
  return (
    typeof url === "string" &&
    /^(https?:\/\/|file:\/\/|content:\/\/|data:image\/)/i.test(url.trim())
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={16} color="#7f8c8d" />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value || "Không xác định"}
      </Text>
    </View>
  );
}

export default function InstructorProfilesScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  const loadInstructors = useCallback(async (withLoader = true) => {
    if (withLoader) {
      setIsLoading(true);
    }

    try {
      const response = await instructorService.getInstructors();
      const instructorList = extractList(response);
      setInstructors(instructorList);

      const userIds = [
        ...new Set(instructorList.map((item) => item?.user_id).filter(Boolean)),
      ];

      if (userIds.length === 0) {
        setUsersMap({});
        return;
      }

      const userResponses = await Promise.allSettled(
        userIds.map((userId) => userService.getUserById(userId)),
      );

      const nextUsersMap = {};
      userResponses.forEach((result, index) => {
        const userId = userIds[index];
        if (result.status === "fulfilled") {
          nextUsersMap[userId] = extractEntity(result.value) || {};
          return;
        }
        nextUsersMap[userId] = {};
      });

      setUsersMap(nextUsersMap);
    } catch (error) {
      console.warn("Failed to load instructors", error);
    } finally {
      if (withLoader) {
        setIsLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInstructors(true);
    }, [loadInstructors]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadInstructors(false);
  };

  const renderInstructorItem = ({ item }) => {
    const user = usersMap[item.user_id] || {};

    const avatarUrl = isValidImage(item.profilePicUrl)
      ? item.profilePicUrl
      : isValidImage(user.avatar)
        ? user.avatar
        : null;

    const fullName = item.fullName || user.name || "Không xác định";
    const email = item.email || user.email || "Không xác định";
    const phone = item.phoneNumber || user.phoneNumber || "Không xác định";
    const gender = item.gender || user.gender || "Không xác định";
    const role = formatRole(item.role ?? user.role);
    const birthday = formatDate(
      item.date_of_birth || item.dateOfBirth || user.date_of_birth,
    );

    const instructorId = item?._id || item?.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          if (!instructorId) {
            return;
          }
          navigation.navigate("InstructorDetail", {
            instructorId,
          });
        }}
      >
        <View style={styles.cardHeader}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={28} color="#fff" />
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.nameText} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.emailText} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoRow icon="phone" label="Số điện thoại" value={phone} />
          <InfoRow icon="gender-male-female" label="Giới tính" value={gender} />
          <InfoRow icon="shield-account" label="Vai trò" value={role} />
          <InfoRow icon="cake-variant" label="Ngày sinh" value={birthday} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="school-outline" size={62} color="#bdc3c7" />
      <Text style={styles.emptyText}>Không có giảng viên</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lí Giảng viên</Text>
        <Text style={styles.headerSubtitle}>
          {instructors.length} giảng viên
        </Text>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={instructors}
          renderItem={renderInstructorItem}
          keyExtractor={(item, index) =>
            item._id || item.user_id || String(index)
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
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
    backgroundColor: "#2d98da",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#dff4ff",
    marginTop: 4,
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
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ecf0f1",
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#7f8c8d",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 13,
    color: "#7f8c8d",
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: "#7f8c8d",
    minWidth: 86,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: "#2c3e50",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#95a5a6",
    fontWeight: "500",
  },
});
