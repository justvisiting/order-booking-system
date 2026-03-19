import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchProducts } from '../api/client';
import { useCartStore } from '../store/cart';
import { Product } from '../types';
import { CategoryChip } from '../components/CategoryChip';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { EmptyState } from '../components/EmptyState';

type ShopStackParamList = {
  ProductCatalog: undefined;
  Cart: undefined;
};

export function ProductCatalogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getItemCount = useCartStore((s) => s.getItemCount);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchProducts();
      setProducts(data.filter((p) => p.is_active));
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category_name).filter(Boolean))];
    return ['All', ...cats.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category_name === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, selectedCategory, search]);

  const getCartQty = useCallback(
    (productId: number) => {
      const item = cartItems.find((i) => i.product.id === productId);
      return item?.quantity || 0;
    },
    [cartItems]
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Cart')}
          style={styles.headerCartBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.headerCartIcon}>Cart</Text>
          {getItemCount() > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{getItemCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, getItemCount, cartItems]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={loadProducts} />;

  const renderProduct = ({ item }: { item: Product }) => {
    const qty = getCartQty(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.category_name ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category_name}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.price}>
            {'\u20B9'}{item.price.toFixed(2)}/{item.unit}
          </Text>
        </View>
        <View style={styles.cardAction}>
          {qty === 0 ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addItem(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.addBtnText}>Add to Cart</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(item.id, qty - 1)}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperQty}>{qty}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(item.id, qty + 1)}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>
      {filtered.length === 0 ? (
        <EmptyState message="No products found" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
        />
      )}

      {getItemCount() > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>View Cart ({getItemCount()})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchContainer: { paddingHorizontal: 16, paddingTop: 12 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  chipsContainer: { paddingTop: 12, paddingBottom: 4 },
  chipsScroll: { paddingHorizontal: 16 },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBody: { marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: { fontSize: 17, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: { fontSize: 12, color: '#2563EB', fontWeight: '500' },
  description: { fontSize: 14, color: '#6B7280', marginBottom: 8, lineHeight: 20 },
  price: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardAction: { alignItems: 'flex-end' },
  addBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: { fontSize: 20, fontWeight: '600', color: '#2563EB' },
  stepperQty: { fontSize: 16, fontWeight: '600', color: '#111827', minWidth: 32, textAlign: 'center' },
  headerCartBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 4 },
  headerCartIcon: { fontSize: 16, fontWeight: '600', color: '#2563EB' },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 5,
  },
  headerBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
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
