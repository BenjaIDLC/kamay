/**
 * Perfiles de uso que Kamay sabe orientar y sus requisitos mínimos.
 * @module
 */

/** Identificadores de los 4 perfiles de uso. */
export const profileIds = ['diseno', 'render_cpu', 'render_gpu', 'gaming'] as const;
export type ProfileId = typeof profileIds[number];

/** Un perfil de uso con los umbrales que revisa la regla «Adecuación al uso». */
export type Profile = {
  id: ProfileId;
  name: string;
  software: string;
  description: string;
  minRamGb: number;
  minStorageGb: number;
  minCores: number | null;
  needsGpu: boolean;
  minVramGb: number | null;
};

// Umbrales de curaduría del proyecto, basados en requisitos publicados de Adobe, Blender y Epic Games.
export const profiles: Profile[] = [
  { id: 'diseno', name: 'Diseño gráfico', software: 'Photoshop', description: 'Fotografía, composición y edición 2D.',
    minRamGb: 32, minStorageGb: 1000, minCores: 6, needsGpu: false, minVramGb: null },
  { id: 'render_cpu', name: 'Render 3D por CPU', software: 'Blender Cycles (CPU)', description: 'Render final usando todos los núcleos del procesador.',
    minRamGb: 32, minStorageGb: 1000, minCores: 12, needsGpu: false, minVramGb: null },
  { id: 'render_gpu', name: 'Render 3D por GPU', software: 'Blender Cycles (GPU)', description: 'Render acelerado por la tarjeta gráfica (OptiX/HIP).',
    minRamGb: 32, minStorageGb: 1000, minCores: 8, needsGpu: true, minVramGb: 12 },
  { id: 'gaming', name: 'Gaming', software: 'Fortnite y juegos actuales', description: 'Juego a 1080p–1440p.',
    minRamGb: 16, minStorageGb: 1000, minCores: 6, needsGpu: true, minVramGb: 8 },
];

/** Busca un perfil por su identificador; `null` si no existe o no se eligió. */
export const findProfile = (id: string | null | undefined) => profiles.find(profile => profile.id === id) ?? null;
