# Kamay

Tienda de computadoras armadas a medida con un configurador que valida la compatibilidad y un asesor con IA. Es un proyecto integrador; el alcance y el guion de demo están en [docs/mvp.md](docs/mvp.md).

- **Frontend**: Angular 22 (SPA, signals, Signal Forms), en `src/`.
- **API**: Express 5 + TypeScript, en `backend/`. Incluye catálogo, motor de compatibilidad, pedidos (guardados en `data/orders.json`) y asesor IA.

## Puesta en marcha

```bash
npm install
cp .env.example .env        # y completa OPENAI_API_KEY (la cuenta necesita créditos)
```

Abre dos terminales:

```bash
npm run api:start           # API en http://127.0.0.1:3000
npm start                   # App en http://localhost:4200 (redirige /api a la API)
```

Sin `OPENAI_API_KEY` todo funciona salvo el chat, que muestra un error recuperable.

## Pruebas

```bash
npm run api:test            # motor, API, pedidos y asesor con un proveedor simulado
npm run api:test:live       # conversación real con OpenAI (consume créditos)
```

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/catalog` | Categorías, perfiles de uso y productos |
| GET | `/api/builds?profileId=&budget=` | Equipos base validados |
| POST | `/api/configurations/validate` | `{ componentIds, profileId, budget }` → estado, comprobaciones, total y conflictos por producto |
| POST | `/api/advice` | `{ messages, context? }` → respuesta de la IA y propuesta validada |
| GET/POST | `/api/orders`, `/api/orders/:id`, `/api/orders/:id/advance` | Pedidos simulados |
