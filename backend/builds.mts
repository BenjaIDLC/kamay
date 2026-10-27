/**
 * Equipos base curados: un punto de partida por cada perfil de uso.
 * @module
 */
import { catalog } from './catalog-repository.mjs';
import { validateConfiguration } from './compatibility.mjs';
import type { ProfileId } from './profiles.mjs';

/** Equipo base: nombre comercial, perfil y piezas. */
export type Build = { id: string; name: string; tagline: string; profileId: ProfileId; componentIds: string[] };

/** Equipos iniciales: se insertan en la base de datos cuando está vacía. Son un punto de partida, nunca una promesa de rendimiento. */
export const initialBuilds: Build[] = [
  { id: 'kamay-diseno', name: 'Kamay Estudio', tagline: 'Photoshop fluido con archivos grandes.', profileId: 'diseno',
    componentIds: ['ryzen7-9700x', 'msi-b650-gaming-plus', 'corsair-ddr5-32', 'rtx5060-asus-dual', 'wd-sn850x-1tb', 'corsair-cx650', 'corsair-4000d', 'deepcool-ak400'] },
  { id: 'kamay-render-cpu', name: 'Kamay Render CPU', tagline: '16 núcleos para Blender Cycles por CPU.', profileId: 'render_cpu',
    componentIds: ['ryzen9-9950x', 'gigabyte-x870-elite', 'gskill-ddr5-64', 'samsung-990pro-2tb', 'corsair-cx650', 'lianli-lancool-216', 'noctua-nh-d15-g2'] },
  { id: 'kamay-render-gpu', name: 'Kamay Render GPU', tagline: '16 GB de VRAM para Cycles con OptiX.', profileId: 'render_gpu',
    componentIds: ['ryzen7-9700x', 'gigabyte-x870-elite', 'gskill-ddr5-64', 'rtx5070ti-gigabyte', 'samsung-990pro-2tb', 'corsair-rm850x', 'lianli-lancool-216', 'thermalright-pa120'] },
  { id: 'kamay-gaming', name: 'Kamay Arena', tagline: 'Gaming a 1440p con el mejor CPU para juegos.', profileId: 'gaming',
    componentIds: ['ryzen7-9800x3d', 'msi-b650-gaming-plus', 'corsair-ddr5-32', 'rtx5070-msi-ventus', 'kingston-nv3-1tb', 'corsair-rm750e', 'corsair-4000d', 'thermalright-pa120'] },
];

/**
 * Devuelve los equipos base validados por el motor de compatibilidad.
 * @param profileId - Si se indica, solo devuelve el equipo de ese uso.
 * @param budget - Presupuesto en soles para calcular si cada equipo entra en él.
 */
export function listBuilds(profileId: ProfileId | null = null, budget: number | null = null) {
  return catalog().builds()
    .filter(build => !profileId || build.profileId === profileId)
    .map(({ componentIds, ...build }) => {
      const { conflicts: _, ...validation } = validateConfiguration({ componentIds, profileId: build.profileId, budget });
      return { ...build, validation };
    });
}
