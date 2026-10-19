import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catalog } from '../dist/api/catalog.mjs';
import { validateConfiguration } from '../dist/api/compatibility.mjs';
import { baseBuilds, listBuilds } from '../dist/api/builds.mjs';

const base = baseBuilds.find(build => build.profileId === 'render_gpu');
const options = { ...base, budget: 6000 };
const fresh = () => structuredClone(base.componentIds.map(id => catalog.find(part => part.id === id)));
const part = (parts, category) => parts.find(part => part.category === category);
const check = (result, id) => result.checks.find(check => check.id === id);
const evaluate = (change, context = options) => { const parts = fresh(); change(parts); return validateConfiguration(parts, context); };

test('four bases are complete, have 15 exact rule contracts and qualify for their profiles', () => {
  const result = listBuilds({ budget: 10000 });
  assert.equal(result.builds.length, 4);
  for (const build of result.builds) {
    assert.equal(build.validation.status, 'validada', build.id);
    assert.equal(build.validation.recommended, true, build.id);
    assert.equal(build.validation.checks.length, 15);
    assert.equal(check(build.validation, 'R15').estado, 'cumple');
    for (const item of build.validation.checks) {
      assert.deepEqual(Object.keys(item).sort(), ['id', 'estado', 'severidad', 'mensaje', 'componentes'].sort());
      if (item.estado === 'cumple' || item.estado === 'no_aplica') assert.equal(item.severidad, null);
    }
    const parts = build.componentIds.map(id => catalog.find(part => part.id === id));
    assert.deepEqual(validateConfiguration(parts, build), validateConfiguration([...parts].reverse(), build));
  }
  assert.equal(listBuilds({ profileId: 'gaming' }).recommendedBuildId, null, 'Budget is necessary for recommendation');
});

const scenarios = [
  ['R01', 'cpu', 'socket', 'OTHER'],
  ['R02', 'cpu', 'chipsets', []],
  ['R03', 'ram', 'memoryType', 'DDR4'],
  ['R04', 'ram', 'modules', 5],
  ['R05', 'motherboard', 'm2Slots', []],
  ['R06', 'case', 'supportedFormFactors', []],
  ['R07', 'gpu', 'lengthMm', 351],
  ['R08', 'cooler', 'heightMm', 171],
  ['R09', 'cooler', 'mountingKits', []],
  ['R10', 'psu', 'cables', []],
  ['R11', 'psu', 'capacityWatts', 400],
  ['R12', 'cpu', 'integratedGraphics', false],
  ['R13', 'motherboard', 'cpuSupport', [{ sku: 'DEMO-CPU-A', revision: '1', supported: false }]],
  ['R14', 'ram', 'speedMts', 6400],
  ['R15', 'gpu', 'vramGb', 4],
];
for (const [id, category, field, badValue] of scenarios) {
  test(`${id}: pass, known failure, missing data, and pending selection remain distinct`, () => {
    const parts = fresh();
    const context = id === 'R12' ? { ...options, gpuOmitted: true, profileId: 'diseno' } : options;
    if (id === 'R12') parts.splice(parts.findIndex(part => part.category === 'gpu'), 1);
    assert.equal(check(validateConfiguration(parts, context), id).estado, 'cumple');
    const failed = structuredClone(parts);
    part(failed, category).specs[field] = badValue;
    const failedResult = validateConfiguration(failed, context);
    assert.equal(check(failedResult, id).estado, 'no_cumple');
    assert.equal(check(failedResult, id).severidad, ['R14', 'R15'].includes(id) ? 'advertencia' : 'bloqueo');
    const missing = structuredClone(parts);
    delete part(missing, category).specs[field];
    assert.equal(check(validateConfiguration(missing, context), id).estado, 'sin_datos');
    const pending = id === 'R15' ? parts.filter(part => part.category !== 'cpu') : parts.filter(part => part.category !== category);
    assert.equal(check(validateConfiguration(pending, context), id).estado, 'no_aplica');
  });
}

