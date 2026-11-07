import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ThemeProvider as AppThemeProvider,
  useTheme,
} from '../../context/ThemeContext';

export default function TabLayout() {
  return (
    <AppThemeProvider>
      <TabNavigator />
    </AppThemeProvider>
  );
}

function TabNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
        },
        headerShadowVisible: !isDark,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="eventsscreen"
        options={{
          title: 'Evenimente',
          headerTitle: 'Evenimente Arad',
          tabBarIcon: (props: any) => (
            <Ionicons name="calendar-outline" size={22} color={props.color} />
          ),
        }}
      />
      <Tabs.Screen
        name="producers"
        options={{
          title: 'Producători',
          headerTitle: 'Producători Locali',
          tabBarIcon: (props: any) => (
            <Ionicons name="storefront-outline" size={22} color={props.color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Hartă',
          headerTitle: 'Harta Județului Arad',
          tabBarIcon: (props: any) => (
            <Ionicons name="map-outline" size={22} color={props.color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cont & Setări',
          headerTitle: 'Profil & Setări',
          tabBarIcon: (props: any) => (
            <Ionicons name="person-outline" size={22} color={props.color} />
          ),
        }}
      />
    </Tabs>
  );
}