import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/auth/auth-context';
import { createApi } from '../../../src/lib/api';
import { Screen } from '../../../src/components/ui';
import { AppHeader } from '../../../src/components/AppHeader';
import {
  BalanceHero,
  KhataColumnHeader,
  KhataEntryRow,
  KhataFooterActions,
  KhataSearch,
  customerEntryTitle,
  customerGaveGot,
  formatKhataDateTime,
} from '../../../src/components/KhataLedger';
import { formatMoney } from '../../../src/lib/format';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const api = createApi(() => token);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const customer = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.customers.get(id),
    enabled: !!id,
  });

  const ledger = useQuery({
    queryKey: ['customer-ledger', id],
    queryFn: () => api.ledger.customer(id),
    enabled: !!id,
  });

  const entries = useMemo(() => ledger.data?.items ?? [], [ledger.data?.items]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((e) => {
      const title = customerEntryTitle(e).toLowerCase();
      const desc = (e.description ?? '').toLowerCase();
      const ref = e.referenceNumber.toLowerCase();
      return title.includes(needle) || desc.includes(needle) || ref.includes(needle);
    });
  }, [entries, q]);

  const balance = Number(customer.data?.balance ?? 0);
  const tone = !Number.isFinite(balance) || balance === 0 ? 'settled' : balance > 0 ? 'in' : 'out';
  const balanceLabel =
    tone === 'settled' ? 'Settled' : tone === 'in' ? 'You will get' : 'You will give';

  const printStatement = async () => {
    if (!customer.data) return;
    const lines = [
      `Roznamcha — Customer statement`,
      customer.data.name,
      customer.data.phone ? `Phone: ${customer.data.phone}` : '',
      `Current balance: ${formatMoney(customer.data.balance)} (${balanceLabel})`,
      '',
      ...entries.slice(0, 40).map((e) => {
        const { gave, got } = customerGaveGot(e);
        const side = gave ? `Gave ${gave}` : `Got ${got}`;
        return `${formatKhataDateTime(e.transactionDate)} · ${customerEntryTitle(e)} · ${side} · Bal ${e.balanceAfter}`;
      }),
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({ message: lines });
    } catch {
      Alert.alert('Could not share', 'Unable to open the share sheet.');
    }
  };

  return (
    <Screen className="bg-[#FBF9F3]">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 88,
          paddingHorizontal: 16,
          gap: 12,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader showBack fallbackHref="/customers" />

        {!customer.data ? (
          <Text className="py-10 text-center text-body-lg text-ink/45">
            {customer.isLoading ? 'Loading…' : 'Customer not found'}
          </Text>
        ) : (
          <>
            <View className="rounded-3xl border border-[#E8E4DA] bg-white px-4 py-4">
              <Text className="text-[22px] font-bold leading-7 text-ink">{customer.data.name}</Text>
              <View className="mt-2 flex-row items-center gap-2">
                <Ionicons name="call-outline" size={15} color="#6B7C74" />
                <Text className="text-body text-ink/60">
                  {customer.data.phone?.trim() ? customer.data.phone : 'No phone'}
                </Text>
              </View>
              <Pressable onPress={printStatement} className="mt-3 self-start" hitSlop={8}>
                <Text className="text-body font-semibold text-brand">Share statement</Text>
              </Pressable>
            </View>

            <BalanceHero
              amount={customer.data.balance}
              tone={tone}
              label={balanceLabel}
            />

            <KhataSearch value={q} onChange={setQ} placeholder="Search entries…" />

            <View className="overflow-hidden rounded-2xl border border-[#E8E4DA]">
              <KhataColumnHeader />
              {filtered.map((entry) => {
                const { gave, got } = customerGaveGot(entry);
                const lines = entry.detailLines ?? [];
                const title = customerEntryTitle(entry);
                const notes = entry.description?.trim() || null;
                const subtitle =
                  lines.length && notes
                    ? notes
                    : notes && notes !== title
                      ? notes
                      : entry.referenceNumber;

                return (
                  <KhataEntryRow
                    key={entry.id}
                    title={title}
                    subtitle={subtitle}
                    itemCount={entry.itemCount ?? lines.length}
                    balanceAfter={entry.balanceAfter}
                    gave={gave}
                    got={got}
                    dateLabel={formatKhataDateTime(entry.transactionDate)}
                  />
                );
              })}
              {!filtered.length ? (
                <Text className="py-8 text-center text-body text-ink/45">
                  {entries.length ? 'No matching entries' : 'No transactions yet'}
                </Text>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>

      {customer.data ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-ink/10 bg-[#FBF9F3]"
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
        >
          <KhataFooterActions
            gaveLabel="YOU GAVE"
            gotLabel="YOU GOT"
            onGave={() => router.push(`/sales/new?customerId=${id}`)}
            onGot={() => router.push(`/payments?direction=RECEIVE&customerId=${id}`)}
          />
        </View>
      ) : null}
    </Screen>
  );
}
