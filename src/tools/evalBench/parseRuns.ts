/**
 * Turning a pasted block of text into separate runs.
 *
 * The separator is a line of three or more dashes and nothing else. Three
 * dashes rather than a blank line, because answers contain blank lines all
 * the time — JSON gets pretty-printed, prose has paragraphs — and a
 * separator that appears inside the thing it separates is not a separator.
 */

const SEPARATOR = /^\s*-{3,}\s*$/;

export const splitRuns = (source: string): string[] =>
  source
    .split(/\r?\n/)
    .reduce<string[][]>(
      (blocks, line) => {
        if (SEPARATOR.test(line)) {
          blocks.push([]);
          return blocks;
        }
        blocks[blocks.length - 1]?.push(line);
        return blocks;
      },
      [[]]
    )
    .map((lines) => lines.join('\n').trim())
    // A trailing separator, or two in a row, should not count as a run
    // that failed everything.
    .filter((block) => block.length > 0);

/** What the box starts with, so the panel is useful before anything is typed. */
export const EXAMPLE_RUNS = [
  '{"ayah": 22, "word": "الأرض"}',
  '---',
  '{"ayah": 300, "word": "الأرض"}',
  '---',
  '```json',
  '{"ayah": 22}',
  '```',
].join('\n');
