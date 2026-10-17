// Índice de aplicaciones. Cada una lleva su número, que también aparece en el menú lateral.
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Pantalla, Tarjeta, useEstilos } from '../componentes/ui';
import { APLICACIONES, etiquetaAplicacion } from '../dominio/aplicaciones';
import { espaciado, radio, tipografia } from '../tema/escalas';

const crearEstilos = (t) =>
  StyleSheet.create({
    intro: { color: t.muted, fontSize: tipografia.cuerpo, lineHeight: 22 },
    fila: { flexDirection: 'row', alignItems: 'center', gap: espaciado.m },
    numero: {
      width: 40,
      height: 40,
      borderRadius: radio.m,
      color: '#ffffff',
      textAlign: 'center',
      textAlignVertical: 'center',
      fontSize: tipografia.subtitulo,
      fontWeight: '700',
      lineHeight: 40,
    },
    nombre: { color: t.text, fontSize: tipografia.subtitulo, fontWeight: '600' },
    descripcion: { color: t.muted, fontSize: tipografia.pequeno },
    textos: { flex: 1 },
  });

export default function Indice() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);

  return (
    <Pantalla>
      <Text style={estilos.intro}>
        Elige una aplicación. Su número aparece siempre en el menú lateral.
      </Text>
      {APLICACIONES.map((aplicacion) => (
        <Tarjeta
          key={aplicacion.numero}
          etiqueta={etiquetaAplicacion(aplicacion)}
          onPress={() => router.push(aplicacion.ruta)}
        >
          <View style={estilos.fila}>
            <Text style={[estilos.numero, { backgroundColor: aplicacion.color }]}>{aplicacion.numero}</Text>
            <View style={estilos.textos}>
              <Text style={estilos.nombre}>{aplicacion.nombre}</Text>
              <Text style={estilos.descripcion}>{aplicacion.descripcion}</Text>
            </View>
          </View>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}
