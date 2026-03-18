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

export default function OrderReportsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    try {
      const res = await instructorService.getOrderHistory();
      const list = res?.data || res || [];
      // Mảng orders có thể bị bọc trong obj hoặc mảng
      setOrders(Array.isArray(list) ? list : []);
    } catch (error) {
      console.warn('Failed to load order history', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = status => {
    if (status === 'paid') return '#00b894';
    if (status === 'failed' || status === 'refunded') return '#d63031';
    return '#fdcb6e';
  };

  const renderItem = ({ item }) => {
    const status = item.status || 'pending';
    const total = item.total || item.amount || 0;
    const date = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('vi-VN')
      : '';
    const buyerName = item.user?.name || item.user_name || 'Anonymous Learner';

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.buyerName}>{buyerName}</Text>
          <Text style={[styles.statusBadge, { color: getStatusColor(status) }]}>
            {status.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.orderMeta}>
          Order #{String(item._id || item.id).slice(-6)}
        </Text>

        <View style={styles.row}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.price}>
            {Number(total).toLocaleString('vi-VN')} VND
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Reports</Text>
      <Text style={styles.subtitle}>Track your little artists' enrollments</Text>

      {isLoading ? (
        <ActivityIndicator color="#0984e3" size="large" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, index) => String(item._id || item.id || index)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No orders received yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#74b9ff',
    padding: 24,
    paddingTop: 56,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0984e3',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#dfe6e9',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: '800',
  },
  orderMeta: {
    fontSize: 13,
    color: '#b2bec3',
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    color: '#636e72',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00b894',
  },
  emptyText: {
    textAlign: 'center',
    color: '#dfe6e9',
    marginTop: 32,
    fontSize: 15,
  },
});
