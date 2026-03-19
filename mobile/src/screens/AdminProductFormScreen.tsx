import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { createProduct, updateProduct, fetchCategories } from '../api/client';
import { useAuthStore } from '../store/auth';
import { Product, Category } from '../types';
import { FormInput } from '../components/FormInput';

type RouteParams = { AdminProductForm: { product?: Product } };

export function AdminProductFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'AdminProductForm'>>();
  const existing = route.params?.product;
  const isEditing = !!existing;
  const token = useAuthStore((s) => s.token);

  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [unit, setUnit] = useState(existing?.unit || 'kg');
  const [categoryId, setCategoryId] = useState(existing?.category_id || 0);
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Product' : 'New Product',
    });
  }, [navigation, isEditing]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!description.trim()) e.description = 'Description is required';
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) e.price = 'Enter a valid price';
    if (!unit.trim()) e.unit = 'Unit is required';
    if (!categoryId) e.category = 'Select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !token) return;
    setSaving(true);
    try {
      if (isEditing && existing) {
        await updateProduct(token, existing.id, {
          name: name.trim(),
          description: description.trim(),
          price: parseFloat(price),
          unit: unit.trim(),
          category_id: categoryId,
          is_active: isActive,
        });
      } else {
        await createProduct(token, {
          name: name.trim(),
          description: description.trim(),
          price: parseFloat(price),
          unit: unit.trim(),
          category_id: categoryId,
        });
      }
      navigation.goBack();
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || 'Failed to save product');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <FormInput
          label="Product Name"
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="Enter product name"
        />
        <FormInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          multiline
          placeholder="Enter product description"
        />
        <FormInput
          label="Price"
          value={price}
          onChangeText={setPrice}
          error={errors.price}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <FormInput
          label="Unit"
          value={unit}
          onChangeText={setUnit}
          error={errors.unit}
          placeholder="kg, piece, litre, etc."
        />

        <View style={styles.categorySection}>
          <Text style={styles.label}>Category</Text>
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipSelected]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={[styles.categoryChipText, categoryId === cat.id && styles.categoryChipTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isEditing && (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={isActive ? '#2563EB' : '#9CA3AF'}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>{isEditing ? 'Update Product' : 'Create Product'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20, paddingBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 4 },
  categorySection: { marginBottom: 16 },
  categoryScroll: { marginTop: 4 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  categoryChipSelected: { backgroundColor: '#2563EB' },
  categoryChipText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  categoryChipTextSelected: { color: '#FFFFFF' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  switchLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
