import type { CheckStatus, ConfigurationStatus } from '../core/api';

export const checkLabels: Record<CheckStatus, string> = {
  ok: 'Cumple', advertencia: 'Advertencia', bloqueo: 'Bloquea', pendiente: 'Pendiente', no_aplica: 'No aplica',
};

export const configurationLabels: Record<ConfigurationStatus, string> = {
  valida: 'Compatible', no_valida: 'Incompatible', incompleta: 'Incompleta',
};

export const configurationHints: Record<ConfigurationStatus, string> = {
  valida: 'Todas las piezas son compatibles entre sí.',
  no_valida: 'Hay piezas que no funcionan juntas. Revisa los bloqueos.',
  incompleta: 'Faltan piezas obligatorias para poder validarlo.',
};
