import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import courseService from "../../services/course-service";
import orderService from "../../services/order-service";
import paymentService from "../../services/payment-service";
import vnpayService from "../../services/vnpay-service";

function extractEntity(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload || null;
}

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

function normalizeStatus(payload) {
  if (typeof payload === "string") {
    const normalizedText = payload.toLowerCase();

    if (
      normalizedText.includes("thanh toán thành công") ||
      normalizedText.includes("payment success")
    ) {
      return "paid";
    }

    if (
      normalizedText.includes("thanh toán thất bại") ||
      normalizedText.includes("payment failed") ||
      normalizedText.includes("hủy") ||
      normalizedText.includes("cancel")
    ) {
      return "failed";
    }
  }

  const rawStatus = String(payload?.status || "").toLowerCase();

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
    payload?.vnp_ResponseCode ||
    payload?.vnp_responsecode ||
    payload?.RspCode ||
    payload?.responseCode ||
    "";

  const txnStatus =
    payload?.vnp_TransactionStatus || payload?.vnp_transactionstatus || "";

  if (rspCode || txnStatus) {
    if (
      String(rspCode) === "00" &&
      (!txnStatus || String(txnStatus) === "00")
    ) {
      return "paid";
    }

    return "failed";
  }

  return "";
}

function pickFirstId(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function normalizeOrderStatus(value) {
  return String(value || "").toLowerCase();
}

function isPaidLikeStatus(value) {
  const normalized = normalizeOrderStatus(value);
  return (
    normalized === "paid" ||
    normalized === "success" ||
    normalized === "completed"
  );
}

function extractOrderCourseIds(orderEntity) {
  const items =
    orderEntity?.items || orderEntity?.courses || orderEntity?.orderItems || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) =>
      pickFirstId(
        item?.course_id,
        item?.course?._id,
        item?.course?.id,
        item?.courseId,
      ),
    )
    .filter(Boolean);
}

function extractMyCourseIds(myCoursesPayload) {
  const courses = extractList(myCoursesPayload);
  return courses
    .map((course) => pickFirstId(course?._id, course?.id))
    .filter(Boolean);
}

function toVNPayParams(rawParams) {
  const result = {};
  Object.entries(rawParams || {}).forEach(([key, value]) => {
    if (key?.startsWith("vnp_")) {
      result[key] = value;
    }
  });
  return result;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function syncOrderPaid(orderId) {
  if (!orderId) {
    return;
  }

  const statusCandidates = ["paid", "completed", "success"];
  for (const nextStatus of statusCandidates) {
    try {
      await orderService.updateOrderStatus(orderId, nextStatus);
      return;
    } catch (_e) {
      // Try next status value if backend expects different enum names.
    }
  }
}

async function syncPaymentPaid(paymentId) {
  if (!paymentId) {
    return;
  }

  const payloadCandidates = [
    { status: "paid" },
    { paymentStatus: "paid" },
    { newStatus: "paid" },
    { status: "success" },
  ];

  for (const payload of payloadCandidates) {
    try {
      await paymentService.updatePaymentStatus(paymentId, payload);
      return;
    } catch (_e) {
      // Try next payload shape if backend expects different field names.
    }
  }
}

async function syncOrderFailed(orderId) {
  if (!orderId) {
    return;
  }

  const statusCandidates = [
    "Failed",
    "failed",
    "fail",
    "cancelled",
    "canceled",
  ];

  for (const nextStatus of statusCandidates) {
    try {
      await orderService.updateOrderStatus(orderId, nextStatus);
      return;
    } catch (_e) {
      // Try next status value if backend expects a specific enum.
    }
  }
}

async function syncPaymentFailed(paymentId) {
  if (!paymentId) {
    return;
  }

  const payloadCandidates = [
    { status: "failed" },
    { status: "Failed" },
    { paymentStatus: "failed" },
    { paymentStatus: "Failed" },
    { newStatus: "failed" },
    { status: "cancelled" },
  ];

  for (const payload of payloadCandidates) {
    try {
      await paymentService.updatePaymentStatus(paymentId, payload);
      return;
    } catch (_e) {
      // Try next payload shape if backend expects different fields.
    }
  }
}

async function waitUntilOrderPaid(orderId, maxAttempts = 8) {
  if (!orderId) {
    return { isPaid: false, orderEntity: null };
  }

  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const detail = await orderService.getOrderDetail(orderId);
      const orderEntity = extractEntity(detail) || detail;
      const status = normalizeOrderStatus(
        orderEntity?.status || orderEntity?.orderStatus,
      );

      if (isPaidLikeStatus(status)) {
        return { isPaid: true, orderEntity };
      }

      if (i < maxAttempts - 1) {
        await sleep(1200);
      }
    } catch (_e) {
      if (i < maxAttempts - 1) {
        await sleep(1200);
      }
    }
  }

  return { isPaid: false, orderEntity: null };
}

