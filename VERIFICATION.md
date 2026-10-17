# Archive95 verification

## Current desktop polish — 16 October 2026

- Production build passed, including asset generation, TypeScript, and static routes.
- Standalone `pnpm typecheck` passed.
- Five original SVG illustrations, a matching favicon, and a social image were generated. The project viewer now loads the retro assets instead of the previous engravings.
- Desktop browser checks exercised the welcome actions, project explorer preview and opening, maximize/restore, minimize/taskbar restore, and resizing to a smaller viewport. No page exceptions were observed in that interaction sequence.
- Visual review covered the welcome screen and Relay document at 1440 × 900, and the welcome screen at 390 × 844. The mobile document width matched the viewport without page overflow.
- All four project illustrations loaded on their direct routes in the browser. CV direct navigation preserved `/cv?lang=en`; switching to Spanish updated the document language and CV URL.
- A separate production browser context forced both Storage.getItem and Storage.setItem to throw. The desktop booted, the welcome preference remained operable in memory, and no page exception was reported.

## Remaining limits

- The upstream 98.css package emits an invalid hover media-query warning during build. The production build completes; desktop and mobile controls were inspected, but this is not an exhaustive cross-browser audit.
- A public origin is not configured. Metadata uses localhost until deployment configuration is supplied.
- Full screen-reader coverage, all game states, all keyboard sequences, Lighthouse, and real-device performance were not audited in this pass.
- Project illustrations are conceptual. External services and project claims have not been independently retested.
- Historical editorial verification from the original v0 export is superseded by this report. No previous accessibility or performance score is claimed for the desktop rewrite.

Production HTTP verification: all 22 routes/assets returned 200; server-rendered identity, contact information, and project links were present. All four project documents had no horizontal scroll overflow at 390 pixels wide.

## App interaction follow-up — 16 October 2026

- TypeScript and the production build passed after the interaction changes.
- Keyboard checks: app menus move between items and menus with arrow keys; Escape closes the menu. Start-menu Right/Left moves into and out of Programs; Escape returns focus to Start.
- Notepad Ctrl+S downloaded README.TXT. The downloaded bytes were read back and matched the two-line test document. New opened a separate blank window while preserving the existing note.
- Mail fields were visually reviewed at desktop and 390px mobile widths. At mobile width, field scroll width equalled client width (384px).
- The mobile Programs submenu stayed inside the 390px viewport (left 197px, width 180px).
- Removed duplicate keyboard activation handlers from native icon buttons. Added gesture-listener cleanup when a window unmounts, and horizontal scrolling for crowded taskbars.
- Email dispatch was not exercised. The form now accurately describes handing off to the visitor's mail application; it does not claim delivery or successful application launch.

## Interactive project demos — 16 October 2026

- Production build, TypeScript, and the playback reducer checks passed.
- Browser tests completed all six steps in both scenarios for each of the four demos (eight runs). Every run reached 100% and reported completion.
- Each demo passed Run/Pause progress preservation, Reset to 0%, dossier navigation, and a 390px viewport overflow check. No page exceptions were observed during this sequence.
- An automatic Relay run reached completion at 2x speed and enabled Replay. While minimized, progress remained at 1% across a 500ms observation; restoring the window resumed execution.
- The local AI response matched the predefined VLAN example. Spanish controls operated correctly. Reduced-motion emulation reported no connector animation.
- Desktop Relay and AI views and mobile Relay/NAS views were visually inspected. All demos use synthetic data, not live project execution or benchmarks.
- The existing 98.css and missing-public-origin build warnings remain as documented above.

## Project playgrounds — 17 October 2026

- Compared the workspace and backup before continuing. Restored the later About artwork/style and AI scenario edits from the backup; preserved those later versions outside the repository in archive95-gemini-changes-20261017. Backup itself was left unchanged.
- TypeScript, production build, and playback reducer tests passed. Existing 98.css and public-origin warnings remain.
- Browser checks passed Relay pointer drag and arrow-key movement, layout reset, both completed branches, selected-branch JSON, and Spanish clarification output. Reduced-motion mode hides the travelling packet.
- Homelab stop changed health to 502; restart restored 200. NAS files moved via both drag/drop and select/move controls. The chosen AI log prompt produced its matching predefined response.
- Saved volume survived reload; mute shortcut and welcome shortcut worked. All four project views passed horizontal-overflow checks at 390px width. Desktop welcome and mobile Relay/NAS screenshots were visually inspected. No page exceptions occurred in the sound/mobile verification sequence.
- Evidence was checked against the public Relay repository tree. Workflow sources and validation documents exist; screenshots were not found. Other project repositories/screenshots remain unsupplied. Simulations are not live acceptance evidence.
