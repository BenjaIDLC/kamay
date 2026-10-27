/**
 * Conexión a la base de datos SQLite (`node:sqlite`, incluido en Node): crea el esquema y carga los datos iniciales.
 * @module
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { seedCatalog } from './catalog-repository.mjs';

const schema = readFileSync(new URL('../../backend/schema.sql', import.meta.url), 'utf8');

/**
 * Abre (o crea) la base de datos, aplica el esquema y, si está vacía, carga el catálogo inicial.
 * @param file - Ruta del archivo, o `:memory:` para una base temporal (la usan los tests).
 */
export function openDatabase(file: string): DatabaseSync {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.exec(schema);
  if (!db.prepare('SELECT 1 FROM categoria LIMIT 1').get()) transaction(db, () => seedCatalog(db));
  return db;
}

/** Ejecuta `work` como una sola transacción: si algo falla, no se guarda nada. */
export function transaction<T>(db: DatabaseSync, work: () => T): T {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
