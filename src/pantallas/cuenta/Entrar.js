import { useState } from 'react';
import { useRouter } from 'expo-router';

import { Boton, Campo, Pantalla } from '../../componentes/ui';
import { obtenerServicioCuenta } from '../../cuenta/cliente';
import { validarCredenciales } from '../../dominio/cuenta';
import { Aviso, SinCuenta } from './comun';

// alEntrar: qué hacer tras entrar (por defecto, volver atrás).
// alSaltar: si se pasa, muestra "Continuar sin cuenta" (lo usa el inicio de sesión de la app).
export default function Entrar({ alEntrar, alSaltar }) {
  const router = useRouter();
  const servicio = obtenerServicioCuenta();
  const [valores, setValores] = useState({ email: '', clave: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(null);

  if (!servicio) {
    return (
      <Pantalla>
        <SinCuenta />
        {alSaltar ? <Boton titulo="Continuar sin cuenta" onPress={alSaltar} /> : null}
      </Pantalla>
    );
  }

  function cambiar(campo) {
    return (texto) => setValores((anterior) => ({ ...anterior, [campo]: texto }));
  }

  async function entrar() {
    const erroresNuevos = validarCredenciales(valores);
    setErrores(erroresNuevos);
    setFallo(null);
    if (Object.keys(erroresNuevos).length > 0) return;

    setEnviando(true);
    try {
      await servicio.iniciarSesion(valores.email, valores.clave);
      if (alEntrar) alEntrar();
      else router.back();
    } catch (error) {
      setFallo(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla>
      <Campo
        etiqueta="Correo electrónico"
        value={valores.email}
        onChangeText={cambiar('email')}
        error={errores.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        editable={!enviando}
      />
      <Campo
        etiqueta="Contraseña"
        value={valores.clave}
        onChangeText={cambiar('clave')}
        error={errores.clave}
        secureTextEntry
        textContentType="password"
        autoComplete="password"
        onSubmitEditing={entrar}
        editable={!enviando}
      />
      {fallo ? <Aviso texto={fallo} error /> : null}
      <Boton titulo={enviando ? 'Entrando…' : 'Entrar'} onPress={entrar} disabled={enviando} />
      <Boton
        titulo="He olvidado la contraseña"
        variante="secundario"
        onPress={() => router.push('/cuenta/recuperar')}
      />
      <Boton titulo="Crear cuenta" variante="secundario" onPress={() => router.replace('/cuenta/alta')} />
      {alSaltar ? <Boton titulo="Continuar sin cuenta" variante="secundario" onPress={alSaltar} /> : null}
      <Aviso texto="Sin cuenta, la app funciona igual: tus hábitos y objetivos se guardan en este móvil." />
    </Pantalla>
  );
}
