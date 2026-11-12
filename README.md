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

Snake is available through `SNAKE.EXE` on the desktop, Start → Programs → Snake, `SNAKE` in Run, or `START SNAKE` in MS-DOS. Use arrow keys or WASD to steer, Space/P to pause, and F2 to restart; directional buttons support touch. The game pauses when inactive, minimized, or hidden. Its best score is stored locally when browser storage is available. Run `pnpm test:snake` for the game rules and collision checks.

## Desktop programs and shell

Besides the portfolio apps, the desktop includes:

- **Internet Explorer** — loads real pages in a sandboxed frame. The year selector (1996, 1998, 2001, 2005) loads an archived copy through the Wayback Machine. There is no proxy: sites that forbid embedding are offered in a new tab or as an archived copy.
- **My Computer** — drives and folders (A:, C:, D:) that lead to the same projects, documents and programs.
- **Find** (Start → Find or F3) — searches projects, skills, the CV and programs.
- **Paint**, **Calculator**, **Solitaire**, **Date/Time Properties** (double-click the clock) and **Close Program**.
- Windows resize from every edge, have a control menu on the title-bar icon, and can be cascaded or tiled from the taskbar's right-click menu. Desktop icons support right-click menus, drag selection and arrow keys.

Run `pnpm test:sol` for the Solitaire rules, alongside `pnpm test:snake` and `pnpm test:demo`.

## Content and artwork

`lib/content.ts` contains the profile and project content. The active desktop lives in `components/os`.

`public/art/retro` contains five original, editable SVG illustrations with a coordinated navy, teal, and cream palette. Run `node scripts/retro-assets.mjs` to regenerate them, the favicon, and the social preview. They are conceptual illustrations, not screenshots or evidence of measured project performance.

The full asset build (`pnpm assets`, also run before production builds) generates the downloadable English CV and artwork. Historical editorial components and source artwork remain available in the repository; the desktop uses the new retro illustrations. Interface icons come from `@react95/icons`, and classic control styling and fonts come from `98.css`.

## Deployment

The configured production origin is `https://portfolio.cloudbyamine.org` (the user's proposed Oracle deployment domain). Override `NEXT_PUBLIC_SITE_URL` before building if the final domain changes; rebuild to regenerate canonical links, social URLs, structured data, and the bilingual sitemap. The GitHub repository is private; pushing source does not deploy a public website.

For the Oracle VM, use a supported Node.js version and pnpm, then run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test:demo`, and `pnpm build` from the repository. Run `pnpm start` as a persistent service behind an HTTPS reverse proxy. Set `NEXT_PUBLIC_SITE_URL` to the final public origin **before** the build. After starting the service, set `VERIFY_ORIGIN` to its local HTTP address and run `node scripts/verify.mjs` to check the routes and generated assets. DNS, TLS, the reverse proxy, and the service manager must be configured on the VM; this repository does not configure them.

See `VERIFICATION.md` for checks and limitations.

## Interactive project demos

Projects open into an interactive demo, with a separate dossier view for the full write-up:

- Relay: n8n-style voice-to-ticket workflow, including a human-review example.
- Local AI: model loading, a prompt, and a predefined response revealed incrementally.
- Homelab: an HTTPS request trace and an operator-driven service-restart example.
- Pi NAS: sample files moving to a shared folder, followed by checksum verification.

All demos are local state machines with sample data. They do not call n8n, AI providers, servers, or storage services. Controls include Run/Pause, Step, Reset, Replay, speed selection, and node inspection. Playback suspends while the window is minimized, the browser tab is hidden, or the screensaver is active; timers are cleaned up on unmount. Reduced-motion preferences disable decorative animation.

The playback reducer has checks for idle, pause, stepping, completion, replay, and reset. Run `pnpm test:demo` with Node.js 22.18+ (tested with Node.js 24).

## Project playgrounds

Relay now supports pointer and arrow-key node movement, an explicit ticket/clarification branch, a sample JSON inspector, and voice-to-reply story cards. Local AI offers two runnable canned prompts. The homelab has selectable machines and stop/restart controls with dependent health feedback. NAS sample files can be dragged between folders or moved using selection buttons on touch and keyboard devices. Guided traces remain separate illustrative examples.

Every demo includes the project scope, lessons, and available evidence links. No actual project screenshots were supplied or found in Relay's public repository; conceptual illustrations are not presented as screenshots. The welcome screen prioritizes work, biography, and contact. Sound starts muted, with persisted volume and a test control in the tray. Keyboard shortcuts: F1 welcome, Alt+P projects, Alt+M mute (ignored while editing form fields).

### Finishing pass and evidence

The homelab and NAS now use their direct interactions without a second independent playback. Relay JSON/logs and project lessons are expandable. Related evidence from Cyberdeck and CloudLink is distinguished from the separate lab configurations, whose repositories will be supplied later. A visually verified CloudLink dashboard screenshot is included; source provenance and reviewed GitHub commit IDs are in `public/evidence/sources.json`. These changes supersede the earlier note that no screenshots were available.
