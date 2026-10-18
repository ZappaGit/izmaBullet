// Subapp 1: Índice (Índice Midori A, solo puntos). Lista [1]…[7]; las subapps
// no disponibles salen atenuadas y no se pueden abrir. No lleva índice lateral.
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Papel, TituloPagina, estilosJournal } from '../componentes/journal';
import { APLICACIONES, etiquetaAplicacion } from '../dominio/aplicaciones';
import { areaTactil } from '../tema/escalas';

export default function Indice() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  return (
    <Papel>
      <ScrollView contentContainerStyle={[estilos.contenido, { paddingTop: top + 48 }]}>
        <TituloPagina>Índice</TituloPagina>
        {APLICACIONES.map((aplicacion) => (
          <Pressable
            key={aplicacion.numero}
            disabled={!aplicacion.disponible || aplicacion.numero === 1}
            onPress={() => router.push(aplicacion.ruta)}
            accessibilityRole="link"
            accessibilityState={{ disabled: !aplicacion.disponible }}
            style={estilos.linea}
          >
            <Text style={[estilosJournal.texto, estilos.textoLinea, !aplicacion.disponible && estilos.atenuado]}>
              {etiquetaAplicacion(aplicacion)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Papel>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingLeft: 56, paddingRight: 24, gap: 4 },
  linea: { minHeight: areaTactil, justifyContent: 'center' },
  textoLinea: { fontSize: 24, letterSpacing: 1 },
  atenuado: { opacity: 0.35 },
});
