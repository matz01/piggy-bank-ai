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
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selected.includes(tag)
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-500 line-through'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
