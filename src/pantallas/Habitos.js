import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Boton, Chip, Pantalla, Seccion, Tarjeta, Vacio, useEstilos } from '../componentes/ui';
import { useApp } from '../contexto/ProveedorApp';
import { claveFecha } from '../dominio/fechas';
import { calcularRachas, cumplimiento, describirFrecuencia } from '../dominio/habitos';
import { colorHabitoParaEsquema } from '../tema/colores';
import { espaciado, radio, tipografia } from '../tema/escalas';

const ETIQUETA_ESTADO = { activo: 'Activos', pausado: 'Pausados', archivado: 'Archivados' };

export default function Habitos() {
  const { repos, esquema, version } = useApp();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [filas, setFilas] = useState([]);

  const cargar = useCallback(async () => {
    const hoy = claveFecha();
    const todos = await repos.habitos.listar({ incluirArchivados: true });
    const datos = await Promise.all(
      todos.map(async (habito) => {
        const registros = await repos.registros.deHabito(habito.id);
        return {
          habito,
          racha: calcularRachas(habito, registros, hoy),
          cumple7: cumplimiento(habito, registros, hoy, 7),
        };
      }),
    );
    setFilas(datos);
  }, [repos, version]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const visibles = filas.filter((fila) => mostrarArchivados || fila.habito.estado !== 'archivado');
  const grupos = ['activo', 'pausado', 'archivado'].filter(
    (estado) => (estado !== 'archivado' || mostrarArchivados) && visibles.some((fila) => fila.habito.estado === estado),
  );

  if (filas.length === 0) {
    return (
      <Pantalla>
        <Vacio
          titulo="Todavía no hay hábitos"
          texto="Un hábito es algo que quieres repetir: leer, caminar, beber agua. Empieza con uno pequeño."
          accion={{ titulo: 'Crear hábito', onPress: () => router.push('/habito/editar') }}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <Seccion titulo="Mis hábitos" accion={<Boton titulo="Nuevo" onPress={() => router.push('/habito/editar')} />}>
        <View style={estilos.chips}>
          <Chip
            titulo={mostrarArchivados ? 'Ocultar archivados' : 'Ver archivados'}
            activo={mostrarArchivados}
            onPress={() => setMostrarArchivados(!mostrarArchivados)}
          />
        </View>
      </Seccion>

      {grupos.map((estado) => (
        <View key={estado} style={estilos.grupo}>
          <Text style={estilos.etiquetaGrupo}>{ETIQUETA_ESTADO[estado]}</Text>
          {visibles
            .filter((fila) => fila.habito.estado === estado)
            .map(({ habito, racha, cumple7 }) => (
              <Tarjeta
                key={habito.id}
                onPress={() => router.push(`/habito/${habito.id}`)}
                etiqueta={`Ver ${habito.nombre}`}
                style={estilos.fila}
              >
                <View style={estilos.cabeceraFila}>
                  <View style={[estilos.punto, { backgroundColor: colorHabitoParaEsquema(habito.color, esquema) }]} />
                  <Text style={estilos.nombre} numberOfLines={2}>{habito.nombre}</Text>
                </View>
                <Text style={estilos.detalle}>{describirFrecuencia(habito)}</Text>
                <Text style={estilos.detalle}>
                  Racha: {racha.actual} · Mejor: {racha.mejor} · 7 días: {cumple7 === null ? '—' : `${cumple7} %`}
                </Text>
              </Tarjeta>
            ))}
        </View>
      ))}
    </Pantalla>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    chips: { flexDirection: 'row' },
    grupo: { gap: espaciado.s },
    etiquetaGrupo: { color: t.muted, fontSize: tipografia.pequeno, fontWeight: '600', textTransform: 'uppercase' },
    fila: { gap: espaciado.xs, borderRadius: radio.l },
    cabeceraFila: { flexDirection: 'row', alignItems: 'center', gap: espaciado.s },
    punto: { width: 12, height: 12, borderRadius: 6 },
    nombre: { flex: 1, color: t.text, fontSize: tipografia.cuerpo, fontWeight: '600' },
    detalle: { color: t.muted, fontSize: tipografia.pequeno },
  });
