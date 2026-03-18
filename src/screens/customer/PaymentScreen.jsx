import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import paymentService from '../../services/payment-service';

export default function PaymentScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  const handlePayWithVNPay = async () => {
    setIsLoading(true);
    try {
      const data = await paymentService.createPaymentFromOrder(
        orderId,
        'vnpay',
      );
      const url = data?.data?.paymentUrl || data?.paymentUrl || data?.url;
      if (url) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          Alert.alert(
            'Payment',
            'You will be redirected back after payment.',
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
        } else {
          Alert.alert('Error', 'Cannot open payment URL.');
        }
      } else {
        Alert.alert('Info', 'Payment URL not returned. Check your orders.');
      }
    } catch (error) {
      console.warn('Failed to create payment', error);
      Alert.alert('Error', 'Cannot create payment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>
        Order ID: {orderId}
      </Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handlePayWithVNPay}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay with VNPay</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Back to cart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdcb6e',
    padding: 24,
    paddingTop: 16,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d35400',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#d35400',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#2d3436',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#e17055',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  backText: {
    color: '#0984e3',
    fontSize: 16,
    fontWeight: '600',
  },
});
