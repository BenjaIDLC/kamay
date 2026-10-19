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

### OE2 — Personalización desde equipos base curados

- Se mantiene el objetivo de armado a medida, validación de compatibilidad y orientación según la necesidad.
- La vista **Equipos** incluye equipos predeterminados y una opción visible para **armar uno personalizado**.
- El armado personalizado comienza indicando uso y presupuesto y eligiendo una base curada para esos criterios. Si ninguna base encaja, se comunica el impedimento.
- El cliente puede sustituir componentes por categoría, consultar el total y completar el recorrido sin utilizar IA. Cada cambio actualiza el precio y vuelve a ejecutar las reglas del backend.
- Los conflictos explican las piezas involucradas; las comprobaciones sin información suficiente se muestran como pendientes. No se permite avanzar como configuración validada mientras esté incompleta o tenga comprobaciones requeridas fallidas o sin resolver.
- El equipo base conserva su justificación editorial por caso de uso. Después de modificarlo, la compatibilidad comprobada no acredita automáticamente la misma adecuación ni rendimiento para ese uso.
- El MVP no incluye una evaluación general de rendimiento, puntuaciones globales de componentes, badges de estabilidad ni una comparación avanzada. Tampoco se promete detectar automáticamente cualquier sustitución que reduzca demasiado el rendimiento.
- Las especificaciones y las reglas viven en el backend y son compartidas por el configurador y el asistente. Las reglas básicas existentes no constituyen una certificación completa de ensamblaje.
- Una evaluación adicional por programa requeriría requisitos y evidencia curados; queda fuera del alcance inicial, pendiente de una ampliación explícita.
- La distribución visual del configurador y la presentación del acceso al chat se definirán durante el diseño.

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
- Queda pendiente concretar el alcance de diseño gráfico, edición de video y render 3D para formular preguntas y evaluar recomendaciones.

### OE5 — Asistente conectado al catálogo y a la validación

- IA real que consulte el catálogo, proponga componentes, ejecute la misma validación del configurador y explique resultados.
- La propuesta del asistente puede abrirse en el configurador y seguir editándose manualmente. El acceso al asistente es opcional durante el armado; el diseño de esa transición sigue pendiente.
- Ante fallos, conservar la conversación y permitir reintentar; derivación humana identificada como demostración.
- Evaluar con casos de requisitos completos, datos faltantes, presupuestos insuficientes, cambios incompatibles y solicitudes fuera de alcance.
- Medir uso exclusivo del catálogo, compatibilidad e integridad de propuestas presentadas como válidas, respeto del presupuesto o explicación del impedimento, preguntas pertinentes y utilidad técnica de las explicaciones.
- Los casos concretos, la rúbrica y los umbrales de aceptación todavía deben definirse.

## Próximo paso acordado

Preparar una maqueta visual del homepage para escritorio y móvil antes de implementar: composición del hero, copy, fotografía, tipografía, paleta y carrusel de equipos. Equipos y Componentes serán las dos vistas comerciales; la asesoría debe tener una entrada clara.

La estructura y el recorrido funcional ya están definidos. La evaluación avanzada de adecuación al uso no bloquea el diseño del homepage. El catálogo actual continúa identificado como demostración hasta disponer de datos comerciales verificados.

## Estado actual

La API existente incluye un catálogo **sintético**, validación básica de compatibilidad y un endpoint de asesoría con IA. La interfaz Angular continúa en la plantilla inicial. Los datos sintéticos no representan productos ni precios de venta reales.
