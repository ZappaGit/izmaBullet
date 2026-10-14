// Estado global: base de datos, ajustes y tema. Las pantallas leen datos con sus propios repositorios
// y llaman a `recargar()` tras cada cambio para que las demás pantallas se actualicen al volver a ellas.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { abrirRepositorios } from '../almacenamiento/bd';
import { temaClaro, temaOscuro } from '../tema/colores';
import { espaciado, tipografia } from '../tema/escalas';

const ContextoApp = createContext(null);

export function ProveedorApp({ children }) {
  const esquemaSistema = useColorScheme() === 'dark' ? 'oscuro' : 'claro';
  const [repos, setRepos] = useState(null);
  const [ajustes, setAjustes] = useState({ calendarioId: null, tema: 'sistema' });
  const [version, setVersion] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const datos = await abrirRepositorios();
        const calendarioId = await datos.ajustes.obtener('calendarioId', null);
        const tema = await datos.ajustes.obtener('tema', 'sistema');
        if (cancelado) return;
        setRepos(datos);
        setAjustes({ calendarioId, tema });
      } catch (fallo) {
        if (!cancelado) setError(fallo);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const esquema = ajustes.tema === 'sistema' ? esquemaSistema : ajustes.tema;
  const tema = esquema === 'oscuro' ? temaOscuro : temaClaro;

  const guardarAjuste = useCallback(
    async (clave, valor) => {
      await repos.ajustes.guardar(clave, valor ?? '');
      setAjustes((anterior) => ({ ...anterior, [clave]: valor }));
      setVersion((v) => v + 1);
    },
    [repos],
  );

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const valor = useMemo(
    () => ({ repos, ajustes, guardarAjuste, esquema, tema, version, recargar }),
    [repos, ajustes, guardarAjuste, esquema, tema, version, recargar],
  );

  if (error) {
    return (
      <View style={[estilos.pantalla, { backgroundColor: temaClaro.bg }]}>
        <Text style={[estilos.texto, { color: temaClaro.danger }]}>
          No se pudo abrir la base de datos. Cierra la app y vuelve a abrirla.
        </Text>
      </View>
    );
  }

  if (!repos) {
    return (
      <View style={[estilos.pantalla, { backgroundColor: tema.bg }]}>
        <ActivityIndicator color={tema.primary} />
      </View>
    );
  }

  return <ContextoApp.Provider value={valor}>{children}</ContextoApp.Provider>;
}

export function useApp() {
  const contexto = useContext(ContextoApp);
  if (!contexto) throw new Error('useApp debe usarse dentro de ProveedorApp');
  return contexto;
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaciado.l },
  texto: { fontSize: tipografia.cuerpo, textAlign: 'center' },
});
