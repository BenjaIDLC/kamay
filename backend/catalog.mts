export const categories = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'case', 'psu', 'cooler'] as const;
export type Category = typeof categories[number];
export type SoftwareMode = 'photoshopCpu' | 'photoshopGraphics' | 'blenderCpu' | 'blenderGraphics' | 'cyclesGpu' | 'fortniteCpu' | 'fortniteGpu';
export type SoftwareEvidence = {
  status: 'cumple' | 'no_cumple' | 'sin_datos';
  version: string;
  conditions: string;
  source: string;
  checkedAt: string;
};
export type ConnectorRequirement = { count: number; independentCables: number };
export type CpuSupport = { sku: string; revision: string; supported: boolean; minBios?: string };
export type MemoryMode = { modules: number; speedMts: number; profile: string; minBios: string };
export type Component = {
  id: string;
  sku: string;
  revision: string;
  name: string;
  category: Category;
  price: number;
  rationale: string;
  source: string;
  demo: true;
  specs: {
    socket?: string;
    generation?: string;
    tdpWatts?: number;
    powerWatts?: number;
    cores?: number;
    integratedGraphics?: boolean;
    chipset?: string;
    chipsets?: string[];
    cpuSupport?: CpuSupport[];
    biosReleases?: string[];
    biosVersion?: string;
    biosUpdateGenerations?: string[];
    memoryType?: string;
    memoryTypes?: string[];
    memoryFormat?: string;
    memoryFormats?: string[];
    buffering?: string;
    bufferingTypes?: string[];
    memorySlots?: number;
    maxMemoryGb?: number;
    moduleCounts?: number[];
    memoryModes?: MemoryMode[];
    modules?: number;
    gbPerModule?: number;
    speedMts?: number;
    memoryProfile?: string;
    voltage?: number;
    vramGb?: number;
    capacityGb?: number;
    protocol?: string;
    key?: string;
    size?: string;
    m2Slots?: { protocol: string; key: string; sizes: string[]; activeCpuSkus: string[] }[];
    formFactor?: string;
    supportedFormFactors?: string[];
    widthMm?: number;
    heightMm?: number;
    lengthMm?: number;
    slots?: number;
    cableClearanceMm?: number;
    maxBoardWidthMm?: number;
    maxBoardHeightMm?: number;
    maxGpuLengthMm?: number;
    maxGpuWidthMm?: number;
    maxGpuHeightMm?: number;
    maxGpuSlots?: number;
    maxCableClearanceMm?: number;
    maxCoolerHeightMm?: number;
    psuFormFactors?: string[];
    maxPsuLengthMm?: number;
    maxRamHeightMm?: number;
    boardClearance?: { sku: string; revision: string; fits: boolean }[];
    supportedSockets?: string[];
    mountingKits?: string[];
    coolingType?: string;
    connectorsRequired?: Record<string, ConnectorRequirement>;
    cables?: { id: string; connector: string; plugs: number; psuSku: string; psuRevision: string }[];
    capacityWatts?: number;
    minimumSystemPsuWatts?: number;
    videoCpuSkus?: string[];
    software?: Partial<Record<SoftwareMode, SoftwareEvidence>>;
  };
};

