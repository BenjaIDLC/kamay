# Kamay — MVP

Kamay vende computadoras armadas a medida para diseño gráfico, render 3D y gaming. Lo que queremos demostrar es esto: **una persona cuenta qué hace y cuánto quiere gastar, y recibe un equipo compatible que puede ajustar y pedir.**

> La versión anterior, con un motor de 15 reglas (BIOS, M.2 por SKU, cables por revisión de fuente…) y la documentación detallada, está guardada en la rama `archivo/motor-15-reglas`. Se dejó de lado porque esa precisión de producto comercial impedía tener algo demostrable.

## Objetivos y cómo se cumplen

| Objetivo | Qué hay en el MVP |
| --- | --- |
| **OE1 Catálogo** | 33 productos reales en 8 categorías, cada uno con justificación técnica, especificaciones clave y usos recomendados. Vista **Componentes** con filtros por categoría y uso. |
| **OE2 Configurador** | 4 equipos base (uno por uso). Se puede elegir uso y presupuesto, partir de una base o de cero, y cambiar piezas. Cada cambio se valida en el servidor; las opciones compatibles aparecen primero y las demás explican su conflicto. |
| **OE3 Pedidos** | Checkout con pago simulado. El servidor revalida y solo acepta configuraciones compatibles. El pedido se guarda y sus etapas se avanzan manualmente (pagado → ensamblaje → control de calidad → enviado → entregado). |
| **OE4 Experiencia** | Inicio, Equipos, Componentes, Armar y Asesor IA, en español, adaptable a móvil y con estados de carga, error y simulación siempre explícitos. |
| **OE5 Asesor IA** | Chat con un modelo real (OpenAI) que usa tres herramientas del backend: catálogo, bases y validación. Solo propone productos existentes; su propuesta se abre en el configurador y conoce la configuración actual. Si la IA falla, se conserva la conversación y se puede reintentar. La derivación a un humano es un botón de demostración. |

## Motor de compatibilidad (`backend/compatibility.mts`)

Tiene 8 reglas legibles. Cada una devuelve `ok`, `advertencia`, `bloqueo`, `pendiente` o `no_aplica` junto con un mensaje:

1. **Socket**: el CPU y la placa deben coincidir.
2. **Memoria**: el tipo de RAM (DDR4/DDR5) debe coincidir con el de la placa.
3. **Formato**: el gabinete debe admitir el tamaño de la placa.
4. **Espacio GPU**: el largo de la tarjeta frente al máximo del gabinete. Con menos de 10 mm de holgura se emite una advertencia.
5. **Cooler**: debe tener montaje para el socket y caber en altura.
6. **Video**: sin GPU dedicada, el CPU necesita gráficos integrados. Un modelo "F" sin GPU se bloquea.
7. **Potencia**: el consumo estimado (CPU + GPU + 75 W) bloquea si la fuente no lo cubre. Si no cubre el margen ×1,25 o la fuente recomendada para la GPU, da una advertencia.
8. **Uso**: núcleos, RAM, VRAM, almacenamiento y GPU según el perfil. Solo genera advertencias, que retiran la etiqueta "recomendado".

Estado global: **incompleta** (falta una pieza obligatoria; la GPU es opcional), **no válida** (hay algún bloqueo) o **válida**. Solo una configuración válida puede pedirse. Se considera **recomendada** cuando es válida, se ajusta al uso elegido y entra en el presupuesto.

Para agregar un producto basta con añadir una fila en `backend/catalog.mts` con las especificaciones de su categoría. Un test comprueba que no falte ninguna.

## Perfiles de uso (`backend/profiles.mts`)

| Uso | Criterios |
| --- | --- |
| Diseño gráfico (Photoshop) | ≥ 6 núcleos, ≥ 32 GB RAM, ≥ 1 TB |
| Render 3D por CPU (Blender Cycles) | ≥ 12 núcleos, ≥ 32 GB RAM, ≥ 1 TB |
| Render 3D por GPU (Blender Cycles) | ≥ 8 núcleos, ≥ 32 GB RAM, GPU con ≥ 12 GB VRAM, ≥ 1 TB |
| Gaming | ≥ 6 núcleos, ≥ 16 GB RAM, GPU con ≥ 8 GB VRAM, ≥ 1 TB |

Son umbrales de curaduría del proyecto, basados en los requisitos publicados por Adobe, Blender y Epic Games. No son promesas de rendimiento.

## Guion de demostración (5 minutos)

1. **Inicio**: explicar la propuesta en una frase.
2. **Equipos → Personalizar "Kamay Arena"**: cambiar la placa por la MSI Z890 y mostrar que aparece **Incompatible** con el motivo (socket). Volver a la B650.
3. **Cambiar la GPU por la RTX 5080**: la fuente de 750 W da una advertencia de potencia. Cambiar a la RM850x.
4. **Elegir "Render 3D por CPU"** como uso: aparece la advertencia de núcleos (8 de 12) y el equipo deja de estar "recomendado", aunque sigue siendo compatible.
5. **Asesor IA**: "Hago render en Blender por GPU, tengo S/ 9000". La IA propone un equipo validado; abrirlo en el configurador.
6. **Continuar al pedido → pago simulado**, y avanzar las etapas en la vista del pedido.

## Pendiente

- **Evaluación del asesor (OE5)**: casos de prueba (datos completos, datos faltantes, presupuesto insuficiente, cambio incompatible, fuera de alcance) con una rúbrica. El test `npm run api:test:live` cubre los tres primeros de forma automática.
- Fotografía y diseño final del homepage.
- Precios reales de una tienda peruana. Hoy son referenciales.
