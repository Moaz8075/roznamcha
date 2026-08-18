import type { ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  dateInputToIso,
  formatDateInputLabel,
  shiftDateInput,
  toDateInputValue,
} from '../lib/dates';

export function FormLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ink/45">
      {children}
    </Text>
  );
}

export function SelectSheet({
  label,
  placeholder,
  valueLabel,
  options,
  onSelect,
  searchable = false,
  searchPlaceholder = 'Search…',
  compact = false,
}: {
  label?: string;
  placeholder: string;
  valueLabel?: string | null;
  options: { id: string; label: string; subtitle?: string }[];
  onSelect: (id: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.subtitle?.toLowerCase().includes(term) ?? false),
    );
  }, [options, q]);

  return (
    <View className={compact ? 'mb-2' : 'mb-4'}>
      {label ? <FormLabel>{label}</FormLabel> : null}
      <Pressable
        onPress={() => {
          setQ('');
          setOpen(true);
        }}
        className={`${compact ? 'min-h-[44px]' : 'min-h-[56px]'} flex-row items-center justify-between rounded-2xl border border-ink/15 bg-white px-4`}
      >
        <Text className={`flex-1 ${compact ? 'text-[15px]' : 'text-body-lg'} ${valueLabel ? 'text-ink' : 'text-ink/40'}`}>
          {valueLabel ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6B7C74" />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
        <View className="max-h-[75%] rounded-t-3xl bg-[#FBF9F3] px-5 pb-8 pt-4">
          <Text className="mb-3 text-title text-ink">{placeholder}</Text>
          {searchable ? (
            <View className="mb-3 flex-row items-center rounded-full border border-ink/20 px-4">
              <Ionicons name="search" size={18} color="#6B7C74" />
              <TextInput
                className="min-h-[44px] flex-1 px-3 text-body-lg text-ink"
                placeholder={searchPlaceholder}
                placeholderTextColor="#8A968F"
                value={q}
                onChangeText={setQ}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled">
            {filtered.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => {
                  onSelect(opt.id);
                  setOpen(false);
                }}
                className="min-h-[56px] justify-center border-b border-ink/10 py-3"
              >
                <Text className="text-body-lg font-semibold text-ink">{opt.label}</Text>
                {opt.subtitle ? (
                  <Text className="mt-0.5 text-body text-ink/45">{opt.subtitle}</Text>
                ) : null}
              </Pressable>
            ))}
            {!filtered.length ? (
              <Text className="py-8 text-center text-body text-ink/45">No matches</Text>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export function DateField({
  label = 'Date',
  value,
  onChange,
  compact = false,
}: {
  label?: string;
  /** YYYY-MM-DD */
  value: string;
  onChange: (next: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dateObj = useMemo(() => new Date(dateInputToIso(value)), [value]);

  return (
    <View className={compact ? 'mb-2' : 'mb-4'}>
      {compact ? null : <FormLabel>{label}</FormLabel>}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => onChange(shiftDateInput(value, -1))}
          className={`${compact ? 'h-11 w-10' : 'h-14 w-12'} items-center justify-center rounded-2xl border border-ink/15 bg-white`}
        >
          <Ionicons name="chevron-back" size={20} color="#0B3D2E" />
        </Pressable>

        <Pressable
          onPress={() => setOpen(true)}
          className={`${compact ? 'h-11' : 'h-14'} flex-1 flex-row items-center justify-between rounded-2xl border border-ink/15 bg-white px-4`}
        >
          <View>
            <Text className={`${compact ? 'text-[14px]' : 'text-body-lg'} font-semibold text-ink`}>
              {formatDateInputLabel(value)}
            </Text>
            {compact ? null : value !== toDateInputValue() ? (
              <Text className="text-[12px] text-warn">Backdated entry</Text>
            ) : (
              <Text className="text-[12px] text-ink/40">Today</Text>
            )}
          </View>
          <Ionicons name="calendar-outline" size={20} color="#0B3D2E" />
        </Pressable>

        <Pressable
          onPress={() => onChange(shiftDateInput(value, 1))}
          className={`${compact ? 'h-11 w-10' : 'h-14 w-12'} items-center justify-center rounded-2xl border border-ink/15 bg-white`}
        >
          <Ionicons name="chevron-forward" size={20} color="#0B3D2E" />
        </Pressable>
      </View>

      {open ? (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            if (Platform.OS === 'android') setOpen(false);
            if (selected) onChange(toDateInputValue(selected));
          }}
        />
      ) : null}

      {Platform.OS === 'ios' && open ? (
        <Pressable
          onPress={() => setOpen(false)}
          className="mt-2 items-center rounded-full bg-brand py-3"
        >
          <Text className="font-bold text-white">Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function OutlinedInput({
  label,
  className = '',
  compact = false,
  ...props
}: TextInputProps & { label?: string; className?: string; compact?: boolean }) {
  return (
    <View className={`${compact ? 'mb-2' : 'mb-4'} ${className}`}>
      {label ? (
        <Text className={`${compact ? 'mb-1 text-[11px]' : 'mb-2 text-[13px]'} font-semibold uppercase tracking-wide text-ink/45`}>
          {label}
        </Text>
      ) : null}
      <TextInput
        className={`${compact ? 'min-h-[44px] text-[15px]' : 'min-h-[56px] text-body-lg'} rounded-2xl border border-ink/15 bg-white px-4 text-ink`}
        placeholderTextColor="#8A968F"
        {...props}
      />
    </View>
  );
}

export function AmountField({
  value,
  onChangeText,
  label = 'Amount',
}: {
  value: string;
  onChangeText: (v: string) => void;
  label?: string;
}) {
  return (
    <View className="mb-4">
      <FormLabel>{label}</FormLabel>
      <View className="min-h-[72px] flex-row items-center rounded-2xl border-2 border-brand bg-white px-4">
        <TextInput
          className="flex-1 text-right text-[28px] font-bold text-ink"
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#8A968F"
        />
      </View>
    </View>
  );
}

export function SegmentedTwo({
  left,
  right,
  value,
  onChange,
  compact = false,
}: {
  left: { key: string; label: string; icon?: keyof typeof Ionicons.glyphMap };
  right: { key: string; label: string; icon?: keyof typeof Ionicons.glyphMap };
  value: string;
  onChange: (key: string) => void;
  compact?: boolean;
}) {
  return (
    <View className={`${compact ? 'mb-2' : 'mb-5'} flex-row rounded-full bg-[#ECEAE3] p-1`}>
      {[left, right].map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            className={`${compact ? 'min-h-[40px]' : 'min-h-[48px]'} flex-1 flex-row items-center justify-center rounded-full px-3 ${
              active ? 'bg-brand' : ''
            }`}
          >
            {opt.icon ? (
              <Ionicons
                name={opt.icon}
                size={16}
                color={active ? '#fff' : '#3D4A44'}
                style={{ marginRight: 6 }}
              />
            ) : null}
            <Text className={`text-[14px] font-semibold ${active ? 'text-white' : 'text-ink/70'}`}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SavePillButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`min-h-[56px] flex-row items-center justify-center rounded-full bg-brand px-5 ${
        disabled || loading ? 'opacity-60' : 'active:opacity-90'
      }`}
    >
      <View className="mr-2 h-6 w-6 items-center justify-center rounded-full border-2 border-white">
        <Ionicons name="checkmark" size={14} color="#fff" />
      </View>
      <Text className="text-body-lg font-bold text-white">{loading ? 'Saving…' : label}</Text>
    </Pressable>
  );
}
