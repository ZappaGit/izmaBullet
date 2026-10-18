// Subapp 2: Registro futuro. Dos páginas que se cambian deslizando de derecha a izquierda.
// Mes +N = mes actual + N. El índice lateral va solo en la primera página.
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IndiceLateral, Papel, TituloPagina, estilosJournal } from '../componentes/journal';
import { buscarAplicacionPorNumero } from '../dominio/aplicaciones';
import { PAGINAS_FUTURO, mesDesplazado } from '../dominio/futuro';
import { JOURNAL } from '../tema/journal';

const NUMERO = 2;

function Pagina({ pagina, ancho, primera, margenSuperior }) {
  const hoy = new Date();
  return (
    <Papel anillas={primera ? 'derecha' : 'izquierda'} style={{ width: ancho }}>
      {primera ? <IndiceLateral actual={NUMERO} /> : null}
      <View style={[estilos.contenido, { paddingTop: margenSuperior + 48 }]}>
        <TituloPagina color={buscarAplicacionPorNumero(NUMERO).color}>{pagina.titulo}</TituloPagina>
        {pagina.meses.map((desplazamiento) => {
          const mes = mesDesplazado(hoy, desplazamiento);
          return (
            <View key={mes.etiqueta} style={estilos.mes}>
              <Text style={[estilosJournal.texto, estilos.etiquetaMes]}>{mes.etiqueta.toUpperCase()}</Text>
              <View style={estilos.subrayado} />
              <Text style={[estilosJournal.texto, estilos.fechaMes]}>{mes.nombre}</Text>
            </View>
          );
        })}
      </View>
    </Papel>
  );
}

export default function RegistroFuturo() {
  const { width } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: JOURNAL.papel }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {PAGINAS_FUTURO.map((pagina, indice) => (
        <Pagina key={pagina.titulo} pagina={pagina} ancho={width} primera={indice === 0} margenSuperior={top} />
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { flex: 1, paddingLeft: 56, paddingRight: 40, gap: 28 },
  mes: { gap: 4 },
  etiquetaMes: { fontSize: 32 },
  subrayado: { width: 150, height: 2, backgroundColor: JOURNAL.tinta },
  fechaMes: { fontSize: 20 },
});
