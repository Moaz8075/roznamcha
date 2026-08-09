import { useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../src/auth/auth-context';
import { createApi } from '../../../../src/lib/api';
import { Screen } from '../../../../src/components/ui';
import { AppHeader } from '../../../../src/components/AppHeader';
import { Field } from '../../../../src/components/Field';
import { BigButton } from '../../../../src/components/BigButton';
import { formatMoney } from '../../../../src/lib/format';
import { SuccessModal } from '../../../../src/components/SuccessModal';

export default function SuppliersScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const qc = useQueryClient();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['suppliers', q],
    queryFn: () => api.suppliers.list(q || undefined),
  });

  const create = useMutation({
    mutationFn: () =>
      api.suppliers.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
      }),
    onSuccess: (supplier) => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setCreateOpen(false);
      setName('');
      setPhone('');
      setCreatedId(supplier.id);
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not create', err.message),
  });

  const items = data?.items ?? [];

  return (
    <Screen className="bg-[#FBF9F3]">
      <View className="px-5 pt-1">
        <AppHeader />
        <Text className="mb-4 text-[28px] font-bold text-ink">Suppliers</Text>
        <View className="mb-4 flex-row items-center rounded-full border border-ink/25 bg-transparent px-4">
          <Ionicons name="search" size={18} color="#6B7C74" />
          <TextInput
            className="min-h-[48px] flex-1 px-3 text-body-lg text-ink"
            placeholder="Search suppliers..."
            placeholderTextColor="#8A968F"
            value={q}
            onChangeText={setQ}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
          flexGrow: 1,
        }}
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <Text className="py-16 text-center text-body-lg text-ink/45">
            {isLoading ? 'Loading…' : 'No suppliers yet'}
          </Text>
        }
        renderItem={({ item }) => {
          const balance = Number(item.balance);
          const owes = Number.isFinite(balance) && balance > 0;

          return (
            <Link href={`/suppliers/${item.id}`} asChild>
              <Pressable className="rounded-3xl bg-[#F3EEE3] px-4 py-4 active:opacity-90">
                <View className="mb-2 flex-row items-start justify-between gap-3">
                  <Text className="flex-1 text-[17px] font-bold text-ink" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className={`text-[17px] font-bold ${owes ? 'text-danger' : 'text-ink/45'}`}>
                    {formatMoney(item.balance)}
                  </Text>
                </View>
                <View className="mb-3 flex-row items-center gap-2">
                  <Ionicons name="call-outline" size={14} color="#6B7C74" />
                  <Text className="text-body text-ink/55">
                    {item.phone?.trim() ? item.phone : 'No phone'}
                  </Text>
                </View>
                {owes ? (
                  <View className="flex-row items-center self-start rounded-full bg-[#F8D7D4] px-3 py-1.5">
                    <Ionicons name="arrow-up" size={14} color="#B42318" />
                    <Text className="ml-1.5 text-[13px] font-semibold text-danger">You will give</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center self-start rounded-full bg-[#ECEAE3] px-3 py-1.5">
                    <Ionicons name="checkmark-circle" size={14} color="#12211B" />
                    <Text className="ml-1.5 text-[13px] font-semibold text-ink">Settled</Text>
                  </View>
                )}
              </Pressable>
            </Link>
          );
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add supplier"
        onPress={() => setCreateOpen(true)}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-2xl bg-brand active:opacity-90"
        style={{ bottom: 96, elevation: 4 }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <Modal
        visible={createOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="flex-1" onPress={() => setCreateOpen(false)} />
          <View className="rounded-t-3xl bg-[#FBF9F3] px-5 pb-8 pt-5">
            <Text className="mb-4 text-title text-ink">New supplier</Text>
            <Field label="Name" value={name} onChangeText={setName} autoFocus />
            <Field
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <BigButton
              label="Save supplier"
              loading={create.isPending}
              disabled={!name.trim()}
              onPress={() => create.mutate()}
            />
            <BigButton
              label="Cancel"
              variant="secondary"
              className="mt-3"
              onPress={() => setCreateOpen(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SuccessModal
        visible={successOpen}
        title="Supplier saved"
        message="Supplier added successfully."
        onDone={() => {
          setSuccessOpen(false);
          if (createdId) router.push(`/suppliers/${createdId}`);
        }}
      />
    </Screen>
  );
}
