interface Props {
  question: string;
}

export function ClarificationPrompt({ question }: Props) {
  return (
    <div className="text-center px-4">
      <p className="text-lg text-gray-700">{question}</p>
      <p className="text-sm text-gray-400 mt-1">Tieni premuto il microfono per rispondere</p>
    </div>
  );
}
