import { useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

import { Boton, Campo, Pantalla } from '../../componentes/ui';
import { obtenerServicioCuenta } from '../../cuenta/cliente';
import { extraerTokensRecuperacion } from '../../cuenta/enlaces';
import { validarNuevaClave } from '../../dominio/cuenta';
import { Aviso, SinCuenta } from './comun';

export default function NuevaClave() {
  const router = useRouter();
  const servicio = obtenerServicioCuenta();
  const url = Linking.useURL();
  const tokens = useMemo(() => extraerTokensRecuperacion(url), [url]);
  const [valores, setValores] = useState({ clave: '', repetirClave: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(null);
  const [hecho, setHecho] = useState(false);

  if (!servicio) return <SinCuenta />;

  if (!tokens && !hecho) {
    return (
      <Pantalla>
        <Aviso texto="Este enlace no es válido o ha caducado. Pide uno nuevo." error />
        <Boton titulo="Pedir otro enlace" onPress={() => router.replace('/cuenta/recuperar')} />
      </Pantalla>
    );
  }

  if (hecho) {
    return (
      <Pantalla>
        <Aviso texto="Contraseña cambiada. Ya puedes seguir usando la app." />
        <Boton titulo="Ir a Ajustes" onPress={() => router.replace('/ajustes')} />
      </Pantalla>
    );
  }

  function cambiar(campo) {
    return (texto) => setValores((anterior) => ({ ...anterior, [campo]: texto }));
  }

  async function guardar() {
    const erroresNuevos = validarNuevaClave(valores);
    setErrores(erroresNuevos);
    setFallo(null);
    if (Object.keys(erroresNuevos).length > 0) return;

    setEnviando(true);
    try {
      await servicio.abrirSesionRecuperacion(tokens);
      await servicio.fijarNuevaClave(valores.clave);
      setHecho(true);
    } catch (error) {
      setFallo(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla>
      <Campo
        etiqueta="Contraseña nueva (mínimo 12 caracteres)"
        value={valores.clave}
        onChangeText={cambiar('clave')}
        error={errores.clave}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        editable={!enviando}
      />
      <Campo
        etiqueta="Repite la contraseña nueva"
        value={valores.repetirClave}
        onChangeText={cambiar('repetirClave')}
        error={errores.repetirClave}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        onSubmitEditing={guardar}
        editable={!enviando}
      />
      {fallo ? <Aviso texto={fallo} error /> : null}
      <Boton titulo={enviando ? 'Guardando…' : 'Guardar contraseña'} onPress={guardar} disabled={enviando} />
    </Pantalla>
  );
}
