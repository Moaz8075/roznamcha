import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function SuccessModal({
  visible,
  title,
  message,
  onDone,
  doneLabel = 'Done',
}: {
  visible: boolean;
  title: string;
  message?: string;
  onDone: () => void;
  doneLabel?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View className="flex-1 items-center justify-center bg-black/45 px-8">
        <View className="w-full max-w-[340px] items-center rounded-[28px] bg-[#FBF9F3] px-6 pb-6 pt-8">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-[#DCEFE6]">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-success">
              <Ionicons name="checkmark" size={34} color="#fff" />
            </View>
          </View>
          <Text className="text-center text-[22px] font-bold text-ink">{title}</Text>
          {message ? (
            <Text className="mt-2 text-center text-body text-ink/55">{message}</Text>
          ) : null}
          <Pressable
            onPress={onDone}
            className="mt-6 min-h-[52px] w-full items-center justify-center rounded-full bg-brand active:opacity-90"
          >
            <Text className="text-body-lg font-bold text-white">{doneLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
