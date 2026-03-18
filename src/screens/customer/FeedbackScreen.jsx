import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import reviewService from '../../services/review-service';
import useAuthStore from '../../store/auth-store';

export default function FeedbackScreen({ route, navigation }) {
  const { courseId } = route.params;
  const { user } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = user?.id || user?._id;

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to submit feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.createCourseReview({
        course_id: courseId,
        user_id: userId,
        rating,
        comment: comment || 'Great course!',
      });
      Alert.alert('Thank you!', 'Your feedback was submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.warn('Failed to submit review', error);
      Alert.alert('Error', 'Cannot submit feedback.');
    } finally {
      setIsSubmitting(false);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Rate & feedback</Text>
      <Text style={styles.subtitle}>How did you like this course?</Text>

      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity
            key={n}
            style={[styles.star, rating >= n && styles.starActive]}
            onPress={() => setRating(n)}
          >
            <Text style={styles.starText}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Write your comment..."
        placeholderTextColor="#999"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Sending...' : 'Submit feedback'}
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#74b9ff',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0984e3',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0984e3',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#dfe6e9',
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  star: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dfe6e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  starActive: {
    backgroundColor: '#fdcb6e',
  },
  starText: {
    fontSize: 24,
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#fd79a8',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
