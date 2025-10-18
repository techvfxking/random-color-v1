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