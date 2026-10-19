import express from 'express';
import { pathToFileURL } from 'node:url';
import { catalog, categories, categoryNames } from './catalog.mjs';
import { InputError, parseConfiguration, validateConfiguration } from './compatibility.mjs';
import { advise, AdvisorError, type Message } from './advisor.mjs';
import { profiles } from './profiles.mjs';
import { listBuilds } from './builds.mjs';
import { NotFoundError, OrderStore } from './orders.mjs';

export function createApp(orders = new OrderStore(process.env['ORDERS_FILE'] ?? 'data/orders.json')) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/catalog', (_req, res) => {
    res.json({ currency: 'PEN', categories: categories.map(id => ({ id, name: categoryNames[id] })), profiles, components: catalog });
  });
  app.get('/api/builds', (req, res) => {
    const budget = req.query['budget'];
    const { profileId } = parseConfiguration({ profileId: req.query['profileId'] });
    res.json({ builds: listBuilds(profileId, budget === undefined ? null : parseConfiguration({ budget: Number(budget) }).budget) });
  });
  app.post('/api/configurations/validate', (req, res) => {
    res.json(validateConfiguration(parseConfiguration(req.body)));
  });

  app.get('/api/orders', (_req, res) => { res.json({ orders: orders.list() }); });
  app.get('/api/orders/:id', (req, res) => { res.json(orders.get(req.params.id)); });
  app.post('/api/orders', (req, res) => { res.status(201).json(orders.create(req.body)); });
  app.post('/api/orders/:id/advance', (req, res) => { res.json(orders.advance(req.params.id)); });

  app.post('/api/advice', async (req, res) => {
    const messages: unknown = req.body?.messages;
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 30 ||
        !messages.every(item => item && typeof item === 'object' &&
          (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string' &&
          item.content.trim().length > 0 && item.content.length <= 4000) || messages.at(-1).role !== 'user') {
      res.status(400).json({ error: 'Envía entre 1 y 30 mensajes; el último debe ser del usuario.' });
      return;
    }
    const configuration = req.body.context ? parseConfiguration(req.body.context) : null;
    const proposal = req.body.proposal ? parseConfiguration(req.body.proposal) : null;
    try { res.json(await advise(messages as Message[], { configuration, proposal })); }
    catch (error) {
      if (!(error instanceof AdvisorError)) throw error;
      res.status(error.status).json({ error: error.message });
    }
  });

  app.use((_req, res) => { res.status(404).json({ error: 'Ruta no encontrada.' }); });
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof InputError) { res.status(400).json({ error: error.message }); return; }
    if (error instanceof NotFoundError) { res.status(404).json({ error: error.message }); return; }
    const status = error && typeof error === 'object' && 'status' in error ? error.status : 500;
    if (status === 400 || status === 413) { res.status(status).json({ error: status === 413 ? 'Solicitud demasiado grande.' : 'JSON inválido.' }); return; }
    console.error(error);
    res.status(500).json({ error: 'Error interno.' });
  });
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env['PORT'] ?? 3000);
  createApp().listen(port, '127.0.0.1', () => console.log(`Kamay API: http://127.0.0.1:${port}`));
}
