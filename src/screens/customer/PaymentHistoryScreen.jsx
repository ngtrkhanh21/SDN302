import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import paymentService from "../../services/payment-service";
import useAuthStore from "../../store/auth-store";

export default function PaymentHistoryScreen({ navigation }) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  const userId = user?.id || user?._id;

  const loadPayments = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await paymentService.getPaymentHistoryByUser(userId);
      const list = data?.data || data || [];
      setPayments(Array.isArray(list) ? list : []);
    } catch (error) {
      console.warn("Failed to load payment history", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadPayments);
    return unsub;
  }, [navigation]);

  const getStatusColor = (status) => {
    if (status === "fail" || status === "Fail" || status === "Failed")
      return "#d63031";
    if (status === "cancelled" || status === "canceled") return "#d63031";
    if (status === "success" || status === "paid") return "#00b894";
    if (status === "failed" || status === "refunded") return "#d63031";
    return "#fdcb6e";
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Lịch sử thanh toán</Text>
      <Text style={styles.subtitle}>Tất cả giao dịch của bạn</Text>

      {isLoading ? (
        <ActivityIndicator
          style={{ marginTop: 24 }}
          color="#e17055"
          size="large"
        />
      ) : payments.length === 0 ? (
        <Text style={styles.empty}>Chưa có giao dịch nào.</Text>
      ) : (
        payments.map((item) => {
          const pid = item._id || item.id;
          const status = item.status || "pending";
          const amount = item.amount ?? item.total ?? 0;
          const method = item.paymentMethod || item.method || "VNPay";
          const dateStr = item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("vi-VN")
            : "";
          return (
            <View key={String(pid)} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.paymentId}>
                  #{String(pid).slice(-6).toUpperCase()}
                </Text>
                <Text
                  style={[styles.status, { color: getStatusColor(status) }]}
                >
                  {status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.amount}>
                {Number(amount).toLocaleString("vi-VN")} VND
              </Text>
              <View style={styles.cardRow}>
                <Text style={styles.meta}>{method}</Text>
                <Text style={styles.meta}>{dateStr}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fab1a0",
    padding: 16,
    paddingTop: 48,
  },
  backButton: { marginBottom: 4 },
  backText: { fontSize: 18, fontWeight: "700", color: "#e17055" },
  title: { fontSize: 24, fontWeight: "800", color: "#e17055", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#2d3436", marginBottom: 12 },
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
  paymentId: { fontSize: 15, fontWeight: "700", color: "#2d3436" },
  status: { fontSize: 13, fontWeight: "600" },
  amount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#e17055",
    marginVertical: 6,
  },
  meta: { fontSize: 13, color: "#636e72" },
  empty: {
    textAlign: "center",
    color: "#636e72",
    marginTop: 40,
    fontSize: 16,
  },
});
