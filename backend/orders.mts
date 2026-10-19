import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { InputError, parseConfiguration, validateConfiguration } from './compatibility.mjs';

export const stages = ['pagado', 'ensamblaje', 'control_calidad', 'enviado', 'entregado'] as const;
export type Stage = typeof stages[number];

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

export class NotFoundError extends Error {}

// shortcut: JSON file storage for the demo, replace with a database before real use.
export class OrderStore {
  constructor(private file: string) {}

  list(): Order[] {
    try { return JSON.parse(readFileSync(this.file, 'utf8')) as Order[]; }
    catch { return []; }
  }

  get(id: string): Order {
    const order = this.list().find(order => order.id === id);
    if (!order) throw new NotFoundError('Pedido no encontrado.');
    return order;
  }

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
