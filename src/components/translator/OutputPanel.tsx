export default function OutputPanel({ language, result = '' }: { language: string; result?: string }) {
  return (
    <section className="translation-column" aria-labelledby="output-label">
      <div className="panel-heading">
        <h2 id="output-label" className="panel-label">{language}</h2>
      </div>
      <div className="translation-panel output-panel">
        <p role="status" className={`translation-text whitespace-pre-wrap wrap-anywhere ${result ? '' : 'text-muted-foreground'}`}>
          {result || 'Translation'}
        </p>
      </div>
    </section>
  );
}
