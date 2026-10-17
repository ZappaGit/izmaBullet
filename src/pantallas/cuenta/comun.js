// Piezas comunes de las pantallas de cuenta.
import { StyleSheet, Text } from 'react-native';

import { Vacio, useEstilos } from '../../componentes/ui';
import { tipografia } from '../../tema/escalas';

const crearEstilosAviso = (t) =>
  StyleSheet.create({
    base: { fontSize: tipografia.cuerpo, lineHeight: 22, textAlign: 'center' },
    normal: { color: t.text },
    error: { color: t.danger },
  });

// Mensaje de estado del formulario. Con `error` se pinta en rojo y se anuncia como alerta.
export function Aviso({ texto, error = false }) {
  const estilos = useEstilos(crearEstilosAviso);
  return (
    <Text
      accessibilityLiveRegion="polite"
      accessibilityRole={error ? 'alert' : 'text'}
      style={[estilos.base, error ? estilos.error : estilos.normal]}
    >
      {texto}
    </Text>
  );
}

// Se muestra cuando la app se compiló sin la configuración de Supabase.
export function SinCuenta() {
  return (
    <Vacio
      titulo="Cuenta no disponible"
      texto="Esta versión de la app no tiene configurado el servicio de cuentas. Todo lo demás funciona igual sin cuenta."
    />
  );
}
