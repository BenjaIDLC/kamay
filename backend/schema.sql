-- Esquema de la base de datos de Kamay (SQLite). Se aplica al abrir la base; cada sentencia es idempotente.
-- Convenciones: tablas y columnas en snake_case y en español; precios en soles enteros (los precios son referenciales y
-- sin céntimos); fechas en texto ISO 8601 (UTC); booleanos como 0/1.

-- Catálogo -------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categoria (
  id      TEXT PRIMARY KEY,                 -- cpu, motherboard, ram, gpu, storage, psu, case, cooler
  nombre  TEXT NOT NULL UNIQUE,
  orden   INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS marca (
  id      INTEGER PRIMARY KEY,
  nombre  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS perfil_uso (
  id                     TEXT PRIMARY KEY,  -- diseno, render_cpu, render_gpu, gaming
  nombre                 TEXT NOT NULL UNIQUE,
  software               TEXT NOT NULL,
  descripcion            TEXT NOT NULL,
  min_ram_gb             INTEGER NOT NULL CHECK (min_ram_gb > 0),
  min_almacenamiento_gb  INTEGER NOT NULL CHECK (min_almacenamiento_gb > 0),
  min_nucleos            INTEGER CHECK (min_nucleos > 0),
  necesita_gpu           INTEGER NOT NULL CHECK (necesita_gpu IN (0, 1)),
  min_vram_gb            INTEGER CHECK (min_vram_gb > 0)
);

-- Cada categoría usa solo algunas especificaciones; las demás quedan en NULL.
CREATE TABLE IF NOT EXISTS componente (
  id                    TEXT PRIMARY KEY,   -- identificador legible, p. ej. ryzen7-9700x
  id_categoria          TEXT NOT NULL REFERENCES categoria (id),
  id_marca              INTEGER NOT NULL REFERENCES marca (id),
  nombre                TEXT NOT NULL,
  precio                INTEGER NOT NULL CHECK (precio > 0),
  justificacion         TEXT NOT NULL,
  activo                INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),  -- se desactiva, nunca se borra
  socket                TEXT,               -- cpu, motherboard
  nucleos               INTEGER,            -- cpu
  hilos                 INTEGER,            -- cpu
  watts                 INTEGER,            -- cpu y gpu: consumo; psu: capacidad
  graficos_integrados   INTEGER CHECK (graficos_integrados IN (0, 1)),  -- cpu
  chipset               TEXT,               -- motherboard
  formato               TEXT,               -- motherboard
  tipo_memoria          TEXT,               -- motherboard, ram
  capacidad_gb          INTEGER,            -- ram, storage
  modulos               INTEGER,            -- ram
  velocidad_mts         INTEGER,            -- ram
  vram_gb               INTEGER,            -- gpu
  largo_mm              INTEGER,            -- gpu
  fuente_recomendada_w  INTEGER,            -- gpu
  interfaz              TEXT,               -- storage
  certificacion         TEXT,               -- psu
  max_largo_gpu_mm      INTEGER,            -- case
  max_altura_cooler_mm  INTEGER,            -- case
  altura_mm             INTEGER,            -- cooler
  UNIQUE (id_marca, nombre)
);
CREATE INDEX IF NOT EXISTS ix_componente_categoria ON componente (id_categoria);

-- Especificaciones con varios valores: formatos de placa que admite un gabinete y sockets que soporta un cooler.
CREATE TABLE IF NOT EXISTS componente_soporte (
  id_componente  TEXT NOT NULL REFERENCES componente (id),
  tipo           TEXT NOT NULL CHECK (tipo IN ('formato', 'socket')),
  valor          TEXT NOT NULL,
  PRIMARY KEY (id_componente, tipo, valor)
);

-- Usos para los que la curaduría recomienda cada componente.
CREATE TABLE IF NOT EXISTS componente_perfil (
  id_componente  TEXT NOT NULL REFERENCES componente (id),
  id_perfil      TEXT NOT NULL REFERENCES perfil_uso (id),
  PRIMARY KEY (id_componente, id_perfil)
);

CREATE TABLE IF NOT EXISTS equipo_base (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL UNIQUE,
  lema       TEXT NOT NULL,
  id_perfil  TEXT NOT NULL REFERENCES perfil_uso (id),
  orden      INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS equipo_base_componente (
  id_equipo      TEXT NOT NULL REFERENCES equipo_base (id),
  id_componente  TEXT NOT NULL REFERENCES componente (id),
  PRIMARY KEY (id_equipo, id_componente)
);

-- Usuarios -------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS usuario (
  id                    INTEGER PRIMARY KEY,
  correo                TEXT NOT NULL UNIQUE COLLATE NOCASE,
  contrasena_hash       TEXT NOT NULL,      -- scrypt con sal; nunca la contraseña
  nombre                TEXT NOT NULL,
  telefono              TEXT,
  ruc                   TEXT CHECK (ruc IS NULL OR (length(ruc) = 11 AND ruc NOT GLOB '*[^0-9]*')),
  razon_social          TEXT,
  rol                   TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'administrador')),
  acepta_privacidad_en  TEXT NOT NULL,
  creado_en             TEXT NOT NULL
);

-- La cookie de sesión lleva un token aleatorio; aquí solo se guarda su hash.
CREATE TABLE IF NOT EXISTS sesion (
  token_hash  TEXT PRIMARY KEY,
  id_usuario  INTEGER NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  expira_en   TEXT NOT NULL
);

-- Pedidos --------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pedido (
  id                TEXT PRIMARY KEY,       -- código de 8 caracteres que ve el cliente
  id_usuario        INTEGER REFERENCES usuario (id),  -- NULL si compró como invitado
  nombre_cliente    TEXT NOT NULL,
  correo_cliente    TEXT NOT NULL,
  tipo_comprobante  TEXT NOT NULL DEFAULT 'boleta' CHECK (tipo_comprobante IN ('boleta', 'factura')),
  ruc               TEXT,
  razon_social      TEXT,
  id_perfil         TEXT REFERENCES perfil_uso (id),
  total             INTEGER NOT NULL CHECK (total > 0),
  etapa             TEXT NOT NULL CHECK (etapa IN ('pagado', 'ensamblaje', 'control_calidad', 'enviado', 'entregado')),
  creado_en         TEXT NOT NULL,
  CHECK (tipo_comprobante = 'boleta' OR (ruc IS NOT NULL AND razon_social IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ix_pedido_usuario ON pedido (id_usuario);

-- Nombre, categoría y precio se copian al comprar: el pedido no cambia si después cambia el catálogo.
CREATE TABLE IF NOT EXISTS pedido_item (
  id_pedido      TEXT NOT NULL REFERENCES pedido (id) ON DELETE CASCADE,
  id_componente  TEXT NOT NULL REFERENCES componente (id),
  id_categoria   TEXT NOT NULL REFERENCES categoria (id),
  nombre         TEXT NOT NULL,
  precio         INTEGER NOT NULL CHECK (precio > 0),
  PRIMARY KEY (id_pedido, id_componente)
);

CREATE TABLE IF NOT EXISTS historial_etapa (
  id         INTEGER PRIMARY KEY,
  id_pedido  TEXT NOT NULL REFERENCES pedido (id) ON DELETE CASCADE,
  etapa      TEXT NOT NULL CHECK (etapa IN ('pagado', 'ensamblaje', 'control_calidad', 'enviado', 'entregado')),
  fecha      TEXT NOT NULL,
  UNIQUE (id_pedido, etapa)
);
