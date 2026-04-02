import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ThemeData, ThemeVariation, ColorChip } from '../services/gemini';
import { isLight, copyToClipboard } from '../utils/colors';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { generateExportFiles } from '../utils/export';
import A11yReport from './A11yReport';
import { Sun, Moon } from 'lucide-react';

interface StudioPageProps {
  theme: ThemeData;
  onReset: () => void;
}

const displayFonts = [
  { name: 'Bebas Neue', stack: "'Bebas Neue', sans-serif" },
  { name: 'Unbounded', stack: "'Unbounded', sans-serif" },
  { name: 'Syne', stack: "'Syne', sans-serif" },
  { name: 'Rajdhani', stack: "'Rajdhani', sans-serif" },
  { name: 'Barlow Condensed', stack: "'Barlow Condensed', sans-serif" },
  { name: 'Playfair Display', stack: "'Playfair Display', serif" },
  { name: 'Space Grotesk', stack: "'Space Grotesk', sans-serif" },
  { name: 'Montserrat', stack: "'Montserrat', sans-serif" },
  { name: 'Oswald', stack: "'Oswald', sans-serif" },
  { name: 'Poppins', stack: "'Poppins', sans-serif" },
  { name: 'Righteous', stack: "'Righteous', cursive" },
  { name: 'Abril Fatface', stack: "'Abril Fatface', cursive" },
  { name: 'Cinzel', stack: "'Cinzel', serif" },
  { name: 'Libre Baskerville', stack: "'Libre Baskerville', serif" },
  { name: 'Lora', stack: "'Lora', serif" },
  { name: 'Merriweather', stack: "'Merriweather', serif" },
];

const bodyFonts = [
  { name: 'DM Mono', stack: "'DM Mono', monospace" },
  { name: 'Space Grotesk', stack: "'Space Grotesk', sans-serif" },
  { name: 'Instrument Serif', stack: "'Instrument Serif', serif" },
  { name: 'Inter', stack: "'Inter', sans-serif" },
  { name: 'Roboto', stack: "'Roboto', sans-serif" },
  { name: 'Open Sans', stack: "'Open Sans', sans-serif" },
  { name: 'Lato', stack: "'Lato', sans-serif" },
  { name: 'Nunito', stack: "'Nunito', sans-serif" },
  { name: 'Work Sans', stack: "'Work Sans', sans-serif" },
  { name: 'Lora', stack: "'Lora', serif" },
  { name: 'Merriweather', stack: "'Merriweather', serif" },
  { name: 'Montserrat', stack: "'Montserrat', sans-serif" },
  { name: 'Poppins', stack: "'Poppins', sans-serif" },
  { name: 'Libre Baskerville', stack: "'Libre Baskerville', serif" },
];

const fontPresetCombos = [
  { id: 'bebas-mono', label: 'BEBAS + MONO', display: 'Bebas Neue', body: 'DM Mono' },
  { id: 'unbounded-grotesk', label: 'UNBOUNDED + GROTESK', display: 'Unbounded', body: 'Space Grotesk' },
  { id: 'syne-mono', label: 'SYNE + MONO', display: 'Syne', body: 'DM Mono' },
  { id: 'rajdhani-serif', label: 'RAJDHANI + SERIF', display: 'Rajdhani', body: 'Instrument Serif' },
  { id: 'barlow-grotesk', label: 'BARLOW + GROTESK', display: 'Barlow Condensed', body: 'Space Grotesk' },
  { id: 'playfair-mono', label: 'PLAYFAIR + MONO', display: 'Playfair Display', body: 'DM Mono' },
];

