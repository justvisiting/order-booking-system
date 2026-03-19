import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { fetchDashboardOrder, updateOrderStatus } from '../api/client';
import { useAuthStore } from '../store/auth';
import { Order, OrderStatus, OrderItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';

type RouteParams = { StaffOrderDetail: { orderId: number } };

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['dispatched', 'cancelled'],
  dispatched: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const ACTION_LABELS: Record<OrderStatus, string> = {
  confirmed: 'Confirm Order',
  dispatched: 'Mark Dispatched',
  delivered: 'Mark Delivered',
  cancelled: 'Cancel Order',
  pending: '',
};

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#2563EB', text: '#FFFFFF' },
  dispatched: { bg: '#7C3AED', text: '#FFFFFF' },
  delivered: { bg: '#059669', text: '#FFFFFF' },
  cancelled: { bg: '#FFFFFF', text: '#EF4444' },
};

export function StaffOrderDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'StaffOrderDetail'>>();
  const { orderId } = route.params;
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<OrderStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await fetchDashboardOrder(token, orderId);
      setOrder(data);
    } catch (e: any) {
      if (e.status === 401) { logout(); return; }
      setError(e.message || 'Failed to load order');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, orderId, logout]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrder();
  }, [loadOrder]);

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    const label = ACTION_LABELS[newStatus] || newStatus;
    const isCancellation = newStatus === 'cancelled';

    Alert.alert(
      isCancellation ? 'Cancel Order' : 'Update Status',
      `Are you sure you want to ${label.toLowerCase()}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: isCancellation ? 'destructive' : 'default',
          onPress: async () => {
            if (!token) return;
            setUpdating(newStatus);
            try {
              const updated = await updateOrderStatus(token, orderId, newStatus);
              setOrder(updated);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to update status');
            } finally {
              setUpdating(null);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={loadOrder} />;
  if (!order) return <ErrorScreen message="Order not found" onRetry={loadOrder} />;

  const transitions = STATUS_TRANSITIONS[order.status];
  const fullAddress = order.delivery_address
    ? `${order.delivery_address.address}, ${order.delivery_address.city}, ${order.delivery_address.state} - ${order.delivery_address.pincode}`
    : null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        <View style={styles.headerCard}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <StatusBadge status={order.status} />
          <Text style={styles.totalAmount}>
            {'\u20B9'}{order.total_amount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.infoText}>{order.customer_name || 'N/A'}</Text>
          <Text style={styles.infoTextSecondary}>{order.customer_phone || 'N/A'}</Text>
        </View>

        {fullAddress && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <Text style={styles.infoText}>{fullAddress}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((oi: OrderItem) => (
              <View key={oi.id} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>{oi.product_name}</Text>
                <Text style={styles.itemQty}>
                  {oi.quantity} x {'\u20B9'}{oi.unit_price.toFixed(2)}
                </Text>
                <Text style={styles.itemSubtotal}>
                  {'\u20B9'}{oi.subtotal.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.infoTextSecondary}>No items</Text>
          )}
        </View>

        {order.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timeline</Text>
          <Text style={styles.infoTextSecondary}>
            Created: {new Date(order.created_at).toLocaleString()}
          </Text>
          <Text style={styles.infoTextSecondary}>
            Updated: {new Date(order.updated_at).toLocaleString()}
          </Text>
        </View>
      </ScrollView>

      {transitions.length > 0 && (
        <View style={styles.footer}>
          {transitions.map((status) => {
            const colors = ACTION_COLORS[status] || ACTION_COLORS.confirmed;
            const isCancellation = status === 'cancelled';
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.bg },
                  isCancellation && styles.cancelBtn,
                  updating !== null && styles.actionBtnDisabled,
                ]}
                onPress={() => handleStatusUpdate(status)}
                disabled={updating !== null}
                activeOpacity={0.7}
              >
                {updating === status ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>
                    {ACTION_LABELS[status]}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, paddingBottom: 32 },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  orderNumber: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  totalAmount: { fontSize: 26, fontWeight: '800', color: '#111827', marginTop: 12 },
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
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  infoText: { fontSize: 15, color: '#111827', lineHeight: 22 },
  infoTextSecondary: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemName: { flex: 1, fontSize: 15, color: '#111827', marginRight: 8 },
  itemQty: { fontSize: 14, color: '#6B7280', marginRight: 12 },
  itemSubtotal: { fontSize: 15, fontWeight: '600', color: '#111827' },
  notesText: { fontSize: 14, color: '#6B7280', fontStyle: 'italic', lineHeight: 20 },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
});
