import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PAYMENT_METHODS, PAYMENT_DIRECTIONS } from '@roznamcha/constants';
import { useAuth } from '../../src/auth/auth-context';
import { createApi } from '../../src/lib/api';
import { Screen } from '../../src/components/ui';
import { Field } from '../../src/components/Field';
import { AmountFieldRow, AmountPad } from '../../src/components/khata/AmountPad';
import { SuccessModal } from '../../src/components/SuccessModal';
import { SelectSheet } from '../../src/components/form';
import { nowIso } from '../../src/lib/dates';
import { formatMoney, formatRs } from '../../src/lib/format';
import { KHATA } from '../../src/theme';

type Kind = 'sale' | 'purchase' | 'receive' | 'pay';

export default function EntryScreen() {
  const params = useLocalSearchParams<{
    kind?: string;
    customerId?: string;
    supplierId?: string;
    name?: string;
  }>();
  const kind = (String(params.kind ?? 'receive') as Kind);
  const { token } = useAuth();
  const api = createApi(() => token);
  const qc = useQueryClient();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [itemsOpen, setItemsOpen] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [rate, setRate] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
    enabled: kind === 'sale' || kind === 'purchase',
  });

  const headerColor = kind === 'pay' || kind === 'sale' ? KHATA.red : KHATA.green;
  const partyName = params.name ? decodeURIComponent(String(params.name)) : '';
  const amountNum = Number(amount) || 0;

  const title = useMemo(() => {
    const rs = `Rs ${formatMoney(amountNum)}`;
    if (kind === 'sale') return `You Gave ${rs} to ${partyName || 'customer'}`;
    if (kind === 'receive') return `You Got ${rs} from ${partyName || 'customer'}`;
    if (kind === 'purchase') return `Purchase of ${rs} from ${partyName || 'supplier'}`;
    return `Payment of ${rs} to ${partyName || 'supplier'}`;
  }, [kind, amountNum, partyName]);

  const selectedProduct = products.data?.items.find((p) => p.id === productId);

  const applyItems = () => {
    const q = Number(quantity);
    const r = Number(rate);
    if (!productId) {
      Alert.alert('Select product', 'Pick a wood type first.');
      return;
    }
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(r) || r <= 0) {
      Alert.alert('Invalid item', 'Enter quantity and rate.');
      return;
    }
    setAmount(String(Math.round(q * r)));
    setItemsOpen(false);
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
    qc.invalidateQueries({ queryKey: ['customer'] });
    qc.invalidateQueries({ queryKey: ['customer-ledger'] });
    qc.invalidateQueries({ queryKey: ['customers'] });
    qc.invalidateQueries({ queryKey: ['supplier'] });
    qc.invalidateQueries({ queryKey: ['supplier-ledger'] });
    qc.invalidateQueries({ queryKey: ['suppliers'] });
    qc.invalidateQueries({ queryKey: ['roznamcha'] });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (amountNum <= 0) throw new Error('Enter an amount');
      const total = String(amountNum);
      const date = nowIso();

      if (kind === 'receive') {
        if (!params.customerId) throw new Error('Customer missing');
        return api.payments.create({
          direction: PAYMENT_DIRECTIONS.RECEIVE,
          customerId: String(params.customerId),
          amount: total,
          transactionDate: date,
          notes: notes.trim() || undefined,
        });
      }
      if (kind === 'pay') {
        if (!params.supplierId) throw new Error('Supplier missing');
        return api.payments.create({
          direction: PAYMENT_DIRECTIONS.PAY,
          supplierId: String(params.supplierId),
          amount: total,
          transactionDate: date,
          notes: notes.trim() || undefined,
        });
      }

      let pid = productId;
      let qty = quantity;
      let unitPrice = rate;
      if (!pid) {
        const first = products.data?.items[0];
        if (!first) throw new Error('Add a product first from Party → Products');
        pid = first.id;
        qty = '1';
        unitPrice = total;
      } else if (!Number(qty) || !Number(unitPrice)) {
        qty = '1';
        unitPrice = total;
      }

      if (kind === 'sale') {
        if (!params.customerId) throw new Error('Customer missing');
        return api.sales.create({
          customerId: String(params.customerId),
          transactionDate: date,
          paymentMethod: PAYMENT_METHODS.CASH,
          paidAmount: '0',
          creditAmount: total,
          description: notes.trim() || undefined,
          items: [{ productId: pid, quantity: String(qty), unitPrice: String(unitPrice) }],
        });
      }

      if (!params.supplierId) throw new Error('Supplier missing');
      return api.purchases.create({
        supplierId: String(params.supplierId),
        transactionDate: date,
        paymentMethod: PAYMENT_METHODS.CASH,
        paidAmount: '0',
        creditAmount: total,
        description: notes.trim() || undefined,
        items: [{ productId: pid, quantity: String(qty), unitPrice: String(unitPrice) }],
      });
    },
    onSuccess: () => {
      invalidate();
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not save', err.message),
  });

  return (
    <Screen className="bg-[#F4F4F4]">
      <StatusBar style="light" />
      <View style={{ backgroundColor: headerColor, paddingTop: Math.max(insets.top, 8) }}>
        <View className="flex-row items-center px-2 pb-4 pt-1">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/customers'))}
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text className="flex-1 pr-3 text-[16px] font-bold text-white" numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>

      <View className="-mt-3 mx-4 rounded-2xl bg-white px-4 py-4" style={{ elevation: 3 }}>
        <AmountFieldRow
          value={amount}
          color={headerColor}
          onBackspace={() => setAmount((v) => v.slice(0, -1))}
        />
        {(kind === 'sale' || kind === 'purchase') ? (
          <Pressable
            onPress={() => setItemsOpen(true)}
            className="mb-3 flex-row items-center justify-between rounded-xl border border-black/10 px-4 py-3.5"
          >
            <Text className="text-[15px] font-semibold" style={{ color: headerColor }}>
              {selectedProduct ? `${selectedProduct.name} · ${quantity}` : 'Add Items'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={headerColor} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending || amountNum <= 0}
          className="min-h-[52px] items-center justify-center rounded-xl active:opacity-90"
          style={{ backgroundColor: headerColor, opacity: amountNum <= 0 ? 0.5 : 1 }}
        >
          <Text className="text-[16px] font-extrabold text-white">
            {mutation.isPending ? 'Saving…' : 'SAVE'}
          </Text>
        </Pressable>
      </View>

      <View className="mt-4 px-4 pb-6">
        <AmountPad value={amount} onChange={setAmount} />
      </View>

      <Modal visible={itemsOpen} animationType="slide" transparent onRequestClose={() => setItemsOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setItemsOpen(false)} />
        <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
          <Text className="mb-3 text-[20px] font-bold text-ink">Add Items</Text>
          <SelectSheet
            searchable
            searchPlaceholder="Search products..."
            placeholder="Select Product"
            valueLabel={selectedProduct?.name}
            options={(products.data?.items ?? []).map((p) => ({
              id: p.id,
              label: p.name,
              subtitle: p.unit,
            }))}
            onSelect={setProductId}
          />
          <Field label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
          <Field label="Rate" value={rate} onChangeText={setRate} keyboardType="number-pad" />
          <Pressable
            onPress={applyItems}
            className="min-h-[48px] items-center justify-center rounded-xl"
            style={{ backgroundColor: headerColor }}
          >
            <Text className="font-bold text-white">Done</Text>
          </Pressable>
        </View>
      </Modal>

      <SuccessModal
        visible={successOpen}
        title="Saved"
        message={`${formatRs(amountNum)} recorded.`}
        onDone={() => {
          setSuccessOpen(false);
          router.back();
        }}
      />
    </Screen>
  );
}
