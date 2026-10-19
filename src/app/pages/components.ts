import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Category, Part, ProfileId } from '../core/api';
import { CatalogStore } from '../core/catalog-store';
import { ConfiguratorStore } from '../core/configurator-store';
import { specList } from '../shared/specs';

@Component({
  selector: 'app-components',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <div class="container page-head">
      <h1>Componentes</h1>
      <p class="lead">Cada pieza del catálogo está elegida por un motivo técnico. Filtra por categoría o por uso y añádela a tu equipo.</p>
    </div>
    <div class="container section" style="padding-top: 0">
      @if (catalog.resource.isLoading()) {
        <p role="status">Cargando catálogo…</p>
      } @else if (catalog.resource.error()) {
        <div class="notice notice--error" role="alert"><p>No se pudo cargar el catálogo. ¿Está corriendo la API?</p></div>
      } @else {
        <div class="filters">
          <div role="group" aria-labelledby="cat-label">
            <p id="cat-label" class="label">Categoría</p>
            <div class="chips">
              <button type="button" class="chip" [attr.aria-pressed]="category() === null" (click)="category.set(null)">Todas</button>
              @for (item of catalog.categories(); track item.id) {
                <button type="button" class="chip" [attr.aria-pressed]="category() === item.id" (click)="category.set(item.id)">{{ item.name }}</button>
              }
            </div>
          </div>
          <div class="field use-filter">
            <label for="use">Uso</label>
            <select id="use" class="input" (change)="use.set(asProfile($any($event.target).value))">
              <option value="">Todos los usos</option>
              @for (profile of catalog.profiles(); track profile.id) {
                <option [value]="profile.id">{{ profile.name }}</option>
              }
            </select>
          </div>
        </div>
        <p class="small muted" role="status">{{ visible().length }} productos</p>
        <ul class="grid parts">
          @for (part of visible(); track part.id) {
            <li class="card">
              <span class="tag">{{ catalog.categoryName(part.category) }}</span>
              <h2 class="part__name">{{ part.brand }} {{ part.name }}</h2>
              <p>{{ part.rationale }}</p>
              <ul class="part__specs small">
                @for (spec of specs(part); track spec) { <li>{{ spec }}</li> }
              </ul>
              <p class="small muted">Recomendado para: {{ useNames(part) }}</p>
              <div class="card__foot">
                <span class="price">{{ part.price | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</span>
                @if (inBuild(part)) {
                  <a routerLink="/configurador" class="btn btn--small">En tu equipo · Ver</a>
                } @else {
                  <button type="button" class="btn btn--primary btn--small" (click)="add(part)">Añadir<span class="visually-hidden"> {{ part.name }}</span> a mi equipo</button>
                }
              </div>
            </li>
          }
        </ul>
        <p class="visually-hidden" aria-live="polite">{{ announcement() }}</p>
      }
    </div>
  `,
  styles: `
    .filters { display: flex; flex-wrap: wrap; gap: 24px; align-items: end; margin-bottom: 16px; }
    .label { font-weight: 700; font-size: 0.875rem; margin: 0 0 6px; }
    .use-filter { min-width: 220px; }
    .parts { list-style: none; padding: 0; margin: 0; }
    .part__name { font-size: 1.15rem; margin: 0; text-transform: none; }
    .part__specs { margin: 0; padding-left: 18px; color: var(--muted); }
  `,
})
export default class Components {
  protected readonly catalog = inject(CatalogStore);
  private readonly configurator = inject(ConfiguratorStore);
  protected readonly category = signal<Category | null>(null);
  protected readonly use = signal<ProfileId | null>(null);
  protected readonly announcement = signal('');
  protected readonly specs = specList;

  protected readonly visible = computed(() => this.catalog.parts().filter(part =>
    (!this.category() || part.category === this.category()) && (!this.use() || part.uses.includes(this.use()!))));

  protected asProfile(value: string) {
    return (value || null) as ProfileId | null;
  }

  protected useNames(part: Part) {
    return part.uses.map(id => this.catalog.profile(id)?.name).join(', ');
  }

  protected inBuild(part: Part) {
    return this.configurator.componentIds().includes(part.id);
  }

  protected add(part: Part) {
    this.configurator.choose(part);
    this.announcement.set(`${part.name} añadido a tu equipo.`);
  }
}
