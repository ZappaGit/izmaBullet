// Subapp 2: Registro futuro. Dos páginas que se cambian deslizando de derecha a izquierda.
// Mes +N = mes actual + N; en pantalla se ve el nombre del mes (NOVIEMBRE), no "MES +1". El índice lateral va solo en la primera página.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IndiceLateral, Papel, TituloPagina, estilosJournal } from '../componentes/journal';
import { buscarAplicacionPorNumero } from '../dominio/aplicaciones';
import { useApp } from '../contexto/ProveedorApp';
import { PAGINAS_FUTURO, mesDesplazado, validarElemento } from '../dominio/futuro';
import { JOURNAL } from '../tema/journal';
import { areaTactil } from '../tema/escalas';

const NUMERO = 2;
const COLOR = buscarAplicacionPorNumero(NUMERO).color;

// Un mes: «NOVIEMBRE 2026», línea, sus elementos con «−» y un «+» para añadir.
function Mes({ desplazamiento }) {
  const { repos } = useApp();
  const mes = mesDesplazado(new Date(), desplazamiento);
  const [elementos, setElementos] = useState([]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setElementos(await repos.elementosFuturo.deMes(mes.clave));
  }, [repos, mes.clave]);

  useEffect(() => { cargar(); }, [cargar]);

  async function guardar() {
    const fallo = validarElemento(texto);
    if (fallo) {
      setError(fallo);
      return;
    }
    await repos.elementosFuturo.anadir(mes.clave, texto);
    setTexto('');
    setError(null);
    setEscribiendo(false);
    await cargar();
  }

  async function eliminar(elemento) {
    await repos.elementosFuturo.eliminar(elemento.id);
    await cargar();
  }

  return (
    <View style={estilos.mes}>
      <Text style={[estilosJournal.texto, estilos.nombreMes]}>
        {mes.mes.toUpperCase()} {mes.anio}
      </Text>
      <View style={estilos.subrayado} />
      {elementos.map((elemento) => (
        <View key={elemento.id} style={estilos.elemento}>
          <Text style={[estilosJournal.texto, estilos.textoElemento]}>•  {elemento.texto}</Text>
          <Pressable
            onPress={() => eliminar(elemento)}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${elemento.texto}`}
            style={estilos.botonSigno}
          >
            <Text style={[estilosJournal.texto, estilos.signo]}>−</Text>
          </Pressable>
        </View>
      ))}
      {escribiendo ? (
        <View>
          <TextInput
            autoFocus
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={guardar}
            onBlur={() => { if (!texto.trim()) setEscribiendo(false); }}
            returnKeyType="done"
            maxLength={80}
            placeholder="nuevo elemento"
            placeholderTextColor={JOURNAL.punto}
            accessibilityLabel={`Nuevo elemento en ${mes.nombre}`}
            style={[estilosJournal.texto, estilos.entrada]}
          />
          {error ? <Text style={[estilosJournal.texto, estilos.error]}>{error}</Text> : null}
        </View>
      ) : (
        <Pressable
          onPress={() => setEscribiendo(true)}
          accessibilityRole="button"
          accessibilityLabel={`Añadir elemento en ${mes.nombre}`}
          style={[estilos.botonSigno, estilos.botonMas]}
        >
          <Text style={[estilosJournal.texto, estilos.signo, { color: COLOR }]}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

function Pagina({ pagina, ancho, primera, margenSuperior }) {
  return (
    <Papel anillas={primera ? 'derecha' : 'izquierda'} style={{ width: ancho }}>
      {primera ? <IndiceLateral actual={NUMERO} /> : null}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[estilos.contenido, { paddingTop: margenSuperior + 48 }]}
      >
        <TituloPagina color={COLOR}>{pagina.titulo}</TituloPagina>
        {pagina.meses.map((desplazamiento) => (
          <Mes key={desplazamiento} desplazamiento={desplazamiento} />
        ))}
      </ScrollView>
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
  contenido: { paddingLeft: 56, paddingRight: 40, paddingBottom: 48, gap: 28 },
  mes: { gap: 6 },
  nombreMes: { fontSize: 30 },
  subrayado: { width: 180, height: 2, backgroundColor: JOURNAL.tinta, marginBottom: 4 },
  elemento: { flexDirection: 'row', alignItems: 'center' },
  textoElemento: { flex: 1, fontSize: 22 },
  botonSigno: { minWidth: areaTactil, minHeight: areaTactil, alignItems: 'center', justifyContent: 'center' },
  botonMas: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  signo: { fontSize: 28 },
  entrada: { fontSize: 22, borderBottomWidth: 1, borderColor: JOURNAL.punto, paddingVertical: 4 },
  error: { fontSize: 16, color: '#b3261e' },
});
