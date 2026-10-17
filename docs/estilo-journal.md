# Estilo IzmaBullet Journal

Estilo visual de las pantallas de IzmaBullet que tienen aspecto de cuaderno: Registro futuro, el Índice y el arranque. Se dibujó en Figma en la página **Arranque** (Midori A y B) y en la página **Registro Futuro**. Es la referencia para las pantallas nuevas.

## Principios

- **Cuaderno, no panel.** Fondo de papel con puntos, letra manuscrita y anillas de encuadernación.
- **Un color por aplicación.** Cada aplicación tiene un color clave, un verde o azul mate. Tiñe su número en el índice, su título y sus marcas. El resto de la pantalla usa solo tinta y papel.
- **Sin sombras ni degradados.** Las formas son líneas finas y contornos.

## Tokens

| Token | Valor | Uso |
|---|---|---|
| Fuente | Patrick Hand, Regular | Todo el texto (títulos, meses, listas, etiquetas) |
| Tinta | `#2f3237` | Texto y líneas |
| Papel | `#f1f2f0` | Fondo de la pantalla |
| Punto de papel | `#9ba0a3`, 2 px, cuadrícula de 16 px | Fondo de puntos |
| Anilla | 14 px, relleno `#dfe2e4`, trazo `#7d8286` 1,5 px | Anillas de encuadernación |
| Color clave | Ver tabla de aplicaciones | Número, título y marcas de la aplicación |

Los puntos y las anillas no son contenido: son la textura del papel. En Figma se construyen a partir de la pantalla Midori B (`Índice Midori B`), que ya los trae; las pantallas nuevas se duplican de ahí.

## Tipografía

| Elemento | Tamaño | Notas |
|---|---|---|
| Título de página | 44 px, mayúsculas, espaciado 6 px | REGISTRO, FUTURO |
| Subtítulo de mes | 32 px, con línea debajo | MES +1 |
| Fecha del mes | 20 px | noviembre de 2026 |
| Elemento de lista | 26 px, con «•» delante | uno, dos, tres |
| Número del índice | 22 px | [1] … [6] |

## Barra lateral con los números

- Los números van de [1] a [6], en el orden del índice.
- **Cada número lleva el color clave de su aplicación.** El índice se ve igual en todas las páginas.
- La aplicación actual se marca con un rectángulo de trazo fino en el color de esa aplicación, rodeando su número. Solo hay una marca por página.

## Color clave por aplicación

Fuente de verdad en código: `src/dominio/aplicaciones.js` (campo `color`). En el código solo existen las aplicaciones 1 y 2.

| # | Aplicación | Color clave | Nombre | Estado |
|---|---|---|---|---|
| 1 | IzmaBullet | `#6b7f9a` | Azul mate | Definido |
| 2 | Registro futuro | `#5f7d6a` | Verde mate | Definido |
| 3 | Conocimiento | `#9a6b5b` | Terracota mate | Propuesto |
| 4 | Inventario personal | `#8c7a4e` | Ocre mate | Propuesto |
| 5 | Seguimiento | `#7d6b8a` | Malva mate | Propuesto |
| 6 | Info | `#6f7378` | Gris piedra | Propuesto |

Un color clave se usa para: el número del índice, el título de la página y la marca de la aplicación actual. No se usa para el papel, la tinta ni las anillas.

Pendiente: confirmar los colores propuestos (3 a 6) y añadir al código las aplicaciones que vayan a existir.

## Dónde están en Figma

- Archivo «IzmaBullet — Pantallas», página **Registro Futuro**: `Registro futuro Midori B · Registro` (48:3) y `· Futuro` (48:1282). Aplicación 2, verde mate.
- Página **Inventario Personal** (63:2): `Inventario Personal A` (63:3) y `B` (63:1281). Aplicación 4, ocre mate.
- Página **Arranque**: Carga y Índice, versiones Midori A (solo puntos) y B (puntos y anillas).

## Cómo aplicarlo en código

Pendiente. La app todavía no usa este estilo: las pantallas de `src/pantallas/` siguen con el tema claro y oscuro de `src/tema/colores.js`. Al portarlo, la fuente Patrick Hand se carga con `expo-font` y el fondo de puntos se hace con un SVG de fondo, no con cientos de vistas.
