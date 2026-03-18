import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import sessionService from '../../services/session-service';
import lessonService from '../../services/lesson-service';

export default function ManageCourseContentScreen({ route, navigation }) {
  const { courseId, courseName } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  
  // Modals state
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const res = await sessionService.getSessionsByCourse(courseId);
      const sessionList = res?.data || res || [];
      const parsedSessions = Array.isArray(sessionList) ? sessionList : [];

      // Fetch lessons for each session
      const sessionsWithLessons = await Promise.all(
        parsedSessions.map(async (session) => {
          try {
            const lRes = await lessonService.getLessonsBySession(session._id || session.id);
            const lList = lRes?.data || lRes || [];
            return { ...session, lessons: Array.isArray(lList) ? lList : [] };
          } catch (e) {
            return { ...session, lessons: [] };
          }
        })
      );
      setSessions(sessionsWithLessons);
    } catch (error) {
      console.warn('Failed to load course content', error);
      Alert.alert('Error', 'Cannot load course content.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [courseId]);

  // Actions
  const handleAddSession = async () => {
    if (!sessionTitle.trim()) {
      Alert.alert('Validation', 'Please enter a session title.');
      return;
    }
    try {
      await sessionService.createSession({
        name: sessionTitle.trim(),
        description: 'New session',
        course_id: courseId,
      });
      setSessionTitle('');
      setSessionModalVisible(false);
      loadContent();
    } catch (e) {
      Alert.alert('Error', 'Could not create session.');
    }
  };

  const handleDeleteSession = (id) => {
    Alert.alert('Delete Session', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await sessionService.deleteSession(id);
          loadContent();
        },
      },
    ]);
  };

  const handleAddLesson = async () => {
    if (!lessonTitle.trim() || !videoUrl.trim()) {
      Alert.alert('Validation', 'Please provide a title and video URL.');
      return;
    }
    try {
      await lessonService.createLesson({
        name: lessonTitle.trim(),
        content: lessonContent.trim() || lessonTitle.trim(),
        video_url: videoUrl.trim(),
        session_id: selectedSessionId,
      });
      setLessonTitle('');
      setLessonContent('');
      setVideoUrl('');
      setLessonModalVisible(false);
      loadContent();
    } catch (e) {
      Alert.alert('Error', 'Could not create lesson.');
    }
  };

  const handleDeleteLesson = (id) => {
    Alert.alert('Delete Lesson', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await lessonService.deleteLesson(id);
          loadContent();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#6c5ce7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{courseName}</Text>
      </View>

      <Text style={styles.subtitle}>Manage course curriculum</Text>

      {isLoading ? (
        <ActivityIndicator color="#6c5ce7" size="large" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {sessions.map((session, index) => (
            <View key={String(session._id || session.id)} style={styles.sessionCard}>
              <View style={styles.sessionHeaderRow}>
                <Text style={styles.sessionTitle}>
                  Section {index + 1}: {session.name || 'Untitled Section'}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteSession(session._id || session.id)}>
                  <Ionicons name="trash-outline" size={20} color="#d63031" />
                </TouchableOpacity>
              </View>

              <View style={styles.lessonsContainer}>
                {session.lessons?.map((lesson, lIndex) => (
                  <View key={String(lesson._id || lesson.id)} style={styles.lessonRow}>
                    <Ionicons name="play-circle" size={20} color="#0984e3" />
                    <Text style={styles.lessonTitle} numberOfLines={1}>
                      {lIndex + 1}. {lesson.name || 'Untitled Lesson'}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteLesson(lesson._id || lesson.id)}>
                      <Ionicons name="close-circle" size={20} color="#b2bec3" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity 
                  style={styles.addLessonBtn}
                  onPress={() => {
                    setSelectedSessionId(session._id || session.id);
                    setLessonModalVisible(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#6c5ce7" />
                  <Text style={styles.addLessonText}>Add Lesson</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addSessionBtn} onPress={() => setSessionModalVisible(true)}>
            <Text style={styles.addSessionText}>+ Add New Section</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modals */}
      <Modal visible={sessionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Section</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Introduction"
              value={sessionTitle}
              onChangeText={setSessionTitle}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSessionModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSession}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={lessonModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Lesson</Text>
            <TextInput
              style={styles.input}
              placeholder="Lesson Title"
              value={lessonTitle}
              onChangeText={setLessonTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Content / Description"
              value={lessonContent}
              onChangeText={setLessonContent}
            />
            <TextInput
              style={styles.input}
              placeholder="Video URL (e.g. YouTube link)"
              value={videoUrl}
              onChangeText={setVideoUrl}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setLessonModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddLesson}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    marginBottom: 8,
  },
  backButton: { marginRight: 12, padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#6c5ce7', flex: 1 },
  subtitle: { fontSize: 15, color: '#636e72', paddingHorizontal: 24, marginBottom: 16 },
  scrollContent: { padding: 24, paddingTop: 8 },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    paddingBottom: 12,
  },
  sessionTitle: { fontSize: 16, fontWeight: '700', color: '#2d3436', flex: 1 },
  lessonsContainer: { paddingLeft: 8 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonTitle: { fontSize: 14, color: '#2d3436', flex: 1, marginLeft: 8 },
  addLessonBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingVertical: 8 },
  addLessonText: { color: '#6c5ce7', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  addSessionBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6c5ce7',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  addSessionText: { color: '#6c5ce7', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#2d3436', marginBottom: 16 },
  input: { backgroundColor: '#f1f2f6', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: '#636e72', fontWeight: '600', fontSize: 16 },
  saveBtn: { backgroundColor: '#6c5ce7', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
