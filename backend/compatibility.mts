import { categories, type Category, type Component, type ConnectorRequirement, type SoftwareMode } from './catalog.mjs';
import { profiles, type ProfileId } from './profiles.mjs';
import { CONSUMO_BASE_SISTEMA, HOLGURA_FISICA_MM, MARGEN_FUENTE } from './policies.mjs';

export type ConfigurationOptions = { gpuOmitted?: boolean; profileId?: ProfileId | null; budget?: number | null };
export type RuleResult = {
  id: string;
  estado: 'cumple' | 'no_cumple' | 'sin_datos' | 'no_aplica';
  severidad: 'bloqueo' | 'advertencia' | 'sugerencia' | null;
  mensaje: string;
  componentes: Category[];
};
type Finding = Omit<RuleResult, 'id' | 'componentes'>;
type Context = { parts: Partial<Record<Category, Component>>; options: ConfigurationOptions };
type Rule = { id: string; components: Category[]; mandatory: boolean; evaluate: (context: Context) => Finding };
class MissingData extends Error {}

function need<T>(value: T, label: string): NonNullable<T> {
  if (value === undefined || value === null || value === '' ||
      (typeof value === 'number' && (!Number.isFinite(value) || value < 0))) {
    throw new MissingData(`Falta un dato válido: ${label}.`);
  }
  return value as NonNullable<T>;
}
function read<K extends keyof Component['specs']>(c: Context, category: Category, key: K): NonNullable<Component['specs'][K]> {
  return need(c.parts[category]?.specs[key], `${category}.${key}`);
}
function compare(matches: boolean, message: string, severity: RuleResult['severidad'] = 'bloqueo'): Finding {
  return { estado: matches ? 'cumple' : 'no_cumple', severidad: matches ? null : severity,
    mensaje: `${matches ? 'Cumple' : 'No cumple'}: ${message}` };
}
const notApplicable = (mensaje: string): Finding => ({ estado: 'no_aplica', severidad: null, mensaje });
const unknown = (mensaje: string, mandatory: boolean): Finding => ({ estado: 'sin_datos', severidad: mandatory ? 'bloqueo' : 'advertencia', mensaje });
const gpuPending = (c: Context) => !c.parts.gpu && !c.options.gpuOmitted;

function support(c: Context) {
  const cpu = need(c.parts.cpu, 'cpu');
  return need(read(c, 'motherboard', 'cpuSupport').find(item => item.sku === cpu.sku && item.revision === cpu.revision), `soporte de ${cpu.sku}, revisión ${cpu.revision}`);
}
function biosSupports(c: Context, required: string) {
  const releases = read(c, 'motherboard', 'biosReleases');
  const minimum = releases.indexOf(required);
  if (minimum < 0) throw new MissingData(`No se conoce el orden de la BIOS ${required}.`);
  const installed = c.parts.motherboard?.specs.biosVersion;
  if (installed === undefined && minimum === 0) return true;
  const current = releases.indexOf(need(installed, 'motherboard.biosVersion'));
  if (current < 0) throw new MissingData('La BIOS instalada no figura en la secuencia curada.');
  return current >= minimum;
}
function power(c: Context) {
  const estimatedWatts = read(c, 'cpu', 'powerWatts') + (c.parts.gpu ? read(c, 'gpu', 'powerWatts') : 0)
    + read(c, 'ram', 'powerWatts') + read(c, 'storage', 'powerWatts') + CONSUMO_BASE_SISTEMA;
  const minimumWatts = Math.max(estimatedWatts, c.parts.gpu ? read(c, 'gpu', 'minimumSystemPsuWatts') : 0);
  return { estimatedWatts, minimumWatts, requiredWatts: Math.max(minimumWatts, Math.ceil(estimatedWatts * MARGEN_FUENTE)) };
}

