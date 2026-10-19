import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Build, Category } from '../core/api';
import { CatalogStore } from '../core/catalog-store';
import { ConfiguratorStore } from '../core/configurator-store';
import { configurationLabels } from '../shared/labels';

const categoryOrder: Category[] = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooler'];

@Component({
  selector: 'app-builds',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <div class="container page-head">
      <h1>Equipos</h1>
      <p class="lead">Cuatro puntos de partida curados, uno por cada uso que Kamay sabe orientar. Puedes pedirlos tal cual o personalizarlos pieza por pieza.</p>
    </div>
    <div class="container section" style="padding-top: 0">
      @if (builds.isLoading()) {
        <p role="status">Cargando equipos…</p>
      } @else if (builds.error()) {
        <div class="notice notice--error" role="alert"><p>No se pudieron cargar los equipos. ¿Está corriendo la API?</p></div>
      } @else if (builds.hasValue()) {
        <ul class="builds">
          @for (build of builds.value().builds; track build.id) {
            <li class="card build">
              <div class="build__head">
                <span class="tag">{{ catalog.profile(build.profileId)?.name }}</span>
                <h2 class="build__name">{{ build.name }}</h2>
                <p class="muted">{{ build.tagline }}</p>
              </div>
              <dl class="specs">
                @for (row of rows(build); track row.category) {
                  <div class="specs__row">
                    <dt>{{ catalog.categoryName(row.category) }}</dt>
                    @if (row.part; as part) {
                      <dd>{{ part.brand }} {{ part.name }}</dd>
                    } @else {
                      <dd class="muted">Gráficos integrados del procesador</dd>
                    }
                  </div>
                }
              </dl>
              <div class="build__foot">
                <div>
                  <span class="price">{{ build.validation.total | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</span>
                  <span class="small muted"> · Precio referencial</span>
                </div>
                <p class="status status--{{ build.validation.status }}">{{ statusLabels[build.validation.status] }} · {{ build.validation.parts.length }} piezas</p>
              </div>
              <div class="build__actions">
                <button type="button" class="btn btn--primary" (click)="customize(build, '/pedido')">Pedir este equipo<span class="visually-hidden"> {{ build.name }}</span></button>
                <button type="button" class="btn" (click)="customize(build, '/configurador')">Personalizar<span class="visually-hidden"> {{ build.name }}</span></button>
              </div>
            </li>
          }
          <li class="card card--custom">
            <div class="build__head">
              <h2 class="build__name">Arma uno desde cero</h2>
              <p>Indica tu uso y presupuesto, parte de una base o elige cada pieza tú mismo. Validamos la compatibilidad en cada cambio.</p>
            </div>
            <div class="build__actions">
              <a routerLink="/configurador" class="btn btn--light" (click)="configurator.reset()">Armar personalizado</a>
              <a routerLink="/asesor" class="btn btn--light">Pedir ayuda a la IA</a>
            </div>
          </li>
        </ul>
      }
    </div>
  `,
  styles: `
    .builds { list-style: none; padding: 0; margin: 0; display: grid; gap: 24px; }
    @media (min-width: 768px) { .builds { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .build { padding: 28px; gap: 20px; }
    .build__head { display: grid; gap: 8px; justify-items: start; }
    .build__name { font-size: 1.6rem; margin: 0; }

    .specs { margin: 0; background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius-sm); font-size: 0.9rem; }
    .specs__row { display: grid; grid-template-columns: 9.5rem minmax(0, 1fr); gap: 12px; padding: 10px 16px; }
    .specs__row + .specs__row { border-top: 1px solid var(--line); }
    .specs dt { color: var(--muted); }
    .specs dd { margin: 0; font-weight: 600; }
    @media (max-width: 420px) { .specs__row { grid-template-columns: 1fr; gap: 2px; } }

    .build__foot { margin-top: auto; display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 16px; }
    .build__foot .price { font-size: 1.6rem; }
    .build__actions { display: grid; gap: 12px; }
    @media (min-width: 480px) { .build__actions { grid-template-columns: 1fr 1fr; } }
    .build__actions .btn { width: 100%; }

    .card--custom { grid-column: 1 / -1; padding: 28px; gap: 20px; background: radial-gradient(120% 140% at 90% 10%, #a855f7 0%, #7c3aed 45%, #4c1d95 100%); color: #fff; }
    .card--custom :focus-visible { outline-color: #fff; }
  `,
})
export default class Builds {
  protected readonly catalog = inject(CatalogStore);
  protected readonly configurator = inject(ConfiguratorStore);
  private readonly router = inject(Router);
  protected readonly builds = httpResource<{ builds: Build[] }>(() => '/api/builds');
  protected readonly statusLabels = configurationLabels;

  /** Every category in a fixed order, so all cards line up; the GPU row stays even when the build has none. */
  protected rows(build: Build) {
    return categoryOrder.map(category => ({ category, part: build.validation.parts.find(part => part.category === category) }));
  }

  protected customize(build: Build, target: string) {
    this.configurator.load({ componentIds: build.validation.componentIds, profileId: build.profileId, budget: null }, build.name);
    this.router.navigateByUrl(target);
  }
}
