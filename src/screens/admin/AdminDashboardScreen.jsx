import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import reportService from '../../services/report-service';

export default function AdminDashboardScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const overview = await reportService.getAdminOverview();
        setStats(overview);
      } catch (error) {
        console.warn('Failed to load admin overview', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin dashboard</Text>
      <Text style={styles.subtitle}>Overview of the art world</Text>

      {isLoading ? (
        <ActivityIndicator color="#fff" size="large" style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.cardRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total courses</Text>
            <Text style={styles.cardValue}>{stats.totalCourses}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total orders</Text>
            <Text style={styles.cardValue}>{stats.totalOrders}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff7675',
    padding: 24,
    paddingTop: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffeaa7',
    marginBottom: 24,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: '#636e72',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#d63031',
    marginTop: 8,
  },
});

