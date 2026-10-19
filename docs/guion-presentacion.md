# Guion de la presentación — Kamay

Deck: [Kamay — Arquitectura y asesor IA](https://claude.ai/artifact/3fyFVwHgLUTmjmtahycvkr)

Cada pieza se explica en el mismo orden: **nombre técnico → qué es → paralelo**. El paralelo es un restaurante: el **salón** es la SPA, el **mesero** es el proxy, la **cocina** es la API y el **proveedor** es OpenAI. En la parte de IA se suma el **asesor de sala**, que es el modelo.

Duración estimada: unos 7–8 minutos.

---

## Portada

> Presentamos Kamay, una tienda de computadoras armadas a medida. Hoy nos enfocamos en tres cosas: la arquitectura que elegimos, las librerías que usamos y cómo diseñamos el asesor con inteligencia artificial.

---

## Arquitectura

### 2 · Arquitectura: frontend, API y OpenAI

> Kamay se divide en dos piezas que conversan entre sí.
>
> **La primera es una SPA, una aplicación de una sola página, hecha en Angular.** Se carga una vez en el navegador y desde ahí cambia de pantalla sin recargar. Muestra el catálogo, recoge lo que el cliente elige y guarda su selección. Es **el salón del restaurante**: donde el cliente ve el menú y hace su pedido.
>
> **En medio está el proxy de `/api`.** En desarrollo, todo lo que la aplicación pide a una dirección que empieza con `/api` se reenvía a nuestro servidor. Es **el mesero**: lleva el pedido del salón a la cocina y trae la respuesta.
>
> **La segunda pieza es una API REST en Express.** Es el servidor, y ahí vive la lógica del negocio: el catálogo, el motor de compatibilidad, los pedidos y el asesor. Es **la cocina**. Aquí está la decisión más importante del diseño: **el cliente nunca decide**. El salón no pone precios ni dice si un plato se puede preparar; eso lo decide la cocina. Del mismo modo, el precio y la compatibilidad siempre los calcula el servidor, aunque alguien manipule el navegador.
>
> **Por último, OpenAI es un servicio externo** al que solo llama el asesor con IA. Es **el proveedor**: la cocina le pide algo puntual, pero las reglas de la casa no cambian.
>
> Usamos **TypeScript** en ambos lados, así que los dos hablan el mismo idioma.
>
> Por último, **esto es un MVP, un producto mínimo viable**: incluimos solo lo necesario para demostrar la idea. Por eso **todavía no hay base de datos**. Los pedidos se guardan en un archivo JSON y el catálogo vive en el código. Pero la persistencia está **aislada en una sola clase**, el `OrderStore`, así que integrar una base de datos significa cambiar esa clase sin tocar la API ni el frontend. Es **la despensa de la cocina**: hoy es un estante, mañana será un almacén, y los cocineros siguen pidiendo los ingredientes de la misma forma.

### 3 · Motor de compatibilidad: las 8 reglas

> **Esta es la capa de dominio, nuestro motor de reglas de compatibilidad.** Es la parte del código que concentra las reglas del negocio, separadas de las pantallas y de la API. Recibe una lista de piezas y la evalúa con ocho reglas: socket, memoria, formato, espacio para la GPU, cooler, salida de video, potencia y adecuación al uso.
>
> Funciona como **una revisión técnica vehicular con semáforo**. Cada regla da un resultado: **verde** si cumple, **ámbar** si es una advertencia, **rojo** si bloquea, y **gris** si falta una pieza o la regla no aplica. Las siete primeras son físicas o eléctricas y pueden bloquear. La de uso solo aconseja: te dice "para render te convendría más RAM", pero no te impide comprar.
>
> Con esos resultados, el equipo queda **incompleto, no válido o válido**, y solo un equipo válido se puede pedir: **sin el certificado, el auto no sale a circular**.
>
> Además, agregar un producto nuevo es añadir una fila de datos al catálogo, sin tocar las reglas. Un test comprueba que no le falte ningún dato.

### 4 · Frontend: manejo del estado con signals

> **En el frontend manejamos el estado con signals, el sistema reactivo de Angular 22.** Un signal guarda un valor, y todo lo que depende de él se actualiza solo cuando cambia. Así no necesitamos una librería de estado aparte.
>
> Funciona como **una hoja de cálculo**. La selección de piezas es una celda. La validación es una fórmula que depende de esa celda: con `httpResource`, cada vez que el cliente cambia una pieza, la petición al servidor se dispara sola, igual que una fórmula se recalcula al editar la celda.
>
> Hay dos detalles en el código de la diapositiva:
> - **`linkedSignal`** conserva el último resultado mientras llega el nuevo, para que la pantalla no parpadee ni quede vacía. Es como **ver el valor anterior mientras la hoja recalcula**.
> - **`upToDate`** comprueba que la validación corresponde a la selección actual. Así nadie puede **pagar con un resultado viejo**, que sería como usar una cifra de antes de corregir los datos.
>
> El checkout usa **Signal Forms** con el mismo enfoque. Y en accesibilidad cumplimos **WCAG AA**: foco visible, buen contraste y un carrusel que se puede pausar.

---

## Librerías

### 5 · Librerías que usamos

> Usamos **pocas dependencias, y cada una por un motivo concreto**.
>
> - **Angular 22** es el framework del frontend. Desde esta versión trae de serie lo que necesitábamos: signals, `httpResource` y Signal Forms.
> - **Express 5** es el servidor de la API: mínimo, muy conocido, y ahora captura solo los errores de las funciones asíncronas.
> - **TypeScript** se usa en los dos lados, así que un estado como "bloqueo" significa lo mismo en el navegador y en el servidor.
> - **node:test** es el ejecutor de pruebas que ya viene con Node: 14 tests sin instalar nada.
> - Para la IA **no usamos ningún SDK**: llamamos a la **Responses API de OpenAI** directamente con `fetch`.
>
> Es como **equipar una cocina con pocos utensilios, pero buenos**: cuantas menos herramientas, menos cosas que mantener y que se puedan romper.

**Transición:** "Ya vimos que el servidor decide. Ahora veamos qué pasa cuando metemos una IA en esa conversación."

---

## Asesor con IA

### 6 · Asesor IA: qué hace el modelo y qué hace el servidor

> Ahora, el asesor. **Usamos un modelo de lenguaje grande, un LLM**, con *function calling*: el modelo no solo escribe texto, también puede pedir que se ejecuten funciones de nuestro servidor.
>
> Toda la idea cabe en una frase: **la IA conversa y el motor decide**. El modelo es muy bueno entendiendo lo que la persona necesita, pero no confiamos en él para inventar productos, precios ni compatibilidad.
>
> En el restaurante, la IA es **el asesor de sala**: conversa con el cliente, entiende qué quiere y le recomienda. Pero no inventa platos ni pone precios: todo lo consulta con **la cocina**, que sigue siendo nuestro servidor.

### 7 · Asesor IA: cómo se procesa un mensaje

> **Un mensaje sigue un ciclo de llamadas a herramientas, un *tool loop*.**
> 1. El chat envía la conversación a `/api/advice`.
> 2. El servidor le añade **contexto**: lo que el cliente tiene abierto en el configurador y la última propuesta del asesor.
> 3. Empieza el ciclo: el modelo pide una herramienta, el servidor la ejecuta y le devuelve el resultado. Esto se repite hasta que el modelo responde con texto, con un máximo de **8 rondas**.
>
> El punto clave: **la propuesta que ve el cliente no se saca del texto del modelo**, sino del último resultado del validador. Aunque el modelo escribiera algo incorrecto, el botón "Abrir en el configurador" carga lo que el servidor comprobó.
>
> Es **el asesor de sala yendo varias veces a la cocina**: pregunta qué hay, pide que revisen una combinación, y solo vuelve a la mesa cuando tiene la respuesta. Y lo que llega al cliente es **lo que sale de la cocina**, no lo que el asesor recuerde.

### 8 · Asesor IA: sus tres herramientas

> **El modelo tiene exactamente tres herramientas, definidas con esquemas estrictos de JSON**:
> - **`search_catalog`** consulta productos, precios y especificaciones, e indica para qué usos se sugiere cada uno.
> - **`get_builds`** devuelve los 4 equipos base ya validados, que son el punto de partida.
> - **`validate_configuration`** ejecuta las 8 reglas del motor. Es obligatoria antes de presentar una propuesta.
>
> Las tres llaman a **las mismas funciones que usa la web**, con la misma validación de entrada. Si el modelo inventa un producto, recibe un error como dato y lo corrige: una pieza inventada nunca llega al cliente.
>
> Son **las únicas tres ventanillas** entre el asesor y la cocina: preguntar qué hay, pedir el menú del día y pedir que revisen el pedido. No hay otra puerta.

### 9 · Asesor IA: cómo lo probamos

> Probamos en **dos niveles**.
> - **Tests automatizados con un proveedor simulado**: 14 tests cubren el motor, la API, los pedidos y el ciclo de herramientas, sin gastar créditos.
> - **Un test de integración con el modelo real**: una conversación de tres mensajes que comprueba que pida los datos que faltan, proponga un equipo válido dentro del presupuesto y rechace una placa incompatible. Pasó en las tres corridas finales.
>
> El costo es de unos centavos por mensaje. El siguiente paso es una **rúbrica con cinco casos**: datos completos, datos faltantes, presupuesto insuficiente, cambio incompatible y una petición fuera de alcance. Así medimos no solo que funcione, sino la calidad de lo que responde.
>
> Los tests son **la inspección de la cocina**: comprueban que todo funcione. La rúbrica será **la cata**: evaluar si lo que se sirve, además de correcto, es bueno.

---

## Cierre

### 10 · Cierre y preguntas

> Para resumir: **una arquitectura de dos piezas, un servidor que decide precio y compatibilidad, y una IA que conversa con esas mismas reglas.** El salón atiende, el asesor recomienda y la cocina decide. Gracias; quedamos atentos a sus preguntas.

---

## Antes de presentar

- [ ] Poner los nombres del equipo en la portada (hoy dice `[Integrantes del equipo]`).
- [ ] Confirmar el costo por mensaje en platform.openai.com → Usage. El deck dice "≈ $0,02", que es una estimación; si no se confirma, decir "unos centavos".
- [ ] El repo `github.com/BenjaIDLC/kamay` del cierre es privado: hacerlo público o quitar el enlace.
