# Kamay — propuesta de frontend para el MVP

Estado: propuesta de diseño para revisar. No autoriza implementación ni fija todavía imágenes, colores o tipografías definitivas.

Los acuerdos de producto se registran en [objetivos-mvp.md](./objetivos-mvp.md). OE2 contempla armado manual desde bases curadas, atributos técnicos normalizados, reglas reutilizables y filtrado progresivo. Su alcance es de 8 categorías, 10–15 productos por categoría, 15 comprobaciones y 4 bases. El contrato revisado está en [oe2-reglas.md](./oe2-reglas.md) y los cuatro perfiles definidos en [oe2-perfiles.md](./oe2-perfiles.md). La maqueta visual y la distribución de las pantallas siguen pendientes.

## Idea central

Kamay vende una decisión técnica bien acompañada, no una lista interminable de componentes. El homepage debe despertar interés mediante fotografía y titulares breves; el asistente convierte ese interés en una configuración validada. Las builds predeterminadas son puntos de partida por caso de uso, nunca promesas de rendimiento.

La referencia de adidas.com se toma por su jerarquía de campañas visuales, titulares directos, llamadas a la acción claras y módulos horizontales de exploración. La identidad, el contenido y las imágenes de Kamay deben ser propios.

## Sketch del homepage

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ KAMAY                           Equipos   Componentes   [Asesor IA]         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FOTOGRAFÍA HERO A SANGRE: entorno creativo o equipo en uso,                 │
│  con espacio visual suficiente para leer el texto                            │
│                                                                              │
│  TU PRÓXIMA GRAN IDEA                                                         │
│  NECESITA EL EQUIPO CORRECTO.                                                 │
│  Hardware elegido para lo que realmente haces.                                │
│  [Encuentra tu equipo]  [Explora equipos]                                     │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  NO VENDEMOS SOLO COMPONENTES.                                                │
│  Diseñamos equipos alrededor de tu trabajo y validamos cada elección.         │
├──────────────────────────────────────────────────────────────────────────────┤
│  UN PUNTO DE PARTIDA PARA CADA MUNDO                              [←] [→]    │
│  ┌──────────────────────────┐  ┌──────────────────────────┐                    │
│  │ IMAGEN GRANDE            │  │ IMAGEN GRANDE            │  →                 │
│  │ RENDER 3D                │  │ DISEÑO GRÁFICO           │                    │
│  │ [Ver equipo]             │  │ [Ver equipo]             │                    │
│  └──────────────────────────┘  └──────────────────────────┘                    │
│  Tercera tarjeta: GAMING                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  TU USO ES ÚNICO. TU EQUIPO TAMBIÉN DEBERÍA SERLO.                            │
│  Cuéntale a nuestro asistente qué haces y recibe una propuesta validada.       │
│  [Hablar con el asistente]                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Información de demostración · Navegación · Contacto                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

En móvil: navegación compacta, hero con recorte y composición propios, un carrusel que muestra una tarjeta completa por vez y controles visibles. El texto no debe quedar encima de zonas fotográficas que impidan leerlo.

## Dirección visual propuesta

- Fotografía protagonista, con personas creando o usando el equipo; las torres y componentes sirven como contexto visual, sin convertir la página en una ficha técnica.
- Titulares grandes, de peso alto y líneas cortas. Texto secundario sobrio y breve.
- Base clara o carbón, un solo color de acento y bordes rectos. Definir paleta y fuentes con muestras visuales antes de implementarlas.
- Movimiento mínimo: transiciones funcionales del carrusel, sin animaciones que retrasen la navegación. Respetar la preferencia de movimiento reducido.
- En homepage, las tarjetas muestran imagen, nombre del caso de uso y una acción. Especificaciones, motivos, precio y advertencias viven en la vista de detalle.

## Qué piden los objetivos para la navegación

