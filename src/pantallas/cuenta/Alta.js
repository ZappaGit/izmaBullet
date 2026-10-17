import { useState } from 'react';
import { useRouter } from 'expo-router';

import { Boton, Campo, Pantalla } from '../../componentes/ui';
import { obtenerServicioCuenta } from '../../cuenta/cliente';
import { validarAlta } from '../../dominio/cuenta';
import { Aviso, SinCuenta } from './comun';

const CAMPOS_INICIALES = { nombre: '', email: '', clave: '', repetirClave: '' };

export default function Alta() {
  const router = useRouter();
  const servicio = obtenerServicioCuenta();
  const [valores, setValores] = useState(CAMPOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(null);
  const [pendienteConfirmar, setPendienteConfirmar] = useState(false);

  if (!servicio) return <SinCuenta />;

  if (pendienteConfirmar) {
    return (
      <Pantalla>
        <Aviso texto="Te hemos enviado un correo para confirmar tu cuenta. Ábrelo y vuelve a entrar con tu correo y contraseña." />
        <Boton titulo="Ir a entrar" onPress={() => router.replace('/cuenta/entrar')} />
      </Pantalla>
    );
  }

  function cambiar(campo) {
    return (texto) => setValores((anterior) => ({ ...anterior, [campo]: texto }));
  }

  async function crearCuenta() {
    const erroresNuevos = validarAlta(valores);
    setErrores(erroresNuevos);
    setFallo(null);
    if (Object.keys(erroresNuevos).length > 0) return;

    setEnviando(true);
    try {
      const { necesitaConfirmacion } = await servicio.darDeAlta(valores);
      if (necesitaConfirmacion) setPendienteConfirmar(true);
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
        etiqueta="Nombre (opcional)"
        value={valores.nombre}
        onChangeText={cambiar('nombre')}
        error={errores.nombre}
        autoComplete="name"
        textContentType="name"
        editable={!enviando}
      />
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
        etiqueta="Contraseña (mínimo 12 caracteres)"
        value={valores.clave}
        onChangeText={cambiar('clave')}
        error={errores.clave}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        editable={!enviando}
      />
      <Campo
        etiqueta="Repite la contraseña"
        value={valores.repetirClave}
        onChangeText={cambiar('repetirClave')}
        error={errores.repetirClave}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        onSubmitEditing={crearCuenta}
        editable={!enviando}
      />
      {fallo ? <Aviso texto={fallo} error /> : null}
      <Boton titulo={enviando ? 'Creando cuenta…' : 'Crear cuenta'} onPress={crearCuenta} disabled={enviando} />
      <Boton titulo="Ya tengo cuenta" variante="secundario" onPress={() => router.replace('/cuenta/entrar')} />
    </Pantalla>
  );
}
