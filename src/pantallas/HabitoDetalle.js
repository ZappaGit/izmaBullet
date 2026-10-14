import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { Boton, BotonMarcar, Chip, Pantalla, Seccion, Tarjeta, useEstilos } from '../componentes/ui';
import { useApp } from '../contexto/ProveedorApp';
import { claveFecha, ultimosDias } from '../dominio/fechas';
import { calcularRachas, cumplimiento, describirFrecuencia, esProgramadoEl } from '../dominio/habitos';
import { cambiarEstadoHabito, marcarHabito } from '../servicios/acciones';
import { colorHabitoParaEsquema } from '../tema/colores';
import { espaciado, tipografia } from '../tema/escalas';

const DIAS_HISTORIAL = 14;

export default function HabitoDetalle() {
  const { id } = useLocalSearchParams();
  const { repos, esquema, ajustes, version, recargar } = useApp();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [datos, setDatos] = useState(null);

  const cargar = useCallback(async () => {
    const habito = await repos.habitos.obtener(Number(id));
    if (!habito) {
      setDatos({ habito: null });
      return;
    }
    const hoy = claveFecha();
    const registros = await repos.registros.deHabito(habito.id);
    const objetivo = habito.objetivoId ? await repos.objetivos.obtener(habito.objetivoId) : null;
    setDatos({
      habito,
      objetivo,
      registros,
      hoy,
      racha: calcularRachas(habito, registros, hoy),
      cumple7: cumplimiento(habito, registros, hoy, 7),
      cumple30: cumplimiento(habito, registros, hoy, 30),
      historial: ultimosDias(hoy, DIAS_HISTORIAL).reverse(),
    });
  }, [repos, id, version]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (!datos) return null;

  if (!datos.habito) {
    return (
      <Pantalla>
        <Text style={estilos.texto}>Este hábito ya no existe.</Text>
      </Pantalla>
    );
  }

  const { habito, objetivo, registros, hoy, racha, cumple7, cumple30, historial } = datos;
  const color = colorHabitoParaEsquema(habito.color, esquema);

  async function alternarDia(fecha) {
    await marcarHabito(repos, habito.id, fecha, !registros.has(fecha));
    recargar();
  }

  async function cambiarEstado(estado) {
    await cambiarEstadoHabito(repos, habito, estado, ajustes.calendarioId);
    recargar();
  }

  function archivar() {
    Alert.alert(
      'Archivar hábito',
      'Dejará de aparecer en Hoy y se quitarán sus recordatorios y su evento del calendario. Su histórico se conserva.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: async () => {
            await cambiarEstadoHabito(repos, habito, 'archivado', ajustes.calendarioId);
            recargar();
            router.back();
          },
        },
      ],
    );
  }

  return (
    <Pantalla>
      <Stack.Screen options={{ title: habito.nombre }} />

      <View style={estilos.cabecera}>
        <View style={[estilos.punto, { backgroundColor: color }]} />
        <Text style={estilos.nombre}>{habito.nombre}</Text>
      </View>
      <Text style={estilos.detalle}>
        {describirFrecuencia(habito)}
        {habito.recordatorioHora ? ` · recordatorio a las ${habito.recordatorioHora}` : ''}
      </Text>
      <Text style={estilos.detalle}>
        Estado: {habito.estado}
        {habito.sincronizaCalendario ? ' · en el calendario' : ''}
      </Text>

      {objetivo ? (
        <Chip titulo={`Objetivo: ${objetivo.nombre}`} activo={false} onPress={() => router.push(`/objetivo/${objetivo.id}`)} />
      ) : null}

      <Seccion titulo="Estadísticas">
        <Tarjeta>
          <View style={estilos.estadisticas}>
            <Estadistica etiqueta="Racha actual" valor={racha.actual} estilos={estilos} />
            <Estadistica etiqueta="Mejor racha" valor={racha.mejor} estilos={estilos} />
            <Estadistica etiqueta="Últimos 7 días" valor={cumple7 === null ? '—' : `${cumple7} %`} estilos={estilos} />
            <Estadistica etiqueta="Últimos 30 días" valor={cumple30 === null ? '—' : `${cumple30} %`} estilos={estilos} />
          </View>
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Últimos 14 días">
        <Text style={estilos.ayuda}>Toca el círculo para marcar o deshacer un día.</Text>
        {historial.map((fecha) => {
          const marcado = registros.has(fecha);
          if (!esProgramadoEl(habito, fecha) && !marcado) return null;
          return (
            <Tarjeta key={fecha} style={estilos.filaHistorial}>
              <Text style={estilos.fechaHistorial}>
                {fecha === hoy
                  ? 'Hoy'
                  : new Date(`${fecha}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
              <BotonMarcar
                marcado={marcado}
                color={color}
                onPress={() => alternarDia(fecha)}
                etiqueta={`${marcado ? 'Deshacer' : 'Marcar'} ${habito.nombre} el ${fecha}`}
              />
            </Tarjeta>
          );
        })}
        {habito.tipo === 'veces' ? (
          <Text style={estilos.ayuda}>Con hábitos por semana puedes marcar cualquier día de los últimos 14.</Text>
        ) : null}
      </Seccion>

      <Seccion titulo="Acciones">
        <Boton titulo="Editar" variante="secundario" onPress={() => router.push(`/habito/editar?id=${habito.id}`)} />
        {habito.estado !== 'archivado' ? (
          <Boton
            titulo={habito.estado === 'activo' ? 'Pausar' : 'Reanudar'}
            variante="secundario"
            onPress={() => cambiarEstado(habito.estado === 'activo' ? 'pausado' : 'activo')}
          />
        ) : null}
        {habito.estado !== 'archivado' ? <Boton titulo="Archivar" variante="peligro" onPress={archivar} /> : null}
        {habito.estado === 'archivado' ? (
          <Boton titulo="Volver a activarlo" variante="secundario" onPress={() => cambiarEstado('activo')} />
        ) : null}
      </Seccion>
    </Pantalla>
  );
}

function Estadistica({ etiqueta, valor, estilos }) {
  return (
    <View style={estilos.estadistica}>
      <Text style={estilos.valorEstadistica}>{valor}</Text>
      <Text style={estilos.ayuda}>{etiqueta}</Text>
    </View>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    cabecera: { flexDirection: 'row', alignItems: 'center', gap: espaciado.s },
    punto: { width: 14, height: 14, borderRadius: 7 },
    nombre: { flex: 1, color: t.text, fontSize: tipografia.titulo, fontWeight: '700' },
    detalle: { color: t.muted, fontSize: tipografia.pequeno },
    texto: { color: t.text, fontSize: tipografia.cuerpo },
    ayuda: { color: t.muted, fontSize: tipografia.pequeno },
    estadisticas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.m },
    estadistica: { width: '45%', gap: espaciado.xs },
    valorEstadistica: { color: t.text, fontSize: tipografia.titulo, fontWeight: '700' },
    filaHistorial: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: espaciado.xs },
    fechaHistorial: { color: t.text, fontSize: tipografia.cuerpo },
  });
