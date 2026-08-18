import { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/auth/auth-context';
import { createApi } from '../../../src/lib/api';
import { Screen } from '../../../src/components/ui';
import { AppHeader } from '../../../src/components/AppHeader';
import { KhataColumnHeader, KhataEntryRow, formatKhataDateTime } from '../../../src/components/KhataLedger';
import { formatMoney } from '../../../src/lib/format';
import {
  dateInputToIso,
  formatDateInputLabel,
  shiftDateInput,
  toDateInputValue,
} from '../../../src/lib/dates';

const ENTRY_ACTIONS = [
  { href: '/payments?direction=RECEIVE', label: 'Receive', icon: 'arrow-down-circle-outline' as const },
  { href: '/payments?direction=PAY', label: 'Pay', icon: 'arrow-up-circle-outline' as const },
  { href: '/expenses', label: 'Expense', icon: 'receipt-outline' as const },
] as const;

function CompactStat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'in' | 'out' | 'closing';
}) {
  const color =
    tone === 'in'
      ? 'text-success'
      : tone === 'out'
        ? 'text-danger'
        : tone === 'closing'
          ? 'text-brand'
          : 'text-ink';

  return (
    <View className="min-w-0 flex-1 items-center px-0.5">
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-ink/45" numberOfLines={1}>
        {label}
      </Text>
      <Text className={`mt-0.5 text-[13px] font-bold ${color}`} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function RoznamchaScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(toDateInputValue());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['roznamcha', date],
    queryFn: () => api.cash.roznamcha(date),
  });

  const items = data?.items ?? [];

  const isToday = date === toDateInputValue();
  const dateObj = new Date(dateInputToIso(date));

  return (
    <Screen className="bg-[#FBF9F3]">
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{
          paddingTop: 4,
          paddingBottom: 120,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#0B3D2E" />
        }
        ListHeaderComponent={
          <View className="mb-2 gap-1.5">
            <AppHeader />

            <View className="flex-row items-end justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-[22px] font-bold text-ink">Roznamcha</Text>
                <Text className="text-[12px] text-ink/45">
                  {isToday ? 'Today' : formatDateInputLabel(date)}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Pressable
                  onPress={() => setDate(shiftDateInput(date, -1))}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white"
                  hitSlop={6}
                >
                  <Ionicons name="chevron-back" size={18} color="#0B3D2E" />
                </Pressable>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  className="h-9 flex-row items-center rounded-full bg-white px-3"
                >
                  <Ionicons name="calendar-outline" size={16} color="#0B3D2E" />
                  <Text className="ml-1.5 text-[12px] font-semibold text-ink">
                    {date.slice(5).replace('-', '/')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDate(shiftDateInput(date, 1))}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white"
                  hitSlop={6}
                >
                  <Ionicons name="chevron-forward" size={18} color="#0B3D2E" />
                </Pressable>
              </View>
            </View>

            {pickerOpen ? (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selected) => {
                  if (Platform.OS === 'android') setPickerOpen(false);
                  if (selected) setDate(toDateInputValue(selected));
                }}
              />
            ) : null}
            {Platform.OS === 'ios' && pickerOpen ? (
              <Pressable
                onPress={() => setPickerOpen(false)}
                className="items-center rounded-full bg-brand py-2"
              >
                <Text className="text-[13px] font-bold text-white">Done</Text>
              </Pressable>
            ) : null}

            <View className="flex-row items-center rounded-2xl border border-[#E8E4DA] bg-white px-2 py-2.5">
              <CompactStat
                label="Open"
                value={isLoading ? '…' : formatMoney(data?.openingCash)}
              />
              <View className="h-8 w-px bg-black/8" />
              <CompactStat
                label="In"
                value={isLoading ? '…' : `+${formatMoney(data?.cashReceived)}`}
                tone="in"
              />
              <View className="h-8 w-px bg-black/8" />
              <CompactStat
                label="Out"
                value={isLoading ? '…' : `-${formatMoney(data?.cashPaid)}`}
                tone="out"
              />
              <View className="h-8 w-px bg-black/8" />
              <CompactStat
                label="Close"
                value={isLoading ? '…' : formatMoney(data?.closingCash)}
                tone="closing"
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text className="py-10 text-center text-body text-ink/45">
            {isLoading ? 'Loading…' : 'No cash movements for this date'}
          </Text>
        }
        ListFooterComponent={
          items.length ? (
            <Text className="py-4 text-center text-[12px] text-ink/35">End of entries</Text>
          ) : null
        }
        renderItem={({ item, index }) => {
          const gave = item.direction === 'OUT' ? item.amount : null;
          const got = item.direction === 'IN' ? item.amount : null;
          const title = item.description?.trim() || item.type.replaceAll('_', ' ');
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          return (
            <View
              className={`overflow-hidden border-x border-b border-[#E8E4DA] bg-white ${
                isFirst ? 'rounded-t-2xl border-t' : ''
              } ${isLast ? 'rounded-b-2xl' : ''}`}
            >
              {isFirst ? <KhataColumnHeader /> : null}
              <KhataEntryRow
                title={title}
                subtitle={item.referenceNumber}
                balanceAfter={item.balanceAfter}
                gave={gave}
                got={got}
                dateLabel={formatKhataDateTime(item.transactionDate, item.createdAt)}
              />
            </View>
          );
        }}
      />

      <Pressable
        onPress={() => setAddOpen(true)}
        className="absolute right-4 flex-row items-center rounded-full bg-brand px-4 py-3 active:opacity-90"
        style={{
          bottom: Math.max(insets.bottom, 12) + 84,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text className="ml-1.5 text-[13px] font-extrabold tracking-wide text-white">ADD ENTRY</Text>
      </Pressable>

      <Modal visible={addOpen} animationType="slide" transparent onRequestClose={() => setAddOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setAddOpen(false)}>
          <Pressable
            className="rounded-t-3xl bg-white px-5 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-black/15" />
            <Text className="mb-3 text-[18px] font-bold text-ink">Add Roznamcha entry</Text>
            {ENTRY_ACTIONS.map((action) => (
              <Pressable
                key={action.href}
                onPress={() => {
                  setAddOpen(false);
                  router.push(action.href as '/sales/new');
                }}
                className="flex-row items-center border-b border-black/5 py-3.5 active:opacity-70"
              >
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#F4F4F4]">
                  <Ionicons name={action.icon} size={20} color="#0B3D2E" />
                </View>
                <Text className="text-[16px] font-semibold text-ink">{action.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9E9E9E" style={{ marginLeft: 'auto' }} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
