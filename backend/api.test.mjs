import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { catalog } from '../dist/api/catalog.mjs';
import { rules, validateConfiguration } from '../dist/api/compatibility.mjs';
import { builds } from '../dist/api/builds.mjs';
import { createApp } from '../dist/api/server.mjs';
import { advise } from '../dist/api/advisor.mjs';
import { OrderStore } from '../dist/api/orders.mjs';

const gaming = builds.find(build => build.id === 'kamay-gaming').componentIds;
const swap = (ids, from, to) => ids.map(id => id === from ? to : id);
const check = (result, id) => result.checks.find(check => check.id === id);
const validate = (componentIds, profileId = null, budget = null) => validateConfiguration({ componentIds, profileId, budget });

test('every base build is valid and recommended for its use', () => {
  for (const build of builds) {
    const result = validate(build.componentIds, build.profileId);
    assert.equal(result.status, 'valida', build.id);
    assert.equal(result.recommended, true, `${build.id}: ${result.checks.filter(c => c.status !== 'ok').map(c => c.message)}`);
    assert.equal(result.total, build.componentIds.reduce((sum, id) => sum + catalog.find(part => part.id === id).price, 0));
  }
});

test('catalog products have the specs their category needs', () => {
  const needed = { cpu: ['socket', 'cores', 'watts'], motherboard: ['socket', 'formFactor', 'memoryType'], ram: ['memoryType', 'capacityGb'],
    gpu: ['vramGb', 'lengthMm', 'watts', 'recommendedPsuWatts'], storage: ['capacityGb'], psu: ['watts'],
    case: ['formFactors', 'maxGpuLengthMm', 'maxCoolerHeightMm'], cooler: ['sockets', 'heightMm'] };
  for (const part of catalog) for (const key of needed[part.category]) assert.ok(part.specs[key] !== undefined, `${part.id}.${key}`);
  assert.equal(new Set(catalog.map(part => part.id)).size, catalog.length);
});

test('socket and memory mismatches block the build', () => {
  const result = validate(swap(gaming, 'msi-b650-gaming-plus', 'msi-z890-pro'));
  assert.equal(result.status, 'no_valida');
  assert.equal(check(result, 'socket').status, 'bloqueo');
  assert.equal(check(validate(swap(gaming, 'corsair-ddr5-32', 'kingston-ddr4-32')), 'memoria').status, 'bloqueo');
});

test('physical limits: board form factor, GPU length and cooler height', () => {
  assert.equal(check(validate(swap(gaming, 'corsair-4000d', 'coolermaster-q300l')), 'formato').status, 'bloqueo');
  const tall = swap(swap(gaming, 'thermalright-pa120', 'noctua-nh-d15-g2'), 'corsair-4000d', 'coolermaster-q300l');
  assert.equal(check(validate(swap(tall, 'msi-b650-gaming-plus', 'asus-b650m-tuf')), 'cooler').status, 'bloqueo');
  assert.equal(check(validate(swap(gaming, 'rtx5070-msi-ventus', 'rtx5080-asus-tuf')), 'gpu_espacio').status, 'ok');
  const gpuSpace = length => rules.find(rule => rule.id === 'gpu_espacio').evaluate({ gpu: { specs: { lengthMm: length } }, case: { specs: { maxGpuLengthMm: 360 } } }).status;
  assert.deepEqual([350, 351, 360, 361].map(gpuSpace), ['ok', 'advertencia', 'advertencia', 'bloqueo']);
});

test('power: blocks below the estimate, warns below the recommended margin', () => {
  const hungry = swap(swap(gaming, 'rtx5070-msi-ventus', 'rtx5080-asus-tuf'), 'corsair-rm750e', 'corsair-cx650');
  assert.equal(check(validate(hungry), 'potencia').status, 'advertencia');
  const cpuOnly = swap(swap(hungry, 'ryzen7-9800x3d', 'ryzen9-9950x'), 'corsair-4000d', 'lianli-lancool-216');
  assert.equal(check(validate(cpuOnly), 'potencia').status, 'bloqueo');
});

test('GPU is optional, but only with integrated graphics', () => {
  const noGpu = gaming.filter(id => id !== 'rtx5070-msi-ventus');
  assert.equal(validate(noGpu).status, 'valida');
  assert.equal(check(validate(noGpu), 'gpu_espacio').status, 'no_aplica');
  const fCpu = swap(swap(swap(noGpu, 'ryzen7-9800x3d', 'core-i5-14400f'), 'msi-b650-gaming-plus', 'msi-b760m-ddr4'), 'corsair-ddr5-32', 'kingston-ddr4-32');
  assert.equal(check(validate(fCpu), 'video').status, 'bloqueo');
  const gamingNoGpu = validate(noGpu, 'gaming');
  assert.equal(check(gamingNoGpu, 'perfil').status, 'advertencia');
  assert.equal(gamingNoGpu.recommended, false);
});

test('incomplete builds report what is missing and never validate', () => {
  const result = validate(['ryzen7-9700x', 'kingston-ddr5-16']);
  assert.equal(result.status, 'incompleta');
  assert.deepEqual(result.missing, ['motherboard', 'storage', 'psu', 'case', 'cooler']);
  assert.equal(check(result, 'socket').status, 'pendiente');
  assert.equal(validate([]).status, 'incompleta');
});

test('profile and budget decide the recommendation, not compatibility', () => {
  const render = validate(swap(gaming, 'corsair-ddr5-32', 'kingston-ddr5-16'), 'render_gpu', 5000);
  assert.equal(render.status, 'valida');
  assert.equal(check(render, 'perfil').status, 'advertencia');
  assert.equal(render.budget.within, false);
  assert.equal(render.budget.difference, 5000 - render.total);
  assert.equal(render.recommended, false);
});