test('GPU pending, selected and explicitly omitted have different effects', () => {
  const noGpu = fresh().filter(part => part.category !== 'gpu');
  const pending = validateConfiguration(noGpu, options);
  assert.equal(pending.status, 'incompleta');
  assert.equal(check(pending, 'R11').estado, 'no_aplica');
  const omitted = validateConfiguration(noGpu, { ...options, gpuOmitted: true, profileId: 'diseno' });
  assert.equal(omitted.valid, true);
  assert.equal(check(omitted, 'R07').estado, 'no_aplica');
  for (const id of ['R10', 'R11', 'R12']) assert.equal(check(omitted, id).estado, 'cumple');
  assert.equal(omitted.estimatedWatts, 188);
  const render = validateConfiguration(noGpu, { ...options, gpuOmitted: true });
  assert.equal(render.valid, true);
  assert.equal(render.recommended, false);
  assert.match(check(render, 'R15').mensaje, /requiere GPU dedicada/);
  part(noGpu, 'psu').specs.cables = [];
  assert.equal(validateConfiguration(noGpu, { gpuOmitted: true }).valid, false, 'ATX/EPS still required');
});

test('global precedence and warning-only configurations', () => {
  const unknown = evaluate(parts => { delete part(parts, 'gpu').specs.lengthMm; });
  assert.equal(unknown.status, 'pendiente_datos');
  const blocked = evaluate(parts => { delete part(parts, 'gpu').specs.lengthMm; part(parts, 'cpu').specs.socket = 'other'; });
  assert.equal(blocked.status, 'no_valida');
  const incomplete = evaluate(parts => { parts.splice(parts.findIndex(part => part.category === 'storage'), 1); part(parts, 'cpu').specs.socket = 'other'; });
  assert.equal(incomplete.status, 'incompleta');
  const warning = evaluate(parts => { part(parts, 'gpu').specs.vramGb = 4; });
  assert.equal(warning.status, 'validada');
  assert.equal(warning.recommended, false);
  assert.equal(warning.observations.length, 1);
  const noEvidence = evaluate(parts => { delete part(parts, 'gpu').specs.software; });
  assert.equal(noEvidence.valid, true);
  assert.equal(noEvidence.recommended, false);
  assert.equal(check(noEvidence, 'R15').estado, 'sin_datos');
});

test('power boundaries distinguish raw minimum, vendor minimum and project margin', () => {
  for (const [capacity, severity, state] of [[407, 'bloqueo', 'no_cumple'], [408, 'advertencia', 'no_cumple'], [509, 'advertencia', 'no_cumple'], [510, null, 'cumple']]) {
    const result = evaluate(parts => { part(parts, 'psu').specs.capacityWatts = capacity; part(parts, 'gpu').specs.minimumSystemPsuWatts = 0; });
    assert.equal(result.estimatedWatts, 408);
    assert.equal(result.requiredWatts, 510);
    assert.equal(check(result, 'R11').estado, state);
    assert.equal(check(result, 'R11').severidad, severity);
  }
  assert.equal(check(evaluate(parts => { part(parts, 'psu').specs.capacityWatts = 549; }), 'R11').severidad, 'bloqueo');
  assert.equal(check(evaluate(parts => { part(parts, 'psu').specs.capacityWatts = 550; }), 'R11').estado, 'cumple');
  for (const value of [undefined, NaN, Infinity, -1]) {
    assert.equal(check(evaluate(parts => { part(parts, 'cpu').specs.powerWatts = value; }), 'R11').estado, 'sin_datos');
  }
});

test('physical and RAM limits include the exact boundary; unsupported scope is not declared incompatible', () => {
  const exact = evaluate(parts => { part(parts, 'gpu').specs.lengthMm = 350; part(parts, 'cooler').specs.heightMm = 170; part(parts, 'ram').specs.gbPerModule = 64; });
  for (const id of ['R04', 'R07', 'R08']) assert.equal(check(exact, id).estado, 'cumple');
  assert.equal(check(evaluate(parts => { part(parts, 'ram').specs.gbPerModule = 65; }), 'R04').estado, 'no_cumple');
  assert.equal(check(evaluate(parts => { part(parts, 'gpu').specs.cableClearanceMm = 41; }), 'R07').estado, 'no_cumple');
  assert.equal(check(evaluate(parts => { part(parts, 'ram').specs.heightMm = 46; }), 'R08').estado, 'no_cumple');
  assert.equal(check(evaluate(parts => { part(parts, 'storage').specs.protocol = 'SATA'; }), 'R05').estado, 'sin_datos');
  assert.equal(check(evaluate(parts => { part(parts, 'cooler').specs.coolingType = 'AIO'; }), 'R08').estado, 'sin_datos');
});

