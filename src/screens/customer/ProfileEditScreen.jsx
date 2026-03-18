import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import authService from '../../services/auth-service';
import useAuthStore from '../../store/auth-store';

export default function ProfileEditScreen({ navigation }) {
  const { user, updateUserProfileLocally } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  // date_of_birth format: DD/MM/YYYY để dễ nhập, sẽ convert sang ISO khi gửi
  const [dob, setDob] = useState(
    user?.date_of_birth
      ? new Date(user.date_of_birth).toLocaleDateString('vi-VN')
      : '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chuyển DD/MM/YYYY → ISO string
  const parseDate = str => {
    const cleaned = str.replace(/\s/g, '');
    // Thử các format: DD/MM/YYYY, YYYY-MM-DD
    let d;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('/');
      d = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      d = new Date(`${cleaned}T00:00:00.000Z`);
    } else {
      return null;
    }
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Vui lòng nhập họ tên.');
      return;
    }

    // Validate date nếu có nhập
    let isoDate = undefined;
    if (dob.trim()) {
      isoDate = parseDate(dob.trim());
      if (!isoDate) {
        Alert.alert('Validation', 'Ngày sinh không đúng định dạng.\nVui lòng nhập DD/MM/YYYY (ví dụ: 15/01/2000)');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Đúng theo API spec: chỉ name + date_of_birth
      const payload = { name: name.trim() };
      if (isoDate) payload.date_of_birth = isoDate;

      const res = await authService.updateCurrentUser(payload);
      const updatedData = res?.data || {};

      // Cập nhật local store
      await updateUserProfileLocally({
        name: updatedData.name || name.trim(),
        email: updatedData.email || user?.email,
        date_of_birth: updatedData.date_of_birth || isoDate,
      });

      Alert.alert('Thành công', 'Đã cập nhật hồ sơ!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.warn('Failed to update profile', error);
      console.warn('Error response:', JSON.stringify(error.response?.data));
      const errData = error.response?.data;
      const message =
        errData?.message ||
        errData?.error ||
        (Array.isArray(errData?.errors) ? errData.errors.join('\n') : null) ||
        'Không thể cập nhật hồ sơ.';
      Alert.alert('Lỗi', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>Cập nhật thông tin của bạn</Text>

        <Text style={styles.label}>Họ và tên *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nhập họ tên"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Ngày sinh (DD/MM/YYYY)</Text>
        <TextInput
          style={styles.input}
          value={dob}
          onChangeText={setDob}
          placeholder="ví dụ: 15/01/2000"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
        />

        <Text style={styles.hint}>Email không thể thay đổi tại đây.</Text>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fab1a0',
  },
  backButton: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e17055',
  },
  scroll: {
    padding: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#e17055',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3436',
  },
  hint: {
    fontSize: 12,
    color: '#b2bec3',
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#e17055',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
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
