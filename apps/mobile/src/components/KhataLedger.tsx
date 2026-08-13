import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LedgerEntryDto } from '@roznamcha/types';
import { formatMoney, formatTime } from '../lib/format';

const GAVE = '#E53935';
const GOT = '#2E7D32';

export function formatKhataDateTime(value: string, createdAt?: string) {
  const dateSource = new Date(value);
  const timeSource = createdAt ? new Date(createdAt) : dateSource;
  const date = dateSource.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
  const time = formatTime(timeSource.toISOString());
  return `${date} · ${time}`;
}

export function customerEntryTitle(entry: LedgerEntryDto) {
  const lines = entry.detailLines ?? [];
  if (lines.length) return lines.join(', ');
  if (entry.description?.trim()) return entry.description.trim();
  if (entry.entryType === 'SALE') return 'Sale';
  if (entry.entryType === 'PAYMENT') return 'Payment received';
  return entry.entryType.replaceAll('_', ' ');
}

export function supplierEntryTitle(entry: LedgerEntryDto) {
  const lines = entry.detailLines ?? [];
  if (lines.length) return lines.join(', ');
  if (entry.description?.trim()) return entry.description.trim();
  if (entry.entryType === 'PURCHASE') return 'Purchase';
  if (entry.entryType === 'PAYMENT') return 'Payment made';
  return entry.entryType.replaceAll('_', ' ');
}

/** Customer: debit (sale) = You Gave; credit (payment) = You Got */
export function customerGaveGot(entry: LedgerEntryDto) {
  const debit = Number(entry.debit);
  const credit = Number(entry.credit);
  return {
    gave: debit > 0 ? entry.debit : null,
    got: credit > 0 ? entry.credit : null,
  };
}

/** Supplier: debit (purchase/got stock) = You Got; credit (payment) = You Gave */
export function supplierGaveGot(entry: LedgerEntryDto) {
  const debit = Number(entry.debit);
  const credit = Number(entry.credit);
  return {
    gave: credit > 0 ? entry.credit : null,
    got: debit > 0 ? entry.debit : null,
  };
}

