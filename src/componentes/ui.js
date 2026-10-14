// Componentes compartidos. Todo el color sale de `useApp().tema` y las medidas de src/tema/escalas.js.
import { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useApp } from '../contexto/ProveedorApp';
import { coloresHabito } from '../tema/colores';
import { areaTactil, espaciado, radio, tipografia } from '../tema/escalas';

// Devuelve estilos creados a partir del tema actual (se recalculan solo si cambia el tema).
export function useEstilos(crear) {
  const { tema } = useApp();
  return useMemo(() => crear(tema), [crear, tema]);
}

export function Pantalla({ children, style }) {
  const { tema } = useApp();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tema.bg }}
      contentContainerStyle={[{ padding: espaciado.m, paddingBottom: espaciado.xl, gap: espaciado.m }, style]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const crearEstilosSeccion = (t) =>
  StyleSheet.create({
    contenedor: { gap: espaciado.s },
    cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    titulo: { color: t.text, fontSize: tipografia.subtitulo, fontWeight: '600' },
  });

export function Seccion({ titulo, children, accion }) {
  const estilos = useEstilos(crearEstilosSeccion);
  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabecera}>
        <Text style={estilos.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        {accion}
      </View>
      {children}
    </View>
  );
}

const crearEstilosTarjeta = (t) =>
  StyleSheet.create({
    tarjeta: {
      backgroundColor: t.surface,
      borderColor: t.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radio.l,
      padding: espaciado.m,
      gap: espaciado.s,
    },
    pulsada: { opacity: 0.8 },
  });

export function Tarjeta({ children, onPress, style, etiqueta }) {
  const estilos = useEstilos(crearEstilosTarjeta);
  const contenido = <View style={[estilos.tarjeta, style]}>{children}</View>;
  if (!onPress) return contenido;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={({ pressed }) => [pressed && estilos.pulsada]}
    >
      {contenido}
    </Pressable>
  );
}

const crearEstilosBoton = (t) => ({
  base: {
    minHeight: areaTactil,
    paddingHorizontal: espaciado.m,
    borderRadius: radio.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { fontSize: tipografia.cuerpo, fontWeight: '600' },
  primario: { caja: { backgroundColor: t.primary }, texto: { color: t.primaryText } },
  secundario: { caja: { backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border }, texto: { color: t.text } },
  peligro: { caja: { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.danger }, texto: { color: t.danger } },
});

// variante: 'primario' | 'secundario' | 'peligro'
export function Boton({ titulo, onPress, variante = 'primario', disabled = false, style }) {
  const estilos = useEstilos(crearEstilosBoton);
  const estilo = estilos[variante] ?? estilos.primario;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        estilos.base,
        estilo.caja,
        pressed && !disabled && { opacity: 0.8 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={[estilos.texto, estilo.texto]}>{titulo}</Text>
    </Pressable>
  );
}

const crearEstilosVacio = (t) =>
  StyleSheet.create({
    contenedor: {
      backgroundColor: t.surface,
      borderColor: t.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radio.l,
      padding: espaciado.l,
      gap: espaciado.s,
    },
    titulo: { color: t.text, fontSize: tipografia.subtitulo, fontWeight: '600', textAlign: 'center' },
    texto: { color: t.muted, fontSize: tipografia.pequeno, textAlign: 'center' },
  });

// Estado vacío: siempre indica qué hacer, con una acción cuando la hay.
export function Vacio({ titulo, texto, accion }) {
  const estilos = useEstilos(crearEstilosVacio);
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>{titulo}</Text>
      {texto ? <Text style={estilos.texto}>{texto}</Text> : null}
      {accion ? <Boton titulo={accion.titulo} onPress={accion.onPress} /> : null}
    </View>
  );
}

const crearEstilosCampo = (t) =>
  StyleSheet.create({
    contenedor: { gap: espaciado.xs },
    etiqueta: { color: t.text, fontSize: tipografia.pequeno, fontWeight: '600' },
    entrada: {
      minHeight: areaTactil,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radio.m,
      paddingHorizontal: espaciado.m,
      color: t.text,
      backgroundColor: t.surface,
      fontSize: tipografia.cuerpo,
    },
    entradaError: { borderColor: t.danger },
    error: { color: t.danger, fontSize: tipografia.minimo },
    placeholder: { color: t.muted },
  });

