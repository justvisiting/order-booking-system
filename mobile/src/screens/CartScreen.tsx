import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCartStore } from '../store/cart';
import { EmptyState } from '../components/EmptyState';
import { CartItem } from '../types';

export function CartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);

  const handleDecrement = (item: CartItem) => {
    if (item.quantity <= 1) {
      Alert.alert('Remove Item', `Remove ${item.product.name} from cart?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(item.product.id) },
      ]);
    } else {
      updateQuantity(item.product.id, item.quantity - 1);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          message="Your cart is empty"
          actionLabel="Browse Products"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
        <Text style={styles.itemUnit}>
          {'\u20B9'}{item.product.price.toFixed(2)} / {item.product.unit}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => handleDecrement(item)}
          >
            <Text style={styles.stepperBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.stepperQty}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtotal}>
          {'\u20B9'}{(item.product.price * item.quantity).toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => removeItem(item.product.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteIcon}>x</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.product.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{getItemCount()} items</Text>
          <Text style={styles.summaryTotal}>{'\u20B9'}{getTotal().toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.7}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 16 },
  row: {
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
  rowInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  itemUnit: { fontSize: 13, color: '#6B7280' },
  rowRight: { alignItems: 'flex-end' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 4,
  },
  stepperBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { fontSize: 18, fontWeight: '600', color: '#2563EB' },
  stepperQty: { fontSize: 15, fontWeight: '600', color: '#111827', minWidth: 28, textAlign: 'center' },
  subtotal: { fontSize: 14, fontWeight: '600', color: '#111827' },
  deleteBtn: { marginLeft: 12, padding: 4 },
  deleteIcon: { fontSize: 16, color: '#EF4444', fontWeight: '700' },
  summary: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: { fontSize: 15, color: '#6B7280' },
  summaryTotal: { fontSize: 22, fontWeight: '700', color: '#111827' },
  checkoutBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
