import { Drawer } from 'expo-router/drawer';

import { useApp } from '../../contexto/ProveedorApp';
import { APLICACIONES, etiquetaAplicacion } from '../../dominio/aplicaciones';

// Menú lateral común a todas las aplicaciones. Cada una lleva su número,
// así el usuario ve el mismo orden estés donde estés.
export default function AppLayout() {
  const { tema } = useApp();
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: tema.surface },
        headerTintColor: tema.primary,
        headerTitleStyle: { color: tema.text },
        drawerStyle: { backgroundColor: tema.surface },
        drawerActiveTintColor: tema.primary,
        drawerInactiveTintColor: tema.text,
        sceneStyle: { backgroundColor: tema.bg },
      }}
    >
      <Drawer.Screen name="indice" options={{ title: 'Índice', drawerLabel: 'Índice' }} />
      {APLICACIONES.map((aplicacion) => (
        <Drawer.Screen
          key={aplicacion.pantalla}
          name={aplicacion.pantalla}
          options={{ title: aplicacion.nombre, drawerLabel: etiquetaAplicacion(aplicacion) }}
        />
      ))}
    </Drawer>
  );
}
