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
        <ActivityIndicator size="large" color="#0B3D2E" />
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
          backgroundColor: '#FBF9F3',
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
          elevation: 0,
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
        tabBarActiveTintColor: '#12211B',
        tabBarInactiveTintColor: '#3D4A44',
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
          title: 'Customers',
          tabBarLabel: 'Customers',
          href: '/customers',
          tabBarIcon: ({ focused }) => <TabBarIcon name="people-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="suppliers/index"
        options={{
          title: 'Suppliers',
          tabBarLabel: 'Suppliers',
          href: '/suppliers',
          tabBarIcon: ({ focused }) => <TabBarIcon name="storefront-outline" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
