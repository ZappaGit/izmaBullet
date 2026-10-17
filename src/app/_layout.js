import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ProveedorApp, useApp } from '../contexto/ProveedorApp';
import { configurarNotificaciones } from '../notificaciones/recordatorios';

configurarNotificaciones();

export default function RaizLayout() {
  return (
    <ProveedorApp>
      <Raiz />
    </ProveedorApp>
  );
}

function Raiz() {
  const { esquema, tema } = useApp();
  return (
    <>
      <StatusBar style={esquema === 'oscuro' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: tema.surface },
          headerTintColor: tema.primary,
          headerTitleStyle: { color: tema.text },
          contentStyle: { backgroundColor: tema.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="acceso" options={{ title: 'Entrar' }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="habito/[id]" options={{ title: 'Hábito' }} />
        <Stack.Screen name="habito/editar" options={{ title: 'Hábito', presentation: 'modal' }} />
        <Stack.Screen name="objetivo/[id]" options={{ title: 'Objetivo' }} />
        <Stack.Screen name="objetivo/editar" options={{ title: 'Objetivo', presentation: 'modal' }} />
        <Stack.Screen name="cuenta/entrar" options={{ title: 'Entrar' }} />
        <Stack.Screen name="cuenta/alta" options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="cuenta/recuperar" options={{ title: 'Recuperar contraseña' }} />
        <Stack.Screen name="cuenta/nueva-clave" options={{ title: 'Nueva contraseña' }} />
      </Stack>
    </>
  );
}
