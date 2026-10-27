# Kamay — contexto para Claude

@AGENTS.md

Proyecto integrador universitario: tienda de computadoras armadas a medida (Perú, precios en soles) con configurador que valida compatibilidad y asesor con IA. Alcance, objetivos y guion de demo en [docs/mvp.md](docs/mvp.md); puesta en marcha en [README.md](README.md).

## Preferencias del usuario

- Responder en **español**.
- Commits: mensaje **en minúscula**, en inglés, corto y **sin firma de Claude** (sin `Co-Authored-By`). Hacer commit y push solo cuando el usuario lo pida. Se trabaja y se hace push **directamente en `master`** (el usuario trabaja solo en el repo); no crear ramas ni PR.
- Prioridad: algo **funcional y demostrable**, no precisión de producto comercial. Evitar sobreingeniería y documentación excesiva.
- Mantener este archivo al día al terminar una tarea importante (estado, decisiones, pendientes).
- Explicaciones para presentar (guiones, sustentación): equilibrar técnica y claridad. Por cada pieza, primero el **nombre técnico** (p. ej. "SPA", "API REST", "capa de dominio"), luego una explicación estándar de desarrollo de software que se entienda, y al final el **paralelo abstracto** (p. ej. "es la cocina", "aquí definimos las reglas del negocio"). Ni puro tecnicismo ni solo analogías.
- UI: prefiere layouts aireados (p. ej. tarjetas de 2 por fila, botones a todo el ancho del contenedor, tablas con bordes claros) y revisa con capturas.
- Entorno: Windows, PowerShell y VS Code. Para desarrollar hay que tener dos terminales abiertas: `npm run api:start` (API en el puerto 3000, lee `.env` solo al arrancar) y `npm start` (frontend en el 4200).

## Estado actual

- Funciona de punta a punta: Inicio (hero rotativo) → Equipos → Componentes → Configurador → Checkout con pago simulado → Seguimiento del pedido. Además, Asesor IA y gestión de pedidos (`/pedidos`).
- `npm run api:test` cubre motor, base de datos, API, pedidos y asesor con un proveedor simulado (18 tests).
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

## Informe APF3 (en curso)

- Consigna: Avance de Proyecto Final 3, semana 12, de un curso que pide Java (MVC, TDD, DAO, SOLID, Guava/POI/Commons/Logback). Acordado con el usuario: no aplica Java ni librerías Java, y no se fuerza ninguna arquitectura; se documenta lo que existe.
- Enfoque: "construcción hacia atrás" de la planificación a partir del repo. El informe anterior (MySQL de 19 tablas, 7 herramientas, Claude API, 46 RF/25 RNF) prometía más; se reescribe para que coincida con el código, sin columnas de estado ni "prioridad MVP": lo que sobra se borra.
- Se sigue la numeración del informe original (8 Inicio, 9 Planificación, 9.4 Datos…), sección por sección, en formato "lo que teníamos → lo que hay → lo que sugiero". Las secciones sin cambios se copian del Word.
- Requerimientos: 26 RF y 18 RNF reescritos sobre el producto, más RF-27 a 33 que el usuario quiere recuperar (cuentas y roles cliente/administrador, perfil con RUC, comparador de hasta 3 componentes, CRUD de catálogo). Decidido: compra como invitado, boleta o factura (con RUC), sin recuperación de contraseña, y solo los roles cliente y administrador.
- La evaluación del asesor (OE5) se mantiene como RNF con metas; falta definir los casos y la rúbrica, y ejecutarla.
- Base de datos: SQLite en lugar de MongoDB (sin servidor, funciona sin internet y es coherente con el diseño relacional evaluado antes). Fase A implementada: 13 tablas, specs como columnas, y los pedidos de prueba de `orders.json` se descartaron. Puntos 1–9 y 11 del informe aprobados.
- Mediciones del RNF-01 (build de producción con gzip): validación en la API con p95 de 6 ms; cambio de pieza hasta ver el resultado, ~70 ms; páginas en ~0,3 s sin limitar la red y ~2,3 s con 4G lento + CPU 4x.
- TSDoc en `backend/` y `src/app/core/`; `npm run docs` genera la documentación con TypeDoc en `dist/docs`.

