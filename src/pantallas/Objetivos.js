import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { BarraProgreso, Boton, Pantalla, Seccion, Tarjeta, Vacio, useEstilos } from '../componentes/ui';
import { useApp } from '../contexto/ProveedorApp';
import { claveFecha } from '../dominio/fechas';
import { diasRestantes, ESTADOS_OBJETIVO, NOMBRES_ESTADO, progresoObjetivo } from '../dominio/objetivos';
import { colorHabitoParaEsquema } from '../tema/colores';
import { espaciado, tipografia } from '../tema/escalas';

const ORDEN_ESTADOS = [ESTADOS_OBJETIVO.EN_CURSO, ESTADOS_OBJETIVO.COMPLETADO, ESTADOS_OBJETIVO.ABANDONADO];

function textoPlazo(dias) {
  if (dias === null) return 'Sin fecha límite';
  if (dias < 0) return `Venció hace ${-dias} ${-dias === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'Vence hoy';
  return `Faltan ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

export default function Objetivos() {
  const { repos, esquema, version } = useApp();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [filas, setFilas] = useState([]);

  const cargar = useCallback(async () => {
    const hoy = claveFecha();
    const objetivos = await repos.objetivos.listar();
    const habitos = await repos.habitos.listar();
    const registrosPorHabito = {};
    for (const habito of habitos) {
      registrosPorHabito[habito.id] = await repos.registros.deHabito(habito.id);
    }
    setFilas(
      objetivos.map((objetivo) => {
        const delObjetivo = habitos.filter((habito) => habito.objetivoId === objetivo.id);
        return {
          objetivo,
          habitos: delObjetivo,
          progreso: progresoObjetivo(objetivo, delObjetivo, registrosPorHabito, hoy),
          dias: diasRestantes(objetivo, hoy),
        };
      }),
    );
  }, [repos, version]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (filas.length === 0) {
    return (
      <Pantalla>
        <Vacio
          titulo="Sin objetivos todavía"
          texto="Un objetivo agrupa hábitos o tiene su propia fecha límite. Por ejemplo: correr 5 km antes de diciembre."
          accion={{ titulo: 'Crear objetivo', onPress: () => router.push('/objetivo/editar') }}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <Seccion titulo="Mis objetivos" accion={<Boton titulo="Nuevo" onPress={() => router.push('/objetivo/editar')} />} />

      {ORDEN_ESTADOS.map((estado) => {
        const grupo = filas.filter((fila) => fila.objetivo.estado === estado);
        if (grupo.length === 0) return null;
        return (
          <View key={estado} style={estilos.grupo}>
            <Text style={estilos.etiquetaGrupo}>{NOMBRES_ESTADO[estado]}</Text>
            {grupo.map(({ objetivo, habitos, progreso, dias }) => {
              const color = colorHabitoParaEsquema(objetivo.color, esquema);
              return (
                <Tarjeta key={objetivo.id} onPress={() => router.push(`/objetivo/${objetivo.id}`)} etiqueta={`Ver ${objetivo.nombre}`}>
                  <View style={estilos.cabecera}>
                    <View style={[estilos.punto, { backgroundColor: color }]} />
                    <Text style={estilos.nombre} numberOfLines={2}>{objetivo.nombre}</Text>
                    <Text style={estilos.porcentaje}>{progreso} %</Text>
                  </View>
                  <BarraProgreso valor={progreso} color={color} etiqueta={`Progreso de ${objetivo.nombre}`} />
                  <Text style={estilos.detalle}>
                    {textoPlazo(dias)} · {habitos.length} {habitos.length === 1 ? 'hábito' : 'hábitos'}
                  </Text>
                </Tarjeta>
              );
            })}
          </View>
        );
      })}
    </Pantalla>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    grupo: { gap: espaciado.s },
    etiquetaGrupo: { color: t.muted, fontSize: tipografia.pequeno, fontWeight: '600', textTransform: 'uppercase' },
    cabecera: { flexDirection: 'row', alignItems: 'center', gap: espaciado.s },
    punto: { width: 12, height: 12, borderRadius: 6 },
    nombre: { flex: 1, color: t.text, fontSize: tipografia.cuerpo, fontWeight: '600' },
    porcentaje: { color: t.text, fontSize: tipografia.pequeno, fontWeight: '700' },
    detalle: { color: t.muted, fontSize: tipografia.pequeno },
  });
