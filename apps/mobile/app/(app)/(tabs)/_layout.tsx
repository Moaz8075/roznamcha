import { Redirect, Tabs } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../../src/auth/auth-context';
import { TabBarIcon } from '../../../src/components/TabBarIcon';

function TabBarButton({ href: _href, ...rest }: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...rest}
      android_ripple={{ color: 'transparent' }}
      style={[rest.style, { overflow: 'visible' }]}
    />
  );
}

export default function TabsLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator size="large" color="#F15A24" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: TabBarButton,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 88,
          paddingBottom: 18,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          position: 'absolute',
          elevation: 8,
          overflow: 'visible',
        },
        tabBarItemStyle: {
          paddingTop: 4,
          overflow: 'visible',
        },
        tabBarIconStyle: {
          width: 52,
          height: 36,
          marginTop: 0,
        },
        tabBarActiveTintColor: '#F15A24',
        tabBarInactiveTintColor: '#757575',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon name="home-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="roznamcha"
        options={{
          title: 'Roznamcha',
          tabBarLabel: 'Roznamcha',
          tabBarIcon: ({ focused }) => <TabBarIcon name="book-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="customers/index"
        options={{
          title: 'Party',
          tabBarLabel: 'Party',
          href: '/customers',
          tabBarIcon: ({ focused }) => <TabBarIcon name="people-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="suppliers/index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
