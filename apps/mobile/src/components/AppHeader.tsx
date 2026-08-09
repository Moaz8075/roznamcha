import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/auth-context';
import { BrandLogo } from './BrandLogo';

export function AppHeader({
  showBack = false,
  fallbackHref = '/more',
}: {
  showBack?: boolean;
  fallbackHref?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const initial = (user?.name?.trim()?.[0] ?? 'R').toUpperCase();

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 8) }}
      className="mb-4 flex-row items-center justify-between"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={showBack ? 'Go back' : 'Open menu'}
        onPress={() => {
          if (showBack) {
            if (router.canGoBack()) router.back();
            else router.replace(fallbackHref as '/more');
            return;
          }
          router.push('/more');
        }}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-black/5"
        hitSlop={8}
      >
        <Ionicons name={showBack ? 'chevron-back' : 'menu'} size={26} color="#0B3D2E" />
      </Pressable>

      <BrandLogo width={120} height={44} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        onPress={() => router.push('/settings')}
        className="h-11 w-11 items-center justify-center rounded-full bg-brand active:opacity-80"
        hitSlop={8}
      >
        <Text className="text-body-lg font-bold text-white">{initial}</Text>
      </Pressable>
    </View>
  );
}
