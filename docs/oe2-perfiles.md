# OE2 — cuatro perfiles para el MVP

Definición funcional v1, 2026-10-18. Complementa el [contrato del motor](./oe2-reglas.md). Implementada en el backend con evidencia sintética y cuatro bases demostrativas; pendiente la interfaz y la curaduría real.

## Perfiles y bases

Una base por perfil; tres familias comerciales. El usuario elige uso y presupuesto. En 3D elige render por CPU o GPU; el asistente puede explicar la diferencia.

| ID | Familia / base | Trabajo de referencia | Criterios de guía R15 |
|---|---|---|---|
| `diseno` | Diseño gráfico | Photoshop: fotografía y composición 2D | RAM >= 32 GB; CPU y ruta gráfica con soporte documentado para el programa. GPU dedicada opcional. |
| `render_cpu` | Render 3D / CPU | Blender Cycles: render por CPU | CPU >= 8 núcleos físicos; RAM >= 32 GB; CPU y ruta gráfica compatibles con Blender. GPU dedicada opcional; sigue siendo necesaria una ruta gráfica para la interfaz. |
| `render_gpu` | Render 3D / GPU | Blender Cycles: render por GPU | RAM >= 32 GB; GPU dedicada con VRAM >= 8 GB y soporte confirmado para un backend de Cycles en la versión evaluada; CPU compatible con Blender. |
| `gaming` | Gaming | Fortnite, escenario de demostración a 1080p | RAM >= 16 GB; GPU dedicada con VRAM >= 8 GB; CPU y GPU con evidencia de cumplir los requisitos recomendados del juego. La resolución describe el escenario, no garantiza FPS ni calidad gráfica. |

Todos los perfiles usan un SSD M.2 NVMe de al menos 1 TB (1000 GB nominales), refrigeración por aire y Windows 11 como entorno de referencia. La capacidad nominal no equivale a espacio libre. Las bases concretas se seleccionan del catálogo y su precio es la suma del servidor, sin presupuestos ficticios fijos.

Los umbrales son objetivos de curaduría del proyecto. Los 32 GB para diseño, 8 GB de VRAM para gaming y 1 TB de almacenamiento son políticas propias, no mínimos publicados ni pruebas de rendimiento. Los requisitos de software, sistema operativo y controladores deben acompañar la evidencia; no se presume que todo hardware nuevo los cumple.

## Evidencia y datos mínimos

- Reutilizar los atributos del catálogo: núcleos físicos del CPU, cantidad y capacidad de módulos RAM, VRAM de GPU y capacidad nominal del SSD. No extraerlos del nombre comercial.
- Para el soporte de software, conservar por SKU y revisión una evaluación curada: programa, versión evaluada, modo (interfaz, render CPU, render GPU o juego), resultado `cumple`/`no_cumple`/`sin_datos`, motivo, fuente y fecha. Registrar condiciones de SO/controlador y backend gráfico cuando correspondan.
- Una evaluación ausente equivale a `sin_datos`. La memoria de una GPU o el número de núcleos no demuestran por sí solos soporte ni rendimiento equivalente.
- En el catálogo sintético, las evaluaciones pueden ser fixtures explícitamente ficticios para demostrar el flujo. Nunca presentarlas como evidencia de productos reales. Al incorporar productos reales, registrar la versión concreta evaluada y las fuentes correspondientes.

No se necesitan benchmarks propios, niveles CPU/GPU ni un puntaje ponderado para esta versión. Las etiquetas térmicas quedan fuera del cálculo de R15 hasta contar con metodología; el montaje y la alimentación siguen en las reglas estructurales.

## Comportamiento de R15

1. Sin perfil o con elecciones necesarias pendientes: `no_aplica`; pedir completar la selección. Una GPU omitida explícitamente sí se evalúa: incumple los perfiles que requieren GPU dedicada.
2. Con elecciones completas, evaluar todos los criterios. Si alguno incumple: `no_cumple`, severidad `advertencia`, indicando todos los incumplimientos y los datos pendientes que existan.
3. Si no hay incumplimientos conocidos pero falta evidencia o un atributo: `sin_datos`, severidad `advertencia`.
4. Si todos cumplen: `cumple`, severidad nula. Mensaje: «Cumple los criterios del perfil», sin promesas de rendimiento.

El objeto de salida sigue siendo el contrato único de R15; el mensaje resume los criterios y `componentes` identifica las categorías implicadas. No añadimos reglas ni otro motor.

Ejemplo: al sustituir una GPU de 12 GB por una de 4 GB en Render GPU, R15 advierte que queda por debajo del objetivo de 8 GB. Las reglas físicas se evalúan por separado. Si falta evidencia de Cycles, también se explica; no se deduce compatibilidad por antigüedad o memoria.

Una configuración físicamente validada puede continuar al pedido simulado con esa advertencia visible, según el contrato acordado. Pierde la etiqueta de recomendación para el perfil. «Validada» y «recomendada para tu uso» son resultados diferentes.

## Recomendación y presupuesto

- Etiqueta «Recomendada para tu uso»: configuración global validada, R15 cumple y total dentro del presupuesto declarado. Si falta presupuesto, mostrar solo el resultado técnico y solicitarlo para recomendar.
- Para elegir entre alternativas que cumplen, ordenar por precio ascendente. No afirmar «mejor rendimiento» o «mejor relación precio/rendimiento» sin evidencia.
- Las piezas se evalúan sustituyéndolas en el equipo completo; no reciben una recomendación universal aislada.
- Si no hay opción dentro del presupuesto, mostrar el importe de la base curada más económica que cumple y la diferencia. El backend inicial busca entre las cuatro bases, no entre todas las combinaciones de piezas. No superar el presupuesto silenciosamente.
- El asistente usa estos mismos perfiles y resultados. Solicitudes de video, otros programas, escenas grandes o FPS concretos quedan sin adecuación verificada; no se asignan automáticamente al perfil más parecido.

## Referencias de curaduría

Consultadas el 2026-10-18. Son referencias para registrar evidencia por versión y producto, no certificaciones de las bases todavía pendientes:

- [Adobe: requisitos de Photoshop](https://helpx.adobe.com/photoshop/system-requirements.html). Recomienda 16 GB de RAM o más; el proyecto adopta 32 GB como objetivo propio para su base de diseño.
- [Blender: requisitos](https://www.blender.org/download/requirements/). Referencia general de 8 núcleos y 32 GB de RAM recomendados; no demuestra tiempos de render ni capacidad para cualquier escena.
- [Blender: renderizado](https://www.blender.org/features/rendering/). El soporte de Cycles depende del dispositivo y backend; debe verificarse para el modelo y versión elegidos.
- [Epic Games: requisitos de Fortnite](https://www.epicgames.com/help/c-34254770/c-37371353/a16548002?lang=en-US). Referencia de requisitos recomendados; el objetivo de 8 GB de VRAM del proyecto no se presenta como mínimo oficial ni garantía de FPS.

## Siguiente paso

El backend incluye 15 comprobaciones, 16 productos sintéticos y cuatro bases; API y asistente comparten validación. Las pruebas automatizadas cubren cada perfil, cambios incompatibles, incumplimientos R15, evidencia faltante, GPU omitida y presupuesto insuficiente. Sigue diseñar el configurador visual y completar progresivamente los 10–15 productos por categoría con datos curados. La maqueta visual del homepage sigue pendiente de aprobación.
