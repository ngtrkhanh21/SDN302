import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import courseService from "../../services/course-service";
import lessonService from "../../services/lesson-service";
import sessionService from "../../services/session-service";

const TABS = {
  COURSES: "courses",
  SESSIONS: "sessions",
  LESSONS: "lessons",
};

export default function StaffCourseManagementScreen() {
  const [activeTab, setActiveTab] = useState(TABS.COURSES);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Courses state
  const [courses, setCourses] = useState([]);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});

  // Lessons state
  const [lessons, setLessons] = useState([]);
  const [sessionsMap, setSessionsMap] = useState({});

  const extractList = useCallback((payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.items)) {
      return payload.items;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.data?.items)) {
      return payload.data.items;
    }

    return [];
  }, []);

  // Load courses
  const loadCourses = useCallback(async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(extractList(data));
    } catch (error) {
      console.warn("Failed to load courses:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách khóa học.");
    }
  }, [extractList]);

  // Load sessions with course mapping
  const loadSessions = useCallback(async () => {
    try {
      const sessionData = await sessionService.getAllSessions();
      const sessionList = extractList(sessionData);
      setSessions(sessionList);

      const courseData = await courseService.getCourses();
      const courseList = extractList(courseData);
      const courseMap = {};
      courseList.forEach((course) => {
        courseMap[course._id] = course;
      });
      setCoursesMap(courseMap);
    } catch (error) {
      console.warn("Failed to load sessions:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách phiên học.");
    }
  }, [extractList]);

  // Load lessons with course and session mapping
  const loadLessons = useCallback(async () => {
    try {
      const [lessonData, sessionData, courseData] = await Promise.all([
        lessonService.getLessonsPaged({ page: 1, limit: 1000 }),
        sessionService.getAllSessions(),
        courseService.getCourses(),
      ]);

      const lessonList = extractList(lessonData);
      setLessons(lessonList);

      const sessionList = extractList(sessionData);
      const sessionMap = {};
      sessionList.forEach((session) => {
        sessionMap[session._id] = session;
      });
      setSessionsMap(sessionMap);

      const courseList = extractList(courseData);
      const courseMap = {};
      courseList.forEach((course) => {
        courseMap[course._id] = course;
      });
      setCoursesMap(courseMap);
    } catch (error) {
      console.warn("Failed to load lessons:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách bài học.");
    }
  }, [extractList]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === TABS.COURSES) {
        await loadCourses();
      } else if (activeTab === TABS.SESSIONS) {
        await loadSessions();
      } else if (activeTab === TABS.LESSONS) {
        await loadLessons();
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, loadCourses, loadLessons, loadSessions]);

  useEffect(() => {
    loadData();
  }, [activeTab, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === TABS.COURSES) {
        await loadCourses();
      } else if (activeTab === TABS.SESSIONS) {
        await loadSessions();
      } else if (activeTab === TABS.LESSONS) {
        await loadLessons();
      }
    } finally {
      setRefreshing(false);
    }
  };

  // ============== COURSE COMPONENTS ==============
  const renderCourseItem = ({ item }) => {
    const hasImage = item.imageUrl && item.imageUrl.startsWith("http");
    const price = item.price || 0;
    const discount = item.discount || 0;
    const status = item.status || "published";

    return (
      <View style={styles.card}>
        {hasImage ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.courseImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons
              name="image-off"
              size={40}
              color="#bdc3c7"
            />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.courseTitle} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.courseInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Giá:</Text>
              <Text style={styles.value}>{price.toLocaleString("vi-VN")}₫</Text>
            </View>

            {discount > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Giảm giá:</Text>
                <Text style={[styles.value, { color: "#e74c3c" }]}>
                  {discount}%
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.label}>Trạng thái:</Text>
              <View
                style={[
                  styles.statusBadge,
                  status === "published"
                    ? styles.statusPublished
                    : styles.statusDraft,
                ]}
              >
                <Text style={styles.statusText}>
                  {status === "published" ? "Đã xuất bản" : "Nháp"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ============== SESSION COMPONENTS ==============
  const renderSessionItem = ({ item }) => {
    const course = coursesMap[item.course_id];

    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <Text style={styles.sessionTitle} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.sessionInfo}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={16}
                color="#3498db"
              />
              <Text style={styles.label} numberOfLines={1}>
                {course?.name || "Khóa học không xác định"}
              </Text>
            </View>

            {item.positionOrder && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="numeric"
                  size={16}
                  color="#9b59b6"
                />
                <Text style={styles.label}>Thứ tự: {item.positionOrder}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="calendar"
                size={16}
                color="#27ae60"
              />
              <Text style={styles.label}>
                {new Date(item.created_at).toLocaleDateString("vi-VN")}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ============== LESSON COMPONENTS ==============
  const renderLessonItem = ({ item }) => {
    const session = sessionsMap[item.session_id];
    const course = coursesMap[item.course_id];
    const hasVideo = item.videoUrl && item.videoUrl.startsWith("http");
    const hasImage = item.imageUrl && item.imageUrl.startsWith("http");

    return (
      <View style={styles.card}>
        {hasImage && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.courseImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.cardBody}>
          <Text style={styles.lessonTitle} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.lessonInfo}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={16}
                color="#2d98da"
              />
              <Text style={styles.label} numberOfLines={1}>
                Khóa học: {course?.name || "Không xác định"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="folder-multiple"
                size={16}
                color="#3498db"
              />
              <Text style={styles.label} numberOfLines={1}>
                Phiên học: {session?.name || "Không xác định"}
              </Text>
            </View>

            {/* {item.fullTime && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="clock"
                  size={16}
                  color="#e67e22"
                />
                <Text style={styles.label}>{item.fullTime} phút</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="numeric"
                size={16}
                color="#9b59b6"
              />
              <Text style={styles.label}>Thứ tự: {item.positionOrder}</Text>
            </View>

            {hasVideo && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="video"
                  size={16}
                  color="#c0392b"
                />
                <Text style={[styles.label, { color: "#c0392b" }]}>
                  Có video
                </Text>
              </View>
            )} */}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="inbox-multiple" size={64} color="#bdc3c7" />
      <Text style={styles.emptyText}>Không có dữ liệu</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lí Khóa học</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === TABS.COURSES && styles.activeTab]}
          onPress={() => setActiveTab(TABS.COURSES)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === TABS.COURSES && styles.activeTabText,
            ]}
          >
            Khóa học
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === TABS.SESSIONS && styles.activeTab]}
          onPress={() => setActiveTab(TABS.SESSIONS)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === TABS.SESSIONS && styles.activeTabText,
            ]}
          >
            Phiên học
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === TABS.LESSONS && styles.activeTab]}
          onPress={() => setActiveTab(TABS.LESSONS)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === TABS.LESSONS && styles.activeTabText,
            ]}
          >
            Bài học
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={
            activeTab === TABS.COURSES
              ? courses
              : activeTab === TABS.SESSIONS
                ? sessions
                : lessons
          }
          renderItem={
            activeTab === TABS.COURSES
              ? renderCourseItem
              : activeTab === TABS.SESSIONS
                ? renderSessionItem
                : renderLessonItem
          }
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
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
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  tabsContainer: {
    backgroundColor: "#fff",
    paddingVertical: 0,
    borderBottomWidth: 2,
    borderBottomColor: "#ecf0f1",
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#3498db",
    backgroundColor: "#f8fbff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7f8c8d",
  },
  activeTabText: {
    color: "#3498db",
    fontWeight: "700",
    fontSize: 15,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  courseImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#ecf0f1",
  },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderIcon: {
    fontSize: 40,
  },
  cardBody: {
    padding: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 12,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 12,
  },
  courseInfo: {
    gap: 8,
  },
  sessionInfo: {
    gap: 8,
  },
  lessonInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: 13,
    color: "#2c3e50",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPublished: {
    backgroundColor: "#d5f4e6",
  },
  statusDraft: {
    backgroundColor: "#ffeef0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
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
});
