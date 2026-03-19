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
import orderService from "../../services/order-service";
import { getOrderAmount, setOrderAmount } from "../../utils/order-amount-cache";
import { formatVnd, getLineItemPricing } from "../../utils/pricing";

export default function OrderHistoryScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getMyOrders();
      const list = data?.data || data || [];
      const normalizedList = Array.isArray(list) ? list : [];
      normalizedList.forEach((orderItem) => {
        const orderId = orderItem?._id || orderItem?.id;
        const apiTotal = Number(
          orderItem?.total ??
            orderItem?.totalPrice ??
            orderItem?.finalPrice ??
            0,
        );
        if (orderId && apiTotal > 0) {
          setOrderAmount(orderId, apiTotal);
        }
      });
      setOrders(normalizedList);
    } catch (error) {
      console.warn("Failed to load orders", error);
      Alert.alert("Lỗi", "Không thể tải danh sách đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadOrders);
    return unsub;
  }, [navigation]);

  const getStatusColor = (status) => {
    if (status === "fail" || status === "Fail" || status === "Failed")
      return "#d63031";
    if (status === "cancelled" || status === "canceled") return "#d63031";
    if (status === "paid") return "#00b894";
    if (status === "failed" || status === "refunded") return "#d63031";
    return "#fdcb6e";
  };

  const handlePayNow = (orderId, fallbackTotal) => {
    navigation.navigate("Payment", { orderId, fallbackTotal });
  };

  const renderItem = ({ item }) => {
    const orderId = item._id || item.id;
    const status = item.status || "pending";
    const items = item.items || item.courses || [];
    const apiTotal = Number(
      item.total ?? item.totalPrice ?? item.finalPrice ?? 0,
    );
    const computedTotal = items.reduce((sum, lineItem) => {
      const { finalPrice } = getLineItemPricing(lineItem);
      return sum + finalPrice;
    }, 0);
    const cachedTotal = getOrderAmount(orderId);
    const total =
      apiTotal > 0 ? apiTotal : computedTotal > 0 ? computedTotal : cachedTotal;
    const createdAt = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("vi-VN")
      : "";
    const isPending = status === "pending" || status === "unpaid";

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.orderId}>Đơn #{String(orderId).slice(-6)}</Text>
          <Text style={[styles.status, { color: getStatusColor(status) }]}>
            {status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.total}>{formatVnd(total)}</Text>
        {createdAt ? <Text style={styles.date}>{createdAt}</Text> : null}

        <View style={styles.cardActions}>
          {/* Feedback for paid orders */}
          {status === "paid" && items.length > 0 && (
            <TouchableOpacity
              style={styles.feedbackBtn}
              onPress={() => {
                const firstCourseId =
                  items[0]?.course_id ||
                  items[0]?.course?._id ||
                  items[0]?.course?.id;
                if (firstCourseId) {
                  navigation.navigate("Feedback", { courseId: firstCourseId });
                }
              }}
            >
              <Text style={styles.feedbackText}>Đánh giá</Text>
            </TouchableOpacity>
          )}

          {/* Pay now for pending orders */}
          {isPending && (
            <TouchableOpacity
              style={styles.payNowBtn}
              onPress={() => handlePayNow(orderId, total)}
            >
              <Text style={styles.payNowText}>Thanh toán ngay</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lịch sử đơn hàng</Text>
      <Text style={styles.subtitle}>Các đơn hàng bạn đã tạo</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#d35400" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item._id || item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có đơn hàng nào.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdcb6e",
    padding: 16,
    paddingTop: 48,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#d35400", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#2d3436", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: { fontSize: 16, fontWeight: "700", color: "#2d3436" },
  status: { fontSize: 14, fontWeight: "600" },
  total: { fontSize: 15, color: "#636e72", marginTop: 4 },
  date: { fontSize: 12, color: "#b2bec3", marginTop: 2 },
  cardActions: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  feedbackBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#74b9ff",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  feedbackText: { color: "#0984e3", fontWeight: "600", fontSize: 13 },
  payNowBtn: {
    flex: 1,
    backgroundColor: "#e17055",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  payNowText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  empty: {
    textAlign: "center",
    color: "#2d3436",
    marginTop: 24,
  },
});
