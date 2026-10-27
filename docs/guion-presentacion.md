# Guion de la presentación — Kamay

Deck: [Kamay — Arquitectura y asesor IA](https://claude.ai/artifact/3fyFVwHgLUTmjmtahycvkr)

**Duración: 5 minutos.** El hilo conductor es el asesor con IA: seguimos un mensaje del cliente desde el chat hasta el pedido, y la arquitectura, el motor de reglas y el frontend se explican cuando el mensaje pasa por ellos.

Cada pieza sigue el mismo orden: **nombre técnico → qué es → paralelo**. El paralelo es un restaurante: el **salón** es la SPA, el **mesero** es el proxy, la **cocina** es la API, el **proveedor** es OpenAI y el **asesor de sala** es el modelo de IA.

| # | Diapositiva | Tiempo |
|---|---|---|
| 1 | Portada | 0:15 |
| 2 | Qué hace el asesor IA | 0:40 |
| 3 | Arquitectura: el recorrido de un mensaje | 1:10 |
| 4 | Lo que consulta el asesor: catálogo y motor de reglas | 1:10 |
| 5 | De la conversación al pedido | 0:45 |
| 6 | Cómo lo probamos | 0:40 |
| 7 | Cierre y preguntas | 0:20 |

---

### 1 · Portada (0:15)

> Somos Benjamin Illescas, Ayrton Vilca y Diego Medina, y presentamos Kamay: una tienda de computadoras armadas a medida. Les vamos a mostrar cómo funciona su asesor con inteligencia artificial y, a través de él, toda la arquitectura del sistema.

### 2 · Qué hace el asesor IA (0:40)

> Elegir piezas de PC es difícil. En Kamay, el cliente solo cuenta qué hace y cuánto quiere gastar, y el asesor le propone un equipo completo y compatible.
>
> **El asesor es un LLM, un modelo de lenguaje grande, con *function calling*:** además de escribir texto, puede pedirle a nuestro servidor que ejecute funciones. La idea central: **el modelo conversa, pero quien decide es el servidor.** Productos, precios y compatibilidad salen siempre de nuestro código.
>
> Es **el asesor de sala** de un restaurante: conversa y recomienda, pero no inventa platos ni pone precios. Eso lo decide la cocina.

### 3 · Arquitectura: el recorrido de un mensaje (1:10)

> Sigamos un mensaje: *"Quiero jugar a 1440p, tengo 7500 soles"*.
>
> **Sale de una SPA, una aplicación de una sola página en Angular 22**, que corre en el navegador y muestra las pantallas. Es **el salón**, donde se toma el pedido.
>
> **Un proxy lo reenvía a la API:** todo lo que empieza con `/api` va al servidor. Es **el mesero**.
>
> **Llega a una API REST en Express 5**, el servidor donde vive la lógica del negocio: catálogo, reglas, pedidos y asesor. Es **la cocina**. Todo está escrito en TypeScript, en los dos lados.
>
> **La API llama a OpenAI, un servicio externo,** y empieza un **ciclo de herramientas**: el modelo pide un dato, el servidor se lo da, y así hasta tener la respuesta, con un máximo de 8 rondas. OpenAI es **el proveedor**: aporta algo puntual, pero las reglas de la casa no cambian.

### 4 · Lo que consulta el asesor: catálogo y motor de reglas (1:10)

> El modelo tiene **solo tres herramientas**, que son las mismas funciones que usa la web:
> - **`search_catalog`**: los 34 productos reales, con precio y especificaciones.
> - **`get_builds`**: los 4 equipos base, uno por perfil (diseño, render por CPU, render por GPU y gaming).
> - **`validate_configuration`**: el motor de compatibilidad. El modelo está obligado a usarlo antes de proponer.
>
> **El motor es la capa de dominio: el código que concentra las reglas del negocio.** Revisa **8 reglas**: socket, tipo de memoria, formato de placa, espacio para la GPU, cooler, salida de video, potencia de la fuente y adecuación al uso. Funciona como **una revisión técnica con semáforo**: verde cumple, ámbar advierte, rojo bloquea. Un equipo con algún rojo no se puede pedir.
>
> Si el modelo inventa un producto, la herramienta le devuelve un error y tiene que corregirse. Es como si el asesor de sala solo tuviera **tres ventanillas hacia la cocina**: no hay otra forma de pedir nada.

### 5 · De la conversación al pedido (0:45)

> La respuesta llega al chat con un botón: **"Abrir en el configurador"**. Ese botón no carga lo que el modelo escribió, sino **lo último que validó el servidor**.
>
> **En el configurador, el estado se maneja con signals de Angular:** valores que, al cambiar, actualizan todo lo que depende de ellos. Si el cliente cambia una pieza, la validación se repite sola, como **una fórmula de hoja de cálculo**. Y al crear el pedido, el servidor vuelve a validar.
>
> Esto es un **MVP, un producto mínimo viable**: el pago y el ensamblaje son simulados y los pedidos se guardan en un archivo. La persistencia está aislada en una sola clase, así que conectar la base de datos en la siguiente fase no afecta al resto.

### 6 · Cómo lo probamos (0:40)

> Probamos en dos niveles:
> - **14 tests automatizados con una IA simulada**, que cubren el motor, la API, los pedidos y el ciclo de herramientas sin gastar créditos.
> - **Un test con el modelo real**: una conversación que comprueba que pida los datos que faltan, proponga un equipo válido dentro del presupuesto y rechace una pieza incompatible.
>
> El modelo real mostró fallos que la simulación no veía: por ejemplo, olvidaba los productos de su propia propuesta. Ahora se los reenviamos, y cambiar una pieza bajó de 8 rondas a 2.
>
> El siguiente paso es una **rúbrica con cinco casos** para medir también la calidad de las respuestas.

### 7 · Cierre y preguntas (0:20)

> En resumen: **el cliente conversa con la IA, la IA consulta al servidor, y el servidor decide con reglas claras.** El salón atiende, el asesor recomienda y la cocina decide. Gracias; quedamos atentos a sus preguntas.

---

## Si preguntan

- **¿Y si el cliente intenta manipular a la IA?** El modelo trata los mensajes como datos, no como órdenes. Y aunque lo lograra, no puede saltarse el validador: los precios y la compatibilidad salen del servidor.
- **¿Qué librerías usaron?** Angular 22 (signals, `httpResource` y Signal Forms de serie), Express 5, TypeScript en ambos lados, `node:test` para las pruebas, y la Responses API de OpenAI con `fetch`, sin SDK.
- **¿Qué base de datos usan?** SQLite con `node:sqlite`, incluido en Node: no hay servidor que instalar y la base es un archivo. Cada parte del modelo tiene su repositorio (`CatalogRepository`, `OrderRepository`), que es la única clase que escribe SQL.
- **¿Cuánto cuesta?** Unos centavos de dólar por mensaje con gpt-5-mini. Confirmarlo en el panel de uso de OpenAI antes de dar una cifra.

## Antes de presentar

- [ ] Actualizar el deck a estas 7 diapositivas.
- [ ] Poner los nombres del equipo en la portada del deck.
- [ ] Confirmar el costo por mensaje en platform.openai.com → Usage.
- [ ] El repo `github.com/BenjaIDLC/kamay` es privado: hacerlo público o no mostrar el enlace.
- [ ] Ensayar con cronómetro: unos 5 minutos.
