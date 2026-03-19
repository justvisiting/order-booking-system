import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface PriceTextProps {
  amount: number;
  style?: StyleProp<TextStyle>;
}

export function PriceText({ amount, style }: PriceTextProps) {
  const formatted = `\u20B9${amount.toFixed(2)}`;
  return <Text style={style}>{formatted}</Text>;
}
