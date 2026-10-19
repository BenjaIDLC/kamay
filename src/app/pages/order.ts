import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Api, errorMessage, stageNames, type Order as OrderModel, type Stage } from '../core/api';
import { CatalogStore } from '../core/catalog-store';

const stages = Object.keys(stageNames) as Stage[];

@Component({
  selector: 'app-order',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="container page-head">
      <h1>Pedido {{ id() }}</h1>
      @if (nuevo()) { <p class="notice notice--ok" role="status">¡Pedido creado! El pago fue simulado: no se cobró dinero.</p> }
    </div>
    <div class="container section" style="padding-top: 0">
      @if (order.isLoading() && !order.hasValue()) {
        <p role="status">Cargando pedido…</p>
      } @else if (order.error()) {
        <div class="notice notice--error" role="alert"><p>No encontramos este pedido.</p><a routerLink="/pedidos">Ver todos los pedidos</a></div>
      } @else if (order.hasValue()) {
        @let o = order.value();
        <div class="layout">
          <section class="card" aria-labelledby="track-title">
            <h2 id="track-title" class="title">Seguimiento</h2>
            <ol class="timeline">
              @for (stage of stages; track stage; let i = $index) {
                @let reached = history().get(stage);
                <li class="timeline__step" [class.is-done]="reached" [attr.aria-current]="o.stage === stage ? 'step' : null">
                  <span class="timeline__name">{{ names[stage] }}</span>
                  @if (reached) { <span class="small muted">{{ reached | date: 'short' }}</span> } @else { <span class="small muted">Pendiente</span> }
                </li>
              }
            </ol>
            <div class="notice small">
              <p><strong>Demostración:</strong> las etapas se avanzan manualmente para mostrar el proceso. Nadie ensamblará ni entregará este equipo.</p>
            </div>
            @if (error(); as message) { <p class="field-error" role="alert">{{ message }}</p> }
            @if (o.stage !== 'entregado') {
              <button type="button" class="btn btn--small" (click)="advance(o)" [disabled]="advancing()">Avanzar a «{{ names[next(o)] }}» (demo)</button>
            }
          </section>
          <section class="card" aria-labelledby="items-title">
            <h2 id="items-title" class="title">Detalle</h2>
            <p class="small muted">{{ o.customer.name }} · {{ o.customer.email }} · {{ o.createdAt | date: 'medium' }}</p>
            @if (catalog.profile(o.profileId); as profile) { <p class="small">Uso: {{ profile.name }}</p> }
            <ul class="items small">
              @for (item of o.items; track item.id) {
                <li><span>{{ item.name }}</span><span>{{ item.price | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</span></li>
              }
            </ul>
            <p class="total">Total {{ o.total | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</p>
          </section>
        </div>
      }
    </div>
  `,
  styles: `
    .layout { display: grid; gap: 24px; align-items: start; }
    @media (min-width: 960px) { .layout { grid-template-columns: 1fr 1fr; } }
    .title { font-size: 1.25rem; margin: 0; }
    .timeline { list-style: none; margin: 0; padding: 0; display: grid; }
    .timeline__step { display: grid; padding: 10px 0 10px 28px; position: relative; border-left: 3px solid var(--line); margin-left: 8px; }
    .timeline__step::before { content: ''; position: absolute; left: -10px; top: 14px; width: 14px; height: 14px; background: var(--surface); border: 3px solid var(--line); }
    .timeline__step.is-done { border-left-color: var(--ink); }
    .timeline__step.is-done::before { background: var(--ink); border-color: var(--ink); }
    .timeline__step[aria-current='step']::before { background: var(--accent); border-color: var(--accent); }
    .timeline__name { font-weight: 700; }
    .items { list-style: none; margin: 0; padding: 0; }
    .items li { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-top: 1px solid var(--line); }
    .total { font-weight: 900; font-size: 1.25rem; }
    .card .btn { justify-self: start; align-self: flex-start; }
  `,
})
export default class Order {
  readonly id = input.required<string>();
  readonly nuevo = input<string>();
  protected readonly catalog = inject(CatalogStore);
  private readonly api = inject(Api);
  protected readonly order = httpResource<OrderModel>(() => `/api/orders/${encodeURIComponent(this.id())}`);
  protected readonly stages = stages;
  protected readonly names = stageNames;
  protected readonly advancing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly history = computed(() => new Map(this.order.hasValue() ? this.order.value().history.map(entry => [entry.stage, entry.at]) : []));

  protected next(order: OrderModel) {
    return stages[stages.indexOf(order.stage) + 1];
  }

  protected async advance(order: OrderModel) {
    this.advancing.set(true);
    this.error.set(null);
    try {
      this.order.set(await firstValueFrom(this.api.advanceOrder(order.id)));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.advancing.set(false);
    }
  }
}
