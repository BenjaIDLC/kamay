import { inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Api, errorMessage, type ChatMessage, type Proposal } from './api';
import { ConfiguratorStore } from './configurator-store';

export type AdvisorEntry = ChatMessage & { proposal?: Proposal | null };

/**
 * Conversación con el asesor IA. Vive en la raíz para que no se pierda al ir al configurador y volver.
 */
@Service()
export class AdvisorStore {
  private readonly api = inject(Api);
  private readonly configurator = inject(ConfiguratorStore);

  readonly entries = signal<AdvisorEntry[]>([]);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  /** Agrega el mensaje del usuario y pide la respuesta, enviando la configuración actual y la última propuesta. */
  async send(text: string) {
    const content = text.trim();
    if (!content || this.pending()) return;
    this.entries.update(entries => [...entries, { role: 'user', content }]);
    await this.request();
  }

  /** Reenvía la conversación tras un error; se conserva el último mensaje del usuario. */
  retry() {
    return this.request();
  }

  /** Empieza una conversación nueva. */
  clear() {
    this.entries.set([]);
    this.error.set(null);
  }

  private async request() {
    this.pending.set(true);
    this.error.set(null);
    const messages = this.entries().map(({ role, content }) => ({ role, content }));
    const context = this.configurator.componentIds().length || this.configurator.profileId() ? this.configurator.input() : null;
    const last = this.entries().filter(entry => entry.proposal).at(-1)?.proposal;
    const lastProposal = last ? { componentIds: last.componentIds, profileId: last.profileId, budget: last.budget } : null;
    try {
      const { reply, proposal } = await firstValueFrom(this.api.advise(messages, context, lastProposal));
      this.entries.update(entries => [...entries, { role: 'assistant', content: reply, proposal }]);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
