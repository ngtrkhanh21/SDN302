// src/screens/customer/MyCoursesScreen.jsx
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import courseService from "../../services/course-service";

export default function MyCoursesScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await courseService.getMyCourses();
      const list = data?.data || data || [];
      setCourses(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn("getMyCourses failed", e);
      Alert.alert("Lỗi", "Không thể tải danh sách khóa học của bạn.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("CoursePlayer", {
          courseId: item._id || item.id,
          courseName: item.name || "Khóa học",
        })
      }
    >
      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {item.name || "Khóa học chưa đặt tên"}
          </Text>
          <Text style={styles.meta}>Chạm để tiếp tục học ▶</Text>
        </View>
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() =>
            navigation.navigate("Feedback", { courseId: item._id || item.id })
          }
        >
          <Text style={styles.reviewBtnText}>Đánh giá</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Khóa học của tôi</Text>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#e17055" />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => String(item._id || item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Bạn chưa mua khóa học nào.{"\n"}Hãy khám phá và bắt đầu học ngay!
            </Text>
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
    padding: 16,
    paddingTop: 48,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#e17055",
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#2d3436" },
  meta: { fontSize: 13, color: "#00cec9", marginTop: 4 },
  reviewBtn: {
    backgroundColor: "#74b9ff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reviewBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  empty: {
    textAlign: "center",
    color: "#636e72",
    marginTop: 40,
    fontSize: 15,
    lineHeight: 22,
  },
});
