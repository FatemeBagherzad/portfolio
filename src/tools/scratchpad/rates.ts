import { registerCurrency } from './units';

/**
 * Currency rates, bundled rather than fetched.
 *
 * There is no backend here, and a live rates API means an API key — which
 * in a front-end-only app means a key published to everyone who opens the
 * network tab. So the rates ship with the build, the date they were taken
 * is shown in the interface, and they are deliberately approximate. A
 * scratchpad that tells you a hotel costs roughly €160 is useful; one that
 * implies four decimal places of accuracy it does not have is not.
 *
 * Quoted as "units of this currency per 1 USD".
 */
export const RATES_AS_OF = 'November 2026';

/** Shown next to any currency result, so the number is never mistaken for live. */
export const RATES_NOTE =
  'Approximate offline rates from ' + RATES_AS_OF + ' — not live.';

interface CurrencySeed {
  code: string;
  perUsd: number;
  symbol: string;
  aliases: string[];
}

const CURRENCIES: CurrencySeed[] = [
  { code: 'USD', perUsd: 1, symbol: '$', aliases: ['$', 'usd', 'dollar', 'dollars', 'usdollar'] },
  { code: 'CAD', perUsd: 1.37, symbol: 'CA$', aliases: ['cad', 'ca$', 'c$', 'canadiandollar'] },
  { code: 'EUR', perUsd: 0.92, symbol: '€', aliases: ['€', 'eur', 'euro', 'euros'] },
  { code: 'GBP', perUsd: 0.78, symbol: '£', aliases: ['£', 'gbp', 'pound', 'pounds', 'sterling'] },
  { code: 'JPY', perUsd: 152, symbol: '¥', aliases: ['¥', 'jpy', 'yen'] },
  { code: 'AUD', perUsd: 1.52, symbol: 'A$', aliases: ['aud', 'a$', 'australiandollar'] },
  { code: 'CHF', perUsd: 0.88, symbol: 'CHF', aliases: ['chf', 'franc', 'francs'] },
  { code: 'CNY', perUsd: 7.1, symbol: '¥', aliases: ['cny', 'yuan', 'rmb'] },
  { code: 'INR', perUsd: 84, symbol: '₹', aliases: ['₹', 'inr', 'rupee', 'rupees'] },
  { code: 'IRR', perUsd: 42000, symbol: 'IRR', aliases: ['irr', 'rial', 'rials'] },
  { code: 'TRY', perUsd: 34, symbol: 'TRY', aliases: ['try', 'lira'] },
  { code: 'AED', perUsd: 3.67, symbol: 'AED', aliases: ['aed', 'dirham', 'dirhams'] },
  { code: 'MXN', perUsd: 20, symbol: 'MX$', aliases: ['mxn', 'peso', 'pesos'] },
  { code: 'BRL', perUsd: 5.8, symbol: 'R$', aliases: ['brl', 'real', 'reais'] },
];

/** The currency codes the scratchpad understands, for the help panel. */
export const CURRENCY_CODES: string[] = CURRENCIES.map((entry) => entry.code);

let registered = false;

/** Idempotent: the module graph can reach this from more than one entry. */
export const installCurrencies = (): void => {
  if (registered) return;
  registered = true;
  for (const entry of CURRENCIES) {
    registerCurrency(entry.code, entry.perUsd, entry.symbol, entry.aliases);
  }
};

installCurrencies();