export const rules: Rule[] = [
  { id: 'R01', components: ['cpu', 'motherboard'], mandatory: true, evaluate: c => {
    const cpu = read(c, 'cpu', 'socket'), board = read(c, 'motherboard', 'socket');
    return compare(cpu === board, `socket CPU ${cpu}; placa ${board}.`);
  } },
  { id: 'R02', components: ['cpu', 'motherboard'], mandatory: true, evaluate: c => {
    const chipset = read(c, 'motherboard', 'chipset');
    if (!read(c, 'cpu', 'chipsets').includes(chipset)) return compare(false, `el CPU no admite el chipset ${chipset}.`);
    return compare(support(c).supported, `soporte del modelo y revisión de CPU en ${chipset}.`);
  } },
  { id: 'R03', components: ['cpu', 'motherboard', 'ram'], mandatory: true, evaluate: c => {
    const type = read(c, 'ram', 'memoryType'), format = read(c, 'ram', 'memoryFormat'), buffering = read(c, 'ram', 'buffering');
    const matches = (['cpu', 'motherboard'] as const).map(category => {
      const types = read(c, category, 'memoryTypes'), formats = read(c, category, 'memoryFormats'), buffers = read(c, category, 'bufferingTypes');
      return types.includes(type) && formats.includes(format) && buffers.includes(buffering);
    });
    return compare(matches.every(Boolean), `RAM ${type}, ${format}, ${buffering}; debe estar admitida por CPU y placa.`);
  } },
  { id: 'R04', components: ['cpu', 'motherboard', 'ram'], mandatory: true, evaluate: c => {
    const modules = read(c, 'ram', 'modules'), perModule = read(c, 'ram', 'gbPerModule');
    const slots = read(c, 'motherboard', 'memorySlots');
    const capacity = Math.min(read(c, 'cpu', 'maxMemoryGb'), read(c, 'motherboard', 'maxMemoryGb'));
    const cpuCounts = read(c, 'cpu', 'moduleCounts'), boardCounts = read(c, 'motherboard', 'moduleCounts');
    return compare(Number.isInteger(modules) && modules > 0 && perModule > 0 && modules <= slots && modules * perModule <= capacity && cpuCounts.includes(modules) && boardCounts.includes(modules),
      `${modules} módulos, ${modules * perModule} GB; placa con ${slots} slots y límite conjunto ${capacity} GB; población documentada.`);
  } },
  { id: 'R05', components: ['cpu', 'motherboard', 'storage'], mandatory: true, evaluate: c => {
    const protocol = read(c, 'storage', 'protocol');
    if (protocol !== 'NVMe') return unknown('Fuera del alcance: esta versión evalúa un SSD M.2 NVMe.', true);
    const key = read(c, 'storage', 'key'), size = read(c, 'storage', 'size');
    const slots = read(c, 'motherboard', 'm2Slots'), sku = c.parts.cpu!.sku;
    return compare(slots.some(slot => slot.protocol === protocol && slot.key === key && slot.sizes.includes(size) && slot.activeCpuSkus.includes(sku)),
      `SSD ${protocol} ${key} ${size}; requiere socket M.2 activo para ${sku} en la disposición curada.`);
  } },
  { id: 'R06', components: ['motherboard', 'case'], mandatory: true, evaluate: c => {
    const factor = read(c, 'motherboard', 'formFactor'), factors = read(c, 'case', 'supportedFormFactors');
    const width = read(c, 'motherboard', 'widthMm'), height = read(c, 'motherboard', 'heightMm');
    const maxWidth = read(c, 'case', 'maxBoardWidthMm'), maxHeight = read(c, 'case', 'maxBoardHeightMm');
    return compare(factors.includes(factor) && width <= maxWidth && height <= maxHeight,
      `placa ${factor} de ${width} × ${height} mm; gabinete admite ${factors.join(', ')} hasta ${maxWidth} × ${maxHeight} mm.`);
  } },
  { id: 'R07', components: ['gpu', 'case'], mandatory: true, evaluate: c => {
    const length = read(c, 'gpu', 'lengthMm'), maxLength = read(c, 'case', 'maxGpuLengthMm') - HOLGURA_FISICA_MM;
    const limits = [
      [length, maxLength], [read(c, 'gpu', 'widthMm'), read(c, 'case', 'maxGpuWidthMm')],
      [read(c, 'gpu', 'heightMm'), read(c, 'case', 'maxGpuHeightMm')],
      [read(c, 'gpu', 'slots'), read(c, 'case', 'maxGpuSlots')],
      [read(c, 'gpu', 'cableClearanceMm'), read(c, 'case', 'maxCableClearanceMm')],
    ];
    const names = ['largo', 'grosor', 'alto', 'slots', 'espacio de cable'];
    return compare(limits.every(([value, maximum]) => value <= maximum),
      limits.map(([value, maximum], i) => `${names[i]} ${value}/${maximum}${i === 3 ? '' : ' mm'}`).join('; ') + `; largo incluye holgura de ${HOLGURA_FISICA_MM} mm.`);
  } },
  { id: 'R08', components: ['cooler', 'case', 'ram', 'motherboard'], mandatory: true, evaluate: c => {
    if (read(c, 'cooler', 'coolingType') !== 'air') return unknown('Fuera del alcance: solo refrigeración por aire.', true);
    const height = read(c, 'cooler', 'heightMm'), maximum = read(c, 'case', 'maxCoolerHeightMm') - HOLGURA_FISICA_MM;
    const ramHeight = read(c, 'ram', 'heightMm'), ramMaximum = read(c, 'cooler', 'maxRamHeightMm');
    const board = c.parts.motherboard!;
    const clearance = need(read(c, 'cooler', 'boardClearance').find(item => item.sku === board.sku && item.revision === board.revision), 'interferencias cooler/placa');
    return compare(height <= maximum && ramHeight <= ramMaximum && clearance.fits,
      `cooler instalado ${height}/${maximum} mm; RAM ${ramHeight}/${ramMaximum} mm; espacio en placa ${clearance.fits ? 'confirmado' : 'insuficiente'}.`);
  } },
  { id: 'R09', components: ['cpu', 'cooler'], mandatory: true, evaluate: c => {
    const socket = read(c, 'cpu', 'socket'), sockets = read(c, 'cooler', 'supportedSockets');
    if (!sockets.includes(socket)) return compare(false, `cooler no admite ${socket}.`);
    return compare(read(c, 'cooler', 'mountingKits').includes(socket), `kit de montaje confirmado para ${socket}.`);
  } },
  { id: 'R10', components: ['cpu', 'motherboard', 'psu', 'case'], mandatory: true, evaluate: c => {
    if (gpuPending(c)) return notApplicable('Pendiente decidir si se usará GPU dedicada; todavía no se conoce toda la alimentación.');
    const factor = read(c, 'psu', 'formFactor'), factors = read(c, 'case', 'psuFormFactors');
    const length = read(c, 'psu', 'lengthMm'), maxLength = read(c, 'case', 'maxPsuLengthMm');
    if (!factors.includes(factor) || length > maxLength) return compare(false, `fuente ${factor}, ${length} mm; gabinete admite ${factors.join(', ')} hasta ${maxLength} mm.`);
    const demands = [read(c, 'motherboard', 'connectorsRequired'), ...(c.parts.gpu ? [read(c, 'gpu', 'connectorsRequired')] : [])];
    const required: Record<string, ConnectorRequirement> = {};
    for (const demand of demands) for (const [connector, counts] of Object.entries(demand)) {
      const previous = required[connector] ?? { count: 0, independentCables: 0 };
      required[connector] = { count: previous.count + counts.count, independentCables: previous.independentCables + counts.independentCables };
    }
    const psu = c.parts.psu!, cables = read(c, 'psu', 'cables');
    if (new Set(cables.map(cable => cable.id)).size !== cables.length) return unknown('Inventario de cables con identificadores duplicados.', true);
    const usable = cables.filter(cable => cable.psuSku === psu.sku && cable.psuRevision === psu.revision && cable.plugs > 0);
    const failures = Object.entries(required).flatMap(([connector, counts]) => {
      const available = usable.filter(cable => cable.connector === connector);
      const plugs = available.reduce((sum, cable) => sum + cable.plugs, 0);
      return plugs >= counts.count && available.length >= counts.independentCables ? []
        : [`${connector}: ${plugs}/${counts.count} conectores y ${available.length}/${counts.independentCables} cables independientes compatibles`];
    });
    return compare(!failures.length, failures.length ? failures.join('; ') : 'fuente y cables compatibles cubren ATX/EPS y GPU cuando corresponde.');
  } },
  { id: 'R11', components: ['cpu', 'ram', 'storage', 'psu'], mandatory: true, evaluate: c => {
    if (gpuPending(c)) return notApplicable('Pendiente decidir GPU; consumo total todavía incompleto.');
    const { estimatedWatts, minimumWatts, requiredWatts } = power(c), capacity = read(c, 'psu', 'capacityWatts');
    const message = `fuente ${capacity} W; consumo estimado ${estimatedWatts} W; mínimo base ${minimumWatts} W; objetivo con margen ${requiredWatts} W.`;
    return compare(capacity >= requiredWatts, message, capacity < minimumWatts ? 'bloqueo' : 'advertencia');
  } },
  { id: 'R12', components: ['cpu', 'motherboard'], mandatory: true, evaluate: c => {
    if (c.parts.gpu) return notApplicable('Se eligió GPU dedicada.');
    if (gpuPending(c)) return notApplicable('Pendiente decidir GPU.');
    const integrated = read(c, 'cpu', 'integratedGraphics'), outputs = read(c, 'motherboard', 'videoCpuSkus');
    return compare(integrated && outputs.includes(c.parts.cpu!.sku), `gráficos integrados ${integrated ? 'presentes' : 'ausentes'} y salida de placa admitida para el CPU.`);
  } },
  { id: 'R13', components: ['cpu', 'motherboard'], mandatory: true, evaluate: c => {
    const cpuSupport = support(c);
    if (!cpuSupport.supported) return compare(false, 'CPU no soportado por esta placa/revisión.');
    const minimum = need(cpuSupport.minBios, 'BIOS mínima para CPU');
    return compare(biosSupports(c, minimum), `BIOS mínima ${minimum}; instalada ${c.parts.motherboard!.specs.biosVersion ?? 'sin confirmar, soporte desde versión inicial'}.`);
  } },
  { id: 'R14', components: ['cpu', 'motherboard', 'ram'], mandatory: false, evaluate: c => {
    const modules = read(c, 'ram', 'modules'), speed = read(c, 'ram', 'speedMts'), profile = read(c, 'ram', 'memoryProfile');
    const cpuModes = read(c, 'cpu', 'memoryModes'), boardModes = read(c, 'motherboard', 'memoryModes');
    const cpuMatches = cpuModes.some(mode => mode.modules === modules && mode.profile === profile && mode.speedMts >= speed);
    const candidates = boardModes.filter(mode => mode.modules === modules && mode.profile === profile && mode.speedMts >= speed);
    const matches = cpuMatches && candidates.some(mode => biosSupports(c, mode.minBios));
    return compare(matches, `${modules} módulos a ${speed} MT/s, perfil ${profile}; ${matches ? 'modo acreditado' : 'no acreditado para CPU/placa/BIOS; revisar un modo inferior documentado'}.`, 'advertencia');
  } },
  { id: 'R15', components: ['cpu', 'ram', 'storage'], mandatory: false, evaluate: c => {
    if (!c.options.profileId) return notApplicable('Selecciona un perfil de uso para evaluar la guía.');
    if (gpuPending(c)) return notApplicable('Pendiente decidir GPU para evaluar el perfil.');
    const profile = need(profiles.find(profile => profile.id === c.options.profileId), 'perfil de uso');
    const findings: Finding[] = [];
    function criterion(evaluate: () => Finding) {
      try { findings.push(evaluate()); } catch (error) {
        if (!(error instanceof MissingData)) throw error;
        findings.push(unknown(error.message, false));
      }
    }
    function evidence(category: Category, mode: SoftwareMode) {
      const item = need(read(c, category, 'software')[mode], `${category}.software.${mode}`);
      for (const key of ['version', 'conditions', 'source', 'checkedAt'] as const) need(item[key], `${category}.${mode}.${key}`);
      if (item.status === 'sin_datos') return unknown(`Soporte sin verificar: ${category}, ${mode}.`, false);
      return compare(item.status === 'cumple', `soporte ${mode}, ${item.version}; ${item.conditions}`, 'advertencia');
    }
    criterion(() => { const gb = read(c, 'ram', 'modules') * read(c, 'ram', 'gbPerModule'); return compare(gb >= profile.ramGb, `RAM ${gb} GB; objetivo ${profile.ramGb} GB.`, 'advertencia'); });
    criterion(() => { const gb = read(c, 'storage', 'capacityGb'); return compare(gb >= profile.storageGb, `SSD ${gb} GB; objetivo ${profile.storageGb} GB nominales.`, 'advertencia'); });
    if (profile.cpuCores !== null) criterion(() => compare(read(c, 'cpu', 'cores') >= profile.cpuCores!, `objetivo CPU de ${profile.cpuCores} núcleos físicos.`, 'advertencia'));
    criterion(() => evidence('cpu', profile.cpuMode));
    if (profile.dedicatedGpu && !c.parts.gpu) findings.push(compare(false, `${profile.name} requiere GPU dedicada.`, 'advertencia'));
    else {
      if (profile.vramGb !== null) criterion(() => { const gb = read(c, 'gpu', 'vramGb'); return compare(gb >= profile.vramGb!, `VRAM ${gb} GB; objetivo ${profile.vramGb} GB.`, 'advertencia'); });
      criterion(() => evidence(c.parts.gpu ? 'gpu' : 'cpu', profile.graphicsMode));
      if (profile.id === 'render_gpu') criterion(() => evidence('gpu', 'blenderGraphics'));
    }
    const failures = findings.filter(finding => finding.estado === 'no_cumple');
    const missing = findings.filter(finding => finding.estado === 'sin_datos');
    if (failures.length) return compare(false, [...failures, ...missing].map(finding => finding.mensaje).join(' '), 'advertencia');
    if (missing.length) return unknown(missing.map(finding => finding.mensaje).join(' '), false);
    return compare(true, `criterios del perfil ${profile.name}; evidencia de demostración, sin garantía de rendimiento.`, 'advertencia');
  } },
];

