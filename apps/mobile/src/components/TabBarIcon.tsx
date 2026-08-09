import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_BG = '#E8B84A';
const INACTIVE = '#3D4A44';

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
      <Ionicons name={name} size={22} color={INACTIVE} />
    </View>
  );
}
