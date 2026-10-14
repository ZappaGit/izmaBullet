import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { BarraProgreso, Boton, Chip, Pantalla, Seccion, Tarjeta, useEstilos } from '../componentes/ui';
import { useApp } from '../contexto/ProveedorApp';
import { claveFecha } from '../dominio/fechas';
import { calcularRachas, cumplimiento } from '../dominio/habitos';
import { diasRestantes, ESTADOS_OBJETIVO, MODOS_OBJETIVO, NOMBRES_ESTADO, progresoObjetivo } from '../dominio/objetivos';
import { cambiarEstadoObjetivo, fijarProgresoManual } from '../servicios/acciones';
import { colorHabitoParaEsquema } from '../tema/colores';
import { espaciado, tipografia } from '../tema/escalas';

export default function ObjetivoDetalle() {
  const { id } = useLocalSearchParams();
  const { repos, esquema, ajustes, version, recargar } = useApp();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [datos, setDatos] = useState(null);

  const cargar = useCallback(async () => {
    const objetivo = await repos.objetivos.obtener(Number(id));
    if (!objetivo) {
      setDatos({ objetivo: null });
      return;
    }
    const hoy = claveFecha();
    const todos = await repos.habitos.listar();
    const habitos = todos.filter((habito) => habito.objetivoId === objetivo.id);
    const registrosPorHabito = {};
    for (const habito of habitos) {
      registrosPorHabito[habito.id] = await repos.registros.deHabito(habito.id);
    }
    setDatos({
      objetivo,
      habitos: habitos.map((habito) => ({
        habito,
        racha: calcularRachas(habito, registrosPorHabito[habito.id], hoy).actual,
        cumple30: cumplimiento(habito, registrosPorHabito[habito.id], hoy, 30),
      })),
      progreso: progresoObjetivo(objetivo, habitos, registrosPorHabito, hoy),
      dias: diasRestantes(objetivo, hoy),
    });
  }, [repos, id, version]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (!datos) return null;

  if (!datos.objetivo) {
    return (
      <Pantalla>
        <Text style={estilos.texto}>Este objetivo ya no existe.</Text>
      </Pantalla>
    );
  }

  const { objetivo, habitos, progreso, dias } = datos;
  const color = colorHabitoParaEsquema(objetivo.color, esquema);
  const enCurso = objetivo.estado === ESTADOS_OBJETIVO.EN_CURSO;

  async function cambiarEstado(estado) {
    await cambiarEstadoObjetivo(repos, objetivo, estado, ajustes.calendarioId);
    recargar();
  }

  async function ajustarProgreso(delta) {
    await fijarProgresoManual(repos, objetivo.id, objetivo.progresoManual + delta);
    recargar();
  }

  return (
    <Pantalla>
      <Stack.Screen options={{ title: objetivo.nombre }} />

      <View style={estilos.cabecera}>
        <View style={[estilos.punto, { backgroundColor: color }]} />
        <Text style={estilos.nombre}>{objetivo.nombre}</Text>
      </View>
      <Text style={estilos.detalle}>
        {NOMBRES_ESTADO[objetivo.estado]} ·{' '}
        {objetivo.modo === MODOS_OBJETIVO.MANUAL ? 'progreso manual' : 'progreso según sus hábitos'}
        {dias === null ? '' : ` · ${dias < 0 ? 'vencido' : `${dias} días para la fecha límite`}`}
      </Text>
      {objetivo.descripcion ? <Text style={estilos.texto}>{objetivo.descripcion}</Text> : null}

      <Seccion titulo={`Progreso: ${progreso} %`}>
        <BarraProgreso valor={progreso} color={color} etiqueta={`Progreso de ${objetivo.nombre}`} />
        {objetivo.modo === MODOS_OBJETIVO.MANUAL && enCurso ? (
          <View style={estilos.fila}>
            <Chip titulo="−10" onPress={() => ajustarProgreso(-10)} />
            <Chip titulo="+10" onPress={() => ajustarProgreso(10)} />
          </View>
        ) : null}
        {objetivo.modo === MODOS_OBJETIVO.HABITOS ? (
          <Text style={estilos.detalle}>Media del cumplimiento de sus hábitos en los últimos 30 días.</Text>
        ) : null}
      </Seccion>

      <Seccion titulo="Hábitos">
        {habitos.length === 0 ? (
          <Tarjeta>
            <Text style={estilos.detalle}>
              Ningún hábito apunta aquí todavía. Edita un hábito y elige este objetivo.
            </Text>
          </Tarjeta>
        ) : (
          habitos.map(({ habito, racha, cumple30 }) => (
            <Tarjeta key={habito.id} onPress={() => router.push(`/habito/${habito.id}`)} etiqueta={`Ver ${habito.nombre}`}>
              <Text style={estilos.nombreHabito}>{habito.nombre}</Text>
              <Text style={estilos.detalle}>
                Racha: {racha} · 30 días: {cumple30 === null ? '—' : `${cumple30} %`}
              </Text>
            </Tarjeta>
          ))
        )}
      </Seccion>

      <Seccion titulo="Acciones">
        <Boton titulo="Editar" variante="secundario" onPress={() => router.push(`/objetivo/editar?id=${objetivo.id}`)} />
        {enCurso ? (
          <>
            <Boton titulo="Marcar como completado" onPress={() => cambiarEstado(ESTADOS_OBJETIVO.COMPLETADO)} />
            <Boton titulo="Abandonar" variante="peligro" onPress={() => cambiarEstado(ESTADOS_OBJETIVO.ABANDONADO)} />
          </>
        ) : (
          <Boton titulo="Volver a ponerlo en curso" variante="secundario" onPress={() => cambiarEstado(ESTADOS_OBJETIVO.EN_CURSO)} />
        )}
      </Seccion>
    </Pantalla>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    cabecera: { flexDirection: 'row', alignItems: 'center', gap: espaciado.s },
    punto: { width: 14, height: 14, borderRadius: 7 },
    nombre: { flex: 1, color: t.text, fontSize: tipografia.titulo, fontWeight: '700' },
    detalle: { color: t.muted, fontSize: tipografia.pequeno },
    texto: { color: t.text, fontSize: tipografia.cuerpo },
    nombreHabito: { color: t.text, fontSize: tipografia.cuerpo, fontWeight: '600' },
    fila: { flexDirection: 'row', gap: espaciado.s },
  });
