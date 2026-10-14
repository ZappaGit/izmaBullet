import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { eventosDelDia, estadoPermisoCalendario } from '../calendario/calendario';
import { BarraProgreso, Boton, BotonMarcar, Pantalla, Seccion, Tarjeta, Vacio, useEstilos } from '../componentes/ui';
import { useApp } from '../contexto/ProveedorApp';
import { aparecerEnHoy, calcularRachas, describirFrecuencia, registrosDeLaSemana } from '../dominio/habitos';
import { claveFecha } from '../dominio/fechas';
import { colorHabitoParaEsquema } from '../tema/colores';
import { espaciado, radio, tipografia } from '../tema/escalas';
import { marcarHabito } from '../servicios/acciones';

function formatearHora(fecha) {
  return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function Hoy() {
  const { repos, ajustes, esquema, version, recargar, tema } = useApp();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [activos, setActivos] = useState(0);
  const [filas, setFilas] = useState([]);
  // null = sin permiso de calendario; array = eventos del día.
  const [eventos, setEventos] = useState(null);

  const cargar = useCallback(async () => {
    const hoy = claveFecha();
    const todos = await repos.habitos.listar();
    const habitosActivos = todos.filter((habito) => habito.estado === 'activo');
    const entradas = await Promise.all(
      habitosActivos.map(async (habito) => ({ habito, registros: await repos.registros.deHabito(habito.id) })),
    );

    setActivos(habitosActivos.length);
    setFilas(
      entradas
        .filter(({ habito, registros }) => aparecerEnHoy(habito, registros, hoy))
        .map(({ habito, registros }) => ({
          habito,
          hecho: registros.has(hoy),
          racha: calcularRachas(habito, registros, hoy).actual,
          semana: habito.tipo === 'veces' ? registrosDeLaSemana(registros, hoy) : null,
        })),
    );

    const permiso = await estadoPermisoCalendario();
    setEventos(permiso === 'granted' ? await eventosDelDia(hoy, ajustes.calendarioId) : null);
  }, [repos, ajustes.calendarioId, version]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function alternar(fila) {
    await marcarHabito(repos, fila.habito.id, claveFecha(), !fila.hecho);
    recargar();
  }

  const hechos = filas.filter((fila) => fila.hecho).length;

  return (
    <Pantalla>
      <View style={estilos.resumen}>
        <Text style={estilos.fecha}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        {filas.length > 0 ? (
          <>
            <Text style={estilos.progreso}>
              {hechos} de {filas.length} hechos hoy
            </Text>
            <BarraProgreso valor={(hechos / filas.length) * 100} color={tema.ok} etiqueta={`${hechos} de ${filas.length} hechos`} />
          </>
        ) : null}
      </View>

      {activos === 0 ? (
        <Vacio
          titulo="Aún no tienes hábitos"
          texto="Crea tu primer hábito y aparecerá aquí cada día para marcarlo."
          accion={{ titulo: 'Crear hábito', onPress: () => router.push('/habito/editar') }}
        />
      ) : null}

      {activos > 0 && filas.length === 0 ? (
        <Vacio titulo="Nada pendiente hoy" texto="Tus hábitos de hoy ya están al día. Puedes revisar el histórico en Hábitos." />
      ) : null}

      {filas.map((fila) => {
        const color = colorHabitoParaEsquema(fila.habito.color, esquema);
        const detalle = fila.semana !== null
          ? `${fila.semana} de ${fila.habito.vecesPorSemana} esta semana`
          : `${describirFrecuencia(fila.habito)}${fila.racha > 0 ? ` · racha de ${fila.racha}` : ''}`;
        return (
          <Tarjeta key={fila.habito.id} style={estilos.filaHabito}>
            <View style={[estilos.franja, { backgroundColor: color }]} />
            <View style={estilos.textoFila}>
              <Text style={estilos.nombre} numberOfLines={2}>{fila.habito.nombre}</Text>
              <Text style={estilos.detalle}>{detalle}</Text>
            </View>
            <BotonMarcar
              marcado={fila.hecho}
              color={color}
              onPress={() => alternar(fila)}
              etiqueta={`${fila.hecho ? 'Deshacer' : 'Marcar'} ${fila.habito.nombre}`}
            />
          </Tarjeta>
        );
      })}

      <Seccion titulo="Calendario de hoy">
        {eventos === null ? (
          <Tarjeta>
            <Text style={estilos.detalle}>Conecta tu calendario para ver aquí los eventos del día.</Text>
            <Boton titulo="Ir a Ajustes" variante="secundario" onPress={() => router.push('/ajustes')} />
          </Tarjeta>
        ) : eventos.length === 0 ? (
          <Tarjeta>
            <Text style={estilos.detalle}>No tienes eventos hoy.</Text>
          </Tarjeta>
        ) : (
          eventos.map((evento) => (
            <Tarjeta key={evento.id} style={estilos.filaEvento}>
              <Text style={estilos.hora}>{evento.todoElDia ? 'Todo el día' : formatearHora(evento.inicio)}</Text>
              <Text style={estilos.nombre} numberOfLines={2}>{evento.titulo}</Text>
            </Tarjeta>
          ))
        )}
      </Seccion>
    </Pantalla>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    resumen: { gap: espaciado.s },
    fecha: { color: t.muted, fontSize: tipografia.pequeno, textTransform: 'capitalize' },
    progreso: { color: t.text, fontSize: tipografia.titulo, fontWeight: '700' },
    filaHabito: { flexDirection: 'row', alignItems: 'center', gap: espaciado.s, paddingRight: espaciado.s },
    franja: { width: 6, alignSelf: 'stretch', borderRadius: radio.s },
    textoFila: { flex: 1, gap: espaciado.xs },
    nombre: { color: t.text, fontSize: tipografia.cuerpo, fontWeight: '600' },
    detalle: { color: t.muted, fontSize: tipografia.pequeno },
    filaEvento: { gap: espaciado.xs },
    hora: { color: t.primary, fontSize: tipografia.pequeno, fontWeight: '600' },
  });
