import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
import { formatMoney, formatRs } from '../../src/lib/format';
import { formatKhataDateTime } from '../../src/components/KhataLedger';

type Tab = 'ALL' | 'BUSINESS' | 'PERSONAL';

export default function ExpensesScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<'BUSINESS' | 'PERSONAL'>('BUSINESS');
  const [category, setCategory] = useState<ExpenseCategory>(BUSINESS_EXPENSE_CATEGORIES.OTHER);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(toDateInputValue());
  const [successOpen, setSuccessOpen] = useState(false);
  const [successAmount, setSuccessAmount] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.expenses.list(),
  });

  const totalsByTab = useMemo(() => {
    const all = data?.items ?? [];
    const sum = (type?: Tab) =>
      all
        .filter((e) => type === 'ALL' || !type || e.expenseType === type)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return {
      ALL: sum('ALL'),
      BUSINESS: sum('BUSINESS'),
      PERSONAL: sum('PERSONAL'),
    };
  }, [data?.items]);

  const items = useMemo(() => {
    const all = data?.items ?? [];
    if (tab === 'ALL') return all;
    return all.filter((e) => e.expenseType === tab);
  }, [data?.items, tab]);

  const totalAmount = totalsByTab[tab];

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
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      qc.invalidateQueries({ queryKey: ['roznamcha'] });
      setSuccessAmount(amount);
      setAmount('');
      setNotes('');
      setAddOpen(false);
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not save', err.message),
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'BUSINESS', label: 'Business' },
    { id: 'PERSONAL', label: 'Personal' },
  ];

  return (
    <Screen className="bg-[#FBF9F3]">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#0B3D2E" />
        }
        ListHeaderComponent={
          <View className="mb-3 gap-3 pt-1">
            <AppHeader showBack fallbackHref="/dashboard" />
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-[26px] font-bold text-ink">Expenses</Text>
                <Text className="mt-0.5 text-[13px] text-ink/45">
                  {items.length} {items.length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            </View>

            <View className="rounded-2xl border border-danger/20 bg-[#FDECEA] px-4 py-3.5">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-danger">
                {tab === 'ALL' ? 'Total expenses' : tab === 'BUSINESS' ? 'Business total' : 'Personal total'}
              </Text>
              <Text className="mt-1 text-[28px] font-extrabold text-danger">
                {isLoading ? '…' : formatRs(totalAmount)}
              </Text>
            </View>

            <View className="flex-row rounded-full bg-[#ECEAE3] p-1">
              {tabs.map((t) => {
                const active = tab === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setTab(t.id)}
                    className={`min-h-[48px] flex-1 items-center justify-center rounded-full px-1 ${
                      active ? 'bg-brand' : ''
                    }`}
                  >
                    <Text className={`text-[12px] font-semibold ${active ? 'text-white' : 'text-ink/65'}`}>
                      {t.label}
                    </Text>
                    <Text className={`text-[11px] font-bold ${active ? 'text-white' : 'text-danger'}`}>
                      {formatMoney(totalsByTab[t.id])}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text className="py-16 text-center text-body text-ink/45">
            {isLoading ? 'Loading…' : 'No expenses yet. Tap Add Expense.'}
          </Text>
        }
        ItemSeparatorComponent={() => <View className="h-2" />}
        renderItem={({ item }) => {
          const label = EXPENSE_CATEGORY_LABELS[item.category as ExpenseCategory] ?? item.category;
          const typeLabel = item.expenseType === 'BUSINESS' ? 'Business' : 'Personal';
          return (
            <View className="rounded-2xl border border-[#E8E4DA] bg-white px-4 py-3.5">
              <View className="flex-row items-start justify-between">
                <View className="mr-3 flex-1">
                  <Text className="text-[15px] font-bold text-ink">{label}</Text>
                  <Text className="mt-0.5 text-[12px] text-ink/45">
                    {formatKhataDateTime(item.transactionDate, item.createdAt)}
                  </Text>
                  {item.notes ? (
                    <Text className="mt-1 text-[13px] text-ink/60" numberOfLines={2}>
                      {item.notes}
                    </Text>
                  ) : null}
                  <View className="mt-2 self-start rounded-full bg-brand/10 px-2 py-0.5">
                    <Text className="text-[11px] font-semibold text-brand">{typeLabel}</Text>
                  </View>
                </View>
                <Text className="text-[16px] font-extrabold text-danger">
                  −{formatMoney(item.amount)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <Pressable
        onPress={() => setAddOpen(true)}
        className="absolute right-4 flex-row items-center rounded-full bg-brand px-4 py-3 active:opacity-90"
        style={{
          bottom: Math.max(insets.bottom, 12) + 16,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text className="ml-1.5 text-[13px] font-extrabold tracking-wide text-white">ADD EXPENSE</Text>
      </Pressable>

      <Modal visible={addOpen} animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <Screen className="bg-[#FBF9F3]">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-1 px-5 pb-10 pt-2"
          >
            <View className="mb-2 flex-row items-center justify-between pt-2">
              <Text className="text-[24px] font-bold text-ink">Add Expense</Text>
              <Pressable onPress={() => setAddOpen(false)} hitSlop={8} className="p-2">
                <Ionicons name="close" size={24} color="#12211B" />
              </Pressable>
            </View>

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
        </Screen>
      </Modal>

      <SuccessModal
        visible={successOpen}
        title="Expense saved"
        message={`Expense of ${formatMoney(successAmount)} recorded.`}
        onDone={() => setSuccessOpen(false)}
      />
    </Screen>
  );
}
