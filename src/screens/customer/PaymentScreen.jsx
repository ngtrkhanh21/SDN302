import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import orderService from "../../services/order-service";
import paymentService from "../../services/payment-service";
import vnpayService from "../../services/vnpay-service";

export default function PaymentScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [vnpayUrl, setVnpayUrl] = useState("");
  const [isWebviewVisible, setIsWebviewVisible] = useState(false);
  const hasHandledReturnRef = useRef(false);
  const hasShownBlockedLinkAlertRef = useRef(false);
  const paymentMetaRef = useRef({ orderId: orderId || "", paymentId: "" });

  const parseQueryParamsFromUrl = (url) => {
    if (!url || !url.includes("?")) {
      return {};
    }

    const queryString = url.split("?")[1] || "";
    const searchParams = new URLSearchParams(queryString);
    const params = {};

    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    return params;
  };

  const isVNPayReturnUrl = (url) => {
    if (!url) {
      return false;
    }

    const normalized = url.toLowerCase();
    return (
      normalized.includes("/api/vnpay/return") ||
      normalized.includes("vnp_responsecode") ||
      normalized.includes("vnp_transactionstatus")
    );
  };

  const normalizePaymentStatus = (params) => {
    const rawStatus = String(params?.status || "").toLowerCase();
    if (rawStatus === "paid" || rawStatus === "success") {
      return "paid";
    }

    if (
      rawStatus === "failed" ||
      rawStatus === "cancel" ||
      rawStatus === "cancelled" ||
      rawStatus === "rejected"
    ) {
      return "failed";
    }

    const rspCode =
      params?.vnp_ResponseCode ||
      params?.vnp_responsecode ||
      params?.RspCode ||
      params?.responseCode ||
      "";

    const txnStatus =
      params?.vnp_TransactionStatus || params?.vnp_transactionstatus || "";

    if (rspCode || txnStatus) {
      if (
        String(rspCode) === "00" &&
        (!txnStatus || String(txnStatus) === "00")
      ) {
        return "paid";
      }

      return "failed";
    }

    return "failed";
  };

  const navigateToVNPayReturn = (params) => {
    const paymentStatus = normalizePaymentStatus(params);
    const paymentMeta = paymentMetaRef.current || {};

    navigation.replace("VNPayReturn", {
      ...params,
      status: paymentStatus,
      orderId: params?.orderId || params?.order_id || paymentMeta.orderId,
      paymentId:
        params?.paymentId || params?.payment_id || paymentMeta.paymentId,
    });
  };

  const syncFailedStatusesOnCancel = async () => {
    const paymentMeta = paymentMetaRef.current || {};
    const currentOrderId = paymentMeta.orderId || orderId;
    const currentPaymentId = paymentMeta.paymentId || "";

    const orderStatusCandidates = [
      "Failed",
      "failed",
      "fail",
      "cancelled",
      "canceled",
    ];

    const paymentPayloadCandidates = [
      { status: "failed" },
      { status: "Failed" },
      { paymentStatus: "failed" },
      { paymentStatus: "Failed" },
      { newStatus: "failed" },
      { status: "cancelled" },
    ];

    if (currentOrderId) {
      for (const nextStatus of orderStatusCandidates) {
        try {
          await orderService.updateOrderStatus(currentOrderId, nextStatus);
          break;
        } catch (_e) {
          // Try next status value if backend expects a specific enum.
        }
      }
    }

    if (currentPaymentId) {
      for (const payload of paymentPayloadCandidates) {
        try {
          await paymentService.updatePaymentStatus(currentPaymentId, payload);
          break;
        } catch (_e) {
          // Try next payload shape if backend expects different fields.
        }
      }
    }
  };

  const handleCancelPayment = () => {
    if (hasHandledReturnRef.current) {
      return;
    }

    Alert.alert(
      "Hủy thanh toán",
      "Bạn có chắc muốn hủy giao dịch VNPay không?",
      [
        { text: "Tiếp tục thanh toán", style: "cancel" },
        {
          text: "Hủy giao dịch",
          style: "destructive",
          onPress: async () => {
            hasHandledReturnRef.current = true;
            setIsWebviewVisible(false);

            await syncFailedStatusesOnCancel();

            navigateToVNPayReturn({
              status: "failed",
              reason: "cancelled_by_user",
            });
          },
        },
      ],
    );
  };

  const handlePotentialReturnUrl = (url) => {
    if (!isVNPayReturnUrl(url) || hasHandledReturnRef.current) {
      return false;
    }

    hasHandledReturnRef.current = true;
    setIsWebviewVisible(false);
    const params = parseQueryParamsFromUrl(url);
    navigateToVNPayReturn(params);
    return true;
  };

  const extractIntentFallbackUrl = (url) => {
    if (!url || !url.startsWith("intent://")) {
      return "";
    }

    const browserFallbackMatch = url.match(/S\.browser_fallback_url=([^;]+)/i);
    if (browserFallbackMatch?.[1]) {
      try {
        return decodeURIComponent(browserFallbackMatch[1]);
      } catch (_e) {
        return browserFallbackMatch[1];
      }
    }

    return "";
  };

  const normalizeCheckoutUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== "string") {
      return "";
    }

    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }

    if (rawUrl.startsWith("intent://")) {
      return extractIntentFallbackUrl(rawUrl);
    }

    return "";
  };

  const handlePayWithVNPay = async () => {
    setIsLoading(true);
    hasHandledReturnRef.current = false;
    hasShownBlockedLinkAlertRef.current = false;

    try {
      const paymentResponse = await paymentService.createPaymentFromOrder(
        orderId,
        "vnpay",
      );

      const paymentData =
        paymentResponse?.data && !Array.isArray(paymentResponse.data)
          ? paymentResponse.data
          : paymentResponse;

      const paymentId =
        paymentData?._id || paymentData?.id || paymentData?.paymentId;
      if (!paymentId) {
        Alert.alert(
          "Error",
          "Không lấy được paymentId từ createPaymentFromOrder.",
        );
        return;
      }

      paymentMetaRef.current = {
        orderId,
        paymentId,
      };

      const orderInfo = `Thanh toan don hang ${orderId}`;
      const vnpayResponse = await vnpayService.createVNPayUrl(
        paymentId,
        orderInfo,
      );

      const url =
        vnpayResponse?.url ||
        vnpayResponse?.data?.url ||
        vnpayResponse?.paymentUrl ||
        vnpayResponse?.data?.paymentUrl;

      if (url) {
        const normalizedUrl = normalizeCheckoutUrl(url);
        if (!normalizedUrl) {
          Alert.alert(
            "Lỗi",
            "Không thể mở trang thanh toán trực tiếp trong ứng dụng.",
          );
          return;
        }

        setVnpayUrl(normalizedUrl);
        setIsWebviewVisible(true);
      } else {
        Alert.alert("Info", "Không nhận được URL thanh toán VNPay.");
      }
    } catch (error) {
      console.warn("Failed to create payment", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Cannot create payment.";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>Order ID: {orderId}</Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handlePayWithVNPay}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay with VNPay</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Back to cart</Text>
      </TouchableOpacity>

      <Modal
        visible={isWebviewVisible}
        animationType="slide"
        onRequestClose={handleCancelPayment}
      >
        <View style={styles.webviewHeader}>
          <Text style={styles.webviewTitle}>VNPay Checkout</Text>
          <TouchableOpacity
            onPress={handleCancelPayment}
            style={styles.webviewCloseBtn}
          >
            <Text style={styles.webviewCloseText}>Đóng</Text>
          </TouchableOpacity>
        </View>

        {vnpayUrl ? (
          <WebView
            source={{ uri: vnpayUrl }}
            startInLoadingState
            setSupportMultipleWindows={false}
            onNavigationStateChange={(navState) => {
              handlePotentialReturnUrl(navState?.url || "");
            }}
            onShouldStartLoadWithRequest={(request) => {
              const requestUrl = request?.url || "";

              if (handlePotentialReturnUrl(requestUrl)) {
                return false;
              }

              if (
                requestUrl.startsWith("http://") ||
                requestUrl.startsWith("https://") ||
                requestUrl.startsWith("about:blank") ||
                requestUrl.startsWith("data:")
              ) {
                return true;
              }

              if (requestUrl.startsWith("intent://")) {
                const fallbackUrl = extractIntentFallbackUrl(requestUrl);
                if (fallbackUrl) {
                  setVnpayUrl(fallbackUrl);
                  return false;
                }
              }

              if (!hasShownBlockedLinkAlertRef.current) {
                hasShownBlockedLinkAlertRef.current = true;
                Alert.alert(
                  "Thông báo",
                  "Đã chặn mở trình duyệt ngoài. Vui lòng thanh toán trực tiếp trong màn hình này.",
                );
              }

              return false;
            }}
            renderLoading={() => (
              <View style={styles.webviewLoadingContainer}>
                <ActivityIndicator size="large" color="#e17055" />
                <Text style={styles.webviewLoadingText}>Đang tải VNPay...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.webviewLoadingContainer}>
            <ActivityIndicator size="large" color="#e17055" />
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdcb6e",
    padding: 24,
    paddingTop: 16,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#d35400",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#d35400",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#2d3436",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#e17055",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  backBtn: {
    marginTop: 16,
    alignItems: "center",
  },
  backText: {
    color: "#0984e3",
    fontSize: 16,
    fontWeight: "600",
  },
  webviewHeader: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d3436",
  },
  webviewCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f2f6",
  },
  webviewCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d3436",
  },
  webviewLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  webviewLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#636e72",
  },
});
