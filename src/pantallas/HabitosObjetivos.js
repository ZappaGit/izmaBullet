// Subapp 6: Hábitos y objetivos, estilo Midori. Dos páginas deslizables: HÁBITOS y OBJETIVOS.
// La lógica (frecuencias, rachas, progreso, recordatorios, calendario) es la de src/dominio y servicios.
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { Accion, Hoja, IndiceLateral, Nota, PaginasDeslizables, Subtitulo, TituloPagina, Vineta } from '../componentes/journal';
import { useApp } from '../contexto/ProveedorApp';
import { buscarAplicacionPorNumero } from '../dominio/aplicaciones';
import { claveFecha } from '../dominio/fechas';
import { aparecerEnHoy, calcularRachas, cumplimiento, describirFrecuencia, registrosDeLaSemana } from '../dominio/habitos';
import { diasRestantes, ESTADOS_OBJETIVO, NOMBRES_ESTADO, progresoObjetivo } from '../dominio/objetivos';
import { marcarHabito } from '../servicios/acciones';

const NUMERO = 6;
const COLOR = buscarAplicacionPorNumero(NUMERO).color;
const ESTADOS_HABITO = [
  ['activo', 'activos'],
  ['pausado', 'pausados'],
  ['archivado', 'archivados'],
];
const ORDEN_OBJETIVOS = [ESTADOS_OBJETIVO.EN_CURSO, ESTADOS_OBJETIVO.COMPLETADO, ESTADOS_OBJETIVO.ABANDONADO];

function textoPlazo(dias) {
  if (dias === null) return 'sin fecha límite';
  if (dias < 0) return `venció hace ${-dias} ${-dias === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'vence hoy';
  return `faltan ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

// Carga hábitos, registros y objetivos una vez para las dos páginas.
function useDatos() {
  const { repos, version } = useApp();
  const [datos, setDatos] = useState({ habitos: [], objetivos: [], registros: {} });

  const cargar = useCallback(async () => {
    const habitos = await repos.habitos.listar({ incluirArchivados: true });
    const registros = {};
    for (const habito of habitos) registros[habito.id] = await repos.registros.deHabito(habito.id);
    const objetivos = await repos.objetivos.listar();
    setDatos({ habitos, objetivos, registros });
  }, [repos, version]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  return datos;
}

// Primera página. Los hábitos activos que tocan hoy llevan ○ / ● para marcar el día.
function PaginaHabitos({ datos, primera }) {
  const { repos, recargar } = useApp();
  const router = useRouter();
  const hoy = claveFecha();

  async function alternar(habito) {
    await marcarHabito(repos, habito.id, hoy, !datos.registros[habito.id].has(hoy));
    recargar();
  }

  return (
    <>
      {primera ? <IndiceLateral actual={NUMERO} /> : null}
      <Hoja>
        <TituloPagina color={COLOR}>Hábitos</TituloPagina>
        <Accion titulo="+ nuevo hábito" color={COLOR} onPress={() => router.push('/habito/editar')} />
        {datos.habitos.length === 0 ? <Nota>Aún no tienes hábitos.</Nota> : null}
        {ESTADOS_HABITO.map(([estado, titulo]) => {
          const grupo = datos.habitos.filter((habito) => habito.estado === estado);
          if (grupo.length === 0) return null;
          return [
            <Subtitulo key={`t-${estado}`}>{titulo}</Subtitulo>,
            ...grupo.map((habito) => {
              const registros = datos.registros[habito.id];
              const racha = calcularRachas(habito, registros, hoy);
              const cumple7 = cumplimiento(habito, registros, hoy, 7);
              const tocaHoy = estado === 'activo' && aparecerEnHoy(habito, registros, hoy);
              const hecho = registros.has(hoy);
              const frecuencia = habito.tipo === 'veces'
                ? `${registrosDeLaSemana(registros, hoy)} de ${habito.vecesPorSemana} esta semana`
                : describirFrecuencia(habito);
              return (
                <Vineta
                  key={habito.id}
                  {...(tocaHoy
                    ? {
                      marca: hecho ? '●' : '○',
                      colorMarca: COLOR,
                      onMarca: () => alternar(habito),
                      etiquetaMarca: `${hecho ? 'Deshacer' : 'Marcar'} ${habito.nombre} hoy`,
                    }
                    : {})}
                  detalle={`${frecuencia} · racha ${racha.actual} · 7 días ${cumple7 === null ? '—' : `${cumple7} %`}`}
                  onPress={() => router.push(`/habito/${habito.id}`)}
                >
                  {habito.nombre}
                </Vineta>
              );
            }),
          ];
        })}
      </Hoja>
    </>
  );
}

function PaginaObjetivos({ datos }) {
  const router = useRouter();
  const hoy = claveFecha();
  return (
    <Hoja>
      <TituloPagina color={COLOR}>Objetivos</TituloPagina>
      <Accion titulo="+ nuevo objetivo" color={COLOR} onPress={() => router.push('/objetivo/editar')} />
      {ORDEN_OBJETIVOS.map((estado) => {
        const grupo = datos.objetivos.filter((objetivo) => objetivo.estado === estado);
        if (grupo.length === 0) return null;
        return [
          <Subtitulo key={`t-${estado}`}>{NOMBRES_ESTADO[estado].toLowerCase()}</Subtitulo>,
          ...grupo.map((objetivo) => {
            const delObjetivo = datos.habitos.filter((habito) => habito.objetivoId === objetivo.id);
            const progreso = progresoObjetivo(objetivo, delObjetivo, datos.registros, hoy);
            return (
              <Vineta
                key={objetivo.id}
                detalle={`${progreso} % · ${textoPlazo(diasRestantes(objetivo, hoy))}`}
                onPress={() => router.push(`/objetivo/${objetivo.id}`)}
              >
                {objetivo.nombre}
              </Vineta>
            );
          }),
        ];
      })}
    </Hoja>
  );
}

export default function HabitosObjetivos() {
  const datos = useDatos();
  return (
    <PaginasDeslizables
      paginas={[
        { clave: 'habitos', contenido: (primera) => <PaginaHabitos datos={datos} primera={primera} /> },
        { clave: 'objetivos', contenido: () => <PaginaObjetivos datos={datos} /> },
      ]}
    />
  );
}
