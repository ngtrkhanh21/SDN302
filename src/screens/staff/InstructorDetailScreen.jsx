import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
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
import instructorService from "../../services/instructor-service";
import userService from "../../services/user-service";

function extractEntity(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload || null;
}

function isValidImage(url) {
  return (
    typeof url === "string" &&
    /^(https?:\/\/|file:\/\/|content:\/\/|data:image\/)/i.test(url.trim())
  );
}

function normalizeImageUrl(url) {
  if (typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return trimmed;
}

function pickAvatarUrl(detail, user) {
  const candidates = [
    detail?.profilePicUrl,
    detail?.profilePicURL,
    detail?.profilePic,
    detail?.avatar,
    detail?.user?.profilePicUrl,
    detail?.user?.avatar,
    user?.profilePicUrl,
    user?.profilePicURL,
    user?.profilePic,
    user?.avatar,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate);
    if (isValidImage(normalized)) {
      return normalized;
    }
  }

  return "";
}

function toCurrency(value) {
  const number = Number(value || 0);
  return `${number.toLocaleString("vi-VN")} VND`;
}

export default function InstructorDetailScreen({ route, navigation }) {
  const instructorId = route?.params?.instructorId || "";

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detail, setDetail] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const qualificationText = useMemo(() => {
    if (
      !Array.isArray(detail?.qualifications) ||
      !detail.qualifications.length
    ) {
      return "Không có";
    }

    return detail.qualifications.join(", ");
  }, [detail?.qualifications]);

  const loadInstructorDetail = useCallback(async () => {
    if (!instructorId) {
      Alert.alert("Lỗi", "Thiếu instructorId.");
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    try {
      const response =
        await instructorService.getInstructorDetail(instructorId);
      const entity = extractEntity(response) || null;
      setDetail(entity);

      if (entity?.user_id) {
        try {
          const userResponse = await userService.getUserById(entity.user_id);
          setUserInfo(extractEntity(userResponse) || null);
        } catch (userError) {
          console.warn("Failed to load related user profile", userError);
          setUserInfo(null);
        }
      } else {
        setUserInfo(null);
      }
    } catch (error) {
      console.warn("Failed to load instructor detail", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Không thể tải chi tiết giảng viên.";
      Alert.alert("Lỗi", message);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [instructorId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadInstructorDetail();
    }, [loadInstructorDetail]),
  );

  const handleDelete = () => {
    Alert.alert("Gỡ giảng viên", "Bạn có chắc muốn gỡ giảng viên này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Gỡ",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            await instructorService.deleteInstructor(instructorId);
            Alert.alert("Thành công", "Đã gỡ giảng viên.", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]);
          } catch (error) {
            console.warn("Failed to delete instructor", error);
            const message =
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              "Không thể gỡ giảng viên.";
            Alert.alert("Lỗi", message);
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  const avatarUrl = pickAvatarUrl(detail, userInfo);
  const displayName = detail?.fullName || userInfo?.name || "Không xác định";
  const displayEmail = detail?.email || userInfo?.email || "Không xác định";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết Giảng viên</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          {isValidImage(avatarUrl) ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={34} color="#fff" />
            </View>
          )}

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <Text style={styles.infoLine}>
            Số điện thoại: {detail?.phoneNumber || "-"}
          </Text>
          <Text style={styles.infoLine}>
            Chức danh: {detail?.jobTitle || "-"}
          </Text>
          <Text style={styles.infoLine}>
            Lương: {toCurrency(detail?.salary)}
          </Text>
          <Text style={styles.infoLine}>Chứng chỉ: {qualificationText}</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() =>
              navigation.navigate("InstructorEdit", {
                instructorId,
              })
            }
          >
            <MaterialCommunityIcons
              name="square-edit-outline"
              size={20}
              color="#2563eb"
            />
            <Text style={styles.actionCardTitle}>Cập nhật</Text>
            <Text style={styles.actionCardSub}>
              Mở trang chỉnh sửa thông tin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.deleteActionCard]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={20}
                  color="#dc2626"
                />
                <Text style={[styles.actionCardTitle, styles.deleteActionText]}>
                  Gỡ giảng viên
                </Text>
                <Text style={styles.actionCardSub}>
                  Xóa giảng viên khỏi hệ thống
                </Text>
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
    backgroundColor: "#f5f7fb",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
  },
  header: {
    backgroundColor: "#2d98da",
    paddingTop: 24,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#fff",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    padding: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 10,
    backgroundColor: "#e5e7eb",
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 10,
    backgroundColor: "#94a3b8",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  profileEmail: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 3,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 2,
  },
  infoLine: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 19,
  },
  actionGrid: {
    gap: 10,
  },
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
    gap: 4,
  },
  deleteActionCard: {
    borderColor: "#fecaca",
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1d4ed8",
  },
  deleteActionText: {
    color: "#dc2626",
  },
  actionCardSub: {
    fontSize: 12,
    color: "#64748b",
  },
});
