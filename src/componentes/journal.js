// Piezas del estilo Midori (IzmaBullet Journal), compartidas por todas las subapps.
// Ver docs/estilo-journal.md y docs/requisitos-funcionales.md.
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { marcasIndice } from '../dominio/aplicaciones';
import { areaTactil } from '../tema/escalas';
import { JOURNAL } from '../tema/journal';

const TAMANO_PUNTO = 16;
const ANILLAS = 10;
const PASO_ANILLA = 84;
const TAMANO_ANILLA = 14;
const MARGEN_ANILLA = 12;
const INICIO_ANILLAS = 60;
export const ANCHO_INDICE = 44;
const INICIO_INDICE = 136;

// Hoja de papel con puntos. `anillas`: 'izquierda' | 'derecha' | null.
export function Papel({ anillas = null, style, children }) {
  return (
    <View style={[estilos.papel, style]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Pattern id="puntos" width={TAMANO_PUNTO} height={TAMANO_PUNTO} patternUnits="userSpaceOnUse">
            <Circle cx={1} cy={1} r={1} fill={JOURNAL.punto} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#puntos)" />
      </Svg>
      {anillas ? <Anillas lado={anillas} /> : null}
      {children}
    </View>
  );
}

function Anillas({ lado }) {
  const lateral = lado === 'derecha' ? { right: MARGEN_ANILLA } : { left: MARGEN_ANILLA };
  return (
    <View pointerEvents="none" style={[estilos.columnaAnillas, lateral]}>
      {Array.from({ length: ANILLAS }, (_, indice) => (
        <View key={indice} style={[estilos.anilla, { top: INICIO_ANILLAS + indice * PASO_ANILLA }]} />
      ))}
    </View>
  );
}

// Índice lateral [1]…[7]. Va solo en la primera página de cada subapp (no en el Índice).
export function IndiceLateral({ actual }) {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  return (
    <View style={[estilos.indice, { top: top + INICIO_INDICE }]}>
      {marcasIndice(actual).map((marca) => (
        <Pressable
          key={marca.numero}
          disabled={!marca.disponible || marca.activa}
          onPress={() => router.replace(marca.ruta)}
          accessibilityRole="link"
          accessibilityLabel={marca.nombre}
          accessibilityState={{ selected: marca.activa, disabled: !marca.disponible }}
          style={[estilos.filaIndice, marca.activa && { borderColor: marca.color }]}
        >
          <Text style={[estilos.numeroIndice, { color: marca.color }, !marca.disponible && estilos.atenuado]}>
            [{marca.numero}]
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Título de página manuscrito en mayúsculas, en el color clave de la subapp.
export function TituloPagina({ children, color = JOURNAL.tinta }) {
  return (
    <Text accessibilityRole="header" style={[estilos.titulo, { color }]}>
      {String(children).toUpperCase()}
    </Text>
  );
}

export const estilosJournal = StyleSheet.create({
  texto: { fontFamily: JOURNAL.fuente, color: JOURNAL.tinta },
});

const estilos = StyleSheet.create({
  papel: { flex: 1, backgroundColor: JOURNAL.papel, overflow: 'hidden' },
  columnaAnillas: { position: 'absolute', top: 0, bottom: 0, width: TAMANO_ANILLA },
  anilla: {
    position: 'absolute',
    width: TAMANO_ANILLA,
    height: TAMANO_ANILLA,
    borderRadius: TAMANO_ANILLA / 2,
    backgroundColor: JOURNAL.anillaRelleno,
    borderWidth: 1.5,
    borderColor: JOURNAL.anillaTrazo,
  },
  indice: { position: 'absolute', left: 6, width: ANCHO_INDICE },
  filaIndice: {
    minHeight: areaTactil,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  numeroIndice: { fontFamily: JOURNAL.fuente, fontSize: 22 },
  atenuado: { opacity: 0.35 },
  titulo: { fontFamily: JOURNAL.fuente, fontSize: 44, letterSpacing: 6 },
});
