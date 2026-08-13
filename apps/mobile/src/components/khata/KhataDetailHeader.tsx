import { StatusBar } from 'expo-status-bar';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KHATA } from '../../theme';
import { formatMoney } from '../../lib/format';

const GAVE = '#E53935';
const GOT = '#2E7D32';

export function KhataDetailHeader({
  name,
  kind,
  phone,
  onBack,
  onSettings,
  onMenu,
  balanceAmount,
  balanceTone,
  balanceLabel,
}: {
  name: string;
  kind: 'customer' | 'supplier';
  phone?: string | null;
  onBack: () => void;
  onSettings: () => void;
  onMenu: () => void;
  balanceAmount: string;
  balanceTone: 'in' | 'out' | 'settled';
  balanceLabel: string;
}) {
  const insets = useSafeAreaInsets();
  const badgeColor = kind === 'supplier' ? KHATA.green : KHATA.red;
  const amountColor =
    balanceTone === 'in' ? GAVE : balanceTone === 'out' ? GOT : '#212121';

  const call = () => {
    if (!phone?.trim()) {
      Alert.alert('No phone', 'Add a phone number in settings first.');
      return;
    }
    Linking.openURL(`tel:${phone.trim()}`).catch(() =>
      Alert.alert('Could not call', 'Unable to open the phone app.'),
    );
  };

  return (
    <View style={{ backgroundColor: KHATA.orange, paddingTop: Math.max(insets.top, 12) }}>
      <StatusBar style="light" />

      <View className="flex-row items-center px-2 pb-3 pt-1">
        <Pressable onPress={onBack} className="h-11 w-11 items-center justify-center" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <Pressable onPress={onSettings} className="min-w-0 flex-1 px-1">
          <View className="flex-row flex-wrap items-center gap-y-1">
            <Text className="max-w-[70%] text-[18px] font-bold text-white" numberOfLines={1}>
              {name}
            </Text>
            <View className="ml-2 rounded-full px-2 py-0.5" style={{ backgroundColor: badgeColor }}>
              <Text className="text-[10px] font-extrabold text-white">
                {kind === 'supplier' ? 'Supplier' : 'Customer'}
              </Text>
            </View>
          </View>
          <Text className="mt-0.5 text-[12px] text-white/80">Click here to view settings</Text>
        </Pressable>

        <Pressable onPress={call} className="h-11 w-11 items-center justify-center" hitSlop={8}>
          <Ionicons name="call-outline" size={20} color="#fff" />
        </Pressable>
        <Pressable onPress={onMenu} className="h-11 w-11 items-center justify-center" hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Balance card lives inside the header so it cannot cover the name row */}
      <View
        className="mx-4 mb-3 items-center rounded-2xl bg-white px-4 py-3.5"
        style={{
          elevation: 3,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Text className="text-[26px] font-extrabold" style={{ color: amountColor }}>
          Rs {formatMoney(Math.abs(Number(balanceAmount) || 0))}
        </Text>
        <Text className="mt-0.5 text-[13px] text-ink/55">{balanceLabel}</Text>
      </View>
    </View>
  );
}

export function QuickActions({
  actions,
}: {
  actions: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[];
}) {
  return (
    <View className="flex-row justify-center gap-3 px-4 py-3">
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          className="min-w-[88px] flex-1 items-center rounded-2xl bg-white py-3"
          style={{ elevation: 1, maxWidth: 140 }}
        >
          <Ionicons name={action.icon} size={22} color={KHATA.orange} />
          <Text className="mt-1 text-[11px] font-semibold text-ink/70">{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
