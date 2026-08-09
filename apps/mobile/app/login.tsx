import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@roznamcha/validation';
import { useAuth } from '../src/auth/auth-context';
import { BigButton } from '../src/components/BigButton';
import { Field } from '../src/components/Field';
import { Body, Screen, Title } from '../src/components/ui';
import { BrandLogo } from '../src/components/BrandLogo';
import { ApiError } from '@roznamcha/api-client';
import { getApiBaseUrl } from '../src/lib/api';

export default function LoginScreen() {
  const { login, token, isLoading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@roznamcha.local',
      password: 'admin123',
    },
  });

  if (!isLoading && token) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await login(values);
      router.replace('/(app)/(tabs)/dashboard');
    } catch (err) {
      setSubmitting(false);
      const message =
        err instanceof ApiError ? err.message : 'Could not log in. Check your connection.';
      Alert.alert('Login failed', message);
      return;
    }
    setSubmitting(false);
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10 items-center">
            <BrandLogo width={220} height={160} style={{ marginBottom: 16 }} />
            <Text className="mb-2 text-center text-[22px] font-bold text-brand">Roznamcha</Text>
            <Title className="mb-2 text-center">Welcome back</Title>
            <Body className="text-center">Sign in to manage sales, customers, and daily cash.</Body>
            {__DEV__ ? (
              <Text className="mt-2 text-xs text-slate-500">API: {getApiBaseUrl()}</Text>
            ) : null}
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Password"
                secureTextEntry
                autoComplete="password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <BigButton label="Sign In" onPress={onSubmit} loading={submitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