## Decisiones tomadas (no revertir sin consultar)

- **Motor simple de 8 reglas** en [backend/compatibility.mts](backend/compatibility.mts): socket, memoria, formato, espacio GPU, cooler, video, potencia y uso. Estados de regla: `ok`, `advertencia`, `bloqueo`, `pendiente`, `no_aplica`. Estado global: `incompleta`, `no_valida` o `valida`. La GPU es opcional.
  - El motor anterior de 15 reglas, con catálogo sintético y docs extensos, está archivado en la rama `archivo/motor-15-reglas`. Se abandonó por exceso de complejidad; no recuperarlo.
- **Catálogo con productos reales** (Ryzen 9000, Core Ultra, RTX 50…) en [backend/catalog.mts](backend/catalog.mts): 34 productos y precios referenciales en PEN. Son los datos iniciales de la base de datos.
- 4 perfiles de uso (diseño, render CPU, render GPU, gaming) y 4 equipos base en `backend/profiles.mts` y `backend/builds.mts`.
- El cliente nunca decide precio ni compatibilidad: el servidor valida en cada cambio y revalida al crear el pedido.
- **Base de datos SQLite** (`node:sqlite`, requiere Node ≥ 22.13) en `data/kamay.db` (ignorado por git), con el esquema en [backend/schema.sql](backend/schema.sql): 13 tablas, ya incluidas las de usuarios, sesiones y comprobante. Al arrancar se aplica el esquema y, si la base está vacía, se cargan los datos iniciales de `catalog.mts`, `profiles.mts` y `builds.mts`.
  - Patrón repositorio: `CatalogRepository` mantiene el catálogo en memoria (hay que llamar a `reload()` después de modificarlo) y `useCatalog()`/`catalog()` lo exponen al motor. `OrderRepository` guarda cada pedido en una transacción. Los tests usan `:memory:`.
  - Los componentes se desactivan (`activo = 0`), nunca se borran; un equipo base con una pieza inactiva se oculta. Los pedidos copian nombre y precio al comprar.
- **Frontend:** Angular 22 como SPA, sin SSR. Usa signals, `httpResource`, `@Service()` y Signal Forms en el checkout. Proxy `/api` → `127.0.0.1:3000`. El estado del configurador vive en `ConfiguratorStore` (persistido en localStorage) y la conversación en `AdvisorStore`.
- **Estilo visual inspirado en el layout de nzxt.com:** hero redondeado rotativo con 3 diapositivas (asesor, compatibilidad, equipos), acento violeta `#7c3aed`, Montserrat, botones píldora, tarjetas grises redondeadas y cabecera negra.
  - Copy, colores e ilustraciones son propios; nunca usar assets ni textos de NZXT.
  - Las torres son un SVG original ([src/app/shared/tower-art.ts](src/app/shared/tower-art.ts)) hasta tener fotografía con derechos de uso.
- Accesibilidad: WCAG AA. El carrusel tiene botón de pausa y respeta `prefers-reduced-motion`. Pago, ensamblaje y derivación a humano se presentan siempre como simulaciones.

## Pendiente

1. Seguir afinando el asesor con conversaciones reales (respuestas aún algo largas).
2. Evaluación del asesor (OE5): casos de prueba (datos completos, datos faltantes, presupuesto insuficiente, cambio incompatible, fuera de alcance) y una rúbrica.
3. Fotografía real de producto para el hero y las tarjetas.
4. Fases B (cuentas y roles: compra como invitado, boleta/factura con RUC, sin recuperación de contraseña; roles cliente y administrador), C (panel de administración del catálogo) y D (comparador). La fase A (base de datos) ya está hecha.

## Verificación visual

Para revisar la UI sin navegador interactivo: levantar Chrome headless con `--remote-debugging-port=9333` y controlarlo por CDP con un script de Node para hacer clics y capturas. Así se validaron los flujos y las vistas en escritorio (1440 px) y móvil (390 px).

- Para móvil usar `Emulation.setDeviceMetricsOverride` (con `--window-size`, Chrome headless no baja de ~500 px y la captura sale cortada).
- El `--user-data-dir` de Chrome y los scripts van en una carpeta temporal, nunca dentro del repo.
