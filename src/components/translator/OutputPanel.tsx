import { useEffect, useState } from 'react';
import { Check, Copy, RotateCw } from 'lucide-react';

type OutputPanelProps = {
  language: string;
  result: string;
  busy: boolean;
  onRegenerate: () => void;
  canRegenerate: boolean;
};

export default function OutputPanel({
  language,
  result,
  busy,
  onRegenerate,
  canRegenerate,
}: OutputPanelProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  );
  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = setTimeout(() => setCopyState('idle'), 2500);
    return () => clearTimeout(timer);
  }, [copyState]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  return (
    <section className="translation-column" aria-labelledby="output-label">
      <div className="panel-heading">
        <h2 id="output-label" className="panel-label">
          {language}
        </h2>
      </div>
      <div className="translation-panel output-panel" aria-busy={busy}>
        <p
          className={`translation-text result-text ${result ? '' : 'text-muted-foreground'}`}
        >
          {result ||
            (busy
              ? 'Aligning strategic synergies…'
              : 'Your translation will appear here.')}
        </p>
        <div className="output-footer">
          <span role="status" className="helper-text">
            {copyState === 'copied'
              ? 'Copied!'
              : copyState === 'error'
                ? 'Could not copy. Select the text to copy manually.'
                : result
                  ? 'Last successful translation'
                  : ''}
          </span>
          <div className="flex shrink-0">
            <button
              type="button"
              className="icon-button"
              disabled={!canRegenerate || busy}
              onClick={onRegenerate}
              aria-label="Regenerate translation"
            >
              <RotateCw className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-button"
              disabled={!result || busy}
              onClick={copy}
              aria-label="Copy translation"
            >
              {copyState === 'copied' ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
