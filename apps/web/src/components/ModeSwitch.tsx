interface Props {
  mode: 'expense' | 'income';
  onChange: (mode: 'expense' | 'income') => void;
}

export function ModeSwitch({ mode, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-pbai-track rounded-full p-1">
      <button
        aria-label="Spesa"
        aria-pressed={mode === 'expense'}
        onClick={() => onChange('expense')}
        className="w-8 h-8 rounded-full font-ui font-medium text-base flex items-center justify-center transition-all"
        style={
          mode === 'expense'
            ? { background: 'rgba(192,57,43,.12)', border: '1.5px solid #c0392b', color: '#c0392b' }
            : { background: 'transparent', border: '1.5px solid transparent', color: '#c9b8a8' }
        }
      >
        −
      </button>
      <button
        aria-label="Entrata"
        aria-pressed={mode === 'income'}
        onClick={() => onChange('income')}
        className="w-8 h-8 rounded-full font-ui font-medium text-base flex items-center justify-center transition-all"
        style={
          mode === 'income'
            ? { background: 'rgba(39,174,96,.12)', border: '1.5px solid #27ae60', color: '#27ae60' }
            : { background: 'transparent', border: '1.5px solid transparent', color: '#c9b8a8' }
        }
      >
        +
      </button>
    </div>
  );
}
