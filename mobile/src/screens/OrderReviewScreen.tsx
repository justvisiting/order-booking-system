import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCartStore } from '../store/cart';
import { placeOrder } from '../api/client';
import { CheckoutFormData, PlaceOrderRequest } from '../types';

type RouteParams = { OrderReview: { formData: CheckoutFormData } };

const ERROR_MAP: Record<string, string> = {
  'invalid request body': 'Something went wrong. Please try again.',
  'items cannot be empty': 'Your cart is empty.',
  'quantity must be greater than 0': 'Invalid item quantity.',
  'phone is required': 'Phone number is required.',
  'product unavailable or inactive': 'Some items are no longer available. Please update your cart.',
  'failed to place order': 'Failed to place order. Please try again.',
};

export function OrderReviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'OrderReview'>>();
  const { formData } = route.params;

  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigation.navigate('ProductCatalog');
    }
  }, []);

  const formatPhone = (p: string) => `${p.slice(0, 5)}-${p.slice(5)}`;

  const fullAddress = `${formData.delivery_address.address}, ${formData.delivery_address.city}, ${formData.delivery_address.state} - ${formData.delivery_address.pincode}`;

  const handlePlaceOrder = async () => {
    setPlacing(true);
    const request: PlaceOrderRequest = {
      customer: {
        name: formData.customer_name,
        phone: formData.customer_phone,
        address: fullAddress,
      },
      delivery_address: {
        address: formData.delivery_address.address,
        city: formData.delivery_address.city,
        state: formData.delivery_address.state,
        pincode: formData.delivery_address.pincode,
      },
      items: items.map((i) => ({
        product_id: parseInt(String(i.product.id), 10),
        quantity: i.quantity,
      })),
      notes: formData.notes || '',
    };

    try {
      const order = await placeOrder(request);
      clearCart();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'ProductCatalog' },
            {
              name: 'OrderConfirmation',
              params: {
                order_number: order.order_number,
                order_id: order.id,
                customer_phone: formData.customer_phone,
              },
            },
          ],
        })
      );
    } catch (e: any) {
      setPlacing(false);
      const serverMsg = e.serverError || '';
      const userMsg = ERROR_MAP[serverMsg] || 'Failed to place order. Please try again.';

      if (e.status === 422) {
        Alert.alert('Order Failed', userMsg, [
          { text: 'OK', onPress: () => navigation.navigate('Cart') },
        ]);
      } else {
        Alert.alert('Order Failed', userMsg);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Customer Info</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.infoText}>{formData.customer_name}</Text>
          <Text style={styles.infoText}>{formatPhone(formData.customer_phone)}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.infoText}>{fullAddress}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Order Items</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          {items.map((item) => (
            <View key={item.product.id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
              <Text style={styles.itemDetail}>
                {item.quantity} x {'\u20B9'}{item.product.price.toFixed(2)}
              </Text>
              <Text style={styles.itemSubtotal}>
                {'\u20B9'}{(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {formData.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{formData.notes}</Text>
          </View>
        ) : null}

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{'\u20B9'}{getTotal().toFixed(2)}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeBtn, placing && styles.placeBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.7}
        >
          {placing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.placeBtnText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  editLink: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  infoText: { fontSize: 15, color: '#374151', lineHeight: 22 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemName: { flex: 1, fontSize: 15, color: '#111827', marginRight: 8 },
  itemDetail: { fontSize: 14, color: '#6B7280', marginRight: 12 },
  itemSubtotal: { fontSize: 15, fontWeight: '600', color: '#111827' },
  notesText: { fontSize: 14, color: '#6B7280', fontStyle: 'italic', lineHeight: 20 },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  totalLabel: { fontSize: 18, fontWeight: '600', color: '#374151' },
  totalAmount: { fontSize: 26, fontWeight: '800', color: '#111827' },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  placeBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  placeBtnDisabled: { opacity: 0.7 },
  placeBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