test('BIOS support uses exact model/revision and curated release order', () => {
  const newerCpu = () => { const parts = fresh(); parts[parts.findIndex(part => part.category === 'cpu')] = structuredClone(catalog.find(part => part.id === 'cpu-b')); return parts; };
  const parts = newerCpu();
  part(parts, 'motherboard').specs.biosVersion = 'F1';
  assert.equal(check(validateConfiguration(parts, options), 'R13').estado, 'no_cumple');
  delete part(parts, 'motherboard').specs.biosVersion;
  assert.equal(validateConfiguration(parts, options).status, 'pendiente_datos');
  const initial = evaluate(parts => { delete part(parts, 'motherboard').specs.biosVersion; });
  assert.equal(check(initial, 'R13').estado, 'cumple', 'CPU A is supported since the first BIOS');
  for (const version of ['F999', '']) {
    assert.equal(check(evaluate(parts => { part(parts, 'motherboard').specs.biosVersion = version; }), 'R13').estado, 'sin_datos');
  }
  const revision = evaluate(parts => { part(parts, 'cpu').revision = 'unverified'; });
  assert.equal(check(revision, 'R02').estado, 'sin_datos');
  assert.equal(check(revision, 'R13').estado, 'sin_datos');
});

test('M.2 activation, cooler mounting and power cables require explicit evidence', () => {
  assert.equal(check(evaluate(parts => { part(parts, 'motherboard').specs.m2Slots[0].activeCpuSkus = []; }), 'R05').estado, 'no_cumple');
  assert.equal(check(evaluate(parts => { part(parts, 'cooler').specs.boardClearance = []; }), 'R08').estado, 'sin_datos');
  const daisyChain = evaluate(parts => { part(parts, 'psu').specs.cables = part(parts, 'psu').specs.cables.filter(cable => cable.id !== 'gpu2'); });
  assert.equal(check(daisyChain, 'R10').estado, 'no_cumple');
  const wrongPsu = evaluate(parts => { part(parts, 'psu').specs.cables.forEach(cable => { cable.psuSku = 'OTHER'; }); });
  assert.equal(check(wrongPsu, 'R10').estado, 'no_cumple');
  assert.equal(check(evaluate(parts => { part(parts, 'psu').specs.cables.push(part(parts, 'psu').specs.cables[0]); }), 'R10').estado, 'sin_datos');
  assert.equal(check(evaluate(parts => { part(parts, 'psu').specs.formFactor = 'OTHER'; }), 'R10').estado, 'no_cumple');
});

test('RAM profile warning and R15 do not infer performance from names or missing evidence', () => {
  const expo = evaluate(parts => { part(parts, 'ram').specs.speedMts = 6000; part(parts, 'ram').specs.memoryProfile = 'EXPO'; part(parts, 'motherboard').specs.biosVersion = 'F1'; });
  assert.equal(check(expo, 'R14').severidad, 'advertencia');
  const mixed = evaluate(parts => { part(parts, 'gpu').specs.vramGb = 4; delete part(parts, 'gpu').specs.software.cyclesGpu; });
  assert.equal(check(mixed, 'R15').estado, 'no_cumple');
  assert.match(check(mixed, 'R15').mensaje, /VRAM 4 GB/);
  assert.match(check(mixed, 'R15').mensaje, /cyclesGpu/);
  assert.equal(check(evaluate(parts => { delete part(parts, 'ram').specs.gbPerModule; }), 'R15').estado, 'sin_datos');
  assert.equal(check(validateConfiguration(fresh()), 'R15').estado, 'no_aplica');
});
