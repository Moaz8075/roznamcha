import { useRef } from 'react';
import { Alert, ScrollView, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../../../src/auth/auth-context';
import { createApi } from '../../../src/lib/api';
import { Screen } from '../../../src/components/ui';
import { AppHeader } from '../../../src/components/AppHeader';
import { BrandLogo } from '../../../src/components/BrandLogo';
import { formatDate, formatMoney } from '../../../src/lib/format';

export default function SaleInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const api = createApi(() => token);
  const receiptRef = useRef<View>(null);

  const sale = useQuery({
    queryKey: ['sale', id],
    queryFn: () => api.sales.get(id),
    enabled: !!id,
  });

  const data = sale.data;
  const paidInFull = data ? Number(data.creditAmount) <= 0 : false;

  const shareInvoiceImage = async () => {
    if (!data || !receiptRef.current) return;
    try {
      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        Alert.alert('Could not share', 'Unable to save the invoice image.');
        return;
      }
      const dest = `${cacheDir}Invoice-${data.referenceNumber}-${Date.now()}.png`;
      await FileSystem.copyAsync({ from: uri, to: dest });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'This device cannot open the share sheet.');
        return;
      }
      await Sharing.shareAsync(dest, {
        mimeType: 'image/png',
        dialogTitle: 'Share Invoice',
        UTI: 'public.png',
      });
    } catch {
      Alert.alert('Could not share', 'Unable to create the invoice image.');
    }
  };

  return (
    <Screen className="bg-[#FBF9F3]">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-10">
        <AppHeader showBack fallbackHref="/customers" />

        {!data ? (
          <Text className="py-16 text-center text-body-lg text-ink/45">
            {sale.isLoading ? 'Loading…' : 'Invoice not found'}
          </Text>
        ) : (
          <>
            <View
              ref={receiptRef}
              collapsable={false}
              className="rounded-3xl border border-[#E8E4DA] bg-white px-5 py-5"
            >
              <View className="mb-5 flex-row items-start justify-between">
                <View className="flex-row items-center gap-3 pr-2" style={{ flex: 1 }}>
                  <BrandLogo width={88} height={64} />
                  <View className="flex-1">
                    <Text className="text-body-lg font-bold text-ink">Arif Bilal and Son's</Text>
                    <Text className="text-[13px] text-ink/45">Manufacturer & Suppliers</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-[12px] font-bold uppercase tracking-wide text-brand">
                    Invoice
                  </Text>
                  <Text className="text-body-lg font-bold text-ink">#{data.referenceNumber}</Text>
                  <Text className="text-body text-ink/55">{formatDate(data.transactionDate)}</Text>
                </View>
              </View>

              <Text className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink/40">
                Bill To
              </Text>
              <Text className="mb-5 text-body-lg font-bold text-ink">{data.customerName}</Text>

              <View className="mb-2 flex-row rounded-xl bg-[#F3EEE3] px-3 py-2">
                <Text className="flex-1 text-[11px] font-semibold uppercase text-ink/50">
                  Item Description
                </Text>
                <Text className="w-14 text-right text-[11px] font-semibold uppercase text-ink/50">
                  Qty
                </Text>
              </View>

              {data.items.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center border-b border-ink/10 py-3"
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-body font-semibold text-ink">{item.productName}</Text>
                    <Text className="text-[13px] text-ink/45">
                      {formatMoney(item.unitPrice)} each
                    </Text>
                  </View>
                  <Text className="w-14 text-right text-body font-semibold text-ink">
                    {formatMoney(item.quantity)}
                  </Text>
                </View>
              ))}

              <View className="mt-4 rounded-2xl bg-[#F3EEE3] px-4 py-3">
                <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/45">
                  Payment Details
                </Text>
                <View className="mb-2 flex-row justify-between">
                  <Text className="text-body text-ink/60">Payment Type</Text>
                  <Text className="text-body font-semibold text-ink">
                    {Number(data.paidAmount) > 0 && Number(data.creditAmount) > 0
                      ? 'Partial'
                      : Number(data.creditAmount) > 0
                        ? 'Credit'
                        : 'Cash'}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-body font-semibold text-brand">Status</Text>
                  <View className="flex-row items-center gap-1">
                    {paidInFull ? <Ionicons name="checkmark-circle" size={16} color="#0B3D2E" /> : null}
                    <Text className="text-body font-bold text-brand">
                      {paidInFull ? 'Paid in Full' : `Due ${formatMoney(data.creditAmount)}`}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-4 gap-1.5">
                <View className="flex-row justify-between">
                  <Text className="text-body text-ink/55">Subtotal</Text>
                  <Text className="text-body text-ink">{formatMoney(data.subtotal)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-body text-ink/55">Discount</Text>
                  <Text className="text-body text-ink">{formatMoney(data.discount)}</Text>
                </View>
                <View className="mt-1 flex-row justify-between">
                  <Text className="text-title text-ink">Total</Text>
                  <Text className="text-title text-ink">{formatMoney(data.total)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-body-lg font-bold text-warn">Balance Due</Text>
                  <Text className="text-body-lg font-bold text-warn">
                    {formatMoney(data.creditAmount)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-2 gap-3">
              <Pressable
                onPress={shareInvoiceImage}
                className="min-h-[52px] flex-row items-center justify-center rounded-full bg-[#ECEAE3] active:opacity-90"
              >
                <Ionicons name="share-outline" size={18} color="#12211B" />
                <Text className="ml-2 text-body-lg font-semibold text-ink">Share Invoice</Text>
              </Pressable>
              <Pressable
                onPress={shareInvoiceImage}
                className="min-h-[52px] flex-row items-center justify-center rounded-full bg-brand active:opacity-90"
              >
                <Ionicons name="print-outline" size={18} color="#fff" />
                <Text className="ml-2 text-body-lg font-semibold text-white">Print Invoice</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
