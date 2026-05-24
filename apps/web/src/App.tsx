import { useState, useCallback, useRef } from 'react';
import { useSession } from './store/sessionStore.js';
import { createRecorder, type Recorder } from './services/speech.js';
import { parse, transcribe } from './services/api.js';
import { saveTransaction, resolveAndSaveTags, readAllTagIds } from './services/db.js';
import { isClarification, isQueryResult } from '@pbai/shared';
import { MicButton } from './components/MicButton.js';
import { ModeSwitch } from './components/ModeSwitch.js';
import { TagChips } from './components/TagChips.js';
import { TransactionPreview } from './components/TransactionPreview.js';
import { ClarificationPrompt } from './components/ClarificationPrompt.js';
import { QueryResultView } from './components/QueryResultView.js';
import { QueryDetailView } from './components/QueryDetailView.js';

const API_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL ?? '(not set)';
const COMMIT_SHA = (import.meta as unknown as { env: Record<string, string> }).env.VITE_COMMIT_SHA ?? 'dev';

export default function App() {
  const session = useSession();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const recorderRef = useRef<Recorder | null>(null);
  const [mode, setMode] = useState<'expense' | 'income'>('expense');
  const [showSalvato, setShowSalvato] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const dbg = (msg: string) =>
    setDebugLog((prev) => [`${new Date().toISOString().slice(11, 19)} ${msg}`, ...prev].slice(0, 8));

  const handleMicPress = useCallback(async () => {
    if (session.state === 'processing' || session.state === 'recording') return;
    if (recorderRef.current) return;
    dbg('mic press');
    try {
      const recorder = await createRecorder();
      recorder.start();
      recorderRef.current = recorder;
      session.setState('recording');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dbg(`mic ERR: ${msg.slice(0, 60)}`);
      session.setState('idle');
    }
  }, [session]);

  const handleMicRelease = useCallback(async () => {
    if (!recorderRef.current) return;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    session.setState('processing');
    try {
      const blob = await recorder.stop();
      const transcript = await transcribe(blob);
      dbg(`transcript: "${transcript.slice(0, 40)}"`);
      const tags = await readAllTagIds();
      const response = await parse({
        text: transcript,
        partial: useSession.getState().partial ?? undefined,
        mode,
        tags,
        today: Date.now(),
      });
      dbg(`response: ${JSON.stringify(response).slice(0, 60)}`);
      if (isQueryResult(response)) {
        session.setQueryResult(response);
        session.setState('query_result');
      } else if (isClarification(response)) {
        session.setPartial(response.partial);
        session.setClarification(response.clarification);
        session.setState('clarification');
      } else {
        session.setPartial(response);
        setSelectedTags(response.tag);
        session.setState('preview');
      }
    } catch (err) {
      console.error('Error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      dbg(`ERR: ${msg.slice(0, 80)}`);
      session.setState('idle');
    }
  }, [session, mode]);

  const handleOk = useCallback(async () => {
    if (showSalvato) return;
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
    setShowSalvato(true);
    setTimeout(() => setShowSalvato(false), 2000);
  }, [session, selectedTags, showSalvato]);

  const handleCancel = useCallback(() => {
    recorderRef.current = null;
    session.reset();
    setSelectedTags([]);
    setMode('expense');
  }, [session]);

  const showActions = session.state === 'preview';

  return (
    <div
      className="min-h-screen flex flex-col items-center max-w-sm mx-auto font-ui"
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, #ffffff 0%, #e8e8e8 100%)',
      }}
    >
      {/* Header row: status dot + commit SHA */}
      <div className="flex items-center justify-between w-full pt-4 px-6 h-8">
      <div className="flex items-center gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            session.state === 'recording' ? 'bg-pbai-expense animate-pulse' : 'bg-pbai-dim'
          }`}
        />
        <span className="font-ui text-[10px] uppercase tracking-widest text-pbai-dim">
          {session.state}
        </span>
      </div>
      <span className="font-mono text-[10px] text-pbai-dim">{COMMIT_SHA}</span>
      </div>

      {/* Mode switch */}
      <div className="mt-3">
        <ModeSwitch mode={mode} onChange={setMode} />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full px-6">
        {session.state === 'idle' && (
          showSalvato ? (
            <p className="font-display italic text-[40px] leading-none text-pbai-dim animate-fade-up">
              SALVATO
            </p>
          ) : (
            <p className="font-ui text-[11px] uppercase tracking-widest text-pbai-dim text-center leading-relaxed">
              Tieni premuto il microfono<br />per registrare una spesa
            </p>
          )
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

        {session.state === 'query_result' && session.queryResult && (
          <QueryResultView
            queryResult={session.queryResult}
            onDetail={() => session.setState('query_detail')}
          />
        )}

        {session.state === 'query_detail' && session.queryResult && (
          <QueryDetailView
            queryResult={session.queryResult}
            onBack={() => session.setState('query_result')}
          />
        )}
      </div>

      {/* DEBUG BOX */}
      <div
        className="w-full px-4 pb-4 text-[10px] font-mono"
        style={{ color: '#888', borderTop: '1px solid #e0e0e0' }}
      >
        <div className="flex items-center justify-between pt-2 pb-1">
          <span className="font-bold">DEBUG</span>
          <button
            onClick={() => {
              const text = [`api: ${API_URL}`, `state: ${session.state}`, ...debugLog].join('\n');
              navigator.clipboard.writeText(text);
            }}
            style={{ color: '#aaa' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
        <div>api: {API_URL}</div>
        <div>state: {session.state}</div>
        {debugLog.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center w-full pb-12">
        {showActions ? (
          <div className="flex items-center justify-between w-full max-w-xs px-8">
            <button
              onClick={handleCancel}
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
              onClick={handleOk}
              disabled={session.state !== 'preview'}
              aria-label="Salva"
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
              style={{
                border: session.state === 'preview' ? '1.5px solid #c9a84c' : '1.5px solid #d6d0c8',
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
