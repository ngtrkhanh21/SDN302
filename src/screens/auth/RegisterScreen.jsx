import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import useAuthStore from '../../store/auth-store';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !dateOfBirth) {
      Alert.alert('Missing information', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    // Convert YYYY-MM-DD → ISO string cho API
    let isoDate = dateOfBirth;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
      isoDate = new Date(`${dateOfBirth.trim()}T00:00:00.000Z`).toISOString();
    }

    setIsSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        confirm_password: confirmPassword,
        date_of_birth: isoDate,
      });
      Alert.alert(
        'Welcome!',
        'Account created. Please check your email to verify, then sign in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      );
    } catch (error) {
      console.warn('Register error:', JSON.stringify(error.response?.data));
      const errData = error.response?.data;
      const message =
        errData?.message ||
        errData?.error ||
        (Array.isArray(errData?.errors) ? errData.errors.join('\n') : null) ||
        'Registration failed. Please try again.';
      Alert.alert('Registration failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Join ArtFun</Text>
        <Text style={styles.subtitle}>Create a cozy corner to draw</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create account</Text>

        <TextInput
          placeholder="Child's name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="Parent email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        <TextInput
          placeholder="Confirm password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          secureTextEntry
        />

        <TextInput
          placeholder="Child's birthday (YYYY-MM-DD)"
          placeholderTextColor="#999"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          style={styles.input}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Creating...' : 'Start coloring!'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoToLogin}>
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={styles.linkHighlight}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#74b9ff',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fdcb6e',
  },
  subtitle: {
    fontSize: 16,
    color: '#dfe6e9',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#6c5ce7',
  },
  input: {
    backgroundColor: '#f1f2f6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#fd79a8',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  linkText: {
    textAlign: 'center',
    color: '#636e72',
    marginTop: 4,
  },
  linkHighlight: {
    color: '#0984e3',
    fontWeight: '600',
  },
});

