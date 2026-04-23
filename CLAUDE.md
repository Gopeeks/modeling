# Gopika Nair — Modeling Portfolio

Static portfolio website hosted on GitHub Pages.
Live URL: https://gopeeks.github.io/modeling/

---

## Stack

- Plain HTML / CSS / JS — no framework, no build step
- GitHub Pages for hosting
- Python `livereload` for local dev server
- Google Analytics: `G-2TZHJKDNQW`

---

## File Structure

```
index.html        — page structure (minimal, mostly empty shells)
style.css         — all styles
script.js         — renders content from config, handles interactions
config.js         — SINGLE SOURCE OF TRUTH for all site content
content.md        — human-readable version of config.js (keep in sync)
dev.py            — local dev server with live reload
deploy.sh         — git add + commit + push to GitHub Pages
photos/           — web-optimized images (max 1400px, q80 JPEG)
gopika-portfolio/ — original raw files, gitignored, never commit
```

---

## How Content Works

**All site content lives in `config.js`.** `script.js` reads it on load and
renders everything into the HTML shells. Never hardcode content in `index.html`.

Key fields in `config.js`:
```js
SITE.name          // "Gopika Nair"
SITE.tagline       // subtitle under name on hero
SITE.heroImage     // path to hero background image
SITE.aboutImage    // path to about section portrait
SITE.aboutHeading  // array of lines, joined with <br>
SITE.aboutBody     // bio paragraph
SITE.email         // contact email
SITE.instagram     // full Instagram URL
SITE.linkedin      // full LinkedIn URL
SITE.photos        // array of { file, size, pos } — see below
```

### Photo entries
```js
{ file: "photos/filename.jpg", size: "normal", pos: "center center" }
```
- `size`: `"normal"` | `"tall"` (2× height) | `"wide"` (2× width)
- `pos`: optional CSS `object-position` value to control crop (default: `top`)
  - Examples: `"center center"`, `"center 30%"`, `"bottom"`
- Photos are **0-indexed** — #0 is the first item in the array

After editing `config.js`, also update `content.md` to keep them in sync.

---

## Development Workflow

```bash
# Start local dev server (auto-refreshes browser on save)
python3 dev.py
# → http://localhost:5500

# Deploy to live site
./deploy.sh "describe what changed"
```

**Never push directly** — always use `./deploy.sh` so changes are described.

### Dev mode features
When running on localhost, each gallery photo shows a gold label:
```
#0 · PGN_5948.jpg
```
Use these IDs when the user says "fix the crop on #18" etc.

---

## Adding / Optimizing Images

Original files live in `gopika-portfolio/` (gitignored).
Always export to `photos/` before committing.

After adding new photos to `config.js`, run face-crop.py to auto-set `pos` values:

```bash
python3 face-crop.py           # detect faces and update config.js
python3 face-crop.py --dry-run # preview without saving
```

Then visually verify the results in dev mode — the script occasionally produces
false positives (especially on rotated/artistic shots). Manually correct any
wrong values using the index labels (#0, #1, …) visible on localhost.

```bash
# Optimize a JPEG (resize to 1400px, q80)
sips -s formatOptions 80 -Z 1400 gopika-portfolio/file.jpg --out photos/file.jpg

# Convert CR2 (RAW) to JPEG
sips -s format jpeg -s formatOptions 80 -Z 1400 gopika-portfolio/file.CR2 --out photos/file.jpg

# Hero image — use higher quality (2400px, q90)
sips -s formatOptions 90 -Z 2400 gopika-portfolio/file.jpg --out photos/file.jpg
```

---

## Fixing Photo Crops

The user will refer to photos by their dev-mode index (e.g. "fix #18").

1. Find the entry at that index in `SITE.photos` in `config.js`
2. Add or update the `pos` field with a CSS `object-position` value
3. Save — browser reloads automatically on localhost

Common values:
- `"center center"` — show middle of image
- `"center 20%"` — show upper-middle (good for faces)
- `"center bottom"` — show bottom of image
- `"top"` — default, shows top

---

## Sections

| Section   | Key elements |
|-----------|-------------|
| Nav       | `.nav-name`, `.nav-links`, hamburger + mobile menu overlay |
| Hero      | Full-screen bg image, name, tagline, "View Portfolio" CTA → `#portfolio` |
| About     | Two-column (image + text), collapses to 1 col on mobile |
| Portfolio | CSS grid, items built dynamically from `SITE.photos` |
| Lightbox  | Click any photo; keyboard arrows + swipe to navigate |
| Contact   | Email link, Instagram, LinkedIn |
| Cookie    | Bottom-right card, dismissal stored in `localStorage('cookieChoice')` |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| > 1024px   | 4-col grid |
| ≤ 1024px   | 3-col grid |
| ≤ 768px    | 2-col grid, hamburger nav, about stacks vertically |
| ≤ 430px    | 2-col grid, smaller font sizes |

---

## Design Tokens (CSS variables)

```css
--black:      #080808
--dark:       #111111
--gold:       #c9a96e   /* accent color */
--white:      #f5f0eb
--muted:      #888
--font-serif: 'Cormorant Garamond'   /* headings, name, italic text */
--font-sans:  'Montserrat'           /* body, labels, buttons */
```
