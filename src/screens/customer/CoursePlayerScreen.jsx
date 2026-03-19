import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
// src/services/auth-service.js
import axiosClient from "../../api/axios-client";
import ENDPOINTS from "../../api/endpoints";

const HTML_ENTITY_MAP = {
  amp: "&",
  apos: "'",
  quot: '"',
  lt: "<",
  gt: ">",
  nbsp: " ",
  agrave: "à",
  aacute: "á",
  acirc: "â",
  atilde: "ã",
  auml: "ä",
  aring: "å",
  egrave: "è",
  eacute: "é",
  ecirc: "ê",
  euml: "ë",
  igrave: "ì",
  iacute: "í",
  icirc: "î",
  iuml: "ï",
  ograve: "ò",
  oacute: "ó",
  ocirc: "ô",
  otilde: "õ",
  ouml: "ö",
  ugrave: "ù",
  uacute: "ú",
  ucirc: "û",
  uuml: "ü",
  yacute: "ý",
  yuml: "ÿ",
  ccedil: "ç",
  ntilde: "ñ",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
};

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_match, dec) =>
      String.fromCharCode(Number.parseInt(dec, 10) || 0),
    )
    .replace(/&#x([\da-f]+);/gi, (_match, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16) || 0),
    )
    .replace(/&([a-z]+);/gi, (match, name) => {
      const decoded = HTML_ENTITY_MAP[String(name || "").toLowerCase()];
      return decoded ?? match;
    });
}

function sanitizeLessonContent(value) {
  if (!value) {
    return "";
  }

  const html = String(value);
  const textWithBreaks = html
    .replace(/<\s*br\b[^>]*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*p\s*>/gi, "\n\n")
    .replace(/<\s*p\b[^>]*>/gi, "")
    .replace(/<\s*li\b[^>]*>/gi, "- ")
    .replace(/<\s*\/\s*li\s*>/gi, "\n")
    .replace(/<\s*\/\s*(ul|ol|div|h1|h2|h3|h4|h5|h6)\s*>/gi, "\n");

  const withoutTags = textWithBreaks.replace(/<[^>]+>/g, "");
  const decoded = decodeHtmlEntities(withoutTags);

  return decoded
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/(^|\n)-\s*\n+/g, "$1- ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export default function CoursePlayerScreen({ route, navigation }) {
  const { courseId, courseName } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);
  const [lessons, setLessons] = useState({});
  const [loadingLessons, setLoadingLessons] = useState({});

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await axiosClient.get(
        ENDPOINTS.SESSION_BY_COURSE(courseId),
      );
      const list = response.data?.data || response.data || [];
      setSessions(Array.isArray(list) ? list : []);
    } catch (error) {
      console.warn("Failed to load sessions", error);
      Alert.alert("Lỗi", "Không thể tải danh sách phiên học.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadLessons = async (sessionId) => {
    if (lessons[sessionId]) {
      setExpandedSession(expandedSession === sessionId ? null : sessionId);
      return;
    }
    setLoadingLessons((prev) => ({ ...prev, [sessionId]: true }));
    try {
      const response = await axiosClient.get(
        ENDPOINTS.LESSON_BY_SESSION(sessionId),
      );
      const list = response.data?.data || response.data || [];
      setLessons((prev) => ({
        ...prev,
        [sessionId]: Array.isArray(list) ? list : [],
      }));
      setExpandedSession(sessionId);
    } catch (error) {
      console.warn("Failed to load lessons", error);
      Alert.alert("Lỗi", "Không thể tải bài học cho phiên này.");
    } finally {
      setLoadingLessons((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleOpenLesson = async (lesson) => {
    const videoUrl = lesson.videoUrl || lesson.video_url || lesson.url;
    if (videoUrl) {
      const canOpen = await Linking.canOpenURL(videoUrl);
      if (canOpen) {
        await Linking.openURL(videoUrl);
      } else {
        Alert.alert("Không thể mở", "Liên kết video không khả dụng.");
      }
    } else {
      const lessonContent = sanitizeLessonContent(
        lesson.content || lesson.description,
      );
      Alert.alert(
        lesson.name || "Bài học",
        lessonContent || "Bài học này chưa có nội dung.",
      );
    }
  };

  useEffect(() => {
    loadSessions();
  }, [courseId]);

  const renderLesson = (lesson) => {
    const lid = lesson._id || lesson.id;
    const isTrialLabel = lesson.isTrial || lesson.is_trial ? " 🆓 Học thử" : "";
    return (
      <TouchableOpacity
        key={String(lid)}
        style={styles.lessonRow}
        onPress={() => handleOpenLesson(lesson)}
      >
        <Text style={styles.lessonIcon}>▶</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.lessonTitle}>
            {lesson.name || lesson.title || "Bài học"}
            {isTrialLabel}
          </Text>
          {lesson.duration && (
            <Text style={styles.lessonMeta}>{lesson.duration} phút</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSession = ({ item }) => {
    const sid = item._id || item.id;
    const isExpanded = expandedSession === sid;
    const sessionLessons = lessons[sid] || [];
    const isLoadingSession = !!loadingLessons[sid];

    return (
      <View style={styles.sessionCard}>
        <TouchableOpacity
          style={styles.sessionHeader}
          onPress={() => loadLessons(sid)}
        >
          <Text style={styles.sessionTitle}>
            {item.name || item.title || "Phiên học"}
          </Text>
          <Text style={styles.chevron}>{isExpanded ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {isLoadingSession && (
          <ActivityIndicator style={{ marginVertical: 8 }} color="#e17055" />
        )}

        {isExpanded && !isLoadingSession && (
          <View style={styles.lessonList}>
            {sessionLessons.length === 0 ? (
              <Text style={styles.noLesson}>
                Phiên học này chưa có bài học.
              </Text>
            ) : (
              sessionLessons.map(renderLesson)
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={2}>
        {courseName || "Trình phát khóa học"}
      </Text>
      <Text style={styles.subtitle}>Chạm vào phiên học để xem bài học</Text>

      {isLoading ? (
        <ActivityIndicator
          style={{ marginTop: 32 }}
          size="large"
          color="#e17055"
        />
      ) : sessions.length === 0 ? (
        <Text style={styles.empty}>Chưa có phiên học nào.</Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item._id || item.id)}
          renderItem={renderSession}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#dfe6e9",
    padding: 16,
    paddingTop: 48,
  },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 18, fontWeight: "700", color: "#2d3436" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2d3436",
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: "#636e72", marginBottom: 16 },
  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d3436",
    flex: 1,
  },
  chevron: { fontSize: 14, color: "#636e72" },
  lessonList: {
    borderTopWidth: 1,
    borderTopColor: "#f1f2f6",
    paddingBottom: 8,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  lessonIcon: {
    fontSize: 16,
    color: "#e17055",
    marginRight: 10,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
  },
  lessonMeta: { fontSize: 12, color: "#b2bec3", marginTop: 2 },
  noLesson: { fontSize: 13, color: "#b2bec3", padding: 14 },
  empty: {
    textAlign: "center",
    color: "#636e72",
    marginTop: 40,
    fontSize: 16,
  },
});
