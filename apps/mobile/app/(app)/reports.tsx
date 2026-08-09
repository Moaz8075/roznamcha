import { View, Text } from 'react-native';
import { Screen, Title, Body } from '../../src/components/ui';

export default function ReportsScreen() {
  return (
    <Screen>
      <View className="flex-1 justify-center px-6">
        <Title className="mb-2">Reports</Title>
        <Body>
          Customer statements, daily cash, sales, expenses, and profit reports will appear here.
          Backend report endpoints are scaffolded and ready to implement.
        </Body>
        <Text className="mt-6 text-body text-ink/50">Coming next</Text>
      </View>
    </Screen>
  );
}
