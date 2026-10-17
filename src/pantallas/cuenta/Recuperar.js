import { useState } from 'react';
import { useRouter } from 'expo-router';

import { Boton, Campo, Pantalla } from '../../componentes/ui';
import { obtenerServicioCuenta } from '../../cuenta/cliente';
import { validarRecuperacion } from '../../dominio/cuenta';
import { Aviso, SinCuenta } from './comun';

export default function Recuperar() {
  const router = useRouter();
  const servicio = obtenerServicioCuenta();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [fallo, setFallo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  if (!servicio) return <SinCuenta />;

  if (enviado) {
    return (
      <Pantalla>
        <Aviso texto="Si hay una cuenta con ese correo, te hemos enviado un enlace para crear una contraseña nueva. Revisa también la carpeta de spam." />
        <Boton titulo="Volver a entrar" onPress={() => router.replace('/cuenta/entrar')} />
      </Pantalla>
    );
  }

  async function pedirEnlace() {
    const erroresNuevos = validarRecuperacion({ email });
    setError(erroresNuevos.email ?? null);
    setFallo(null);
    if (erroresNuevos.email) return;

    setEnviando(true);
    try {
      await servicio.pedirRecuperacion(email);
      setEnviado(true);
    } catch (fallido) {
      setFallo(fallido.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla>
      <Aviso texto="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva." />
      <Campo
        etiqueta="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        error={error}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        onSubmitEditing={pedirEnlace}
        editable={!enviando}
      />
      {fallo ? <Aviso texto={fallo} error /> : null}
      <Boton titulo={enviando ? 'Enviando…' : 'Enviar enlace'} onPress={pedirEnlace} disabled={enviando} />
    </Pantalla>
  );
}
