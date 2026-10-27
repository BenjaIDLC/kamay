# Kamay

Tienda de computadoras armadas a medida con un configurador que valida la compatibilidad y un asesor con IA. Es un proyecto integrador; el alcance y el guion de demo están en [docs/mvp.md](docs/mvp.md).

- **Frontend**: Angular 22 (SPA, signals, Signal Forms), en `src/`.
- **API**: Express 5 + TypeScript, en `backend/`. Incluye catálogo, motor de compatibilidad, pedidos y asesor IA.
- **Base de datos**: SQLite con `node:sqlite` (incluido en Node, sin instalar nada). Se crea sola en `data/kamay.db` al arrancar la API, con el catálogo inicial; para empezar de cero basta con borrar la carpeta `data/`. El esquema está en [backend/schema.sql](backend/schema.sql).

## Puesta en marcha

Requiere Node.js 22.13 o superior.

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
npm run api:test            # motor, base de datos, API, pedidos y asesor con un proveedor simulado
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
