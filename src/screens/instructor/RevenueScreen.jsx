import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import instructorService from '../../services/instructor-service';

export default function RevenueScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesSummary, setSalesSummary] = useState([]);

  const loadData = async () => {
    try {
      const res = await instructorService.getCourseSalesSummary();
      const list = res?.data || res || [];
      setSalesSummary(Array.isArray(list) ? list : []);
    } catch (error) {
      console.warn('Failed to load sales summary', error);
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

  const totalGlobalRevenue = salesSummary.reduce(
    (sum, item) => sum + (item.totalRevenue || 0),
    0,
  );

  const renderItem = ({ item }) => {
    const title = item.courseName || `Course ID: ${item.courseId}`;
    const revenue = item.totalRevenue || 0;
    const sold = item.totalSold || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.courseTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Copies Sold</Text>
            <Text style={styles.statValue}>{sold}</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxRight]}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statRevenue}>
              {Number(revenue).toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Revenue</Text>
      <Text style={styles.subtitle}>Watch your art business blossom</Text>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalValue}>
          {Number(totalGlobalRevenue).toLocaleString('vi-VN')} VND
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#00b894" size="large" style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Breakdown by Course</Text>
          <FlatList
            data={salesSummary}
            keyExtractor={(item, index) => String(item.courseId || index)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No revenue data yet.</Text>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#55efc4',
    paddingTop: 56,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#00b894',
    marginBottom: 4,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 15,
    color: '#2d3436',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  totalBox: {
    backgroundColor: '#00b894',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 8,
  },
  totalValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
    paddingTop: 16,
  },
  statBox: {
    flex: 1,
  },
  statBoxRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0984e3',
  },
  statRevenue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00b894',
  },
  emptyText: {
    textAlign: 'center',
    color: '#b2bec3',
    marginTop: 32,
    fontSize: 15,
  },
});
