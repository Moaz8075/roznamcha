import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-brand active:bg-brand-dark',
  secondary: 'bg-brand-muted active:bg-brand/20',
  danger: 'bg-danger active:bg-danger/90',
};

const textStyles: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-brand',
  danger: 'text-white',
};

export function BigButton({
  label,
  loading,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: PressableProps & {
  label: string;
  loading?: boolean;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`min-h-[56px] items-center justify-center rounded-2xl px-5 ${styles[variant]} ${
        disabled || loading ? 'opacity-60' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#F15A24' : '#fff'} />
      ) : (
        <Text className={`text-body-lg font-bold ${textStyles[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
