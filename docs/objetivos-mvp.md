# Objetivos y alcance del MVP de Kamay

## Objetivo general

Implementar una plataforma de comercio electrónico para la venta y el armado a medida de computadoras de alta gama. Debe integrar un catálogo con curaduría técnica, un configurador que valide compatibilidad y un asistente conversacional con inteligencia artificial que guíe al cliente según su uso real.

## Objetivos específicos

1. **OE1 — Catálogo:** clasificar componentes de alta gama por criterios técnicos y casos de uso, con una justificación técnica para cada uno.
2. **OE2 — Configurador:** permitir armar equipos a medida, validar la compatibilidad y orientar la selección según la necesidad del cliente.
3. **OE3 — Pedidos:** gestionar pedidos personalizados desde la configuración hasta el ensamblaje, el control de calidad y la entrega.
4. **OE4 — Experiencia:** transmitir la asesoría técnica y la personalización propias de Kamay.
5. **OE5 — Asistente IA:** usar el catálogo curado y el motor de compatibilidad para recomendar configuraciones validadas, contemplar la derivación a un asesor humano y evaluar las recomendaciones mediante métricas definidas.

## Alcance acordado para el prototipo funcional

- El **chatbot con IA es la función principal**. Debe funcionar con un proveedor real y apoyarse en el catálogo y en la validación del servidor; una conversación guionada no cumple este objetivo.
- El comercio electrónico debe permitir recorrer un flujo funcional de catálogo, configuración y pedido. Para este MVP, la pasarela de pagos puede ser una simulación explícita.
- La derivación a un asesor humano puede representarse mediante un botón estático. No habrá una persona atendiendo detrás de esa acción en el prototipo y la interfaz debe dejarlo claro.
- La compatibilidad y los precios mostrados como validados deben provenir del backend. No se debe presentar una configuración incompleta o incompatible como aprobada.
- Las decisiones de producto acordadas se registran a continuación. El recorrido funcional del configurador está acordado; el diseño final, la fuente definitiva del catálogo y los umbrales de evaluación siguen pendientes. Documentar estas decisiones no autoriza iniciar la implementación.

## Decisiones acordadas por objetivo

### OE1 — Catálogo curado

- Una vista propia de **Componentes**, con un catálogo amplio y filtros por categoría, precio, caso de uso y especificaciones relevantes para cada categoría.
- Fichas con imagen, datos principales, justificación técnica de la selección y especificaciones completas.
- Ampliación progresiva con datos consistentes y mantenidos. El catálogo sintético actual prueba el flujo, pero todavía no acredita curaduría de productos reales.

### OE2 — Configurador manual con reglas y bases curadas

- Se mantiene el objetivo de armado a medida, validación de compatibilidad y orientación según la necesidad.
- La vista **Equipos** incluye equipos predeterminados y una opción visible para **armar uno personalizado**.
- El armado personalizado comienza indicando uso y presupuesto y eligiendo una base curada para esos criterios. Si ninguna base encaja, se comunica el impedimento.
- El cliente puede sustituir componentes por categoría, consultar el total y completar el recorrido sin utilizar IA. Cada cambio actualiza el precio y vuelve a ejecutar las reglas del backend.
- La compatibilidad se deriva de atributos técnicos normalizados y reglas reutilizables. Agregar un producto con los atributos requeridos no debe exigir programar cada pareja de componentes. Las excepciones documentadas por fabricantes pueden registrarse cuando sean necesarias.
- El filtrado progresivo prioriza alternativas compatibles con la selección actual y permite consultar los conflictos de las demás. No se muestra una opción como plenamente compatible cuando faltan piezas o datos necesarios para comprobarla.
- Cada comprobación devuelve el contrato de [oe2-reglas.md](./oe2-reglas.md): id, estado, severidad, mensaje y componentes. Los estados son cumple, no cumple, sin datos y no aplica; la severidad es bloqueo, advertencia, sugerencia o nula.
- El estado global distingue Incompleta, No válida, Pendiente de datos y Validada. Solo Validada permite pedido, incluso con observaciones no bloqueantes visibles. El backend revalida al crear el pedido.
- La GPU dedicada es opcional y exige una decisión explícita. No elegirla aún mantiene la configuración incompleta; omitirla deliberadamente activa la comprobación de gráficos integrados y salida de placa.
- La primera versión usa refrigeración por aire y un SSD M.2 NVMe; AIO y múltiples unidades quedan fuera.
- Se puede revisar una selección con conflictos para sustituir varias piezas relacionadas. El diseño debe evitar que deshabilitar todas las opciones incompatibles impida cambiar de plataforma.
- El equipo base conserva su justificación editorial por caso de uso. Después de modificarlo, la compatibilidad comprobada no acredita automáticamente la misma adecuación ni rendimiento para ese uso.
- El MVP no incluye una evaluación general de rendimiento, puntuaciones globales de componentes, badges de estabilidad ni una comparación avanzada. Tampoco se promete detectar automáticamente cualquier sustitución que reduzca demasiado el rendimiento.
- Las especificaciones y las reglas viven en el backend y son compartidas por el configurador y el asistente. Las reglas básicas existentes no constituyen una certificación completa de ensamblaje.
- R15 orientará mediante los [cuatro perfiles definidos](./oe2-perfiles.md); sustituye la diferencia arbitraria de niveles CPU/GPU. Sus criterios distinguen políticas del proyecto y requisitos publicados. No se promete una evaluación universal de rendimiento.
- La distribución visual del configurador y la presentación del acceso al chat se definirán durante el diseño.

