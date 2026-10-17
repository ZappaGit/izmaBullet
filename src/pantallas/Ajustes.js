import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import {
  estadoPermisoCalendario,
  listarCalendariosEscribibles,
  pedirPermisoCalendario,
} from '../calendario/calendario';
import { Boton, Chip, Pantalla, Seccion, Tarjeta, useEstilos } from '../componentes/ui';
import { obtenerServicioCuenta } from '../cuenta/cliente';
import { useApp } from '../contexto/ProveedorApp';
import { estadoPermisoNotificaciones, pedirPermisoNotificaciones } from '../notificaciones/recordatorios';
import { resincronizarCalendario } from '../servicios/acciones';
import { espaciado, tipografia } from '../tema/escalas';

const ETIQUETA_PERMISO = {
  granted: 'Concedido',
  denied: 'Denegado',
  undetermined: 'Sin decidir',
};

const OPCIONES_TEMA = [
  { valor: 'sistema', titulo: 'Automático' },
  { valor: 'claro', titulo: 'Claro' },
  { valor: 'oscuro', titulo: 'Oscuro' },
];

// Explica el permiso antes del diálogo del sistema. Devuelve el estado nuevo, o null si el usuario lo pospuso.
function explicarYPedir(titulo, texto, pedir) {
  return new Promise((resolver) => {
    Alert.alert(titulo, texto, [
      { text: 'Ahora no', style: 'cancel', onPress: () => resolver(null) },
      { text: 'Continuar', onPress: async () => resolver(await pedir()) },
    ]);
  });
}

export default function Ajustes() {
  const { repos, ajustes, guardarAjuste, version } = useApp();
  const estilos = useEstilos(crearEstilos);
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

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function pedirCalendario() {
    const estado = await explicarYPedir(
      'Acceso al calendario',
      'IzmaBullet lo usa para crear los eventos de tus hábitos y las fechas límite de tus objetivos. Los calendarios de tu cuenta de Google aparecen aquí. Solo modificará eventos que cree la propia app.',
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
    if (avisos.length > 0) {
      Alert.alert('Algunos eventos no se actualizaron', avisos.join('\n\n'));
    }
  }

  const calendarioElegido = calendarios.find((calendario) => calendario.id === ajustes.calendarioId);

  return (
    <Pantalla>
      <Seccion titulo="Calendario">
        <Tarjeta>
          <Text style={estilos.texto}>Acceso al calendario: {ETIQUETA_PERMISO[permisoCalendario]}</Text>
          {permisoCalendario !== 'granted' ? (
            <>
              <Text style={estilos.ayuda}>Sin acceso, la app sigue funcionando; solo no crea ni muestra eventos.</Text>
              <Boton titulo="Dar acceso al calendario" onPress={pedirCalendario} />
            </>
          ) : null}
        </Tarjeta>

        {permisoCalendario === 'granted' ? (
          <Tarjeta>
            <Text style={estilos.texto}>Calendario para los eventos nuevos</Text>
            <View style={estilos.fila}>
              <Chip titulo="Ninguno" activo={!calendarioElegido} onPress={() => elegirCalendario(null)} />
              {calendarios.map((calendario) => (
                <Chip
                  key={calendario.id}
                  titulo={calendario.accountName ? `${calendario.title} (${calendario.accountName})` : calendario.title}
                  activo={calendarioElegido?.id === calendario.id}
                  onPress={() => elegirCalendario(calendario.id)}
                />
              ))}
            </View>
            {calendarios.length === 0 ? (
              <Text style={estilos.ayuda}>No hay calendarios donde escribir. Añade una cuenta en los ajustes de Android.</Text>
            ) : null}
          </Tarjeta>
        ) : null}
      </Seccion>

      <Seccion titulo="Notificaciones">
        <Tarjeta>
          <Text style={estilos.texto}>Permiso de recordatorios: {ETIQUETA_PERMISO[permisoNotificaciones]}</Text>
          {permisoNotificaciones !== 'granted' ? (
            <Boton titulo="Permitir recordatorios" variante="secundario" onPress={pedirNotificaciones} />
          ) : null}
        </Tarjeta>
      </Seccion>

      {servicioCuenta ? (
        <Seccion titulo="Cuenta">
          <Tarjeta>
            <Text style={estilos.ayuda}>Opcional. Entra para vincular este móvil a tu cuenta.</Text>
            <Boton titulo="Entrar" variante="secundario" onPress={() => router.push('/cuenta/entrar')} />
            <Boton titulo="Crear cuenta" variante="secundario" onPress={() => router.push('/cuenta/alta')} />
          </Tarjeta>
        </Seccion>
      ) : null}

      <Seccion titulo="Tema">
        <View style={estilos.fila}>
          {OPCIONES_TEMA.map((opcion) => (
            <Chip
              key={opcion.valor}
              titulo={opcion.titulo}
              activo={ajustes.tema === opcion.valor}
              onPress={() => guardarAjuste('tema', opcion.valor)}
            />
          ))}
        </View>
      </Seccion>
    </Pantalla>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    fila: { flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.s },
    texto: { color: t.text, fontSize: tipografia.cuerpo, fontWeight: '600' },
    ayuda: { color: t.muted, fontSize: tipografia.pequeno },
  });
