import { TextInput, View, Text, type TextInputProps } from 'react-native';

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-body font-semibold text-ink">{label}</Text>
      <TextInput
        className="min-h-[56px] rounded-2xl border border-brand/20 bg-white px-4 text-body-lg text-ink"
        placeholderTextColor="#6B7C74"
        {...props}
      />
      {error ? <Text className="mt-1 text-body text-danger">{error}</Text> : null}
    </View>
  );
}
