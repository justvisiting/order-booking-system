import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchDashboardOrders } from '../api/client';
import { useAuthStore } from '../store/auth';
import { Order, OrderStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { EmptyState } from '../components/EmptyState';
import { CategoryChip } from '../components/CategoryChip';

const STATUS_FILTERS: ('All' | OrderStatus)[] = ['All', 'pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

export function StaffOrderListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 4 }}>
          {user?.role === 'admin' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminProductList')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#2563EB' }}>Products</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={logout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      ),
      title: user?.role === 'admin' ? 'Orders (Admin)' : 'Orders (Staff)',
    });
  }, [navigation, logout, user]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const params = statusFilter !== 'All' ? { status: statusFilter, per_page: 50 } : { per_page: 50 };
      const data = await fetchDashboardOrders(token, params);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      if (e.status === 401) {
        logout();
        return;
      }
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, statusFilter, logout]);

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={loadOrders} />;

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('StaffOrderDetail', { orderId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
          <Text style={styles.customerName}>{item.customer_name || 'Customer'}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.cardRight}>
          <StatusBadge status={item.status} />
          <Text style={styles.orderTotal}>
            {'\u20B9'}{item.total_amount.toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map((s) => (
            <CategoryChip
              key={s}
              label={s === 'All' ? `All (${total})` : s.charAt(0).toUpperCase() + s.slice(1)}
              selected={statusFilter === s}
              onPress={() => setStatusFilter(s)}
            />
          ))}
        </ScrollView>
      </View>

      {orders.length === 0 ? (
        <EmptyState message={`No ${statusFilter !== 'All' ? statusFilter : ''} orders found`} />
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  filterSection: { paddingTop: 12, paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 16 },
  list: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  cardRow: { flexDirection: 'row' },
  orderNumber: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  customerName: { fontSize: 14, color: '#374151', marginBottom: 2 },
  orderDate: { fontSize: 13, color: '#6B7280' },
  cardRight: { alignItems: 'flex-end' },
  orderTotal: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
});
