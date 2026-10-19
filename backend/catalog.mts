export const categories = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'case', 'psu', 'cooler'] as const;
export type Category = typeof categories[number];
export type Component = {
  id: string;
  name: string;
  category: Category;
  price: number;
  rationale: string;
  specs: {
    socket?: string;
    ram?: string;
    formFactor?: string;
    supportedFormFactors?: string[];
    supportedSockets?: string[];
    watts?: number;
    capacityWatts?: number;
  };
};

// Synthetic products and specifications: replace with verified supplier data before sales.
export const catalog: Component[] = [
  { id: 'cpu-a', name: 'Demo CPU A · 8 núcleos', category: 'cpu', price: 1200, rationale: 'Opción equilibrada para juegos y trabajo creativo.', specs: { socket: 'AM5', watts: 120 } },
  { id: 'cpu-b', name: 'Demo CPU B · 16 núcleos', category: 'cpu', price: 2400, rationale: 'Alternativa para tareas con alto paralelismo; evaluar el software utilizado.', specs: { socket: 'AM5', watts: 170 } },
  { id: 'board-a', name: 'Demo placa AM5 ATX', category: 'motherboard', price: 850, rationale: 'Base DDR5 para los procesadores AM5 del catálogo.', specs: { socket: 'AM5', ram: 'DDR5', formFactor: 'ATX' } },
  { id: 'board-b', name: 'Demo placa LGA1700 ATX', category: 'motherboard', price: 750, rationale: 'Plataforma alternativa; incompatible con los procesadores AM5 del catálogo.', specs: { socket: 'LGA1700', ram: 'DDR4', formFactor: 'ATX' } },
  { id: 'ram-a', name: 'Demo RAM DDR5 · 32 GB', category: 'ram', price: 420, rationale: 'Punto de partida para juegos y proyectos creativos moderados.', specs: { ram: 'DDR5' } },
  { id: 'ram-b', name: 'Demo RAM DDR5 · 64 GB', category: 'ram', price: 780, rationale: 'Más capacidad para proyectos de video y escenas complejas.', specs: { ram: 'DDR5' } },
  { id: 'gpu-a', name: 'Demo GPU · 12 GB', category: 'gpu', price: 2200, rationale: 'Opción inicial de aceleración gráfica; verificar soporte del programa.', specs: { watts: 220 } },
  { id: 'gpu-b', name: 'Demo GPU · 16 GB', category: 'gpu', price: 3400, rationale: 'Mayor memoria gráfica para escenas y cargas exigentes, sin garantía de rendimiento.', specs: { watts: 320 } },
  { id: 'ssd-a', name: 'Demo SSD · 1 TB', category: 'storage', price: 320, rationale: 'Almacenamiento inicial para sistema y proyectos.', specs: {} },
  { id: 'ssd-b', name: 'Demo SSD · 2 TB', category: 'storage', price: 580, rationale: 'Mayor capacidad para material de video y bibliotecas.', specs: {} },
  { id: 'case-a', name: 'Demo gabinete ATX', category: 'case', price: 350, rationale: 'Admite el formato ATX; dimensiones internas aún no verificadas.', specs: { supportedFormFactors: ['ATX', 'Micro-ATX'] } },
  { id: 'psu-a', name: 'Demo fuente · 650 W', category: 'psu', price: 360, rationale: 'Capacidad de entrada sujeta a la estimación de consumo.', specs: { capacityWatts: 650 } },
  { id: 'psu-b', name: 'Demo fuente · 850 W', category: 'psu', price: 520, rationale: 'Mayor margen de capacidad para configuraciones exigentes.', specs: { capacityWatts: 850 } },
  { id: 'cooler-a', name: 'Demo refrigeración AM5', category: 'cooler', price: 230, rationale: 'Montaje AM5; capacidad térmica y espacio físico pendientes de verificación.', specs: { supportedSockets: ['AM5'] } },
];
