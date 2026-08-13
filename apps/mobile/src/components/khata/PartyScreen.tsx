import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/auth-context';
import { createApi } from '../../lib/api';
import { Screen } from '../ui';
import { Field } from '../Field';
import { BigButton } from '../BigButton';
import { KHATA } from '../../theme';
import {
  PartyFab,
  PartyHeader,
  PartyRow,
  PartySearchBar,
  PartySummaryCard,
  type PartyTab,
} from './PartyChrome';

type Row = {
  id: string;
  name: string;
  balance: string;
  updatedAt: string;
  kind: 'customer' | 'supplier';
};

export function PartyScreen({ initialTab = 'customers' }: { initialTab?: PartyTab }) {
  const { token } = useAuth();
  const api = createApi(() => token);
  const qc = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<PartyTab>(initialTab);
  const [q, setQ] = useState('');
  const [hide, setHide] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const customers = useQuery({
    queryKey: ['customers', q],
    queryFn: () => api.customers.list(q || undefined),
  });
  const suppliers = useQuery({
    queryKey: ['suppliers', q],
    queryFn: () => api.suppliers.list(q || undefined),
  });

  const creatingSupplier = tab === 'suppliers';

  const create = useMutation({
    mutationFn: () =>
      creatingSupplier
        ? api.suppliers.create({ name: name.trim(), phone: phone.trim() || undefined })
        : api.customers.create({ name: name.trim(), phone: phone.trim() || undefined }),
    onSuccess: (party) => {
      qc.invalidateQueries({ queryKey: creatingSupplier ? ['suppliers'] : ['customers'] });
      setCreateOpen(false);
      setName('');
      setPhone('');
      router.push(creatingSupplier ? `/suppliers/${party.id}` : `/customers/${party.id}`);
    },
    onError: (err: Error) => Alert.alert('Could not create', err.message),
  });

  const customerItems = customers.data?.items ?? [];
  const supplierItems = suppliers.data?.items ?? [];

  const rows: Row[] = useMemo(() => {
    const c = customerItems.map((item) => ({
      id: item.id,
      name: item.name,
      balance: item.balance,
      updatedAt: item.updatedAt,
      kind: 'customer' as const,
    }));
    const s = supplierItems.map((item) => ({
      id: item.id,
      name: item.name,
      balance: item.balance,
      updatedAt: item.updatedAt,
      kind: 'supplier' as const,
    }));
    if (tab === 'customers') return c;
    if (tab === 'suppliers') return s;
    return [...c, ...s].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [customerItems, supplierItems, tab]);

  const youGet = customerItems
    .filter((c) => Number(c.balance) > 0)
    .reduce((sum, c) => sum + Number(c.balance), 0);
  const youGiveCustomers = customerItems
    .filter((c) => Number(c.balance) < 0)
    .reduce((sum, c) => sum + Math.abs(Number(c.balance)), 0);
  const youGiveSuppliers = supplierItems
    .filter((s) => Number(s.balance) > 0)
    .reduce((sum, s) => sum + Number(s.balance), 0);
  const purchaseTotal = supplierItems.reduce((sum, s) => sum + Math.abs(Number(s.balance)), 0);

  const summary =
    tab === 'suppliers'
      ? {
          leftValue: String(purchaseTotal),
          leftLabel: 'Total purchase',
          rightValue: String(youGiveSuppliers),
          rightLabel: "You'll Give",
          leftGreen: true,
          rightGreen: true,
        }
      : {
          leftValue: String(youGiveCustomers),
          leftLabel: 'You will give',
          rightValue: String(youGet),
          rightLabel: 'You will get',
          leftGreen: true,
          rightGreen: false,
        };

  const countLabel =
    tab === 'suppliers'
      ? `${supplierItems.length} Supplier${supplierItems.length === 1 ? '' : 's'}`
      : tab === 'all'
        ? `${rows.length} Parties`
        : `${customerItems.length} Customer${customerItems.length === 1 ? '' : 's'}`;

  const loading =
    tab === 'suppliers' ? suppliers.isLoading : tab === 'customers' ? customers.isLoading : customers.isLoading || suppliers.isLoading;

  return (
    <Screen className="bg-[#F4F4F4]">
      <PartyHeader
        tab={tab}
        onTab={setTab}
        onBack={() => router.push('/dashboard')}
      />
      <PartySummaryCard
        {...summary}
        hidden={hide}
        onToggle={() => setHide((v) => !v)}
      />
      <PartySearchBar value={q} onChange={setQ} countLabel={countLabel} />

      <FlatList
        data={rows}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        onRefresh={() => {
          customers.refetch();
          suppliers.refetch();
        }}
        refreshing={!!customers.isRefetching || !!suppliers.isRefetching}
        contentContainerStyle={{ paddingBottom: 140, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View className="h-px bg-black/5" />}
        ListEmptyComponent={
          <Text className="py-16 text-center text-[15px] text-ink/40">
            {loading ? 'Loading…' : 'No parties yet'}
          </Text>
        }
        renderItem={({ item }) => (
          <PartyRow
            name={item.name}
            balance={item.balance}
            kind={item.kind}
            updatedAt={item.updatedAt}
            onPress={() =>
              router.push(item.kind === 'supplier' ? `/suppliers/${item.id}` : `/customers/${item.id}`)
            }
          />
        )}
      />

      {tab !== 'all' ? (
        <PartyFab
          label={tab === 'suppliers' ? 'ADD SUPPLIER' : 'ADD CUSTOMER'}
          color={tab === 'suppliers' ? KHATA.green : KHATA.orange}
          onPress={() => setCreateOpen(true)}
        />
      ) : null}

      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="flex-1" onPress={() => setCreateOpen(false)} />
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
            <Text className="mb-4 text-[20px] font-bold text-ink">
              {creatingSupplier ? 'New supplier' : 'New customer'}
            </Text>
            <Field label="Name" value={name} onChangeText={setName} autoFocus />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <BigButton
              label={creatingSupplier ? 'Save supplier' : 'Save customer'}
              loading={create.isPending}
              disabled={!name.trim()}
              onPress={() => create.mutate()}
            />
            <BigButton label="Cancel" variant="secondary" className="mt-3" onPress={() => setCreateOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
