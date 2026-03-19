import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { fetchOrdersByPhone } from '../api/client';
import { Order, OrderItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

type RouteParams = { OrderTracking: { phone?: string } | undefined };

export function OrderTrackingScreen() {
  const route = useRoute<RouteProp<RouteParams, 'OrderTracking'>>();
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (route.params?.phone) {
      setPhone(route.params.phone);
      searchOrders(route.params.phone);
    }
  }, [route.params?.phone]);

  const searchOrders = useCallback(async (phoneNumber?: string) => {
    const p = phoneNumber || phone;
    if (!/^\d{10}$/.test(p)) {
      setPhoneError('Enter a valid 10-digit phone number');
      return;
    }
    setPhoneError('');
    setError('');
    setLoading(true);
    try {
      const data = await fetchOrdersByPhone(p);
      setOrders(data);
    } catch (e: any) {
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [phone]);

  const onRefresh = useCallback(() => {
    if (!/^\d{10}$/.test(phone)) return;
    setRefreshing(true);
    searchOrders();
  }, [phone, searchOrders]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${mins}`;
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const expanded = expandedId === item.id;
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => setExpandedId(expanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.orderHeaderRight}>
            <StatusBadge status={item.status} />
            <Text style={styles.orderTotal}>
              {'\u20B9'}{item.total_amount.toFixed(2)}
            </Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.expandedSection}>
            {item.items && item.items.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items</Text>
                {item.items.map((oi: OrderItem) => (
                  <View key={oi.id} style={styles.orderItemRow}>
                    <Text style={styles.orderItemName} numberOfLines={1}>{oi.product_name}</Text>
                    <Text style={styles.orderItemQty}>
                      {oi.quantity} x {'\u20B9'}{oi.unit_price.toFixed(2)}
                    </Text>
                    <Text style={styles.orderItemSubtotal}>
                      {'\u20B9'}{oi.subtotal.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {item.delivery_address && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <Text style={styles.sectionText}>
                  {item.delivery_address.address}, {item.delivery_address.city},{' '}
                  {item.delivery_address.state} - {item.delivery_address.pincode}
                </Text>
              </View>
            )}

            {item.notes ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.sectionText}>{item.notes}</Text>
              </View>
            ) : null}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.searchSection}>
        <TextInput
          style={[styles.phoneInput, phoneError ? styles.phoneInputError : null]}
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            if (phoneError) setPhoneError('');
          }}
          placeholder="Enter your 10-digit phone number"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={10}
        />
        {phoneError ? <Text style={styles.phoneErrorText}>{phoneError}</Text> : null}
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => searchOrders()}
          activeOpacity={0.7}
        >
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => searchOrders()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && orders !== null && (
        orders.length === 0 ? (
          <EmptyState message="No orders found for this phone number" />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderOrder}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
            }
          />
        )
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchSection: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  phoneInputError: { borderColor: '#EF4444' },
  phoneErrorText: { color: '#EF4444', fontSize: 13, marginBottom: 8 },
  searchBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  list: { padding: 16 },
  orderCard: {
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
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderNumber: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  orderDate: { fontSize: 13, color: '#6B7280' },
  orderHeaderRight: { alignItems: 'flex-end' },
  orderTotal: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 6 },
  expandedSection: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 14 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  sectionText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  orderItemName: { flex: 1, fontSize: 14, color: '#111827', marginRight: 8 },
  orderItemQty: { fontSize: 13, color: '#6B7280', marginRight: 12 },
  orderItemSubtotal: { fontSize: 14, fontWeight: '600', color: '#111827' },
});
