import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Api, errorMessage } from '../core/api';
import { CatalogStore } from '../core/catalog-store';
import { ConfiguratorStore } from '../core/configurator-store';
import { ChecksList } from '../shared/checks-list';

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, RouterLink, FormField, FormRoot, ChecksList],
  template: `
    <div class="container page-head">
      <h1>Finalizar pedido</h1>
      <p class="lead">Revisa tu equipo y confirma el pago simulado. El servidor vuelve a validar la configuración antes de crear el pedido.</p>
    </div>
    <div class="container layout">
      @if (!store.validation()) {
        <p role="status">Validando tu configuración…</p>
      } @else if (!store.upToDate() || store.validation()!.status !== 'valida') {
        <div class="notice notice--warn">
          <p>Tu equipo todavía no se puede pedir: debe estar completo y ser compatible.</p>
          <a routerLink="/configurador" class="btn btn--small">Volver al configurador</a>
        </div>
      } @else {
        @let v = store.validation()!;
        <section class="card" aria-labelledby="summary-title">
          <h2 id="summary-title" class="title">Tu equipo</h2>
          @if (store.origin(); as origin) { <p class="small muted">Basado en {{ origin }}</p> }
          <table class="items">
            <caption class="visually-hidden">Componentes y precios</caption>
            <tbody>
              @for (part of v.parts; track part.id) {
                <tr>
                  <th scope="row">{{ catalog.categoryName(part.category) }}</th>
                  <td>{{ part.brand }} {{ part.name }}</td>
                  <td class="num">{{ part.price | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr><th scope="row" colspan="2">Total <span class="small muted">(IGV incluido)</span></th><td class="num total">{{ v.total | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</td></tr>
            </tfoot>
          </table>
          <details>
            <summary>Ver comprobaciones de compatibilidad</summary>
            <app-checks-list [checks]="v.checks" />
          </details>
          <a routerLink="/configurador" class="small">Modificar equipo</a>
        </section>

        <section class="card" aria-labelledby="pay-title">
          <h2 id="pay-title" class="title">Datos y pago</h2>
          <form [formRoot]="customer" class="pay">
            <div class="field">
              <label for="name">Nombre completo</label>
              <input id="name" class="input" autocomplete="name" [formField]="customer.name">
              @if (customer.name().touched() && customer.name().invalid()) {
                <p class="field-error">Indica tu nombre.</p>
              }
            </div>
            <div class="field">
              <label for="email">Correo electrónico</label>
              <input id="email" class="input" type="email" autocomplete="email" [formField]="customer.email">
              @if (customer.email().touched() && customer.email().invalid()) {
                <p class="field-error">Indica un correo válido.</p>
              }
            </div>
            <div class="notice small">
              <p><strong>Pago simulado.</strong> Este prototipo no cobra dinero ni solicita datos de tarjeta. Al confirmar se crea el pedido y podrás seguir sus etapas.</p>
            </div>
            @if (error(); as message) { <div class="notice notice--error" role="alert"><p>{{ message }}</p></div> }
            <button type="submit" class="btn btn--primary" [disabled]="submitting()">
              {{ submitting() ? 'Creando pedido…' : 'Confirmar pago simulado · ' + (v.total | currency: 'PEN' : 'symbol-narrow' : '1.0-0') }}
            </button>
          </form>
        </section>
      }
    </div>
  `,
  styles: `
    .layout { display: grid; gap: 24px; padding-bottom: 64px; align-items: start; }
    @media (min-width: 960px) { .layout { grid-template-columns: minmax(0, 1fr) 400px; } }
    .title { font-size: 1.25rem; margin: 0; }
    .items { width: 100%; border-collapse: collapse; font-size: 0.925rem; }
    .items th, .items td { text-align: left; padding: 8px 8px 8px 0; border-top: 1px solid var(--line); vertical-align: top; }
    .items tbody th { color: var(--muted); font-weight: 500; white-space: nowrap; }
    .num { text-align: right !important; white-space: nowrap; font-weight: 700; }
    .total { font-size: 1.25rem; font-weight: 900; }
    details summary { cursor: pointer; font-weight: 700; padding: 8px 0; }
    .pay { display: grid; gap: 16px; }
  `,
})
export default class Checkout {
  protected readonly store = inject(ConfiguratorStore);
  protected readonly catalog = inject(CatalogStore);
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly customer = form(
    signal({ name: '', email: '' }),
    path => {
      required(path.name);
      maxLength(path.name, 100);
      required(path.email);
      email(path.email);
    },
    { submission: { action: async field => { await this.placeOrder(field().value()); return undefined; } } },
  );

  private async placeOrder(customer: { name: string; email: string }) {
    this.submitting.set(true);
    this.error.set(null);
    try {
      const order = await firstValueFrom(this.api.createOrder({ ...this.store.input(), customer }));
      this.store.reset();
      await this.router.navigate(['/pedidos', order.id], { queryParams: { nuevo: 1 } });
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }
}
