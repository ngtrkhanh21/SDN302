import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InstructorProfilesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Instructor profiles</Text>
      <Text style={styles.subtitle}>
        Manage all friendly art teachers here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffeaa7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e17055',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#2d3436',
    textAlign: 'center',
  },
});

