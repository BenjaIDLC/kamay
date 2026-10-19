# OE2 — contrato revisado de 15 comprobaciones

Estado: motor, API y herramientas del asistente implementados con datos sintéticos y pruebas automatizadas. Frontend, persistencia y pedidos pendientes. Recoge la propuesta del usuario con las correcciones acordadas sobre estados globales, GPU opcional, potencia, BIOS y guía por perfil. Sustituye la numeración anterior de 12 reglas de este documento.

## Alcance

- Ocho categorías de catálogo, 10–15 productos por categoría y cuatro configuraciones base.
- Una CPU, una placa, un kit RAM, una fuente, un gabinete, un cooler por aire y un SSD M.2 NVMe. GPU dedicada opcional.
- Un kit puede contener varios módulos. No se incluyen AIO, refrigeración personalizada, risers, varias GPU, mezclas de kits ni múltiples unidades.
- Un producto fuera del alcance se informa como no evaluable por este motor; no se presenta como técnicamente incompatible por ese motivo.
- Las bases orientan por necesidad y presupuesto; el configurador manual funciona sin IA.
- La elección de GPU tiene tres situaciones: pendiente, GPU seleccionada o decisión explícita de continuar sin GPU dedicada. Un valor ausente no equivale a la última opción.

Las cantidades describen el alcance objetivo, no lo que existe hoy. Los [cuatro perfiles y criterios de guía](./oe2-perfiles.md) están definidos; quedan pendientes los productos concretos y sus fuentes.

## Contrato de cada regla

Cada ejecución devuelve exactamente estos campos; ejemplo de una comprobación que cumple:

```json
{
  "id": "R07",
  "estado": "cumple",
  "severidad": null,
  "mensaje": "La GPU mide 304 mm; el gabinete admite 360 mm y se reserva una holgura de 10 mm.",
  "componentes": ["gpu", "case"]
}
```

- `estado`: `cumple`, `no_cumple`, `sin_datos` o `no_aplica`.
- `severidad`: `bloqueo`, `advertencia`, `sugerencia` o `null`.
- `componentes`: claves de la API: `cpu`, `motherboard`, `ram`, `gpu`, `storage`, `case`, `psu`, `cooler`. La configuración contiene los identificadores de productos; una categoría puede aparecer aunque aún esté pendiente de elección.
- `cumple`: se satisface la comprobación; severidad nula.
- `no_cumple`: se conoce un incumplimiento; la severidad indica su efecto.
- `sin_datos`: están presentes las elecciones necesarias, pero falta información para concluir. El mensaje identifica el dato pendiente, sea del catálogo o del contexto confirmado de montaje/BIOS.
- `no_aplica`: todavía no se eligieron los componentes necesarios, o la regla no corresponde a una opción explícita, como GPU dedicada omitida. Severidad nula y mensaje que distingue ambos motivos.

Una elección pendiente activa además la incompletitud global. Las reglas no pueden devolver `no_aplica` para disimular un campo desconocido de un componente ya elegido.

El registro de reglas guarda las dependencias y si sus datos son obligatorios para validar esa configuración. Esa obligatoriedad es metadato del motor, no un campo adicional en cada resultado. Para una regla obligatoria, `sin_datos` lleva severidad bloqueo; para una orientación no obligatoria, advertencia. Un fallo conocido puede reportarse aunque otros campos estén ausentes; nunca se declara cumple sin los datos necesarios.

## Estado global y paso a pedido

Aplicar este orden, manteniendo visibles todos los resultados aunque haya varios tipos de problemas:

| Prioridad | Estado global | Condición |
| --- | --- | --- |
| 1 | Incompleta | Falta una categoría obligatoria o decidir si habrá GPU dedicada. |
| 2 | No válida | Está completa y existe al menos un `no_cumple` con severidad bloqueo. |
| 3 | Pendiente de datos | Está completa, sin bloqueos conocidos, y alguna regla obligatoria devuelve `sin_datos`. |
| 4 | Validada | Está completa y no hay bloqueos conocidos ni datos obligatorios pendientes. |

Las advertencias y sugerencias se muestran como observaciones de una configuración validada; no constituyen otro estado global excluyente. Un `sin_datos` de guía no obligatoria también permanece visible, sin afirmar que la guía esté comprobada.

Solo el estado Validada permitirá crear el pedido. La revalidación al guardar y crear pedidos se implementará con OE3; aún no hay persistencia ni endpoints de pedidos. El endpoint actual calcula el estado e ignora cualquier precio o aprobación enviados por el cliente.

Con GPU omitida explícitamente, R07 no aplica; R10 y R11 siguen comprobando alimentación de placa y CPU y omiten únicamente la parte de GPU. R12 se vuelve obligatoria.

## Las quince comprobaciones

