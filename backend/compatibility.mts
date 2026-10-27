/**
 * Motor de compatibilidad: 8 reglas que revisan una configuración y calculan su estado, total y conflictos.
 * Es la única fuente de verdad sobre compatibilidad y precio; el frontend y el asesor IA solo la consultan.
 * @module
 */
import { categories, categoryNames, type Category, type Component } from './catalog.mjs';
import { catalog } from './catalog-repository.mjs';
import { profileIds, type ProfileId } from './profiles.mjs';

// Políticas del proyecto (no son límites de fabricante).
/** Margen sobre el consumo estimado para recomendar una fuente. */
export const PSU_MARGIN = 1.25;
/** Consumo estimado del resto del sistema (placa, RAM, discos, ventiladores), en vatios. */
export const BASE_SYSTEM_WATTS = 75;
/** Holgura mínima entre la GPU y el gabinete antes de advertir, en milímetros. */
export const CLEARANCE_MM = 10;

/** Categorías obligatorias: todas salvo la GPU. */
export const requiredCategories = categories.filter(category => category !== 'gpu');

/** Resultado de una regla. `pendiente` falta una pieza; `no_aplica` la regla no corresponde. */
export type CheckStatus = 'ok' | 'advertencia' | 'bloqueo' | 'pendiente' | 'no_aplica';
/** Resultado de evaluar una regla sobre una configuración. */
export type Check = { id: string; name: string; status: CheckStatus; message: string; parts: Category[] };
/** Configuración que envía el cliente: piezas elegidas, uso y presupuesto en soles. */
export type ConfigurationInput = { componentIds: string[]; profileId: ProfileId | null; budget: number | null };
export type Parts = Partial<Record<Category, Component>>;
/** Una regla del motor: qué piezas mira y cómo evalúa. */
export type Rule = { id: string; name: string; parts: Category[]; evaluate: (parts: Parts, input: ConfigurationInput) => Omit<Check, 'id' | 'name' | 'parts'> };

const ok = (message: string) => ({ status: 'ok' as const, message });
const warn = (message: string) => ({ status: 'advertencia' as const, message });
const block = (message: string) => ({ status: 'bloqueo' as const, message });
const pending = (...missing: Category[]) => ({ status: 'pendiente' as const, message: `Elige ${missing.map(c => categoryNames[c].toLowerCase()).join(' y ')} para comprobarlo.` });

function power(parts: Parts) {
  const estimated = parts.cpu!.specs.watts! + (parts.gpu?.specs.watts ?? 0) + BASE_SYSTEM_WATTS;
  const recommended = Math.max(Math.ceil(estimated * PSU_MARGIN), parts.gpu?.specs.recommendedPsuWatts ?? 0);
  return { estimated, recommended };
}

