import { httpResource } from '@angular/common/http';
import { computed, Service } from '@angular/core';
import type { Catalog, Category, Part, Profile, ProfileId } from './api';

// The catalog is small and shared by every page, so it is loaded once.
@Service()
export class CatalogStore {
  readonly resource = httpResource<Catalog>(() => '/api/catalog');
  readonly catalog = computed(() => (this.resource.hasValue() ? this.resource.value() : null));
  readonly parts = computed(() => this.catalog()?.components ?? []);
  readonly categories = computed(() => this.catalog()?.categories ?? []);
  readonly profiles = computed(() => this.catalog()?.profiles ?? []);
  private readonly byId = computed(() => new Map(this.parts().map(part => [part.id, part])));

  part(id: string): Part | undefined {
    return this.byId().get(id);
  }

  profile(id: ProfileId | null): Profile | undefined {
    return this.profiles().find(profile => profile.id === id);
  }

  categoryName(id: Category): string {
    return this.categories().find(category => category.id === id)?.name ?? id;
  }
}