async function waitUntilMyCoursesReady(courseIds, maxAttempts = 8) {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    return false;
  }

  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const myCoursesData = await courseService.getMyCourses();
      const myCourseIds = extractMyCourseIds(myCoursesData);
      const hasAnyPurchasedCourse = courseIds.some((id) =>
        myCourseIds.includes(id),
      );
      if (hasAnyPurchasedCourse) {
        return true;
      }

      if (i < maxAttempts - 1) {
        await sleep(1200);
      }
    } catch (_e) {
      if (i < maxAttempts - 1) {
        await sleep(1200);
      }
    }
  }

  return false;
}

export default function VNPayReturnScreen({ route, navigation }) {
  const params = useMemo(() => route?.params || {}, [route?.params]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyAndFinalize = async () => {
      const hasReturnData = Object.keys(params || {}).length > 0;
      if (!hasReturnData) {
        setPaymentStatus("failed");
        setError("Không nhận được dữ liệu trả về từ VNPay.");
        setIsLoading(false);
        return;
      }

      const orderId = pickFirstId(params?.orderId, params?.order_id);
      const paymentId = pickFirstId(params?.paymentId, params?.payment_id);
      const vnpParams = toVNPayParams(params);

      let normalizedFromReturn = normalizeStatus(params) || "failed";
      if (Object.keys(vnpParams).length > 0) {
        try {
          const returnResponse =
            await vnpayService.handleVNPayReturn(vnpParams);
          const returnEntity = extractEntity(returnResponse) || returnResponse;
          const normalizedFromApi = normalizeStatus(returnEntity);
          if (normalizedFromApi) {
            normalizedFromReturn = normalizedFromApi;
          }
        } catch (returnError) {
          console.warn("VNPay return verify failed", returnError);
        }
      }

      if (normalizedFromReturn !== "paid") {
        await Promise.allSettled([
          syncOrderFailed(orderId),
          syncPaymentFailed(paymentId),
        ]);
        setPaymentStatus("failed");
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        let ipnRspCode = "";
        if (Object.keys(vnpParams).length > 0) {
          try {
            const ipnResponse = await vnpayService.handleVNPayIPN(vnpParams);
            const ipnEntity = extractEntity(ipnResponse) || ipnResponse || {};
            ipnRspCode = String(ipnEntity?.RspCode || ipnEntity?.rspCode || "");
          } catch (ipnError) {
            console.warn("VNPay IPN finalize failed", ipnError);
          }
        }

        await Promise.allSettled([
          syncOrderPaid(orderId),
          syncPaymentPaid(paymentId),
        ]);

        const orderCheck = await waitUntilOrderPaid(orderId);

        let courseIds = extractOrderCourseIds(orderCheck.orderEntity);
        if (!courseIds.length && orderId) {
          try {
            const detail = await orderService.getOrderDetail(orderId);
            courseIds = extractOrderCourseIds(extractEntity(detail) || detail);
          } catch (_e) {
            // ignore and use empty list
          }
        }

        const myCoursesReady = await waitUntilMyCoursesReady(courseIds);
        const ipnAccepted = ipnRspCode === "00" || ipnRspCode === "02";

        if (orderCheck.isPaid || myCoursesReady || ipnAccepted) {
          setPaymentStatus("paid");
          setError(null);
        } else {
          setPaymentStatus("failed");
          setError(
            "Đã nhận callback thành công nhưng backend chưa cập nhật order/my courses. Vui lòng thử lại sau vài giây.",
          );
        }
      } catch (e) {
        console.warn("VNPay finalize error", e);
        setPaymentStatus("failed");
        setError("Không thể hoàn tất đồng bộ trạng thái thanh toán.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndFinalize();
  }, [params]);

  const isSuccess = paymentStatus === "paid";
  const isFailed = paymentStatus === "failed";

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#e17055" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.icon}>
            {isSuccess ? "✅" : isFailed ? "❌" : "⚠️"}
          </Text>
          <Text style={styles.title}>
            {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại!"}
          </Text>
          <Text style={styles.subtitle}>
            {isSuccess
              ? 'Cảm ơn bạn đã mua khóa học. Vào "My Courses" để bắt đầu học!'
              : "Giao dịch chưa hoàn tất hoặc đã bị hủy. Vui lòng thử lại."}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate("MainTabs", {
                screen: isSuccess ? "MyCourses" : "Orders",
              })
            }
          >
            <Text style={styles.buttonText}>
              {isSuccess ? "Vào My Courses" : "Xem đơn hàng"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffeaa7",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    paddingTop: 60,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2d3436",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#636e72",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 13,
    color: "#d63031",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#e17055",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
