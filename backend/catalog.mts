/**
 * Categorías, tipos del catálogo y los 34 productos reales con los que se carga la base de datos la primera vez.
 * En ejecución el catálogo se lee de la base mediante {@link CatalogRepository}.
 * @module
 */
import type { ProfileId } from './profiles.mjs';
import type { CatalogRepository } from './catalog-repository.mjs';

/** Las 8 categorías de pieza, en el orden en que se muestran. */
export const categories = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case', 'cooler'] as const;
export type Category = typeof categories[number];

/** Nombre en español de cada categoría. */
export const categoryNames: Record<Category, string> = {
  cpu: 'Procesador', motherboard: 'Placa madre', ram: 'Memoria RAM', gpu: 'Tarjeta gráfica',
  storage: 'Almacenamiento', psu: 'Fuente de poder', case: 'Gabinete', cooler: 'Refrigeración',
};

/** Especificaciones técnicas; cada categoría usa solo los campos que le corresponden. */
export type Specs = {
  socket?: string;            // cpu, motherboard
  cores?: number;             // cpu: núcleos físicos
  threads?: number;           // cpu
  watts?: number;             // cpu: potencia máxima sostenida; gpu: consumo de la tarjeta; psu: capacidad
  integratedGraphics?: boolean; // cpu
  chipset?: string;           // motherboard
  formFactor?: string;        // motherboard
  memoryType?: string;        // motherboard, ram
  capacityGb?: number;        // ram (total), storage
  modules?: number;           // ram
  speedMts?: number;          // ram
  vramGb?: number;            // gpu
  lengthMm?: number;          // gpu
  recommendedPsuWatts?: number; // gpu: fuente recomendada por el fabricante
  interface?: string;         // storage
  certification?: string;     // psu
  formFactors?: string[];     // case: placas admitidas
  maxGpuLengthMm?: number;    // case
  maxCoolerHeightMm?: number; // case
  sockets?: string[];         // cooler
  heightMm?: number;          // cooler
};

/** Un producto del catálogo. */
export type Component = {
  id: string;
  category: Category;
  brand: string;
  name: string;
  price: number;              // PEN, referencial
  uses: ProfileId[];          // usos para los que la curaduría lo considera adecuado
  rationale: string;          // justificación técnica (OE1)
  specs: Specs;
};

const all: ProfileId[] = ['diseno', 'render_cpu', 'render_gpu', 'gaming'];

