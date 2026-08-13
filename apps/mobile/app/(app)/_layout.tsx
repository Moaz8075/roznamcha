import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/auth/auth-context';

export default function AppLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator size="large" color="#F15A24" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: '#FBF9F3' },
        headerTitleStyle: { fontSize: 18, fontWeight: '700', color: '#12211B' },
        headerShadowVisible: false,
        headerTintColor: '#0B3D2E',
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: '#F4F4F4' },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="more" options={{ title: 'Profile' }} />
      <Stack.Screen name="customers/[id]" options={{ title: 'Customer' }} />
      <Stack.Screen name="suppliers/[id]" options={{ title: 'Supplier' }} />
      <Stack.Screen name="entry" options={{ title: 'Entry' }} />
      <Stack.Screen name="products" options={{ title: 'Products' }} />
      <Stack.Screen name="sales/new" options={{ headerShown: true, title: 'New Sale' }} />
      <Stack.Screen name="sales/[id]" options={{ title: 'Invoice' }} />
      <Stack.Screen name="purchases/new" options={{ headerShown: true, title: 'New Purchase' }} />
      <Stack.Screen name="payments" options={{ headerShown: true, title: 'Payments' }} />
      <Stack.Screen name="expenses" options={{ title: 'Expenses' }} />
      <Stack.Screen name="reports" options={{ headerShown: true, title: 'Reports' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
