import { useState, useCallback } from 'react';
import { useSession } from './store/sessionStore.js';
import { startTranscription } from './services/speech.js';
import { parse } from './services/api.js';
import { saveTransaction, resolveAndSaveTags } from './services/db.js';
import { isClarification } from '@pbai/shared';
import { MicButton } from './components/MicButton.js';
import { ModeSwitch } from './components/ModeSwitch.js';
import { TagChips } from './components/TagChips.js';
import { TransactionPreview } from './components/TransactionPreview.js';
import { ClarificationPrompt } from './components/ClarificationPrompt.js';

export default function App() {
  const session = useSession();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [stopRecognition, setStopRecognition] = useState<(() => void) | null>(null);
  const [mode, setMode] = useState<'expense' | 'income'>('expense');

  const handleMicPress = useCallback(() => {
    if (session.state === 'processing') return;

    session.setState('recording');

    const stop = startTranscription({
      onResult: async (transcript) => {
        session.setState('processing');

        const response = await parse({
          text: transcript,
          partial: session.partial ?? undefined,
          mode,
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
  }, [session, mode]);

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
    setMode('expense');
  }, [session, selectedTags]);

  const handleCancel = useCallback(() => {
    stopRecognition?.();
    session.reset();
    setSelectedTags([]);
    setMode('expense');
  }, [session, stopRecognition]);

  const hasPartial = session.state === 'preview' || session.state === 'clarification';

  return (
    <div
      className="min-h-screen flex flex-col items-center max-w-sm mx-auto font-ui"
      style={{
        background: '#fdf8f2',
        backgroundImage: 'radial-gradient(ellipse at 50% 85%, rgba(176,125,72,.04) 0%, transparent 70%)',
      }}
    >
      {/* Status dot */}
      <div className="flex items-center gap-2 pt-4 px-6 self-start h-8">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            session.state === 'recording' ? 'bg-pbai-expense animate-pulse' : 'bg-pbai-dim'
          }`}
        />
        <span className="font-ui text-[10px] uppercase tracking-widest text-pbai-dim">
          {session.state}
        </span>
      </div>

      {/* Mode switch */}
      <div className="mt-3">
        <ModeSwitch mode={mode} onChange={setMode} />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full px-6">
        {session.state === 'idle' && (
          <p className="font-ui text-[11px] uppercase tracking-widest text-pbai-dim text-center leading-relaxed">
            Tieni premuto il microfono<br />per registrare una spesa
          </p>
        )}

        {session.state === 'recording' && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pbai-expense animate-pulse" />
            <span className="font-ui text-[11px] uppercase tracking-widest text-pbai-muted">
              In ascolto
            </span>
          </div>
        )}

        {session.state === 'processing' && (
          <p className="font-ui text-[11px] uppercase tracking-widest text-pbai-dim">Elaboro</p>
        )}

        {session.state === 'preview' && session.partial?.titolo && session.partial?.importo != null && (
          <>
            <TransactionPreview
              titolo={session.partial.titolo}
              importo={session.partial.importo}
              mode={mode}
            />
            <TagChips
              tags={session.partial.tag ?? []}
              selected={selectedTags}
              onChange={setSelectedTags}
            />
          </>
        )}

        {session.state === 'clarification' && session.clarification && (
          <ClarificationPrompt question={session.clarification} />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center w-full pb-12">
        {hasPartial ? (
          <div className="flex items-center justify-between w-full max-w-xs px-8">
            <button
              onClick={handleCancel}
              aria-label="Annulla"
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ border: '1.5px solid #e8d8c4' }}
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
              onClick={handleOk}
              disabled={session.state !== 'preview'}
              aria-label="Salva"
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
              style={{
                border: session.state === 'preview' ? '1.5px solid #b07d48' : '1.5px solid #e8d8c4',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-5 h-5 ${session.state === 'preview' ? 'text-pbai-accent' : 'text-pbai-dim'}`}
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
        ) : (
          <MicButton
            sessionState={session.state}
            onPress={handleMicPress}
            onRelease={handleMicRelease}
          />
        )}
      </div>
    </div>
  );
}
