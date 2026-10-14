import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useApp } from '../../contexto/ProveedorApp';

export default function TabsLayout() {
  const { tema } = useApp();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.primary,
        tabBarInactiveTintColor: tema.muted,
        tabBarStyle: { backgroundColor: tema.surface, borderTopColor: tema.border },
        sceneStyle: { backgroundColor: tema.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Hoy', tabBarIcon: ({ color, size }) => <Ionicons name="sunny-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="habitos"
        options={{ title: 'Hábitos', tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="objetivos"
        options={{ title: 'Objetivos', tabBarIcon: ({ color, size }) => <Ionicons name="flag-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{ title: 'Ajustes', tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
