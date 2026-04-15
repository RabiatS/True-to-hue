import { useCallback, useEffect, useState } from 'react';
import ApiKeyModal from './components/ApiKeyModal';
import LandingPage from './components/LandingPage';
import StudioPage from './components/StudioPage';
import {
  generateTheme,
  hasGenerationRouteConfigured,
  isQuickTestModeInput,
  ThemeData
} from './services/themeService';
import { hasUserApiKey } from './services/userApiSettings';

export default function App() {
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [routeOk, setRouteOk] = useState<boolean | null>(null);

  const refreshRouteStatus = useCallback(() => {
    hasGenerationRouteConfigured().then(setRouteOk);
  }, []);

  useEffect(() => {
    refreshRouteStatus();
  }, [refreshRouteStatus]);

  const handleGenerate = async (appName: string, appDesc: string, colorPrefs: string, mode: string, images: string[]) => {
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
    } catch (error) {
      console.error('Failed to generate theme:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate theme. Please try again.';
      alert(message);
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

  return (
    <>
      <button
        type="button"
        onClick={() => setApiModalOpen(true)}
        className="fixed top-3 right-3 z-50 font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-2 border border-white/20 bg-black/50 text-[#e8e8e3] hover:bg-black/70 backdrop-blur-sm"
      >
        {hasUserApiKey() ? 'API key · set' : 'API key'}
      </button>

      {routeOk === false ? (
        <div className="fixed top-3 left-3 right-28 z-40 font-mono text-[10px] sm:text-xs text-[#e8e8e3] bg-black/55 border border-white/15 px-3 py-2 backdrop-blur-sm">
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

      {theme ? (
        <StudioPage theme={theme} onReset={handleReset} />
      ) : (
        <LandingPage onGenerate={handleGenerate} isLoading={isLoading} />
      )}
    </>
  );
}
