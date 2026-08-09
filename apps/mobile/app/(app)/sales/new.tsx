import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PAYMENT_METHODS } from '@roznamcha/constants';
import { useAuth } from '../../../src/auth/auth-context';
import { createApi } from '../../../src/lib/api';
import { Screen } from '../../../src/components/ui';
import {
  DateField,
  OutlinedInput,
  SavePillButton,
  SegmentedTwo,
  SelectSheet,
} from '../../../src/components/form';
import { SuccessModal } from '../../../src/components/SuccessModal';
import { formatMoney } from '../../../src/lib/format';
import { dateInputToIso, toDateInputValue } from '../../../src/lib/dates';

export default function NewSaleScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const qc = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ customerId?: string }>();

  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });
  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });

  const [customerId, setCustomerId] = useState<string | null>(params.customerId ?? null);
  const [productId, setProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [rate, setRate] = useState('');
  const [total, setTotal] = useState('');
  const [mode, setMode] = useState<'CASH' | 'CREDIT'>('CASH');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(toDateInputValue());
  const [successOpen, setSuccessOpen] = useState(false);
  const [savedSaleId, setSavedSaleId] = useState<string | null>(null);
  const selectedProduct = products.data?.items.find((p) => p.id === productId);
  const selectedCustomer = customers.data?.items.find((c) => c.id === customerId);

  const syncFromQtyRate = (qStr: string, rStr: string) => {
    const q = Number(qStr);
    const r = Number(rStr);
    if (Number.isFinite(q) && Number.isFinite(r) && q > 0) {
      setTotal((q * r).toFixed(2));
    }
  };

  const syncFromQtyTotal = (qStr: string, tStr: string) => {
    const q = Number(qStr);
    const t = Number(tStr);
    if (Number.isFinite(q) && Number.isFinite(t) && q > 0) {
      setRate((t / q).toFixed(4));
    }
  };

  const totalNumber = useMemo(() => {
    const t = Number(total);
    return Number.isFinite(t) ? t : 0;
  }, [total]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!customerId || !productId) throw new Error('Select customer and product');
      const q = Number(quantity);
      const r = Number(rate);
      const t = Number(total);
      if (!Number.isFinite(q) || q <= 0) throw new Error('Enter a valid quantity');
      if (!Number.isFinite(r) || r <= 0) throw new Error('Enter per-piece amount');
      if (!Number.isFinite(t) || t <= 0) throw new Error('Enter total amount');

      const lineTotal = t.toFixed(4);
      const unitPrice = r.toFixed(4);
      return api.sales.create({
        customerId,
        transactionDate: dateInputToIso(date),
        paymentMethod: PAYMENT_METHODS.CASH,
        paidAmount: mode === 'CASH' ? lineTotal : '0',
        creditAmount: mode === 'CREDIT' ? lineTotal : '0',
        description: notes.trim() || undefined,
        items: [{ productId, quantity: String(q), unitPrice }],
      });
    },
    onSuccess: (sale) => {
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
      qc.invalidateQueries({ queryKey: ['customer-ledger'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['roznamcha'] });
      setSavedSaleId(sale.id);
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not save', err.message),
  });

  return (
    <Screen className="bg-[#FBF9F3]">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-1 px-5 pb-10 pt-2"
      >
        <DateField value={date} onChange={setDate} />

        <SelectSheet
          searchable
          searchPlaceholder="Search customers..."
          placeholder="Select Customer"
          valueLabel={selectedCustomer?.name}
          options={(customers.data?.items ?? []).map((c) => ({
            id: c.id,
            label: c.name,
            subtitle: c.phone ?? undefined,
          }))}
          onSelect={setCustomerId}
        />

        <SelectSheet
          searchable
          searchPlaceholder="Search products..."
          placeholder="Select Product (Wood Type)"
          valueLabel={selectedProduct?.name ?? null}
          options={(products.data?.items ?? []).map((p) => ({
            id: p.id,
            label: p.name,
            subtitle: p.unit,
          }))}
          onSelect={setProductId}
        />

        <View className="mb-2 flex-row gap-3">
          <View className="flex-1">
            <OutlinedInput
              label={`Quantity${selectedProduct ? ` (${selectedProduct.unit})` : ''}`}
              value={quantity}
              onChangeText={(v) => {
                setQuantity(v);
                if (rate) syncFromQtyRate(v, rate);
                else if (total) syncFromQtyTotal(v, total);
              }}
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <OutlinedInput
              label="Per piece"
              value={rate}
              onChangeText={(v) => {
                setRate(v);
                syncFromQtyRate(quantity, v);
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
        </View>

        <OutlinedInput
          label="Total Amount"
          value={total}
          onChangeText={(v) => {
            setTotal(v);
            syncFromQtyTotal(quantity, v);
          }}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <View className="mb-5 items-end rounded-3xl bg-[#ECEAE3] px-5 py-4">
          <Text className="text-[12px] font-semibold uppercase tracking-wide text-ink/45">
            Line total
          </Text>
          <Text className="mt-1 text-[26px] font-bold text-brand">{formatMoney(totalNumber)}</Text>
        </View>

        <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ink/45">
          Payment Type
        </Text>
        <SegmentedTwo
          value={mode}
          onChange={(k) => setMode(k as 'CASH' | 'CREDIT')}
          left={{ key: 'CASH', label: 'Cash' }}
          right={{ key: 'CREDIT', label: 'Credit / Invoice' }}
        />

        <OutlinedInput
          label="Details / Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: 14 }}
        />

        <SavePillButton
          label="Save Sale"
          loading={mutation.isPending}
          disabled={!customerId || !productId || totalNumber <= 0}
          onPress={() => mutation.mutate()}
        />
      </ScrollView>

      <SuccessModal
        visible={successOpen}
        title="Sale saved"
        message={`${mode === 'CASH' ? 'Cash' : 'Credit'} sale of ${formatMoney(totalNumber)} recorded.`}
        doneLabel="View invoice"
        onDone={() => {
          setSuccessOpen(false);
          if (savedSaleId) router.replace(`/sales/${savedSaleId}`);
          else router.back();
        }}
      />
    </Screen>
  );
}
