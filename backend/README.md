# API de Kamay: catálogo y compatibilidad

Primera etapa del backend, independiente del servidor SSR de Angular. Usa las
dependencias Express y TypeScript ya instaladas. Requiere Node 24 (entorno actual).

```sh
npm run api:start
npm run api:test
```

API local en `http://127.0.0.1:3000`; `PORT` permite cambiar el puerto.

- `GET /api/components`: catálogo completo; filtro opcional `?category=cpu`.
- `GET /api/profiles`: cuatro perfiles y sus criterios de guía.
- `GET /api/builds`: cuatro bases, totales y validaciones; filtros opcionales `?profileId=gaming&budget=6000`.
- `POST /api/configurations/validate`: recibe el siguiente JSON:

```json
{
  "componentIds": ["cpu-a", "board-a", "ram-a", "gpu-a", "ssd-a", "case-a", "psu-a", "cooler-a"],
  "gpuOmitted": false,
  "profileId": "gaming",
  "budget": 6000
}
```

El ejemplo devuelve un total de S/ 5930, `currency: "PEN"`, `demo: true`,
`status: "validada"`, `valid: true` y `recommended: true`. El contrato anterior
`rule/status/message` fue sustituido por 15 comprobaciones con estos campos:

```json
{
  "id": "R01",
  "estado": "cumple",
  "severidad": null,
  "mensaje": "Cumple: socket CPU AM5; placa AM5.",
  "componentes": ["cpu", "motherboard"]
}
```

- Estados de regla: `cumple`, `no_cumple`, `sin_datos`, `no_aplica`.
- Severidad: `bloqueo`, `advertencia`, `sugerencia` o `null`.
- Estado global, por prioridad: `incompleta`, `no_valida`, `pendiente_datos`, `validada`.
- `valid` requiere todas las categorías obligatorias, sin bloqueos ni datos obligatorios faltantes. Las advertencias permanecen en `observations`.
- `recommended` requiere además R15 cumple y presupuesto suficiente. `budget` devuelve límite, `withinBudget` y `shortfall`; no altera la compatibilidad física.
- `gpuOmitted` es opcional y por defecto falso: quitar una GPU sin marcarlo deja la selección incompleta. Con `true`, no enviar un ID de GPU; R12 verifica la salida integrada.
- `profileId` admite `diseno`, `render_cpu`, `render_gpu`, `gaming` o `null`; `budget` admite un número positivo en PEN o `null`. Sin perfil no se evalúa R15; sin presupuesto no se recomienda.
- Solo se aceptan IDs del catálogo y un producto por categoría, hasta ocho. El cliente y las herramientas IA pasan por el mismo parser; precios y estados enviados por el cliente se ignoran.

Las bases son diseño (S/ 3730), render CPU (S/ 5290), render GPU (S/ 5930) y gaming
(S/ 5760). Diseño y render CPU usan gráficos integrados. `GET /api/builds` ordena
por precio y devuelve `cheapestQualifyingBase` con el déficit del presupuesto y
`recommendedBuildId` cuando corresponde. Busca entre bases curadas, no todas las
combinaciones posibles. Cada modificación se evalúa nuevamente mediante el POST.

Todos los productos, especificaciones y precios son **datos sintéticos**. No son
ofertas comerciales ni recomendaciones verificadas de hardware real. Esta primera
versión prueba el contrato y la lógica; debe sustituirse por datos contrastados
antes de evaluar la calidad técnica de las recomendaciones de IA.

Hay 16 productos de demostración en ocho categorías. Las reglas viven en
`compatibility.mts`; las políticas 1,25 / 10 mm / 50 W en `policies.mts`; los
perfiles en `profiles.mts` y las bases en `builds.mts`.

La potencia suma límite de CPU, GPU elegida, RAM, SSD y reserva de 50 W. El mínimo
base respeta el requisito aplicable de fuente; el objetivo añade 25% al consumo
estimado. R11 bloquea por debajo del mínimo y advierte si solo falta margen.
BIOS compara el orden curado de versiones para el SKU/revisión del CPU. Los cables
se cuentan por conector y por cable independiente compatible con la fuente.
R10 también comprueba formato y longitud de la fuente en el gabinete.

Las dimensiones y recursos corresponden a una disposición fija curada: un kit
RAM, un SSD M.2 activo y cooler por aire con altura instalada confirmada. Otros
almacenamientos y AIO quedan sin evaluar. No se certifican transitorios, estabilidad
térmica, compatibilidad universal de hardware ni rendimiento. La evidencia de
software también es sintética. Véanse [reglas](../docs/oe2-reglas.md) y
[perfiles](../docs/oe2-perfiles.md). La persistencia y la revalidación al crear pedidos
siguen pendientes; no existe endpoint de pedido en esta etapa.

## Asesor de IA

Prueba real del chatbot: `npm run api:test:live`. Carga la clave de `.env`, consume
saldo de OpenAI y verifica preguntas iniciales, propuesta dentro del presupuesto y
un cambio de placa incompatible mediante `/api/advice`. Las pruebas habituales de
`npm run api:test` siguen usando un proveedor simulado y no consumen saldo.

Edita `.env` en la raíz y completa `OPENAI_API_KEY` localmente. Usa `.env.example`
como referencia; `.env` está excluido de Git. Nunca pongas la clave en Angular.
El modelo inicial es `gpt-5-mini`; `OPENAI_MODEL` permite seleccionar otro modelo
compatible con Responses y function calling. Reinicia `npm run api:start` al cambiarlo.

`POST /api/advice` recibe historial de usuario/asistente (máximo 20 mensajes,
3000 caracteres por mensaje y 16 KB por solicitud):

```json
{
  "messages": [
    { "role": "user", "content": "Tengo S/ 6000 solo para la torre. Juego a 1440p y no tengo componentes previos. ¿Qué datos necesitas?" }
  ]
}
```

Devuelve `reply`, `proposal` (nulo si no ejecutó validación), `currency` y `demo`.
La propuesta incluye `componentIds`, `gpuOmitted`, `profileId`, `budget` y el resultado calculado por el servidor;
el cliente debe usar ese resultado para mostrar compatibilidad y precio, nunca
interpretar el texto de la IA como una certificación. Puede contener una selección
inválida para explicar qué falla: revisar siempre `proposal.validation.valid`.

Para continuar, envía el historial anterior, agrega `{ "role": "assistant",
"content": "<reply anterior>" }` y el nuevo mensaje del usuario. El historial es
temporal y lo mantiene el cliente; no hay conversaciones guardadas. Los mensajes
se envían a OpenAI con `store: false`. Hasta cinco llamadas al proveedor por consulta,
2400 tokens de salida por llamada, 60 segundos de plazo total y una consulta
simultánea. La facturación real depende del uso del proveedor.

Errores: 400 entrada inválida, 429 consulta concurrente o límite del proveedor,
503 clave ausente, 502 fallo o respuesta incompleta del proveedor. Nunca se devuelve
el cuerpo del error de OpenAI ni la clave. Las pruebas usan un proveedor simulado
y no consumen saldo; una prueba real sigue siendo necesaria tras configurar la clave.

Todavía no incluye autenticación, persistencia ni una pantalla de chat. El servidor
escucha solo en loopback para la demostración local. Antes de publicarlo, implementar
autorización y límites de gasto por usuario; no exponer directamente esta API.