export default function StudioPage({ theme, onReset }: StudioPageProps) {
  const recommendedFonts = getRecommendedFonts(theme);
  const [selectedPrimary, setSelectedPrimary] = useState<ThemeVariation>(theme.primaryVariations[0]);
  const [selectedSecondary, setSelectedSecondary] = useState<ThemeVariation>(theme.secondaryVariations[0]);
  const [selectedDisplayFont, setSelectedDisplayFont] = useState(recommendedFonts.display);
  const [selectedBodyFont, setSelectedBodyFont] = useState(recommendedFonts.body);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isExportingTokens, setIsExportingTokens] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--r-accent', selectedPrimary.hex);
    document.documentElement.style.setProperty('--r-accent-dark', selectedPrimary.darkHex);
    document.documentElement.style.setProperty('--r-accent-light', selectedPrimary.lightHex);
    document.documentElement.style.setProperty('--r-accent-bg', selectedPrimary.bgHex);
    
    document.documentElement.style.setProperty('--r-secondary', selectedSecondary.hex);
  }, [selectedPrimary, selectedSecondary]);

  const handleCopyHex = (hex: string, chipId: string) => {
    copyToClipboard(hex);
    setCopiedTarget(chipId);
    setTimeout(() => setCopiedTarget(null), 1500);
  };

  const generateCSS = () => {
    return `/* ================================
   ${theme.themeName.toUpperCase()} THEME v2.0
   True to Hue
   ================================ */

:root {
  /* ── BACKGROUNDS ── */
${theme.palette.backgrounds.map(c => `  --r-bg-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex}; /* ${c.role} */`).join('\n')}

  /* ── TEXT & WHITES ── */
${theme.palette.text.map(c => `  --r-text-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex}; /* ${c.role} */`).join('\n')}

  /* ── PRIMARY ── */
${theme.palette.primary.map(c => `  --r-primary-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex}; /* ${c.role} */`).join('\n')}

  /* ── SECONDARY ── */
${theme.palette.secondary.map(c => `  --r-secondary-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex}; /* ${c.role} */`).join('\n')}

  /* ── ACCENT 1 (PRIMARY) ── */
  --r-accent:       ${selectedPrimary.hex}; /* primary — ${selectedPrimary.name} */
  --r-accent-dark:  ${selectedPrimary.darkHex}; /* dark shade */
  --r-accent-light: ${selectedPrimary.lightHex}; /* light shade */
  --r-accent-bg:    ${selectedPrimary.bgHex};  /* depth (tint bg) */

  /* ── ACCENT 2 (SECONDARY/RARE) ── */
  --r-secondary-accent: ${selectedSecondary.hex}; /* ${selectedSecondary.name} */

  /* ── FONTS ── */
  --r-font-display: ${selectedDisplayFont.stack};
  --r-font-body:    ${selectedBodyFont.stack};
}`;
  };

  const handleCopyCSS = () => {
    const css = generateCSS();
    copyToClipboard(css);
    setCopiedTarget('css');
    setTimeout(() => setCopiedTarget(null), 2000);
  };

  const handleDownloadCSS = () => {
    const css = generateCSS();
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.themeName.toLowerCase().replace(/\s+/g, '-')}-theme.css`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 34;
      const contentWidth = pdfWidth - margin * 2;
      const dateText = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      let y = 56;

      const paper = isLightMode ? { r: 250, g: 250, b: 246 } : { r: 10, g: 10, b: 10 };
      const panel = isLightMode ? { r: 255, g: 255, b: 255 } : { r: 20, g: 20, b: 20 };
      const line = isLightMode ? { r: 220, g: 220, b: 220 } : { r: 52, g: 52, b: 52 };
      const text = isLightMode ? { r: 14, g: 14, b: 14 } : { r: 245, g: 245, b: 245 };
      const muted = isLightMode ? { r: 100, g: 100, b: 100 } : { r: 165, g: 165, b: 165 };

      const primary = hexToRgb(selectedPrimary.hex);
      const secondary = hexToRgb(selectedSecondary.hex);

      const setPaper = () => {
        pdf.setFillColor(paper.r, paper.g, paper.b);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      };

      const ensureSpace = (height = 24) => {
        if (y + height <= pdfHeight - margin) return;
        pdf.addPage();
        setPaper();
        y = 56;
      };

      const drawSection = (title: string, subtitle?: string) => {
        ensureSpace(42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(15);
        pdf.setTextColor(text.r, text.g, text.b);
        pdf.text(title.toUpperCase(), margin, y);
        y += 10;
        pdf.setDrawColor(line.r, line.g, line.b);
        pdf.line(margin, y, pdfWidth - margin, y);
        y += 12;
        if (subtitle) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(muted.r, muted.g, muted.b);
          const lines = pdf.splitTextToSize(subtitle, contentWidth);
          lines.forEach((lineText: string) => {
            ensureSpace(12);
            pdf.text(lineText, margin, y);
            y += 11;
          });
          y += 4;
        }
      };

      const drawParagraph = (value: string, size = 10) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(size);
        pdf.setTextColor(muted.r, muted.g, muted.b);
        const lines = pdf.splitTextToSize(value, contentWidth);
        lines.forEach((lineText: string) => {
          ensureSpace(12);
          pdf.text(lineText, margin, y);
          y += 11;
        });
        y += 4;
      };

      const drawCodeBlock = (title: string, source: string, maxLines = 18) => {
        ensureSpace(180);
        const lines = source
          .split('\n')
          .map(lineText => lineText.replace(/\t/g, '  '))
          .slice(0, maxLines);
        const blockHeight = 28 + lines.length * 10 + 10;
        ensureSpace(blockHeight + 10);

        pdf.setDrawColor(line.r, line.g, line.b);
        pdf.setFillColor(18, 18, 18);
        pdf.roundedRect(margin, y, contentWidth, blockHeight, 5, 5, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(190, 190, 190);
        pdf.text(title.toUpperCase(), margin + 10, y + 14);

        pdf.setDrawColor(48, 48, 48);
        pdf.line(margin, y + 20, margin + contentWidth, y + 20);

        pdf.setFont('courier', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(232, 232, 232);
        let codeY = y + 32;
        lines.forEach((lineText, index) => {
          const clipped = lineText.length > 100 ? `${lineText.slice(0, 100)}...` : lineText;
          const numbered = `${String(index + 1).padStart(2, '0')}  ${clipped}`;
          pdf.text(numbered, margin + 10, codeY);
          codeY += 10;
        });

        y += blockHeight + 12;
      };

      const drawSwatchGrid = (items: Array<{ label: string; hex: string; role: string }>, columns = 4) => {
        const gap = 8;
        const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
        const cardHeight = 84;
        const colorHeight = 48;
        let col = 0;

        items.forEach((item) => {
          if (col === 0) ensureSpace(cardHeight + 10);
          const x = margin + col * (cardWidth + gap);
          const top = y;
          const rgb = hexToRgb(item.hex);

          pdf.setDrawColor(line.r, line.g, line.b);
          pdf.setFillColor(panel.r, panel.g, panel.b);
          pdf.roundedRect(x, top, cardWidth, cardHeight, 4, 4, 'FD');
          pdf.setFillColor(rgb.r, rgb.g, rgb.b);
          pdf.roundedRect(x + 1, top + 1, cardWidth - 2, colorHeight, 3, 3, 'F');

          const colorText = isLight(item.hex) ? 16 : 242;
          pdf.setTextColor(colorText, colorText, colorText);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.text(item.hex.toUpperCase(), x + 6, top + 41);

          pdf.setTextColor(text.r, text.g, text.b);
          pdf.setFontSize(8);
          pdf.text(item.label, x + 6, top + colorHeight + 14);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(muted.r, muted.g, muted.b);
          pdf.setFontSize(7);
          const role = pdf.splitTextToSize(item.role, cardWidth - 10)[0] || '';
          pdf.text(role, x + 6, top + colorHeight + 25);

          col += 1;
          if (col === columns) {
            col = 0;
            y += cardHeight + 10;
          }
        });
        if (col !== 0) y += cardHeight + 10;
      };

      const coverBg = { r: 8, g: 8, b: 8 };
      pdf.setFillColor(coverBg.r, coverBg.g, coverBg.b);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      pdf.setFillColor(primary.r, primary.g, primary.b);
      pdf.rect(0, 0, 18, pdfHeight, 'F');

      const titleWordOne = theme.themeName.split(' ')[0] || theme.themeName;
      const titleWordTwo = theme.themeName.split(' ').slice(1).join(' ') || 'Theme';
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(92, 92, 92);
      pdf.text('TRUE TO HUE · V2.0', margin, 54);

      pdf.setFontSize(74);
      pdf.setTextColor(255, 255, 255);
      pdf.text(titleWordOne.toUpperCase(), margin, 130);
      pdf.setTextColor(primary.r, primary.g, primary.b);
      pdf.text(titleWordTwo.toUpperCase(), margin, 198);
      pdf.setTextColor(255, 255, 255);
      pdf.text('THEME', margin, 266);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(170, 170, 170);
      const coverLines = pdf.splitTextToSize(theme.description, contentWidth - 10);
      pdf.text(coverLines, margin, 328);
      pdf.text(`Generated ${dateText}`, margin, pdfHeight - 36);

      pdf.addPage();
      setPaper();
      y = 56;

      drawSection('Brand Usage Preview', 'How headings, buttons, accents, and UI blocks should appear in context.');
      ensureSpace(220);
      pdf.setDrawColor(line.r, line.g, line.b);
      pdf.setFillColor(panel.r, panel.g, panel.b);
      pdf.roundedRect(margin, y, contentWidth, 205, 5, 5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(muted.r, muted.g, muted.b);
      pdf.text('HEADING', margin + 12, y + 18);
      pdf.text('CTA BUTTON', margin + 12, y + 88);
      pdf.text('SECONDARY BUTTON', margin + 200, y + 88);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(34);
      pdf.setTextColor(primary.r, primary.g, primary.b);
      pdf.text(titleWordOne.toUpperCase(), margin + 12, y + 58);
      pdf.setTextColor(text.r, text.g, text.b);
      pdf.text(titleWordTwo.toUpperCase(), margin + 220, y + 58);

      pdf.setFillColor(primary.r, primary.g, primary.b);
      pdf.roundedRect(margin + 12, y + 98, 172, 34, 4, 4, 'F');
      const primaryBtnText = isLight(selectedPrimary.hex) ? 22 : 244;
      pdf.setTextColor(primaryBtnText, primaryBtnText, primaryBtnText);
      pdf.setFontSize(10);
      pdf.text('CONTACT', margin + 72, y + 120, { align: 'center' });

      pdf.setDrawColor(secondary.r, secondary.g, secondary.b);
      pdf.roundedRect(margin + 200, y + 98, 172, 34, 4, 4, 'S');
      pdf.setTextColor(secondary.r, secondary.g, secondary.b);
      pdf.text('GET IN TOUCH', margin + 286, y + 120, { align: 'center' });

      pdf.setTextColor(muted.r, muted.g, muted.b);
      pdf.setFontSize(8);
      pdf.text('Preview cards', margin + 12, y + 158);
      const cardWidth = (contentWidth - 34) / 3;
      theme.previewCards.slice(0, 3).forEach((card, index) => {
        const cardX = margin + 12 + index * (cardWidth + 5);
        pdf.setDrawColor(line.r, line.g, line.b);
        pdf.setFillColor(isLightMode ? 248 : 28, isLightMode ? 248 : 28, isLightMode ? 248 : 28);
        pdf.roundedRect(cardX, y + 164, cardWidth, 34, 3, 3, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(primary.r, primary.g, primary.b);
        pdf.text(card.tag.toUpperCase(), cardX + 6, y + 176);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(text.r, text.g, text.b);
        const c = card.title.length > 26 ? `${card.title.slice(0, 26)}...` : card.title;
        pdf.text(c, cardX + 6, y + 188);
      });
      y += 220;

      ensureSpace(166);
      pdf.setDrawColor(line.r, line.g, line.b);
      pdf.setFillColor(panel.r, panel.g, panel.b);
      pdf.roundedRect(margin, y, contentWidth, 154, 5, 5, 'FD');

      const stripX = margin + 12;
      let stripY = y + 16;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(muted.r, muted.g, muted.b);
      pdf.text('STYLE STRIP PREVIEWS', stripX, stripY);

      stripY += 16;
      const sectionW = (contentWidth - 24) / 6;
      pdf.setFontSize(7);
      pdf.text('HEADING USE', stripX, stripY);
      pdf.text('BUTTON', stripX + sectionW, stripY);
      pdf.text('ACCENT DOT', stripX + sectionW * 2, stripY);
      pdf.text('UNDERLINE', stripX + sectionW * 3, stripY);
      pdf.text('ON DARK BG', stripX + sectionW * 4, stripY);
      pdf.text('ON LIGHT BG', stripX + sectionW * 5, stripY);

      stripY += 22;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(primary.r, primary.g, primary.b);
      pdf.text(titleWordOne.toUpperCase(), stripX, stripY);

      pdf.setFillColor(primary.r, primary.g, primary.b);
      pdf.roundedRect(stripX + sectionW, stripY - 12, sectionW - 8, 20, 3, 3, 'F');
      const stripBtnText = isLight(selectedPrimary.hex) ? 16 : 245;
      pdf.setTextColor(stripBtnText, stripBtnText, stripBtnText);
      pdf.text('CONTACT', stripX + sectionW + (sectionW - 8) / 2, stripY + 1, { align: 'center' });

      pdf.setFillColor(primary.r, primary.g, primary.b);
      pdf.circle(stripX + sectionW * 2 + 10, stripY - 2, 5, 'F');

      pdf.setTextColor(text.r, text.g, text.b);
      pdf.text('Selected work', stripX + sectionW * 3, stripY);
      pdf.setDrawColor(primary.r, primary.g, primary.b);
      pdf.line(stripX + sectionW * 3, stripY + 4, stripX + sectionW * 3 + 78, stripY + 4);

      pdf.setFillColor(12, 12, 12);
      pdf.roundedRect(stripX + sectionW * 4, stripY - 12, sectionW - 8, 20, 3, 3, 'F');
      pdf.setTextColor(primary.r, primary.g, primary.b);
      pdf.text('On Black ->', stripX + sectionW * 4 + 8, stripY + 1);

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(stripX + sectionW * 5, stripY - 12, sectionW - 8, 20, 3, 3, 'FD');
      pdf.setTextColor(primary.r, primary.g, primary.b);
      pdf.text('On White ->', stripX + sectionW * 5 + 8, stripY + 1);

      y += 170;

      drawSection('Color System', 'Full palette plus semantic assignments for production implementation.');
      drawSwatchGrid(theme.palette.backgrounds.map(c => ({ label: c.name, hex: c.hex, role: c.role })), 4);
      drawSwatchGrid(theme.palette.text.map(c => ({ label: c.name, hex: c.hex, role: c.role })), 4);
      drawSwatchGrid(theme.palette.primary.map(c => ({ label: c.name, hex: c.hex, role: c.role })), 4);
      drawSwatchGrid(theme.palette.secondary.map(c => ({ label: c.name, hex: c.hex, role: c.role })), 4);
      drawSwatchGrid([
        { label: `${selectedPrimary.name} Accent`, hex: selectedPrimary.hex, role: 'Main brand action color' },
        { label: `${selectedPrimary.name} Dark`, hex: selectedPrimary.darkHex, role: 'Hover/active state' },
        { label: `${selectedPrimary.name} Light`, hex: selectedPrimary.lightHex, role: 'Large tinted surfaces' },
        { label: `${selectedSecondary.name} Accent`, hex: selectedSecondary.hex, role: 'Rare highlight, links, tags' }
      ], 4);

      pdf.addPage();
      setPaper();
      y = 56;

      drawSection('Semantic Tokens', 'Recommended naming for engineers to map into app primitives.');
      const semanticRows = [
        ['--surface-base', theme.palette.backgrounds[0]?.hex || '#FFFFFF', 'Default app background'],
        ['--surface-elevated', theme.palette.backgrounds[1]?.hex || '#F5F5F5', 'Cards, panels, and sheets'],
        ['--text-primary', theme.palette.text[0]?.hex || '#111111', 'Primary body content'],
        ['--text-muted', theme.palette.text[2]?.hex || '#666666', 'Secondary metadata'],
        ['--border-subtle', theme.palette.backgrounds[3]?.hex || '#DDDDDD', 'Input and divider border'],
        ['--accent-primary', selectedPrimary.hex, 'Main CTA + emphasized states'],
        ['--accent-secondary', selectedSecondary.hex, 'Tags, links, info highlights']
      ];

      ensureSpace(semanticRows.length * 26 + 30);
      pdf.setDrawColor(line.r, line.g, line.b);
      pdf.setFillColor(panel.r, panel.g, panel.b);
      pdf.roundedRect(margin, y, contentWidth, semanticRows.length * 26 + 18, 4, 4, 'FD');
      let rowY = y + 18;
      semanticRows.forEach(([token, hex, role], index) => {
        if (index > 0) {
          pdf.setDrawColor(line.r, line.g, line.b);
          pdf.line(margin + 8, rowY - 14, pdfWidth - margin - 8, rowY - 14);
        }
        const rgb = hexToRgb(hex);
        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        pdf.roundedRect(margin + 10, rowY - 8, 14, 14, 2, 2, 'F');
        pdf.setFont('courier', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(text.r, text.g, text.b);
        pdf.text(token, margin + 30, rowY + 2);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(muted.r, muted.g, muted.b);
        pdf.text(`${hex}  ${role}`, margin + 170, rowY + 2);
        rowY += 26;
      });
      y += semanticRows.length * 26 + 30;

      drawSection('Typography, Elevation, Spacing, Opacity');
      ensureSpace(170);
      pdf.setDrawColor(line.r, line.g, line.b);
      pdf.setFillColor(panel.r, panel.g, panel.b);
      pdf.roundedRect(margin, y, contentWidth, 160, 4, 4, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(muted.r, muted.g, muted.b);
      pdf.text('DISPLAY FONT', margin + 12, y + 18);
      pdf.text('BODY FONT', margin + 220, y + 18);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(primary.r, primary.g, primary.b);
      pdf.text(selectedDisplayFont.name.toUpperCase(), margin + 12, y + 45);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.setTextColor(text.r, text.g, text.b);
      pdf.text(selectedBodyFont.name, margin + 220, y + 43);
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(muted.r, muted.g, muted.b);
      pdf.text('Type scale: 12 / 14 / 18 / 24 / 32 / 48', margin + 12, y + 64);
      pdf.text('Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48', margin + 12, y + 78);
      pdf.text('Opacity: 100 / 80 / 60 / 40 / 20', margin + 12, y + 92);
      pdf.text('Elevation: shadow-sm / md / lg for layered surfaces', margin + 12, y + 106);
      pdf.setFillColor(panel.r, panel.g, panel.b);
      pdf.setDrawColor(160, 160, 160);
      pdf.roundedRect(margin + 12, y + 116, 110, 28, 3, 3, 'S');
      pdf.setDrawColor(120, 120, 120);
      pdf.roundedRect(margin + 132, y + 112, 110, 32, 3, 3, 'S');
      pdf.setDrawColor(80, 80, 80);
      pdf.roundedRect(margin + 252, y + 108, 110, 36, 3, 3, 'S');
      y += 176;

      drawSection('Form Elements and Data Display', 'Reference components for inputs, cards, tags, and data rows.');
      ensureSpace(220);
      pdf.setDrawColor(line.r, line.g, line.b);
      pdf.setFillColor(panel.r, panel.g, panel.b);
      pdf.roundedRect(margin, y, contentWidth, 210, 5, 5, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(muted.r, muted.g, muted.b);
      pdf.text('FORM ELEMENTS', margin + 12, y + 16);
      pdf.setDrawColor(line.r, line.g, line.b);
      pdf.roundedRect(margin + 12, y + 24, 220, 26, 3, 3, 'S');
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(muted.r, muted.g, muted.b);
      pdf.text('Email address', margin + 20, y + 40);
      pdf.setFillColor(primary.r, primary.g, primary.b);
      pdf.roundedRect(margin + 240, y + 24, 100, 26, 3, 3, 'F');
      const formBtn = isLight(selectedPrimary.hex) ? 18 : 245;
      pdf.setTextColor(formBtn, formBtn, formBtn);
      pdf.text('Subscribe', margin + 270, y + 40);
      pdf.setDrawColor(secondary.r, secondary.g, secondary.b);
      pdf.roundedRect(margin + 12, y + 56, 80, 18, 9, 9, 'S');
      pdf.setTextColor(secondary.r, secondary.g, secondary.b);
      pdf.text('Secondary tag', margin + 22, y + 69);

      pdf.setTextColor(muted.r, muted.g, muted.b);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DATA PREVIEW', margin + 12, y + 96);
      pdf.setDrawColor(line.r, line.g, line.b);
      pdf.roundedRect(margin + 12, y + 104, contentWidth - 24, 92, 3, 3, 'S');
      pdf.setFillColor(isLightMode ? 244 : 28, isLightMode ? 244 : 28, isLightMode ? 244 : 28);
      pdf.rect(margin + 13, y + 105, contentWidth - 26, 18, 'F');
      pdf.setTextColor(text.r, text.g, text.b);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Name', margin + 20, y + 118);
      pdf.text('Role', margin + 180, y + 118);
      pdf.text('Status', margin + 290, y + 118);
      const rows = [
        ['Theme Manager', 'Owner', 'Active'],
        ['Design QA', 'Editor', 'Review'],
        ['Dev Tokens', 'Developer', 'Ready']
      ];
      let dataY = y + 136;
      rows.forEach((r) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(muted.r, muted.g, muted.b);
        pdf.text(r[0], margin + 20, dataY);
        pdf.text(r[1], margin + 180, dataY);
        pdf.setTextColor(primary.r, primary.g, primary.b);
        pdf.text(r[2], margin + 290, dataY);
        dataY += 18;
      });
      y += 228;

      const exportFiles = generateExportFiles(theme, selectedPrimary, selectedSecondary, selectedDisplayFont, selectedBodyFont);
      const readExportText = (fileName: string) => {
        const file = exportFiles.find((f) => f.name === fileName);
        return file && typeof file.content === 'string' ? file.content : '';
      };
      const zipList = exportFiles.map((f) => `- ${f.name}`).join('\n');

      drawSection('Implementation Reference', 'Zip exports and copy-ready code examples for quick implementation.');
      drawParagraph('Included in ZIP:\n' + zipList);
      drawCodeBlock('tokens.css', generateCSS(), 18);
      drawCodeBlock('tokens.w3c.json', readExportText('tokens.w3c.json'), 16);
      drawCodeBlock('tailwind.config.js', readExportText('tailwind.config.js'), 15);

      pdf.save(`${theme.themeName.toLowerCase().replace(/\s+/g, '-')}-brand-guide.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportTokens = async () => {
    setIsExportingTokens(true);
    try {
      const files = generateExportFiles(theme, selectedPrimary, selectedSecondary, selectedDisplayFont, selectedBodyFont);
      const zip = new JSZip();
      
      const folderName = `${theme.themeName.toLowerCase().replace(/\s+/g, '-')}-tokens`;
      const folder = zip.folder(folderName);
      
      if (folder) {
        files.forEach(file => {
          folder.file(file.name, file.content);
        });
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting tokens:', error);
    } finally {
      setIsExportingTokens(false);
    }
  };

  const applyFontPreset = (preset: { display: string; body: string }) => {
    setSelectedDisplayFont(findFont(displayFonts, preset.display));
    setSelectedBodyFont(findFont(bodyFonts, preset.body));
  };

  // Theme classes
  const t = {
    bg: isLightMode ? 'bg-[#F5F5F0]' : 'bg-[#0A0A0A]',
    text: isLightMode ? 'text-[#0A0A0A]' : 'text-[#F5F5F0]',
    textMuted: isLightMode ? 'text-[#00000066]' : 'text-[#ffffff66]',
    textSub: isLightMode ? 'text-[#00000099]' : 'text-[#ffffff99]',
    textInverse: isLightMode ? 'text-[#0000004d]' : 'text-[#ffffff4d]',
    border: isLightMode ? 'border-[#0000001a]' : 'border-[#ffffff1a]',
    borderLight: isLightMode ? 'border-[#0000000d]' : 'border-[#ffffff0d]',
    card: isLightMode ? 'bg-white' : 'bg-[#141414]',
    cardAlt: isLightMode ? 'bg-gray-100' : 'bg-[#1E1E1E]',
    hoverText: isLightMode ? 'hover:text-black' : 'hover:text-white',
    solidText: isLightMode ? 'text-black' : 'text-white',
    inverseBg: isLightMode ? 'bg-[#0A0A0A]' : 'bg-white',
    inverseText: isLightMode ? 'text-white' : 'text-black',
  };

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} font-mono transition-colors duration-500`}>
      {/* HEADER */}
      <header className={`px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12 pb-6 sm:pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b ${t.border}`}>
        <div>
          <div className={`text-[10px] tracking-[4px] ${t.textInverse} uppercase mb-2`}>
            True to Hue · v2.0
          </div>
          <div className="font-bebas text-[clamp(48px,8vw,96px)] leading-[0.9] tracking-[2px]">
            {theme.themeName.split(' ')[0]}
            <span style={{ color: selectedPrimary.hex }} className="transition-colors duration-300">
              {theme.themeName.split(' ').slice(1).join(' ')}
            </span>
            <br />
            THEME
          </div>
        </div>
        <div className={`text-left lg:text-right text-[11px] ${t.textInverse} tracking-[1px] leading-loose flex flex-col items-start lg:items-end gap-2`}>
          <button 
            onClick={() => setIsLightMode(!isLightMode)} 
            className={`flex items-center gap-2 ${t.hoverText} transition-colors mb-2`}
          >
            {isLightMode ? <Moon size={14} /> : <Sun size={14} />}
            {isLightMode ? 'DARK PREVIEW' : 'LIGHT PREVIEW'}
          </button>
          <button onClick={onReset} className={`${t.hoverText} transition-colors underline ${isLightMode ? 'decoration-[#00000033]' : 'decoration-[#ffffff33]'} underline-offset-4 mb-2`}>START OVER</button>
          <button 
            onClick={handleDownloadPDF} 
            disabled={isGeneratingPDF}
            className={`${t.hoverText} transition-colors underline ${isLightMode ? 'decoration-[#00000033]' : 'decoration-[#ffffff33]'} underline-offset-4 mb-2 disabled:opacity-50`}
          >
            {isGeneratingPDF ? 'GENERATING PDF...' : 'DOWNLOAD PDF'}
          </button>
          <button 
            onClick={handleExportTokens} 
            disabled={isExportingTokens}
            className={`${t.hoverText} transition-colors underline ${isLightMode ? 'decoration-[#00000033]' : 'decoration-[#ffffff33]'} underline-offset-4 mb-2 disabled:opacity-50`}
          >
            {isExportingTokens ? 'PACKING ZIP...' : 'EXPORT TOKENS (ZIP)'}
          </button>
          <div>by Rabiat Sadiq</div>
          <div>rabiatsadiq.com</div>
        </div>
      </header>

      <div id="studio-content">
        {/* PRIMARY ACCENT SELECTOR */}
        <section className={`px-4 sm:px-6 lg:px-10 py-10 sm:py-12 border-b ${t.border}`}>
          <div className="text-[10px] tracking-[4px] uppercase mb-6" style={{ color: selectedPrimary.hex }}>
            01 — Tune the {theme.primaryAccentName}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {theme.primaryVariations.map((v, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedPrimary(v)}
                className={`cursor-pointer border rounded-sm overflow-hidden transition-all relative group ${
                  selectedPrimary.hex === v.hex ? (isLightMode ? 'border-black' : 'border-white') : 'border-transparent hover:-translate-y-1'
                }`}
              >
                {selectedPrimary.hex === v.hex && (
                  <div className={`absolute top-1.5 right-2 text-[11px] z-10 ${t.solidText}`}>✓</div>
                )}
                <div 
                  className="h-[80px] w-full transition-colors duration-300"
                  style={{ backgroundColor: v.hex }}
                />
                <div className={`p-3 ${t.card}`}>
                  <div className={`text-[10px] tracking-[2px] uppercase ${t.solidText} mb-1`}>
                    {v.name}
                  </div>
                  <div className={`text-[10px] ${t.textMuted} tracking-[1px]`}>
                    {v.hex}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Live Preview Bar */}
          <div className={`mt-8 p-4 sm:p-6 ${t.card} rounded-sm flex items-center gap-4 sm:gap-8 flex-wrap`}>
            <div>
              <div className={`text-[9px] tracking-[3px] ${t.textMuted} uppercase mb-2`}>Heading use</div>
              <div className="font-bebas text-3xl tracking-[2px] transition-colors duration-300" style={{ color: selectedPrimary.hex }}>
                {theme.themeName.split(' ')[0]}
              </div>
            </div>
            <div>
              <div className={`text-[9px] tracking-[3px] ${t.textMuted} uppercase mb-2`}>Button</div>
              <div className={`px-5 py-2.5 font-mono text-[10px] tracking-[2px] uppercase rounded-sm ${t.inverseText} transition-colors duration-300`} style={{ backgroundColor: selectedPrimary.hex }}>
                Contact
              </div>
            </div>
            <div>
              <div className={`text-[9px] tracking-[3px] ${t.textMuted} uppercase mb-2`}>Accent dot</div>
              <div className="w-2.5 h-2.5 rounded-full transition-colors duration-300" style={{ backgroundColor: selectedPrimary.hex }} />
            </div>
            <div>
              <div className={`text-[9px] tracking-[3px] ${t.textMuted} uppercase mb-2`}>Underline</div>
              <div className="pb-1 text-xs tracking-[1px] border-b-2 transition-colors duration-300" style={{ borderColor: selectedPrimary.hex }}>
                Selected work
              </div>
            </div>
            <div>
              <div className={`text-[9px] tracking-[3px] ${t.textMuted} uppercase mb-2`}>On black BG</div>
              <div className="bg-[#0A0A0A] px-4 py-2.5 rounded-sm text-xs tracking-[1px] transition-colors duration-300" style={{ color: selectedPrimary.hex }}>
                On Black →
              </div>
            </div>
            <div>
              <div className={`text-[9px] tracking-[3px] ${t.textMuted} uppercase mb-2`}>On white BG</div>
              <div className="bg-white px-4 py-2.5 rounded-sm text-xs tracking-[1px] transition-colors duration-300" style={{ color: selectedPrimary.hex }}>
                On White →
              </div>
            </div>
          </div>
        </section>

        {/* SECONDARY ACCENT SELECTOR */}
        <section className={`px-4 sm:px-6 lg:px-10 py-10 sm:py-12 border-b ${t.border}`}>
          <div className="text-[10px] tracking-[4px] uppercase mb-6" style={{ color: selectedPrimary.hex }}>
            02 — The Rare Third Voice ({theme.secondaryAccentName})
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {theme.secondaryVariations.map((v, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedSecondary(v)}
                className={`cursor-pointer border rounded-sm overflow-hidden transition-all relative group ${
                  selectedSecondary.hex === v.hex ? (isLightMode ? 'border-black' : 'border-white') : 'border-transparent hover:-translate-y-1'
                }`}
              >
                {selectedSecondary.hex === v.hex && (
                  <div className={`absolute top-1.5 right-2 text-[11px] z-10 ${t.solidText}`}>✓</div>
                )}
                <div 
                  className="h-[70px] w-full transition-colors duration-300"
                  style={{ backgroundColor: v.hex }}
                />
                <div className={`p-3 ${t.card}`}>
                  <div className={`text-[10px] tracking-[2px] uppercase ${t.solidText} mb-1`}>
                    {v.name}
                  </div>
                  <div className={`text-[10px] ${t.textMuted} tracking-[1px]`}>
                    {v.hex}
                  </div>
                  <div className={`text-[9px] ${t.textMuted} mt-1.5 italic leading-relaxed`}>
                    {v.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className={`mt-8 p-5 ${t.card} border-l-2 text-[11px] ${t.textSub} leading-relaxed transition-colors duration-300`} style={{ borderColor: selectedSecondary.hex }}>
            <strong className={`${t.solidText} font-medium`}>Usage rule:</strong> {theme.secondaryUsageRule || `${theme.secondaryAccentName} enters only when black, white, and ${theme.primaryAccentName.toLowerCase()} can't carry the moment alone — a link hover, a tag, a data highlight, a rare accent. It's the third voice, not a lead. Think of it like a cameo, not a main character.`}
          </div>
        </section>

        {/* FONT TESTER */}
        <section className={`px-4 sm:px-6 lg:px-10 py-10 sm:py-12 border-b ${t.border}`}>
          <div className="text-[10px] tracking-[4px] uppercase mb-8" style={{ color: selectedPrimary.hex }}>
            03 — Font Selection
          </div>

          <div className="mb-6 overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {fontPresetCombos.map((preset) => {
                const isActive = selectedDisplayFont.name === preset.display && selectedBodyFont.name === preset.body;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyFontPreset(preset)}
                    className={`px-3 sm:px-4 py-2 text-[10px] tracking-[2px] uppercase border rounded-sm transition-colors ${
                      isActive
                        ? 'text-white border-transparent'
                        : `${t.textMuted} ${t.border} hover:text-white hover:border-white/35`
                    }`}
                    style={isActive ? { backgroundColor: selectedPrimary.hex } : undefined}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 sm:gap-8 flex-wrap mb-10">
            <div className="flex flex-col gap-2">
              <label className={`text-[9px] tracking-[2px] uppercase ${t.textMuted}`}>Display Font</label>
              <select 
                value={selectedDisplayFont.name}
                onChange={(e) => setSelectedDisplayFont(displayFonts.find(f => f.name === e.target.value) || displayFonts[0])}
                className={`${t.card} border ${t.border} ${t.solidText} px-4 py-2 rounded-sm font-mono text-[11px] focus:outline-none focus:border-current min-w-[220px]`}
              >
                {displayFonts.map(f => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={`text-[9px] tracking-[2px] uppercase ${t.textMuted}`}>Body Font</label>
              <select 
                value={selectedBodyFont.name}
                onChange={(e) => setSelectedBodyFont(bodyFonts.find(f => f.name === e.target.value) || bodyFonts[0])}
                className={`${t.card} border ${t.border} ${t.solidText} px-4 py-2 rounded-sm font-mono text-[11px] focus:outline-none focus:border-current min-w-[220px]`}
              >
                {bodyFonts.map(f => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={`${t.card} rounded-sm overflow-hidden border ${t.borderLight}`}>
            <nav className={`px-4 sm:px-6 py-4 border-b ${t.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div className="text-base tracking-[3px]" style={{ fontFamily: selectedDisplayFont.stack }}>
                {theme.themeName.split(' ')[0]}<span style={{ color: selectedPrimary.hex }} className="transition-colors duration-300">{theme.themeName.split(' ').slice(1).join(' ')}</span>
              </div>
              <div className={`flex gap-4 sm:gap-5 text-[11px] ${t.textMuted} flex-wrap`} style={{ fontFamily: selectedBodyFont.stack }}>
                <span>Work</span><span>About</span><span>Contact</span>
              </div>
            </nav>
            
            <div className="px-4 sm:px-8 lg:px-10 pt-10 sm:pt-14 pb-10 sm:pb-12 relative">
              <div 
                className="text-[10px] tracking-[4px] uppercase mb-4 transition-colors duration-300"
                style={{ color: selectedSecondary.hex, fontFamily: selectedBodyFont.stack }}
              >
                Designed with intention
              </div>
              <div 
                className="text-[clamp(38px,6vw,72px)] leading-none mb-5"
                style={{ fontFamily: selectedDisplayFont.stack }}
              >
                CHAOS,<br/>
                <em className="not-italic transition-colors duration-300" style={{ color: selectedPrimary.hex }}>REFINED.</em>
              </div>
              <div 
                className={`text-[14px] ${t.textSub} leading-[1.8] max-w-[420px] mb-8`}
                style={{ fontFamily: selectedBodyFont.stack }}
              >
                {theme.description}
              </div>
              <div className="flex gap-3 flex-wrap">
                <div 
                  className={`${t.inverseText} px-6 py-3 text-[10px] tracking-[2px] uppercase rounded-sm transition-colors duration-300`}
                  style={{ backgroundColor: selectedPrimary.hex, fontFamily: selectedBodyFont.stack }}
                >
                  View Work
                </div>
                <div 
                  className="bg-transparent border px-6 py-3 text-[10px] tracking-[2px] uppercase rounded-sm transition-colors duration-300"
                  style={{ color: selectedSecondary.hex, borderColor: selectedSecondary.hex, fontFamily: selectedBodyFont.stack }}
                >
                  Get in Touch
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-3 gap-[1px] border-t ${t.border} ${isLightMode ? 'bg-[#0000000d]' : 'bg-[#ffffff1a]'}`}>
              {theme.previewCards?.map((card, i) => (
                <div key={i} className={`p-6 ${t.cardAlt}`}>
                  <div 
                    className="text-[9px] tracking-[3px] uppercase mb-2.5 transition-colors duration-300"
                    style={{ color: selectedPrimary.hex, fontFamily: selectedBodyFont.stack }}
                  >
                    {card.tag}
                  </div>
                  <div 
                    className="text-[17px] leading-[1.2] mb-2"
                    style={{ fontFamily: selectedDisplayFont.stack }}
                  >
                    {card.title}
                  </div>
                  <div 
                    className={`text-[11px] ${t.textMuted} leading-[1.7]`}
                    style={{ fontFamily: selectedBodyFont.stack }}
                  >
                    {card.body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-px p-6 px-10 ${t.cardAlt} flex items-center gap-8 flex-wrap border ${t.borderLight} rounded-b-sm`}>
            <div>
              <div className={`text-[9px] tracking-[3px] uppercase ${t.textMuted} mb-1`}>Display / Heading</div>
              <div className={`text-[13px] ${t.solidText}`}>{selectedDisplayFont.name}</div>
            </div>
            <div>
              <div className={`text-[9px] tracking-[3px] uppercase ${t.textMuted} mb-1`}>Body / UI</div>
              <div className={`text-[13px] ${t.solidText}`}>{selectedBodyFont.name}</div>
            </div>
          </div>
        </section>

        {/* FULL PALETTE */}
        <section className={`px-4 sm:px-6 lg:px-10 py-10 sm:py-12 border-b ${t.border}`}>
          <div className="text-[10px] tracking-[4px] uppercase mb-8" style={{ color: selectedPrimary.hex }}>
            04 — Full Named Palette
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-0.5 mt-8 rounded-sm overflow-hidden">
            {/* Backgrounds */}
            {theme.palette.backgrounds.map((c, i) => (
              <div key={`bg-${i}`}>
                <PaletteChip chipId={`bg-${i}`} color={c} onCopy={handleCopyHex} copiedTarget={copiedTarget} />
              </div>
            ))}
            
            {/* Text/Whites */}
            {theme.palette.text.map((c, i) => (
              <div key={`txt-${i}`}>
                <PaletteChip chipId={`txt-${i}`} color={c} onCopy={handleCopyHex} copiedTarget={copiedTarget} />
              </div>
            ))}

            {/* Primary */}
            {theme.palette.primary.map((c, i) => (
              <div key={`pri-${i}`}>
                <PaletteChip chipId={`pri-${i}`} color={c} onCopy={handleCopyHex} copiedTarget={copiedTarget} />
              </div>
            ))}

            {/* Secondary */}
            {theme.palette.secondary.map((c, i) => (
              <div key={`sec-${i}`}>
                <PaletteChip chipId={`sec-${i}`} color={c} onCopy={handleCopyHex} copiedTarget={copiedTarget} />
              </div>
            ))}

            {/* Dynamic Accents */}
            <PaletteChip 
              chipId="dyn-primary"
              color={{ name: selectedPrimary.name, hex: selectedPrimary.hex, role: `Primary ${theme.primaryAccentName}` }} 
              onCopy={handleCopyHex} copiedTarget={copiedTarget} 
            />
            <PaletteChip 
              chipId="dyn-secondary"
              color={{ name: selectedSecondary.name, hex: selectedSecondary.hex, role: `Rare ${theme.secondaryAccentName}` }} 
              onCopy={handleCopyHex} copiedTarget={copiedTarget} 
            />
          </div>
        </section>

        {/* CSS EXPORT */}
        <section className={`px-4 sm:px-6 lg:px-10 py-10 sm:py-12 border-b ${t.border}`}>
          <div className="text-[10px] tracking-[4px] uppercase mb-6" style={{ color: selectedPrimary.hex }}>
            05 — CSS Variables
          </div>
          
          <div className="relative mt-6">
            <pre className={`${t.card} border ${t.border} rounded-sm p-4 sm:p-8 text-[10.5px] leading-[2.1] ${t.textSub} whitespace-pre overflow-x-auto`}>
              <span className={t.textInverse}>/* ════════════════════════════════
   {theme.themeName.toUpperCase()} THEME · v2.0
   True to Hue
   ════════════════════════════════ */</span>
{'\n\n'}:root {'{'}
  <span className={t.textInverse}>/* ── BACKGROUNDS ────────────────── */</span>
{theme.palette.backgrounds.map(c => `  --r-bg-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex.padEnd(9)} /* ${c.role} */`).join('\n')}

  <span className={t.textInverse}>/* ── TEXT & WHITES ──────────────── */</span>
{theme.palette.text.map(c => `  --r-text-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex.padEnd(9)} /* ${c.role} */`).join('\n')}

  <span className={t.textInverse}>/* ── PRIMARY ────────────────────── */</span>
{theme.palette.primary.map(c => `  --r-primary-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex.padEnd(9)} /* ${c.role} */`).join('\n')}

  <span className={t.textInverse}>/* ── SECONDARY ──────────────────── */</span>
{theme.palette.secondary.map(c => `  --r-secondary-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex.padEnd(9)} /* ${c.role} */`).join('\n')}

  <span className={t.textInverse}>/* ── ACCENT 1 (PRIMARY) ─────────── */</span>
  --r-accent:       <span className="transition-colors duration-300" style={{ color: selectedPrimary.hex }}>{selectedPrimary.hex}</span>;   <span className={t.textInverse}>/* primary — {selectedPrimary.name} */</span>
  --r-accent-dark:  <span className="transition-colors duration-300" style={{ color: selectedPrimary.darkHex }}>{selectedPrimary.darkHex}</span>;   <span className={t.textInverse}>/* dark shade */</span>
  --r-accent-light: <span className="transition-colors duration-300" style={{ color: selectedPrimary.lightHex }}>{selectedPrimary.lightHex}</span>;   <span className={t.textInverse}>/* light shade */</span>
  --r-accent-bg:    <span className="transition-colors duration-300" style={{ color: selectedPrimary.bgHex }}>{selectedPrimary.bgHex}</span>;   <span className={t.textInverse}>/* depth (tint bg) */</span>

  <span className={t.textInverse}>/* ── ACCENT 2 (RARE 3RD VOICE) ──── */</span>
  --r-secondary-accent: <span className="transition-colors duration-300" style={{ color: selectedSecondary.hex }}>{selectedSecondary.hex}</span>;   <span className={t.textInverse}>/* {selectedSecondary.name} */</span>

  <span className={t.textInverse}>/* ── FONTS ──────────────────────── */</span>
  --r-font-display: {selectedDisplayFont.stack};
  --r-font-body:    {selectedBodyFont.stack};
{'}'}
            </pre>
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={handleDownloadCSS}
                className={`${isLightMode ? 'bg-[#0000000d] text-black hover:bg-[#0000001a]' : 'bg-[#ffffff1a] text-white hover:bg-[#ffffff33]'} border-none px-3.5 py-1.5 font-mono text-[9px] tracking-[2px] uppercase cursor-pointer rounded-sm transition-colors`}
              >
                DOWNLOAD
              </button>
              <button 
                onClick={handleCopyCSS}
                className={`${t.inverseText} border-none px-3.5 py-1.5 font-mono text-[9px] tracking-[2px] uppercase cursor-pointer rounded-sm hover:opacity-80 transition-all duration-300`}
                style={{ backgroundColor: selectedPrimary.hex }}
              >
                {copiedTarget === 'css' ? 'COPIED!' : 'COPY ALL'}
              </button>
            </div>
          </div>
        </section>

        <A11yReport 
          theme={theme} 
          selectedPrimary={selectedPrimary} 
          selectedSecondary={selectedSecondary} 
          isLightMode={isLightMode}
        />
      </div>

      {/* FOOTER */}
      <footer className={`px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 ${t.bg}`}>
        <span className={`text-[9px] tracking-[2px] ${t.textInverse} uppercase`}>
          {theme.themeName} Theme · v2 · Color + Font
        </span>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-300" style={{ backgroundColor: selectedPrimary.hex }} />
        <span className={`text-[9px] tracking-[2px] ${t.textInverse} uppercase`}>
          Click any chip to copy
        </span>
      </footer>
    </div>
  );
}

