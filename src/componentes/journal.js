// Piezas del estilo Midori (IzmaBullet Journal), compartidas por todas las subapps.
// Ver docs/estilo-journal.md y docs/requisitos-funcionales.md.
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
  titulo: { fontFamily: JOURNAL.fuente, fontSize: 44, letterSpacing: 6, marginBottom: 8 },
  hoja: { paddingLeft: 56, paddingRight: 40, paddingBottom: 48, gap: 20 },
  subtitulo: { gap: 4, marginTop: 8 },
  textoSubtitulo: { fontSize: 28 },
  linea: { width: 150, height: 2, backgroundColor: JOURNAL.tinta },
  vineta: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: areaTactil },
  marca: { minWidth: areaTactil, minHeight: areaTactil, marginLeft: -12, alignItems: 'center' },
  textoMarca: { fontSize: 24, lineHeight: 32 },
  pulsable: { flex: 1 },
  textosVineta: { flex: 1 },
  textoVineta: { fontSize: 24, lineHeight: 32 },
  detalleVineta: { fontSize: 17, opacity: 0.7 },
  accion: { minHeight: areaTactil, justifyContent: 'center', alignSelf: 'flex-start' },
  textoAccion: { fontSize: 22 },
  nota: { fontSize: 20, opacity: 0.8 },
});

// ---- Controles Midori ------------------------------------------------------

// Páginas que se cambian deslizando de derecha a izquierda (RF-NAV-5).
// `paginas`: [{ clave, contenido(primera) }]. La primera lleva anillas a la derecha; el resto, a la izquierda.
export function PaginasDeslizables({ paginas }) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: JOURNAL.papel }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {paginas.map((pagina, indice) => (
        <Papel key={pagina.clave} anillas={indice === 0 ? 'derecha' : 'izquierda'} style={{ width }}>
          {pagina.contenido(indice === 0)}
        </Papel>
      ))}
    </ScrollView>
  );
}

// Columna de contenido de una página, con margen para el índice y las anillas.
export function Hoja({ children }) {
  const { top } = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={[estilos.hoja, { paddingTop: top + 48 }]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

// Subtítulo manuscrito con línea debajo (como "MES +1" o "qué quiero hacer").
export function Subtitulo({ children }) {
  return (
    <View style={estilos.subtitulo}>
      <Text style={[estilosJournal.texto, estilos.textoSubtitulo]}>{children}</Text>
      <View style={estilos.linea} />
    </View>
  );
}

// Línea con viñeta. Con `onPress` se puede pulsar; `marca` sustituye la viñeta (p. ej. ○ / ●).
export function Vineta({ children, detalle, onPress, marca = '•', onMarca, etiquetaMarca, colorMarca = JOURNAL.tinta }) {
  const contenido = (
    <View style={estilos.textosVineta}>
      <Text style={[estilosJournal.texto, estilos.textoVineta]}>{children}</Text>
      {detalle ? <Text style={[estilosJournal.texto, estilos.detalleVineta]}>{detalle}</Text> : null}
    </View>
  );
  return (
    <View style={estilos.vineta}>
      {onMarca ? (
        <Pressable onPress={onMarca} accessibilityRole="checkbox" accessibilityLabel={etiquetaMarca} hitSlop={8} style={estilos.marca}>
          <Text style={[estilosJournal.texto, estilos.textoMarca, { color: colorMarca }]}>{marca}</Text>
        </Pressable>
      ) : (
        <Text style={[estilosJournal.texto, estilos.textoMarca]}>{marca}</Text>
      )}
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" style={estilos.pulsable}>{contenido}</Pressable>
      ) : contenido}
    </View>
  );
}

// Acción escrita a mano entre corchetes, en el color clave: [ + nuevo hábito ].
export function Accion({ titulo, onPress, color = JOURNAL.tinta }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={estilos.accion}>
      <Text style={[estilosJournal.texto, estilos.textoAccion, { color }]}>[ {titulo} ]</Text>
    </Pressable>
  );
}

// Texto suelto en tinta (avisos, páginas vacías).
export function Nota({ children }) {
  return <Text style={[estilosJournal.texto, estilos.nota]}>{children}</Text>;
}
