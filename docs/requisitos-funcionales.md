# Requisitos funcionales — IzmaBullet

Estado: **validado el 18/10/2026**, salvo lo marcado como pendiente. Cuando esté aprobado, el diseño de Figma y el código se ajustan a este documento, no al revés.

## 1. Concepto

- **IzmaBullet** es el nombre de la aplicación. No es una pantalla ni una subapp.
- La aplicación es un **cuaderno** (bullet journal) formado por **subapps**. Cada subapp es una sección del cuaderno.
- Todo usa el **estilo Midori** (ver `estilo-journal.md`): papel con puntos, tinta, letra Patrick Hand y anillas. Se abandona el formato clásico de app: sin barra de pestañas inferior, sin cabecera de sistema, sin tarjetas con sombra, sin botón de menú hamburguesa.

## 2. Subapps

| # | Subapp | Color clave | Estado |
|---|---|---|---|
| 1 | Índice | tinta | Diseñada (Figma) |
| 2 | Registro futuro | verde mate `#5f7d6a` | Diseñada (Figma) |
| 3 | Conocimiento | terracota `#9a6b5b` (propuesto) | Pendiente |
| 4 | Inventario personal | ocre `#8c7a4e` (propuesto) | Diseñada (Figma, 3 páginas) |
| 5 | Seguimiento | malva `#7d6b8a` (propuesto) | Pendiente |
| 6 | Hábitos y objetivos | azul mate `#6b7f9a` | Hecha: páginas HÁBITOS y OBJETIVOS (sin página Hoy) |
| 7 | Ajustes e info | gris `#6f7378` (propuesto) | Hecha: páginas AJUSTES, INFO |

- RF-SUB-1. El número de cada subapp es fijo y es su identidad: no cambia aunque se añadan subapps.
- RF-SUB-2. Cada subapp tiene un color clave mate. Se usa solo en: su número del índice lateral, su título y su marca de "estás aquí".

## 3. Arranque

- RF-ARR-1. Al abrir la app se muestra la pantalla **Carga Midori B** (puntos y anillas, "IzmA Bullet"). Sustituye a la pantalla actual con el botón "Empezar".
- RF-ARR-2. La carga pasa sola a la siguiente pantalla (sin botón) cuando la app está lista: base de datos abierta y fuente cargada. **Pendiente: tiempo mínimo visible (¿1 s?).**
- RF-ARR-3. **Login: no se muestra por ahora.** La app funciona sin cuenta. El flujo queda preparado: Carga → (Login, cuando se active) → Índice.
- RF-ARR-4. Tras la carga se llega al **Índice Midori A** (solo puntos).

## 4. Índice (subapp 1)

- RF-IND-1. Muestra el título ÍNDICE y la lista `[1] Índice … [7] Ajustes e info` con letra manuscrita.
- RF-IND-2. Pulsar una línea abre esa subapp.
- RF-IND-3. Las subapps aún no disponibles se muestran atenuadas y no se pueden abrir.

## 5. Navegación entre subapps

- RF-NAV-1. Cada subapp tiene un **índice lateral** en el borde izquierdo con `[1] [2] … [7]`, cada número en el color de su subapp.
- RF-NAV-2. La subapp actual aparece **enmarcada** en su color.
- RF-NAV-3. Pulsar un número cambia de subapp directamente. No hay menú hamburguesa ni cajón lateral.
- RF-NAV-4. El índice lateral aparece solo en la **primera página** de cada subapp. El Índice (1) no lo lleva.
- RF-NAV-5. Dentro de una subapp, las páginas se cambian **deslizando** de derecha a izquierda (Registro → Futuro; Inventario A → B → C).
- RF-NAV-6. El botón "atrás" de Android vuelve a la página anterior de la subapp y, desde la primera, al Índice.

## 6. Cabecera de la subapp

- RF-CAB-1. No hay cabecera de sistema (se elimina "Registro futuro" duplicado arriba).
- RF-CAB-2. El nombre de la página va como título manuscrito en mayúsculas, espaciado ancho, en el color clave (como REGISTRO, FUTURO, PERSONAL).
- RF-CAB-3. De momento no se muestra el nombre de la subapp: basta con el título de página y el número marcado.

## 7. Registro futuro (subapp 2)

- RF-RF-1. Dos páginas: Registro (Mes +1, Mes +2) y Futuro (Mes +3, Mes +4). En pantalla se ve el nombre del mes en mayúsculas (NOVIEMBRE) con el año debajo; "Mes +N" es solo la regla interna. **Mes +N = mes actual + N**: en noviembre, Mes +1 es diciembre y Mes +2 es enero.
- RF-RF-2. Cabecera de cada mes: nombre y año en la misma línea (NOVIEMBRE 2026), con línea debajo.
- RF-RF-3. Debajo de la línea, los **elementos** del mes con «•». Cada uno tiene «−» para eliminarlo.
- RF-RF-4. Al final de la lista, «+» abre un campo para escribir un elemento nuevo (1 a 80 caracteres). Se añade al final.
- RF-RF-5. Cada mes empieza con elementos por defecto (Cumpleaños, Citas, Pagos). Se pueden eliminar y no vuelven a aparecer.
- **Pendiente de diseñar:** si los elementos se marcan como hechos y si pasan al mes siguiente.

## 8. Inventario personal (subapp 4)

- RF-INV-1. Tres páginas deslizables (diseño en Figma, página Inventario Personal).
- RF-INV-2. **Pendiente: qué se registra en cada sección** ("qué quiero hacer", "qué estoy haciendo", "qué debería") y cómo se añaden elementos.

## 9. Hábitos y objetivos

- RF-HO-1. Pasan al estilo Midori; se elimina la barra de pestañas (Hoy, Hábitos, Objetivos, Ajustes).
- RF-HO-2. El botón **+** de cada página abre la creación (reutiliza parte de Editar hábito / Editar objetivo).
- RF-HO-3. Se mantiene toda la lógica actual: frecuencias, rachas, recordatorios y calendario.
- RF-HO-5. No hay página Hoy. En HÁBITOS, los activos que tocan hoy llevan ○ / ● para marcar el día.
- RF-HO-4. Es una sola subapp (nº 6). Ajustes (tema, calendario, permisos) pasa a la subapp 7, Ajustes e info.

## 10. Fuera de alcance por ahora

- Tema oscuro.
- Cuentas y sincronización (el código existe pero no se muestra).

## Pendiente de diseñar

0. Detalle y formularios de hábito y objetivo (pantallas con estilo clásico, se abren desde la subapp 6).

1. Elementos: si se marcan como hechos y si pasan al mes siguiente. Elementos de Inventario.
2. Contenido de Conocimiento (3) y Seguimiento (5).
3. Color definitivo de las subapps 3, 4, 5 y 7.
