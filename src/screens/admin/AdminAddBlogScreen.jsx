import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import postService from '../../services/post-service';
import useAuthStore from '../../store/auth-store';

export default function AdminAddBlogScreen({ navigation }) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [blogImgUrl, setBlogImgUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề bài viết.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung bài viết.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        user_id: user?._id || user?.id || '',
        title: title.trim(),
        content: content.trim(),
        blogImgUrl: blogImgUrl.trim(),
      };
      await postService.createPost(payload);
      Alert.alert('Thành công', 'Bài viết đã được đăng!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Không thể tạo bài viết.';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#00b894" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Viết bài mới</Text>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Đăng</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.body}>
          <Text style={styles.label}>Tiêu đề *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tiêu đề bài viết..."
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#b2bec3"
          />

          <Text style={styles.label}>Ảnh bìa (URL)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            value={blogImgUrl}
            onChangeText={setBlogImgUrl}
            placeholderTextColor="#b2bec3"
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.label}>Nội dung *</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            placeholder="Viết nội dung bài đăng tại đây..."
            value={content}
            onChangeText={setContent}
            placeholderTextColor="#b2bec3"
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: { padding: 8, marginRight: 8 },
  topBarTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#2d3436' },
  saveBtn: {
    backgroundColor: '#00b894',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  body: { padding: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#2d3436', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2d3436',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contentInput: {
    minHeight: 240,
    lineHeight: 24,
  },
});
