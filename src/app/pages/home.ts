import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="container hero__inner">
        <h1>Tu próxima gran idea necesita el equipo correcto.</h1>
        <p class="hero__lead">Computadoras armadas a medida para diseño, render 3D y gaming. Elegimos cada pieza para lo que realmente haces y validamos que todo funcione junto.</p>
        <div class="actions">
          <a routerLink="/asesor" class="btn btn--primary">Encuentra tu equipo con IA</a>
          <a routerLink="/equipos" class="btn btn--light">Explora equipos</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2>No vendemos solo componentes.</h2>
        <p class="lead">Diseñamos el equipo alrededor de tu trabajo. Kamay une tres cosas que una tienda normal no te da:</p>
        <ol class="pillars">
          <li>
            <h3>Asesoría según tu uso</h3>
            <p>Nuestro asesor con IA te pregunta qué programas usas y cuánto quieres invertir, y te propone un equipo del catálogo.</p>
          </li>
          <li>
            <h3>Compatibilidad validada</h3>
            <p>Cada cambio se comprueba al momento: socket, memoria, espacio en el gabinete, potencia de la fuente y salida de video.</p>
          </li>
          <li>
            <h3>Armado y control de calidad</h3>
            <p>Seguimos tu pedido desde la configuración hasta el ensamblaje, las pruebas y la entrega.</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="section section--surface">
      <div class="container">
        <h2>Un punto de partida para cada mundo.</h2>
        <ul class="worlds">
          @for (world of worlds; track world.title) {
            <li class="world world--{{ world.tone }}">
              <h3>{{ world.title }}</h3>
              <p>{{ world.text }}</p>
              <a routerLink="/equipos" class="btn btn--light btn--small">Ver equipos<span class="visually-hidden"> de {{ world.title }}</span></a>
            </li>
          }
        </ul>
      </div>
    </section>

    <section class="section">
      <div class="container cta">
        <div>
          <h2>Tu uso es único. Tu equipo también debería serlo.</h2>
          <p class="lead">Cuéntale al asistente qué haces y recibe una propuesta validada en minutos. Después puedes ajustarla pieza por pieza.</p>
        </div>
        <div class="actions">
          <a routerLink="/asesor" class="btn btn--primary">Hablar con el asistente</a>
          <a routerLink="/configurador" class="btn">Armar por mi cuenta</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero { background: var(--dark); color: var(--on-dark); padding: clamp(56px, 10vw, 128px) 0; }
    .hero h1 { max-width: 14ch; }
    .hero__lead { color: var(--on-dark-muted); font-size: clamp(1.05rem, 1.8vw, 1.35rem); max-width: 52ch; margin-bottom: 32px; }
    .hero .btn--primary:focus-visible, .hero .btn--light:focus-visible { outline-color: #93c5fd; }
    .pillars { list-style: none; padding: 0; margin: 32px 0 0; display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); counter-reset: pillar; }
    .pillars li { border-top: 3px solid var(--ink); padding-top: 16px; counter-increment: pillar; }
    .pillars li::before { content: '0' counter(pillar); font-weight: 900; font-size: 2rem; color: var(--accent); display: block; margin-bottom: 8px; }
    .section--surface { background: var(--surface); }
    .worlds { list-style: none; padding: 0; margin: 24px 0 0; display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); }
    .world { color: var(--on-dark); padding: 32px 24px; min-height: 280px; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; }
    .world h3 { font-size: 1.75rem; font-weight: 900; text-transform: uppercase; margin: 0; }
    .world p { color: var(--on-dark); margin: 0 0 12px; }
    .world .btn { align-self: flex-start; }
    .world--render { background: linear-gradient(160deg, #1f2937 0%, #0b0f17 100%); }
    .world--design { background: linear-gradient(160deg, #7c2d12 0%, #2a0f06 100%); }
    .world--gaming { background: linear-gradient(160deg, #312e81 0%, #0f0c29 100%); }
    .cta { display: grid; gap: 24px; align-items: end; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); }
  `,
})
export default class Home {
  protected readonly worlds = [
    { title: 'Render 3D', text: 'Blender Cycles por CPU o por GPU. Núcleos, VRAM y memoria para escenas exigentes.', tone: 'render' },
    { title: 'Diseño gráfico', text: 'Photoshop fluido con archivos grandes, capas y filtros acelerados.', tone: 'design' },
    { title: 'Gaming', text: 'Fortnite y juegos actuales a 1080p–1440p con el procesador adecuado.', tone: 'gaming' },
  ];
}
