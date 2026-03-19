import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBadge } from '../components/StatusBadge';

type RouteParams = {
  OrderConfirmation: {
    order_number: string;
    order_id: number;
    customer_phone: string;
  };
};

export function OrderConfirmationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'OrderConfirmation'>>();
  const { order_number, customer_phone } = route.params;

  const handleTrack = () => {
    const rootNav = navigation.getParent();
    if (rootNav) {
      rootNav.navigate('Track Order', {
        screen: 'OrderTracking',
        params: { phone: customer_phone },
      });
    }
  };

  const handleContinueShopping = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'ProductCatalog' }],
      })
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>{'\u2713'}</Text>
        </View>
        <Text style={styles.heading}>Order Placed!</Text>
        <Text style={styles.orderNumber}>{order_number}</Text>
        <StatusBadge status="pending" />

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleTrack}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryBtnText}>Track My Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleContinueShopping}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center' },
  content: { alignItems: 'center', padding: 32 },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkMark: { fontSize: 40, color: '#065F46' },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  actions: { width: '100%', marginTop: 40 },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    minHeight: 52,
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#2563EB', fontSize: 17, fontWeight: '700' },
});