Se acuerdan dos vistas comerciales: **Equipos**, con propuestas por uso y una entrada al armado personalizado, y **Componentes**, con un catálogo amplio y justificación técnica (OE1). Para OE2 se ha elegido un configurador manual desde bases curadas, utilizable sin IA. También se requieren asesoría con IA (OE5), un recorrido de pedido (OE3) y una experiencia visual coherente (OE4). La presentación breve de Kamay queda en el homepage, sin una vista ni un enlace principal de Nosotros.

## Mapa de pantallas del MVP

| Pantalla | Propósito | Acción principal |
| --- | --- | --- |
| Inicio | Presentar Kamay y abrir un camino claro hacia la asesoría | Encontrar mi equipo |
| Equipos | Mostrar equipos predeterminados para render 3D, diseño gráfico y gaming, y la opción de armar uno personalizado | Ver equipo o iniciar armado personalizado |
| Detalle de equipo | Explicar selección, componentes, precio de demostración y límites de validación | Continuar con el equipo o personalizarlo |
| Componentes | Explorar piezas por categoría, precio y caso de uso, con su justificación técnica | Ver componente |
| Detalle de componente | Mostrar especificaciones disponibles, motivo de selección y límites de la información | Consultar la pieza; su compatibilidad depende de la configuración |
| Armado personalizado | Elegir una base según uso y presupuesto y sustituir componentes con validación | Guardar configuración |
| Asesor IA | Recoger necesidades, recomendar desde el catálogo y explicar la validación | Abrir la propuesta en el configurador |
| Configuración guardada | Revisar selección y validación actual antes de avanzar | Crear pedido |
| Pedido simulado | Revisar resumen y mostrar las etapas de ensamblaje, control y entrega como demostración | Confirmar simulación |

Equipos y Componentes se basan en el mismo catálogo del backend. Un equipo predeterminado o una propuesta de IA puede abrirse en el configurador. El armado manual funciona sin IA y cada cambio requiere validación del servidor. La disposición visual de estas funciones y una posible acción para añadir piezas directamente desde Componentes siguen pendientes.

## Recorrido acordado desde la perspectiva del usuario

1. Desde el homepage, explorar Equipos, consultar Componentes o entrar al asistente.
2. En Equipos, revisar una propuesta para render 3D, diseño gráfico o gaming y continuar con ella o personalizarla.
3. Para armar uno personalizado, indicar uso y presupuesto y elegir una base curada; si no existe una opción adecuada a esos criterios, ver una explicación.
4. En el configurador, revisar piezas y total y sustituir componentes por categoría. Las alternativas compatibles con la selección actual aparecen primero; las demás explican sus conflictos o los datos pendientes. Se puede elegir explícitamente continuar sin GPU dedicada, activando la comprobación de salida de video integrada.
5. Consultar el resultado de cada comprobación y distinguir bloqueos, advertencias y sugerencias. Corregir los conflictos o completar los datos requeridos para avanzar. Una configuración modificada no hereda automáticamente la recomendación de uso de la base.
6. Opcionalmente, consultar al asistente y abrir su propuesta en el mismo configurador. Un fallo conserva la conversación y permite reintentar.
7. Guardar la configuración y revisar el resumen antes de crear un pedido. El estado global será Incompleta, No válida, Pendiente de datos o Validada. Solo Validada avanza a pedido; puede tener advertencias o sugerencias visibles. El backend vuelve a evaluar al crear el pedido.
8. Completar el pago simulado y consultar el pedido persistente y sus etapas demostrativas.

El MVP comprueba reglas declaradas y tendrá guía R15 mediante los cuatro perfiles definidos. No incluye una evaluación general de rendimiento ni garantiza que cada modificación conserve la adecuación al uso. No se asignan puntuaciones globales ni badges de estabilidad a las piezas.

## Comportamiento que debe quedar claro

