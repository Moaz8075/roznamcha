import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../src/auth/auth-context';
import { createApi } from '../../src/lib/api';
import { Screen, Title, Body } from '../../src/components/ui';
import { AppHeader } from '../../src/components/AppHeader';
import { Field } from '../../src/components/Field';
import { BigButton } from '../../src/components/BigButton';
import { SuccessModal } from '../../src/components/SuccessModal';
import { getApiBaseUrl } from '../../src/lib/api';

export default function SettingsScreen() {
  const { user, logout, token, setUser } = useAuth();
  const api = createApi(() => token);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user?.name, user?.email]);

  const saveProfile = useMutation({
    mutationFn: () =>
      api.auth.updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
      }),
    onSuccess: (updated) => {
      setUser(updated);
      setSuccessMsg('Profile updated.');
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not update profile', err.message),
  });

  const changePassword = useMutation({
    mutationFn: () =>
      api.auth.changePassword({
        currentPassword,
        newPassword,
      }),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('Password updated.');
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not change password', err.message),
  });

  const profileDirty =
    name.trim() !== (user?.name ?? '') ||
    email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase();

  const passwordReady =
    currentPassword.length >= 6 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword;

  return (
    <Screen className="bg-[#FBF9F3]">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5 pb-12 pt-2"
      >
        <AppHeader showBack fallbackHref="/more" />
        <Title>Settings</Title>
        <Body>Role: {user?.role}</Body>
        <Text className="text-body text-ink/40">API: {getApiBaseUrl()}</Text>

        <View className="mt-2 rounded-3xl border border-[#E8E4DA] bg-white px-4 py-4">
          <Text className="mb-3 text-title text-ink">Profile</Text>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <BigButton
            label="Save profile"
            loading={saveProfile.isPending}
            disabled={!profileDirty || !name.trim() || !email.trim()}
            onPress={() => saveProfile.mutate()}
          />
        </View>

        <View className="rounded-3xl border border-[#E8E4DA] bg-white px-4 py-4">
          <Text className="mb-3 text-title text-ink">Change password</Text>
          <Field
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <Field
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Field
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword ? (
            <Text className="mb-2 text-body text-danger">Passwords do not match</Text>
          ) : null}
          <BigButton
            label="Update password"
            loading={changePassword.isPending}
            disabled={!passwordReady}
            onPress={() => changePassword.mutate()}
          />
        </View>

        <BigButton label="Sign Out" variant="secondary" onPress={() => logout()} className="mt-2" />
      </ScrollView>

      <SuccessModal
        visible={successOpen}
        title="Saved"
        message={successMsg}
        onDone={() => setSuccessOpen(false)}
      />
    </Screen>
  );
}
