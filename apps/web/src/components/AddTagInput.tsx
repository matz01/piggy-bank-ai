import { useState, useEffect, useRef } from 'react';

interface Props {
  existingTagIds: string[];
  onConfirm: (tag: string) => void;
  onCancel: () => void;
}

export function AddTagInput({ existingTagIds, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sorted = [...existingTagIds].sort();
  const suggestion =
    value.length > 0
      ? (sorted.find((id) => id.startsWith(value) && id !== value) ?? null)
      : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value.toLowerCase());
  };

  const handleAcceptSuggestion = () => {
    if (suggestion) setValue(suggestion);
  };

  const handleConfirm = () => {
    const tag = value.trim();
    if (tag) onConfirm(tag);
  };

  const canConfirm = value.trim().length > 0;

  return (
    <div className="flex flex-col items-center w-full gap-6 animate-fade-up">
      <div className="flex items-center justify-between w-full max-w-xs px-8">
        <button
          onClick={onCancel}
          aria-label="Annulla"
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ border: '1.5px solid #d6d0c8' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-pbai-dim"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          aria-label="Conferma"
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
          style={{ border: canConfirm ? '1.5px solid #c9a84c' : '1.5px solid #d6d0c8' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-5 h-5 ${canConfirm ? 'text-pbai-accent' : 'text-pbai-dim'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="bg-transparent border-none outline-none text-center font-display text-4xl text-pbai-text w-full px-6"
        style={{ caretColor: '#c9a84c' }}
      />

      {suggestion && (
        <div className="flex items-center gap-2">
          <span className="font-ui text-[11px] uppercase tracking-widest text-pbai-muted">
            {suggestion}
          </span>
          <button
            onClick={handleAcceptSuggestion}
            aria-label="Accetta suggerimento"
            className="font-ui text-[13px] text-pbai-accent"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