#### Alcance académico de referencia

| Elemento | Alcance propuesto |
| --- | --- |
| Categorías | 8: procesador, placa madre, RAM, GPU, almacenamiento, fuente, gabinete y refrigeración. |
| Catálogo | 10–15 productos por categoría: 80–120 productos en total. |
| Motor | 15 comprobaciones documentadas y probadas: R01–R12 estructurales y R13–R15 de BIOS, velocidad RAM y guía. La severidad depende del resultado; BIOS puede bloquear. |
| Equipos base | 4: diseño Photoshop, render CPU Blender, render GPU Blender y gaming Fortnite. Productos concretos pendientes; precio calculado desde el catálogo. |

Estas cantidades son una referencia de alcance, no una descripción de lo ya implementado. El motor puede desarrollarse con un catálogo menor y ampliarse después. Las cuatro bases no implican cuatro industrias: se mantienen render 3D, diseño gráfico y gaming como familias visibles.

La evidencia académica será el modelo de datos, la justificación y trazabilidad de las reglas y pruebas con casos válidos, inválidos y sin datos. No se promete cubrir un porcentaje universal de combinaciones del mercado ni una calificación académica sin conocer la rúbrica.

La ampliación comenzará con datos sintéticos explícitos y pruebas de las 15 comprobaciones. Los criterios de R15 están definidos; al incorporar productos reales se completará su evidencia. No toda comprobación se reduce a una comparación numérica; el soporte de un modelo o una versión de BIOS puede requerir evidencia adicional.

El [contrato revisado de 15 comprobaciones](./oe2-reglas.md) registra las decisiones sobre reglas, estados, GPU opcional y paso a pedido. Sustituye la propuesta anterior de 12 reglas; no describe funciones implementadas.

Se centralizarán las políticas del proyecto: margen de fuente 1,25, holgura física 10 mm y reserva base de sistema 50 W. Su cobertura debe justificarse para el catálogo. R11 bloquea si no se cubre el mínimo base y advierte si solo falta el margen; usa límites documentados de potencia, no TDP como sustituto automático.

El MVP no incluirá porcentajes de cuello de botella ni etiquetas de mejor relación precio/rendimiento sin evidencia. La adecuación de una base sigue siendo una decisión curada y no se conserva automáticamente tras cualquier sustitución.

### OE3 — Pedido persistente con etapas simuladas

- Conservar configuración, total y estado del pedido.
- Recorrido: configuración, resumen, pago simulado, pedido creado, ensamblaje, control de calidad y entrega.
- Una vista de gestión permite avanzar manualmente las etapas para demostrar el proceso.
- El cobro, el ensamblaje y la entrega son simulaciones explícitas. El pedido sí debe conservarse; no basta una pantalla de confirmación aislada.

### OE4 — Experiencia y navegación

- **Equipos** y **Componentes** son las dos vistas comerciales principales.
- Equipos presenta propuestas para render 3D, diseño gráfico y gaming, además de la entrada al armado personalizado.
- El homepage prioriza fotografía, titulares breves, presentación de Kamay y un carrusel visual de equipos.
- No se necesita una vista ni un enlace principal de **Nosotros**. La presentación de la marca puede quedar como sección breve del homepage.
- La experiencia debe explicar decisiones y errores y facilitar el acceso a la asesoría.
- El alcance de guía incluye Photoshop, Blender Cycles por CPU/GPU y Fortnite. Edición de video y otros programas quedan sin adecuación verificada en esta versión.

### OE5 — Asistente conectado al catálogo y a la validación

- IA real que consulte el catálogo, proponga componentes, ejecute la misma validación del configurador y explique resultados.
- La propuesta del asistente puede abrirse en el configurador y seguir editándose manualmente. El acceso al asistente es opcional durante el armado; el diseño de esa transición sigue pendiente.
- Ante fallos, conservar la conversación y permitir reintentar; derivación humana identificada como demostración.
- Evaluar con casos de requisitos completos, datos faltantes, presupuestos insuficientes, cambios incompatibles y solicitudes fuera de alcance.
- Medir uso exclusivo del catálogo, compatibilidad e integridad de propuestas presentadas como válidas, respeto del presupuesto o explicación del impedimento, preguntas pertinentes y utilidad técnica de las explicaciones.
- Los casos concretos, la rúbrica y los umbrales de aceptación todavía deben definirse.

## Próximo paso acordado

Los [perfiles y criterios de R15](./oe2-perfiles.md) quedan definidos. Sigue ampliar los datos sintéticos, adaptar el motor/API/asistente al contrato y crear cuatro bases demostrativas con pruebas. Después se completa el catálogo curado y la evidencia de productos reales.

El siguiente entregable visual sigue siendo una maqueta del homepage para escritorio y móvil antes de implementar: composición del hero, copy, fotografía, tipografía, paleta y carrusel de equipos. Equipos y Componentes serán las dos vistas comerciales; la asesoría debe tener una entrada clara. La maqueta todavía no está aprobada.

La evaluación avanzada de adecuación al uso queda fuera del alcance inicial. El catálogo actual continúa identificado como demostración hasta disponer de datos comerciales verificados.

## Estado actual

La API existente incluye un catálogo **sintético**, validación básica de compatibilidad y un endpoint de asesoría con IA. La interfaz Angular continúa en la plantilla inicial. Los datos sintéticos no representan productos ni precios de venta reales.
