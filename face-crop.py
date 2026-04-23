#!/usr/bin/env python3
"""
face-crop.py — Detect faces in portfolio photos and update config.js
with the best CSS object-position so the face is centered and the top
of the head is never cut off.

Run any time photos are added:
  python3 face-crop.py

Dry-run (print changes without saving):
  python3 face-crop.py --dry-run
"""

import sys, os, re, subprocess

DRY_RUN = '--dry-run' in sys.argv


# ── 1. Ensure OpenCV is available ─────────────────────────────────────────────

def get_cv2():
    try:
        import cv2
        return cv2
    except ImportError:
        print("opencv-python not found — installing …")
        subprocess.check_call(
            [sys.executable, '-m', 'pip', 'install', 'opencv-python', '-q']
        )
        import cv2
        return cv2


# ── 2. Face detection → CSS object-position ───────────────────────────────────

def compute_pos(img_path, cv2):
    """
    Returns a CSS object-position string (e.g. "center 18%" or "48% 12%")
    that keeps the face centered horizontally and the top of the head
    visible vertically.
    Returns None if no face is detected.
    """
    img = cv2.imread(img_path)
    if img is None:
        return None

    ih, iw = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cv2.equalizeHist(gray, gray)

    frontal = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    profile = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_profileface.xml'
    )

    faces = []

    # Try frontal detection, progressively more lenient
    for scale, neighbors, min_sz in [(1.1, 5, 40), (1.05, 3, 25), (1.03, 2, 15)]:
        detected = frontal.detectMultiScale(
            gray, scale, neighbors, minSize=(min_sz, min_sz)
        )
        if len(detected):
            faces = detected
            break

    # Fallback: try profile view
    if not len(faces):
        for scale, neighbors, min_sz in [(1.1, 4, 40), (1.05, 3, 25)]:
            detected = profile.detectMultiScale(
                gray, scale, neighbors, minSize=(min_sz, min_sz)
            )
            if len(detected):
                faces = detected
                break

    if not len(faces):
        return None

    # Use the largest detected face (main subject)
    fx, fy, fw, fh = max(faces, key=lambda r: r[2] * r[3])

    # ── Horizontal: center on the face ────────────────────────────────────────
    cx_pct = round((fx + fw / 2) / iw * 100)

    # ── Vertical: leave room for hair / top of head ───────────────────────────
    # The face bounding box starts at the hairline roughly, but add extra
    # clearance (65% of face height) to ensure the full head is visible.
    head_top    = max(0, fy - fh * 0.65)
    # Focus on the upper face (forehead / eye level) so the face reads
    # as centered rather than being pushed to the bottom of the tile.
    focal_y     = head_top + fh * 0.30
    cy_pct      = round(min(80, max(0, focal_y / ih * 100)))

    x_part = 'center' if 45 <= cx_pct <= 55 else f'{cx_pct}%'
    return f'{x_part} {cy_pct}%'


# ── 3. Update config.js ────────────────────────────────────────────────────────

def set_pos_in_config(config_text, filepath, pos):
    """
    Update (or add) the pos field for a given file entry in config.js.
    Handles both cases: entry already has a pos field, or doesn't yet.
    """
    escaped = re.escape(filepath)

    # Case A: entry already has a pos field → replace the value
    pat_existing = (
        r'(file:\s*["\']' + escaped + r'["\'][^}]*?'
        r'pos:\s*["\'])[^"\']*(["\'])'
    )
    new_text = re.sub(pat_existing, rf'\g<1>{pos}\g<2>', config_text,
                      flags=re.DOTALL)

    if new_text != config_text:
        return new_text   # replaced successfully

    # Case B: no pos field yet → insert before closing }
    pat_no_pos = r'(file:\s*["\']' + escaped + r'["\'][^}]*?)(,?\s*})'
    new_text = re.sub(
        pat_no_pos,
        lambda m: m.group(1).rstrip() + f', pos: "{pos}" ' + '}',
        config_text,
        flags=re.DOTALL
    )
    return new_text


# ── 4. Main ────────────────────────────────────────────────────────────────────

def main():
    cv2 = get_cv2()

    with open('config.js') as f:
        config = f.read()

    # Extract all photo file paths referenced in config.js
    photos = re.findall(r'file:\s*["\']([^"\']+)["\']', config)
    print(f"Scanning {len(photos)} photo(s) for faces …\n")

    no_face  = []
    missing  = []
    updated  = config
    n_changed = 0

    for filepath in photos:
        label = filepath.replace('photos/', '')

        if not os.path.exists(filepath):
            print(f"  MISSING   {label}")
            missing.append(label)
            continue

        pos = compute_pos(filepath, cv2)

        if pos is None:
            print(f"  NO FACE   {label}  (keeping current pos)")
            no_face.append(label)
            continue

        print(f"  DETECTED  {label}  →  {pos}")
        new_config = set_pos_in_config(updated, filepath, pos)
        if new_config != updated:
            n_changed += 1
        updated = new_config

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{'Would update' if DRY_RUN else 'Updated'} {n_changed} pos value(s).")

    if missing:
        print(f"\n{len(missing)} file(s) not found on disk:")
        for f in missing:
            print(f"  {f}")

    if no_face:
        print(f"\n{len(no_face)} photo(s) with no face detected — review manually:")
        for f in no_face:
            print(f"  {f}")

    if not DRY_RUN:
        with open('config.js', 'w') as f:
            f.write(updated)
        print("\nconfig.js saved.")
    else:
        print("\n(dry-run: config.js not written)")


if __name__ == '__main__':
    main()
