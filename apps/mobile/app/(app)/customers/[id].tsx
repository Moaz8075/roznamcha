import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/auth-context';
import { createApi } from '../../../src/lib/api';
import { Screen } from '../../../src/components/ui';
import { Field } from '../../../src/components/Field';
import { BigButton } from '../../../src/components/BigButton';
import { SuccessModal } from '../../../src/components/SuccessModal';
import {
  KhataColumnHeader,
  KhataEntryRow,
  KhataFooterActions,
  KhataSearch,
  customerEntryTitle,
  customerGaveGot,
  formatKhataDateTime,
} from '../../../src/components/KhataLedger';
import { KhataDetailHeader, QuickActions } from '../../../src/components/khata/KhataDetailHeader';
import { formatRs } from '../../../src/lib/format';
import {
  dateInputToIso,
  formatDateInputLabel,
  isoToDateInput,
  toDateInputValue,
} from '../../../src/lib/dates';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const api = createApi(() => token);
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
    return entries.filter((e) => {
      if (filterDate && isoToDateInput(e.transactionDate) !== filterDate) return false;
      if (!needle) return true;
      const title = customerEntryTitle(e).toLowerCase();
      const desc = (e.description ?? '').toLowerCase();
      return title.includes(needle) || desc.includes(needle) || e.referenceNumber.toLowerCase().includes(needle);
    });
  }, [entries, q, filterDate]);

  const balance = Number(customer.data?.balance ?? 0);
  const tone = !Number.isFinite(balance) || balance === 0 ? 'settled' : balance > 0 ? 'in' : 'out';
  const balanceLabel =
    tone === 'settled' ? 'Settled' : tone === 'in' ? 'You will get' : 'You will give';

  const openEdit = () => {
    if (!customer.data) return;
    setName(customer.data.name);
    setPhone(customer.data.phone ?? '');
    setEditOpen(true);
  };

  const update = useMutation({
    mutationFn: () =>
      api.customers.update(id, { name: name.trim(), phone: phone.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      setEditOpen(false);
      setSuccessMsg('Customer updated.');
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not update', err.message),
  });

  const remove = useMutation({
    mutationFn: () => api.customers.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      router.replace('/customers');
    },
    onError: (err: Error) => Alert.alert('Could not delete', err.message),
  });

  const printStatement = async () => {
    if (!customer.data) return;
    const lines = [
      `AB & Sons — Customer statement`,
      customer.data.name,
      `Current balance: ${formatRs(customer.data.balance)} (${balanceLabel})`,
      '',
      ...filtered.slice(0, 40).map((e) => {
        const { gave, got } = customerGaveGot(e);
        const side = gave ? `Gave ${gave}` : `Got ${got}`;
        return `${formatKhataDateTime(e.transactionDate, e.createdAt)} · ${customerEntryTitle(e)} · ${side}`;
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

  const pickerValue = new Date(dateInputToIso(filterDate ?? toDateInputValue()));

  return (
    <Screen className="bg-[#F4F4F4]">
      {customer.data ? (
        <KhataDetailHeader
          name={customer.data.name}
          kind="customer"
          phone={customer.data.phone}
          balanceAmount={customer.data.balance}
          balanceTone={tone}
          balanceLabel={balanceLabel}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/customers'))}
          onSettings={openEdit}
          onMenu={() =>
            Alert.alert(customer.data?.name ?? 'Customer', undefined, [
              { text: 'Edit', onPress: openEdit },
              { text: 'Share statement', onPress: printStatement },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                  Alert.alert('Delete customer', `Remove “${customer.data?.name}”?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
                  ]),
              },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
        />
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 88 }}
        keyboardShouldPersistTaps="handled"
      >
        {!customer.data ? (
          <Text className="py-10 text-center text-body-lg text-ink/45">
            {customer.isLoading ? 'Loading…' : 'Customer not found'}
          </Text>
        ) : (
          <>
            <QuickActions
              actions={[
                { icon: 'document-text-outline', label: 'Report', onPress: printStatement },
                {
                  icon: 'calendar-outline',
                  label: filterDate ? 'Date ✓' : 'Set Date',
                  onPress: () => setDatePickerOpen(true),
                },
              ]}
            />
            {filterDate ? (
              <View className="mb-2 flex-row items-center justify-between px-4">
                <Text className="text-[12px] font-semibold text-ink/55">
                  Showing {formatDateInputLabel(filterDate)}
                </Text>
                <Pressable
                  onPress={() => setFilterDate(null)}
                  className="flex-row items-center rounded-full bg-white px-3 py-1.5"
                >
                  <Ionicons name="close-circle" size={14} color="#757575" />
                  <Text className="ml-1 text-[12px] font-semibold text-ink/60">Clear date</Text>
                </Pressable>
              </View>
            ) : null}
            <View className="px-4">
              <KhataSearch value={q} onChange={setQ} />
            </View>
            <View className="overflow-hidden bg-white">
              <KhataColumnHeader />
              {filtered.map((entry) => {
                const { gave, got } = customerGaveGot(entry);
                const lines = entry.detailLines ?? [];
                const title = customerEntryTitle(entry);
                const notes = entry.description?.trim() || null;
                return (
                  <KhataEntryRow
                    key={entry.id}
                    title={title}
                    subtitle={notes && notes !== title ? notes : entry.referenceNumber}
                    itemCount={entry.itemCount ?? lines.length}
                    balanceAfter={entry.balanceAfter}
                    gave={gave}
                    got={got}
                    dateLabel={formatKhataDateTime(entry.transactionDate, entry.createdAt)}
                  />
                );
              })}
              {!filtered.length ? (
                <Text className="py-8 text-center text-body text-ink/45">
                  {entries.length
                    ? filterDate
                      ? 'No entries on this date'
                      : 'No matching entries'
                    : 'No transactions yet'}
                </Text>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>

      {customer.data ? (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white"
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
        >
          <KhataFooterActions
            gaveLabel="YOU GAVE Rs"
            gotLabel="YOU GOT Rs"
            onGave={() =>
              router.push(
                `/entry?kind=sale&customerId=${id}&name=${encodeURIComponent(customer.data?.name ?? '')}`,
              )
            }
            onGot={() =>
              router.push(
                `/entry?kind=receive&customerId=${id}&name=${encodeURIComponent(customer.data?.name ?? '')}`,
              )
            }
          />
        </View>
      ) : null}

      {datePickerOpen && Platform.OS === 'android' ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          onChange={(_, selected) => {
            setDatePickerOpen(false);
            if (selected) setFilterDate(toDateInputValue(selected));
          }}
        />
      ) : null}
      {Platform.OS === 'ios' && datePickerOpen ? (
        <Modal transparent animationType="fade" visible onRequestClose={() => setDatePickerOpen(false)}>
          <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setDatePickerOpen(false)}>
            <View className="rounded-t-3xl bg-white px-5 pb-8 pt-4">
              <Text className="mb-2 text-[16px] font-bold text-ink">Filter by date</Text>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="spinner"
                onChange={(_, selected) => {
                  if (selected) setFilterDate(toDateInputValue(selected));
                }}
              />
              <BigButton label="Apply" onPress={() => setDatePickerOpen(false)} />
              <BigButton
                label="Clear filter"
                variant="secondary"
                className="mt-2"
                onPress={() => {
                  setFilterDate(null);
                  setDatePickerOpen(false);
                }}
              />
            </View>
          </Pressable>
        </Modal>
      ) : null}

      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="flex-1" onPress={() => setEditOpen(false)} />
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
            <Text className="mb-4 text-[20px] font-bold text-ink">Edit customer</Text>
            <Field label="Name" value={name} onChangeText={setName} autoFocus />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <BigButton
              label="Save changes"
              loading={update.isPending}
              disabled={!name.trim()}
              onPress={() => update.mutate()}
            />
            <BigButton label="Cancel" variant="secondary" className="mt-3" onPress={() => setEditOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SuccessModal visible={successOpen} title="Saved" message={successMsg} onDone={() => setSuccessOpen(false)} />
    </Screen>
  );
}
