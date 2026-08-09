import { View, Text } from 'react-native';
import { useAuth } from '../../src/auth/auth-context';
import { Screen, Title, Body } from '../../src/components/ui';
import { BigButton } from '../../src/components/BigButton';
import { getApiBaseUrl } from '../../src/lib/api';

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  return (
    <Screen>
      <View className="gap-4 px-5 py-6">
        <Title>Settings</Title>
        <Body>Signed in as {user?.name}</Body>
        <Text className="text-body text-ink/60">{user?.email}</Text>
        <Text className="text-body text-ink/60">Role: {user?.role}</Text>
        <Text className="text-body text-ink/40">API: {getApiBaseUrl()}</Text>
        <BigButton label="Sign Out" variant="secondary" onPress={() => logout()} className="mt-6" />
      </View>
    </Screen>
  );
}
