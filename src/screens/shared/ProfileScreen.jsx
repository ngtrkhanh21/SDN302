import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import useAuthStore from '../../store/auth-store';
import { ROLES } from '../../constants/roles';

function getRoleLabel(role) {
  if (role === ROLES.ADMIN) return 'ADMIN';
  if (role === ROLES.STAFF) return 'STAFF';
  if (role === ROLES.INSTRUCTOR) return 'INSTRUCTOR';
  return 'CUSTOMER';
}

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const roleLabel = getRoleLabel(user?.role);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>My colorful profile</Text>

        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.name || 'Little artist'}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || 'Unknown'}</Text>

        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{roleLabel}</Text>

        {/* Edit Profile - only show if navigation is available (customer has it) */}
        {navigation && (
          <>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('ProfileEdit')}
            >
              <Text style={styles.editText}>✏️ Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => navigation.navigate('PaymentHistory')}
            >
              <Text style={styles.historyText}>💳 Payment History</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert('Sign out', 'Do you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign out',
                style: 'destructive',
                onPress: logout,
              },
            ]);
          }}
        >
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fab1a0',
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e17055',
    marginBottom: 16,
  },
  label: { fontSize: 14, color: '#636e72', marginTop: 8 },
  value: { fontSize: 16, fontWeight: '600', color: '#2d3436' },
  editButton: {
    marginTop: 20,
    backgroundColor: '#74b9ff',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  editText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  historyButton: {
    marginTop: 10,
    backgroundColor: '#a29bfe',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  historyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutButton: {
    marginTop: 10,
    backgroundColor: '#d63031',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
