import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { stageNames, type Order } from '../core/api';

@Component({
  selector: 'app-orders',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="container page-head">
      <h1>Pedidos</h1>
      <p class="lead">Vista de gestión para la demostración: abre un pedido para avanzar sus etapas de ensamblaje, control de calidad y entrega.</p>
    </div>
    <div class="container section" style="padding-top: 0">
      @if (orders.isLoading()) {
        <p role="status">Cargando pedidos…</p>
      } @else if (orders.error()) {
        <div class="notice notice--error" role="alert"><p>No se pudieron cargar los pedidos.</p></div>
      } @else if (orders.hasValue()) {
        @if (orders.value().orders.length) {
          <div class="table-wrap">
            <table>
              <caption class="visually-hidden">Pedidos creados</caption>
              <thead><tr><th scope="col">Pedido</th><th scope="col">Cliente</th><th scope="col">Fecha</th><th scope="col">Etapa</th><th scope="col" class="num">Total</th></tr></thead>
              <tbody>
                @for (order of orders.value().orders; track order.id) {
                  <tr>
                    <td><a [routerLink]="['/pedidos', order.id]">{{ order.id }}</a></td>
                    <td>{{ order.customer.name }}</td>
                    <td>{{ order.createdAt | date: 'short' }}</td>
                    <td>{{ names[order.stage] }}</td>
                    <td class="num">{{ order.total | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p>Aún no hay pedidos. <a routerLink="/equipos">Elige un equipo</a> para crear el primero.</p>
        }
      }
    </div>
  `,
  styles: `
    .table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--line); }
    table { width: 100%; border-collapse: collapse; min-width: 560px; }
    th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--line); }
    thead th { font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.06em; }
    td a { font-weight: 700; }
    .num { text-align: right; }
  `,
})
export default class Orders {
  protected readonly orders = httpResource<{ orders: Order[] }>(() => '/api/orders');
  protected readonly names = stageNames;
}
