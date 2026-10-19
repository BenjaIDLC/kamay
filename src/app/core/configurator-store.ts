import { httpResource } from '@angular/common/http';
import { computed, effect, inject, linkedSignal, Service, signal } from '@angular/core';
import type { ConfigurationInput, Part, ProfileId, Validation } from './api';
import { CatalogStore } from './catalog-store';

const storageKey = 'kamay.configuration';

// The configuration being built, shared by the configurator, the advisor and checkout.
@Service()
export class ConfiguratorStore {
  private readonly catalog = inject(CatalogStore);

  readonly componentIds = signal<string[]>([]);
  readonly profileId = signal<ProfileId | null>(null);
  readonly budget = signal<number | null>(null);
  /** Name of the base build or advisor proposal the configuration started from. */
  readonly origin = signal<string | null>(null);

  readonly input = computed<ConfigurationInput>(() => ({
    componentIds: this.componentIds(), profileId: this.profileId(), budget: this.budget(),
  }));

  // Every change is validated by the server; the client never decides compatibility or price.
  private readonly request = httpResource<Validation>(() => ({
    url: '/api/configurations/validate', method: 'POST', body: this.input(),
  }));
  /** Last validation received, kept while a new one is loading. */
  readonly validation = linkedSignal<Validation | undefined, Validation | null>({
    source: () => (this.request.hasValue() ? this.request.value() : undefined),
    computation: (next, previous) => next ?? previous?.value ?? null,
  });
  readonly validating = this.request.isLoading;
  readonly error = this.request.error;
  /** True only when the validation shown matches the current selection. */
  readonly upToDate = computed(() => !this.validating() && !this.error() && this.validation() !== null);

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as (ConfigurationInput & { origin: string | null }) | null;
      if (saved && Array.isArray(saved.componentIds)) this.load(saved, saved.origin);
    } catch { /* storage unavailable or corrupt: start empty */ }
    effect(() => {
      const state = { ...this.input(), origin: this.origin() };
      try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* ignore */ }
    });
  }

  load(input: Partial<ConfigurationInput>, origin: string | null = null) {
    this.componentIds.set(input.componentIds ?? []);
    if (input.profileId !== undefined) this.profileId.set(input.profileId);
    if (input.budget !== undefined) this.budget.set(input.budget);
    this.origin.set(origin);
  }

  choose(part: Part) {
    this.componentIds.update(ids => [...ids.filter(id => this.catalog.part(id)?.category !== part.category), part.id]);
  }

  remove(part: Part) {
    this.componentIds.update(ids => ids.filter(id => id !== part.id));
  }

  reset() {
    this.load({ componentIds: [], profileId: null, budget: null });
  }
}
