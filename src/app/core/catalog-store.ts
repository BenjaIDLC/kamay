import { httpResource } from '@angular/common/http';
import { computed, Service } from '@angular/core';
import type { Catalog, Category, Part, Profile, ProfileId } from './api';

/** Catálogo, perfiles y categorías. Es pequeño y lo usan todas las páginas, así que se carga una sola vez. */
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
