import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import instructorService from "../../services/instructor-service";

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
  return typeof url === "string" && url.startsWith("http");
}

function getStatusMeta(status) {
  if (status === "approved") {
    return {
      label: "Đã duyệt",
      textColor: "#27ae60",
      bgColor: "#e7f9ef",
    };
  }

  if (status === "rejected") {
    return {
      label: "Từ chối",
      textColor: "#e74c3c",
      bgColor: "#fdeceb",
    };
  }

  return {
    label: "Chờ duyệt",
    textColor: "#e67e22",
    bgColor: "#fff3cd",
  };
}

function getRequestId(request) {
  return (
    request?.instructor_request_id ||
    request?.request_id ||
    request?._id ||
    request?.id ||
    ""
  );
}

export default function StaffInstructorApprovalScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRequests = useCallback(async (withLoader = true) => {
    if (withLoader) {
      setIsLoading(true);
    }

    try {
      const response = await instructorService.getInstructorRequests();
      const requestList = extractList(response).sort((a, b) => {
        const aTime = new Date(a?.created_at || 0).getTime();
        const bTime = new Date(b?.created_at || 0).getTime();
        return bTime - aTime;
      });
      setRequests(requestList);
    } catch (error) {
      console.warn("Failed to load instructor requests", error);
      Alert.alert("Lỗi", "Không thể tải danh sách yêu cầu.");
    } finally {
      if (withLoader) {
        setIsLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(true);
  }, [loadRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests(false);
  };

  const handleReview = (request, decision) => {
    const isApprove = decision === "approve";
    const actionLabel = isApprove ? "ph\u00ea duy\u1ec7t" : "t\u1eeb ch\u1ed1i";

    Alert.alert(
      "X\u00e1c nh\u1eadn",
      `B\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n ${actionLabel} y\u00eau c\u1ea7u n\u00e0y kh\u00f4ng?`,
      [
        { text: "H\u1ee7y", style: "cancel" },
        {
          text: isApprove ? "Ph\u00ea duy\u1ec7t" : "T\u1eeb ch\u1ed1i",
          style: isApprove ? "default" : "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              const requestId = getRequestId(request);
              if (!requestId) {
                throw new Error("Không tìm thấy mã yêu cầu.");
              }

              const reviewNote =
                request?.note ||
                (isApprove
                  ? "Approved by staff (mobile)"
                  : "Rejected by staff (mobile)");

              const response = await instructorService.reviewInstructorRequest(
                requestId,
                { decision, review_note: reviewNote },
              );

              const updatedFromApi =
                response?.data?.data || response?.data || response;
              const updatedRequest = updatedFromApi || {
                ...request,
                status: isApprove ? "approved" : "rejected",
                reviewed_at: new Date().toISOString(),
              };

              const updatedRequestId =
                getRequestId(updatedRequest) || requestId;

              setRequests((prevRequests) =>
                prevRequests.map((item) =>
                  getRequestId(item) === updatedRequestId
                    ? { ...item, ...updatedRequest }
                    : item,
                ),
              );
              setSelectedRequest(updatedRequest);
              Alert.alert(
                "Th\u00e0nh c\u00f4ng",
                `\u0110\u00e3 ${actionLabel} y\u00eau c\u1ea7u.`,
              );
              setShowDetailModal(false);
            } catch (error) {
              console.warn("Failed to review request", error);
              const status = error?.response?.status;
              const backendData = error?.response?.data;

              let apiMessage = `Không thể ${actionLabel} yêu cầu.`;
              if (status) {
                apiMessage += `\nMã lỗi: ${status}`;
              }
              if (backendData) {
                try {
                  apiMessage += `\nChi tiết: ${JSON.stringify(backendData)}`;
                } catch (_e) {
                  // ignore JSON stringify error
                }
              } else if (error?.message) {
                apiMessage += `\nChi tiết: ${error.message}`;
              }
              Alert.alert("L\u1ed7i", apiMessage);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };
  const renderRequestItem = ({ item }) => {
    const statusMeta = getStatusMeta(item.status);
    const qualificationText = Array.isArray(item.qualifications)
      ? item.qualifications.join(", ")
      : item.qualifications || "Không có";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          setSelectedRequest(item);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.userInfoSection}>
            {isValidImage(item.profilePicUrl) ? (
              <Image
                source={{ uri: item.profilePicUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={26} color="#fff" />
              </View>
            )}

            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.fullName || "Không xác định"}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {item.email || "Không xác định"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusMeta.bgColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusMeta.textColor }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="text" size={16} color="#7f8c8d" />
            <Text style={styles.infoText} numberOfLines={2}>
              Ghi chú: {item.note || "Không có"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="certificate"
              size={16}
              color="#7f8c8d"
            />
            <Text style={styles.infoText} numberOfLines={2}>
              Chứng chỉ: {qualificationText}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>
              Ngày gửi: {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="inbox-multiple" size={64} color="#bdc3c7" />
      <Text style={styles.emptyText}>Không có yêu cầu giảng viên</Text>
    </View>
  );

  const selectedStatusMeta = getStatusMeta(selectedRequest?.status);
  const selectedQualifications = Array.isArray(selectedRequest?.qualifications)
    ? selectedRequest.qualifications.join(", ")
    : selectedRequest?.qualifications || "Không có";
  const canReview =
    !selectedRequest?.status || selectedRequest?.status === "pending";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Duyệt Yêu cầu Giảng viên</Text>
        <Text style={styles.headerSubtitle}>{requests.length} yêu cầu</Text>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item, index) => getRequestId(item) || String(index)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết yêu cầu</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#2c3e50"
                />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.modalBodyContainer}>
                <View style={styles.detailHeaderCard}>
                  <View style={styles.detailAvatarWrap}>
                    {isValidImage(selectedRequest.profilePicUrl) ? (
                      <Image
                        source={{ uri: selectedRequest.profilePicUrl }}
                        style={styles.detailAvatar}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="account"
                        size={34}
                        color="#fff"
                      />
                    )}
                  </View>

                  <View style={styles.detailHeaderInfo}>
                    <Text style={styles.detailName}>
                      {selectedRequest.fullName || "Không xác định"}
                    </Text>
                    <Text style={styles.detailEmail}>
                      {selectedRequest.email || "Không xác định"}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: selectedStatusMeta.bgColor,
                          marginTop: 8,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: selectedStatusMeta.textColor },
                        ]}
                      >
                        {selectedStatusMeta.label}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <DetailRow
                    label="Số điện thoại"
                    value={selectedRequest.phoneNumber}
                  />
                  <DetailRow
                    label="Chức danh"
                    value={selectedRequest.jobTitle}
                  />
                  <DetailRow label="Chứng chỉ" value={selectedQualifications} />
                  <DetailRow
                    label="Ghi chú"
                    value={selectedRequest.note || "Không có"}
                  />
                  <DetailRow
                    label="Ngày gửi"
                    value={formatDate(selectedRequest.created_at)}
                  />
                </View>

                {canReview ? (
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReview(selectedRequest, "reject")}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="close-circle"
                            size={18}
                            color="#fff"
                          />
                          <Text style={styles.actionBtnText}>Từ chối</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleReview(selectedRequest, "approve")}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={18}
                            color="#fff"
                          />
                          <Text style={styles.actionBtnText}>Phê duyệt</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.reviewedContainer}>
                    <Text style={styles.reviewedText}>
                      Yêu cầu này đã được xử lý.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue}>{value || "Không xác định"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  header: {
    backgroundColor: "#e74c3c",
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
    color: "#ffeaea",
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
    gap: 10,
  },
  userInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ecf0f1",
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7f8c8d",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#555",
    flex: 1,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#95a5a6",
    marginTop: 12,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
  },
  modalBodyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailHeaderCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  detailAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#7f8c8d",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  detailAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
  },
  detailEmail: {
    fontSize: 13,
    color: "#7f8c8d",
    marginTop: 2,
  },
  detailSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  detailRowLabel: {
    fontSize: 12,
    color: "#95a5a6",
    marginBottom: 3,
  },
  detailRowValue: {
    fontSize: 13,
    color: "#2c3e50",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  rejectBtn: {
    backgroundColor: "#e74c3c",
  },
  approveBtn: {
    backgroundColor: "#27ae60",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  reviewedContainer: {
    backgroundColor: "#ecf0f1",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 10,
  },
  reviewedText: {
    fontSize: 13,
    color: "#7f8c8d",
    fontWeight: "600",
  },
});
