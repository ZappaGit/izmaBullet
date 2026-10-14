// Tokens de color de IzmaBullet. Los valores son los de Familizma (izmaResolution).
// Para cambiar el acento, edita primary/primaryText/primarySoft en ambos temas.

export const temaClaro = {
  bg: '#f6f7fb',
  surface: '#ffffff',
  surface2: '#eef0f6',
  text: '#1c2033',
  muted: '#5b6178',
  border: '#d9dce8',
  primary: '#4f46c8',
  primaryText: '#ffffff',
  primarySoft: '#e8e6fb',
  danger: '#b3261e',
  warn: '#8a5a00',
  ok: '#1b6e3a',
  focus: '#1d4ed8',
};

export const temaOscuro = {
  bg: '#0d0f17',
  surface: '#151826',
  surface2: '#1d2133',
  text: '#e8eaf4',
  muted: '#9aa0b8',
  border: '#2a2f45',
  primary: '#8b85f0',
  primaryText: '#0d0f17',
  primarySoft: '#26234a',
  danger: '#ff8a80',
  warn: '#ffc266',
  ok: '#6fd69a',
  focus: '#7aa7ff',
};

// Acentos planos y poco saturados para los hábitos.
export const coloresHabito = {
  claro: ['#7d9bb0', '#8fa88a', '#c09a7a', '#a58fb3', '#c7aa6e', '#7fa8a3', '#b8868c', '#8e93b8'],
  oscuro: ['#46606f', '#55684f', '#7a5c45', '#66587a', '#7f6a3e', '#476b66', '#74505a', '#555a7d'],
};

// Devuelve la variante del color de hábito para el esquema pedido.
// El color se guarda siempre en su versión clara; en oscuro se busca la variante por posición.
export function colorHabitoParaEsquema(color, esquema) {
  const indice = coloresHabito.claro.indexOf(color);
  if (indice === -1) return color;
  return esquema === 'oscuro' ? coloresHabito.oscuro[indice] : coloresHabito.claro[indice];
}