function getRecommendedFonts(theme: ThemeData) {
  const signal = `${theme.themeName} ${theme.description} ${theme.primaryAccentName} ${theme.secondaryAccentName}`.toLowerCase();

  if (containsAny(signal, ['luxury', 'premium', 'editorial', 'elegant', 'fashion'])) {
    return {
      display: findFont(displayFonts, 'Playfair Display'),
      body: findFont(bodyFonts, 'Lora')
    };
  }

  if (containsAny(signal, ['kids', 'playful', 'friendly', 'learning', 'education'])) {
    return {
      display: findFont(displayFonts, 'Poppins'),
      body: findFont(bodyFonts, 'Nunito')
    };
  }

  if (containsAny(signal, ['tech', 'ai', 'futur', 'modern', 'productivity', 'startup'])) {
    return {
      display: findFont(displayFonts, 'Unbounded'),
      body: findFont(bodyFonts, 'Space Grotesk')
    };
  }

  if (containsAny(signal, ['classic', 'heritage', 'history', 'museum', 'formal'])) {
    return {
      display: findFont(displayFonts, 'Cinzel'),
      body: findFont(bodyFonts, 'Libre Baskerville')
    };
  }

  if (containsAny(signal, ['music', 'sport', 'bold', 'energy', 'impact'])) {
    return {
      display: findFont(displayFonts, 'Oswald'),
      body: findFont(bodyFonts, 'Inter')
    };
  }

  return {
    display: findFont(displayFonts, 'Bebas Neue'),
    body: findFont(bodyFonts, 'DM Mono')
  };
}

