import { useState } from 'react';
import LandingPage from './components/LandingPage';
import StudioPage from './components/StudioPage';
import { generateTheme, ThemeData } from './services/themeService';

export default function App() {
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (appName: string, appDesc: string, colorPrefs: string, mode: string, images: string[]) => {
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

  if (theme) {
    return <StudioPage theme={theme} onReset={handleReset} />;
  }

  return <LandingPage onGenerate={handleGenerate} isLoading={isLoading} />;
}
