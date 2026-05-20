interface Props {
  sessionState: 'idle' | 'recording' | 'processing' | 'preview' | 'clarification';
  onPress: () => void;
  onRelease: () => void;
}

const stateClass: Record<Props['sessionState'], string> = {
  idle: 'bg-white border-gray-300',
  recording: 'bg-red-500 border-red-600 scale-110',
  processing: 'bg-gray-300 border-gray-400 animate-pulse',
  preview: 'bg-white border-gray-300',
  clarification: 'bg-white border-gray-300',
};

export function MicButton({ sessionState, onPress, onRelease }: Props) {
  const isProcessing = sessionState === 'processing';

  return (
    <button
      role="button"
      aria-label="Microfono"
      aria-busy={isProcessing}
      disabled={isProcessing}
      onPointerDown={onPress}
      onPointerUp={onRelease}
      className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all select-none touch-none ${stateClass[sessionState]}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm6 10a6 6 0 0 1-12 0H4a8 8 0 0 0 16 0h-2zm-6 8v2H9v2h6v-2h-3v-2z" />
      </svg>
    </button>
  );
}
