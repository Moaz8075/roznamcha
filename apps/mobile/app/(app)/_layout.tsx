import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/auth/auth-context';

export default function AppLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator size="large" color="#0B3D2E" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FBF9F3' },
        headerTitleStyle: { fontSize: 18, fontWeight: '700', color: '#12211B' },
        headerShadowVisible: false,
        headerTintColor: '#0B3D2E',
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: '#FBF9F3' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="more" options={{ headerShown: false, title: 'Profile' }} />
      <Stack.Screen name="customers/[id]" options={{ headerShown: false, title: 'Customer' }} />
      <Stack.Screen name="suppliers/[id]" options={{ headerShown: false, title: 'Supplier' }} />
      <Stack.Screen name="products" options={{ title: 'Products' }} />
      <Stack.Screen name="sales/new" options={{ title: 'New Sale' }} />
      <Stack.Screen name="sales/[id]" options={{ headerShown: false, title: 'Invoice' }} />
      <Stack.Screen name="purchases/new" options={{ title: 'New Purchase' }} />
      <Stack.Screen name="payments" options={{ title: 'Payments' }} />
      <Stack.Screen name="expenses" options={{ headerShown: false, title: 'Expenses' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