export function BalanceHero({
  amount,
  tone,
  label,
}: {
  amount: string;
  tone: 'in' | 'out' | 'settled';
  label: string;
}) {
  const color = tone === 'in' ? GAVE : tone === 'out' ? GOT : '#212121';
  return (
    <View
      className="mx-4 items-center rounded-2xl bg-white px-4 py-3.5"
      style={{
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Text className="text-[26px] font-extrabold" style={{ color }}>
        Rs {formatMoney(Math.abs(Number(amount) || 0))}
      </Text>
      <Text className="mt-0.5 text-[13px] text-ink/55">{label}</Text>
    </View>
  );
}

export function KhataColumnHeader({
  gaveLabel = 'You Gave',
  gotLabel = 'You Got',
  variant = 'customer',
}: {
  gaveLabel?: string;
  gotLabel?: string;
  variant?: 'customer' | 'supplier';
}) {
  if (variant === 'supplier') {
    return (
      <View className="flex-row border-b border-black/5 bg-white px-3 py-2.5">
        <Text className="flex-1 text-[13px] font-bold text-ink/45">Entries</Text>
        <Text className="w-[88px] text-center text-[13px] font-bold" style={{ color: GOT }}>
          Purchase
        </Text>
        <Text className="w-[88px] text-center text-[13px] font-bold" style={{ color: GAVE }}>
          Payment
        </Text>
      </View>
    );
  }
  return (
    <View className="flex-row border-b border-black/5 bg-white px-3 py-2.5">
      <Text className="flex-1 text-[13px] font-bold text-ink/45">Entries</Text>
      <Text className="w-[88px] text-center text-[13px] font-bold" style={{ color: GAVE }}>
        {gaveLabel}
      </Text>
      <Text className="w-[88px] text-center text-[13px] font-bold" style={{ color: GOT }}>
        {gotLabel}
      </Text>
    </View>
  );
}

export function KhataSearch({
  value,
  onChange,
  placeholder = 'Search',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View className="mb-3 flex-row items-center rounded-full bg-[#F0F0F0] px-4">
      <Ionicons name="search" size={18} color="#6B7C74" />
      <TextInput
        className="min-h-[44px] flex-1 px-3 text-body text-ink"
        placeholder={placeholder}
        placeholderTextColor="#8A968F"
        value={value}
        onChangeText={onChange}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

export function KhataEntryRow({
  title,
  subtitle,
  itemCount,
  balanceAfter,
  gave,
  got,
  showDate = true,
  dateLabel,
  variant = 'customer',
}: {
  title: string;
  subtitle?: string | null;
  itemCount?: number;
  balanceAfter: string;
  gave: string | null;
  got: string | null;
  showDate?: boolean;
  dateLabel?: string;
  variant?: 'customer' | 'supplier';
}) {
  const mid = variant === 'supplier' ? got : gave;
  const right = variant === 'supplier' ? gave : got;
  const midColor = variant === 'supplier' ? GOT : GAVE;
  const rightColor = variant === 'supplier' ? GAVE : GOT;
  const midBg = variant === 'supplier' ? '#EDF8F1' : '#FDF2F0';
  const rightBg = variant === 'supplier' ? '#FDF2F0' : '#EDF8F1';

  return (
    <View className="border-b border-ink/10 bg-white">
      {showDate && dateLabel ? (
        <Text className="px-3 pt-3 text-[12px] font-semibold text-ink/45">{dateLabel}</Text>
      ) : null}
      <View className="flex-row items-stretch px-3 py-3">
        <View className="flex-1 pr-2">
          <Text className="text-[15px] font-bold leading-5 text-ink" numberOfLines={3}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-[12px] text-ink/45" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          {itemCount && itemCount > 0 ? (
            <View className="mt-1.5 self-start rounded-full bg-[#ECEAE3] px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-ink/60">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </Text>
            </View>
          ) : null}
          <View className="mt-1.5 self-start rounded-full bg-[#DCEFE6] px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-success">
              Bal. {formatMoney(balanceAfter)}
            </Text>
          </View>
        </View>

        <View className="w-[88px] items-center justify-center" style={{ backgroundColor: mid ? midBg : 'transparent' }}>
          <Text className="text-[16px] font-bold" style={{ color: midColor }}>
            {mid ? formatMoney(mid) : ''}
          </Text>
        </View>

        <View className="w-[88px] items-center justify-center" style={{ backgroundColor: right ? rightBg : 'transparent' }}>
          <Text className="text-[16px] font-bold" style={{ color: rightColor }}>
            {right ? formatMoney(right) : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function KhataFooterActions({
  onGave,
  onGot,
  gaveLabel = 'YOU GAVE',
  gotLabel = 'YOU GOT',
  gaveColor = GAVE,
  gotColor = GOT,
}: {
  onGave: () => void;
  onGot: () => void;
  gaveLabel?: string;
  gotLabel?: string;
  gaveColor?: string;
  gotColor?: string;
}) {
  return (
    <View className="flex-row gap-3 px-3 pb-2 pt-3">
      <Pressable
        onPress={onGave}
        className="min-h-[52px] flex-1 items-center justify-center rounded-full active:opacity-90"
        style={{ backgroundColor: gaveColor }}
      >
        <Text className="text-[15px] font-extrabold text-white">{gaveLabel}</Text>
      </Pressable>
      <Pressable
        onPress={onGot}
        className="min-h-[52px] flex-1 items-center justify-center rounded-full active:opacity-90"
        style={{ backgroundColor: gotColor }}
      >
        <Text className="text-[15px] font-extrabold text-white">{gotLabel}</Text>
      </Pressable>
    </View>
  );
}
