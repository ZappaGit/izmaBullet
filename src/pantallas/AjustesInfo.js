// Subapp 7: Ajustes e info, estilo Midori. Páginas AJUSTES e INFO.
// Los permisos se explican antes del diálogo del sistema; si se rechazan, la app sigue funcionando.
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';

import { estadoPermisoCalendario, listarCalendariosEscribibles, pedirPermisoCalendario } from '../calendario/calendario';
import { Accion, Hoja, IndiceLateral, Nota, PaginasDeslizables, Subtitulo, TituloPagina, Vineta } from '../componentes/journal';
import { obtenerServicioCuenta } from '../cuenta/cliente';
import { useApp } from '../contexto/ProveedorApp';
import { APLICACIONES, buscarAplicacionPorNumero } from '../dominio/aplicaciones';
import { estadoPermisoNotificaciones, pedirPermisoNotificaciones } from '../notificaciones/recordatorios';
import { resincronizarCalendario } from '../servicios/acciones';

const NUMERO = 7;
const COLOR = buscarAplicacionPorNumero(NUMERO).color;
const ETIQUETA_PERMISO = { granted: 'concedido', denied: 'denegado', undetermined: 'sin decidir' };

function explicarYPedir(titulo, texto, pedir) {
  return new Promise((resolver) => {
    Alert.alert(titulo, texto, [
      { text: 'Ahora no', style: 'cancel', onPress: () => resolver(null) },
      { text: 'Continuar', onPress: async () => resolver(await pedir()) },
    ]);
  });
}

function PaginaAjustes({ primera }) {
  const { repos, ajustes, guardarAjuste, version } = useApp();
  const router = useRouter();
  const servicioCuenta = obtenerServicioCuenta();
  const [permisoCalendario, setPermisoCalendario] = useState('undetermined');
  const [permisoNotificaciones, setPermisoNotificaciones] = useState('undetermined');
  const [calendarios, setCalendarios] = useState([]);

  const cargar = useCallback(async () => {
    const calendario = await estadoPermisoCalendario();
    setPermisoCalendario(calendario);
    setPermisoNotificaciones(await estadoPermisoNotificaciones());
    setCalendarios(calendario === 'granted' ? await listarCalendariosEscribibles() : []);
  }, [version]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function pedirCalendario() {
    const estado = await explicarYPedir(
      'Acceso al calendario',
      'IzmaBullet lo usa para crear los eventos de tus hábitos y las fechas límite de tus objetivos. Solo modificará eventos que cree la propia app.',
      pedirPermisoCalendario,
    );
    if (estado) await cargar();
  }

  async function pedirNotificaciones() {
    const estado = await explicarYPedir(
      'Recordatorios',
      'Para avisarte a la hora de tus hábitos. Son avisos locales, no salen de tu móvil.',
      pedirPermisoNotificaciones,
    );
    if (estado) await cargar();
  }

  async function elegirCalendario(calendarioId) {
    await guardarAjuste('calendarioId', calendarioId ?? '');
    const avisos = await resincronizarCalendario(repos, calendarioId);
    if (avisos.length > 0) Alert.alert('Algunos eventos no se actualizaron', avisos.join('\n\n'));
  }

  const elegido = calendarios.find((calendario) => calendario.id === ajustes.calendarioId);

  return (
    <>
      {primera ? <IndiceLateral actual={NUMERO} /> : null}
      <Hoja>
        <TituloPagina color={COLOR}>Ajustes</TituloPagina>

        <Subtitulo>calendario</Subtitulo>
        <Nota>Acceso: {ETIQUETA_PERMISO[permisoCalendario]}</Nota>
        {permisoCalendario !== 'granted' ? (
          <>
            <Nota>Sin acceso, la app sigue funcionando; solo no crea ni muestra eventos.</Nota>
            <Accion titulo="dar acceso" color={COLOR} onPress={pedirCalendario} />
          </>
        ) : (
          <>
            <Nota>Calendario para los eventos nuevos:</Nota>
            <Vineta marca={!elegido ? '●' : '○'} colorMarca={COLOR} onMarca={() => elegirCalendario(null)} etiquetaMarca="Ninguno">
              ninguno
            </Vineta>
            {calendarios.map((calendario) => (
              <Vineta
                key={calendario.id}
                marca={elegido?.id === calendario.id ? '●' : '○'}
                colorMarca={COLOR}
                onMarca={() => elegirCalendario(calendario.id)}
                etiquetaMarca={calendario.title}
                detalle={calendario.accountName}
              >
                {calendario.title}
              </Vineta>
            ))}
          </>
        )}

        <Subtitulo>recordatorios</Subtitulo>
        <Nota>Permiso: {ETIQUETA_PERMISO[permisoNotificaciones]}</Nota>
        {permisoNotificaciones !== 'granted' ? (
          <Accion titulo="permitir recordatorios" color={COLOR} onPress={pedirNotificaciones} />
        ) : null}

        {servicioCuenta ? (
          <>
            <Subtitulo>cuenta</Subtitulo>
            <Nota>Opcional. Entra para vincular este móvil a tu cuenta.</Nota>
            <Accion titulo="entrar" color={COLOR} onPress={() => router.push('/cuenta/entrar')} />
            <Accion titulo="crear cuenta" color={COLOR} onPress={() => router.push('/cuenta/alta')} />
          </>
        ) : null}
      </Hoja>
    </>
  );
}

function PaginaInfo() {
  const version = Constants.expoConfig?.version ?? '—';
  return (
    <Hoja>
      <TituloPagina color={COLOR}>Info</TituloPagina>
      <Nota>IzmaBullet es un cuaderno de subapps. Funciona sin conexión y sin cuenta: tus datos se guardan en este móvil.</Nota>
      <Subtitulo>subapps</Subtitulo>
      {APLICACIONES.map((aplicacion) => (
        <Vineta key={aplicacion.numero} detalle={aplicacion.disponible ? null : 'próximamente'}>
          [{aplicacion.numero}] {aplicacion.nombre}
        </Vineta>
      ))}
      <Subtitulo>versión</Subtitulo>
      <Nota>{version}</Nota>
    </Hoja>
  );
}

export default function AjustesInfo() {
  return (
    <PaginasDeslizables
      paginas={[
        { clave: 'ajustes', contenido: (primera) => <PaginaAjustes primera={primera} /> },
        { clave: 'info', contenido: () => <PaginaInfo /> },
      ]}
    />
  );
}
