# Backup Theme Studio

`prototypes/backup-theme-studio.html` is a standalone backup concept for color/theme selection and export.

## User Journey Map

1. **Landing**
   - User sees purpose and the 5-step flow.
   - Clear promise: describe app -> generate -> select -> export.

2. **Start Brief**
   - User names the theme/design system.
   - User describes the app, audience, and mood in plain language.

3. **Color Intent + Style**
   - User enters desired primary/secondary/accent colors or words.
   - User picks style tags (playful, calm, pastel, bold, etc.).

4. **Image Inputs (Optional)**
   - User uploads up to 3 images.
   - Tool extracts dominant colors from images and merges them with text intent.

5. **AI Suggestions**
   - User clicks "Set OpenAI API Key" and pastes a key (in-memory only).
   - User clicks "Generate Theme Suggestions" (or local fallback).

6. **Variation Selection**
   - Tool shows 3 variations (Balanced, Bold Contrast, Soft Pastel).
   - User picks the one that feels best.

7. **Final Output**
   - Full design-system tokens shown as clickable color tiles.
   - Live UI preview updates with selected variation.
   - User copies hex codes, CSS variables, JSON tokens, or downloads files.

## Temporary API Key Setup

- Current implementation uses direct browser calls to OpenAI API.
- Key is saved in memory only for that tab session (not persisted to disk).
- For production, move API calls to a secure backend proxy.

## Suggested Next Improvements

- Add palette locking (lock primary, regenerate the rest).
- Add contrast checks (WCAG AA/AAA) and warnings.
- Add export presets (Tailwind, Figma tokens, Material theme).
- Add project templates (portfolio, SaaS, education app, mobile-first UI).
