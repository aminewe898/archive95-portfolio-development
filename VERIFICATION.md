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
