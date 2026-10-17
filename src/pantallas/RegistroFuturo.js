// Aplicación 2 del Índice: Registro futuro. Dos páginas que se cambian deslizando
// el dedo de derecha a izquierda; cada página lleva dos meses.
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useEstilos } from '../componentes/ui';
import { PAGINAS_FUTURO, mesDesplazado } from '../dominio/futuro';
import { areaTactil, espaciado, radio, tipografia } from '../tema/escalas';

// Círculos de la columna lateral de cada página (por ahora sin función: pendiente de definir).
const CIRCULOS_POR_PAGINA = 10;
const TAMANO_CIRCULO = 12;
const ANCHO_PESTANA = areaTactil;

const crearEstilos = (t) =>
  StyleSheet.create({
    raiz: { flex: 1, backgroundColor: t.bg },
    pagina: { flex: 1, flexDirection: 'row', paddingLeft: ANCHO_PESTANA, paddingRight: espaciado.m },
    contenido: { flex: 1, paddingVertical: espaciado.m, gap: espaciado.l },
    titulo: { color: t.text, fontSize: tipografia.titulo, fontWeight: '700' },
    mes: { gap: espaciado.xs },
    etiquetaMes: { color: t.primary, fontSize: tipografia.pequeno, fontWeight: '600' },
    nombreMes: { color: t.text, fontSize: tipografia.subtitulo, fontWeight: '600' },
    columna: { width: TAMANO_CIRCULO + espaciado.s, alignItems: 'center', paddingTop: espaciado.m, gap: espaciado.s },
    circulo: {
      width: TAMANO_CIRCULO,
      height: TAMANO_CIRCULO,
      borderRadius: TAMANO_CIRCULO / 2,
      borderWidth: 1.5,
      borderColor: t.muted,
    },
    pestana: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: ANCHO_PESTANA,
      backgroundColor: t.surface,
      borderRightWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pestanaTexto: {
      color: t.primary,
      fontSize: tipografia.pequeno,
      fontWeight: '700',
      transform: [{ rotate: '-90deg' }],
      width: 120,
      textAlign: 'center',
    },
  });

export default function RegistroFuturo() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const { width } = useWindowDimensions();
  const fechaHoy = new Date();

  return (
    <View style={estilos.raiz}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ width: width * PAGINAS_FUTURO.length }}
      >
        {PAGINAS_FUTURO.map((pagina) => (
          <View key={pagina.titulo} style={[estilos.pagina, { width }]}>
            <View style={estilos.contenido}>
              <Text style={estilos.titulo}>{pagina.titulo}</Text>
              {pagina.meses.map((desplazamiento) => {
                const mes = mesDesplazado(fechaHoy, desplazamiento);
                return (
                  <View key={mes.etiqueta} style={estilos.mes}>
                    <Text style={estilos.etiquetaMes}>{mes.etiqueta}</Text>
                    <Text style={estilos.nombreMes}>{mes.nombre}</Text>
                  </View>
                );
              })}
            </View>
            <View style={estilos.columna} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {Array.from({ length: CIRCULOS_POR_PAGINA }, (_, indice) => (
                <View key={indice} style={estilos.circulo} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/indice')}
        accessibilityRole="button"
        accessibilityLabel="Volver al Índice"
        style={estilos.pestana}
      >
        <Text style={estilos.pestanaTexto}>ÍNDICE</Text>
      </Pressable>
    </View>
  );
}
