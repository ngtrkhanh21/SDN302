import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AccountManageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accounts management</Text>
      <Text style={styles.subtitle}>
        Keep all little artists and teachers safe.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a29bfe',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6c5ce7',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#dfe6e9',
    textAlign: 'center',
  },
});