1. Equipos ofrece una entrada al armado desde bases curadas. La asesoría es opcional y sus propuestas pueden abrirse en el configurador.
2. La IA pregunta por uso, software, exigencia, presupuesto y componentes existentes cuando falten datos.
3. Cada propuesta muestra componentes del catálogo, justificación, total calculado en servidor y comprobaciones de compatibilidad. Los datos sintéticos se identifican como demostración.
4. Un cambio de componente vuelve a validar la configuración. Una selección incompleta o con bloqueos incumplidos o sin datos no se presenta como aprobada ni puede avanzar como pedido validado.
5. Si falla la IA, se conserva la conversación y se ofrece reintentar. La derivación humana es un botón de demostración y debe decirlo.
6. El pedido y el pago son simulados; la interfaz nunca debe sugerir que se cobró dinero o que alguien ensamblará y entregará el equipo.

## Estados y accesibilidad

- Carga, conversación inicial, datos insuficientes, propuesta disponible, incompatibilidad, error recuperable y configuración guardada.
- El panel muestra las quince comprobaciones y separa resultado (cumple, no cumple, sin datos, no aplica) de severidad (bloqueo, advertencia, sugerencia o nula), mostrando motivos y piezas afectadas.
- No aplica distingue en su mensaje entre elecciones aún pendientes y condiciones omitidas deliberadamente. Sin datos señala la información que falta de las piezas o del contexto ya elegidos.
- El filtro no debe ocultar los motivos de incompatibilidad ni impedir revisar varias piezas para cambiar de plataforma. No debe anunciar compatibilidad completa con datos insuficientes.
- Carrusel navegable con botones anterior/siguiente, teclado, indicadores comprensibles y foco visible; sin reproducción automática.
- Un H1 por pantalla, controles con nombre accesible, contraste WCAG AA, estados de carga y errores anunciados, y foco gestionado al navegar o mostrar resultados.
- Imágenes con texto alternativo útil; imágenes decorativas con texto alternativo vacío. Se requieren versiones y recortes para escritorio y móvil.

## Orden de trabajo propuesto

1. Aplicar los [perfiles definidos](./oe2-perfiles.md) al [contrato revisado de 15 comprobaciones](./oe2-reglas.md), adaptando el backend y las herramientas del asistente.
2. Ampliar los datos sintéticos y construir cuatro bases demostrativas con pruebas; completar después el catálogo curado y sus fuentes. Se puede comenzar con menos productos para desarrollar el motor.
3. Aprobar la maqueta del homepage, el tono de los titulares y las referencias fotográficas. El carrusel conserva tres familias: diseño, render 3D (bases CPU y GPU) y gaming.
4. Implementar homepage adaptable y carrusel accesible, con enlaces reales a Equipos, Componentes y Asesor IA.
5. Diseñar e implementar las vistas de catálogo y el armado personalizado con filtrado progresivo, y conectar el asistente al mismo motor de validación.
6. Incorporar guardado, revisión y pedido simulado; probar el recorrido completo en escritorio y móvil.

## Próximos entregables

El [contrato revisado de las 15 comprobaciones de OE2](./oe2-reglas.md) y los [cuatro perfiles](./oe2-perfiles.md) ya están documentados. Sigue adaptar el backend y construir bases demostrativas. El siguiente entregable visual será la maqueta del homepage en escritorio y móvil, con fotografía del hero, copy, paleta, tipografía, proporciones y carrusel. La estructura textual actual es un sketch, no un diseño final aprobado. La implementación del homepage comienza después de acordar esa maqueta.

## Decisiones abiertas

- Fuentes de los productos y justificación de las políticas de potencia y holgura. Las quince comprobaciones no certifican todo el hardware.
- Distribución visual del configurador y acceso al asistente; posible incorporación de piezas directamente desde Componentes.

- Fotografía final del hero y de cada caso de uso, con derechos de uso claros.
- Voz de marca: más técnica, más editorial o un punto intermedio.
- Paleta, fuentes y tratamiento de imagen.
- Fuente definitiva del catálogo, disponibilidad y precios. El catálogo actual es sintético.
- Selección de productos concretos para las cuatro bases y evidencia de soporte de software. En el prototipo pueden recorrer un pedido simulado; no son ofertas comerciales reales.
