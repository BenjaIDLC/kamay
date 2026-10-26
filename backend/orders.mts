/**
 * Pedidos simulados: creación con revalidación en el servidor y avance por etapas.
 * @module
 */
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { InputError, parseConfiguration, validateConfiguration } from './compatibility.mjs';

/** Etapas del pedido, en orden. */
export const stages = ['pagado', 'ensamblaje', 'control_calidad', 'enviado', 'entregado'] as const;
export type Stage = typeof stages[number];

/** Pedido guardado, con los precios congelados al momento de la compra. */
export type Order = {
  id: string;
  createdAt: string;
  customer: { name: string; email: string };
  profileId: string | null;
  componentIds: string[];
  items: { id: string; category: string; name: string; price: number }[];
  total: number;
  currency: 'PEN';
  stage: Stage;
  history: { stage: Stage; at: string }[];
};

/** El pedido no existe; la API la responde con HTTP 404. */
export class NotFoundError extends Error {}

/**
 * Acceso a los pedidos guardados. Es la única clase que toca el almacenamiento, así que pasar a una base
 * de datos solo cambia esta clase.
 *
 * Atajo del MVP: guarda en un archivo JSON; reemplazar por una base de datos antes de un uso real.
 */
export class OrderStore {
  /** @param file - Ruta del archivo JSON donde se guardan los pedidos. */
  constructor(private file: string) {}

  /** Todos los pedidos, del más reciente al más antiguo. */
  list(): Order[] {
    try { return JSON.parse(readFileSync(this.file, 'utf8')) as Order[]; }
    catch { return []; }
  }

  /** @throws {@link NotFoundError} si no existe. */
  get(id: string): Order {
    const order = this.list().find(order => order.id === id);
    if (!order) throw new NotFoundError('Pedido no encontrado.');
    return order;
  }

  /**
   * Crea un pedido en etapa `pagado` (pago simulado).
   * @param body - Configuración y `customer` (nombre y correo) tal como llegan del cliente.
   * @throws InputError si los datos son inválidos o la configuración no es válida.
   */
  create(body: unknown, now = new Date()): Order {
    const input = parseConfiguration(body);
    const customer = (body as Record<string, unknown>)['customer'] as Record<string, unknown> | undefined;
    const name = typeof customer?.['name'] === 'string' ? customer['name'].trim() : '';
    const email = typeof customer?.['email'] === 'string' ? customer['email'].trim() : '';
    if (!name || name.length > 100) throw new InputError('Indica un nombre de hasta 100 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw new InputError('Indica un correo válido.');
    // El servidor vuelve a validar: nunca se confía en el estado enviado por el cliente.
    const validation = validateConfiguration(input);
    if (validation.status !== 'valida') throw new InputError('Solo se pueden pedir configuraciones completas y compatibles.');
    const at = now.toISOString();
    const order: Order = {
      id: randomUUID().slice(0, 8).toUpperCase(), createdAt: at, customer: { name, email },
      profileId: input.profileId, componentIds: input.componentIds,
      items: validation.parts.map(({ id, category, brand, name, price }) => ({ id, category, name: `${brand} ${name}`, price })),
      total: validation.total, currency: 'PEN', stage: 'pagado', history: [{ stage: 'pagado', at }],
    };
    this.save([order, ...this.list()]);
    return order;
  }

  /**
   * Pasa el pedido a la siguiente etapa y la registra en el historial.
   * @throws {@link NotFoundError} si no existe; {@link InputError} si ya fue entregado.
   */
  advance(id: string, now = new Date()): Order {
    const orders = this.list();
    const order = orders.find(order => order.id === id);
    if (!order) throw new NotFoundError('Pedido no encontrado.');
    const next = stages[stages.indexOf(order.stage) + 1];
    if (!next) throw new InputError('El pedido ya fue entregado.');
    order.stage = next;
    order.history.push({ stage: next, at: now.toISOString() });
    this.save(orders);
    return order;
  }

  private save(orders: Order[]) {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify(orders, null, 2));
  }
}
