import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import courseService from '../../services/course-service';

const AUDIENCE_COLORS = {
  all: '#6c5ce7',
  beginner: '#00b894',
  intermediate: '#fdcb6e',
  advanced: '#e17055',
};

const RISK_COLORS = {
  low: '#00b894',
  medium: '#fdcb6e',
  high: '#e17055',
};

export default function ManageCoursesScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const data = await courseService.getCourses();
      const list = data?.data || data || [];
      setCourses(Array.isArray(list) ? list : []);
    } catch (error) {
      console.warn('Failed to load instructor courses', error);
      Alert.alert('Error', 'Cannot load your courses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadCourses);
    return unsub;
  }, [navigation]);

  const handleDelete = course => {
    Alert.alert('Delete Course', `Delete "${course.name || course.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await courseService.deleteCourse(course._id || course.id);
            loadCourses();
          } catch (error) {
            Alert.alert('Error', 'Could not delete course.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const courseId = item._id || item.id;
    const title = item.name || item.title || 'Untitled Course';
    const status = item.status || 'published';
    const audience = item.targetAudience || 'all';
    const risk = item.riskLevel || 'low';
    const hasImage = item.imageUrl && item.imageUrl.startsWith('http');

    return (
      <View style={styles.card}>
        {/* Course Image */}
        {hasImage ? (
          <Image source={{ uri: item.imageUrl }} style={styles.courseImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>🎨</Text>
            <Text style={styles.imagePlaceholderText}>No Cover Image</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          {/* Header row */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.courseTitle} numberOfLines={2}>{title}</Text>
            <View style={[styles.statusBadge, status === 'published' ? styles.statusPublished : styles.statusPending]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>

          {/* Tags row */}
          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: (AUDIENCE_COLORS[audience] || '#6c5ce7') + '20' }]}>
              <Text style={[styles.tagText, { color: AUDIENCE_COLORS[audience] || '#6c5ce7' }]}>
                👥 {audience}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: (RISK_COLORS[risk] || '#00b894') + '20' }]}>
              <Text style={[styles.tagText, { color: RISK_COLORS[risk] || '#00b894' }]}>
                ⚠️ {risk} risk
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.courseMeta} numberOfLines={2}>
            {item.content || item.description || 'No description provided.'}
          </Text>

          {/* Price row */}
          <View style={styles.priceRow}>
            <Text style={styles.coursePrice}>
              {item.price > 0 ? `${Number(item.price).toLocaleString('vi-VN')} VND` : 'Free'}
            </Text>
            {item.discount > 0 && (
              <Text style={styles.discountBadge}>-{item.discount}%</Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.contentBtn]}
              onPress={() => navigation.navigate('ManageContent', { courseId, courseName: title })}
            >
              <Text style={styles.btnText}>📚 Content</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.editBtn]}
              onPress={() => navigation.navigate('Upload', { courseToEdit: item })}
            >
              <Text style={styles.btnText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.deleteBtn]}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.btnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Courses</Text>
      <Text style={styles.subtitle}>Organize and update your art lessons</Text>

      {isLoading ? (
        <ActivityIndicator color="#e17055" size="large" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item, index) => String(item._id || item.id || index)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>You haven't uploaded any courses yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fab1a0', padding: 24, paddingTop: 56 },
  title: { fontSize: 26, fontWeight: '800', color: '#e17055', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#2d3436', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  courseImage: { width: '100%', height: 160 },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#ffeaa7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: { fontSize: 32 },
  imagePlaceholderText: { fontSize: 13, color: '#b2bec3', marginTop: 4 },
  cardBody: { padding: 16 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#2d3436', marginRight: 8 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPublished: { backgroundColor: '#dff9fb' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#4834d4' },
  tagsRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { fontSize: 12, fontWeight: '600' },
  courseMeta: { fontSize: 13, color: '#636e72', lineHeight: 19, marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  coursePrice: { fontSize: 16, fontWeight: '700', color: '#e17055' },
  discountBadge: {
    backgroundColor: '#00b894',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionsRow: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  contentBtn: { backgroundColor: '#6c5ce7' },
  editBtn: { backgroundColor: '#a29bfe' },
  deleteBtn: { backgroundColor: '#ff7675', flex: 0, paddingHorizontal: 16 },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#636e72', marginTop: 32, fontSize: 15 },
});
