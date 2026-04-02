export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export function getLuminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(hex1: string, hex2: string) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export type VisionType = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export function simulateColorBlindness(hex: string, type: VisionType): string {
  if (type === 'normal') return hex;
  
  const { r, g, b } = hexToRgb(hex);
  let newR = r, newG = g, newB = b;

  if (type === 'protanopia') {
    newR = 0.567 * r + 0.433 * g + 0 * b;
    newG = 0.558 * r + 0.442 * g + 0 * b;
    newB = 0 * r + 0.242 * g + 0.758 * b;
  } else if (type === 'deuteranopia') {
    newR = 0.625 * r + 0.375 * g + 0 * b;
    newG = 0.7 * r + 0.3 * g + 0 * b;
    newB = 0 * r + 0.3 * g + 0.7 * b;
  } else if (type === 'tritanopia') {
    newR = 0.95 * r + 0.05 * g + 0 * b;
    newG = 0 * r + 0.433 * g + 0.567 * b;
    newB = 0 * r + 0.475 * g + 0.525 * b;
  } else if (type === 'achromatopsia') {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    newR = gray;
    newG = gray;
    newB = gray;
  }

  return rgbToHex(
    Math.min(255, Math.max(0, Math.round(newR))),
    Math.min(255, Math.max(0, Math.round(newG))),
    Math.min(255, Math.max(0, Math.round(newB)))
  );
}
