import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import courseService from "../../services/course-service";
import { formatVnd, getCoursePricing } from "../../utils/pricing";

export default function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const courseData = await courseService.getCourses();
      const courseList = courseData?.data || courseData || [];
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (error) {
      console.warn("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = courses.filter((course) => {
    const name = (course.name || course.title || "").toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  const renderItem = ({ item }) => {
    const { originalPrice, discountPercent, finalPrice } =
      getCoursePricing(item);
    const categoryName = item.category?.name;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("CourseDetail", { courseId: item._id || item.id })
        }
      >
        <Text style={styles.cardTitle}>
          {item.name || "Khóa học chưa có tên"}
        </Text>
        {categoryName ? (
          <Text style={styles.cardMeta}>{categoryName}</Text>
        ) : null}

        {originalPrice <= 0 ? (
          <Text style={styles.cardPrice}>Miễn phí</Text>
        ) : (
          <View style={styles.priceWrap}>
            {discountPercent > 0 ? (
              <View style={styles.priceTopRow}>
                <Text style={styles.oldPrice}>{formatVnd(originalPrice)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{discountPercent}%</Text>
                </View>
              </View>
            ) : null}
            <Text style={styles.cardPrice}>{formatVnd(finalPrice)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cùng vẽ điều gì đó mới</Text>

      <TextInput
        style={styles.search}
        placeholder="Tìm kiếm khóa học..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#e17055" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item._id || item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Không tìm thấy khóa học.</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#e17055",
    marginBottom: 12,
  },
  search: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
  },
  cardMeta: {
    fontSize: 13,
    color: "#636e72",
    marginTop: 4,
  },
  priceWrap: {
    marginTop: 6,
    gap: 4,
  },
  priceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  oldPrice: {
    fontSize: 14,
    color: "#9aa0a6",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#ffe5e5",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d63031",
  },
  cardPrice: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#d63031",
  },
  empty: {
    textAlign: "center",
    color: "#636e72",
    marginTop: 32,
    fontSize: 15,
  },
});
