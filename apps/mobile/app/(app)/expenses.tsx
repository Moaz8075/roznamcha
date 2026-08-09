import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BUSINESS_EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_TYPES,
  PERSONAL_EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '@roznamcha/constants';
import { useAuth } from '../../src/auth/auth-context';
import { createApi } from '../../src/lib/api';
import { Screen } from '../../src/components/ui';
import { AppHeader } from '../../src/components/AppHeader';
import {
  AmountField,
  DateField,
  OutlinedInput,
  SavePillButton,
  SegmentedTwo,
  SelectSheet,
} from '../../src/components/form';
import { SuccessModal } from '../../src/components/SuccessModal';
import { dateInputToIso, toDateInputValue } from '../../src/lib/dates';
import { formatMoney } from '../../src/lib/format';

export default function ExpensesScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const qc = useQueryClient();
  const [expenseType, setExpenseType] = useState<'BUSINESS' | 'PERSONAL'>('BUSINESS');
  const [category, setCategory] = useState<ExpenseCategory>(BUSINESS_EXPENSE_CATEGORIES.OTHER);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(toDateInputValue());
  const [successOpen, setSuccessOpen] = useState(false);
  const [successAmount, setSuccessAmount] = useState('');

  const categoryOptions = useMemo(() => {
    const source =
      expenseType === 'BUSINESS' ? BUSINESS_EXPENSE_CATEGORIES : PERSONAL_EXPENSE_CATEGORIES;
    return Object.values(source).map((id) => ({
      id,
      label: EXPENSE_CATEGORY_LABELS[id],
    }));
  }, [expenseType]);

  const mutation = useMutation({
    mutationFn: () =>
      api.expenses.create({
        expenseType,
        category,
        amount,
        transactionDate: dateInputToIso(date),
        notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      qc.invalidateQueries({ queryKey: ['roznamcha'] });
      setSuccessAmount(amount);
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
        <AppHeader showBack fallbackHref="/dashboard" />
        <Text className="mb-4 text-[28px] font-bold text-ink">Add Expense</Text>

        <DateField value={date} onChange={setDate} />

        <SegmentedTwo
          value={expenseType}
          onChange={(k) => {
            const next = k as 'BUSINESS' | 'PERSONAL';
            setExpenseType(next);
            setCategory(
              next === 'BUSINESS'
                ? BUSINESS_EXPENSE_CATEGORIES.OTHER
                : PERSONAL_EXPENSE_CATEGORIES.PERSONAL,
            );
          }}
          left={{
            key: EXPENSE_TYPES.BUSINESS,
            label: 'Business Expense',
            icon: 'business-outline',
          }}
          right={{
            key: EXPENSE_TYPES.PERSONAL,
            label: 'Personal Expense',
            icon: 'person-outline',
          }}
        />

        <AmountField value={amount} onChangeText={setAmount} />

        <SelectSheet
          placeholder="Select category"
          valueLabel={EXPENSE_CATEGORY_LABELS[category]}
          options={categoryOptions}
          onSelect={(id) => setCategory(id as ExpenseCategory)}
        />

        <OutlinedInput
          label="Details / Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add details..."
          multiline
          style={{ minHeight: 110, textAlignVertical: 'top', paddingTop: 14 }}
        />

        <SavePillButton
          label="Save Expense"
          loading={mutation.isPending}
          disabled={!amount || Number(amount) <= 0}
          onPress={() => mutation.mutate()}
        />
      </ScrollView>

      <SuccessModal
        visible={successOpen}
        title="Expense saved"
        message={`Expense of ${formatMoney(successAmount)} recorded.`}
        onDone={() => setSuccessOpen(false)}
      />
    </Screen>
  );
}