R01–R12 cubren estructura y funcionamiento básico dentro del alcance. R13–R15 añaden BIOS, velocidad de memoria y guía; no se llaman universalmente blandas: R13 puede bloquear y R11 puede advertir.

| ID | Comprobación | Datos y criterio | Resultado ante problema |
| --- | --- | --- | --- |
| R01 | Socket | Socket de CPU y placa normalizados; deben coincidir. | Diferencia conocida: bloqueo. |
| R02 | Chipset y soporte de plataforma | Chipset de placa, chipsets admitidos por CPU y evidencia curada de soporte del modelo/revisión dentro del catálogo. La igualdad de familia no acredita por sí sola cada CPU. | Plataforma expresamente no admitida: bloqueo. Evidencia obligatoria insuficiente: sin datos. |
| R03 | Tipo de memoria | Tipo DDR y formato/búfer del kit; tipos admitidos por placa y CPU. | Tipo o formato incompatible: bloqueo. |
| R04 | Módulos y capacidad de RAM | Número de módulos, GB por módulo, slots de placa, capacidades admitidas por CPU/placa y población documentada. | Exceso de módulos o capacidad, o población no admitida: bloqueo. |
| R05 | SSD NVMe | Una unidad; protocolo, clave y tamaño del SSD; socket M.2 activo que los admite, con restricciones por CPU y recursos compartidos. | Sin conexión adecuada: bloqueo. No basta contar slots M.2. |
| R06 | Placa en gabinete | Factor de forma y dimensiones de placa; factores y límites de gabinete. | Montaje no admitido: bloqueo. |
| R07 | Espacio para GPU | Longitud del SKU frente al máximo efectivo del gabinete menos la holgura del proyecto; comprobar además las restricciones conocidas de grosor, altura y cableado en la disposición curada. | Exceso: bloqueo. Si una restricción necesaria carece de datos: sin datos. Sin GPU dedicada: no aplica. |
| R08 | Espacio del cooler | Altura instalada frente al máximo efectivo del gabinete menos la holgura; condiciones de RAM/placa y ajustes de ventilador documentados. | No cabe: bloqueo. La holgura no demuestra capacidad térmica. |
| R09 | Socket y montaje del cooler | Socket del CPU dentro de los admitidos por la revisión del cooler; kit necesario confirmado como incluido/disponible. | Montaje o kit incompatible/ausente: bloqueo. Disponibilidad no confirmada: sin datos. |
| R10 | Conectores de alimentación | ATX/EPS obligatorios de placa/CPU y conexiones de GPU, si existe; cables compatibles con el modelo de fuente, conectores y restricciones por cable. | Falta de alimentación o asignación no permitida: bloqueo. Contar conectores no basta cuando se requieren cables independientes. |
| R11 | Potencia | Consumo estimado documentado, capacidad continua de fuente y requisitos aplicables del fabricante; política de margen descrita abajo. | No cubre el mínimo base: bloqueo. Cubre ese mínimo, pero no el margen del proyecto: advertencia. |
| R12 | Salida de video sin GPU dedicada | Decisión explícita de omitir GPU, gráficos integrados del CPU y salida funcional de la placa para ese CPU. | Sin una ruta de video admitida: bloqueo. Con GPU dedicada: no aplica. Con elección pendiente: no aplica y configuración incompleta. |
| R13 | BIOS | Generación de CPU, alertas curadas de actualización, soporte del modelo y revisión, versión necesaria y evidencia de BIOS instalada o soporte desde versión inicial. | BIOS confirmada insuficiente: bloqueo. Versión necesaria no confirmada: sin datos obligatorio. No se transforma una actualización pendiente en compatibilidad aprobada. |
| R14 | Velocidad de RAM | Velocidad anunciada y perfiles del kit; modos de funcionamiento admitidos por CPU y placa según población/BIOS. | Perfil anunciado fuera de condiciones acreditadas: advertencia. No se garantiza una velocidad mediante una única comparación con el máximo de la placa. |
| R15 | Adecuación al perfil curado | Perfil seleccionado, necesidad declarada, criterios explícitos con fuente/metodología y atributos de las piezas. | Incumplimiento de una recomendación: sugerencia o advertencia según el criterio. Sin criterio o dato suficiente: sin datos de guía; nunca recomendar por defecto. |

R15 sustituye la diferencia arbitraria de niveles CPU/GPU. No se calcula un porcentaje de cuello de botella ni un ranking universal de rendimiento. Sus criterios y precedencia de resultados están definidos en [oe2-perfiles.md](./oe2-perfiles.md).

R01–R11 y R13 necesitan datos obligatorios cuando corresponden a las elecciones realizadas. R12 es obligatoria en la ruta sin GPU dedicada. R14 y R15 son orientación no bloqueante: que la configuración sea validada no implica que se hayan acreditado su rendimiento o adecuación.

## Catálogo y contexto de configuración

