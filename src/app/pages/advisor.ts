import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Proposal } from '../core/api';
import { AdvisorStore } from '../core/advisor-store';
import { CatalogStore } from '../core/catalog-store';
import { ConfiguratorStore } from '../core/configurator-store';
import { configurationLabels } from '../shared/labels';

@Component({
  selector: 'app-advisor',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './advisor.html',
  styleUrl: './advisor.scss',
})
export default class Advisor {
  protected readonly advisor = inject(AdvisorStore);
  protected readonly catalog = inject(CatalogStore);
  protected readonly configurator = inject(ConfiguratorStore);
  private readonly router = inject(Router);
  private readonly input = viewChild.required<ElementRef<HTMLTextAreaElement>>('message');
  protected readonly draft = signal('');
  protected readonly handoff = signal(false);
  protected readonly statusLabels = configurationLabels;
  protected readonly suggestions = [
    'Quiero una PC para jugar Fortnite a 1440p. Tengo S/ 7000.',
    'Hago render en Blender. ¿Me conviene render por CPU o por GPU?',
    'Edito fotos en Photoshop con archivos pesados, presupuesto S/ 5000.',
  ];

  protected async send(text = this.draft()) {
    if (!text.trim() || this.advisor.pending()) return;
    this.draft.set('');
    await this.advisor.send(text);
    this.input().nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  protected partNames(proposal: Proposal) {
    return proposal.componentIds.map(id => this.catalog.part(id)).filter(part => part !== undefined);
  }

  protected openInConfigurator(proposal: Proposal) {
    this.configurator.load(proposal, 'la propuesta del asesor');
    this.router.navigateByUrl('/configurador');
  }
}
