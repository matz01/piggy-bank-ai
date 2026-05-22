interface Props {
  question: string;
}

export function ClarificationPrompt({ question }: Props) {
  return (
    <div className="text-center px-4 animate-fade-up">
      <p className="font-display italic text-[36px] leading-snug text-pbai-text">{question}</p>
      <p className="font-ui text-[9px] uppercase tracking-widest text-pbai-dim mt-3">
        Tieni premuto il microfono per rispondere
      </p>
    </div>
  );
}
