import { inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Api, errorMessage, type ChatMessage, type Proposal } from './api';
import { ConfiguratorStore } from './configurator-store';

export type AdvisorEntry = ChatMessage & { proposal?: Proposal | null };

// Lives at the root so the conversation survives navigating to the configurator and back.
@Service()
export class AdvisorStore {
  private readonly api = inject(Api);
  private readonly configurator = inject(ConfiguratorStore);

  readonly entries = signal<AdvisorEntry[]>([]);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  async send(text: string) {
    const content = text.trim();
    if (!content || this.pending()) return;
    this.entries.update(entries => [...entries, { role: 'user', content }]);
    await this.request();
  }

  /** Re-sends the conversation after a failure; the user's last message is kept. */
  retry() {
    return this.request();
  }

  clear() {
    this.entries.set([]);
    this.error.set(null);
  }

  private async request() {
    this.pending.set(true);
    this.error.set(null);
    const messages = this.entries().map(({ role, content }) => ({ role, content }));
    const context = this.configurator.componentIds().length || this.configurator.profileId() ? this.configurator.input() : null;
    try {
      const { reply, proposal } = await firstValueFrom(this.api.advise(messages, context));
      this.entries.update(entries => [...entries, { role: 'assistant', content: reply, proposal }]);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
