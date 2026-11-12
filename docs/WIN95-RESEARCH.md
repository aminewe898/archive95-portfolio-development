# Windows 95 research and gap list

Researched 12 November 2026 to decide what Archive95 should copy from the real Windows 95 shell. Every rule below names its source. "Guidelines" means Microsoft's own *The Windows Interface Guidelines — A Guide for Designing Software* (preliminary release, February 1995), which was read in full text for the chapters on the environment, interaction, windows, menus, secondary windows, system integration and visual design.

## Sources

| Short name | What it is | Used for |
| --- | --- | --- |
| Guidelines | Microsoft, *The Windows Interface Guidelines — A Guide for Designing Software*, Feb 1995 preliminary release ([PDF](https://ics.uci.edu/~kobsa/courses/ICS104/course-notes/Microsoft_WindowsGuidelines.pdf)) | Window, menu, dialog, taskbar, selection and visual rules |
| KB Q126449 | Microsoft Knowledge Base, "Keyboard Shortcuts for Windows 95" ([mirror](https://techshelps.github.io/MSDN/KB/Source/win95x/q126449.htm)) | Every keyboard and mouse-modifier shortcut |
| Tips file | Windows 95 `TIPS.TXT` from the product CD ([mirror](https://discmaster.textfiles.com/view/1822/Windows%2032-bit%20Gallery.iso/win95/95help/tips.txt)) | Shell behaviours: drag rules, taskbar, clock, Start menu |
| Sullivan 1996 | Kent Sullivan (Microsoft), "The Windows 95 User Interface: A Case Study in Usability Engineering", CHI '96 ([text](https://chi1996.acm.org/proceedings/desbrief/Sullivan/kds_txt.html)) | Why the Start menu and taskbar exist |
| Trower 1995 | Tandy Trower (Microsoft), "The Top 10 Windows 95 User Interface Design Errors", MSDN News ([mirror](https://techshelps.github.io/MSDN/PERIOD95/periodic/msdnn/news4_5/human4_5.htm)) | What Microsoft itself called wrong |
| Chen 2003 | Raymond Chen, "Why do you have to click the Start button to shut down?" ([post](https://devblogs.microsoft.com/oldnewthing/20030722-00/?p=43083)) | Start button history |
| Wikipedia | [Taskbar](https://en.wikipedia.org/wiki/Taskbar), [Start menu](https://en.wikipedia.org/wiki/Start_menu), [Development of Windows 95](https://en.wikipedia.org/wiki/Development_of_Windows_95), [Microsoft Solitaire](https://en.wikipedia.org/wiki/Microsoft_Solitaire), [Microsoft Minesweeper](https://en.wikipedia.org/wiki/Microsoft_Minesweeper) | History and version differences |
| GUIdebook | [Windows 95 screenshot index](https://guidebookgallery.org/screenshots/win95) | Names of bundled windows and dialogs |
| Colour table | Brett Horsting, "Windows System Colors" ([post](https://www.brethorsting.com/blog/2007/12/windows-system-colors/)) | Classic colour values |
| Solitaire help | Windows Solitaire help, "Keeping Score" and "Setting Game Options" (search extracts; the pages refused direct access) | Solitaire options and scoring |

Not obtained: the *Introducing Microsoft Windows 95* manual (file too large to fetch), the Solitaire and Paint help files as readable text, and one Minesweeper reference page. One page fetched during research (tcrf.net) returned text addressed to AI agents instead of content; it was ignored and nothing from it is used here.

## 1. Windows

| # | Rule | Source | Archive95 before this pass |
| --- | --- | --- | --- |
| W1 | Title text is the document name, a dash, then the application name ("README.TXT - Notepad"). A tool with no documents shows only its own name. | Guidelines ch. 6, "Title Text" | Used an em dash |
| W2 | Only primary windows have a title-bar icon. Dialog boxes, property sheets and message boxes have none. | Trower 1995, error 7 | Every window had an icon |
| W3 | Only primary windows get a taskbar button. Find is a primary window even though it looks like a dialog. | Trower 1995, error 9; Guidelines ch. 10 | Dialogs had taskbar buttons |
| W4 | The window pop-up menu holds Restore, Move, Size, Minimize, Maximize and Close. Secondary windows hold only Move and Close. | Guidelines ch. 7, "The Window Pop-up Menu" | No Move or Size |
| W5 | The menu opens with a right click anywhere on the title bar, with Alt+Space, and (for compatibility) a left click on the title-bar icon. Double-clicking the icon closes the window. | Guidelines ch. 6 and 7 | Icon click only |
| W6 | Move and Size from the menu work with the arrow keys; Enter ends the operation. | Guidelines ch. 6, "Moving Windows" | Missing |
| W7 | While a window is moved or sized, "an outline representation moves with the pointer" and the window is redrawn afterwards. Redrawing live is an optional display setting. | Guidelines ch. 6 | Always redrew live |
| W8 | A reopened window returns to the size and position it had when it was last closed. | Guidelines ch. 6, "Opening and Closing Windows" | Always reopened at the default place |
| W9 | Maximizing replaces the Maximize button with Restore and disables Maximize in the menu. | Guidelines ch. 6 | Already correct |
| W10 | Clicking anywhere in a window activates it; a window does not need to be active to be moved or sized. | Guidelines ch. 6 | Already correct |
| W11 | A sizable window has sizing borders on every edge and a size grip in the lower right corner. | Guidelines ch. 6 | Already correct |
| W12 | Message box titles name the object or application. They never say "warning" or "error"; the symbol carries that. Types are Information, Warning and Critical. | Guidelines ch. 8, "Message Boxes" | Mostly correct |

## 2. Taskbar and Start menu

| # | Rule | Source | Archive95 before this pass |
| --- | --- | --- | --- |
| T1 | Start menu order: Programs, Documents, Settings, Find, Help, Run, Shut Down. | Sullivan 1996; Chen 2003; Wikipedia | Already correct |
| T2 | The button was labelled "Start" because test users did not know where to begin; Shut Down is there because users asked to shut down clicked Start. | Chen 2003 | Kept, with the "Click here to begin" hint |
| T3 | Taskbar buttons shrink to fit and show a tooltip when the title is abbreviated. | Guidelines ch. 3 | Used the browser's own tooltip |
| T4 | Clicking the button of the window that is already active does nothing. Minimizing that way arrived with Windows 98. | Wikipedia, Taskbar | Minimized (Windows 98 behaviour) |
| T5 | Taskbar right-click menu: Cascade, Tile Horizontally, Tile Vertically, Minimize All Windows, Undo Minimize All, Properties. | Tips file; KB Q126449 (Win+M, Shift+Win+M) | No Undo |
| T6 | Hovering the clock shows the date; double-clicking it opens Date/Time. | Tips file | Already correct |
| T7 | A status indicator shows a small pop-up window on a single click (the speaker shows a volume control) and a tooltip on hover. | Guidelines ch. 10, "Status Notification" | Already correct |

## 3. Desktop, icons and keyboard

| # | Rule | Source | Archive95 before this pass |
| --- | --- | --- | --- |
| D1 | Pop-up menus put the primary command first (it is the default and shown bold), then transfer commands, with Properties last. | Guidelines ch. 7 | Already correct |
| D2 | Dragging on empty background draws a bounding outline that selects what it touches. | Guidelines ch. 5, "Region Selection" | Already correct |
| D3 | Ctrl+click adds or removes one icon from the selection. | Tips file | Missing |
| D4 | Alt+Enter (or Alt+double-click) opens Properties for the selection. | KB Q126449 | Missing |
| D5 | Shift+F10 opens the pop-up menu for the selection. | KB Q126449; Guidelines ch. 7 | Missing |
| D6 | Ctrl+A selects everything; F5 refreshes; Backspace goes to the parent folder; F3 opens Find. | KB Q126449 | Only F3 |
| D7 | Tooltips are small pop-up windows shown after a short time-out at the lower right of the pointer, removed on click or when the pointer leaves. | Guidelines ch. 7, "Tooltip Controls" | Used the browser's own tooltip |

## 4. Visual design

| # | Rule | Source | Archive95 before this pass |
| --- | --- | --- | --- |
| V1 | Active title bar navy `#000080`, inactive `#808080`, face `#C0C0C0`, highlight `#000080`, tooltip `#FFFFE1`. | Colour table (Classic column) | Already correct |
| V2 | Windows and buttons use a raised outer plus raised inner border; pressed buttons and read-only fields use the sunken pair; status fields use only the sunken outer border. | Guidelines ch. 13, "Basic Border Styles" | Already correct (98.css) |
| V3 | A pressed button's label moves one pixel down and right. A button that shows a set option keeps the pressed border over a checkerboard of face and highlight colour. | Guidelines ch. 13 | Checkerboard correct |
| V4 | Unavailable labels are engraved: drawn in the highlight colour, then overlaid at a small offset in the shadow colour. | Guidelines ch. 13 | Already correct |

## 5. Bundled programs

| # | Fact | Source | Archive95 before this pass |
| --- | --- | --- | --- |
| P1 | Minesweeper levels: Beginner 8 × 8 with 10 mines, Intermediate 16 × 16 with 40, Expert 16 × 30 with 99. The 9 × 9 beginner board came later. | Contemporary Windows 95 guide found in search; Wikipedia | 9 × 9 only |
| P2 | Minesweeper has a Marks (?) option and a Best Times list that starts at 999 seconds for each level. | Same | Missing |
| P3 | Solitaire options: Draw One or Draw Three, Standard, Vegas or no scoring, Timed game, Status bar, Keep score. | Solitaire help | Draw One, no scoring |
| P4 | Solitaire standard scoring: 10 points to a foundation, 5 from the deck to a column; a timed game loses 2 points every 10 seconds and a win earns 700,000 divided by the seconds played. Recycling the deck costs 100 points in Draw One and 20 points per pass after the third in Draw Three. | Solitaire help; Microsoft KB extract | Missing |
| P5 | Solitaire Vegas scoring: the game starts at −$52 and pays $5 a card; one pass through the deck in Draw One, three in Draw Three. | Solitaire help | Missing |
| P6 | Winning Solitaire makes the cards fall off each stack and bounce across the screen. Card backs are selectable. | Wikipedia | Missing |
| P7 | Paint's shape tools are Line, Curve, Rectangle, Polygon, Ellipse and Rounded Rectangle, with a 28-colour box. | Microsoft KB Q159804 and Q176662 extracts | 28 colours; Line, Rectangle, Ellipse only |
| P8 | Date/Time Properties shows the current time zone on a world map. | GUIdebook | No map |
| P9 | The task list reached with Ctrl+Alt+Del is titled "Close Program". | GUIdebook | Already correct |

## What this pass implements

W1 to W8, T3 to T5, D3 to D7, P1 and P2. The rest of section 5 (Solitaire options and scoring, more Paint tools, the time-zone map) is still open.
