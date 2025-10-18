Diwali Lights
=============

A tiny web app to celebrate Diwali by creating colorful boxes and lighting up your screen. Built by Tech VFX King.

Live demo
---------
https://techvfxking.github.io/random-color-v1/

How to run locally
------------------
1. Open `index.html` in a browser.
2. Or serve the folder with a static server (recommended):

   # using Python 3
   python -m http.server 8000

   Then open http://localhost:8000

3. Quick run in Visual Studio Code (recommended):
   - Open the project folder in VS Code.
   - Install the "Live Server" extension (by Ritwick Dey) if you don't have it already.
   - Right-click `index.html` and choose "Open with Live Server" — the page will reload automatically when files change.

Highlights & What changed
-------------------------
- Responsive, modern CSS (hero, inputs, responsive CSS Grid, skeleton shimmer).
- Virtualized / performant rendering for large counts (only visible tiles are created).
- Slider control to change per-box animation speed; updates immediately when changed at runtime.
- Play/Pause single toggle and safe defaults (min timer, MAX_BOXES cap with confirmation).
- SEO improvements (Open Graph, Twitter meta tags, JSON-LD, canonical URL).
- Footer: share buttons (Twitter/Facebook/LinkedIn/Copy) and a modern GitHub CTA.

Developer notes — architecture & key files
-----------------------------------------
- `index.html` — page markup, controls, instruction accordion, and the grid container.
- `styles.css` — all styling: layout, responsive breakpoints, skeleton loader, custom scrollbar, and accordion styles.
- `scripts.js` — application logic. Main responsibilities:
  - Create and virtual-render the colored boxes (`renderVirtualGrid`, `addBoxItem`).
  - Manage per-box intervals for color changes (`onStartColor`, `onStopColor`, `restartIntervals`).
  - Wire UI: Submit button, Play/Pause button, timer slider, share buttons, and the instruction accordion.

Key constants and where to change them
-------------------------------------
- MAX_BOXES (in `scripts.js`) — currently set to 300. Reduce this if you target low-power devices.
- Minimum timer throttling — the code enforces a sensible minimum of 100ms when converting slider seconds to ms.
- SHARE_URL — update in `scripts.js` when hosting at a different URL so social sharing points to the correct site.

Running & developing
---------------------
- Fast local iteration: use the Live Server extension in VS Code so the page reloads on file changes.
- Code style: the project uses plain HTML/CSS/Vanilla JS — no build step or external dependencies.

How to change the default behavior
----------------------------------
- Make the accordion collapsed by default: update the `aria-open` attribute on the `#instructions-accordion` element in `index.html`.
- Change the default number of boxes shown after Submit: adjust the logic in `addBoxItem` in `scripts.js`.
- Tweak responsive grid columns: modify the media queries in `styles.css` (look for the `grid-template-columns` rules).

Troubleshooting
---------------
- If boxes appear squished or horizontal scrolling appears, ensure you're on the latest `styles.css` — the grid rules were intentionally set to avoid horizontal overflow.
- If slider changes don't take effect while running, make sure the Play/Pause button is in the playing state (red background). The slider has a short debounce to prevent thrash on rapid scrubbing.

Accessibility notes
-------------------
- Controls include ARIA attributes (`aria-expanded`, `aria-pressed`) for improved assistive technology support.
- The instruction accordion highlights and focuses related controls to help keyboard users find UI elements.

Contributing
------------
If you'd like to contribute fixes or improvements:

1. Fork the repository and open a pull request with a clear description and screenshots if UI changes are involved.
2. Keep changes small and focused: e.g., improve a style, fix a layout bug, or add a small feature like remembering the accordion state.

Examples of low-risk improvements:
- Add keyboard-only controls for stepping through colors.
- Replace inline SVG icons with an accessible icon system and proper <title> tags.
- Add a small test harness that validates the grid renders the expected number of tiles.

License & credits
-----------------
This demo was created by Tech VFX King. Reuse and adapt for learning and demos. If you publish from this project please link back to the original repo.

What I changed
--------------
- Responsive, modern CSS (hero, inputs, grid, skeleton shimmer).
- Skeleton loading while grid is created.
- Start / Stop behavior and safety checks in `scripts.js`.
- SEO improvements: Open Graph / Twitter tags, JSON-LD, canonical URL, theme-color.
- Footer with share buttons for Twitter, Facebook, and Copy link.

Suggested social share text
-------------------------
"Diwali Lights — brighten your screen and spirit. A tiny Diwali treat for developers: https://techvfxking.github.io/random-color-v1/"

Notes
-----
- If you host at a different URL, update the SHARE_URL constant in `scripts.js` and the canonical/og:url meta tags in `index.html`.
- For social previews to show correctly, the site needs to be publicly reachable (hosting on GitHub Pages as above works).