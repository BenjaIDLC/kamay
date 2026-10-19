# Kamay: primer flujo de asesoría

> Documento inicial de referencia. Los acuerdos actuales de alcance y recorrido están en [objetivos-mvp.md](./objetivos-mvp.md) y [plan-frontend.md](./plan-frontend.md), que prevalecen sobre este esquema. La disposición del chat, los perfiles, el contrato REST y la secuencia de este documento son propuestas iniciales, no una descripción de funcionalidades implementadas. El siguiente entregable es la maqueta del homepage.

## Resultado del primer hito

Una persona describe su necesidad, recibe una propuesta basada en el catálogo,
consulta los motivos y las comprobaciones de compatibilidad, y guarda el equipo.
La recomendación debe funcionar con IA real; una conversación guionada no cumple el hito.

## Esquema de la interfaz

```text
KAMAY                                      Mis configuraciones
──────────────────────────────────────────────────────────────
Configura tu próximo equipo

¿Para qué lo necesitas?
[Edición de video] [Diseño y renderizado 3D] [Gaming]

──────────────────────────────┬───────────────────────────────
Conversación                  │ Tu configuración
                              │
Cuéntame qué programas usas    │ Componentes seleccionados
y cuál es tu presupuesto.      │ Motivo de cada elección
                              │ Precio total y moneda
[Escribe tu respuesta…]       │
[Enviar]                      │ Compatibilidad
                              │ Comprobaciones y limitaciones
                              │
                              │ [Guardar configuración]
                              │ [Solicitar un asesor]
```

En móvil, conversación y configuración ocupan vistas alternables, conservando el
borrador. La acción «Ver configuración» permanece accesible durante la conversación.
No se permite guardar como validado un equipo incompleto o con reglas sin resolver.

Estados que debe comunicar la interfaz: consultando, propuesta disponible,
incompatibilidad, información insuficiente, error recuperable y configuración guardada.
Un fallo de la IA conserva la conversación y permite reintentar.

## Preguntas necesarias

- Uso principal, programas y exigencia: resolución de video, motor de renderizado
  o juegos/resolución/FPS deseados, según corresponda.
- Presupuesto, moneda y si incluye periféricos.
- Componentes existentes que se desean reutilizar, con modelo identificable.

El asistente pregunta por datos faltantes antes de afirmar que el equipo satisface
la necesidad. No promete FPS o tiempos de renderizado sin evidencia disponible.

## Responsabilidades del backend

- Catálogo curado: identificador, categoría, modelo, precio y moneda, disponibilidad,
  especificaciones técnicas y justificación por caso de uso.
- Validación determinista: socket CPU/placa, generación y soporte de RAM,
  formato placa/gabinete y capacidad básica de alimentación con una política documentada.
- Asesoría: consulta el catálogo y la validación; nunca inventa productos,
  precios, existencias ni un resultado de compatibilidad.
- Persistencia: guarda requisitos y componentes; al reabrir, informa cambios de
  precio/disponibilidad y vuelve a comprobar la configuración.
- Derivación demostrativa: muestra un resumen y un aviso explícito de simulación;
  no afirma haber conectado con una persona.

Una regla tiene resultado «cumple», «no cumple» o «sin datos». La ausencia de una
especificación nunca cuenta como compatibilidad confirmada. El resultado enumera
las comprobaciones realizadas; no certifica BIOS, conectores o espacio físico.
El equipo necesita todas las categorías obligatorias antes de validarse como completo.

## Contrato REST inicial propuesto

| Operación | Responsabilidad |
| --- | --- |
| `GET /api/components` | Consultar el catálogo con filtros por categoría y uso. |
| `POST /api/configurations/validate` | Recibir identificadores y devolver integridad, reglas, motivos y total calculado en servidor. |
| `POST /api/conversations` | Crear una conversación con el perfil elegido. |
| `POST /api/conversations/:id/messages` | Recibir un mensaje y devolver respuesta, propuesta y validación cuando existan. |
| `POST /api/configurations` | Guardar requisitos y componentes después de validarlos en servidor. |
| `GET /api/configurations/:id` | Recuperar una configuración autorizada con su estado actual. |

El cliente no decide precios ni compatibilidad. Los cuerpos, límites de entrada y
errores se concretarán al implementar la prueba. Las claves de IA quedan en servidor;
los identificadores de conversación/configuración no sustituyen autorización.
No se expondrán conversaciones o configuraciones privadas a otros visitantes.

## Prueba que debe pasar antes de ampliar la tienda

1. Una solicitud con presupuesto y uso produce solo componentes existentes y un
   total calculado por el backend, o explica por qué no existe una solución.
2. CPU y placa incompatibles provocan rechazo, también si la IA propone la pareja.
3. Un dato técnico ausente aparece como «sin datos», nunca como aprobado.
4. Un cambio solicitado por el usuario vuelve a ejecutar la validación.
5. Guardar y recuperar conserva la selección; los cambios de catálogo se comunican.
6. Un fallo del proveedor de IA produce un error recuperable, sin recomendación ficticia.
7. Una solicitud fuera de alcance ofrece la derivación simulada y su resumen.

## Dirección visual acordada

Español, identidad Kamay, estilo editorial claro, fotografía protagonista,
tipografía de impacto y CTAs directos. Bordes rectos, sin radios, sin desplazamientos
ni escalados al pasar el cursor, sin cejas decorativas ni texto de relleno.
La planificación actual comienza por la maqueta del homepage; véase el orden de trabajo en [plan-frontend.md](./plan-frontend.md).

## Secuencia inicial de implementación (referencia histórica)

1. Este esquema y límites del MVP.
2. Catálogo pequeño y reglas de compatibilidad, con pruebas de casos válidos,
   incompatibles y datos insuficientes.
3. Integración real de IA con las operaciones del backend.
4. Una pantalla Angular conectada mediante HttpClient y Router.
5. Guardado y recuperación; evaluación de los tres perfiles.
6. Diseño final, catálogo público y demostración de pedidos.

## Decisiones pendientes antes del backend

- Tecnología exigida por la asignatura, si existe. Propuesta inicial: TypeScript
  y Express, ya instalado; no confundir el servidor SSR actual con una API terminada.
- Base de datos y despliegue disponibles; definir también propiedad de las configuraciones.
- País/moneda y fuente autorizada del catálogo y sus precios.
- Proveedor/modelo de IA y credenciales de servidor, configuradas fuera del repositorio.

El proyecto inspeccionado es Angular 22.2 con Router y SSR/prerenderizado de plantilla.
El requisito de SPA queda registrado; la estrategia de renderizado se ajustará al
implementar las rutas, sin modificarla como parte de este documento.
