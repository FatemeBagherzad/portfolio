import type { Assertion } from './types';

interface GateBuilderProps {
  gates: Assertion[];
  onChange: (gates: Assertion[]) => void;
}

type Kind = Assertion['kind'];

const KIND_LABELS: Record<Kind, string> = {
  contains: 'must contain',
  excludes: 'must not contain',
  json: 'valid JSON with fields',
  maxLength: 'no longer than',
  numberWithin: 'number in range',
};

/** A fresh gate of the chosen kind, with values that do something. */
const blank = (kind: Kind): Assertion => {
  switch (kind) {
    case 'contains':
      return { kind: 'contains', value: '' };
    case 'excludes':
      return { kind: 'excludes', value: '' };
    case 'json':
      return { kind: 'json', requiredFields: [] };
    case 'maxLength':
      return { kind: 'maxLength', limit: 200, unit: 'codePoints' };
    case 'numberWithin':
      return { kind: 'numberWithin', path: '', min: 0, max: 100 };
  }
};

/**
 * The rules, editable.
 *
 * Every field carries its own label rather than relying on the row reading
 * as a sentence — a row of bare inputs is a guessing game for anyone using
 * a screen reader, and the sentence only exists visually.
 */
const GateBuilder = ({ gates, onChange }: GateBuilderProps) => {
  const replace = (index: number, gate: Assertion): void => {
    onChange(
      gates.map((entry, position) => (position === index ? gate : entry))
    );
  };

  return (
    <div className="gates">
      <ul className="gates__list">
        {gates.map((gate, index) => (
          <li className="gates__row" key={index}>
            <label className="visually-hidden" htmlFor={'gate-kind-' + index}>
              Gate {index + 1} type
            </label>
            <select
              id={'gate-kind-' + index}
              className="gates__kind"
              value={gate.kind}
              onChange={(event) =>
                replace(index, blank(event.target.value as Kind))
              }
            >
              {Object.entries(KIND_LABELS).map(([kind, label]) => (
                <option value={kind} key={kind}>
                  {label}
                </option>
              ))}
            </select>

            {(gate.kind === 'contains' || gate.kind === 'excludes') && (
              <input
                className="gates__value"
                type="text"
                aria-label={'Text the answer ' + KIND_LABELS[gate.kind]}
                placeholder="text to look for"
                value={gate.value}
                onChange={(event) =>
                  replace(index, { ...gate, value: event.target.value })
                }
              />
            )}

            {gate.kind === 'json' && (
              <input
                className="gates__value"
                type="text"
                aria-label="Required fields, separated by commas"
                placeholder="ayah, word  (comma separated, blank for any)"
                value={gate.requiredFields.join(', ')}
                onChange={(event) =>
                  replace(index, {
                    ...gate,
                    requiredFields: event.target.value
                      .split(',')
                      .map((field) => field.trim())
                      .filter(Boolean),
                  })
                }
              />
            )}

            {gate.kind === 'maxLength' && (
              <>
                <input
                  className="gates__number"
                  type="number"
                  min={1}
                  aria-label="Maximum length"
                  value={gate.limit}
                  onChange={(event) =>
                    replace(index, {
                      ...gate,
                      limit: Number(event.target.value) || 0,
                    })
                  }
                />
                <label
                  className="visually-hidden"
                  htmlFor={'gate-unit-' + index}
                >
                  Unit for gate {index + 1}
                </label>
                <select
                  id={'gate-unit-' + index}
                  className="gates__kind"
                  value={gate.unit}
                  onChange={(event) =>
                    replace(index, {
                      ...gate,
                      unit: event.target.value as 'utf16' | 'codePoints',
                    })
                  }
                >
                  <option value="codePoints">code points</option>
                  <option value="utf16">UTF-16 units</option>
                </select>
              </>
            )}

            {gate.kind === 'numberWithin' && (
              <>
                <input
                  className="gates__value"
                  type="text"
                  aria-label="Field to check, as a dotted path"
                  placeholder="field, e.g. ayah"
                  value={gate.path}
                  onChange={(event) =>
                    replace(index, { ...gate, path: event.target.value })
                  }
                />
                <input
                  className="gates__number"
                  type="number"
                  aria-label="Smallest allowed value"
                  value={gate.min}
                  onChange={(event) =>
                    replace(index, { ...gate, min: Number(event.target.value) })
                  }
                />
                <span aria-hidden="true" className="gates__to">
                  to
                </span>
                <input
                  className="gates__number"
                  type="number"
                  aria-label="Largest allowed value"
                  value={gate.max}
                  onChange={(event) =>
                    replace(index, { ...gate, max: Number(event.target.value) })
                  }
                />
              </>
            )}

            <button
              type="button"
              className="gates__remove"
              onClick={() =>
                onChange(gates.filter((_, position) => position !== index))
              }
            >
              Remove
              <span className="visually-hidden"> gate {index + 1}</span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="btn btn--ghost gates__add"
        onClick={() => onChange([...gates, blank('contains')])}
      >
        Add a gate
      </button>
    </div>
  );
};

export default GateBuilder;
