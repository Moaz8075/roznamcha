import { Text, View, type TextProps, type ViewProps } from 'react-native';

export function Screen({ children, className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View className={`flex-1 bg-paper ${className}`} {...props}>
      {children}
    </View>
  );
}

export function Title({ children, className = '', ...props }: TextProps & { className?: string }) {
  return (
    <Text className={`text-title text-ink ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function Body({ children, className = '', ...props }: TextProps & { className?: string }) {
  return (
    <Text className={`text-body-lg text-ink/80 ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function Money({ value, className = '' }: { value: string; className?: string }) {
  const n = Number(value);
  const formatted = Number.isFinite(n)
    ? Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : value;
  return <Text className={`text-title text-brand ${className}`}>{formatted}</Text>;
}
