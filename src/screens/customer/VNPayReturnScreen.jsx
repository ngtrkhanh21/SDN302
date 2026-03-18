import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import vnpayService from '../../services/vnpay-service';

export default function VNPayReturnScreen({ route, navigation }) {
  const params = route?.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await vnpayService.handleVNPayReturn(params);
        setResult(data?.data || data);
      } catch (e) {
        console.warn('VNPay return error', e);
        setError('Cannot verify payment result.');
      } finally {
        setIsLoading(false);
      }
    };
    verify();
  }, []);

  const isSuccess =
    result?.RspCode === '00' ||
    result?.status === 'success' ||
    result?.status === 'paid';

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#e17055" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.icon}>{error ? '❌' : isSuccess ? '✅' : '⚠️'}</Text>
          <Text style={styles.title}>
            {error ? 'Lỗi xác thực' : isSuccess ? 'Thanh toán thành công!' : 'Thanh toán chưa xác nhận'}
          </Text>
          <Text style={styles.subtitle}>
            {error ||
              (isSuccess
                ? 'Cảm ơn bạn đã mua khóa học. Vào "My Courses" để bắt đầu học!'
                : 'Vui lòng kiểm tra lại lịch sử đơn hàng.')}
          </Text>

          {result && (
            <View style={styles.infoBox}>
              {result.vnp_TxnRef && (
                <Text style={styles.infoText}>Mã giao dịch: {result.vnp_TxnRef}</Text>
              )}
              {result.vnp_Amount && (
                <Text style={styles.infoText}>
                  Số tiền: {(Number(result.vnp_Amount) / 100).toLocaleString('vi-VN')} VND
                </Text>
              )}
              {result.vnp_PayDate && (
                <Text style={styles.infoText}>Ngày TT: {result.vnp_PayDate}</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('MainTabs', { screen: isSuccess ? 'Home' : 'Orders' })}
          >
            <Text style={styles.buttonText}>
              {isSuccess ? 'Về trang chủ' : 'Xem đơn hàng'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffeaa7',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    paddingTop: 60,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2d3436',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#2d3436',
    marginBottom: 6,
  },
  button: {
    backgroundColor: '#e17055',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