export function validateConfiguration(parts: Component[], options: ConfigurationOptions = {}) {
  const selected: Context['parts'] = {};
  for (const part of parts) selected[part.category] = part;
  const context: Context = { parts: selected, options };
  const missingCategories = categories.filter(category => !selected[category] && !(category === 'gpu' && options.gpuOmitted));
  const duplicateCategories = categories.filter(category => parts.filter(part => part.category === category).length > 1);
  const selectionErrors = duplicateCategories.map(category => `Solo se admite un producto por categoría: ${category}.`);
  if (selected.gpu && options.gpuOmitted) selectionErrors.push('No se puede seleccionar GPU y omitirla a la vez.');
  const checks: RuleResult[] = rules.map(rule => {
    const pending = rule.components.filter(category => !selected[category]);
    let finding: Finding;
    if (rule.id === 'R07' && options.gpuOmitted && !selected.gpu) finding = notApplicable('GPU dedicada omitida explícitamente.');
    else if (pending.length) finding = notApplicable(`Selección pendiente: ${pending.join(', ')}.`);
    else {
      try { finding = rule.evaluate(context); } catch (error) {
        if (!(error instanceof MissingData)) throw error;
        finding = unknown(error.message, rule.mandatory);
      }
    }
    const involved = [...rule.components];
    if (['R10', 'R11', 'R15'].includes(rule.id)) involved.push('gpu');
    return { id: rule.id, ...finding, componentes: involved };
  });
  const complete = !missingCategories.length;
  const blocked = selectionErrors.length > 0 || checks.some(check => check.estado === 'no_cumple' && check.severidad === 'bloqueo');
  const missingData = checks.some(check => check.estado === 'sin_datos' && check.severidad === 'bloqueo');
  const status = !complete ? 'incompleta' : blocked ? 'no_valida' : missingData ? 'pendiente_datos' : 'validada';
  let watts: ReturnType<typeof power> | null = null;
  if (!gpuPending(context)) {
    try { watts = power(context); } catch (error) { if (!(error instanceof MissingData)) throw error; }
  }
  const total = Math.round(parts.reduce((sum, part) => sum + Math.round(part.price * 100), 0)) / 100;
  const budget = options.budget ?? null;
  const withinBudget = budget === null ? null : total <= budget;
  return {
    status, complete, valid: status === 'validada', missingCategories, duplicateCategories, selectionErrors, checks,
    observations: checks.filter(check => check.severidad === 'advertencia' || check.severidad === 'sugerencia'),
    estimatedWatts: watts?.estimatedWatts ?? null, minimumWatts: watts?.minimumWatts ?? null, requiredWatts: watts?.requiredWatts ?? null,
    total, currency: 'PEN', demo: true,
    budget: { limit: budget, withinBudget, shortfall: budget === null ? null : Math.max(0, Math.round((total - budget) * 100) / 100) },
    recommended: status === 'validada' && checks.find(check => check.id === 'R15')?.estado === 'cumple' && withinBudget === true,
    limitations: ['Datos, evidencia de software y precios ficticios.', 'Solo un kit RAM, un SSD M.2 NVMe y refrigeración por aire en la disposición curada.', 'No certifica rendimiento, estabilidad térmica ni transitorios eléctricos.'],
  };
}