/** Las 8 reglas en el orden en que se muestran: socket, memoria, formato, espacio GPU, cooler, video, potencia y uso. */
export const rules: Rule[] = [
  { id: 'socket', name: 'Socket del procesador', parts: ['cpu', 'motherboard'], evaluate: ({ cpu, motherboard }) => {
    const a = cpu!.specs.socket, b = motherboard!.specs.socket;
    return a === b ? ok(`Procesador y placa usan socket ${a}.`) : block(`El procesador usa socket ${a} y la placa ${b}: no encajan.`);
  } },
  { id: 'memoria', name: 'Tipo de memoria', parts: ['ram', 'motherboard'], evaluate: ({ ram, motherboard }) => {
    const a = ram!.specs.memoryType, b = motherboard!.specs.memoryType;
    return a === b ? ok(`La placa admite memoria ${b}.`) : block(`La memoria es ${a} pero la placa solo admite ${b}.`);
  } },
  { id: 'formato', name: 'Placa en el gabinete', parts: ['motherboard', 'case'], evaluate: ({ motherboard, case: box }) => {
    const form = motherboard!.specs.formFactor!;
    return box!.specs.formFactors!.includes(form) ? ok(`El gabinete admite placas ${form}.`)
      : block(`El gabinete solo admite ${box!.specs.formFactors!.join(', ')}; la placa es ${form}.`);
  } },
  { id: 'gpu_espacio', name: 'Espacio para la tarjeta gráfica', parts: ['gpu', 'case'], evaluate: ({ gpu, case: box }) => {
    if (!gpu) return { status: 'no_aplica', message: 'Sin tarjeta gráfica dedicada.' };
    if (!box) return pending('case');
    const length = gpu.specs.lengthMm!, max = box.specs.maxGpuLengthMm!;
    if (length > max) return block(`La tarjeta mide ${length} mm y el gabinete admite hasta ${max} mm.`);
    if (length > max - CLEARANCE_MM) return warn(`La tarjeta (${length} mm) entra justa en el gabinete (${max} mm); quedan menos de ${CLEARANCE_MM} mm de holgura.`);
    return ok(`La tarjeta mide ${length} mm; el gabinete admite ${max} mm.`);
  } },
  { id: 'cooler', name: 'Montaje y altura del cooler', parts: ['cooler', 'cpu', 'case'], evaluate: ({ cooler, cpu, case: box }) => {
    const socket = cpu!.specs.socket!, height = cooler!.specs.heightMm!, max = box!.specs.maxCoolerHeightMm!;
    if (!cooler!.specs.sockets!.includes(socket)) return block(`El cooler no trae montaje para socket ${socket}.`);
    if (height > max) return block(`El cooler mide ${height} mm de alto y el gabinete admite ${max} mm.`);
    return ok(`Montaje ${socket} incluido; ${height} mm de alto frente a ${max} mm disponibles.`);
  } },
  { id: 'video', name: 'Salida de video', parts: ['cpu', 'gpu'], evaluate: ({ cpu, gpu }) => {
    if (gpu) return ok('La tarjeta gráfica proporciona la salida de video.');
    return cpu!.specs.integratedGraphics ? ok('Sin GPU dedicada: se usarán los gráficos integrados del procesador.')
      : block(`El ${cpu!.name} no tiene gráficos integrados: necesita una tarjeta gráfica.`);
  } },
  { id: 'potencia', name: 'Potencia de la fuente', parts: ['psu', 'cpu', 'gpu'], evaluate: parts => {
    const { estimated, recommended } = power(parts), watts = parts.psu!.specs.watts!;
    if (watts < estimated) return block(`Consumo estimado ${estimated} W y la fuente entrega ${watts} W.`);
    if (watts < recommended) return warn(`La fuente (${watts} W) cubre el consumo estimado (${estimated} W) pero no el recomendado de ${recommended} W.`);
    return ok(`Consumo estimado ${estimated} W; la fuente de ${watts} W cubre el recomendado de ${recommended} W.`);
  } },
  { id: 'perfil', name: 'Adecuación al uso', parts: ['cpu', 'ram', 'gpu', 'storage'], evaluate: (parts, input) => {
    const profile = catalog().profile(input.profileId);
    if (!profile) return { status: 'no_aplica', message: 'Elige un uso para recibir orientación.' };
    const issues: string[] = [];
    if (profile.minCores && parts.cpu!.specs.cores! < profile.minCores) issues.push(`se recomiendan al menos ${profile.minCores} núcleos (tiene ${parts.cpu!.specs.cores})`);
    if (parts.ram!.specs.capacityGb! < profile.minRamGb) issues.push(`se recomiendan ${profile.minRamGb} GB de RAM (tiene ${parts.ram!.specs.capacityGb})`);
    if (parts.storage!.specs.capacityGb! < profile.minStorageGb) issues.push(`se recomienda al menos 1 TB de almacenamiento`);
    if (profile.needsGpu && !parts.gpu) issues.push('necesita una tarjeta gráfica dedicada');
    if (profile.minVramGb && parts.gpu && parts.gpu.specs.vramGb! < profile.minVramGb) issues.push(`se recomiendan ${profile.minVramGb} GB de VRAM (tiene ${parts.gpu.specs.vramGb})`);
    return issues.length ? warn(`Para ${profile.name}: ${issues.join('; ')}.`) : ok(`Cumple los criterios de ${profile.name}.`);
  } },
];

