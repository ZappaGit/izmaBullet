// Pantalla de carga (Carga Midori B): papel con puntos y anillas y el nombre "IzmA Bullet".
// Pasa sola al Índice cuando la fuente está lista y ha pasado un tiempo mínimo.
// El login (/acceso) queda fuera del flujo hasta que se active (RF-ARR-3).
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';

import { Papel, estilosJournal } from '../componentes/journal';

const TIEMPO_MINIMO_MS = 1200;

export default function Inicio() {
  const router = useRouter();
  const [fuenteLista, errorFuente] = useFonts({ PatrickHand_400Regular });
  const [tiempoCumplido, setTiempoCumplido] = useState(false);

  useEffect(() => {
    const temporizador = setTimeout(() => setTiempoCumplido(true), TIEMPO_MINIMO_MS);
    return () => clearTimeout(temporizador);
  }, []);

  useEffect(() => {
    // Si la fuente falla, se sigue con la del sistema: la app no se queda en la carga.
    if (tiempoCumplido && (fuenteLista || errorFuente)) router.replace('/indice');
  }, [tiempoCumplido, fuenteLista, errorFuente, router]);

  return (
    <Papel anillas="izquierda">
      <View style={estilos.centro} accessibilityRole="header" accessibilityLabel="IzmaBullet">
        <Text style={[estilosJournal.texto, estilos.izma]}>IzmA</Text>
        <Text style={[estilosJournal.texto, estilos.bullet]}>Bullet</Text>
      </View>
    </Papel>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', paddingLeft: 56 },
  izma: { fontSize: 64, letterSpacing: 2 },
  bullet: { fontSize: 36, marginLeft: 4, marginTop: -8 },
});
