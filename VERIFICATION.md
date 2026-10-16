> Recovery update — 16 October 2026: The active UI is now the Windows 95 desktop in `components/os`. Both homepages, localized project routes, and the CV route load it. The editorial implementation remains in the source as previous work. Descriptions and test results below concern that previous version unless explicitly stated otherwise.
# Archive95 — verification report

Date: 16 October 2026. This report distinguishes completed checks from unavailable or unfinished deliverables; it does not certify every target in the master brief.

## Build and routes

- `pnpm install --frozen-lockfile`: passed, including pnpm supply-chain policy validation.
- `pnpm build`: passed after the final application changes. Asset generation, production compilation, TypeScript and prerendering completed successfully.
- `pnpm typecheck`: passed.
- Production HTTP verification: 17 endpoints returned 200, covering both homepages, both CV language variants, all eight localized case-study routes, PDF, robots, sitemap, favicon and social image.
- Core identity, contact address and all four project links were verified in production server-rendered HTML, before JavaScript.
- Baseline `nosniff` and referrer-policy response headers were checked on the production server. HSTS and permissions policy are configured centrally in next.config.mjs.
- The sandbox is not a Git repository. The lockfile is present, but no commit, push, public deployment or domain change has been performed. A final combined command ended with Git's “not a git repository” error after the build and typecheck had already passed.

## Browser checks

Browser UI checks used the v0 development preview at localhost:3000. The host routes agent-browser localhost requests to that preview even when another port is supplied; production HTTP checks were therefore performed separately from Node against a temporary Next.js production server. That verification-only server was stopped afterward.

| Area | Actual result |
| --- | --- |
| Desktop 1440 × 1000 | Full-page and section captures reviewed; identity, illustration, actions and availability visible. |
| Tablet 768 × 1024 | Screenshot reviewed; document scroll width equals viewport width. |
| Desktop 1024 × 768 | Screenshot reviewed; no horizontal overflow. |
| Mobile 390 × 844 | Full-page capture reviewed; no horizontal overflow; first project begins around 1,377 CSS pixels, within two 844px viewports. |
| Landscape 844 × 390 | No horizontal overflow in the English homepage. |
| Reflow 720 CSS pixels | No horizontal overflow; this approximates a 1440px display at 200% zoom, not a complete real-browser zoom certification. |
| Languages | English case-study route switches to its Spanish equivalent; browser back/forward tested. Homepage switching preserves the section hash. Explicit routes remain authoritative. Storage writes are guarded; navigation was also exercised with Storage.setItem throwing, though the development shell made this an imperfect isolation test. |
| Without JavaScript | A separate browser session blocked script resources: English homepage content and navigation to the Relay case study remained functional. Other pages were verified as server HTML. This is not an exhaustive no-JavaScript test of every link. |
| Dossiers | All four projects, System Properties and Contact opened and closed. Relay minimize, taskbar restore, maximize and Escape tested. |
| Drag and resize | Relay was dragged while the viewport changed from 1440 to 1024px. Resulting bounds were left 374, right 1014, top 405, bottom 708 within a 1024 × 768 viewport. |
| Focus | Escape returned focus to the Relay opener. The keyboard skip link focused main. Windows are nonmodal and disappearing windows are inert. |
| Motion | Opening replay and Relay playback exercised. Toggling reduced motion during playback left zero active stages and zero temporary traveling frames. OS reduced motion was also enabled before a fresh navigation. |
| Hydration | The reduced-motion startup test initially found a server/client preference mismatch. A server-safe useSyncExternalStore hydration snapshot fixed it. Fresh ES and EN startup checks then showed the correct language, reduced state and no hydration overlay. |
| Clipboard | Copy-email action produced “Email copiado”. Email remains a normal selectable mailto link independently of clipboard support. |
| Idle cleanup | Inspected state showed zero running animations, zero active packet stages and zero temporary travel frames. |

The generic window state machine implements command cancellation and stacking, but exhaustive rapid-input permutations, every focus order, all corner placements and every resizing edge case were not manually tested.

## Accessibility

axe-core 4.10.3 was run in the actual browser with WCAG 2 A/AA and WCAG 2.1 AA rules:

- Spanish homepage, desktop: 25 passing checks, zero reported violations.
- English homepage, mobile: 26 passing checks, zero reported violations.
- An early contrast issue affecting annotation numbers during a faded entrance was fixed by retaining full text contrast throughout that animation.

