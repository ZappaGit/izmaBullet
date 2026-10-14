import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { estadoPermisoCalendario, pedirPermisoCalendario } from '../calendario/calendario';
import { Boton, Campo, Chip, Pantalla, Seccion, SelectorColor, Tarjeta, useEstilos } from '../componentes/ui';
import { useApp } from '../contexto/ProveedorApp';
import { NOMBRES_DIAS, TIPOS_FRECUENCIA } from '../dominio/habitos';
import { estadoPermisoNotificaciones, pedirPermisoNotificaciones } from '../notificaciones/recordatorios';
import { guardarHabito } from '../servicios/acciones';
import { coloresHabito } from '../tema/colores';
import { espaciado, tipografia } from '../tema/escalas';

// Orden de la semana en el formulario: lunes primero. Los valores siguen Date.getDay (0 = domingo).
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

const FORMULARIO_VACIO = {
  nombre: '',
  tipo: TIPOS_FRECUENCIA.DIARIA,
  diasSemana: [],
  vecesPorSemana: '3',
  recordatorioHora: '',
  color: coloresHabito.claro[0],
  objetivoId: null,
  sincronizaCalendario: false,
};

// Explica el permiso antes del diálogo del sistema. "Ahora no" no bloquea el guardado.
function explicarYPedir(titulo, texto, pedir) {
  return new Promise((resolver) => {
    Alert.alert(titulo, texto, [
      { text: 'Ahora no', style: 'cancel', onPress: () => resolver(false) },
      {
        text: 'Continuar',
        onPress: async () => {
          await pedir();
          resolver(true);
        },
      },
    ]);
  });
}

