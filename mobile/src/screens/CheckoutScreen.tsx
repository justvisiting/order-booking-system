import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCartStore } from '../store/cart';
import { FormInput } from '../components/FormInput';
import { CheckoutFormData } from '../types';

export function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const items = useCartStore((s) => s.items);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (items.length === 0) {
      navigation.navigate('ProductCatalog');
    }
  }, [items.length, navigation]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!/^\d{10}$/.test(phone)) e.phone = 'Enter a valid 10-digit phone number';
    if (!address.trim()) e.address = 'Street address is required';
    if (!city.trim()) e.city = 'City is required';
    if (!state.trim()) e.state = 'State is required';
    if (!/^\d{6}$/.test(pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReview = () => {
    Keyboard.dismiss();
    if (!validate()) return;

    const formData: CheckoutFormData = {
      customer_name: name.trim(),
      customer_phone: phone,
      delivery_address: {
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode,
      },
      notes: notes.trim(),
    };
    navigation.navigate('OrderReview', { formData });
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
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <FormInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />
        <FormInput
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          keyboardType="number-pad"
          placeholder="10-digit phone number"
        />

        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <FormInput
          label="Street Address"
          value={address}
          onChangeText={setAddress}
          error={errors.address}
        />
        <FormInput
          label="City"
          value={city}
          onChangeText={setCity}
          error={errors.city}
        />
        <FormInput
          label="State"
          value={state}
          onChangeText={setState}
          error={errors.state}
        />
        <FormInput
          label="Pincode"
          value={pincode}
          onChangeText={setPincode}
          error={errors.pincode}
          keyboardType="number-pad"
          placeholder="6-digit pincode"
        />

        <Text style={styles.sectionTitle}>Additional</Text>
        <FormInput
          label="Order Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Any special instructions?"
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={handleReview}
          activeOpacity={0.7}
        >
          <Text style={styles.reviewBtnText}>Review Order</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reviewBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  reviewBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
