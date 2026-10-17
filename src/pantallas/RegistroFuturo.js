// Aplicación 2: Registro futuro, con el estilo IzmaBullet Journal.
// Dos páginas que se cambian deslizando el dedo de derecha a izquierda.
// La página Registro lleva el índice numerado a la izquierda; las anillas van al lado de encuadernación.
import { PatrickHand_400Regular, useFonts } from '@expo-google-fonts/patrick-hand';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { buscarAplicacionPorNumero, marcasIndice } from '../dominio/aplicaciones';
import { PAGINAS_FUTURO, mesDesplazado } from '../dominio/futuro';
import { JOURNAL } from '../tema/journal';
import { areaTactil } from '../tema/escalas';

const NUMERO_APLICACION = 2;
const ANCHO_INDICE = 44;
const TAMANO_PUNTO = 16;
const ANILLAS = 10;
const PASO_ANILLA = 84;
const TAMANO_ANILLA = 14;
const MARGEN_ANILLA = 12;
const INICIO_ANILLAS = 60;

function FondoPuntos() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="puntos" width={TAMANO_PUNTO} height={TAMANO_PUNTO} patternUnits="userSpaceOnUse">
          <Circle cx={1} cy={1} r={1} fill={JOURNAL.punto} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#puntos)" />
    </Svg>
  );
}

function Anillas({ lado }) {
  const lateral = lado === 'derecha' ? { right: MARGEN_ANILLA } : { left: MARGEN_ANILLA };
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: TAMANO_ANILLA }, lateral]}>
      {Array.from({ length: ANILLAS }, (_, indice) => (
        <View key={indice} style={[estilos.anilla, { top: INICIO_ANILLAS + indice * PASO_ANILLA }]} />
      ))}
    </View>
  );
}

function IndiceLateral() {
  const router = useRouter();
  return (
    <View style={estilos.indice}>
      {marcasIndice(NUMERO_APLICACION).map((marca) => (
        <Pressable
          key={marca.numero}
          onPress={() => router.push(buscarAplicacionPorNumero(marca.numero).ruta)}
          accessibilityRole="link"
          accessibilityLabel={marca.nombre}
          accessibilityState={{ selected: marca.activa }}
          style={[estilos.filaIndice, marca.activa && { borderColor: marca.color }]}
        >
          <Text style={[estilos.numeroIndice, { color: marca.color }]}>[{marca.numero}]</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Pagina({ pagina, ancho }) {
  const hoy = new Date();
  const conIndice = pagina.titulo === 'Registro';
  const color = buscarAplicacionPorNumero(NUMERO_APLICACION).color;

  return (
    <View style={[estilos.pagina, { width: ancho }]}>
      <FondoPuntos />
      <Anillas lado={conIndice ? 'derecha' : 'izquierda'} />
      {conIndice ? <IndiceLateral /> : null}
      <View style={estilos.contenido}>
        <Text style={[estilos.titulo, { color }]}>{pagina.titulo.toUpperCase()}</Text>
        {pagina.meses.map((desplazamiento) => {
          const mes = mesDesplazado(hoy, desplazamiento);
          return (
            <View key={mes.etiqueta} style={estilos.mes}>
              <Text style={estilos.etiquetaMes}>{mes.etiqueta.toUpperCase()}</Text>
              <View style={estilos.subrayado} />
              <Text style={estilos.fechaMes}>{mes.nombre}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function RegistroFuturo() {
  // Mientras carga la fuente se usa la del sistema; no bloquea la pantalla.
  useFonts({ PatrickHand_400Regular });
  const { width } = useWindowDimensions();

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: JOURNAL.papel }}
      contentContainerStyle={{ flexGrow: 1, width: width * PAGINAS_FUTURO.length }}
    >
      {PAGINAS_FUTURO.map((pagina) => (
        <Pagina key={pagina.titulo} pagina={pagina} ancho={width} />
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: JOURNAL.papel, overflow: 'hidden' },
  contenido: { flex: 1, paddingTop: 48, paddingLeft: 56, paddingRight: 40, gap: 28 },
  titulo: { fontFamily: 'PatrickHand_400Regular', fontSize: 44, letterSpacing: 6 },
  mes: { gap: 4 },
  etiquetaMes: { fontFamily: 'PatrickHand_400Regular', fontSize: 32, color: JOURNAL.tinta },
  subrayado: { width: 150, height: 2, backgroundColor: JOURNAL.tinta },
  fechaMes: { fontFamily: 'PatrickHand_400Regular', fontSize: 20, color: JOURNAL.tinta },
  anilla: {
    position: 'absolute',
    width: TAMANO_ANILLA,
    height: TAMANO_ANILLA,
    borderRadius: TAMANO_ANILLA / 2,
    backgroundColor: JOURNAL.anillaRelleno,
    borderWidth: 1.5,
    borderColor: JOURNAL.anillaTrazo,
  },
  indice: { position: 'absolute', left: 6, top: 136, width: ANCHO_INDICE },
  filaIndice: {
    minHeight: areaTactil,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  numeroIndice: { fontFamily: 'PatrickHand_400Regular', fontSize: 22 },
});