export default function HabitoEditar() {
  const { id } = useLocalSearchParams();
  const esNuevo = !id;
  const { repos, ajustes, recargar } = useApp();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [objetivos, setObjetivos] = useState([]);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      setObjetivos((await repos.objetivos.listar()).filter((objetivo) => objetivo.estado === 'en_curso'));
      if (!esNuevo) {
        const habito = await repos.habitos.obtener(Number(id));
        if (habito) {
          setFormulario({
            nombre: habito.nombre,
            tipo: habito.tipo,
            diasSemana: habito.diasSemana,
            vecesPorSemana: String(habito.vecesPorSemana),
            recordatorioHora: habito.recordatorioHora ?? '',
            color: habito.color,
            objetivoId: habito.objetivoId,
            sincronizaCalendario: habito.sincronizaCalendario,
          });
        }
      }
    })();
  }, [repos, id, esNuevo]);

  const cambiar = (campo, valor) => setFormulario((anterior) => ({ ...anterior, [campo]: valor }));

  function alternarDia(dia) {
    const dias = formulario.diasSemana.includes(dia)
      ? formulario.diasSemana.filter((d) => d !== dia)
      : [...formulario.diasSemana, dia];
    cambiar('diasSemana', dias);
  }

  // Pide cada permiso solo si el formulario lo necesita y aún no está concedido.
  async function pedirPermisosNecesarios() {
    if (formulario.recordatorioHora && (await estadoPermisoNotificaciones()) !== 'granted') {
      await explicarYPedir(
        'Recordatorios',
        'Para avisarte a la hora que elijas, IzmaBullet necesita permiso para enviar notificaciones. Son avisos locales: no salen de tu móvil.',
        pedirPermisoNotificaciones,
      );
    }
    if (formulario.sincronizaCalendario && (await estadoPermisoCalendario()) !== 'granted') {
      await explicarYPedir(
        'Calendario',
        'Para añadir este hábito a tu calendario, IzmaBullet necesita acceso al calendario. Solo modificará los eventos que cree la propia app.',
        pedirPermisoCalendario,
      );
    }
  }

  async function guardar() {
    setGuardando(true);
    try {
      await pedirPermisosNecesarios();
      const resultado = await guardarHabito(repos, formulario, {
        id: esNuevo ? null : Number(id),
        calendarioId: ajustes.calendarioId,
      });
      if (Object.keys(resultado.errores).length > 0) {
        setErrores(resultado.errores);
        return;
      }
      recargar();
      if (resultado.avisos.length > 0) {
        Alert.alert('Guardado con avisos', resultado.avisos.join('\n\n'), [{ text: 'Entendido', onPress: () => router.back() }]);
      } else {
        router.back();
      }
    } finally {
      setGuardando(false);
    }
  }

  const avisoCalendario = formulario.sincronizaCalendario && !ajustes.calendarioId
    ? 'Elige un calendario en Ajustes para que el evento se cree.'
    : null;

  return (
    <Pantalla>
      <Stack.Screen options={{ title: esNuevo ? 'Nuevo hábito' : 'Editar hábito' }} />

      <Campo
        etiqueta="Nombre"
        placeholder="Por ejemplo, leer 20 minutos"
        value={formulario.nombre}
        onChangeText={(texto) => cambiar('nombre', texto)}
        maxLength={60}
        error={errores.nombre}
      />

      <Seccion titulo="Frecuencia">
        <View style={estilos.fila}>
          <Chip titulo="Todos los días" activo={formulario.tipo === TIPOS_FRECUENCIA.DIARIA} onPress={() => cambiar('tipo', TIPOS_FRECUENCIA.DIARIA)} />
          <Chip titulo="Días concretos" activo={formulario.tipo === TIPOS_FRECUENCIA.DIAS} onPress={() => cambiar('tipo', TIPOS_FRECUENCIA.DIAS)} />
          <Chip titulo="Varias veces por semana" activo={formulario.tipo === TIPOS_FRECUENCIA.VECES} onPress={() => cambiar('tipo', TIPOS_FRECUENCIA.VECES)} />
        </View>

        {formulario.tipo === TIPOS_FRECUENCIA.DIAS ? (
          <>
            <View style={estilos.fila}>
              {ORDEN_DIAS.map((dia) => (
                <Chip
                  key={dia}
                  titulo={NOMBRES_DIAS[dia]}
                  activo={formulario.diasSemana.includes(dia)}
                  onPress={() => alternarDia(dia)}
                />
              ))}
            </View>
            {errores.diasSemana ? <Text style={estilos.error}>{errores.diasSemana}</Text> : null}
          </>
        ) : null}

        {formulario.tipo === TIPOS_FRECUENCIA.VECES ? (
          <View style={estilos.fila}>
            <Chip titulo="−" onPress={() => cambiar('vecesPorSemana', String(Math.max(1, Number(formulario.vecesPorSemana) - 1)))} />
            <Text style={estilos.valor}>{formulario.vecesPorSemana} veces por semana</Text>
            <Chip titulo="+" onPress={() => cambiar('vecesPorSemana', String(Math.min(7, Number(formulario.vecesPorSemana) + 1)))} />
          </View>
        ) : null}
        {errores.vecesPorSemana ? <Text style={estilos.error}>{errores.vecesPorSemana}</Text> : null}
      </Seccion>

      <Seccion titulo="Recordatorio">
        <Campo
          etiqueta="Hora (opcional, formato 24 h)"
          placeholder="07:30"
          value={formulario.recordatorioHora}
          onChangeText={(texto) => cambiar('recordatorioHora', texto)}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          error={errores.recordatorioHora}
        />
        {formulario.tipo !== TIPOS_FRECUENCIA.VECES ? (
          <Tarjeta>
            <View style={estilos.filaInterruptor}>
              <Text style={estilos.etiqueta}>Añadir al calendario</Text>
              <Switch
                value={formulario.sincronizaCalendario}
                onValueChange={(valor) => cambiar('sincronizaCalendario', valor)}
                accessibilityLabel="Añadir al calendario"
              />
            </View>
            <Text style={estilos.ayuda}>
              Crea un evento repetido en el calendario que elijas en Ajustes. Necesita una hora.
            </Text>
            {avisoCalendario ? <Text style={estilos.aviso}>{avisoCalendario}</Text> : null}
          </Tarjeta>
        ) : null}
        {errores.sincronizaCalendario ? <Text style={estilos.error}>{errores.sincronizaCalendario}</Text> : null}
      </Seccion>

      <Seccion titulo="Color">
        <SelectorColor valor={formulario.color} onChange={(color) => cambiar('color', color)} />
      </Seccion>

      {objetivos.length > 0 ? (
        <Seccion titulo="Objetivo">
          <View style={estilos.fila}>
            <Chip titulo="Ninguno" activo={formulario.objetivoId === null} onPress={() => cambiar('objetivoId', null)} />
            {objetivos.map((objetivo) => (
              <Chip
                key={objetivo.id}
                titulo={objetivo.nombre}
                activo={formulario.objetivoId === objetivo.id}
                onPress={() => cambiar('objetivoId', objetivo.id)}
              />
            ))}
          </View>
        </Seccion>
      ) : null}

      <Boton titulo={guardando ? 'Guardando…' : 'Guardar hábito'} onPress={guardar} disabled={guardando} />
    </Pantalla>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    fila: { flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.s, alignItems: 'center' },
    valor: { color: t.text, fontSize: tipografia.cuerpo, flexShrink: 1 },
    filaInterruptor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    etiqueta: { color: t.text, fontSize: tipografia.cuerpo, fontWeight: '600' },
    ayuda: { color: t.muted, fontSize: tipografia.pequeno },
    aviso: { color: t.warn, fontSize: tipografia.pequeno },
    error: { color: t.danger, fontSize: tipografia.minimo },
  });