test('conflicts list blocking reasons per catalog product', () => {
  const result = validate(gaming);
  assert.deepEqual(result.conflicts['corsair-rm850x'], []);
  assert.match(result.conflicts['msi-z890-pro'][0], /socket/);
  assert.equal(result.conflicts['coolermaster-q300l'].length, 1);
});

async function withServer(fn) {
  const orders = new OrderStore(join(mkdtempSync(join(tmpdir(), 'kamay-')), 'orders.json'));
  const server = createApp(orders).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try { await fn(base, post); } finally { server.close(); }
}

test('HTTP: catalog, builds and input validation', () => withServer(async (base, post) => {
  const catalogResponse = await (await fetch(`${base}/catalog`)).json();
  assert.equal(catalogResponse.components.length, catalog.length);
  assert.equal(catalogResponse.profiles.length, 4);
  const buildsResponse = await (await fetch(`${base}/builds?profileId=gaming&budget=5000`)).json();
  assert.equal(buildsResponse.builds.length, 1);
  assert.equal(buildsResponse.builds[0].validation.budget.within, false);
  assert.equal((await fetch(`${base}/builds?profileId=video`)).status, 400);
  for (const body of [{ componentIds: ['missing'] }, { componentIds: ['ryzen7-9700x', 'ryzen7-9700x'] },
    { componentIds: ['ryzen7-9700x', 'ryzen9-9950x'] }, { componentIds: [1] }, { componentIds: [], budget: -1 }]) {
    assert.equal((await post('/configurations/validate', body)).status, 400, JSON.stringify(body));
  }
  const valid = await (await post('/configurations/validate', { componentIds: gaming, profileId: 'gaming', price: 1 })).json();
  assert.equal(valid.status, 'valida');
  assert.notEqual(valid.total, 1);
}));

test('HTTP: orders revalidate, persist and advance through stages', () => withServer(async (base, post) => {
  const customer = { name: 'Ana', email: 'ana@example.com' };
  assert.equal((await post('/orders', { componentIds: swap(gaming, 'msi-b650-gaming-plus', 'msi-z890-pro'), customer })).status, 400);
  assert.equal((await post('/orders', { componentIds: gaming, customer: { name: 'Ana', email: 'no' } })).status, 400);
  const created = await post('/orders', { componentIds: gaming, profileId: 'gaming', customer });
  assert.equal(created.status, 201);
  const order = await created.json();
  assert.equal(order.stage, 'pagado');
  assert.equal(order.items.length, 8);
  const stages = [];
  for (let i = 0; i < 4; i++) stages.push((await (await post(`/orders/${order.id}/advance`)).json()).stage);
  assert.deepEqual(stages, ['ensamblaje', 'control_calidad', 'enviado', 'entregado']);
  assert.equal((await post(`/orders/${order.id}/advance`)).status, 400);
  assert.equal((await (await fetch(`${base}/orders/${order.id}`)).json()).history.length, 5);
  assert.equal((await (await fetch(`${base}/orders`)).json()).orders.length, 1);
  assert.equal((await fetch(`${base}/orders/NOPE`)).status, 404);
}));

test('advisor runs tools against the real catalog and returns the validated proposal', async () => {
  process.env.OPENAI_API_KEY = 'test';
  const bodies = [];
  const replies = [
    { status: 'completed', output: [{ type: 'function_call', name: 'get_builds', call_id: 'a', arguments: JSON.stringify({ profileId: 'gaming', budget: 9000 }) }] },
    { status: 'completed', output: [{ type: 'function_call', name: 'validate_configuration', call_id: 'b', arguments: JSON.stringify({ componentIds: gaming, profileId: 'gaming', budget: 9000 }) }] },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Te propongo Kamay Arena.' }] }] },
  ];
  const fake = async (_url, init) => { bodies.push(JSON.parse(init.body)); return new Response(JSON.stringify(replies.shift())); };
  const result = await advise([{ role: 'user', content: 'Gaming, 9000 soles' }], null, fake);
  assert.equal(result.reply, 'Te propongo Kamay Arena.');
  assert.deepEqual(result.proposal.componentIds, gaming);
  assert.equal(result.proposal.status, 'valida');
  assert.equal(result.proposal.recommended, true);
  const toolOutput = JSON.parse(bodies[1].input.at(-1).output);
  assert.equal(toolOutput.builds[0].id, 'kamay-gaming');
});

test('advisor reports invalid tool input to the model and fails cleanly without a key', async () => {
  process.env.OPENAI_API_KEY = 'test';
  const bodies = [];
  const replies = [
    { status: 'completed', output: [{ type: 'function_call', name: 'validate_configuration', call_id: 'a', arguments: JSON.stringify({ componentIds: ['rtx-9999'], profileId: null, budget: null }) }] },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Ese producto no existe.' }] }] },
  ];
  const result = await advise([{ role: 'user', content: 'Quiero una RTX 9999' }], null, async (_url, init) => { bodies.push(JSON.parse(init.body)); return new Response(JSON.stringify(replies.shift())); });
  assert.equal(result.proposal, null);
  assert.match(JSON.parse(bodies[1].input.at(-1).output).error, /fuera del catálogo/);
  delete process.env.OPENAI_API_KEY;
  await assert.rejects(advise([{ role: 'user', content: 'hola' }]), { status: 503 });
});
