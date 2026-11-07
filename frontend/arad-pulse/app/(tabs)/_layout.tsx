import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C82333',
        tabBarInactiveTintColor: '#8E8E93',
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