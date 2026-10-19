import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { app } from '../dist/api/server.mjs';
import { catalog } from '../dist/api/catalog.mjs';
import { validateConfiguration } from '../dist/api/compatibility.mjs';

// Run explicitly: this test contacts OpenAI and consumes API credit.
test('live chatbot asks questions, proposes a build, and handles an incompatible change', { timeout: 200_000 }, async () => {
  assert.ok(process.env.OPENAI_API_KEY?.trim(), 'OPENAI_API_KEY is required in .env');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (args[0] === 'https://api.openai.com/v1/responses' && !response.ok) {
      const data = await response.clone().json().catch(() => ({}));
      console.log(JSON.stringify({ providerStatus: response.status, code: data.error?.code, type: data.error?.type }));
    }
    return response;
  };
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const messages = [];
  async function ask(content) {
    messages.push({ role: 'user', content });
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/advice`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }), signal: AbortSignal.timeout(65_000),
    });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.ok(result.reply?.trim());
    assert.equal(result.demo, true);
    assert.equal(result.currency, 'PEN');
    if (result.proposal) {
      const parts = result.proposal.componentIds.map(id => catalog.find(part => part.id === id));
      assert.ok(parts.every(Boolean), 'Proposal must only contain catalog products');
      assert.deepEqual(result.proposal.validation, validateConfiguration(parts));
    }
    messages.push({ role: 'assistant', content: result.reply });
    console.log(JSON.stringify({ user: content, ...result }));
    return result;
  }
  try {
    const intro = await ask('Quiero armar una PC. ¿Qué necesitas saber antes de recomendarme componentes? Responde brevemente.');
    assert.equal(intro.proposal, null, 'Insufficient requirements must not produce a build');
    assert.match(intro.reply, /presupuesto/i);
    const build = await ask('Gaming a 1440p, principalmente juegos de un jugador. Tengo S/ 6000 solo para la torre, sin periféricos, y no reutilizo componentes. Acepto el catálogo sintético de demostración y sus limitaciones, sin garantías de FPS. Propón ahora un equipo completo con los ocho tipos de componente y valida su compatibilidad. Responde brevemente.');
    assert.ok(build.proposal, 'Expected a server-validated proposal');
    assert.equal(build.proposal.validation.valid, true);
    assert.ok(build.proposal.validation.total <= 6000, 'Build must respect the budget');
    const change = await ask('Quiero cambiar solo la placa por board-b y mantener el procesador. Valida ese cambio y explica si es compatible. No lo apliques si es incompatible. Responde brevemente.');
    assert.match(change.reply, /incompatib|no.{0,30}compatib|socket/i);
    if (change.proposal?.componentIds.includes('board-b')) {
      assert.equal(change.proposal.validation.valid, false, 'Incompatible motherboard must never pass');
    }
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
