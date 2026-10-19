import type { SoftwareMode } from './catalog.mjs';

export const profileIds = ['diseno', 'render_cpu', 'render_gpu', 'gaming'] as const;
export type ProfileId = typeof profileIds[number];
export type UseProfile = {
  id: ProfileId; name: string; software: string; ramGb: number; storageGb: number;
  cpuCores: number | null; dedicatedGpu: boolean; vramGb: number | null;
  cpuMode: SoftwareMode; graphicsMode: SoftwareMode;
};
export const profiles: UseProfile[] = [
  { id: 'diseno', name: 'Diseño gráfico', software: 'Photoshop', ramGb: 32, storageGb: 1000, cpuCores: null, dedicatedGpu: false, vramGb: null, cpuMode: 'photoshopCpu', graphicsMode: 'photoshopGraphics' },
  { id: 'render_cpu', name: 'Render por CPU', software: 'Blender Cycles CPU', ramGb: 32, storageGb: 1000, cpuCores: 8, dedicatedGpu: false, vramGb: null, cpuMode: 'blenderCpu', graphicsMode: 'blenderGraphics' },
  { id: 'render_gpu', name: 'Render por GPU', software: 'Blender Cycles GPU', ramGb: 32, storageGb: 1000, cpuCores: null, dedicatedGpu: true, vramGb: 8, cpuMode: 'blenderCpu', graphicsMode: 'cyclesGpu' },
  { id: 'gaming', name: 'Gaming', software: 'Fortnite, escenario 1080p sin garantía de FPS', ramGb: 16, storageGb: 1000, cpuCores: null, dedicatedGpu: true, vramGb: 8, cpuMode: 'fortniteCpu', graphicsMode: 'fortniteGpu' },
];
