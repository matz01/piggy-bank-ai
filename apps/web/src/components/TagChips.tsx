interface Props {
  tags: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onAdd?: () => void;
}

export function TagChips({ tags, selected, onChange, onAdd }: Props) {
  const toggle = (tag: string) => {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggle(tag)}
          className={`px-3 py-1 rounded-[20px] font-ui text-[9px] uppercase tracking-widest transition-all ${
            !selected.includes(tag) ? 'line-through' : ''
          }`}
          style={
            selected.includes(tag)
              ? { background: 'rgba(201,168,76,.10)', border: '1px solid rgba(201,168,76,.35)', color: '#c9a84c' }
              : { border: '1px solid #d6d0c8', color: '#b2aba3' }
          }
        >
          {tag}
        </button>
      ))}
      {onAdd && (
        <button
          onClick={onAdd}
          className="px-3 py-1 rounded-[20px] font-ui text-[9px] uppercase tracking-widest transition-all"
          style={{ border: '1px dashed #b2aba3', color: '#b2aba3', background: 'transparent' }}
        >
          Aggiungi +
        </button>
      )}
    </div>
  );
}
