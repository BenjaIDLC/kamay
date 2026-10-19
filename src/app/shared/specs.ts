import type { Part } from '../core/api';

/** Short, human-readable spec lines for a part. */
export function specList(part: Part): string[] {
  const s = part.specs;
  switch (part.category) {
    case 'cpu': return [`Socket ${s['socket']}`, `${s['cores']} núcleos / ${s['threads']} hilos`, `Hasta ${s['watts']} W`, s['integratedGraphics'] ? 'Con gráficos integrados' : 'Sin gráficos integrados'];
    case 'motherboard': return [`Socket ${s['socket']} · chipset ${s['chipset']}`, `Formato ${s['formFactor']}`, `Memoria ${s['memoryType']}`];
    case 'ram': return [`${s['capacityGb']} GB ${s['memoryType']}`, `${s['modules']} módulos a ${s['speedMts']} MT/s`];
    case 'gpu': return [`${s['vramGb']} GB de VRAM`, `${s['lengthMm']} mm de largo`, `${s['watts']} W · fuente recomendada ${s['recommendedPsuWatts']} W`];
    case 'storage': return [`${Number(s['capacityGb']) / 1000} TB ${s['interface']}`];
    case 'psu': return [`${s['watts']} W`, String(s['certification'])];
    case 'case': return [`Placas ${(s['formFactors'] as string[]).join(', ')}`, `GPU hasta ${s['maxGpuLengthMm']} mm`, `Cooler hasta ${s['maxCoolerHeightMm']} mm`];
    case 'cooler': return [`${s['heightMm']} mm de alto`, `Sockets ${(s['sockets'] as string[]).join(', ')}`];
  }
}
