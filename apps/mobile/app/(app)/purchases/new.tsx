import { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
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

export default function NewPurchaseScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const qc = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ supplierId?: string }>();

  const suppliers = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.suppliers.list(),
  });
  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });

  const [supplierId, setSupplierId] = useState<string | null>(params.supplierId ?? null);
  const [productId, setProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [rate, setRate] = useState('');
  const [total, setTotal] = useState('');
  const [mode, setMode] = useState<'CASH' | 'CREDIT'>('CASH');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(toDateInputValue());
  const [successOpen, setSuccessOpen] = useState(false);
  const selectedProduct = products.data?.items.find((p) => p.id === productId);
  const selectedSupplier = suppliers.data?.items.find((s) => s.id === supplierId);

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
      if (!supplierId || !productId) throw new Error('Select supplier and product');
      const q = Number(quantity);
      const r = Number(rate);
      const t = Number(total);
      if (!Number.isFinite(q) || q <= 0) throw new Error('Enter a valid quantity');
      if (!Number.isFinite(r) || r <= 0) throw new Error('Enter per-piece amount');
      if (!Number.isFinite(t) || t <= 0) throw new Error('Enter total amount');

      const lineTotal = t.toFixed(4);
      const unitPrice = r.toFixed(4);
      return api.purchases.create({
        supplierId,
        transactionDate: dateInputToIso(date),
        paymentMethod: PAYMENT_METHODS.CASH,
        paidAmount: mode === 'CASH' ? lineTotal : '0',
        creditAmount: mode === 'CREDIT' ? lineTotal : '0',
        description: notes.trim() || undefined,
        items: [{ productId, quantity: String(q), unitPrice }],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      qc.invalidateQueries({ queryKey: ['supplier'] });
      qc.invalidateQueries({ queryKey: ['supplier-ledger'] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['roznamcha'] });
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not save', err.message),
  });

  return (
    <Screen className="bg-[#FBF9F3]">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pb-8 pt-1"
      >
        <DateField compact value={date} onChange={setDate} />

        <SelectSheet
          compact
          searchable
          searchPlaceholder="Search suppliers..."
          placeholder="Select Supplier"
          valueLabel={selectedSupplier?.name}
          options={(suppliers.data?.items ?? []).map((s) => ({
            id: s.id,
            label: s.name,
            subtitle: s.phone ?? undefined,
          }))}
          onSelect={setSupplierId}
        />

        <SelectSheet
          compact
          searchable
          searchPlaceholder="Search products..."
          placeholder="Select Product"
          valueLabel={selectedProduct?.name ?? null}
          options={(products.data?.items ?? []).map((p) => ({
            id: p.id,
            label: p.name,
            subtitle: p.unit,
          }))}
          onSelect={setProductId}
        />

        <View className="flex-row gap-2">
          <View className="flex-1">
            <OutlinedInput
              compact
              label={selectedProduct ? `Qty (${selectedProduct.unit})` : 'Qty'}
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
              compact
              label="Rate"
              value={rate}
              onChangeText={(v) => {
                setRate(v);
                syncFromQtyRate(quantity, v);
              }}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
          <View className="flex-[1.2]">
            <OutlinedInput
              compact
              label="Total"
              value={total}
              onChangeText={(v) => {
                setTotal(v);
                syncFromQtyTotal(quantity, v);
              }}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
        </View>

        <SegmentedTwo
          compact
          value={mode}
          onChange={(k) => setMode(k as 'CASH' | 'CREDIT')}
          left={{ key: 'CASH', label: 'Cash' }}
          right={{ key: 'CREDIT', label: 'Credit' }}
        />

        <OutlinedInput
          compact
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{ minHeight: 56, textAlignVertical: 'top', paddingTop: 10 }}
        />

        <SavePillButton
          label="Save Purchase"
          loading={mutation.isPending}
          disabled={!supplierId || !productId || totalNumber <= 0}
          onPress={() => mutation.mutate()}
        />
      </ScrollView>

      <SuccessModal
        visible={successOpen}
        title="Purchase saved"
        message={`${mode === 'CASH' ? 'Cash' : 'Credit'} purchase of ${formatMoney(totalNumber)} recorded.`}
        onDone={() => {
          setSuccessOpen(false);
          router.back();
        }}
      />
    </Screen>
  );
}
