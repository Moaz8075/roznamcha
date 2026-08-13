import { useMemo, useState } from 'react';
import {
  FlatList,
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

type CashFilter = 'all' | 'expenses';

export default function RoznamchaScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const router = useRouter();
  const [date, setDate] = useState(toDateInputValue());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cashFilter, setCashFilter] = useState<CashFilter>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['roznamcha', date],
    queryFn: () => api.cash.roznamcha(date),
  });

  const items = useMemo(() => {
    const all = data?.items ?? [];
    if (cashFilter !== 'expenses') return all;
    return all.filter(
      (i) => i.type === 'EXPENSE_BUSINESS' || i.type === 'EXPENSE_PERSONAL' || !!i.expenseId,
    );
  }, [data?.items, cashFilter]);

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
          <View className="mb-2 gap-2">
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
                  onPress={() => router.push('/expenses')}
                  className="mr-1 h-9 flex-row items-center rounded-full bg-white px-3"
                  hitSlop={6}
                >
                  <Ionicons name="receipt-outline" size={15} color="#0B3D2E" />
                  <Text className="ml-1 text-[12px] font-semibold text-ink">Expenses</Text>
                </Pressable>
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

            <View className="flex-row gap-2">
              {(
                [
                  { id: 'all' as const, label: 'All cash' },
                  { id: 'expenses' as const, label: 'Expenses only' },
                ] as const
              ).map((f) => {
                const active = cashFilter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setCashFilter(f.id)}
                    className={`rounded-full px-3 py-1.5 ${active ? 'bg-brand' : 'bg-white'}`}
                  >
                    <Text className={`text-[12px] font-semibold ${active ? 'text-white' : 'text-ink/60'}`}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mt-1 text-[13px] font-bold text-ink/55">
              {cashFilter === 'expenses' ? 'Expenses' : 'Cash movements'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="py-10 text-center text-body text-ink/45">
            {isLoading
              ? 'Loading…'
              : cashFilter === 'expenses'
                ? 'No expenses for this date'
                : 'No cash movements for this date'}
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
    </Screen>
  );
}