// shortcut: synthetic hardware and software evidence, replace with per-SKU sources before real recommendations.
const source = 'Fixture Kamay v1; especificaciones y precios ficticios, no evidencia de fabricante.';
function software(...modes: SoftwareMode[]): Partial<Record<SoftwareMode, SoftwareEvidence>> {
  return Object.fromEntries(modes.map(mode => [mode, {
    status: 'cumple', version: 'demo-v1', conditions: 'Windows 11; soporte simulado, no probado en hardware.',
    source, checkedAt: '2026-10-18',
  }]));
}
const memoryModes: MemoryMode[] = [
  { modules: 2, speedMts: 5600, profile: 'JEDEC', minBios: 'F1' },
  { modules: 2, speedMts: 6000, profile: 'EXPO', minBios: 'F2' },
];
const cpuSupport: CpuSupport[] = [
  { sku: 'DEMO-CPU-A', revision: '1', supported: true, minBios: 'F1' },
  { sku: 'DEMO-CPU-B', revision: '1', supported: true, minBios: 'F2' },
];
const cpuSpecs: Component['specs'] = {
  socket: 'AM5', generation: 'demo-am5', chipsets: ['B650'], memoryTypes: ['DDR5'],
  memoryFormats: ['DIMM'], bufferingTypes: ['unbuffered'], maxMemoryGb: 128, moduleCounts: [1, 2, 4],
  memoryModes, integratedGraphics: true,
  software: software('photoshopCpu', 'photoshopGraphics', 'blenderCpu', 'blenderGraphics', 'fortniteCpu'),
};
const boardSpecs: Component['specs'] = {
  socket: 'AM5', chipset: 'B650', formFactor: 'ATX', widthMm: 244, heightMm: 305,
  memoryTypes: ['DDR5'], memoryFormats: ['DIMM'], bufferingTypes: ['unbuffered'],
  memorySlots: 4, maxMemoryGb: 128, moduleCounts: [1, 2, 4], memoryModes, cpuSupport,
  biosReleases: ['F1', 'F2'], biosVersion: 'F2', biosUpdateGenerations: ['demo-am5'],
  m2Slots: [{ protocol: 'NVMe', key: 'M', sizes: ['2280'], activeCpuSkus: ['DEMO-CPU-A', 'DEMO-CPU-B'] }],
  videoCpuSkus: ['DEMO-CPU-A', 'DEMO-CPU-B'],
  connectorsRequired: { ATX24: { count: 1, independentCables: 1 }, EPS8: { count: 1, independentCables: 1 } },
};
const ramSpecs: Component['specs'] = {
  memoryType: 'DDR5', memoryFormat: 'DIMM', buffering: 'unbuffered', modules: 2,
  speedMts: 5600, memoryProfile: 'JEDEC', voltage: 1.1, powerWatts: 10, heightMm: 35,
};
const gpuSpecs: Component['specs'] = {
  protocol: 'PCIe', lengthMm: 304, widthMm: 50, heightMm: 130, slots: 3, cableClearanceMm: 30,
  connectorsRequired: { PCIe8: { count: 2, independentCables: 2 } }, minimumSystemPsuWatts: 550,
  software: software('photoshopGraphics', 'blenderGraphics', 'cyclesGpu', 'fortniteGpu'),
};
function psuSpecs(sku: string, capacityWatts: number): Component['specs'] {
  return { capacityWatts, formFactor: 'ATX', lengthMm: 160, cables: [
    { id: 'atx', connector: 'ATX24', plugs: 1, psuSku: sku, psuRevision: '1' },
    { id: 'eps', connector: 'EPS8', plugs: 1, psuSku: sku, psuRevision: '1' },
    { id: 'gpu1', connector: 'PCIe8', plugs: 2, psuSku: sku, psuRevision: '1' },
    { id: 'gpu2', connector: 'PCIe8', plugs: 2, psuSku: sku, psuRevision: '1' },
  ] };
}
const products: Omit<Component, 'sku' | 'revision' | 'source' | 'demo'>[] = [
  { id: 'cpu-a', name: 'Demo CPU A · 8 núcleos', category: 'cpu', price: 1200, rationale: 'Base sintética para diseño, render y gaming.', specs: { ...cpuSpecs, cores: 8, tdpWatts: 105, powerWatts: 120 } },
  { id: 'cpu-b', name: 'Demo CPU B · 16 núcleos', category: 'cpu', price: 2400, rationale: 'Base de demostración para render por CPU; no representa un benchmark.', specs: { ...cpuSpecs, cores: 16, tdpWatts: 170, powerWatts: 230 } },
  { id: 'board-a', name: 'Demo placa AM5 ATX', category: 'motherboard', price: 850, rationale: 'Plataforma DDR5 con BIOS F2 simulada.', specs: boardSpecs },
  { id: 'board-b', name: 'Demo placa LGA1700 ATX', category: 'motherboard', price: 750, rationale: 'Alternativa incompatible que demuestra los conflictos de plataforma.', specs: { ...boardSpecs, socket: 'LGA1700', chipset: 'B660', memoryTypes: ['DDR4'], cpuSupport: cpuSupport.map(cpu => ({ ...cpu, supported: false })) } },
  { id: 'ram-a', name: 'Demo RAM DDR5 · 32 GB', category: 'ram', price: 420, rationale: 'Objetivo de capacidad para diseño y render.', specs: { ...ramSpecs, gbPerModule: 16 } },
  { id: 'ram-b', name: 'Demo RAM DDR5 · 64 GB', category: 'ram', price: 780, rationale: 'Más capacidad nominal; no garantiza el tamaño de escena admisible.', specs: { ...ramSpecs, gbPerModule: 32 } },
  { id: 'ram-c', name: 'Demo RAM DDR5 · 16 GB', category: 'ram', price: 250, rationale: 'Objetivo inicial de gaming; permite demostrar advertencias en render.', specs: { ...ramSpecs, gbPerModule: 8 } },
  { id: 'gpu-a', name: 'Demo GPU · 12 GB', category: 'gpu', price: 2200, rationale: 'Aceleración de Cycles y juegos simulada.', specs: { ...gpuSpecs, vramGb: 12, powerWatts: 220 } },
  { id: 'gpu-b', name: 'Demo GPU · 16 GB', category: 'gpu', price: 3400, rationale: 'Alternativa con más VRAM para editar la base.', specs: { ...gpuSpecs, lengthMm: 330, vramGb: 16, powerWatts: 320, minimumSystemPsuWatts: 650 } },
  { id: 'gpu-c', name: 'Demo GPU · 4 GB', category: 'gpu', price: 600, rationale: 'Caso de prueba: puede encajar físicamente e incumplir el perfil.', specs: { ...gpuSpecs, vramGb: 4, powerWatts: 100, minimumSystemPsuWatts: 350, connectorsRequired: { PCIe8: { count: 1, independentCables: 1 } } } },
  { id: 'ssd-a', name: 'Demo SSD · 1 TB', category: 'storage', price: 320, rationale: 'Capacidad nominal objetivo del prototipo.', specs: { protocol: 'NVMe', key: 'M', size: '2280', capacityGb: 1000, powerWatts: 8 } },
  { id: 'ssd-b', name: 'Demo SSD · 2 TB', category: 'storage', price: 580, rationale: 'Ampliación de capacidad manteniendo una sola unidad.', specs: { protocol: 'NVMe', key: 'M', size: '2280', capacityGb: 2000, powerWatts: 10 } },
  { id: 'case-a', name: 'Demo gabinete ATX', category: 'case', price: 350, rationale: 'Disposición sintética con límites físicos explícitos.', specs: {
    supportedFormFactors: ['ATX', 'Micro-ATX'], maxBoardWidthMm: 244, maxBoardHeightMm: 305,
    maxGpuLengthMm: 360, maxGpuWidthMm: 70, maxGpuHeightMm: 150, maxGpuSlots: 4,
    maxCableClearanceMm: 40, maxCoolerHeightMm: 180, psuFormFactors: ['ATX'], maxPsuLengthMm: 200,
  } },
  { id: 'psu-a', name: 'Demo fuente · 650 W', category: 'psu', price: 360, rationale: 'Fuente con cables específicos simulados.', specs: psuSpecs('DEMO-PSU-A', 650) },
  { id: 'psu-b', name: 'Demo fuente · 850 W', category: 'psu', price: 520, rationale: 'Mayor margen de potencia para editar las bases.', specs: psuSpecs('DEMO-PSU-B', 850) },
  { id: 'cooler-a', name: 'Demo refrigeración AM5', category: 'cooler', price: 230, rationale: 'Cooler por aire; encaje simulado, sin certificación térmica.', specs: {
    coolingType: 'air', supportedSockets: ['AM5'], mountingKits: ['AM5'], heightMm: 160, maxRamHeightMm: 45,
    boardClearance: [{ sku: 'DEMO-BOARD-A', revision: '1', fits: true }, { sku: 'DEMO-BOARD-B', revision: '1', fits: true }],
  } },
];
export const catalog: Component[] = products.map(product => ({ ...product, sku: `DEMO-${product.id.toUpperCase()}`, revision: '1', source, demo: true }));
