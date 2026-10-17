import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { estadoPermisoCalendario, pedirPermisoCalendario } from '../calendario/calendario';
import { Boton, Campo, Chip, Pantalla, Seccion, SelectorColor, useEstilos } from '../componentes/ui';
import { useApp } from '../contexto/ProveedorApp';
import { formatearFechaLocal } from '../dominio/fechas';
import { MODOS_OBJETIVO } from '../dominio/objetivos';
import { guardarObjetivo } from '../servicios/acciones';
import { coloresHabito } from '../tema/colores';
import { espaciado, tipografia } from '../tema/escalas';

const FORMULARIO_VACIO = {
  nombre: '',
  descripcion: '',
  modo: MODOS_OBJETIVO.MANUAL,
  progresoManual: 0,
  fechaLimite: '',
  color: coloresHabito.claro[3],
};

export default function ObjetivoEditar() {
  const { id } = useLocalSearchParams();
  const esNuevo = !id;
  const { repos, ajustes, recargar } = useApp();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      if (esNuevo) return;
      const objetivo = await repos.objetivos.obtener(Number(id));
      if (objetivo) {
        setFormulario({
          nombre: objetivo.nombre,
          descripcion: objetivo.descripcion,
          modo: objetivo.modo,
          progresoManual: objetivo.progresoManual,
          fechaLimite: objetivo.fechaLimite ? formatearFechaLocal(objetivo.fechaLimite) : '',
          color: objetivo.color,
        });
      }
    })();
  }, [repos, id, esNuevo]);

  const cambiar = (campo, valor) => setFormulario((anterior) => ({ ...anterior, [campo]: valor }));

  // Un evento de fecha límite necesita acceso al calendario: se explica antes de pedirlo.
  // Si el usuario dice "Ahora no", el objetivo se guarda igual, sin evento.
  function pedirPermisoSiHaceFalta() {
    return new Promise(async (resolver) => {
      if (!formulario.fechaLimite || !ajustes.calendarioId || (await estadoPermisoCalendario()) === 'granted') {
        resolver();
        return;
      }
      Alert.alert(
        'Calendario',
        'Para añadir la fecha límite al calendario, IzmaBullet necesita acceso. Solo modificará los eventos que cree la propia app.',
        [
          { text: 'Ahora no', style: 'cancel', onPress: () => resolver() },
          {
            text: 'Continuar',
            onPress: async () => {
              await pedirPermisoCalendario();
              resolver();
            },
          },
        ],
      );
    });
  }

  async function guardar() {
    setGuardando(true);
    try {
      await pedirPermisoSiHaceFalta();
      const resultado = await guardarObjetivo(repos, formulario, {
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

  return (
    <Pantalla>
      <Stack.Screen options={{ title: esNuevo ? 'Nuevo objetivo' : 'Editar objetivo' }} />

      <Campo
        etiqueta="Nombre"
        placeholder="Por ejemplo, correr 5 km"
        value={formulario.nombre}
        onChangeText={(texto) => cambiar('nombre', texto)}
        maxLength={80}
        error={errores.nombre}
      />

      <Campo
        etiqueta="Descripción (opcional)"
        value={formulario.descripcion}
        onChangeText={(texto) => cambiar('descripcion', texto)}
        multiline
        maxLength={300}
      />

      <Seccion titulo="Cómo se calcula el progreso">
        <View style={estilos.fila}>
          <Chip
            titulo="Lo marco yo"
            activo={formulario.modo === MODOS_OBJETIVO.MANUAL}
            onPress={() => cambiar('modo', MODOS_OBJETIVO.MANUAL)}
          />
          <Chip
            titulo="Según sus hábitos"
            activo={formulario.modo === MODOS_OBJETIVO.HABITOS}
            onPress={() => cambiar('modo', MODOS_OBJETIVO.HABITOS)}
          />
        </View>
        {formulario.modo === MODOS_OBJETIVO.MANUAL ? (
          <View style={estilos.fila}>
            <Chip titulo="−10" onPress={() => cambiar('progresoManual', Math.max(0, Number(formulario.progresoManual) - 10))} />
            <Text style={estilos.valor}>{formulario.progresoManual} %</Text>
            <Chip titulo="+10" onPress={() => cambiar('progresoManual', Math.min(100, Number(formulario.progresoManual) + 10))} />
          </View>
        ) : (
          <Text style={estilos.ayuda}>
            Se calcula con los hábitos que elijas en su formulario (media de los últimos 30 días).
          </Text>
        )}
        {errores.progresoManual ? <Text style={estilos.error}>{errores.progresoManual}</Text> : null}
      </Seccion>

      <Campo
        etiqueta="Fecha límite (opcional, dd/mm/aaaa)"
        placeholder="31/12/2026"
        value={formulario.fechaLimite}
        onChangeText={(texto) => cambiar('fechaLimite', texto)}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        error={errores.fechaLimite}
      />

      <Seccion titulo="Color">
        <SelectorColor valor={formulario.color} onChange={(color) => cambiar('color', color)} />
      </Seccion>

      <Boton titulo={guardando ? 'Guardando…' : 'Guardar objetivo'} onPress={guardar} disabled={guardando} />
    </Pantalla>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    fila: { flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.s, alignItems: 'center' },
    valor: { color: t.text, fontSize: tipografia.cuerpo, fontWeight: '600' },
    ayuda: { color: t.muted, fontSize: tipografia.pequeno },
    error: { color: t.danger, fontSize: tipografia.minimo },
  });
