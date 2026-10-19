import { catalog } from './catalog.mjs';
import { validateConfiguration, type ConfigurationOptions } from './compatibility.mjs';
import type { ConfigurationInput } from './configuration.mjs';

const common = ['board-a', 'ssd-a', 'case-a', 'psu-a', 'cooler-a'];
export const baseBuilds: (ConfigurationInput & { id: string; name: string })[] = [
  { id: 'base-diseno', name: 'Diseño gráfico', profileId: 'diseno', gpuOmitted: true, componentIds: ['cpu-a', 'ram-a', ...common] },
  { id: 'base-render-cpu', name: 'Render por CPU', profileId: 'render_cpu', gpuOmitted: true, componentIds: ['cpu-b', 'ram-b', ...common] },
  { id: 'base-render-gpu', name: 'Render por GPU', profileId: 'render_gpu', gpuOmitted: false, componentIds: ['cpu-a', 'ram-a', 'gpu-a', ...common] },
  { id: 'base-gaming', name: 'Gaming', profileId: 'gaming', gpuOmitted: false, componentIds: ['cpu-a', 'ram-c', 'gpu-a', ...common] },
];

export function listBuilds(options: Pick<ConfigurationOptions, 'profileId' | 'budget'> = {}) {
  const builds = baseBuilds.filter(build => !options.profileId || build.profileId === options.profileId).map(build => ({
    ...build, budget: options.budget ?? null,
    validation: validateConfiguration(build.componentIds.map(id => {
      const part = catalog.find(part => part.id === id);
      if (!part) throw new Error(`Base con producto inexistente: ${id}`);
      return part;
    }), { ...build, budget: options.budget }),
  })).sort((a, b) => a.validation.total - b.validation.total || a.id.localeCompare(b.id));
  // shortcut: alternatives are curated bases only, add a combination search if the product later needs one.
  const cheapest = builds.find(build => build.validation.valid && build.validation.checks.some(check => check.id === 'R15' && check.estado === 'cumple'));
  return {
    currency: 'PEN', demo: true, builds,
    recommendedBuildId: builds.find(build => build.validation.recommended)?.id ?? null,
    cheapestQualifyingBase: cheapest ? { id: cheapest.id, total: cheapest.validation.total, shortfall: cheapest.validation.budget.shortfall } : null,
  };
}
