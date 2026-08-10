import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import type { ProductDto } from '@roznamcha/types';
import { useAuth } from '../../src/auth/auth-context';
import { createApi } from '../../src/lib/api';
import { Screen } from '../../src/components/ui';
import { AppHeader } from '../../src/components/AppHeader';
import { Field } from '../../src/components/Field';
import { BigButton } from '../../src/components/BigButton';
import { SuccessModal } from '../../src/components/SuccessModal';
import { formatMoney } from '../../src/lib/format';

function emptyForm() {
  return { name: '', unit: 'cft', salePrice: '', purchasePrice: '' };
}

export default function ProductsScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products', q],
    queryFn: () => api.products.list(q || undefined),
  });

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (item: ProductDto) => {
    setEditing(item);
    setForm({
      name: item.name,
      unit: item.unit || 'cft',
      salePrice: String(Number(item.salePrice)),
      purchasePrice: String(Number(item.purchasePrice)),
    });
    setFormOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        unit: form.unit.trim() || 'cft',
        salePrice: form.salePrice.trim(),
        purchasePrice: form.purchasePrice.trim(),
      };
      if (editing) {
        return api.products.update(editing.id, payload);
      }
      return api.products.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      closeForm();
      setSuccessMsg(editing ? 'Product updated.' : 'Product created.');
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not save', err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.products.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setSuccessMsg('Product deleted.');
      setSuccessOpen(true);
    },
    onError: (err: Error) => Alert.alert('Could not delete', err.message),
  });

  const confirmDelete = (item: ProductDto) => {
    Alert.alert('Delete product', `Remove “${item.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(item.id),
      },
    ]);
  };

  const items = data?.items ?? [];
  const canSave =
    form.name.trim().length > 0 &&
    form.salePrice.trim().length > 0 &&
    form.purchasePrice.trim().length > 0;

  return (
    <Screen className="bg-[#FBF9F3]">
      <View className="px-5 pt-1">
        <AppHeader showBack fallbackHref="/more" />
        <Text className="mb-4 text-[28px] font-bold text-ink">Products</Text>
        <View className="mb-4 flex-row items-center rounded-full border border-ink/25 px-4">
          <Ionicons name="search" size={18} color="#6B7C74" />
          <TextInput
            className="min-h-[48px] flex-1 px-3 text-body-lg text-ink"
            placeholder="Search products..."
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
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, flexGrow: 1 }}
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <Text className="py-16 text-center text-body-lg text-ink/45">
            {isLoading ? 'Loading…' : 'No products yet'}
          </Text>
        }
        renderItem={({ item }) => (
          <View className="rounded-3xl bg-[#F3EEE3] px-4 py-4">
            <Text className="text-[17px] font-bold text-ink">{item.name}</Text>
            <Text className="mt-1 text-body text-ink/55">
              Sale {formatMoney(item.salePrice)} · Cost {formatMoney(item.purchasePrice)} /{' '}
              {item.unit}
            </Text>
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => openEdit(item)}
                className="flex-1 items-center rounded-full bg-white py-2.5 active:opacity-80"
              >
                <Text className="text-body font-semibold text-brand">Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(item)}
                className="flex-1 items-center rounded-full bg-white py-2.5 active:opacity-80"
              >
                <Text className="text-body font-semibold text-danger">Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add product"
        onPress={openCreate}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-2xl bg-brand active:opacity-90"
        style={{ bottom: 40, elevation: 4 }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={closeForm}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable className="flex-1" onPress={closeForm} />
          <View className="rounded-t-3xl bg-[#FBF9F3] px-5 pb-8 pt-5">
            <Text className="mb-4 text-title text-ink">
              {editing ? 'Edit product' : 'New product'}
            </Text>
            <Field
              label="Name"
              value={form.name}
              onChangeText={(name) => setForm((f) => ({ ...f, name }))}
              autoFocus
            />
            <Field
              label="Unit"
              value={form.unit}
              onChangeText={(unit) => setForm((f) => ({ ...f, unit }))}
            />
            <Field
              label="Sale price"
              value={form.salePrice}
              onChangeText={(salePrice) => setForm((f) => ({ ...f, salePrice }))}
              keyboardType="decimal-pad"
            />
            <Field
              label="Purchase / cost price"
              value={form.purchasePrice}
              onChangeText={(purchasePrice) => setForm((f) => ({ ...f, purchasePrice }))}
              keyboardType="decimal-pad"
            />
            <BigButton
              label={editing ? 'Save changes' : 'Save product'}
              loading={save.isPending}
              disabled={!canSave}
              onPress={() => save.mutate()}
            />
            <BigButton label="Cancel" variant="secondary" className="mt-3" onPress={closeForm} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SuccessModal
        visible={successOpen}
        title="Done"
        message={successMsg}
        onDone={() => setSuccessOpen(false)}
      />
    </Screen>
  );
}
