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
  formatKhataDateTime,
  supplierEntryTitle,
  supplierGaveGot,
} from '../../../src/components/KhataLedger';
import { KhataDetailHeader, QuickActions } from '../../../src/components/khata/KhataDetailHeader';
import { formatRs } from '../../../src/lib/format';
import {
  dateInputToIso,
  formatDateInputLabel,
  isoToDateInput,
  toDateInputValue,
} from '../../../src/lib/dates';

export default function SupplierDetailScreen() {
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
    return entries.filter((e) => {
      if (filterDate && isoToDateInput(e.transactionDate) !== filterDate) return false;
      if (!needle) return true;
      const title = supplierEntryTitle(e).toLowerCase();
      const desc = (e.description ?? '').toLowerCase();
      return title.includes(needle) || desc.includes(needle) || e.referenceNumber.toLowerCase().includes(needle);
    });
  }, [entries, q, filterDate]);

  const balance = Number(supplier.data?.balance ?? 0);
  const tone = !Number.isFinite(balance) || balance === 0 ? 'settled' : balance > 0 ? 'out' : 'in';
  const balanceLabel =
    tone === 'settled' ? 'Settled' : tone === 'out' ? "You'll Give" : "I'll Get";

  const openEdit = () => {
    if (!supplier.data) return;
    setName(supplier.data.name);
    setPhone(supplier.data.phone ?? '');
    setEditOpen(true);
  };

  const update = useMutation({
    mutationFn: () =>
      api.suppliers.update(id, { name: name.trim(), phone: phone.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier', id] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setEditOpen(false);
      setSuccessMsg('Supplier updated.');
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not update', err.message),
  });

  const remove = useMutation({
    mutationFn: () => api.suppliers.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      router.replace('/suppliers');
    },
    onError: (err: Error) => Alert.alert('Could not delete', err.message),
  });

  const printStatement = async () => {
    if (!supplier.data) return;
    const lines = [
      `AB & Sons — Supplier statement`,
      supplier.data.name,
      `Current balance: ${formatRs(supplier.data.balance)} (${balanceLabel})`,
      '',
      ...filtered.slice(0, 40).map((e) => {
        const { gave, got } = supplierGaveGot(e);
        const side = gave ? `Paid ${gave}` : `Purchase ${got}`;
        return `${formatKhataDateTime(e.transactionDate, e.createdAt)} · ${supplierEntryTitle(e)} · ${side}`;
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
      {supplier.data ? (
        <KhataDetailHeader
          name={supplier.data.name}
          kind="supplier"
          phone={supplier.data.phone}
          balanceAmount={supplier.data.balance}
          balanceTone={tone}
          balanceLabel={balanceLabel}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/suppliers'))}
          onSettings={openEdit}
          onMenu={() =>
            Alert.alert(supplier.data?.name ?? 'Supplier', undefined, [
              { text: 'Edit', onPress: openEdit },
              { text: 'Share statement', onPress: printStatement },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                  Alert.alert('Delete supplier', `Remove “${supplier.data?.name}”?`, [
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
        {!supplier.data ? (
          <Text className="py-10 text-center text-body-lg text-ink/45">
            {supplier.isLoading ? 'Loading…' : 'Supplier not found'}
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
              <KhataColumnHeader variant="supplier" />
              {filtered.map((entry) => {
                const { gave, got } = supplierGaveGot(entry);
                const lines = entry.detailLines ?? [];
                const title = supplierEntryTitle(entry);
                const notes = entry.description?.trim() || null;
                return (
                  <KhataEntryRow
                    key={entry.id}
                    variant="supplier"
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

      {supplier.data ? (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white"
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
        >
          <KhataFooterActions
            gaveLabel="PURCHASE Rs"
            gotLabel="PAYMENT Rs"
            gaveColor="#2E7D32"
            gotColor="#E53935"
            onGave={() =>
              router.push(
                `/entry?kind=purchase&supplierId=${id}&name=${encodeURIComponent(supplier.data?.name ?? '')}`,
              )
            }
            onGot={() =>
              router.push(
                `/entry?kind=pay&supplierId=${id}&name=${encodeURIComponent(supplier.data?.name ?? '')}`,
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
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end bg-black/40">
          <Pressable className="flex-1" onPress={() => setEditOpen(false)} />
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
            <Text className="mb-4 text-[20px] font-bold text-ink">Edit supplier</Text>
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
