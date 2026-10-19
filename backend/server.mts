import express from 'express';
import { pathToFileURL } from 'node:url';
import { catalog, categories } from './catalog.mjs';
import { validateConfiguration } from './compatibility.mjs';
import { advise, AdvisorError, type Message } from './advisor.mjs';
import { parseConfiguration, ConfigurationInputError } from './configuration.mjs';
import { profiles } from './profiles.mjs';
import { listBuilds } from './builds.mjs';

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.get('/api/components', (req, res) => {
  const category = req.query['category'];
  if (category !== undefined && (typeof category !== 'string' || !categories.some(value => value === category))) {
    res.status(400).json({ error: 'Categoría inválida.' });
    return;
  }
  res.json({ currency: 'PEN', demo: true, components: catalog.filter(part => !category || part.category === category) });
});
app.get('/api/profiles', (_req, res) => { res.json({ demo: true, profiles }); });
app.get('/api/builds', (req, res) => {
  const budget = req.query['budget'];
  if (budget !== undefined && (typeof budget !== 'string' || !budget.trim())) {
    res.status(400).json({ error: 'Presupuesto inválido.' });
    return;
  }
  const options = parseConfiguration({ componentIds: [], profileId: req.query['profileId'], budget: budget === undefined ? null : Number(budget) });
  res.json(listBuilds(options));
});
app.post('/api/configurations/validate', (req, res) => {
  const input = parseConfiguration(req.body);
  res.json(validateConfiguration(input.componentIds.map(id => catalog.find(part => part.id === id)!), input));
});
let advising = false;
app.post('/api/advice', async (req, res) => {
  const messages: unknown = req.body?.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20 ||
      !messages.every(item => item && typeof item === 'object' &&
        (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string' &&
        item.content.trim().length > 0 && item.content.length <= 3000) || messages.at(-1).role !== 'user') {
    res.status(400).json({ error: 'Envía entre 1 y 20 mensajes de usuario/asistente, de hasta 3000 caracteres; el último debe ser del usuario.' });
    return;
  }
  // shortcut: one concurrent advisory request for the local demo, add per-user quotas before deployment.
  if (advising) { res.status(429).json({ error: 'Hay una consulta en curso. Reintenta cuando termine.' }); return; }
  advising = true;
  try { res.json(await advise(messages as Message[])); }
  catch (error) {
    res.status(error instanceof AdvisorError ? error.status : 500).json({ error: error instanceof AdvisorError ? error.message : 'Error interno.' });
  } finally { advising = false; }
});
app.use((_req, res) => { res.status(404).json({ error: 'Ruta no encontrada.' }); });
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ConfigurationInputError) { res.status(400).json({ error: error.message }); return; }
  const status = error && typeof error === 'object' && 'status' in error ? error.status : 500;
  res.status(status === 413 ? 413 : status === 400 ? 400 : 500).json({ error: status === 413 ? 'Solicitud demasiado grande.' : status === 400 ? 'JSON inválido.' : 'Error interno.' });
});
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env['PORT'] ?? 3000);
  app.listen(port, '127.0.0.1', () => console.log(`Kamay API: http://127.0.0.1:${port}`));
}
