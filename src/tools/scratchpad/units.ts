/**
 * The unit table the scratchpad converts against.
 *
 * Every unit is defined by how it reaches its dimension's base unit, as
 * `base = value * factor + offset`. The offset exists for exactly one
 * dimension — temperature — and carrying it everywhere is far cheaper than
 * special-casing Celsius inside the evaluator.
 *
 * Quantities here hold a single unit rather than a vector of exponents, so
 * `65 kg in lbs` works and `9.8 m/s^2` does not. That is a deliberate
 * ceiling: full dimensional algebra is a much larger piece of machinery,
 * and nothing it buys shows up in the arithmetic people actually type.
 */

export type Dimension =
  | 'length'
  | 'mass'
  | 'temperature'
  | 'time'
  | 'data'
  | 'volume'
  | 'currency';

export interface UnitDef {
  /** Canonical id, e.g. `km`. */
  id: string;
  dimension: Dimension;
  /** Multiplier towards the dimension's base unit. */
  factor: number;
  /** Added after the multiplier. Only temperature uses it. */
  offset: number;
  /** How it is printed back. */
  symbol: string;
  /** Everything that should resolve to this unit, lower-cased. */
  names: string[];
}

const unit = (
  id: string,
  dimension: Dimension,
  factor: number,
  symbol: string,
  names: string[],
  offset = 0
): UnitDef => ({ id, dimension, factor, offset, symbol, names });

/** Rates are quoted against USD. See `rates.ts` for where they come from. */
export const CURRENCY_BASE = 'USD';

export const UNITS: UnitDef[] = [
  // --- length, base: metre ------------------------------------------------
  unit('mm', 'length', 0.001, 'mm', ['mm', 'millimetre', 'millimeter']),
  unit('cm', 'length', 0.01, 'cm', ['cm', 'centimetre', 'centimeter']),
  unit('m', 'length', 1, 'm', ['m', 'metre', 'meter']),
  unit('km', 'length', 1000, 'km', ['km', 'kilometre', 'kilometer']),
  unit('in', 'length', 0.0254, 'in', ['inch', 'inches', '"']),
  unit('ft', 'length', 0.3048, 'ft', ['ft', 'foot', 'feet', "'"]),
  unit('yd', 'length', 0.9144, 'yd', ['yd', 'yard']),
  unit('mi', 'length', 1609.344, 'mi', ['mi', 'mile']),

  // --- mass, base: kilogram -----------------------------------------------
  unit('g', 'mass', 0.001, 'g', ['g', 'gram', 'gramme']),
  unit('kg', 'mass', 1, 'kg', ['kg', 'kilo', 'kilogram', 'kilogramme']),
  unit('t', 'mass', 1000, 't', ['tonne', 'tonnes', 'metricton']),
  unit('oz', 'mass', 0.028349523125, 'oz', ['oz', 'ounce']),
  unit('lb', 'mass', 0.45359237, 'lb', ['lb', 'lbs', 'pound']),
  unit('st', 'mass', 6.35029318, 'st', ['stone']),

  // --- temperature, base: kelvin ------------------------------------------
  // F reaches kelvin as F * 5/9 + 255.372…, which is the 459.67 offset
  // already scaled — the evaluator never has to know that.
  unit('K', 'temperature', 1, 'K', ['k', 'kelvin']),
  unit('C', 'temperature', 1, '°C', ['c', 'celsius', 'centigrade', '°c'], 273.15),
  unit('F', 'temperature', 5 / 9, '°F', ['f', 'fahrenheit', '°f'], 255.3722222222222),

  // --- time, base: second --------------------------------------------------
  unit('ms', 'time', 0.001, 'ms', ['ms', 'millisecond']),
  unit('s', 'time', 1, 's', ['s', 'sec', 'second']),
  unit('min', 'time', 60, 'min', ['min', 'minute']),
  unit('h', 'time', 3600, 'h', ['h', 'hr', 'hour']),
  unit('day', 'time', 86400, 'days', ['day', 'night', 'nights']),
  unit('week', 'time', 604800, 'weeks', ['week', 'wk']),
  unit('month', 'time', 2629800, 'months', ['month', 'mo']),
  unit('year', 'time', 31557600, 'years', ['year', 'yr']),

  // --- data, base: byte ----------------------------------------------------
  // Decimal, not binary: a disk sold as 1 TB holds 10^12 bytes, and the
  // people typing this are usually reading a marketing figure.
  unit('B', 'data', 1, 'B', ['b', 'byte']),
  unit('KB', 'data', 1e3, 'KB', ['kb', 'kilobyte']),
  unit('MB', 'data', 1e6, 'MB', ['mb', 'megabyte']),
  unit('GB', 'data', 1e9, 'GB', ['gb', 'gigabyte']),
  unit('TB', 'data', 1e12, 'TB', ['tb', 'terabyte']),
  unit('KiB', 'data', 1024, 'KiB', ['kib', 'kibibyte']),
  unit('MiB', 'data', 1024 ** 2, 'MiB', ['mib', 'mebibyte']),
  unit('GiB', 'data', 1024 ** 3, 'GiB', ['gib', 'gibibyte']),

  // --- volume, base: litre -------------------------------------------------
  unit('ml', 'volume', 0.001, 'ml', ['ml', 'millilitre', 'milliliter']),
  unit('l', 'volume', 1, 'l', ['l', 'litre', 'liter']),
  unit('tsp', 'volume', 0.00492892159375, 'tsp', ['tsp', 'teaspoon']),
  unit('tbsp', 'volume', 0.01478676478125, 'tbsp', ['tbsp', 'tablespoon']),
  unit('cup', 'volume', 0.2365882365, 'cups', ['cup']),
  unit('pt', 'volume', 0.473176473, 'pt', ['pint']),
  unit('qt', 'volume', 0.946352946, 'qt', ['quart']),
  unit('gal', 'volume', 3.785411784, 'gal', ['gal', 'gallon']),
];

const index = new Map<string, UnitDef>();

const register = (definition: UnitDef): void => {
  index.set(definition.id.toLowerCase(), definition);
  for (const name of definition.names) index.set(name.toLowerCase(), definition);
};

for (const definition of UNITS) register(definition);

/** Adds the currency units once their rates are known. */
export const registerCurrency = (
  code: string,
  perBase: number,
  symbol: string,
  aliases: string[]
): void => {
  // `perBase` is "how many of this currency one base unit buys", so the
  // factor towards the base is its reciprocal.
  const definition = unit(
    code,
    'currency',
    1 / perBase,
    symbol,
    [code.toLowerCase(), ...aliases]
  );
  UNITS.push(definition);
  register(definition);
};

/**
 * Resolves a word to a unit.
 *
 * The plural fallback is what lets "3 nights" and "5 kilometres" work
 * without every entry listing both forms.
 */
export const findUnit = (name: string): UnitDef | null => {
  const key = name.toLowerCase();
  const direct = index.get(key);
  if (direct) return direct;
  if (key.endsWith('s')) {
    const singular = index.get(key.slice(0, -1));
    if (singular) return singular;
  }
  return null;
};

export const toBase = (value: number, definition: UnitDef): number =>
  value * definition.factor + definition.offset;

export const fromBase = (base: number, definition: UnitDef): number =>
  (base - definition.offset) / definition.factor;

/** Converts between two units of the same dimension. */
export const convert = (
  value: number,
  from: UnitDef,
  to: UnitDef
): number | null => {
  if (from.dimension !== to.dimension) return null;
  return fromBase(toBase(value, from), to);
};