// Especificaciones tomadas de fichas públicas de los fabricantes; los precios son referenciales en PEN, no ofertas de venta.
/** Productos iniciales: se insertan en la base de datos cuando está vacía. */
export const initialComponents: Component[] = [
  // Procesadores
  { id: 'ryzen5-9600x', category: 'cpu', brand: 'AMD', name: 'Ryzen 5 9600X', price: 950, uses: ['diseno', 'gaming'],
    rationale: '6 núcleos Zen 5 con alta frecuencia: buen rendimiento por núcleo para Photoshop y juegos a un precio contenido.',
    specs: { socket: 'AM5', cores: 6, threads: 12, watts: 88, integratedGraphics: true } },
  { id: 'ryzen7-9700x', category: 'cpu', brand: 'AMD', name: 'Ryzen 7 9700X', price: 1300, uses: ['diseno', 'render_gpu', 'gaming'],
    rationale: '8 núcleos eficientes: equilibrio entre tareas creativas, render por GPU y gaming con bajo consumo.',
    specs: { socket: 'AM5', cores: 8, threads: 16, watts: 88, integratedGraphics: true } },
  { id: 'ryzen7-9800x3d', category: 'cpu', brand: 'AMD', name: 'Ryzen 7 9800X3D', price: 2000, uses: ['gaming'],
    rationale: 'La caché 3D V-Cache reduce la latencia en juegos; es la referencia para equipos gaming.',
    specs: { socket: 'AM5', cores: 8, threads: 16, watts: 162, integratedGraphics: true } },
  { id: 'ryzen9-9950x', category: 'cpu', brand: 'AMD', name: 'Ryzen 9 9950X', price: 2500, uses: ['render_cpu'],
    rationale: '16 núcleos y 32 hilos: el render por CPU en Blender Cycles escala casi linealmente con los núcleos.',
    specs: { socket: 'AM5', cores: 16, threads: 32, watts: 230, integratedGraphics: true } },
  { id: 'core-ultra5-245k', category: 'cpu', brand: 'Intel', name: 'Core Ultra 5 245K', price: 1100, uses: ['diseno', 'gaming'],
    rationale: '14 núcleos híbridos (6P + 8E): fluidez en edición 2D y multitarea.',
    specs: { socket: 'LGA1851', cores: 14, threads: 14, watts: 159, integratedGraphics: true } },
  { id: 'core-ultra7-265k', category: 'cpu', brand: 'Intel', name: 'Core Ultra 7 265K', price: 1500, uses: ['diseno', 'render_cpu', 'render_gpu'],
    rationale: '20 núcleos híbridos (8P + 12E): alternativa Intel sólida para render por CPU y flujos creativos.',
    specs: { socket: 'LGA1851', cores: 20, threads: 20, watts: 250, integratedGraphics: true } },
  { id: 'core-i5-14400f', category: 'cpu', brand: 'Intel', name: 'Core i5-14400F', price: 650, uses: ['gaming'],
    rationale: 'Opción económica para gaming. La «F» indica que no tiene gráficos integrados: necesita GPU dedicada.',
    specs: { socket: 'LGA1700', cores: 10, threads: 16, watts: 148, integratedGraphics: false } },

  // Placas madre
  { id: 'msi-b650-gaming-plus', category: 'motherboard', brand: 'MSI', name: 'B650 Gaming Plus WiFi', price: 750, uses: all,
    rationale: 'Plataforma AM5 con DDR5 y buena alimentación para CPUs de hasta 16 núcleos.',
    specs: { socket: 'AM5', chipset: 'B650', formFactor: 'ATX', memoryType: 'DDR5' } },
  { id: 'asus-b650m-tuf', category: 'motherboard', brand: 'ASUS', name: 'TUF Gaming B650M-Plus WiFi', price: 700, uses: ['diseno', 'gaming'],
    rationale: 'AM5 en formato Micro-ATX: permite gabinetes compactos.',
    specs: { socket: 'AM5', chipset: 'B650', formFactor: 'Micro-ATX', memoryType: 'DDR5' } },
  { id: 'gigabyte-x870-elite', category: 'motherboard', brand: 'Gigabyte', name: 'X870 Aorus Elite WiFi7', price: 1250, uses: ['render_cpu', 'render_gpu'],
    rationale: 'Chipset X870 con VRM robusto para cargas sostenidas de render y más conectividad.',
    specs: { socket: 'AM5', chipset: 'X870', formFactor: 'ATX', memoryType: 'DDR5' } },
  { id: 'msi-z890-pro', category: 'motherboard', brand: 'MSI', name: 'PRO Z890-P WiFi', price: 1000, uses: ['diseno', 'render_cpu', 'render_gpu'],
    rationale: 'Plataforma LGA1851 para los Core Ultra serie 200, con DDR5.',
    specs: { socket: 'LGA1851', chipset: 'Z890', formFactor: 'ATX', memoryType: 'DDR5' } },
  { id: 'msi-b760m-ddr4', category: 'motherboard', brand: 'MSI', name: 'PRO B760M-A DDR4', price: 480, uses: ['gaming'],
    rationale: 'Placa LGA1700 económica que reutiliza memoria DDR4.',
    specs: { socket: 'LGA1700', chipset: 'B760', formFactor: 'Micro-ATX', memoryType: 'DDR4' } },

  // Memoria RAM
  { id: 'kingston-ddr5-16', category: 'ram', brand: 'Kingston', name: 'Fury Beast DDR5 16 GB (2×8) 5600', price: 220, uses: ['gaming'],
    rationale: 'Mínimo razonable para gaming actual en doble canal.',
    specs: { memoryType: 'DDR5', capacityGb: 16, modules: 2, speedMts: 5600 } },
  { id: 'corsair-ddr5-32', category: 'ram', brand: 'Corsair', name: 'Vengeance DDR5 32 GB (2×16) 6000', price: 420, uses: all,
    rationale: '32 GB permiten trabajar con archivos grandes de Photoshop y escenas medianas de Blender.',
    specs: { memoryType: 'DDR5', capacityGb: 32, modules: 2, speedMts: 6000 } },
  { id: 'gskill-ddr5-64', category: 'ram', brand: 'G.Skill', name: 'Flare X5 DDR5 64 GB (2×32) 6000', price: 800, uses: ['render_cpu', 'render_gpu'],
    rationale: '64 GB para escenas pesadas y simulaciones en render 3D.',
    specs: { memoryType: 'DDR5', capacityGb: 64, modules: 2, speedMts: 6000 } },
  { id: 'kingston-ddr4-32', category: 'ram', brand: 'Kingston', name: 'Fury Beast DDR4 32 GB (2×16) 3200', price: 300, uses: ['gaming'],
    rationale: 'DDR4 económica para plataformas LGA1700 con placa DDR4.',
    specs: { memoryType: 'DDR4', capacityGb: 32, modules: 2, speedMts: 3200 } },

  // Tarjetas gráficas
  { id: 'rtx5060-asus-dual', category: 'gpu', brand: 'ASUS', name: 'Dual GeForce RTX 5060 8 GB', price: 1400, uses: ['diseno', 'gaming'],
    rationale: '8 GB de VRAM y aceleración para filtros de Photoshop; gaming a 1080p.',
    specs: { vramGb: 8, lengthMm: 229, watts: 145, recommendedPsuWatts: 550 } },
  { id: 'rtx5070-msi-ventus', category: 'gpu', brand: 'MSI', name: 'GeForce RTX 5070 Ventus 2X 12 GB', price: 2400, uses: ['render_gpu', 'gaming'],
    rationale: '12 GB de VRAM y OptiX: buen punto de entrada para render por GPU y gaming a 1440p.',
    specs: { vramGb: 12, lengthMm: 242, watts: 250, recommendedPsuWatts: 650 } },
  { id: 'rtx5070ti-gigabyte', category: 'gpu', brand: 'Gigabyte', name: 'GeForce RTX 5070 Ti Gaming OC 16 GB', price: 3800, uses: ['render_gpu', 'gaming'],
    rationale: '16 GB de VRAM: admite escenas de Blender más grandes en memoria de GPU.',
    specs: { vramGb: 16, lengthMm: 340, watts: 300, recommendedPsuWatts: 750 } },
  { id: 'rtx5080-asus-tuf', category: 'gpu', brand: 'ASUS', name: 'TUF GeForce RTX 5080 16 GB', price: 5500, uses: ['render_gpu'],
    rationale: 'Máximo rendimiento del catálogo para render por GPU; tarjeta larga y de alto consumo.',
    specs: { vramGb: 16, lengthMm: 348, watts: 360, recommendedPsuWatts: 850 } },
  { id: 'rx9070xt-sapphire', category: 'gpu', brand: 'Sapphire', name: 'Pulse Radeon RX 9070 XT 16 GB', price: 3000, uses: ['gaming'],
    rationale: '16 GB de VRAM con muy buena relación precio/rendimiento en juegos.',
    specs: { vramGb: 16, lengthMm: 320, watts: 304, recommendedPsuWatts: 750 } },

  // Almacenamiento
  { id: 'kingston-nv3-1tb', category: 'storage', brand: 'Kingston', name: 'NV3 1 TB NVMe', price: 260, uses: ['diseno', 'gaming'],
    rationale: 'SSD NVMe económico: arranque y carga de proyectos rápidos.',
    specs: { capacityGb: 1000, interface: 'NVMe' } },
  { id: 'wd-sn850x-1tb', category: 'storage', brand: 'WD', name: 'Black SN850X 1 TB NVMe', price: 420, uses: all,
    rationale: 'NVMe PCIe 4.0 de alto rendimiento sostenido.',
    specs: { capacityGb: 1000, interface: 'NVMe' } },
  { id: 'samsung-990pro-2tb', category: 'storage', brand: 'Samsung', name: '990 Pro 2 TB NVMe', price: 750, uses: ['render_cpu', 'render_gpu'],
    rationale: '2 TB para bibliotecas de texturas, caché y proyectos 3D.',
    specs: { capacityGb: 2000, interface: 'NVMe' } },

  // Fuentes de poder
  { id: 'corsair-cx650', category: 'psu', brand: 'Corsair', name: 'CX650 650 W 80+ Bronze', price: 300, uses: ['diseno', 'render_cpu'],
    rationale: 'Suficiente para equipos sin GPU o con GPU de consumo moderado.',
    specs: { watts: 650, certification: '80+ Bronze' } },
  { id: 'corsair-rm750e', category: 'psu', brand: 'Corsair', name: 'RM750e 750 W 80+ Gold', price: 450, uses: all,
    rationale: 'Eficiencia Gold y margen para GPUs de gama media-alta.',
    specs: { watts: 750, certification: '80+ Gold' } },
  { id: 'corsair-rm850x', category: 'psu', brand: 'Corsair', name: 'RM850x 850 W 80+ Gold', price: 600, uses: ['render_gpu', 'gaming'],
    rationale: 'Margen para GPUs de 300 W o más bajo carga sostenida.',
    specs: { watts: 850, certification: '80+ Gold' } },
  { id: 'seasonic-gx1000', category: 'psu', brand: 'Seasonic', name: 'Focus GX-1000 1000 W 80+ Gold', price: 800, uses: ['render_gpu'],
    rationale: 'Para la combinación más exigente del catálogo, con holgura.',
    specs: { watts: 1000, certification: '80+ Gold' } },

  // Gabinetes
  { id: 'corsair-4000d', category: 'case', brand: 'Corsair', name: '4000D Airflow', price: 400, uses: all,
    rationale: 'Frente perforado y buen flujo de aire; admite placas ATX.',
    specs: { formFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], maxGpuLengthMm: 360, maxCoolerHeightMm: 170 } },
  { id: 'lianli-lancool-216', category: 'case', brand: 'Lian Li', name: 'Lancool 216', price: 450, uses: ['render_cpu', 'render_gpu'],
    rationale: 'Ventiladores de 160 mm incluidos: buena refrigeración para cargas largas de render.',
    specs: { formFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], maxGpuLengthMm: 392, maxCoolerHeightMm: 180 } },
  { id: 'coolermaster-q300l', category: 'case', brand: 'Cooler Master', name: 'MasterBox Q300L', price: 220, uses: ['diseno', 'gaming'],
    rationale: 'Compacto y económico; solo admite placas Micro-ATX o Mini-ITX.',
    specs: { formFactors: ['Micro-ATX', 'Mini-ITX'], maxGpuLengthMm: 360, maxCoolerHeightMm: 159 } },

  // Refrigeración (aire)
  { id: 'thermalright-pa120', category: 'cooler', brand: 'Thermalright', name: 'Peerless Assassin 120 SE', price: 170, uses: all,
    rationale: 'Doble torre con excelente relación precio/rendimiento térmico.',
    specs: { sockets: ['AM5', 'LGA1700', 'LGA1851'], heightMm: 155 } },
  { id: 'deepcool-ak400', category: 'cooler', brand: 'DeepCool', name: 'AK400', price: 130, uses: ['diseno', 'gaming'],
    rationale: 'Torre simple y silenciosa para CPUs de consumo moderado.',
    specs: { sockets: ['AM5', 'LGA1700', 'LGA1851'], heightMm: 155 } },
  { id: 'noctua-nh-d15-g2', category: 'cooler', brand: 'Noctua', name: 'NH-D15 G2', price: 650, uses: ['render_cpu'],
    rationale: 'Disipador de aire de gama alta para CPUs de 16 núcleos en carga sostenida. Mide 168 mm de alto.',
    specs: { sockets: ['AM5', 'LGA1700', 'LGA1851'], heightMm: 168 } },
];
