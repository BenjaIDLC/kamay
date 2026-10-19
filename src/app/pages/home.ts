import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Build } from '../core/api';
import { CatalogStore } from '../core/catalog-store';
import { ConfiguratorStore } from '../core/configurator-store';
import { TowerArt } from '../shared/tower-art';
import { HeroCarousel } from './home/hero-carousel';

const glows: Record<string, string> = { diseno: '#f472b6', render_cpu: '#f97316', render_gpu: '#38bdf8', gaming: '#a78bfa' };

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, RouterLink, HeroCarousel, TowerArt],
  template: `
    <h1 class="visually-hidden">Kamay: computadoras armadas a medida para diseño, render 3D y gaming</h1>
    <app-hero-carousel />

    <section class="section" aria-labelledby="featured-title">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="kicker">Listos para crear</p>
            <h2 id="featured-title">Equipos destacados</h2>
          </div>
          <a routerLink="/equipos" class="arrow-link">Ver todos los equipos <span aria-hidden="true">→</span></a>
        </div>
        @if (builds.hasValue()) {
          <ul class="featured">
            @for (build of builds.value().builds; track build.id; let i = $index) {
              <li class="featured__card">
                <span class="tag">{{ catalog.profile(build.profileId)?.name }}</span>
                <app-tower-art class="featured__art" [finish]="i % 2 ? 'dark' : 'light'" [glow]="glow(build)" [label]="'Ilustración del equipo ' + build.name" />
                <h3 class="featured__name">{{ build.name }}</h3>
                <p class="featured__tagline">{{ build.tagline }}</p>
                <div class="featured__foot">
                  <span class="price">{{ build.validation.total | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</span>
                  <button type="button" class="btn btn--primary btn--small" (click)="open(build)">Personalizar<span class="visually-hidden"> {{ build.name }}</span></button>
                </div>
              </li>
            }
          </ul>
        } @else if (builds.error()) {
          <div class="notice notice--error" role="alert"><p>No se pudieron cargar los equipos. ¿Está corriendo la API?</p></div>
        } @else {
          <p role="status">Cargando equipos…</p>
        }
      </div>
    </section>

    <section class="section section--soft" aria-labelledby="why-title">
      <div class="container">
        <p class="kicker">Por qué Kamay</p>
        <h2 id="why-title">No vendemos solo componentes.</h2>
        <ol class="pillars">
          <li>
            <h3>Asesoría según tu uso</h3>
            <p>El asesor con IA te pregunta qué programas usas y cuánto quieres invertir, y te propone un equipo del catálogo.</p>
          </li>
          <li>
            <h3>Compatibilidad validada</h3>
            <p>Cada cambio se comprueba al momento: socket, memoria, espacio en el gabinete, potencia y salida de video.</p>
          </li>
          <li>
            <h3>Armado y control de calidad</h3>
            <p>Seguimos tu pedido desde la configuración hasta el ensamblaje, las pruebas y la entrega.</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="cta">
          <div>
            <h2>Tu uso es único. Tu equipo también debería serlo.</h2>
            <p class="cta__text">Cuéntale al asistente qué haces y recibe una propuesta validada en minutos.</p>
          </div>
          <div class="actions">
            <a routerLink="/asesor" class="btn btn--white">Hablar con el asistente</a>
            <a routerLink="/configurador" class="btn btn--light">Armar por mi cuenta</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .section-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
    .section-head h2 { margin: 0; }
    .arrow-link { font-weight: 700; text-decoration: none; }
    .arrow-link:hover { text-decoration: underline; }
    .featured { list-style: none; margin: 0; padding: 0; display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }
    .featured__card { background: var(--surface); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 8px; }
    .featured__art { height: 230px; margin: 4px auto 8px; aspect-ratio: 260 / 360; }
    .featured__name { font-size: 1.25rem; font-weight: 800; margin: 0; }
    .featured__tagline { color: var(--muted); margin: 0; font-size: 0.925rem; }
    .featured__foot { margin-top: auto; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
    .section--soft { background: var(--surface); }
    .pillars { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); counter-reset: pillar; }
    .pillars li { background: var(--bg); border-radius: var(--radius); padding: 24px; counter-increment: pillar; }
    .pillars li::before { content: '0' counter(pillar); font-weight: 800; font-size: 1.75rem; color: var(--accent); display: block; margin-bottom: 8px; }
    .pillars p { margin: 0; color: var(--muted); }
    .cta { background: radial-gradient(120% 160% at 90% 10%, #a855f7 0%, #7c3aed 40%, #4c1d95 100%); color: #fff; border-radius: 28px; padding: clamp(32px, 5vw, 64px); display: grid; gap: 24px; align-items: end; grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr)); }
    .cta h2 { max-width: 18ch; }
    .cta__text { color: #fff; margin: 0; max-width: 46ch; }
    .cta :focus-visible { outline-color: #fff; }
  `,
})
export default class Home {
  protected readonly catalog = inject(CatalogStore);
  private readonly configurator = inject(ConfiguratorStore);
  private readonly router = inject(Router);
  protected readonly builds = httpResource<{ builds: Build[] }>(() => '/api/builds');

  protected glow(build: Build) {
    return glows[build.profileId];
  }

  protected open(build: Build) {
    this.configurator.load({ componentIds: build.validation.componentIds, profileId: build.profileId, budget: null }, build.name);
    this.router.navigateByUrl('/configurador');
  }
}
