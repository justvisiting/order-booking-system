import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { ProductCatalogScreen } from '../screens/ProductCatalogScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderReviewScreen } from '../screens/OrderReviewScreen';
import { OrderConfirmationScreen } from '../screens/OrderConfirmationScreen';
import { OrderTrackingScreen } from '../screens/OrderTrackingScreen';
import { StaffLoginScreen } from '../screens/StaffLoginScreen';
import { StaffOrderListScreen } from '../screens/StaffOrderListScreen';
import { StaffOrderDetailScreen } from '../screens/StaffOrderDetailScreen';
import { AdminProductListScreen } from '../screens/AdminProductListScreen';
import { AdminProductFormScreen } from '../screens/AdminProductFormScreen';
import { useAuthStore } from '../store/auth';

const ShopStack = createNativeStackNavigator();
const TrackStack = createNativeStackNavigator();
const StaffStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTintColor: '#111827',
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
  headerBackTitle: '',
};

function ShopStackNavigator() {
  return (
    <ShopStack.Navigator screenOptions={stackScreenOptions}>
      <ShopStack.Screen
        name="ProductCatalog"
        component={ProductCatalogScreen}
        options={{ title: 'Shop' }}
      />
      <ShopStack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Cart' }}
      />
      <ShopStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <ShopStack.Screen
        name="OrderReview"
        component={OrderReviewScreen}
        options={{ title: 'Review Order' }}
      />
      <ShopStack.Screen
        name="OrderConfirmation"
        component={OrderConfirmationScreen}
        options={{ title: 'Confirmation', headerBackVisible: false }}
      />
    </ShopStack.Navigator>
  );
}

function TrackStackNavigator() {
  return (
    <TrackStack.Navigator screenOptions={stackScreenOptions}>
      <TrackStack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: 'Track Order' }}
      />
    </TrackStack.Navigator>
  );
}

function StaffStackNavigator() {
  const isLoggedIn = useAuthStore((s) => s.token !== null);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return (
    <StaffStack.Navigator screenOptions={stackScreenOptions}>
      {!isLoggedIn ? (
        <StaffStack.Screen
          name="StaffLogin"
          component={StaffLoginScreen}
          options={{ title: 'Staff Login' }}
        />
      ) : (
        <>
          <StaffStack.Screen
            name="StaffOrderList"
            component={StaffOrderListScreen}
            options={{ title: 'Orders' }}
          />
          <StaffStack.Screen
            name="StaffOrderDetail"
            component={StaffOrderDetailScreen}
            options={{ title: 'Order Details' }}
          />
          {isAdmin && (
            <>
              <StaffStack.Screen
                name="AdminProductList"
                component={AdminProductListScreen}
                options={{ title: 'Products' }}
              />
              <StaffStack.Screen
                name="AdminProductForm"
                component={AdminProductFormScreen}
                options={{ title: 'Product' }}
              />
            </>
          )}
        </>
      )}
    </StaffStack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  let icon = '\u{1F6D2}';
  if (label === 'Track') icon = '\u{1F4E6}';
  if (label === 'Staff') icon = '\u{1F4CB}';
  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>{icon}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  iconFocused: { opacity: 1 },
});

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          paddingBottom: 4,
          height: 56,
        },
      }}
    >
      <Tab.Screen
        name="Shop"
        component={ShopStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Shop" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Track Order"
        component={TrackStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Track" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Staff"
        component={StaffStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Staff" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
