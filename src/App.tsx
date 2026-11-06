import { useCallback, useEffect, useState } from 'react';
import ApiKeyModal from './components/ApiKeyModal';
import HistoryPanel from './components/HistoryPanel';
import LandingPage from './components/LandingPage';
import StudioPage from './components/StudioPage';
import {
  generateTheme,
  hasGenerationRouteConfigured,
  isQuickTestModeInput,
  ThemeData
} from './services/themeService';
import { addToHistory, loadHistory } from './services/themeHistory';
import { hasUserApiKey } from './services/userApiSettings';

export default function App() {
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [routeOk, setRouteOk] = useState<boolean | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);

  const refreshRouteStatus = useCallback(() => {
    hasGenerationRouteConfigured().then(setRouteOk);
  }, []);

  useEffect(() => {
    refreshRouteStatus();
    setHistoryCount(loadHistory().length);
  }, [refreshRouteStatus]);

  const handleGenerate = async (appName: string, appDesc: string, colorPrefs: string, mode: string, images: string[]) => {
    setGenerateError(null);

    if (!isQuickTestModeInput(appName, appDesc, colorPrefs)) {
      const ok = await hasGenerationRouteConfigured();
      if (!ok) {
        setApiModalOpen(true);
        return;
      }
    }

    setIsLoading(true);
    try {
      const generatedTheme = await generateTheme(appName, appDesc, colorPrefs, mode, images);
      setTheme(generatedTheme);
      setHistoryCount(addToHistory(generatedTheme, { appName, mode }).length);
    } catch (error) {
      console.error('Failed to generate theme:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate theme. Please try again.';
      // Shown inline rather than via alert(): browsers let users suppress
      // further dialogs, after which alert-only errors are invisible.
      setGenerateError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTheme(null);
  };

  const onApiSaved = () => {
    refreshRouteStatus();
  };

  const handleOpenHistoryEntry = (saved: ThemeData) => {
    setTheme(saved);
    setHistoryOpen(false);
    setGenerateError(null);
  };

  return (
    <>
      <div className="fixed top-3 right-3 z-50 flex gap-2">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-2 border border-white/20 bg-black/50 text-[#e8e8e3] hover:bg-black/70 backdrop-blur-sm"
        >
          {historyCount > 0 ? `History · ${historyCount}` : 'History'}
        </button>
        <button
          type="button"
          onClick={() => setApiModalOpen(true)}
          className="font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-2 border border-white/20 bg-black/50 text-[#e8e8e3] hover:bg-black/70 backdrop-blur-sm"
        >
          {hasUserApiKey() ? 'API key · set' : 'API key'}
        </button>
      </div>

      {generateError ? (
        <div
          role="alert"
          className="fixed top-3 left-3 right-3 sm:right-64 z-[60] font-mono text-[10px] sm:text-xs text-[#F5F5F0] bg-[#A81C1C]/90 border border-[#E66565]/40 px-3 py-2 backdrop-blur-sm flex items-start gap-3"
        >
          <span className="flex-1 leading-relaxed">{generateError}</span>
          <button
            type="button"
            onClick={() => setGenerateError(null)}
            aria-label="Dismiss error"
            className="shrink-0 underline underline-offset-2 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      ) : routeOk === false ? (
        <div className="fixed top-3 left-3 right-56 z-40 font-mono text-[10px] sm:text-xs text-[#e8e8e3] bg-black/55 border border-white/15 px-3 py-2 backdrop-blur-sm">
          Add an API key to generate themes on this site, or use test mode (project name starting with !test).
          <button
            type="button"
            onClick={() => setApiModalOpen(true)}
            className="ml-2 underline underline-offset-2 hover:text-white"
          >
            Open settings
          </button>
        </div>
      ) : null}

      <ApiKeyModal
        open={apiModalOpen}
        onClose={() => {
          setApiModalOpen(false);
          refreshRouteStatus();
        }}
        onSaved={onApiSaved}
      />

      <HistoryPanel
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryCount(loadHistory().length);
        }}
        onOpenEntry={handleOpenHistoryEntry}
      />

      {theme ? (
        <StudioPage theme={theme} onReset={handleReset} />
      ) : (
        <LandingPage onGenerate={handleGenerate} isLoading={isLoading} />
      )}
    </>
  );
}
