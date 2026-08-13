import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_BG = '#FFE0D1';
const INACTIVE = '#757575';
const ACTIVE = '#F15A24';

export function TabBarIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <View
      style={{
        width: 48,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? ACTIVE_BG : 'transparent',
      }}
    >
      <Ionicons name={name} size={22} color={focused ? ACTIVE : INACTIVE} />
    </View>
  );
}
