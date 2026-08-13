import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '../../lib/format';
import { KHATA } from '../../theme';

const KEYS = [
  ['AC', '⌫'],
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['0', '00'],
] as const;

export function AmountPad({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const press = (key: string) => {
    if (key === 'AC') {
      onChange('');
      return;
    }
    if (key === '⌫') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.replace(/\D/g, '').length >= 10) return;
    onChange(`${value}${key}`.replace(/^0+(?=\d)/, ''));
  };

  return (
    <View className="mt-3">
      {KEYS.map((row) => (
        <View key={row.join('-')} className="mb-2 flex-row gap-2">
          {row.map((key) => {
            const wide = key === '0' || key === 'AC' || key === '⌫';
            const muted = key === 'AC' || key === '⌫';
            return (
              <Pressable
                key={key}
                onPress={() => press(key)}
                className="h-14 items-center justify-center rounded-xl active:opacity-80"
                style={{
                  flex: wide && row.length === 2 ? 1 : 1,
                  backgroundColor: muted ? '#ECECEC' : '#fff',
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                }}
              >
                {key === '⌫' ? (
                  <Ionicons name="backspace-outline" size={22} color="#616161" />
                ) : (
                  <Text className="text-[20px] font-bold text-ink">{key}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
      <Text className="mt-1 text-center text-[12px] text-ink/40">
        {value ? formatMoney(value) : 'Enter amount'}
      </Text>
    </View>
  );
}

export function AmountFieldRow({
  value,
  color,
  onBackspace,
}: {
  value: string;
  color: string;
  onBackspace: () => void;
}) {
  return (
    <View className="mb-3 flex-row items-center rounded-xl border border-black/10 bg-white px-4 py-3">
      <Text className="mr-2 text-[18px] font-bold" style={{ color }}>
        Rs
      </Text>
      <Text className="flex-1 text-[22px] font-extrabold text-ink">
        {value ? formatMoney(value) : '0'}
      </Text>
      <Pressable onPress={onBackspace} hitSlop={8}>
        <Ionicons name="backspace-outline" size={22} color="#9E9E9E" />
      </Pressable>
    </View>
  );
}

export { KHATA };
