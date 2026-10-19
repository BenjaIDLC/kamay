import { catalog, categories } from './catalog.mjs';
import { profileIds, type ProfileId } from './profiles.mjs';
import type { ConfigurationOptions } from './compatibility.mjs';

export class ConfigurationInputError extends Error {}
export type ConfigurationInput = ConfigurationOptions & { componentIds: string[] };

// Both HTTP clients and AI tool arguments cross the same trust boundary.
export function parseConfiguration(value: unknown): ConfigurationInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ConfigurationInputError('Envía un objeto de configuración.');
  const input = value as Record<string, unknown>;
  const ids = input['componentIds'];
  if (!Array.isArray(ids) || ids.length > categories.length || !ids.every(id => typeof id === 'string') || new Set(ids).size !== ids.length) {
    throw new ConfigurationInputError('Identificadores inválidos: componentIds admite hasta ocho identificadores únicos.');
  }
  const parts = ids.map(id => catalog.find(part => part.id === id));
  if (parts.some(part => !part)) throw new ConfigurationInputError('Identificadores inválidos: hay productos fuera del catálogo.');
  if (new Set(parts.map(part => part!.category)).size !== parts.length) throw new ConfigurationInputError('Solo se admite un producto por categoría.');
  const gpuOmitted = input['gpuOmitted'] === undefined ? false : input['gpuOmitted'];
  if (typeof gpuOmitted !== 'boolean' || (gpuOmitted && parts.some(part => part!.category === 'gpu'))) {
    throw new ConfigurationInputError('gpuOmitted debe ser booleano; no puede omitirse una GPU seleccionada.');
  }
  const profileId = input['profileId'] ?? null;
  if (profileId !== null && !profileIds.some(id => id === profileId)) throw new ConfigurationInputError('Perfil de uso inválido.');
  const budget = input['budget'] ?? null;
  if (budget !== null && (typeof budget !== 'number' || !Number.isFinite(budget) || budget <= 0 || budget > 1_000_000_000)) {
    throw new ConfigurationInputError('El presupuesto debe ser un número positivo de hasta 1 000 000 000 PEN.');
  }
  return { componentIds: ids, gpuOmitted, profileId: profileId as ProfileId | null, budget };
}
