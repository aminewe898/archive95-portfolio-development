> Recovery update — 16 October 2026: The active UI is now the Windows 95 desktop in `components/os`. Both homepages, localized project routes, and the CV route load it. The editorial implementation remains in the source as previous work. Descriptions and test results below concern that previous version unless explicitly stated otherwise.
# Archive95

Bilingual portfolio for Mohamed Amine Aslimani. Next.js App Router, React, TypeScript, Tailwind CSS 4 and Motion. No database, authentication, runtime AI, analytics, or contact backend.

## Installation and deployment

Import the project through GitHub or the v0 shadcn CLI installation option. The repository uses pnpm 12.3.4 and includes its lockfile. The development script is `dev`; the production script is `build`, followed by `start`. Asset generation runs before every production build. `pnpm typecheck` checks TypeScript; `node scripts/verify.mjs` checks a running production server (default port 3001; override with `VERIFY_ORIGIN`).

Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS origin before a non-Vercel production build. On Vercel, the production project URL is used automatically when available. No invented domain is used. Without a configured URL, sitemap output is intentionally empty; Next.js may use localhost as its metadata fallback. Rebuild after configuring the origin. Publishing and domain changes have not been performed.

## Content

`lib/content.ts` is the typed source for profile, translations, project descriptions, evidence links, skills, languages, chronology, and artwork paths. Homepages are `/` and `/en`; all four case studies have equivalent Spanish and English routes. `/cv?lang=es` and `/cv?lang=en` render printable CVs. The generated downloadable PDF is newly typeset in English, not a preserved original.

Only the explicitly requested language preference is stored in localStorage. Access failure is caught, and explicit routes always win. Motion settings are session-only. Normal project, contact, CV and language links do not need JavaScript; dossier windows are optional enhancements below which the same material is available as ordinary pages. Dossiers are disabled below 900px.

## Fonts and asset provenance

- Libre Caslon Display, regular Latin: self-hosted from `@fontsource/libre-caslon-display`, SIL Open Font License. License: `/assets/libre-caslon-display-LICENSE.txt`.
- Source Sans 3, Latin 400/500/600: self-hosted from `@fontsource/source-sans-3`, SIL Open Font License. License: `/assets/source-sans-3-LICENSE.txt`.
- Tahoma/system fallbacks for retro controls; system monospace for metadata.
- Tower and supporting specimens: original AI-generated conceptual engravings created for this project, stored locally. `scripts/assets.mjs` produces optimized WebP versions and crops the four supporting specimens. They are illustrations, not project screenshots. These are raster engravings, **not the independently editable layered SVG artwork requested in the original brief**.
- Social image: generated locally from the tower illustration and a project-owned SVG typography overlay.
- Favicon: original simple SVG monogram. Interface icons: lucide-react (ISC license).
- Paper texture: small inline SVG noise tile, static and not animated.

## Operational notes

The build generates `/assets/cv-mohamed-amine-aslimani.pdf`, artwork derivatives, social artwork and font-license copies. Keep the source PNG files available for that step. Only optimized WebP assets are loaded by the site. Email uses the visitor’s mail application; clipboard errors leave the address selectable. The portfolio makes no independent claim of having tested Relay’s live providers or full Docker/database integration.

See `VERIFICATION.md` for actual checks and remaining limitations. Browser captures are saved outside the codebase under `/tmp/agent-browser/`; these are workspace review artifacts, not public website routes.

