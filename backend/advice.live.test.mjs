import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../dist/api/server.mjs';
import { openDatabase } from '../dist/api/db.mjs';
import { validateConfiguration } from '../dist/api/compatibility.mjs';

// Run explicitly: this test contacts OpenAI and consumes API credit.
test('live advisor asks for missing data, proposes a validated build and rejects an incompatible change', { timeout: 300_000 }, async () => {
  assert.ok(process.env.OPENAI_API_KEY?.trim(), 'OPENAI_API_KEY is required in .env');
  const server = createApp(openDatabase(':memory:')).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const messages = [];
  let proposal = null; // Sent back like the frontend does, so the model knows the ids it proposed.
  async function ask(content) {
    messages.push({ role: 'user', content });
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/advice`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, proposal }),
    });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.ok(result.reply?.trim());
    if (result.proposal) {
      // The proposal must match what the engine says about those same parts.
      const check = validateConfiguration({ componentIds: result.proposal.componentIds, profileId: result.proposal.profileId, budget: result.proposal.budget });
      assert.equal(result.proposal.status, check.status);
      proposal = { componentIds: result.proposal.componentIds, profileId: result.proposal.profileId, budget: result.proposal.budget };
    }
    messages.push({ role: 'assistant', content: result.reply });
    console.log(JSON.stringify({ user: content, reply: result.reply, proposal: result.proposal }));
    return result;
  }
  try {
    const intro = await ask('Hola, quiero una PC.');
    assert.equal(intro.proposal, null, 'Without use or budget there must be no build');
    const build = await ask('Es para jugar Fortnite y juegos actuales a 1440p. Tengo 7500 soles solo para la torre.');
    assert.ok(build.proposal, 'Expected a validated proposal');
    assert.equal(build.proposal.status, 'valida');
    assert.ok(build.proposal.total <= 7500, 'Build must respect the budget');
    const change = await ask('¿Y si cambio la placa por la MSI PRO Z890-P manteniendo el procesador? Valídalo.');
    assert.match(change.reply, /socket|incompatib|no (es )?compatib/i);
  } finally {
    server.close();
  }
});
