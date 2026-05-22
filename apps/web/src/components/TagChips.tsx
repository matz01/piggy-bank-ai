interface Props {
  tags: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function TagChips({ tags, selected, onChange }: Props) {
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
              ? { background: 'rgba(176,125,72,.10)', border: '1px solid rgba(176,125,72,.35)', color: '#b07d48' }
              : { border: '1px solid #e8d8c4', color: '#c9b8a8' }
          }
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
