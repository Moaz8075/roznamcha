import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/auth/auth-context';

export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator size="large" color="#0B3D2E" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  return <Redirect href="/login" />;
}
