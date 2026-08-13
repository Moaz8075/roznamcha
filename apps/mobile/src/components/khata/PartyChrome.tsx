import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KHATA } from '../../theme';
import { formatRs, initials, relativeActivity } from '../../lib/format';

export type PartyTab = 'customers' | 'suppliers' | 'all';

export function PartyHeader({
  tab,
  onTab,
  onBack,
}: {
  tab: PartyTab;
  onTab: (tab: PartyTab) => void;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const tabs: { id: PartyTab; label: string }[] = [
    { id: 'customers', label: 'Customers' },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'all', label: 'All' },
  ];

  return (
    <View style={{ backgroundColor: KHATA.orange, paddingTop: Math.max(insets.top, 8) }}>
      <StatusBar style="light" />
      <View className="flex-row items-center justify-between px-3 pb-2 pt-1">
        <Pressable
          onPress={onBack}
          className="h-10 w-10 items-center justify-center"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-[20px] font-bold text-white">Party</Text>
        <View
          className="rounded-full px-3 py-1.5"
          style={{ backgroundColor: KHATA.collection }}
        >
          <Text className="text-[11px] font-extrabold text-white">COLLECTION</Text>
        </View>
      </View>
      <View className="flex-row px-4">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable key={item.id} onPress={() => onTab(item.id)} className="relative mr-5 pb-3">
              <Text className={`text-[15px] ${active ? 'font-bold text-white' : 'text-white/80'}`}>
                {item.label}
              </Text>
              {active ? (
                <View
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
                  style={{ backgroundColor: KHATA.collection }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function PartySummaryCard({
  leftValue,
  leftLabel,
  rightValue,
  rightLabel,
  leftGreen = true,
  rightGreen = false,
  onToggle,
  hidden,
}: {
  leftValue: string;
  leftLabel: string;
  rightValue: string;
  rightLabel: string;
  leftGreen?: boolean;
  rightGreen?: boolean;
  onToggle?: () => void;
  hidden?: boolean;
}) {
  return (
    <View
      className="mx-4 -mt-3 rounded-2xl bg-white px-4 py-3"
      style={{
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Pressable onPress={onToggle} hitSlop={6}>
        <Text className="mb-2 text-[12px] font-semibold" style={{ color: KHATA.red }}>
          {hidden ? 'Show Balance' : 'Hide Balance'}
        </Text>
      </Pressable>
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text
            className="text-[22px] font-extrabold"
            style={{ color: leftGreen ? KHATA.green : KHATA.red }}
          >
            {hidden ? '••••••' : formatRs(leftValue)}
          </Text>
          <Text className="mt-0.5 text-[12px] text-ink/50">{leftLabel}</Text>
        </View>
        <View className="mx-3 h-10 w-px bg-black/10" />
        <View className="flex-1">
          <Text
            className="text-[22px] font-extrabold"
            style={{ color: rightGreen ? KHATA.green : KHATA.red }}
          >
            {hidden ? '••••••' : formatRs(rightValue)}
          </Text>
          <Text className="mt-0.5 text-[12px] text-ink/50">{rightLabel}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={KHATA.red} />
      </View>
    </View>
  );
}

export function PartySearchBar({
  value,
  onChange,
  countLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  countLabel: string;
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="min-h-[44px] flex-1 flex-row items-center rounded-full bg-white px-4">
        <Ionicons name="search" size={18} color="#9E9E9E" />
        <TextInput
          className="flex-1 px-3 text-[15px] text-ink"
          placeholder={countLabel}
          placeholderTextColor="#9E9E9E"
          value={value}
          onChangeText={onChange}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
      <Ionicons name="filter" size={22} color={KHATA.orange} />
      <Ionicons name="document-text-outline" size={22} color={KHATA.orange} />
    </View>
  );
}

export function PartyRow({
  name,
  balance,
  kind,
  updatedAt,
  onPress,
}: {
  name: string;
  balance: string;
  kind: 'customer' | 'supplier';
  updatedAt?: string;
  onPress: () => void;
}) {
  const n = Number(balance);
  const youGet = kind === 'customer' ? n > 0 : n < 0;
  const youGive = kind === 'customer' ? n < 0 : n > 0;
  const color = youGet ? KHATA.red : youGive ? KHATA.green : KHATA.muted;
  const label = youGet ? "You'll Get" : youGive ? "You'll Give" : 'Settled';
  const avatarBg = kind === 'supplier' ? '#E8F5E9' : '#FDECEA';
  const avatarColor = kind === 'supplier' ? KHATA.green : KHATA.red;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white px-4 py-3.5 active:bg-black/5"
    >
      <View
        className="mr-3 h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: avatarBg }}
      >
        <Text className="text-[15px] font-bold" style={{ color: avatarColor }}>
          {initials(name)}
        </Text>
      </View>
      <View className="flex-1 pr-3">
        <Text className="text-[16px] font-bold text-ink" numberOfLines={1}>
          {name}
        </Text>
        <Text className="mt-0.5 text-[12px] text-ink/45">{relativeActivity(updatedAt)}</Text>
      </View>
      <View className="items-end">
        <Text className="text-[16px] font-extrabold" style={{ color }}>
          {Math.abs(n) < 0.5 ? formatRs(0) : formatRs(Math.abs(n))}
        </Text>
        <Text className="mt-0.5 text-[12px] text-ink/45">{label}</Text>
      </View>
    </Pressable>
  );
}

export function PartyFab({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      className="absolute right-4 flex-row items-center rounded-full px-4 py-3 active:opacity-90"
      style={{
        bottom: Math.max(insets.bottom, 12) + 84,
        backgroundColor: color,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      }}
    >
      <Ionicons name="person-add" size={18} color="#fff" />
      <Text className="ml-2 text-[13px] font-extrabold tracking-wide text-white">{label}</Text>
    </Pressable>
  );
}
