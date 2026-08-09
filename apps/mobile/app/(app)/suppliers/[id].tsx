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
  formatKhataDateTime,
  supplierEntryTitle,
  supplierGaveGot,
} from '../../../src/components/KhataLedger';
import { formatMoney } from '../../../src/lib/format';

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const api = createApi(() => token);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const supplier = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => api.suppliers.get(id),
    enabled: !!id,
  });

  const ledger = useQuery({
    queryKey: ['supplier-ledger', id],
    queryFn: () => api.ledger.supplier(id),
    enabled: !!id,
  });

  const entries = useMemo(() => ledger.data?.items ?? [], [ledger.data?.items]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((e) => {
      const title = supplierEntryTitle(e).toLowerCase();
      const desc = (e.description ?? '').toLowerCase();
      const ref = e.referenceNumber.toLowerCase();
      return title.includes(needle) || desc.includes(needle) || ref.includes(needle);
    });
  }, [entries, q]);

  const balance = Number(supplier.data?.balance ?? 0);
  // Positive supplier balance = you owe them (money out) → red
  const tone = !Number.isFinite(balance) || balance === 0 ? 'settled' : balance > 0 ? 'out' : 'in';
  const balanceLabel =
    tone === 'settled' ? 'Settled' : tone === 'out' ? 'You will give' : 'You will get';

  const printStatement = async () => {
    if (!supplier.data) return;
    const lines = [
      `Roznamcha — Supplier statement`,
      supplier.data.name,
      supplier.data.phone ? `Phone: ${supplier.data.phone}` : '',
      `Current balance: ${formatMoney(supplier.data.balance)} (${balanceLabel})`,
      '',
      ...entries.slice(0, 40).map((e) => {
        const { gave, got } = supplierGaveGot(e);
        const side = gave ? `Gave ${gave}` : `Got ${got}`;
        return `${formatKhataDateTime(e.transactionDate)} · ${supplierEntryTitle(e)} · ${side} · Bal ${e.balanceAfter}`;
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
        <AppHeader showBack fallbackHref="/suppliers" />

        {!supplier.data ? (
          <Text className="py-10 text-center text-body-lg text-ink/45">
            {supplier.isLoading ? 'Loading…' : 'Supplier not found'}
          </Text>
        ) : (
          <>
            <View className="rounded-3xl border border-[#E8E4DA] bg-white px-4 py-4">
              <Text className="text-[22px] font-bold leading-7 text-ink">{supplier.data.name}</Text>
              <View className="mt-2 flex-row items-center gap-2">
                <Ionicons name="call-outline" size={15} color="#6B7C74" />
                <Text className="text-body text-ink/60">
                  {supplier.data.phone?.trim() ? supplier.data.phone : 'No phone'}
                </Text>
              </View>
              <Pressable onPress={printStatement} className="mt-3 self-start" hitSlop={8}>
                <Text className="text-body font-semibold text-brand">Share statement</Text>
              </Pressable>
            </View>

            <BalanceHero
              amount={supplier.data.balance}
              tone={tone}
              label={balanceLabel}
            />

            <KhataSearch value={q} onChange={setQ} placeholder="Search entries…" />

            <View className="overflow-hidden rounded-2xl border border-[#E8E4DA]">
              <KhataColumnHeader />
              {filtered.map((entry) => {
                const { gave, got } = supplierGaveGot(entry);
                const lines = entry.detailLines ?? [];
                const title = supplierEntryTitle(entry);
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

      {supplier.data ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-ink/10 bg-[#FBF9F3]"
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
        >
          <KhataFooterActions
            gaveLabel="YOU GAVE"
            gotLabel="YOU GOT"
            onGave={() => router.push(`/payments?direction=PAY&supplierId=${id}`)}
            onGot={() => router.push(`/purchases/new?supplierId=${id}`)}
          />
        </View>
      ) : null}
    </Screen>
  );
}
