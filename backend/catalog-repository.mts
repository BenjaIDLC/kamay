/**
 * Acceso a los datos del catálogo (componentes, perfiles de uso y equipos base) guardados en la base de datos.
 * @module
 */
import type { DatabaseSync } from 'node:sqlite';
import { categories, categoryNames, initialComponents, type Component, type Specs } from './catalog.mjs';
import { initialProfiles, type Profile, type ProfileId } from './profiles.mjs';
import { initialBuilds, type Build } from './builds.mjs';

type Row = Record<string, string | number | null>;
type ScalarSpec = Exclude<keyof Specs, 'formFactors' | 'sockets'>;

/** Columna de la tabla `componente` para cada especificación de un solo valor. */
const specColumns: Record<ScalarSpec, string> = {
  socket: 'socket', cores: 'nucleos', threads: 'hilos', watts: 'watts', integratedGraphics: 'graficos_integrados',
  chipset: 'chipset', formFactor: 'formato', memoryType: 'tipo_memoria', capacityGb: 'capacidad_gb', modules: 'modulos',
  speedMts: 'velocidad_mts', vramGb: 'vram_gb', lengthMm: 'largo_mm', recommendedPsuWatts: 'fuente_recomendada_w',
  interface: 'interfaz', certification: 'certificacion', maxGpuLengthMm: 'max_largo_gpu_mm',
  maxCoolerHeightMm: 'max_altura_cooler_mm', heightMm: 'altura_mm',
};
const scalarSpecs = Object.keys(specColumns) as ScalarSpec[];
/** Especificaciones de varios valores y su `tipo` en la tabla `componente_soporte`. */
const supportTypes = { formFactors: 'formato', sockets: 'socket' } as const;

/**
 * Lee el catálogo de la base de datos y lo mantiene en memoria: el motor de compatibilidad lo recorre completo en
 * cada validación. Después de modificar el catálogo hay que llamar a {@link CatalogRepository.reload}.
 */
export class CatalogRepository {
  private parts: Component[] = [];
  private byId = new Map<string, Component>();
  private profileList: Profile[] = [];
  private buildList: Build[] = [];

  constructor(private readonly db: DatabaseSync) {
    this.reload();
  }

  /** Vuelve a leer el catálogo de la base de datos. */
  reload() {
    const supports = new Map<string, Row[]>();
    for (const row of this.all('SELECT id_componente, tipo, valor FROM componente_soporte ORDER BY rowid')) {
      supports.set(row['id_componente'] as string, [...supports.get(row['id_componente'] as string) ?? [], row]);
    }
    const uses = new Map<string, ProfileId[]>();
    for (const row of this.all('SELECT id_componente, id_perfil FROM componente_perfil ORDER BY rowid')) {
      uses.set(row['id_componente'] as string, [...uses.get(row['id_componente'] as string) ?? [], row['id_perfil'] as ProfileId]);
    }
    this.parts = this.all(`
      SELECT c.*, m.nombre AS marca FROM componente c
      JOIN marca m ON m.id = c.id_marca JOIN categoria k ON k.id = c.id_categoria
      WHERE c.activo = 1 ORDER BY k.orden, c.rowid`).map(row => toComponent(row, supports.get(row['id'] as string) ?? [], uses.get(row['id'] as string) ?? []));
    this.byId = new Map(this.parts.map(part => [part.id, part]));

    this.profileList = this.all('SELECT * FROM perfil_uso ORDER BY rowid').map(row => ({
      id: row['id'] as ProfileId, name: row['nombre'] as string, software: row['software'] as string,
      description: row['descripcion'] as string, minRamGb: row['min_ram_gb'] as number,
      minStorageGb: row['min_almacenamiento_gb'] as number, minCores: row['min_nucleos'] as number | null,
      needsGpu: row['necesita_gpu'] === 1, minVramGb: row['min_vram_gb'] as number | null,
    }));

    const buildParts = new Map<string, string[]>();
    for (const row of this.all(`
      SELECT e.id_equipo, e.id_componente FROM equipo_base_componente e
      JOIN componente c ON c.id = e.id_componente JOIN categoria k ON k.id = c.id_categoria ORDER BY k.orden`)) {
      buildParts.set(row['id_equipo'] as string, [...buildParts.get(row['id_equipo'] as string) ?? [], row['id_componente'] as string]);
    }
    // Un equipo base con alguna pieza desactivada deja de ofrecerse.
    this.buildList = this.all('SELECT * FROM equipo_base ORDER BY orden')
      .map(row => ({ id: row['id'] as string, name: row['nombre'] as string, tagline: row['lema'] as string,
        profileId: row['id_perfil'] as ProfileId, componentIds: buildParts.get(row['id'] as string) ?? [] }))
      .filter(build => build.componentIds.every(id => this.byId.has(id)));
  }