function containsAny(text: string, terms: string[]) {
  return terms.some(term => text.includes(term));
}

function findFont(list: Array<{ name: string; stack: string }>, name: string) {
  return list.find(font => font.name === name) || list[0];
}

function PaletteChip({
  chipId,
  color,
  onCopy,
  copiedTarget
}: {
  chipId: string;
  color: ColorChip;
  onCopy: (hex: string, chipId: string) => void;
  copiedTarget: string | null;
}) {
  const isLightColor = isLight(color.hex);
  const textColor = isLightColor ? '#0A0A0A' : '#F5F5F0';
  const isCopied = copiedTarget === chipId;

  return (
    <div 
      className="px-3.5 pt-5 pb-4 relative cursor-pointer transition-all duration-150 hover:brightness-110 group"
      style={{ backgroundColor: color.hex, color: textColor }}
      onClick={() => onCopy(color.hex, chipId)}
    >
      <div className="text-[9px] tracking-[2px] uppercase font-medium mb-1 truncate">
        {color.name}
      </div>
      <div className="text-[9px] opacity-60 tracking-[1px]">
        {color.hex}
      </div>
      <div className="text-[8px] opacity-40 mt-1.5 tracking-[1px] italic truncate">
        {color.role}
      </div>
      
      <div 
        className={`absolute top-1.5 right-1.5 text-[7px] px-1.5 py-0.5 rounded-[1px] tracking-[1px] transition-opacity duration-200 ${isCopied ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          backgroundColor: isLightColor ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)',
          color: textColor
        }}
      >
        COPIED
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const normalized = clean.length === 3
    ? clean.split('').map(ch => ch + ch).join('')
    : clean;

  return {
    r: parseInt(normalized.slice(0, 2), 16) || 0,
    g: parseInt(normalized.slice(2, 4), 16) || 0,
    b: parseInt(normalized.slice(4, 6), 16) || 0,
  };
}
