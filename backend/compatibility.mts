import { categories, type Component } from './catalog.mjs';

export function validateConfiguration(parts: Component[]) {
  const get = (category: Component['category']) => parts.find(part => part.category === category);
  const cpu = get('cpu'), board = get('motherboard'), ram = get('ram');
  const enclosure = get('case'), psu = get('psu'), gpu = get('gpu'), cooler = get('cooler');
  const checks: { rule: string; status: 'pass' | 'fail' | 'unknown'; message: string }[] = [];
  function check(rule: string, known: boolean, matches: boolean, message: string) {
    checks.push({ rule, status: known ? (matches ? 'pass' : 'fail') : 'unknown', message });
  }
  check('socket', !!cpu?.specs.socket && !!board?.specs.socket, cpu?.specs.socket === board?.specs.socket, 'Socket del procesador y de la placa.');
  check('ram', !!ram?.specs.ram && !!board?.specs.ram, ram?.specs.ram === board?.specs.ram, 'Generación de RAM admitida por la placa.');
  check('form-factor', !!board?.specs.formFactor && !!enclosure?.specs.supportedFormFactors, enclosure?.specs.supportedFormFactors?.includes(board?.specs.formFactor ?? '') ?? false, 'Formato de placa admitido por el gabinete.');
  check('cooler-socket', !!cpu?.specs.socket && !!cooler?.specs.supportedSockets, cooler?.specs.supportedSockets?.includes(cpu?.specs.socket ?? '') ?? false, 'Montaje del refrigerador para el socket.');
  // shortcut: fixed 100 W allowance for other parts, replace with verified full-system power data before sales.
  const estimatedWatts = cpu?.specs.watts !== undefined && gpu?.specs.watts !== undefined ? cpu.specs.watts + gpu.specs.watts + 100 : null;
  const requiredWatts = estimatedWatts === null ? null : Math.ceil(estimatedWatts * 1.25);
  check('power', requiredWatts !== null && psu?.specs.capacityWatts !== undefined, requiredWatts !== null && (psu?.specs.capacityWatts ?? 0) >= requiredWatts, 'Estimación CPU + GPU + 100 W, con margen del 25%; no verifica transitorios ni conectores.');
  const missingCategories = categories.filter(category => !get(category));
  const duplicateCategories = categories.filter(category => parts.filter(part => part.category === category).length > 1);
  return {
    complete: missingCategories.length === 0,
    valid: missingCategories.length === 0 && duplicateCategories.length === 0 && checks.every(check => check.status === 'pass'),
    missingCategories, duplicateCategories, checks, estimatedWatts, requiredWatts,
    total: parts.reduce((sum, part) => sum + part.price, 0), currency: 'PEN', demo: true,
    limitations: ['Datos y precios ficticios.', 'No verifica BIOS, dimensiones, conectores, capacidad térmica ni interfaz de almacenamiento.', 'Un resultado válido solo cubre las reglas enumeradas.'],
  };
}
