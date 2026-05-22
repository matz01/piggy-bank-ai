interface Props {
  sessionState: 'idle' | 'recording' | 'processing' | 'preview' | 'clarification';
  onPress: () => void;
  onRelease: () => void;
}

export function MicButton({ sessionState, onPress, onRelease }: Props) {
  const isProcessing = sessionState === 'processing';
  const isRecording = sessionState === 'recording';

  const button = (
    <button
      role="button"
      aria-label="Microfono"
      aria-busy={isProcessing}
      disabled={isProcessing}
      onPointerDown={onPress}
      onPointerUp={onRelease}
      style={{ opacity: isProcessing ? 0.5 : 1 }}
      className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all select-none touch-none ${
        isRecording
          ? 'bg-pbai-expense border-pbai-accent/50 animate-red-breathe'
          : 'bg-pbai-surface border-pbai-border'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-pbai-dim'}`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm6 10a6 6 0 0 1-12 0H4a8 8 0 0 0 16 0h-2zm-6 8v2H9v2h6v-2h-3v-2z" />
      </svg>
    </button>
  );

  if (!isProcessing) return button;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {button}
      <svg
        className="absolute inset-0 animate-arc-spin"
        viewBox="0 0 112 112"
        fill="none"
      >
        <circle
          cx="56"
          cy="56"
          r="52"
          stroke="#b07d48"
          strokeWidth="2"
          strokeDasharray="80 246"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
