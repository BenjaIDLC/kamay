# Kamay — contexto para Claude

@AGENTS.md

Proyecto integrador universitario: tienda de computadoras armadas a medida (Perú, precios en soles) con configurador que valida compatibilidad y asesor con IA. Alcance, objetivos y guion de demo en [docs/mvp.md](docs/mvp.md); puesta en marcha en [README.md](README.md).

## Preferencias del usuario

- Responder en **español**.
- Commits: mensaje **en minúscula**, en inglés, corto y **sin firma de Claude** (sin `Co-Authored-By`). Hacer commit y push solo cuando el usuario lo pida.
- Prioridad: algo **funcional y demostrable**, no precisión de producto comercial. Evitar sobreingeniería y documentación excesiva.
- Mantener este archivo al día al terminar una tarea importante (estado, decisiones, pendientes).
- Explicaciones para presentar (guiones, sustentación): equilibrar técnica y claridad. Por cada pieza, primero el **nombre técnico** (p. ej. "SPA", "API REST", "capa de dominio"), luego una explicación estándar de desarrollo de software que se entienda, y al final el **paralelo abstracto** (p. ej. "es la cocina", "aquí definimos las reglas del negocio"). Ni puro tecnicismo ni solo analogías.
- UI: prefiere layouts aireados (p. ej. tarjetas de 2 por fila, botones a todo el ancho del contenedor, tablas con bordes claros) y revisa con capturas.
- Entorno: Windows, PowerShell y VS Code. Para desarrollar hay que tener dos terminales abiertas: `npm run api:start` (API en el puerto 3000, lee `.env` solo al arrancar) y `npm start` (frontend en el 4200).

## Estado actual

- Funciona de punta a punta: Inicio (hero rotativo) → Equipos → Componentes → Configurador → Checkout con pago simulado → Seguimiento del pedido. Además, Asesor IA y gestión de pedidos (`/pedidos`).
- `npm run api:test` cubre motor, API, pedidos y asesor con un proveedor simulado (14 tests).
- OpenAI con créditos cargados: `npm run api:test:live` pasa (conversación de 3 turnos, unos centavos por corrida). Con `ADVISOR_DEBUG=1` se registran las llamadas a herramientas.
- Asesor: `search_catalog` no filtra por uso (devuelve `suggestedFor`), y el cliente reenvía la última propuesta (`proposal` en `/api/advice`) para que el modelo conozca sus IDs; sin eso, el modelo gastaba las 8 rondas buscando piezas.
- Página Equipos rediseñada: 2 tarjetas por fila, tabla con las 8 piezas en orden fijo ("Gráficos integrados" si no hay GPU) y botones a todo el ancho.

## Presentación (en curso)

- Guion en [docs/guion-presentacion.md](docs/guion-presentacion.md): **5 minutos, 7 diapositivas**, con el asesor IA como hilo conductor. Se sigue un mensaje del chat al pedido y por el camino se explican la arquitectura, el motor de 8 reglas y el frontend. Formato nombre técnico → explicación → paralelo del restaurante (salón, mesero, cocina, proveedor y asesor de sala). Incluye respuestas para preguntas frecuentes.
- Títulos descriptivos, sin frases de marketing. El usuario cortó "Propuesta", "Límites del prompt" y "Lo que aprendimos"; esos temas quedan en "Si preguntan" o resumidos.
- Integrantes: Benjamin Andres Illescas De la Cruz, Ayrton Josue Vilca Navarro y Diego Medina De la Rosa.
- El deck en claude.ai (https://claude.ai/artifact/3fyFVwHgLUTmjmtahycvkr) ya sigue el guion: 7 diapositivas, con el texto del guion en las notas del orador. Cualquiera con el enlace puede verlo. El usuario también lo edita a mano: leer siempre la versión actual antes de publicar.
- Una versión anterior de la presentación prometía más de lo que hace el MVP: base de datos MySQL de 19 tablas, 7 herramientas, usuarios, postventa y evaluación con 30–50 escenarios. Distinguir siempre lo **diseñado** de lo **implementado**.
- Por verificar: costo real por mensaje (panel de uso de OpenAI) y si el repo de GitHub se hace público.

## Decisiones tomadas (no revertir sin consultar)

- **Motor simple de 8 reglas** en [backend/compatibility.mts](backend/compatibility.mts): socket, memoria, formato, espacio GPU, cooler, video, potencia y uso. Estados de regla: `ok`, `advertencia`, `bloqueo`, `pendiente`, `no_aplica`. Estado global: `incompleta`, `no_valida` o `valida`. La GPU es opcional.
  - El motor anterior de 15 reglas, con catálogo sintético y docs extensos, está archivado en la rama `archivo/motor-15-reglas`. Se abandonó por exceso de complejidad; no recuperarlo.
- **Catálogo con productos reales** (Ryzen 9000, Core Ultra, RTX 50…) en [backend/catalog.mts](backend/catalog.mts): 33 productos y precios referenciales en PEN. Agregar un producto = añadir una fila.
- 4 perfiles de uso (diseño, render CPU, render GPU, gaming) y 4 equipos base en `backend/profiles.mts` y `backend/builds.mts`.
- El cliente nunca decide precio ni compatibilidad: el servidor valida en cada cambio y revalida al crear el pedido.
- Pedidos en `data/orders.json` (ignorado por git), sin base de datos.
- **Frontend:** Angular 22 como SPA, sin SSR. Usa signals, `httpResource`, `@Service()` y Signal Forms en el checkout. Proxy `/api` → `127.0.0.1:3000`. El estado del configurador vive en `ConfiguratorStore` (persistido en localStorage) y la conversación en `AdvisorStore`.
- **Estilo visual inspirado en el layout de nzxt.com:** hero redondeado rotativo con 3 diapositivas (asesor, compatibilidad, equipos), acento violeta `#7c3aed`, Montserrat, botones píldora, tarjetas grises redondeadas y cabecera negra.
  - Copy, colores e ilustraciones son propios; nunca usar assets ni textos de NZXT.
  - Las torres son un SVG original ([src/app/shared/tower-art.ts](src/app/shared/tower-art.ts)) hasta tener fotografía con derechos de uso.
- Accesibilidad: WCAG AA. El carrusel tiene botón de pausa y respeta `prefers-reduced-motion`. Pago, ensamblaje y derivación a humano se presentan siempre como simulaciones.

## Pendiente

1. Seguir afinando el asesor con conversaciones reales (respuestas aún algo largas).
2. Evaluación del asesor (OE5): casos de prueba (datos completos, datos faltantes, presupuesto insuficiente, cambio incompatible, fuera de alcance) y una rúbrica.
3. Fotografía real de producto para el hero y las tarjetas.
4. Base de datos (aplazada por ser un MVP; así se justifica en la presentación). Opción prevista: SQLite con `node:sqlite`, cambiando solo `OrderStore`; el catálogo podría pasar después a una tabla.

## Verificación visual

Para revisar la UI sin navegador interactivo: levantar Chrome headless con `--remote-debugging-port=9333` y controlarlo por CDP con un script de Node para hacer clics y capturas. Así se validaron los flujos y las vistas en escritorio (1440 px) y móvil (390 px).

- Para móvil usar `Emulation.setDeviceMetricsOverride` (con `--window-size`, Chrome headless no baja de ~500 px y la captura sale cortada).
- El `--user-data-dir` de Chrome y los scripts van en una carpeta temporal, nunca dentro del repo.
