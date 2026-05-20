import { useState, useCallback } from 'react';
import { useSession } from './store/sessionStore.js';
import { startTranscription } from './services/speech.js';
import { parse } from './services/api.js';
import { saveTransaction, resolveAndSaveTags } from './services/db.js';
import { isClarification } from '@pbai/shared';
import { MicButton } from './components/MicButton.js';
import { TagChips } from './components/TagChips.js';
import { TransactionPreview } from './components/TransactionPreview.js';
import { ClarificationPrompt } from './components/ClarificationPrompt.js';

export default function App() {
  const session = useSession();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [stopRecognition, setStopRecognition] = useState<(() => void) | null>(null);

  const handleMicPress = useCallback(() => {
    if (session.state === 'processing') return;

    session.setState('recording');

    const stop = startTranscription({
      onResult: async (transcript) => {
        session.setState('processing');

        const response = await parse({
          text: transcript,
          partial: session.partial ?? undefined,
        });

        if (isClarification(response)) {
          session.setClarification(response.clarification);
          session.setState('clarification');
        } else {
          session.setPartial(response);
          setSelectedTags(response.tag);
          session.setState('preview');
        }
      },
      onEnd: () => {
        if (session.state === 'recording') session.setState('processing');
      },
      onError: (err) => {
        console.error('Speech error:', err);
        session.setState('idle');
      },
    });

    setStopRecognition(() => stop);
  }, [session]);

  const handleMicRelease = useCallback(() => {
    stopRecognition?.();
  }, [stopRecognition]);

  const handleOk = useCallback(async () => {
    if (!session.partial?.titolo || session.partial?.importo == null) return;

    const tag_ids = await resolveAndSaveTags(selectedTags);
    await saveTransaction({
      id: `${crypto.randomUUID()}-${Date.now()}`,
      titolo: session.partial.titolo,
      importo: session.partial.importo,
      data: Date.now(),
      tag_ids,
    });

    session.reset();
    setSelectedTags([]);
  }, [session, selectedTags]);

  const handleCancel = useCallback(() => {
    stopRecognition?.();
    session.reset();
    setSelectedTags([]);
  }, [session, stopRecognition]);

  const hasPartial = session.state === 'preview' || session.state === 'clarification';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-between p-6 max-w-sm mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">
        {session.state === 'preview' && session.partial?.titolo && session.partial?.importo != null && (
          <>
            <TransactionPreview titolo={session.partial.titolo} importo={session.partial.importo} />
            <TagChips tags={session.partial.tag ?? []} selected={selectedTags} onChange={setSelectedTags} />
          </>
        )}

        {session.state === 'clarification' && session.clarification && (
          <ClarificationPrompt question={session.clarification} />
        )}

        {session.state === 'idle' && (
          <p className="text-gray-400 text-sm">Tieni premuto il microfono per registrare una spesa</p>
        )}
      </div>

      <div className="flex items-center justify-between w-full max-w-xs mt-8">
        <button
          onClick={handleCancel}
          disabled={!hasPartial}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-opacity ${
            hasPartial ? 'text-red-500 bg-red-50' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Annulla"
        >
          ✕
        </button>

        <MicButton
          sessionState={session.state}
          onPress={handleMicPress}
          onRelease={handleMicRelease}
        />

        <button
          onClick={handleOk}
          disabled={session.state !== 'preview'}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-opacity ${
            session.state === 'preview' ? 'text-green-600 bg-green-50' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Salva"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
