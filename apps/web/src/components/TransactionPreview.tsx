interface Props {
  titolo: string;
  importo: number;
  mode: 'expense' | 'income';
}

export function TransactionPreview({ titolo, importo, mode }: Props) {
  const [intPart, decPart] = importo.toFixed(2).split('.');
  const sign = mode === 'expense' ? '−' : '+';
  const signColor = mode === 'expense' ? '#c0392b' : '#27ae60';

  return (
    <div className="text-center animate-fade-up">
      <p className="font-ui text-[10px] uppercase tracking-widest text-pbai-muted">{titolo}</p>
      <div className="w-7 h-px bg-pbai-border mx-auto my-2" />
      <p className="font-display italic text-[64px] leading-none text-pbai-text">
        <span className="font-ui not-italic text-[0.58em] align-middle" style={{ color: signColor }}>
          {sign}
        </span>
        {intPart}
        <span className="text-[0.48em] align-super">.{decPart}</span>
        <span className="font-ui not-italic text-[0.21em] text-pbai-accent align-super">€</span>
      </p>
    </div>
  );
}
