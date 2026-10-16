# Archive95

A bilingual, interactive Windows 95 desktop portfolio for Mohamed Amine Aslimani. Built with Next.js, React, TypeScript, 98.css, and React95 icons.

## Run locally

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Production: `pnpm build`, then `pnpm start`. Type checking: `pnpm typecheck`.

## Explore

- Spanish desktop: `/`; English desktop: `/en`.
- Projects open in document windows, with direct links under `/projects/[slug]` and `/en/projects/[slug]`.
- CV: `/cv?lang=es` or `/cv?lang=en`, with printing and an English PDF download.
- Start menu, draggable and resizable windows, taskbar, project previews, MS-DOS terminal, editable Notepad, Minesweeper, display settings, and boot/shutdown screens.
- On mobile, apps fill the desktop and icons open with a tap. On desktop, double-click or keyboard activation opens an icon.
- Wallpaper, sound, and welcome preferences are stored locally when browser storage is available. No account, database, or contact backend is required. Email opens the visitor's mail application.

## Content and artwork

`lib/content.ts` contains the profile and project content. The active desktop lives in `components/os`.

`public/art/retro` contains five original, editable SVG illustrations with a coordinated navy, teal, and cream palette. Run `node scripts/retro-assets.mjs` to regenerate them, the favicon, and the social preview. They are conceptual illustrations, not screenshots or evidence of measured project performance.

The full asset build (`pnpm assets`, also run before production builds) generates the downloadable English CV and artwork. Historical editorial components and source artwork remain available in the repository; the desktop uses the new retro illustrations. Interface icons come from `@react95/icons`, and classic control styling and fonts come from `98.css`.

## Deployment

Set `NEXT_PUBLIC_SITE_URL` to the deployment's real HTTPS origin. Vercel's production URL is used as a fallback when available. Without either, the sitemap is empty and metadata uses localhost. The GitHub repository is private; pushing source does not deploy a public website.

See `VERIFICATION.md` for checks and limitations.
