import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ROLES } from "../../constants/roles";
import userService from "../../services/user-service";
import useAuthStore from "../../store/auth-store";

function getRoleLabel(role) {
  if (role === 0) return "Quản trị viên";
  if (role === 1) return "Nhân viên";
  if (role === 3) return "Giảng viên";
  if (role === 2) return "Học viên";
  if (role === ROLES.ADMIN) return "Quản trị viên";
  if (role === ROLES.STAFF) return "Nhân viên";
  if (role === ROLES.INSTRUCTOR) return "Giảng viên";
  return "Học viên";
}

function extractEntity(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload?.result && !Array.isArray(payload.result)) {
    return payload.result;
  }

  return payload || null;
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUserProfileLocally } = useAuthStore();
  const [profileUser, setProfileUser] = useState(user || null);
  const [isLoading, setIsLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getMe();
      const me = extractEntity(response);

      if (me && typeof me === "object") {
        setProfileUser((prev) => ({ ...(prev || {}), ...me }));
        await updateUserProfileLocally({
          name: me.name,
          email: me.email,
          date_of_birth: me.date_of_birth,
        });
      }
    } catch (error) {
      console.warn("Failed to load profile from get-me", error);
      setProfileUser(user || null);
    } finally {
      setIsLoading(false);
    }
  }, [updateUserProfileLocally, user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const role = profileUser?.role ?? user?.role;
  const roleLabel = getRoleLabel(role);
  const isCustomerRole =
    role === 2 || role === ROLES.CUSTOMER || roleLabel === "Học viên";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Hồ sơ của tôi</Text>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#e17055" />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Họ và tên</Text>
        <Text style={styles.value}>{profileUser?.name || "Học viên"}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>
          {profileUser?.email || "Không xác định"}
        </Text>

        <Text style={styles.label}>Vai trò</Text>
        <Text style={styles.value}>{roleLabel}</Text>

        {navigation && (
          <>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate("ProfileEdit")}
            >
              <Text style={styles.editText}>✏️ Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>

            {isCustomerRole ? (
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => navigation.navigate("PaymentHistory")}
              >
                <Text style={styles.historyText}>💳 Lịch sử thanh toán</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert("Đăng xuất", "Bạn có muốn đăng xuất không?", [
              { text: "Hủy", style: "cancel" },
              {
                text: "Đăng xuất",
                style: "destructive",
                onPress: logout,
              },
            ]);
          }}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fab1a0",
    padding: 24,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e17055",
    marginBottom: 16,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#636e72",
  },
  label: { fontSize: 14, color: "#636e72", marginTop: 8 },
  value: { fontSize: 16, fontWeight: "600", color: "#2d3436" },
  editButton: {
    marginTop: 20,
    backgroundColor: "#74b9ff",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  editText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  historyButton: {
    marginTop: 10,
    backgroundColor: "#a29bfe",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  historyText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  logoutButton: {
    marginTop: 10,
    backgroundColor: "#d63031",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
