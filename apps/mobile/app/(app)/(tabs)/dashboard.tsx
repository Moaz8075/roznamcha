import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/auth-context';
import { createApi } from '../../../src/lib/api';
import { Screen } from '../../../src/components/ui';
import { AppHeader } from '../../../src/components/AppHeader';
import { formatMoney, formatRs } from '../../../src/lib/format';

function formatGreetingDate(d = new Date()) {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function MiniStat({
  label,
  value,
  tone = 'ink',
  loading,
}: {
  label: string;
  value?: string;
  tone?: 'brand' | 'success' | 'danger' | 'ink' | 'inverse';
  loading?: boolean;
}) {
  const inverse = tone === 'inverse';
  const valueColor =
    tone === 'brand'
      ? 'text-brand'
      : tone === 'success'
        ? 'text-success'
        : tone === 'danger'
          ? 'text-danger'
          : inverse
            ? 'text-white'
            : 'text-ink';

  return (
    <View
      className={`min-w-0 flex-1 rounded-2xl border px-2.5 py-2.5 ${
        inverse ? 'border-brand bg-brand' : 'border-[#E8E4DA] bg-white'
      }`}
    >
      <Text
        className={`text-[10px] font-semibold uppercase tracking-wide ${
          inverse ? 'text-white/75' : 'text-ink/45'
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text className={`mt-1 text-[15px] font-bold ${valueColor}`} numberOfLines={1}>
        {loading ? '…' : formatMoney(value)}
      </Text>
    </View>
  );
}

const ACTIONS = [
  {
    href: '/payments?direction=RECEIVE',
    label: 'Receive',
    icon: 'cash' as const,
    color: '#067647',
    set: 'mci' as const,
  },
  {
    href: '/payments?direction=PAY',
    label: 'Pay',
    icon: 'cash-minus' as const,
    color: '#B42318',
    set: 'mci' as const,
  },
  {
    href: '/sales/new',
    label: 'Sale',
    icon: 'cart-outline' as const,
    color: '#0B3D2E',
    set: 'ion' as const,
  },
  {
    href: '/purchases/new',
    label: 'Purchase',
    icon: 'truck-delivery-outline' as const,
    color: '#0B3D2E',
    set: 'mci' as const,
  },
  {
    href: '/expenses',
    label: 'Expense',
    icon: 'receipt-outline' as const,
    color: '#3D4A44',
    set: 'ion' as const,
  },
  {
    href: '/customers',
    label: 'Party',
    icon: 'people-outline' as const,
    color: '#0B3D2E',
    set: 'ion' as const,
  },
  {
    href: '/products',
    label: 'Products',
    icon: 'cube-outline' as const,
    color: '#3D4A44',
    set: 'ion' as const,
  },
] as const;

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const api = createApi(() => token);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.dashboard.summary(),
  });

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <Screen className="bg-[#FBF9F3]">
      <ScrollView
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 120, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#0B3D2E" />
        }
      >
        <AppHeader />

        <View className="mb-3 flex-row items-end justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-[22px] font-bold text-ink">Hello, {firstName}</Text>
            <Text className="mt-0.5 text-[13px] text-ink/45">{formatGreetingDate()}</Text>
          </View>
        </View>

        {isError ? (
          <Pressable
            onPress={() => refetch()}
            className="mb-3 rounded-2xl border border-danger/20 bg-white px-4 py-4"
          >
            <Text className="text-[15px] font-bold text-danger">Could not load summary</Text>
            <Text className="mt-1 text-[13px] text-ink/50">Tap to retry</Text>
          </Pressable>
        ) : (
          <View className="mb-4 gap-2">
            <View className="rounded-2xl border border-brand bg-brand px-4 py-3.5">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-white/75">
                Cash in hand
              </Text>
              <Text className="mt-1 text-[26px] font-extrabold text-white">
                {isLoading ? '…' : formatRs(data?.cashBalance)}
              </Text>
            </View>

            <View className="flex-row gap-2">
              <MiniStat
                label="Receivable"
                value={data?.customerOutstanding}
                tone="success"
                loading={isLoading}
              />
              <MiniStat
                label="Payable"
                value={data?.supplierOutstanding}
                tone="danger"
                loading={isLoading}
              />
            </View>

            <View className="rounded-2xl border border-[#E8E4DA] bg-white px-3.5 py-3">
              <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/45">
                Profit = sales − purchases − expenses
              </Text>
              <View className="flex-row gap-2">
                <MiniStat label="Sales" value={data?.totalSales} tone="success" loading={isLoading} />
                <MiniStat label="Purchases" value={data?.totalPurchases} tone="danger" loading={isLoading} />
                <MiniStat label="Expenses" value={data?.totalExpenses} tone="danger" loading={isLoading} />
              </View>
              <View className="mt-2 flex-row items-center justify-between rounded-xl bg-brand px-3 py-2.5">
                <Text className="text-[12px] font-semibold text-white/80">Overall profit</Text>
                <Text className="text-[18px] font-extrabold text-white">
                  {isLoading ? '…' : formatRs(data?.netProfit)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text className="mb-2 text-[15px] font-bold text-ink">Quick actions</Text>
        <View className="gap-2.5">
          {[ACTIONS.slice(0, 4), ACTIONS.slice(4)].map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row gap-2">
              {row.map((action) => {
                const filled = action.href.includes('RECEIVE') || action.href.includes('PAY');
                return (
                  <Link key={action.href} href={action.href as '/sales/new'} asChild>
                    <Pressable
                      className="min-h-[78px] flex-1 items-center justify-center rounded-2xl px-1 py-2.5 active:opacity-90"
                      style={{
                        backgroundColor: filled ? action.color : '#FFFFFF',
                        borderWidth: filled ? 0 : 1,
                        borderColor: '#E8E4DA',
                      }}
                    >
                      {action.set === 'ion' ? (
                        <Ionicons name={action.icon} size={22} color={filled ? '#fff' : action.color} />
                      ) : (
                        <MaterialCommunityIcons
                          name={action.icon}
                          size={22}
                          color={filled ? '#fff' : action.color}
                        />
                      )}
                      <Text
                        className={`mt-1.5 text-center text-[11px] font-semibold ${
                          filled ? 'text-white' : 'text-ink'
                        }`}
                        numberOfLines={1}
                      >
                        {action.label}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
