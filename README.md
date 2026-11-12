# LinkedInify

Translate everyday English into LinkedIn corporate jargon and back again.

## Development

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The home page contains a validated translator form; AI translation is not connected yet. The separate frontend example is a reference template.

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Tailwind colour palette

Tailwind CSS v4 tokens live in `src/app/globals.css` using `@theme`.

| Token | Hex | Example utility |
| --- | --- | --- |
| Primary | `#0A66C2` | `bg-primary` |
| Primary hover | `#004182` | `hover:bg-primary-hover` |
| Background | `#F8FAFC` | `bg-background` |
| Surface | `#FFFFFF` | `bg-surface` |
| Border | `#E5E7EB` | `border-border` |
| Foreground | `#1F2937` | `text-foreground` |
| Muted | `#64748B` | `text-muted` |

Colour tokens work with all Tailwind colour utilities, including `ring-primary` and `text-primary`. Use `text-surface` for text on primary buttons. The foundation uses Geist with a system sans-serif fallback and the plan's light palette, with no automatic dark-mode override.


## UI structure

- `src/components/Header.tsx` and `Logo.tsx`: shared brand and placeholder header actions.
- `src/components/translator/Translator.tsx`: form setup, direction, validation, and composition.
- `InputPanel.tsx` / `OutputPanel.tsx`: editable source and display-only result.
- `PersonalitySelect.tsx`: descriptions, selection, outside dismissal, and keyboard focus.
- `IntensityControl.tsx`: form-connected slider.
- `src/components/ui/slider.tsx`: reusable Base UI slider.

`src/app/globals.css` owns the colour tokens and reusable classes in `@layer components`. Header and main use `page-container` for matching gutters (20px mobile, 40px tablet, 64px desktop) and a maximum width of 1280px. Shared buttons, panel surfaces, and typography should use these classes; use Tailwind utilities for small, local differences.

The API route currently returns HTTP 501 until translation is implemented. The form validates locally and reports success without sending text to an AI service. Production builds require access to Google Fonts for the existing `next/font/google` Geist font.
