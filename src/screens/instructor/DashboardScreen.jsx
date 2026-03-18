import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import instructorService from '../../services/instructor-service';

export default function DashboardScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesSummary, setSalesSummary] = useState([]);
  const [orders, setOrders] = useState([]);

  const loadData = async () => {
    try {
      const [salesRes, ordersRes] = await Promise.all([
        instructorService.getCourseSalesSummary().catch(() => ({ data: [] })),
        instructorService.getOrderHistory().catch(() => ({ data: [] })),
      ]);

      const sales = salesRes?.data || salesRes || [];
      const ordersList = ordersRes?.data || ordersRes || [];
      setSalesSummary(Array.isArray(sales) ? sales : []);
      setOrders(Array.isArray(ordersList) ? ordersList : []);
    } catch (error) {
      console.warn('Dashboard load error', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculate totals (guard against non-array)
  const salesList = Array.isArray(salesSummary) ? salesSummary : [];
  const ordersList2 = Array.isArray(orders) ? orders : [];
  const totalRevenue = salesList.reduce(
    (sum, item) => sum + (item.totalRevenue || 0),
    0,
  );
  const totalCoursesSold = salesList.reduce(
    (sum, item) => sum + (item.totalSold || 0),
    0,
  );
  const totalOrders = ordersList2.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Instructor Dashboard</Text>
      <Text style={styles.subtitle}>Overview of your art classes</Text>

      {isLoading ? (
        <ActivityIndicator color="#6c5ce7" size="large" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#a29bfe' }]}>
              <Text style={styles.statLabel}>Total Revenue</Text>
              <Text style={styles.statValue}>
                {Number(totalRevenue).toLocaleString('vi-VN')} đ
              </Text>
            </View>

            <View style={styles.statRow}>
              <View style={[styles.statCardHalf, { backgroundColor: '#74b9ff' }]}>
                <Text style={styles.statLabel}>Courses Sold</Text>
                <Text style={styles.statValue}>{totalCoursesSold}</Text>
              </View>
              <View style={[styles.statCardHalf, { backgroundColor: '#55efc4' }]}>
                <Text style={styles.statLabel}>Total Orders</Text>
                <Text style={styles.statValue}>{totalOrders}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performing Courses</Text>
            {salesSummary.length === 0 ? (
              <Text style={styles.emptyText}>No sales data yet.</Text>
            ) : (
              salesSummary
                .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                .slice(0, 3)
                .map((item, index) => (
                  <View key={index} style={styles.courseRow}>
                    <Text style={styles.courseName} numberOfLines={1}>
                      {item.courseName || `Course ID: ${item.courseId}`}
                    </Text>
                    <Text style={styles.courseRevenue}>
                      {Number(item.totalRevenue || 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 24,
    paddingTop: 56,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2d3436',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#636e72',
    marginBottom: 24,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCardHalf: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 12,
  },
  courseRow: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  courseName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
    paddingRight: 16,
  },
  courseRevenue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00b894',
  },
  emptyText: {
    color: '#b2bec3',
    fontStyle: 'italic',
  },
});
