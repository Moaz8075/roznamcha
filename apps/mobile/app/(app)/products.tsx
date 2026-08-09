import { FlatList, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../src/auth/auth-context';
import { createApi } from '../../src/lib/api';
import { Screen } from '../../src/components/ui';

export default function ProductsScreen() {
  const { token } = useAuth();
  const api = createApi(() => token);
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });

  return (
    <Screen>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(i) => i.id}
        contentContainerClassName="gap-2 px-5 py-4 pb-28"
        ListEmptyComponent={
          <Text className="py-10 text-center text-body-lg text-ink/50">
            {isLoading ? 'Loading…' : 'No products yet'}
          </Text>
        }
        renderItem={({ item }) => (
          <View className="rounded-2xl bg-white px-4 py-3">
            <Text className="text-body-lg font-bold text-ink">{item.name}</Text>
            <Text className="text-body text-ink/60">
              Sale {item.salePrice} · Cost {item.purchasePrice} / {item.unit}
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}
