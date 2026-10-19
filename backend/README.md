# API de Kamay: catálogo y compatibilidad

Primera etapa del backend, independiente del servidor SSR de Angular. Usa las
dependencias Express y TypeScript ya instaladas. Requiere Node 24 (entorno actual).

```sh
npm run api:start
npm run api:test
```

API local en `http://127.0.0.1:3000`; `PORT` permite cambiar el puerto.

- `GET /api/components`: catálogo completo; filtro opcional `?category=cpu`.
- `POST /api/configurations/validate`: recibe el siguiente JSON:

```json
{
  "componentIds": ["cpu-a", "board-a", "ram-a", "gpu-a", "ssd-a", "case-a", "psu-a", "cooler-a"]
}
```

El ejemplo devuelve un total de S/ 5930, `currency: "PEN"`, `demo: true`,
categorías faltantes/duplicadas y comprobaciones con resultado `pass`, `fail` o
`unknown`. Una configuración solo tiene `valid: true` cuando está completa, tiene
un componente por categoría y cumple todas las reglas implementadas.

Todos los productos, especificaciones y precios son **datos sintéticos**. No son
ofertas comerciales ni recomendaciones verificadas de hardware real. Esta primera
versión prueba el contrato y la lógica; debe sustituirse por datos contrastados
antes de evaluar la calidad técnica de las recomendaciones de IA.

La potencia usa CPU + GPU + 100 W para otros componentes y un margen del 25%.
No cubre transitorios, conectores, BIOS, espacio físico, refrigeración efectiva,
capacidad máxima de RAM ni interfaz de almacenamiento. «Válido» solo significa
que cumple las comprobaciones enumeradas; no certifica un equipo ensamblable.

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
La propuesta incluye identificadores y el resultado calculado por el servidor;
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
