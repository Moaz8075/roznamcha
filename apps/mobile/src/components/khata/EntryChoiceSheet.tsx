import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KHATA } from '../../theme';

export function EntryChoiceSheet({
  visible,
  title = 'Payment',
  onClose,
  onManual,
}: {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onManual: () => void;
}) {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 justify-end bg-black/40">
      <Pressable className="flex-1" onPress={onClose} />
      <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
        <Text className="text-[22px] font-extrabold text-ink">{title}</Text>
        <Text className="mb-5 mt-1 text-[14px] text-ink/50">Choose an option</Text>
        <View className="flex-row">
          <Choice
            icon="camera-outline"
            color="#F6A21A"
            label="Image"
            desc="Use AI to extract details from Invoice/Image"
            onPress={onManual}
          />
          <View className="w-px bg-black/10" />
          <Choice
            icon="mic-outline"
            color="#1E88E5"
            label="Voice"
            desc="Use AI to extract details from voice note"
            onPress={onManual}
          />
          <View className="w-px bg-black/10" />
          <Choice
            icon="keypad-outline"
            color={KHATA.red}
            label="Manual"
            desc="Fill all details manually"
            onPress={onManual}
          />
        </View>
      </View>
    </View>
  );
}

function Choice({
  icon,
  color,
  label,
  desc,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center px-2 py-2">
      <View
        className="mb-2 h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}22` }}
      >
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text className="text-[15px] font-bold text-ink">{label}</Text>
      <Text className="mt-1 text-center text-[11px] leading-4 text-ink/45">{desc}</Text>
    </Pressable>
  );
}