Se conservan los campos propuestos por el usuario; se añaden los que necesitan las correcciones. Que un campo exista no significa que por sí solo baste para validar una combinación.

| Categoría | Campos base |
| --- | --- |
| Todas | Identificador, marca, modelo, SKU, revisión, categoría, precio, moneda, disponibilidad, justificación técnica, fuentes y fecha de consulta. |
| CPU | Socket, TDP, límite de potencia documentado para el modo elegido, chipsets compatibles, tipos y capacidad de memoria admitidos, generación, gráficos integrados y exigencia térmica curada. |
| Placa | Socket, chipset, revisión, factor de forma/dimensiones, tipos y slots RAM, capacidad y modos de memoria, sockets M.2 y restricciones, puertos SATA, ranuras/generaciones PCIe, salidas de video, alimentación obligatoria y lista de generaciones que requieren revisar actualización de BIOS. |
| RAM | Tipo, formato y búfer, velocidad/perfiles, voltaje, cantidad de módulos, GB por módulo, consumo documentado o estimado explícito y altura. |
| GPU | SKU del ensamblador, interfaz, longitud, altura, grosor/slots, consumo, conexiones y condiciones de fuente recomendada. |
| Fuente | Potencia continua, certificación, formato/dimensiones, inventario de cables y conectores compatibles y sus restricciones. |
| Gabinete | Formatos y límites de placa, espacio efectivo de GPU y cableado, altura de cooler, formatos y espacio de fuente, bahías y disposición de montaje. |
| Cooler | Sockets y kits admitidos, altura instalada, holguras/interferencias, consumo de ventiladores, TDP anunciado si existe y perfil térmico curado. |

Fuentes y condiciones de BIOS y soporte se mantienen para los modelos del catálogo. No hace falta copiar una QVL completa; tampoco basta asumir soporte porque una generación no aparece en `requiere_bios_update`. La ausencia en una lista parcial es falta de evidencia.

`exigencia_termica` y `perfil_termico` pueden usar básica/media/alta como clasificación editorial, pero su metodología sigue pendiente. Se prevé utilizarlos en la guía R15 cuando existan criterios justificados. No certifican temperaturas y no sustituyen R09.

La configuración conserva elecciones, ranuras asignadas, disposición física, accesorios confirmados y contexto de BIOS cuando se necesita. La intención de actualizar BIOS no demuestra que la actualización ya se realizó.

Unidades explícitas: mm, W, GB y MT/s. Dato ausente, cero y lista vacía confirmada son valores distintos. Validar entradas, identificadores, cantidades, duplicados, categorías y límites numéricos antes de ejecutar las reglas.

## Políticas del proyecto

Se centralizan en un único archivo de configuración del motor al implementarlo:

```text
MARGEN_FUENTE = 1.25
HOLGURA_FISICA_MM = 10
CONSUMO_BASE_SISTEMA = 50
```

Son políticas de la versión inicial, sujetas a justificar su cobertura en el catálogo. No se presentan como estándares de fabricantes.

### R11: estimación y severidades

- Estimación = límite documentado de CPU en el modo elegido + consumo de GPU, o cero solo si se omitió explícitamente + consumo de módulos RAM + consumo del SSD + reserva de sistema.
- La fórmula sugerida de 5 W por módulo puede emplearse solo como estimación identificada y justificada para los kits elegidos, no como dato del fabricante. Cuando exista consumo documentado aplicable, usarlo.
- La reserva de 50 W debe cubrir de forma justificada placa y ventiladores incluidos; evitar omitir consumos fuera de esa reserva o contarlos dos veces.
- Mínimo base = mayor entre la estimación y cualquier mínimo obligatorio del fabricante aplicable a la configuración.
- Objetivo con margen = mayor entre el mínimo base y la estimación multiplicada por 1,25, redondeada hacia arriba.
- Fuente menor que mínimo base: `no_cumple/bloqueo`.
- Fuente que alcanza mínimo base pero no objetivo con margen: `no_cumple/advertencia`.
- Fuente que alcanza el objetivo: `cumple/null`.
- Un dato obligatorio ausente, incluidas condiciones necesarias para interpretar un requisito: `sin_datos/bloqueo`.

No usar automáticamente TDP como límite máximo del CPU. No certificamos transitorios, distribución por rieles o estabilidad térmica. Un equipo que cumple con advertencias puede pasar a pedido, conservando las observaciones.

### Holgura física

Los 10 mm se aplican a R07 y R08 como margen adicional del proyecto sobre límites efectivos documentados. No reemplazan el espacio requerido por conectores, interferencias o condiciones de montaje. Una elección que incumpla este margen se identifica como incumplimiento de la política, no necesariamente como imposibilidad física absoluta.

## Guía y presentación

