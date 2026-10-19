import { Component, computed, input } from '@angular/core';
import type { Check } from '../core/api';
import { checkLabels } from './labels';

const order: Record<Check['status'], number> = { bloqueo: 0, advertencia: 1, pendiente: 2, ok: 3, no_aplica: 4 };

@Component({
  selector: 'app-checks-list',
  template: `
    <ul class="checks">
      @for (check of sorted(); track check.id) {
        <li class="checks__item">
          <span class="status status--{{ check.status }}">{{ labels[check.status] }}</span>
          <span class="checks__name">{{ check.name }}</span>
          <span class="checks__message">{{ check.message }}</span>
        </li>
      }
    </ul>
  `,
  styles: `
    .checks { list-style: none; margin: 0; padding: 0; display: grid; }
    .checks__item { display: grid; grid-template-columns: 7.5rem 1fr; column-gap: 12px; padding: 10px 0; border-top: 1px solid var(--line); font-size: 0.9rem; }
    .checks__name { font-weight: 700; }
    .checks__message { grid-column: 2; color: var(--muted); }
  `,
})
export class ChecksList {
  readonly checks = input.required<Check[]>();
  protected readonly labels = checkLabels;
  protected readonly sorted = computed(() => [...this.checks()].sort((a, b) => order[a.status] - order[b.status]));
}
