const FUSO_LOJA = 'America/Sao_Paulo';

/**
 * Data (YYYY-MM-DD) no fuso horário da loja, não em UTC. `Date.toISOString()`
 * usa UTC e vira o dia ~3h antes da meia-noite de Brasília, o que fazia a
 * "contagem de hoje" trocar de dia mais cedo do que deveria.
 */
export function dataLocalISO(data: Date = new Date()): string {
  return data.toLocaleDateString('en-CA', { timeZone: FUSO_LOJA });
}
