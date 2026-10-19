import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Build, Category } from '../core/api';
import { CatalogStore } from '../core/catalog-store';
import { ConfiguratorStore } from '../core/configurator-store';
import { configurationLabels } from '../shared/labels';

const highlights: Category[] = ['cpu', 'gpu', 'ram', 'storage'];

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
        <ul class="grid builds">
          @for (build of builds.value().builds; track build.id) {
            <li class="card">
              <span class="tag">{{ catalog.profile(build.profileId)?.name }}</span>
              <h2 class="build__name">{{ build.name }}</h2>
              <p>{{ build.tagline }}</p>
              <dl class="specs">
                @for (part of highlighted(build); track part.id) {
                  <div><dt>{{ catalog.categoryName(part.category) }}</dt><dd>{{ part.brand }} {{ part.name }}</dd></div>
                }
              </dl>
              <p class="status status--{{ build.validation.status }}">{{ statusLabels[build.validation.status] }} · {{ build.validation.parts.length }} piezas</p>
              <div class="card__foot">
                <span class="price">{{ build.validation.total | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</span>
                <span class="small muted">Precio referencial</span>
              </div>
              <div class="actions">
                <button type="button" class="btn btn--primary btn--small" (click)="customize(build, '/pedido')">Pedir este equipo</button>
                <button type="button" class="btn btn--small" (click)="customize(build, '/configurador')">Personalizar</button>
              </div>
            </li>
          }
          <li class="card card--custom">
            <h2 class="build__name">Arma uno desde cero</h2>
            <p>Indica tu uso y presupuesto, parte de una base o elige cada pieza tú mismo. Validamos la compatibilidad en cada cambio.</p>
            <div class="actions" style="margin-top: auto">
              <a routerLink="/configurador" class="btn btn--light btn--small" (click)="configurator.reset()">Armar personalizado</a>
              <a routerLink="/asesor" class="btn btn--light btn--small">Pedir ayuda a la IA</a>
            </div>
          </li>
        </ul>
      }
    </div>
  `,
  styles: `
    .builds { list-style: none; padding: 0; margin: 0; }
    .build__name { font-size: 1.5rem; margin: 0; }
    .specs { margin: 0; display: grid; gap: 6px; font-size: 0.9rem; }
    .specs div { display: grid; grid-template-columns: 7.5rem 1fr; gap: 8px; }
    .specs dt { color: var(--muted); }
    .specs dd { margin: 0; font-weight: 600; }
    .card--custom { background: radial-gradient(120% 140% at 90% 10%, #a855f7 0%, #7c3aed 45%, #4c1d95 100%); color: #fff; }
    .card--custom :focus-visible { outline-color: #fff; }
  `,
})
export default class Builds {
  protected readonly catalog = inject(CatalogStore);
  protected readonly configurator = inject(ConfiguratorStore);
  private readonly router = inject(Router);
  protected readonly builds = httpResource<{ builds: Build[] }>(() => '/api/builds');
  protected readonly statusLabels = configurationLabels;

  protected highlighted(build: Build) {
    return highlights.flatMap(category => build.validation.parts.filter(part => part.category === category));
  }

  protected customize(build: Build, target: string) {
    this.configurator.load({ componentIds: build.validation.componentIds, profileId: build.profileId, budget: null }, build.name);
    this.router.navigateByUrl(target);
  }
}
