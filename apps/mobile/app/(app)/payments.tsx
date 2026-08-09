import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../src/auth/auth-context';
import { createApi } from '../../src/lib/api';
import { Screen } from '../../src/components/ui';
import {
  AmountField,
  DateField,
  OutlinedInput,
  SavePillButton,
  SelectSheet,
} from '../../src/components/form';
import { SuccessModal } from '../../src/components/SuccessModal';
import { dateInputToIso, toDateInputValue } from '../../src/lib/dates';
import { formatMoney } from '../../src/lib/format';

export default function PaymentsScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const qc = useQueryClient();
  const params = useLocalSearchParams<{
    direction?: string;
    customerId?: string;
    supplierId?: string;
  }>();

  const [direction, setDirection] = useState<'RECEIVE' | 'PAY'>('RECEIVE');
  const [partyId, setPartyId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(toDateInputValue());
  const [successOpen, setSuccessOpen] = useState(false);
  const [successAmount, setSuccessAmount] = useState('');
  const [successDirection, setSuccessDirection] = useState<'RECEIVE' | 'PAY'>('RECEIVE');
  useEffect(() => {
    const d = String(params.direction ?? '').toUpperCase();
    if (params.customerId) {
      setDirection('RECEIVE');
      setPartyId(String(params.customerId));
      return;
    }
    if (params.supplierId) {
      setDirection('PAY');
      setPartyId(String(params.supplierId));
      return;
    }
    if (d === 'PAY' || d === 'RECEIVE') {
      setDirection(d);
      setPartyId(null);
    }
  }, [params.direction, params.customerId, params.supplierId]);

  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
    enabled: direction === 'RECEIVE',
  });
  const suppliers = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.suppliers.list(),
    enabled: direction === 'PAY',
  });

  const parties =
    direction === 'RECEIVE' ? customers.data?.items ?? [] : suppliers.data?.items ?? [];
  const selectedParty = parties.find((p) => p.id === partyId);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!partyId || !amount) throw new Error('Select party and amount');
      if (Number(amount) <= 0) throw new Error('Enter a valid amount');
      return api.payments.create({
        direction,
        amount,
        transactionDate: dateInputToIso(date),
        notes: notes.trim() || undefined,
        ...(direction === 'RECEIVE'
          ? { customerId: partyId }
          : { supplierId: partyId }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
      qc.invalidateQueries({ queryKey: ['customer-ledger'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['supplier'] });
      qc.invalidateQueries({ queryKey: ['supplier-ledger'] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['roznamcha'] });
      setSuccessAmount(amount);
      setSuccessDirection(direction);
      setAmount('');
      setNotes('');
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
        <Text className="mb-1 text-[28px] font-bold text-ink">Payments</Text>
        <Text className="mb-4 text-body text-ink/50">
          Receive from customers or pay suppliers.
        </Text>

        <View className="mb-5 flex-row gap-3">
          <Pressable
            onPress={() => {
              setDirection('RECEIVE');
              setPartyId(null);
            }}
            className={`min-h-[52px] flex-1 flex-row items-center justify-center rounded-full ${
              direction === 'RECEIVE' ? 'bg-success' : 'bg-[#ECEAE3]'
            }`}
          >
            <Text
              className={`text-[14px] font-bold ${
                direction === 'RECEIVE' ? 'text-white' : 'text-ink/60'
              }`}
            >
              Receive Money
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setDirection('PAY');
              setPartyId(null);
            }}
            className={`min-h-[52px] flex-1 flex-row items-center justify-center rounded-full ${
              direction === 'PAY' ? 'bg-danger' : 'bg-[#ECEAE3]'
            }`}
          >
            <Text
              className={`text-[14px] font-bold ${
                direction === 'PAY' ? 'text-white' : 'text-ink/60'
              }`}
            >
              Pay Supplier
            </Text>
          </Pressable>
        </View>
        <DateField value={date} onChange={setDate} />

        <SelectSheet
          searchable
          searchPlaceholder={
            direction === 'RECEIVE' ? 'Search customers...' : 'Search suppliers...'
          }
          placeholder={direction === 'RECEIVE' ? 'Select Customer' : 'Select Supplier'}
          valueLabel={selectedParty?.name}
          options={parties.map((p) => ({
            id: p.id,
            label: p.name,
            subtitle: p.phone ?? undefined,
          }))}
          onSelect={setPartyId}
        />

        <AmountField value={amount} onChangeText={setAmount} />

        <OutlinedInput
          label="Details / Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. bank transfer, cash against invoice…"
          multiline
          style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: 14 }}
        />

        <SavePillButton
          label="Save Payment"
          loading={mutation.isPending}
          disabled={!partyId || !amount || Number(amount) <= 0}
          onPress={() => mutation.mutate()}
        />
      </ScrollView>

      <SuccessModal
        visible={successOpen}
        title="Payment saved"
        message={`${successDirection === 'RECEIVE' ? 'Received' : 'Paid'} ${formatMoney(successAmount)} successfully.`}
        onDone={() => setSuccessOpen(false)}
      />
    </Screen>
  );
}
