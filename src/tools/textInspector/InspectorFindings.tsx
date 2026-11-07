import type { Inspection } from './inspect';

interface InspectorFindingsProps {
  report: Inspection;
}

/**
 * The prose half of the inspector: what the numbers above it mean, and what
 * will break because of them.
 *
 * Its own file because the homepage embed shows the counts and not this —
 * there, the point is to be short enough that the next section is still on
 * screen.
 */
const InspectorFindings = ({ report }: InspectorFindingsProps) => (
  <div className="inspector__findings">
    {report.counts.utf16 !== report.counts.graphemes && (
      <p className="inspector__finding">
        <strong>These disagree.</strong> Any index, slice or character limit
        built on <code>.length</code> will cut this text in the wrong place.
      </p>
    )}

    {report.normalisationMatters && (
      <p className="inspector__finding">
        <strong>Normalisation matters here.</strong> NFC is {report.nfcLength}{' '}
        code points, NFD is {report.nfdLength}. Two copies in different forms
        look identical and compare unequal —{' '}
        {report.isNfc
          ? 'this one is already NFC.'
          : 'this one is not NFC, so normalise before storing it.'}
      </p>
    )}

    {report.invisibles.length > 0 && (
      <p className="inspector__finding inspector__finding--warn">
        <strong>
          {report.invisibles.length} invisible character
          {report.invisibles.length === 1 ? '' : 's'}.
        </strong>{' '}
        {report.invisibles.map((entry) => entry.name).join(', ')}. These
        survive copy and paste and are a common source of &ldquo;the strings
        look the same but do not match&rdquo;.
      </p>
    )}

    {report.hasMixedDirection && (
      <p className="inspector__finding">
        <strong>Mixed direction.</strong> This has both right-to-left and
        left-to-right runs, so the visual order is not the stored order.
      </p>
    )}
  </div>
);

export default InspectorFindings;