export function Campo({ etiqueta, error, ...props }) {
  const estilos = useEstilos(crearEstilosCampo);
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        accessibilityLabel={etiqueta}
        placeholderTextColor={estilos.placeholder.color}
        style={[estilos.entrada, error && estilos.entradaError]}
        {...props}
      />
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

const crearEstilosChip = (t) =>
  StyleSheet.create({
    base: {
      minHeight: areaTactil,
      minWidth: areaTactil,
      paddingHorizontal: espaciado.m,
      borderRadius: radio.m,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activo: { backgroundColor: t.primarySoft, borderColor: t.primary, borderWidth: 2 },
    texto: { color: t.text, fontSize: tipografia.pequeno },
    textoActivo: { fontWeight: '700' },
  });

// Chip seleccionable (frecuencia, tema, calendario, días…). Área táctil de 44 px.
export function Chip({ titulo, activo, onPress }) {
  const estilos = useEstilos(crearEstilosChip);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={titulo}
      style={[estilos.base, activo && estilos.activo]}
    >
      <Text style={[estilos.texto, activo && estilos.textoActivo]}>{titulo}</Text>
    </Pressable>
  );
}

const crearEstilosColor = (t) =>
  StyleSheet.create({
    fila: { flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.s },
    muestra: { width: areaTactil, height: areaTactil, borderRadius: areaTactil / 2 },
    seleccionada: { borderWidth: 3, borderColor: t.text },
  });

// Colores de hábito. Se guarda el color claro; en oscuro se muestra su variante.
export function SelectorColor({ valor, onChange }) {
  const { esquema } = useApp();
  const estilos = useEstilos(crearEstilosColor);
  const colores = esquema === 'oscuro' ? coloresHabito.oscuro : coloresHabito.claro;
  return (
    <View style={estilos.fila}>
      {coloresHabito.claro.map((claro, indice) => {
        const seleccionado = valor === claro;
        return (
          <Pressable
            key={claro}
            onPress={() => onChange(claro)}
            accessibilityRole="radio"
            accessibilityState={{ selected: seleccionado }}
            accessibilityLabel={`Color ${indice + 1}`}
            style={[estilos.muestra, { backgroundColor: colores[indice] }, seleccionado && estilos.seleccionada]}
          />
        );
      })}
    </View>
  );
}

const crearEstilosBarra = (t) =>
  StyleSheet.create({
    fondo: { height: 10, borderRadius: 5, backgroundColor: t.surface2, overflow: 'hidden' },
    relleno: { height: '100%', borderRadius: 5 },
  });

export function BarraProgreso({ valor, color, etiqueta }) {
  const estilos = useEstilos(crearEstilosBarra);
  const porcentaje = Math.min(100, Math.max(0, valor));
  return (
    <View
      style={estilos.fondo}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: porcentaje }}
      accessibilityLabel={etiqueta}
    >
      <View style={[estilos.relleno, { width: `${porcentaje}%`, backgroundColor: color }]} />
    </View>
  );
}

// Botón circular de "hecho". Animación breve de escala; se omite si el sistema pide movimiento reducido.
export function BotonMarcar({ marcado, color, onPress, etiqueta }) {
  const { tema } = useApp();
  const escala = useRef(new Animated.Value(1)).current;
  const movimientoReducido = useRef(false);

  useEffect(() => {
    let activo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      if (activo) movimientoReducido.current = valor;
    });
    return () => {
      activo = false;
    };
  }, []);

  function alPulsar() {
    if (!movimientoReducido.current) {
      Animated.sequence([
        Animated.timing(escala, { toValue: 0.9, duration: 80, useNativeDriver: true }),
        Animated.timing(escala, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    }
    onPress();
  }

  const colorActivo = color ?? tema.primary;
  return (
    <Pressable
      onPress={alPulsar}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcado }}
      accessibilityLabel={etiqueta}
      hitSlop={espaciado.s}
      style={{ width: areaTactil, height: areaTactil, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: colorActivo,
          backgroundColor: marcado ? colorActivo : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: escala }],
        }}
      >
        {marcado ? <Text style={{ color: '#ffffff', fontWeight: '700' }}>✓</Text> : null}
      </Animated.View>
    </Pressable>
  );
}