- Mostrar primero las opciones admitidas y mantener visibles las incompatibles con su razón. El motivo debe ser accesible sin depender de un tooltip o del hover de un botón deshabilitado.
- Permitir revisar las piezas relacionadas para un cambio de plataforma; la interfaz no debe encerrar al usuario en una selección.
- Mostrar las quince comprobaciones y sus estados en un panel accesible durante el armado.
- La etiqueta Recomendado necesita criterios definidos y explicables para el caso de uso. No se deduce de que una pieza sea físicamente compatible.
- Hay cuatro bases sintéticas, una por perfil definido, con precio calculado y presupuesto ingresado por el usuario. Faltan productos reales curados.
- El asistente usa los mismos datos y resultados y no puede eludir el bloqueo de pedidos.

## Implementación actual

Un módulo de backend registra las quince reglas en un arreglo y el motor lo recorre. Cada regla recibe la configuración y el catálogo normalizados y devuelve el contrato común. La vista presenta el resultado.

R13 puede requerir soporte explícito de un modelo de CPU y R07/R08 evidencia de interferencias. Estas excepciones documentadas no implican escribir manualmente todas las parejas del catálogo.

Los productos nuevos se incorporan mediante datos mientras sus requisitos estén representados por las reglas existentes. Una tecnología con condiciones nuevas puede requerir modificar reglas. No se promete que cualquier socket futuro solo necesite añadir una fila.

`backend/compatibility.mts` registra las 15 reglas; `configuration.mts` comparte validación de entradas entre API e IA. `profiles.mts`, `builds.mts` y `policies.mts` contienen perfiles, bases y constantes. Hay 16 productos sintéticos y cuatro bases. El frontend aún es la plantilla inicial.

La disposición inicial está curada en los datos: sockets M.2 activos por CPU, espacio de cooler/placa y cables disponibles por SKU/revisión de fuente. No hay un editor de montaje. R10 añade formato y longitud de fuente; BIOS utiliza una secuencia explícita de versiones. Falta evidencia real antes de afirmar que estas disposiciones representan equipos comerciales.

## Cobertura y pruebas pendientes

`npm run api:test` verifica las reglas, cuatro bases, estados, presupuesto, contrato HTTP y herramientas del asistente con proveedor simulado. Las pruebas de crear/guardar pedidos de esta lista quedan para OE3.

- Por regla: cumple, no cumple, sin datos y no aplica cuando corresponda.
- Configuración completa, incompleta, con un bloqueo conocido, con datos obligatorios faltantes y con observaciones no bloqueantes.
- GPU pendiente, GPU elegida y omisión explícita; R10/R11 nunca omiten alimentación de CPU/placa.
- Límites exactos: fuente igual a mínimo base y a objetivo; dimensiones justo en el límite de política; RAM justo en capacidad/slots.
- BIOS necesaria desconocida, versión insuficiente y soporte confirmado.
- Sustituir varias piezas y comprobar que el resultado no depende del orden de selección.
- Crear un pedido con advertencias permitidas; rechazar bloqueos, datos obligatorios pendientes o incompletitud.
- Intento del cliente o del asistente de presentar como validada una selección distinta a la evaluada.
- Falta de criterios R15: mostrar guía sin datos, sin inventar una recomendación.

## Perfiles definidos y siguiente paso

Las tres familias comerciales contienen cuatro perfiles: diseño gráfico con Photoshop, render por CPU con Blender, render por GPU con Blender y gaming con Fortnite. Una base por perfil, según [oe2-perfiles.md](./oe2-perfiles.md).

R15 usa umbrales explícitos y soporte de software documentado. Las políticas propias se distinguen de los requisitos publicados. Las etiquetas térmicas no intervienen en la guía inicial; no se infieren mínimos universales ni FPS a partir del nombre del perfil.

El motor y las cuatro bases ya están disponibles por API. Sigue definir el diseño y construir el configurador visual; completar progresivamente el catálogo y su evidencia. Los productos reales necesitan fuentes antes de presentarse como curados.

## Referencias técnicas para la curaduría

- [ASUS: soporte de CPU y BIOS](https://www.asus.com/us/support/faq/1045511/).
- [MSI: ejemplo de condiciones de memoria, PCIe y almacenamiento](https://www.msi.com/Motherboard/B650-GAMING-PLUS-WIFI/Specification).
- [Corsair: ejemplo de límites físicos de gabinete](https://www.corsair.com/uk/en/p/pc-cases/cc-9011199-ww/4000d-tempered-glass-mid-tower-atx-case-white-cc-9011199-ww).
- [Noctua: límites de las comparaciones térmicas por TDP](https://www.noctua.at/en/expertise/guides/noctua-standardised-performance-rating).
- [Intel: TDP y consumo durante turbo](https://www.intel.com/content/www/us/en/support/articles/000055611/processors.html?wapkw=tdp).
- [NVIDIA: potencia y condiciones de una configuración de referencia](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/).
