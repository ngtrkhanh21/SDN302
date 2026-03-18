import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import courseService from '../../services/course-service';
import cartService from '../../services/cart-service';
import reviewService from '../../services/review-service';

const STAR = '⭐';
const AUDIENCE_COLORS = {
  all: '#6c5ce7', beginner: '#00b894', intermediate: '#fdcb6e', advanced: '#e17055',
};
const RISK_COLORS = { low: '#00b894', medium: '#fdcb6e', high: '#d63031' };

export default function CourseDetailScreen({ route, navigation }) {
  const { courseId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);

  const loadCourse = async () => {
    setIsLoading(true);
    try {
      const [courseData, reviewData] = await Promise.all([
        courseService.getCourseDetail(courseId),
        reviewService.getReviewsByCourse(courseId).catch(() => ({ data: [] })),
      ]);
      let cData = courseData?.data || courseData || null;
      if (Array.isArray(cData)) cData = cData[0];
      
      setCourse(cData);
      const rList = reviewData?.data || reviewData || [];
      setReviews(Array.isArray(rList) ? rList : []);
    } catch (error) {
      console.warn('Failed to load course detail', error);
      Alert.alert('Error', 'Cannot load course detail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const handleAddToCart = async () => {
    try {
      await cartService.addCourseToCart(courseId);
      Alert.alert('Added', 'This course is in your art basket!', [
        {
          text: 'Go to cart',
          onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' }),
        },
        { text: 'Continue', style: 'cancel' },
      ]);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Cannot add course to cart.';
      Alert.alert('Error', msg);
    }
  };

  const handleRate = () => {
    navigation.navigate('Feedback', { courseId });
  };

  const handleTrialLearn = () => {
    navigation.navigate('CoursePlayer', {
      courseId,
      courseName: course?.name || 'Course',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#e17055" size="large" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: '#636e72' }}>Course not found.</Text>
      </View>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || r.star || 0), 0) / reviews.length).toFixed(1)
    : null;

  const hasImage = course.imageUrl && course.imageUrl.startsWith('http');
  const audience = course.targetAudience || 'all';
  const risk = course.riskLevel || 'low';

  return (
    <View style={styles.container}>
      {/* Absolute Back Button to float over header */}
      <View style={styles.headerArea}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#e17055" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{course.name || 'Detail'}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Cover Image */}
        {hasImage ? (
          <Image source={{ uri: course.imageUrl }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={{ fontSize: 50 }}>🎨</Text>
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.title}>{course.name || 'Unnamed course'}</Text>
          <Text style={styles.meta}>
            {course.category?.name || course.category_id || 'For little artists'}
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.price}>
                {course.price > 0 ? `${Number(course.price).toLocaleString('vi-VN')}đ` : 'Free'}
              </Text>
              <Text style={styles.statLabel}>Price</Text>
            </View>
            
            {course.discount > 0 && (
              <View style={styles.statBox}>
                <Text style={[styles.price, { color: '#00b894' }]}>-{course.discount}%</Text>
                <Text style={styles.statLabel}>Discount</Text>
              </View>
            )}

            {avgRating && (
              <View style={styles.statBox}>
                <Text style={[styles.price, { color: '#f39c12' }]}>{STAR} {avgRating}</Text>
                <Text style={styles.statLabel}>{reviews.length} reviews</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: (AUDIENCE_COLORS[audience] || '#6c5ce7') + '20' }]}>
              <Text style={[styles.tagText, { color: AUDIENCE_COLORS[audience] || '#6c5ce7' }]}>
                {audience === 'all' ? '🏫' : '🎯'} {audience}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: (RISK_COLORS[risk] || '#00b894') + '20' }]}>
              <Text style={[styles.tagText, { color: RISK_COLORS[risk] || '#00b894' }]}>
                ⚠️ {risk} risk
              </Text>
            </View>
          </View>

          {/* Gallery Images */}
          {course.imageUrls && course.imageUrls.length > 0 && (
            <View style={styles.gallerySection}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                {course.imageUrls.map((img, i) => (
                  <Image key={i} source={{ uri: img }} style={styles.galleryImage} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Videos */}
          {course.videoUrls && course.videoUrls.length > 0 && (
            <View style={styles.gallerySection}>
              <Text style={styles.sectionTitle}>Videos ({course.videoUrls.length})</Text>
              <View style={styles.videoList}>
                {course.videoUrls.map((v, i) => (
                  <View key={i} style={styles.videoItem}>
                    <Text style={styles.videoIcon}>🎥</Text>
                    <Text style={styles.videoText} numberOfLines={1}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.content}>{course.content || 'No description provided.'}</Text>

          {/* Trial / Watch lessons */}
          <TouchableOpacity style={styles.trialBtn} onPress={handleTrialLearn}>
            <Text style={styles.trialBtnText}>▶ Watch Lessons (Player)</Text>
          </TouchableOpacity>

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Student Reviews ({reviews.length})</Text>
              {reviews.slice(0, 5).map((r, i) => (
                <View key={String(r._id || r.id || i)} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>{r.user?.name || r.user_name || 'Student'}</Text>
                    <Text style={styles.reviewStars}>
                      {'★'.repeat(r.rating || r.star || 0)}{'☆'.repeat(5 - (r.rating || r.star || 0))}
                    </Text>
                  </View>
                  <Text style={styles.reviewComment}>{r.comment || r.content || ''}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.rateBtn} onPress={handleRate}>
          <Text style={styles.bottomText}>Rate & Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
          <Text style={styles.bottomText}>Add to Basket</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#ffeaa7', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#ffeaa7' },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffeaa7',
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#e17055' },
  coverImage: { width: '100%', height: 240 },
  coverPlaceholder: { width: '100%', height: 200, backgroundColor: '#fab1a0', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#d63031', marginBottom: 4 },
  meta: { fontSize: 15, color: '#e17055', fontWeight: '600', marginBottom: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, gap: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statBox: { alignItems: 'center' },
  price: { fontSize: 18, fontWeight: '800', color: '#d63031' },
  statLabel: { fontSize: 12, color: '#b2bec3', marginTop: 4, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2d3436', marginBottom: 12, marginTop: 8 },
  content: { fontSize: 15, color: '#636e72', lineHeight: 24, marginBottom: 24 },
  gallerySection: { marginBottom: 24 },
  galleryScroll: { flexDirection: 'row' },
  galleryImage: { width: 140, height: 100, borderRadius: 12, marginRight: 12, backgroundColor: '#dfe6e9' },
  videoList: { backgroundColor: '#fff', borderRadius: 16, padding: 12 },
  videoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  videoIcon: { fontSize: 18, marginRight: 12 },
  videoText: { flex: 1, fontSize: 14, color: '#0984e3' },
  trialBtn: { backgroundColor: '#00cec9', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 24, shadowColor: '#00cec9', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  trialBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  reviewsSection: { marginTop: 8 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewUser: { fontSize: 14, fontWeight: '800', color: '#2d3436' },
  reviewStars: { fontSize: 14, color: '#fdcb6e' },
  reviewComment: { fontSize: 14, color: '#636e72', lineHeight: 20 },
  bottomRow: { flexDirection: 'row', padding: 16, paddingBottom: 32, gap: 12, backgroundColor: '#ffeaa7', borderTopWidth: 1, borderTopColor: '#ffeaa7' },
  rateBtn: { flex: 1, backgroundColor: '#74b9ff', paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  addBtn: { flex: 1.5, backgroundColor: '#e17055', paddingVertical: 16, alignItems: 'center', borderRadius: 16, shadowColor: '#e17055', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  bottomText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
