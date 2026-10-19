# Kamay — contexto para Claude

@AGENTS.md

Proyecto integrador universitario: tienda de computadoras armadas a medida (Perú, precios en soles) con configurador que valida compatibilidad y asesor con IA. Alcance, objetivos y guion de demo en [docs/mvp.md](docs/mvp.md); puesta en marcha en [README.md](README.md).

## Preferencias del usuario

- Responder en **español**.
- Commits: mensaje **en minúscula**, en inglés, corto y **sin firma de Claude** (sin `Co-Authored-By`). Hacer commit y push solo cuando el usuario lo pida.
- Prioridad: algo **funcional y demostrable**, no precisión de producto comercial. Evitar sobreingeniería y documentación excesiva.
- Mantener este archivo al día al terminar una tarea importante (estado, decisiones, pendientes).

## Estado actual

- Funciona de punta a punta: Inicio (hero rotativo) → Equipos → Componentes → Configurador → Checkout con pago simulado → Seguimiento del pedido. Además, Asesor IA y gestión de pedidos (`/pedidos`).
- `npm run api:test` cubre motor, API, pedidos y asesor con un proveedor simulado (13 tests).
- **Bloqueo:** la clave de OpenAI en `.env` (organización personal `user-szibvoo…`) da `insufficient_quota`: falta cargar créditos de API en platform.openai.com. La suscripción de ChatGPT no los incluye. Cuando haya saldo, correr `npm run api:test:live` y afinar el prompt de [backend/advisor.mts](backend/advisor.mts).

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

1. Cargar créditos de OpenAI y probar y afinar el asesor con conversaciones reales.
2. Evaluación del asesor (OE5): casos de prueba (datos completos, datos faltantes, presupuesto insuficiente, cambio incompatible, fuera de alcance) y una rúbrica.
3. Fotografía real de producto para el hero y las tarjetas.

## Verificación visual

Para revisar la UI sin navegador interactivo: levantar Chrome headless con `--remote-debugging-port=9333` y controlarlo por CDP con un script de Node para hacer clics y capturas. Así se validaron los flujos y las vistas en escritorio (1440 px) y móvil (390 px).