These results are not a Lighthouse accessibility score of 100, nor a complete assistive-technology audit. Window variants, the CV and all case studies have not each received independent axe or screen-reader audits. Actual 200% browser zoom and complete keyboard-only traversal remain manual release checks.

## Performance measurements

- Production initial asset estimate: **473,362 bytes / approximately 462 KiB** in the measured production snapshot. Includes gzip-estimated HTML, initial JS/CSS, declared WOFF2 fonts and hero WebP. Does not model browser cache, negotiated Brotli, protocol overhead or native lazy-loading thresholds. Secondary artwork and the explicitly downloaded PDF are not included. Later small accessibility fixes were not re-profiled for transfer size.
- Unthrottled local development preview, `/`, viewport 390 × 844: TTFB **150.4ms**, FCP **332ms**, LCP **332ms** (tower image), CLS **0.0**. These are one local lab observation, not production or mobile-device certification.
- INP: unavailable in that measurement; no field data exists.
- Production Lighthouse: **not run**. No Chromium/Chrome binary was available in the build sandbox, and the browser host did not expose the separately served production port. No 90/95+ performance or 100 accessibility Lighthouse score is claimed.

## Generated documents and deployment configuration

- `/cv` renders the Spanish CV; `/cv?lang=en` renders English. Both have a print stylesheet.
- `/assets/cv-mohamed-amine-aslimani.pdf` was generated successfully, served with application/pdf and HTTP 200. The newly typeset one-page downloadable PDF is in English.
- Font licenses, optimized artwork, favicon and social image were generated/stored locally.
- A real site URL is not configured in this sandbox. Sitemap output is intentionally empty until NEXT_PUBLIC_SITE_URL or Vercel's production URL is available. Next.js reports a localhost metadata fallback warning. Configure the real origin and rebuild before release.
- Asset generation emitted a fontconfig configuration warning, but all requested WebP and PDF outputs were successfully created. The social artwork was not separately inspected at pixel level.

## Captured review artifacts

All paths below are browser-workspace artifacts under `/tmp/agent-browser/`, not committed public assets:

- `archive95-desktop-complete-final.png` — full desktop homepage.
- `archive95-mobile-complete-final.png` — full mobile homepage.
- `archive95-mobile-hero-final.png` — mobile opening.
- `archive95-tablet.png`, `archive95-1024.png` — intermediate responsive captures.
- `archive95-about-section.png`, `archive95-contact-section.png` — final section captures.
- `archive95-relay-walkthrough.png` — an active walkthrough stage.
- `archive95-window-maximized.png` — maximized dossier.
- `archive95-case-mobile.png`, `archive95-cv.png` — case-study and CV examples.

## Remaining deliverable gaps

1. The original, locally stored engravings are optimized raster WebP/PNG assets, **not editable layered SVG illustrations**. The requested independently animated internal-component layers and full layered engraving choreography are not delivered. HTML callouts remain separate and accessible. Pointer movement provides restrained spring translation; the requested independent-depth tilt is not implemented.
2. Demo recording was attempted across opening replay, Relay playback and window controls. Export failed because the browser runtime has no ffmpeg. **No completed video is delivered.** Screenshots were preserved instead.
3. Production Lighthouse, field INP, real-device performance, full screen-reader testing and actual 200% browser zoom remain incomplete as described above.
4. Relay's supplied repository and documentation URLs are used verbatim. This portfolio did not execute live Telegram/Groq/n8n or full Docker/PostgreSQL integration, and does not assert fresh packaged provider acceptance. External repository availability was not independently audited during this build.
5. A real canonical origin must be configured before release. Publishing remains a separate action.


## Desktop recovery checks — 16 October 2026

- Frozen-lockfile dependency installation completed.
- Production build and TypeScript check passed after route recovery.
- Production browser checks: English desktop booted, Projects opened by double-click, Start menu opened, Relay direct route opened its document, and the English CV rendered inside the resume app.
- At 390 × 844, the project window filled the desktop above the taskbar and the document had no horizontal page overflow.
- Build warnings: the third-party 98.css stylesheet contains an invalid hover media query; metadata uses localhost until a site origin is configured.
- These are recovery smoke checks, not an exhaustive audit of all desktop apps, keyboard interaction, or accessibility. No deployment performed.