  /** Componentes activos, ordenados por categoría. */
  components(): Component[] {
    return this.parts;
  }

  /** Busca un componente activo; `undefined` si no existe o está desactivado. */
  find(id: string): Component | undefined {
    return this.byId.get(id);
  }

  /** Los perfiles de uso. */
  profiles(): Profile[] {
    return this.profileList;
  }

  /** Busca un perfil; `null` si no existe o no se eligió. */
  profile(id: string | null | undefined): Profile | null {
    return this.profileList.find(profile => profile.id === id) ?? null;
  }

  /** Equipos base cuyas piezas siguen activas. */
  builds(): Build[] {
    return this.buildList;
  }

  private all(sql: string) {
    return this.db.prepare(sql).all() as Row[];
  }
}

function toComponent(row: Row, supports: Row[], uses: ProfileId[]): Component {
  const specs: Specs = {};
  for (const key of scalarSpecs) {
    const value = row[specColumns[key]];
    if (value !== null) Object.assign(specs, { [key]: key === 'integratedGraphics' ? value === 1 : value });
  }
  for (const [key, type] of Object.entries(supportTypes)) {
    const values = supports.filter(support => support['tipo'] === type).map(support => support['valor'] as string);
    if (values.length) Object.assign(specs, { [key]: values });
  }
  return { id: row['id'] as string, category: row['id_categoria'] as Component['category'], brand: row['marca'] as string,
    name: row['nombre'] as string, price: row['precio'] as number, uses, rationale: row['justificacion'] as string, specs };
}

/** Inserta las categorías, los perfiles, los productos y los equipos base iniciales en una base vacía. */
export function seedCatalog(db: DatabaseSync) {
  const insertCategory = db.prepare('INSERT INTO categoria (id, nombre, orden) VALUES (?, ?, ?)');
  categories.forEach((id, index) => insertCategory.run(id, categoryNames[id], index + 1));

  const insertProfile = db.prepare(`INSERT INTO perfil_uso (id, nombre, software, descripcion, min_ram_gb,
    min_almacenamiento_gb, min_nucleos, necesita_gpu, min_vram_gb) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const p of initialProfiles) {
    insertProfile.run(p.id, p.name, p.software, p.description, p.minRamGb, p.minStorageGb, p.minCores, p.needsGpu ? 1 : 0, p.minVramGb);
  }

  const insertBrand = db.prepare('INSERT INTO marca (nombre) VALUES (?) ON CONFLICT (nombre) DO NOTHING');
  const brandId = db.prepare('SELECT id FROM marca WHERE nombre = ?');
  const insertComponent = db.prepare(`INSERT INTO componente (id, id_categoria, id_marca, nombre, precio, justificacion,
    ${scalarSpecs.map(key => specColumns[key]).join(', ')}) VALUES (${Array(6 + scalarSpecs.length).fill('?').join(', ')})`);
  const insertSupport = db.prepare('INSERT INTO componente_soporte (id_componente, tipo, valor) VALUES (?, ?, ?)');
  const insertUse = db.prepare('INSERT INTO componente_perfil (id_componente, id_perfil) VALUES (?, ?)');
  for (const part of initialComponents) {
    insertBrand.run(part.brand);
    const brand = (brandId.get(part.brand) as Row)['id'];
    const specs = scalarSpecs.map(key => {
      const value = part.specs[key];
      return typeof value === 'boolean' ? Number(value) : value ?? null;
    });
    insertComponent.run(part.id, part.category, brand, part.name, part.price, part.rationale, ...specs);
    for (const [key, type] of Object.entries(supportTypes)) {
      for (const value of part.specs[key as keyof typeof supportTypes] ?? []) insertSupport.run(part.id, type, value);
    }
    for (const use of part.uses) insertUse.run(part.id, use);
  }

  const insertBuild = db.prepare('INSERT INTO equipo_base (id, nombre, lema, id_perfil, orden) VALUES (?, ?, ?, ?, ?)');
  const insertBuildPart = db.prepare('INSERT INTO equipo_base_componente (id_equipo, id_componente) VALUES (?, ?)');
  initialBuilds.forEach((build, index) => {
    insertBuild.run(build.id, build.name, build.tagline, build.profileId, index + 1);
    for (const id of build.componentIds) insertBuildPart.run(build.id, id);
  });
}

let active: CatalogRepository | null = null;

/** Define el catálogo que usan el motor, el asesor y la API. Se llama una vez al crear la aplicación. */
export function useCatalog(repository: CatalogRepository) {
  active = repository;
}

/** El catálogo activo. */
export function catalog(): CatalogRepository {
  if (!active) throw new Error('Catálogo no inicializado: llama a useCatalog() al crear la aplicación.');
  return active;
}
