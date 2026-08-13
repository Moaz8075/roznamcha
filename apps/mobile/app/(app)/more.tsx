import { ScrollView, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Title, Body } from '../../src/components/ui';
import { useAuth } from '../../src/auth/auth-context';
import { BigButton } from '../../src/components/BigButton';
import { AppHeader } from '../../src/components/AppHeader';

const LINKS = [
  { href: '/products', label: 'Products' },
  { href: '/payments', label: 'Receive Money / Pay Supplier' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
] as const;

export default function MoreScreen() {
  const { logout, user } = useAuth();

  return (
    <Screen className="bg-[#F4F4F4]">
      <ScrollView contentContainerClassName="gap-3 px-5 pb-10 pt-2">
        <AppHeader showBack fallbackHref="/dashboard" />
        <View className="mb-2">
          <Title>Profile</Title>
          <Body>{user?.email}</Body>
        </View>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href as '/products'} asChild>
            <Pressable className="min-h-[60px] justify-center rounded-2xl bg-white px-5 active:bg-brand-muted">
              <Text className="text-body-lg font-bold text-ink">{link.label}</Text>
            </Pressable>
          </Link>
        ))}
        <BigButton
          label="Sign Out"
          variant="secondary"
          className="mt-6"
          onPress={() => logout()}
        />
      </ScrollView>
    </Screen>
  );
}
