import { Stack } from 'expo-router';

import { JOURNAL } from '../../tema/journal';

// Subapps del cuaderno. Sin cabecera ni menú lateral: se navega con el índice [1]…[7]
// (RF-NAV-3, RF-CAB-1). El botón atrás de Android vuelve al Índice.
export default function SubappsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: JOURNAL.papel }, animation: 'fade' }}>
      <Stack.Screen name="indice" />
      <Stack.Screen name="registro-futuro" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
