// Recordatorios locales de hábitos (expo-notifications). No necesitan conexión ni servidor.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { parsearHora } from '../dominio/fechas';
import { TIPOS_FRECUENCIA } from '../dominio/habitos';

const CANAL = 'habitos';

// Llamar una vez al arrancar la app.
export function configurarNotificaciones() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Recordatorios de hábitos',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function estadoPermisoNotificaciones() {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function pedirPermisoNotificaciones() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}

export async function cancelarRecordatorios(ids = []) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => null)));
}

// Programa los recordatorios del hábito y devuelve sus ids.
// - días concretos: un aviso semanal por cada día (weekday: 1 = domingo … 7 = sábado).
// - diaria y N veces por semana: un aviso diario a la hora indicada.
// Si el hábito está pausado o archivado no se programa nada.
export async function programarRecordatorios(habito) {
  const hora = parsearHora(habito.recordatorioHora);
  if (!hora || habito.estado !== 'activo') return [];

  const contenido = {
    title: 'IzmaBullet',
    body: `Hoy toca: ${habito.nombre}`,
    data: { habitoId: habito.id },
  };

  if (habito.tipo === TIPOS_FRECUENCIA.DIAS) {
    return Promise.all(
      habito.diasSemana.map((dia) =>
        Notifications.scheduleNotificationAsync({
          content: contenido,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: dia + 1,
            hour: hora.hora,
            minute: hora.minuto,
            channelId: CANAL,
          },
        }),
      ),
    );
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: contenido,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hora.hora,
      minute: hora.minuto,
      channelId: CANAL,
    },
  });
  return [id];
}
