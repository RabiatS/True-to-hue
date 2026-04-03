import { ThemeData, ThemeVariation } from '../services/themeService';

// Helper to convert hex to rgb
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function camelCase(text: string) {
  return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

export function generateExportFiles(
  theme: ThemeData,
  selectedPrimary: ThemeVariation,
  selectedSecondary: ThemeVariation,
  displayFont: { name: string, stack: string },
  bodyFont: { name: string, stack: string }
) {
  // Flatten all colors into a standard format
  const allColors: { name: string, slug: string, camel: string, hex: string, rgb: {r:number, g:number, b:number} }[] = [];

  const addColor = (prefix: string, name: string, hex: string) => {
    const fullName = prefix ? `${prefix} ${name}` : name;
    const slug = slugify(fullName);
    const camel = camelCase(fullName);
    allColors.push({ name: fullName, slug, camel, hex, rgb: hexToRgb(hex) });
  };

  theme.palette.backgrounds.forEach(c => addColor('bg', c.name, c.hex));
  theme.palette.text.forEach(c => addColor('text', c.name, c.hex));
  theme.palette.primary.forEach(c => addColor('primary', c.name, c.hex));
  theme.palette.secondary.forEach(c => addColor('secondary', c.name, c.hex));
  
  addColor('accent', selectedPrimary.name, selectedPrimary.hex);
  addColor('accent dark', selectedPrimary.name, selectedPrimary.darkHex);
  addColor('accent light', selectedPrimary.name, selectedPrimary.lightHex);
  addColor('accent bg', selectedPrimary.name, selectedPrimary.bgHex);
  
  addColor('secondary accent', selectedSecondary.name, selectedSecondary.hex);

  // 1. tokens.css
  const css = `:root {\n${allColors.map(c => `  --color-${c.slug}: ${c.hex};`).join('\n')}\n  --font-display: ${displayFont.stack};\n  --font-body: ${bodyFont.stack};\n}`;

  // 2. tokens.scss
  const scss = `${allColors.map(c => `$color-${c.slug}: ${c.hex};`).join('\n')}\n$font-display: ${displayFont.stack};\n$font-body: ${bodyFont.stack};`;

  // 3. tokens.js
  const js = `export const tokens = {\n  colors: {\n${allColors.map(c => `    '${c.camel}': '${c.hex}'`).join(',\n')}\n  },\n  fonts: {\n    display: "${displayFont.stack}",\n    body: "${bodyFont.stack}"\n  }\n};`;

  // 4. tailwind.config.js
  const tailwind = `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${allColors.map(c => `        '${c.slug}': '${c.hex}'`).join(',\n')}\n      },\n      fontFamily: {\n        display: [${displayFont.stack.split(',').map(s => `"${s.trim().replace(/"/g, '').replace(/'/g, '')}"`).join(', ')}],\n        body: [${bodyFont.stack.split(',').map(s => `"${s.trim().replace(/"/g, '').replace(/'/g, '')}"`).join(', ')}]\n      }\n    }\n  }\n}`;

  // 5. tokens.w3c.json (Figma / DTCG)
  const w3c = {
    color: allColors.reduce((acc, c) => {
      acc[c.camel] = { $value: c.hex, $type: "color" };
      return acc;
    }, {} as any),
    font: {
      display: { $value: displayFont.stack, $type: "fontFamily" },
      body: { $value: bodyFont.stack, $type: "fontFamily" }
    }
  };

  // 6. tokens.studio.json (Tokens Studio)
  const studio = {
    global: {
      ...allColors.reduce((acc, c) => {
        acc[c.camel] = { value: c.hex, type: "color" };
        return acc;
      }, {} as any),
      fontDisplay: { value: displayFont.stack, type: "fontFamilies" },
      fontBody: { value: bodyFont.stack, type: "fontFamilies" }
    }
  };

  // 7. colors.android.xml
  const android = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${allColors.map(c => `    <color name="${c.slug.replace(/-/g, '_')}">${c.hex.replace('#', '#FF')}</color>`).join('\n')}\n</resources>`;

  // 8. Colors.swift
  const swift = `import SwiftUI\n\nextension Color {\n${allColors.map(c => `    static let ${c.camel} = Color(hex: "${c.hex}")`).join('\n')}\n}\n\n// Helper for hex initialization\nextension Color {\n    init(hex: String) {\n        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)\n        var int: UInt64 = 0\n        Scanner(string: hex).scanHexInt64(&int)\n        let a, r, g, b: UInt64\n        switch hex.count {\n        case 3: // RGB (12-bit)\n            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)\n        case 6: // RGB (24-bit)\n            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)\n        case 8: // ARGB (32-bit)\n            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)\n        default:\n            (a, r, g, b) = (1, 1, 1, 0)\n        }\n        self.init(\n            .sRGB,\n            red: Double(r) / 255,\n            green: Double(g) / 255,\n            blue:  Double(b) / 255,\n            opacity: Double(a) / 255\n        )\n    }\n}`;

  // 9. palette.csv
  const csv = `Name,Slug,Hex,R,G,B\n${allColors.map(c => `"${c.name}","${c.slug}",${c.hex},${c.rgb.r},${c.rgb.g},${c.rgb.b}`).join('\n')}`;

  // 10. palette.ase (Adobe Swatch Exchange)
  const createASE = () => {
    let totalSize = 12;
    allColors.forEach(c => {
      totalSize += 26 + (c.name.length + 1) * 2;
    });

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    let offset = 0;

    // Header
    view.setUint8(offset++, 'A'.charCodeAt(0));
    view.setUint8(offset++, 'S'.charCodeAt(0));
    view.setUint8(offset++, 'E'.charCodeAt(0));
    view.setUint8(offset++, 'F'.charCodeAt(0));
    view.setUint16(offset, 1); offset += 2;
    view.setUint16(offset, 0); offset += 2;
    view.setUint32(offset, allColors.length); offset += 4;

    // Colors
    allColors.forEach(c => {
      view.setUint16(offset, 1); offset += 2; // Block type: Color
      const nameLen = c.name.length + 1;
      const blockLen = 2 + nameLen * 2 + 4 + 12 + 2;
      view.setUint32(offset, blockLen); offset += 4;

      view.setUint16(offset, nameLen); offset += 2;
      for (let i = 0; i < c.name.length; i++) {
        view.setUint16(offset, c.name.charCodeAt(i)); offset += 2;
      }
      view.setUint16(offset, 0); offset += 2; // Null terminator

      view.setUint8(offset++, 'R'.charCodeAt(0));
      view.setUint8(offset++, 'G'.charCodeAt(0));
      view.setUint8(offset++, 'B'.charCodeAt(0));
      view.setUint8(offset++, ' '.charCodeAt(0));

      view.setFloat32(offset, c.rgb.r / 255); offset += 4;
      view.setFloat32(offset, c.rgb.g / 255); offset += 4;
      view.setFloat32(offset, c.rgb.b / 255); offset += 4;

      view.setUint16(offset, 2); offset += 2; // Normal
    });

    return new Uint8Array(buffer);
  };

  return [
    { name: 'tokens.css', content: css },
    { name: 'tokens.scss', content: scss },
    { name: 'tokens.js', content: js },
    { name: 'tailwind.config.js', content: tailwind },
    { name: 'tokens.w3c.json', content: JSON.stringify(w3c, null, 2) },
    { name: 'tokens.studio.json', content: JSON.stringify(studio, null, 2) },
    { name: 'colors.android.xml', content: android },
    { name: 'Colors.swift', content: swift },
    { name: 'palette.csv', content: csv },
    { name: 'palette.ase', content: createASE(), isBinary: true }
  ];
}
