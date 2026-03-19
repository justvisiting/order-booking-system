import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchProducts, deleteProduct } from '../api/client';
import { useAuthStore } from '../store/auth';
import { Product } from '../types';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { EmptyState } from '../components/EmptyState';

export function AdminProductListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const token = useAuthStore((s) => s.token);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchProducts();
      setProducts(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadProducts();
    });
    return unsub;
  }, [navigation, loadProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, [loadProducts]);

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await deleteProduct(token, product.id);
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={loadProducts} />;

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => navigation.navigate('AdminProductForm', { product: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.statusDot, { backgroundColor: item.is_active ? '#059669' : '#9CA3AF' }]} />
        </View>
        <Text style={styles.category}>{item.category_name || 'Uncategorized'}</Text>
        <Text style={styles.price}>
          {'\u20B9'}{item.price.toFixed(2)} / {item.unit}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {products.length === 0 ? (
        <EmptyState
          message="No products yet"
          actionLabel="Add Product"
          onAction={() => navigation.navigate('AdminProductForm', {})}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AdminProductForm', {})}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Add Product</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  productName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  category: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '700', color: '#111827' },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  deleteText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
