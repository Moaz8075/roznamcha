import type { ReactNode } from 'react';
import { useState } from 'react';
import { FlatList, Text, View, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/auth-context';
import { createApi } from '../../../src/lib/api';
import { Screen } from '../../../src/components/ui';
import { AppHeader } from '../../../src/components/AppHeader';
import { DateField } from '../../../src/components/form';
import { KhataColumnHeader, KhataEntryRow, formatKhataDateTime } from '../../../src/components/KhataLedger';
import { formatMoney } from '../../../src/lib/format';
import { formatDateInputLabel, toDateInputValue } from '../../../src/lib/dates';

function SummaryCard({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: 'default' | 'in' | 'out' | 'closing';
}) {
  const closing = tone === 'closing';
  const labelColor =
    tone === 'in' ? 'text-success' : tone === 'out' ? 'text-danger' : closing ? 'text-white/80' : 'text-ink';
  const valueColor =
    tone === 'in' ? 'text-success' : tone === 'out' ? 'text-danger' : closing ? 'text-white' : 'text-ink';

  return (
    <View
      className={`min-h-[108px] w-[48%] rounded-3xl border px-4 py-4 ${
        closing ? 'border-brand bg-brand' : 'border-[#E8E4DA] bg-white'
      }`}
    >
      <View className="mb-3">{icon}</View>
      <Text className={`text-[13px] font-semibold ${labelColor}`}>{label}</Text>
      <Text className={`mt-1 text-[20px] font-bold ${valueColor}`}>{value}</Text>
    </View>
  );
}

export default function RoznamchaScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const [date, setDate] = useState(toDateInputValue());

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['roznamcha', date],
    queryFn: () => api.cash.roznamcha(date),
  });

  const items = data?.items ?? [];
  const isToday = date === toDateInputValue();

  return (
    <Screen className="bg-[#FBF9F3]">
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{
          paddingTop: 4,
          paddingBottom: 120,
          paddingHorizontal: 16,
          gap: 0,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#0B3D2E" />
        }
        ListHeaderComponent={
          <View className="mb-3 gap-4">
            <AppHeader />

            <View>
              <Text className="text-[28px] font-bold text-ink">Roznamcha</Text>
              <Text className="mt-1 text-body text-ink/45">
                Daily Cash Register · {isToday ? 'Today' : formatDateInputLabel(date)}
              </Text>
            </View>

            <DateField label="View date" value={date} onChange={setDate} />

            <View className="flex-row flex-wrap justify-between gap-y-3">
              <SummaryCard
                label="Opening Cash"
                value={isLoading ? '…' : formatMoney(data?.openingCash)}
                icon={<MaterialCommunityIcons name="notebook-outline" size={22} color="#12211B" />}
              />
              <SummaryCard
                label="Cash Received"
                value={isLoading ? '…' : `+${formatMoney(data?.cashReceived)}`}
                tone="in"
                icon={<Ionicons name="arrow-down" size={22} color="#067647" />}
              />
              <SummaryCard
                label="Cash Paid"
                value={isLoading ? '…' : `-${formatMoney(data?.cashPaid)}`}
                tone="out"
                icon={<Ionicons name="arrow-up" size={22} color="#B42318" />}
              />
              <SummaryCard
                label="Closing Cash"
                value={isLoading ? '…' : formatMoney(data?.closingCash)}
                tone="closing"
                icon={<MaterialCommunityIcons name="piggy-bank-outline" size={22} color="#fff" />}
              />
            </View>

            <Text className="mt-1 text-title text-ink">Cash movements</Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="py-10 text-center text-body-lg text-ink/45">
            {isLoading ? 'Loading…' : 'No cash movements for this date'}
          </Text>
        }
        ListFooterComponent={
          items.length ? (
            <Text className="py-6 text-center text-body text-ink/35">End of entries for this date.</Text>
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
                dateLabel={formatKhataDateTime(item.transactionDate)}
              />
            </View>
          );
        }}
      />
    </Screen>
  );
}
