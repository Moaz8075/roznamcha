import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/auth-context';
import { createApi } from '../../../src/lib/api';
import { Screen } from '../../../src/components/ui';
import { AppHeader } from '../../../src/components/AppHeader';
import { formatMoney } from '../../../src/lib/format';

function formatGreetingDate(d = new Date()) {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

type StatTone = 'brand' | 'warn' | 'danger' | 'ink' | 'inverse' | 'success';

function StatCard({
  label,
  value,
  tone = 'ink',
  loading,
}: {
  label: string;
  value?: string;
  tone?: StatTone;
  loading?: boolean;
}) {
  const inverse = tone === 'inverse';
  const valueColor =
    tone === 'brand'
      ? 'text-brand'
      : tone === 'warn'
        ? 'text-warn'
        : tone === 'danger'
          ? 'text-danger'
          : tone === 'success'
            ? 'text-success'
            : tone === 'inverse'
              ? 'text-white'
              : 'text-ink';

  return (
    <View
      className={`min-h-[96px] flex-1 rounded-3xl border px-4 py-4 ${
        inverse ? 'border-brand bg-brand' : 'border-[#E8E4DA] bg-white'
      }`}
    >
      <Text
        className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${
          inverse ? 'text-white/75' : 'text-ink/45'
        }`}
      >
        {label}
      </Text>
      <Text className={`text-[22px] font-bold leading-7 ${valueColor}`}>
        {loading ? '…' : formatMoney(value)}
      </Text>
    </View>
  );
}

const ACTIONS = [
  {
    href: '/payments?direction=RECEIVE',
    label: 'Receive Payment',
    icon: 'cash' as const,
    color: '#067647',
    set: 'mci' as const,
  },
  {
    href: '/payments?direction=PAY',
    label: 'Pay Supplier',
    icon: 'cash-minus' as const,
    color: '#B42318',
    set: 'mci' as const,
  },
  {
    href: '/sales/new',
    label: 'New Sale',
    icon: 'cart-outline' as const,
    color: '#0B3D2E',
    set: 'ion' as const,
  },
  {
    href: '/purchases/new',
    label: 'New Purchase',
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
    href: '/reports',
    label: 'View Reports',
    icon: 'bar-chart-outline' as const,
    color: '#0B3D2E',
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
        contentContainerStyle={{ paddingTop: 4 }}
        contentContainerClassName="gap-5 px-5 pb-28"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#0B3D2E" />
        }
      >
        <AppHeader />

        <View className="mb-1">
          <Text className="text-[28px] font-bold leading-9 text-ink">Hello, {firstName}</Text>
          <Text className="mt-1 text-body text-ink/45">{formatGreetingDate()}</Text>
        </View>

        {isError ? (
          <Pressable
            onPress={() => refetch()}
            className="rounded-3xl border border-danger/20 bg-white px-4 py-5"
          >
            <Text className="text-body-lg font-bold text-danger">Could not load summary</Text>
            <Text className="mt-1 text-body text-ink/50">Tap to retry</Text>
          </Pressable>
        ) : (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <StatCard label="Cash in Hand" value={data?.cashBalance} tone="brand" loading={isLoading} />
              <StatCard
                label="Receivable"
                value={data?.customerOutstanding}
                tone="success"
                loading={isLoading}
              />
            </View>
            <View className="flex-row gap-3">
              <StatCard
                label="Payable"
                value={data?.supplierOutstanding}
                tone="danger"
                loading={isLoading}
              />
              <StatCard label="Today's Sales" value={data?.todaySales} loading={isLoading} />
            </View>
            <View className="flex-row gap-3">
              <StatCard label="Expenses" value={data?.todayExpenses} loading={isLoading} />
              <StatCard
                label="Today's Profit"
                value={data?.todayProfit}
                tone="inverse"
                loading={isLoading}
              />
            </View>
          </View>
        )}

        <Text className="mt-2 text-title text-ink">Quick Actions</Text>

        <View className="flex-row flex-wrap justify-between gap-y-3">
          {ACTIONS.map((action) => {
            const filled = action.href.includes('RECEIVE') || action.href.includes('PAY');
            return (
              <Link key={action.href} href={action.href as '/sales/new'} asChild>
                <Pressable
                  className="h-[112px] w-[48%] items-center justify-center rounded-3xl active:opacity-90"
                  style={{ backgroundColor: filled ? action.color : '#F0EBE0' }}
                >
                  {action.set === 'ion' ? (
                    <Ionicons
                      name={action.icon}
                      size={28}
                      color={filled ? '#fff' : action.color}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={action.icon}
                      size={28}
                      color={filled ? '#fff' : action.color}
                    />
                  )}
                  <Text
                    className={`mt-3 text-center text-[15px] font-semibold ${
                      filled ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
