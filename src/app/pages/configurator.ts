import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Build, Category, Part, ProfileId } from '../core/api';
import { CatalogStore } from '../core/catalog-store';
import { ConfiguratorStore } from '../core/configurator-store';
import { ChecksList } from '../shared/checks-list';
import { configurationHints, configurationLabels } from '../shared/labels';
import { specList } from '../shared/specs';

@Component({
  selector: 'app-configurator',
  imports: [CurrencyPipe, RouterLink, ChecksList],
  templateUrl: './configurator.html',
  styleUrl: './configurator.scss',
})
export default class Configurator {
  protected readonly catalog = inject(CatalogStore);
  protected readonly store = inject(ConfiguratorStore);
  protected readonly builds = httpResource<{ builds: Build[] }>(() => '/api/builds');
  protected readonly open = signal<Category | null>(null);
  protected readonly statusLabels = configurationLabels;
  protected readonly statusHints = configurationHints;
  protected readonly specs = specList;

  protected readonly selected = computed(() => {
    const parts = this.store.componentIds().map(id => this.catalog.part(id)).filter(part => part !== undefined);
    return new Map(parts.map(part => [part.category, part]));
  });
  protected readonly validation = this.store.validation;
  protected readonly baseForProfile = computed(() => {
    const profileId = this.store.profileId();
    return this.builds.hasValue() ? this.builds.value().builds.find(build => build.profileId === profileId) ?? null : null;
  });
  protected readonly canOrder = computed(() => this.store.upToDate() && this.validation()?.status === 'valida');

  /** Options of a category: compatible ones first, then by price. */
  protected options(category: Category) {
    const conflicts = this.validation()?.conflicts ?? {};
    return this.catalog.parts()
      .filter(part => part.category === category)
      .map(part => ({ part, conflicts: conflicts[part.id] ?? [] }))
      .sort((a, b) => Number(a.conflicts.length > 0) - Number(b.conflicts.length > 0) || a.part.price - b.part.price);
  }

  protected priceDelta(part: Part) {
    const current = this.selected().get(part.category);
    return current ? part.price - current.price : null;
  }

  protected toggle(category: Category) {
    this.open.update(open => (open === category ? null : category));
  }

  protected choose(part: Part) {
    this.store.choose(part);
    this.open.set(null);
  }

  protected setProfile(id: ProfileId | null) {
    this.store.profileId.set(id);
  }

  protected setBudget(value: string) {
    const budget = Number(value);
    this.store.budget.set(value.trim() && Number.isFinite(budget) && budget > 0 ? budget : null);
  }

  protected loadBase(build: Build) {
    this.store.load({ componentIds: build.validation.componentIds, profileId: build.profileId }, build.name);
  }
}
