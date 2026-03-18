import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PostManageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Posts management</Text>
      <Text style={styles.subtitle}>
        Review community posts before kids see them.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#55efc4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00b894',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#2d3436',
    textAlign: 'center',
  },
});

