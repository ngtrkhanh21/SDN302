import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import orderService from '../../services/order-service';

export default function OrderHistoryScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getMyOrders();
      const list = data?.data || data || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (error) {
      console.warn('Failed to load orders', error);
      Alert.alert('Error', 'Cannot load orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadOrders);
    return unsub;
  }, [navigation]);

  const getStatusColor = status => {
    if (status === 'paid') return '#00b894';
    if (status === 'failed' || status === 'refunded') return '#d63031';
    return '#fdcb6e';
  };

  const handlePayNow = orderId => {
    navigation.navigate('Payment', { orderId });
  };

  const renderItem = ({ item }) => {
    const orderId = item._id || item.id;
    const status = item.status || 'pending';
    const items = item.items || item.courses || [];
    const total = item.total ?? items.reduce((s, i) => s + (i.price || 0), 0);
    const createdAt = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('vi-VN')
      : '';
    const isPending = status === 'pending' || status === 'unpaid';

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.orderId}>Order #{String(orderId).slice(-6)}</Text>
          <Text style={[styles.status, { color: getStatusColor(status) }]}>
            {status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.total}>{Number(total).toLocaleString('vi-VN')} VND</Text>
        {createdAt ? <Text style={styles.date}>{createdAt}</Text> : null}

        <View style={styles.cardActions}>
          {/* Feedback for paid orders */}
          {status === 'paid' && items.length > 0 && (
            <TouchableOpacity
              style={styles.feedbackBtn}
              onPress={() => {
                const firstCourseId =
                  items[0]?.course_id ||
                  items[0]?.course?._id ||
                  items[0]?.course?.id;
                if (firstCourseId) {
                  navigation.navigate('Feedback', { courseId: firstCourseId });
                }
              }}
            >
              <Text style={styles.feedbackText}>Give Feedback</Text>
            </TouchableOpacity>
          )}

          {/* Pay now for pending orders */}
          {isPending && (
            <TouchableOpacity
              style={styles.payNowBtn}
              onPress={() => handlePayNow(orderId)}
            >
              <Text style={styles.payNowText}>Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your art story</Text>
      <Text style={styles.subtitle}>Orders you have placed</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#d35400" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item._id || item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No orders yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdcb6e',
    padding: 16,
    paddingTop: 48,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#d35400', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#2d3436', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: { fontSize: 16, fontWeight: '700', color: '#2d3436' },
  status: { fontSize: 14, fontWeight: '600' },
  total: { fontSize: 15, color: '#636e72', marginTop: 4 },
  date: { fontSize: 12, color: '#b2bec3', marginTop: 2 },
  cardActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  feedbackBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#74b9ff',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  feedbackText: { color: '#0984e3', fontWeight: '600', fontSize: 13 },
  payNowBtn: {
    flex: 1,
    backgroundColor: '#e17055',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  payNowText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: {
    textAlign: 'center',
    color: '#2d3436',
    marginTop: 24,
  },
});
