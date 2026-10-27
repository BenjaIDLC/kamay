/**
 * Pedidos simulados: creación con revalidación en el servidor y avance por etapas.
 * @module
 */
import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { InputError, parseConfiguration, validateConfiguration } from './compatibility.mjs';
import { transaction } from './db.mjs';

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
 * Acceso a los pedidos guardados en la base de datos (tablas `pedido`, `pedido_item` e `historial_etapa`).
 * Es la única clase que escribe SQL de pedidos.
 */
export class OrderRepository {
  constructor(private readonly db: DatabaseSync) {}

  /** Todos los pedidos, del más reciente al más antiguo. */
  list(): Order[] {
    const ids = this.db.prepare('SELECT id FROM pedido ORDER BY creado_en DESC, rowid DESC').all() as { id: string }[];
    return ids.map(({ id }) => this.get(id));
  }

  /** @throws {@link NotFoundError} si no existe. */
  get(id: string): Order {
    const row = this.db.prepare('SELECT * FROM pedido WHERE id = ?').get(id) as Record<string, string | number | null> | undefined;
    if (!row) throw new NotFoundError('Pedido no encontrado.');
    const items = this.db.prepare(`SELECT id_componente AS id, id_categoria AS category, nombre AS name, precio AS price
      FROM pedido_item WHERE id_pedido = ? ORDER BY rowid`).all(id) as Order['items'];
    const history = this.db.prepare('SELECT etapa AS stage, fecha AS at FROM historial_etapa WHERE id_pedido = ? ORDER BY id')
      .all(id) as Order['history'];
    return {
      id: row['id'] as string, createdAt: row['creado_en'] as string,
      customer: { name: row['nombre_cliente'] as string, email: row['correo_cliente'] as string },
      profileId: row['id_perfil'] as string | null, componentIds: items.map(item => item.id), items,
      total: row['total'] as number, currency: 'PEN', stage: row['etapa'] as Stage, history,
    };
  }

  /**
   * Crea un pedido en etapa `pagado` (pago simulado). El pedido, sus ítems y su historial se guardan en una sola transacción.
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
    const id = randomUUID().slice(0, 8).toUpperCase();
    const at = now.toISOString();
    transaction(this.db, () => {
      this.db.prepare(`INSERT INTO pedido (id, nombre_cliente, correo_cliente, id_perfil, total, etapa, creado_en)
        VALUES (?, ?, ?, ?, ?, 'pagado', ?)`).run(id, name, email, input.profileId, validation.total, at);
      const insertItem = this.db.prepare('INSERT INTO pedido_item (id_pedido, id_componente, id_categoria, nombre, precio) VALUES (?, ?, ?, ?, ?)');
      for (const part of validation.parts) insertItem.run(id, part.id, part.category, `${part.brand} ${part.name}`, part.price);
      this.db.prepare("INSERT INTO historial_etapa (id_pedido, etapa, fecha) VALUES (?, 'pagado', ?)").run(id, at);
    });
    return this.get(id);
  }

  /**
   * Pasa el pedido a la siguiente etapa y la registra en el historial.
   * @throws {@link NotFoundError} si no existe; {@link InputError} si ya fue entregado.
   */
  advance(id: string, now = new Date()): Order {
    const next = stages[stages.indexOf(this.get(id).stage) + 1];
    if (!next) throw new InputError('El pedido ya fue entregado.');
    transaction(this.db, () => {
      this.db.prepare('UPDATE pedido SET etapa = ? WHERE id = ?').run(next, id);
      this.db.prepare('INSERT INTO historial_etapa (id_pedido, etapa, fecha) VALUES (?, ?, ?)').run(id, next, now.toISOString());
    });
    return this.get(id);
  }
}
