import { ThemeData, ThemeVariation } from '../services/themeService';
import { getContrastRatio, simulateColorBlindness, VisionType } from './accessibility';

export interface ContrastCheck {
  name: string;
  fgName: string;
  bgName: string;
  fgHex: string;
  bgHex: string;
  ratio: number;
  passAANormal: boolean;
  passAALarge: boolean;
  passAAANormal: boolean;
  passAAALarge: boolean;
  passUI: boolean;
}

export function runAccessibilityChecks(
  theme: ThemeData,
  selectedPrimary: ThemeVariation,
  selectedSecondary: ThemeVariation
): ContrastCheck[] {
  const checks: ContrastCheck[] = [];

  const addCheck = (name: string, fgName: string, bgName: string, fgHex: string, bgHex: string) => {
    const ratio = getContrastRatio(fgHex, bgHex);
    checks.push({
      name,
      fgName,
      bgName,
      fgHex,
      bgHex,
      ratio,
      passAANormal: ratio >= 4.5,
      passAALarge: ratio >= 3.0,
      passAAANormal: ratio >= 7.0,
      passAAALarge: ratio >= 4.5,
      passUI: ratio >= 3.0,
    });
  };

  // Find base colors
  const bgMain = theme.palette.backgrounds[0]?.hex || '#ffffff';
  const textMain = theme.palette.text[0]?.hex || '#000000';
  const textMuted = theme.palette.text[1]?.hex || '#666666';
  
  // 1. Body text on background
  addCheck('Body Text on Background', 'Primary Text', 'Main Background', textMain, bgMain);
  
  // 2. Muted text on background
  addCheck('Muted Text on Background', 'Muted Text', 'Main Background', textMuted, bgMain);
  
  // 3. Accent 1 on Background (for links/icons)
  addCheck('Primary Accent on Background', selectedPrimary.name, 'Main Background', selectedPrimary.hex, bgMain);
  
  // 4. Accent 2 on Background (for links/icons)
  addCheck('Secondary Accent on Background', selectedSecondary.name, 'Main Background', selectedSecondary.hex, bgMain);
  
  // 5. Text on Primary Accent Button
  // Determine if text should be light or dark on the button
  const lightTextRatio = getContrastRatio('#ffffff', selectedPrimary.hex);
  const darkTextRatio = getContrastRatio('#000000', selectedPrimary.hex);
  const buttonTextHex = lightTextRatio > darkTextRatio ? '#ffffff' : '#000000';
  const buttonTextName = lightTextRatio > darkTextRatio ? 'White Text' : 'Black Text';
  addCheck('Text on Primary Button', buttonTextName, selectedPrimary.name, buttonTextHex, selectedPrimary.hex);

  // 6. Text on Secondary Accent Button
  const lightTextRatioSec = getContrastRatio('#ffffff', selectedSecondary.hex);
  const darkTextRatioSec = getContrastRatio('#000000', selectedSecondary.hex);
  const buttonTextHexSec = lightTextRatioSec > darkTextRatioSec ? '#ffffff' : '#000000';
  const buttonTextNameSec = lightTextRatioSec > darkTextRatioSec ? 'White Text' : 'Black Text';
  addCheck('Text on Secondary Button', buttonTextNameSec, selectedSecondary.name, buttonTextHexSec, selectedSecondary.hex);

  // 7. Brand on Pure White
  addCheck('Primary Accent on Pure White', selectedPrimary.name, 'Pure White', selectedPrimary.hex, '#ffffff');
  
  // 8. Brand on Pure Black
  addCheck('Primary Accent on Pure Black', selectedPrimary.name, 'Pure Black', selectedPrimary.hex, '#000000');

  return checks;
}
