/**
 * Tipos compartidos con la API y cliente HTTP del frontend.
 * @module
 */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';

export type Category = 'cpu' | 'motherboard' | 'ram' | 'gpu' | 'storage' | 'psu' | 'case' | 'cooler';
export type ProfileId = 'diseno' | 'render_cpu' | 'render_gpu' | 'gaming';
export type CheckStatus = 'ok' | 'advertencia' | 'bloqueo' | 'pendiente' | 'no_aplica';
export type ConfigurationStatus = 'incompleta' | 'no_valida' | 'valida';

export interface Part {
  id: string;
  category: Category;
  brand: string;
  name: string;
  price: number;
  uses: ProfileId[];
  rationale: string;
  specs: Record<string, string | number | boolean | string[]>;
}

export interface Profile {
  id: ProfileId;
  name: string;
  software: string;
  description: string;
  minRamGb: number;
  minStorageGb: number;
  minCores: number | null;
  needsGpu: boolean;
  minVramGb: number | null;
}

export interface Catalog {
  currency: 'PEN';
  categories: { id: Category; name: string }[];
  profiles: Profile[];
  components: Part[];
}

export interface Check {
  id: string;
  name: string;
  status: CheckStatus;
  message: string;
  parts: Category[];
}

export interface ConfigurationInput {
  componentIds: string[];
  profileId: ProfileId | null;
  budget: number | null;
}

export interface Validation {
  componentIds: string[];
  profileId: ProfileId | null;
  status: ConfigurationStatus;
  missing: Category[];
  checks: Check[];
  total: number;
  budget: { amount: number; within: boolean; difference: number } | null;
  recommended: boolean;
  parts: Part[];
  conflicts?: Record<string, string[]>;
}

export interface Build {
  id: string;
  name: string;
  tagline: string;
  profileId: ProfileId;
  validation: Validation;
}

export type Stage = 'pagado' | 'ensamblaje' | 'control_calidad' | 'enviado' | 'entregado';

export interface Order {
  id: string;
  createdAt: string;
  customer: { name: string; email: string };
  profileId: ProfileId | null;
  componentIds: string[];
  items: { id: string; category: Category; name: string; price: number }[];
  total: number;
  stage: Stage;
  history: { stage: Stage; at: string }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Proposal extends ConfigurationInput {
  status: ConfigurationStatus;
  total: number;
  recommended: boolean;
}

export const stageNames: Record<Stage, string> = {
  pagado: 'Pago confirmado', ensamblaje: 'Ensamblaje', control_calidad: 'Control de calidad', enviado: 'Enviado', entregado: 'Entregado',
};

/** Convierte un error HTTP en un mensaje en español para mostrar al usuario. */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con el servidor de Kamay. ¿Está corriendo la API?';
    if (typeof error.error?.error === 'string') return error.error.error;
    // The API always answers with a JSON error; a bare 5xx comes from the dev proxy when the API is down.
    if (error.status >= 500) return 'No se pudo conectar con el servidor de Kamay. ¿Está corriendo la API (npm run api:start)?';
  }
  return 'Ocurrió un error inesperado.';
}

/** Cliente de la API REST de Kamay: un método por endpoint. */
@Service()
export class Api {
  private readonly http = inject(HttpClient);

  catalog() {
    return this.http.get<Catalog>('/api/catalog');
  }

  builds() {
    return this.http.get<{ builds: Build[] }>('/api/builds');
  }

  validate(input: ConfigurationInput) {
    return this.http.post<Validation>('/api/configurations/validate', input);
  }

  advise(messages: ChatMessage[], context: ConfigurationInput | null, proposal: ConfigurationInput | null) {
    return this.http.post<{ reply: string; proposal: Proposal | null }>('/api/advice', { messages, context, proposal });
  }

  orders() {
    return this.http.get<{ orders: Order[] }>('/api/orders');
  }

  order(id: string) {
    return this.http.get<Order>(`/api/orders/${encodeURIComponent(id)}`);
  }

  createOrder(input: ConfigurationInput & { customer: { name: string; email: string } }) {
    return this.http.post<Order>('/api/orders', input);
  }

  advanceOrder(id: string) {
    return this.http.post<Order>(`/api/orders/${encodeURIComponent(id)}/advance`, {});
  }
}
