// Primera pantalla al abrir la app: nombre de la app y paso al inicio de sesión.
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Boton, useEstilos } from '../componentes/ui';
import { espaciado, tipografia } from '../tema/escalas';

const crearEstilos = (t) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: t.bg, padding: espaciado.l, justifyContent: 'center', gap: espaciado.l },
    nombre: { color: t.text, fontSize: tipografia.titulo, fontWeight: '700', textAlign: 'center' },
  });

export default function Inicio() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.nombre}>IzmaBullet</Text>
      <Boton titulo="Empezar" onPress={() => router.replace('/acceso')} />
    </View>
  );
}
