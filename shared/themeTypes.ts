export interface ThemeVariation {
  name: string;
  hex: string;
  description: string;
  darkHex: string;
  lightHex: string;
  bgHex: string;
}

export interface ColorChip {
  name: string;
  hex: string;
  role: string;
}

export interface PreviewCard {
  tag: string;
  title: string;
  body: string;
}

export interface ThemeData {
  themeName: string;
  description: string;
  isTestMode?: boolean;
  testModeLabel?: string;
  primaryAccentName: string;
  primaryVariations: ThemeVariation[];
  secondaryAccentName: string;
  secondaryUsageRule: string;
  secondaryVariations: ThemeVariation[];
  previewCards: PreviewCard[];
  palette: {
    backgrounds: ColorChip[];
    text: ColorChip[];
    primary: ColorChip[];
    secondary: ColorChip[];
  };
}