function evaluate(parts: Parts, input: ConfigurationInput): Check[] {
  return rules.map(rule => {
    const missing = rule.parts.filter(category => category !== 'gpu' && !parts[category]);
    const result = missing.length && !(rule.id === 'gpu_espacio' && !parts.gpu) ? pending(...missing) : rule.evaluate(parts, input);
    return { id: rule.id, name: rule.name, parts: rule.parts, ...result };
  });
}

/**
 * Valida una configuración completa o parcial.
 * @param input - Configuración ya revisada por {@link parseConfiguration}.
 * @returns Estado global (`incompleta`, `no_valida` o `valida`), resultado de cada regla, total, presupuesto,
 *   si es recomendada y, por cada producto del catálogo, los bloqueos que causaría al elegirlo.
 */
export function validateConfiguration(input: ConfigurationInput) {
  const selected = input.componentIds.map(id => catalog().find(id)!);
  const parts: Parts = Object.fromEntries(selected.map(part => [part.category, part]));
  const checks = evaluate(parts, input);
  const missing = requiredCategories.filter(category => !parts[category]);
  const status = missing.length ? 'incompleta' : checks.some(check => check.status === 'bloqueo') ? 'no_valida' : 'valida';
  const total = selected.reduce((sum, part) => sum + part.price, 0);
  const budget = input.budget === null ? null : { amount: input.budget, within: total <= input.budget, difference: input.budget - total };
  const profileFit = checks.find(check => check.id === 'perfil')!.status === 'ok';
  return {
    ...input, status, missing, checks, total, currency: 'PEN', budget,
    recommended: status === 'valida' && profileFit && (budget?.within ?? true),
    parts: selected,
    conflicts: conflicts(parts, input),
  };
}
/** Resultado de {@link validateConfiguration}. */
export type Validation = ReturnType<typeof validateConfiguration>;

// Para cada producto del catálogo, los bloqueos que aparecerían al ponerlo en la selección actual.
function conflicts(parts: Parts, input: ConfigurationInput): Record<string, string[]> {
  return Object.fromEntries(catalog().components().map(candidate => {
    const swapped = { ...parts, [candidate.category]: candidate };
    const blocks = evaluate(swapped, input)
      .filter(check => check.status === 'bloqueo' && check.parts.includes(candidate.category))
      .map(check => check.message);
    return [candidate.id, blocks];
  }));
}

/** Entrada inválida del cliente o de la IA; la API la responde con HTTP 400. */
export class InputError extends Error {}

/**
 * Revisa una entrada no confiable y la convierte en {@link ConfigurationInput}.
 * Se usa igual para el cuerpo de las peticiones HTTP y para los argumentos que envía la IA.
 * @throws {@link InputError} si hay productos fuera del catálogo, repetidos por categoría, un uso desconocido o un presupuesto inválido.
 */
export function parseConfiguration(value: unknown): ConfigurationInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('Envía un objeto de configuración.');
  const input = value as Record<string, unknown>;
  const ids = input['componentIds'] ?? [];
  if (!Array.isArray(ids) || ids.length > categories.length || !ids.every(id => typeof id === 'string') || new Set(ids).size !== ids.length) {
    throw new InputError('componentIds debe ser una lista de hasta ocho identificadores distintos.');
  }
  const parts = ids.map(id => catalog().find(id));
  const unknown = ids.filter((_, index) => !parts[index]);
  if (unknown.length) throw new InputError(`Productos fuera del catálogo: ${unknown.join(', ')}.`);
  if (new Set(parts.map(part => part!.category)).size !== parts.length) throw new InputError('Solo se admite un producto por categoría.');
  const profileId = input['profileId'] ?? null;
  if (profileId !== null && !profileIds.some(id => id === profileId)) throw new InputError('Uso inválido.');
  const budget = input['budget'] ?? null;
  if (budget !== null && (typeof budget !== 'number' || !Number.isFinite(budget) || budget <= 0 || budget > 1_000_000)) {
    throw new InputError('El presupuesto debe ser un número positivo en soles.');
  }
  return { componentIds: ids, profileId: profileId as ProfileId | null, budget };
}
