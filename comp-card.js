// comp-card.js — renders comp card from config + handles dev crop/photo editing

const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const COMP_SAVE_URL = '/save-comp-layout';
const HERO = -1; // sentinel index for the hero photo

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePos(str) {
  const parts = (str || '50% 50%').trim().split(/\s+/);
  function resolve(t) {
    if (!t) return 50;
    if (t === 'left'  || t === 'top')    return 0;
    if (t === 'right' || t === 'bottom') return 100;
    if (t === 'center')                   return 50;
    const n = parseFloat(t);
    return isNaN(n) ? 50 : n;
  }
  return { x: resolve(parts[0]), y: resolve(parts[1] ?? parts[0]) };
}

function formatPos(x, y) { return `${Math.round(x)}% ${Math.round(y)}%`; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── State ─────────────────────────────────────────────────────────────────────

let draftPos   = {}; // objectPosition for each slot (HERO or 0–N)
let draftFiles = {}; // file path for each slot

let expandedIndex   = null; // which slot has edit panel open (HERO | 0..N | null)
let selectedIndex   = null; // which slot is selected for drag (HERO | 0..N | null)
let isCropModeEnabled = false;
let activeDrag      = null;
let zoomIndex       = null;
let suppressNextClick = false;

function initDraftPositions() {
  const layout = window.COMP_LAYOUT || {};
  draftPos[HERO] = layout.heroPos || SITE.compHeroPos || '57% 0%';
  (SITE.compPhotos || []).forEach((p, i) => {
    draftPos[i] = layout.photoPositions?.[String(i)] || p.pos || '50% 50%';
  });
}

function initDraftFiles() {
  const layout = window.COMP_LAYOUT || {};
  draftFiles[HERO] = layout.heroImage || SITE.compHeroImage || '';
  (SITE.compPhotos || []).forEach((p, i) => {
    draftFiles[i] = layout.photoFiles?.[String(i)] || p.file || '';
  });
}

function getPhotoPool() {
  const pool = [], seen = new Set();
  const add = f => { if (f && !seen.has(f)) { pool.push(f); seen.add(f); } };
  (SITE.compPhotoPool || []).forEach(add);
  (SITE.compPhotos    || []).forEach(({ file }) => add(file));
  (SITE.photos        || []).forEach(({ file }) => add(file));
  return pool;
}

function allIndices() {
  return [HERO, ...(SITE.compPhotos || []).map((_, i) => i)];
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function getContainer(index) {
  if (index === HERO) return document.getElementById('hero-photo');
  return document.querySelector(`.gallery figure[data-comp-index="${index}"]`);
}

function applyPos(index) {
  const pos = draftPos[index];
  const img = getContainer(index)?.querySelector('img');
  if (img) img.style.objectPosition = pos;
  if (zoomIndex === index) {
    const zi = document.getElementById('comp-zoom-img');
    if (zi) zi.style.objectPosition = pos;
  }
}

// ── Dev controls HTML ─────────────────────────────────────────────────────────

function getLabelText(index) {
  const file = (draftFiles[index] || '').split('/').pop();
  const prefix = index === HERO ? 'hero' : `#${index}`;
  return `${prefix} · ${file} · ${draftPos[index]}`;
}

function buildImageOptions(index) {
  const pool = getPhotoPool();
  const current = draftFiles[index] || '';
  if (current && !pool.includes(current)) pool.unshift(current);
  return pool.map(f => {
    const name = f.split('/').pop().replace(/\.[^.]+$/, '');
    return `<option value="${f}"${f === current ? ' selected' : ''}>${name}</option>`;
  }).join('');
}

function buildDevControlsHTML(index) {
  if (!isDev) return '';
  const isExpanded = expandedIndex === index;
  const isSelected = selectedIndex === index;
  const cropMessage = isCropModeEnabled
    ? (isSelected ? 'Drag image to reposition' : 'Click image to select for crop')
    : 'Open crop mode to adjust framing';
  return `
    <div class="dev-controls ${isExpanded ? 'is-expanded' : ''}" data-comp-index="${index}">
      <button type="button" class="dev-expand-btn" data-comp-index="${index}">
        ${isExpanded ? 'Close' : 'Edit'}
      </button>
      <div class="dev-controls-panel">
        <div class="dev-label">${getLabelText(index)}</div>
        <label class="dev-control">
          <span>Image</span>
          <select class="dev-select" data-control="image" data-comp-index="${index}">
            ${buildImageOptions(index)}
          </select>
        </label>
        <div class="dev-crop-hint">${cropMessage}</div>
        <button type="button" class="dev-zoom-btn" data-comp-index="${index}">Zoom In</button>
        <button type="button" class="dev-save-btn" data-comp-index="${index}">Save</button>
      </div>
    </div>`;
}

// ── Update dev panel content without full re-render ───────────────────────────

function updateDevLabel(index) {
  const container = getContainer(index);
  const label = container?.querySelector('.dev-label');
  if (label) label.textContent = getLabelText(index);
}

function updateDevControlMessages() {
  if (!isDev) return;
  allIndices().forEach(index => {
    const container = getContainer(index);
    const hint = container?.querySelector('.dev-crop-hint');
    if (!hint) return;
    const isSelected = selectedIndex === index;
    hint.textContent = isCropModeEnabled
      ? (isSelected ? 'Drag image to reposition' : 'Click image to select for crop')
      : 'Open crop mode to adjust framing';
  });
}

function syncCropSelection() {
  if (!isDev) return;
  allIndices().forEach(index => {
    const container = getContainer(index);
    if (container) container.classList.toggle('crop-selected', isCropModeEnabled && selectedIndex === index);
  });
}

// ── Toggle edit panel ─────────────────────────────────────────────────────────

function toggleEditor(index) {
  const next = expandedIndex === index ? null : index;
  // Deselect if closing the selected slot's panel
  if (expandedIndex !== null && expandedIndex !== next && selectedIndex === expandedIndex) {
    selectedIndex = null;
  }
  expandedIndex = next;

  allIndices().forEach(i => {
    const container = getContainer(i);
    if (!container) return;
    const controls = container.querySelector('.dev-controls');
    const btn = controls?.querySelector('.dev-expand-btn');
    const isOpen = i === expandedIndex;
    controls?.classList.toggle('is-expanded', isOpen);
    if (btn) btn.textContent = isOpen ? 'Close' : 'Edit';
  });

  syncCropSelection();
  updateDevControlMessages();
}

// ── Crop mode ─────────────────────────────────────────────────────────────────

function setCropMode(enabled) {
  isCropModeEnabled = enabled;
  document.body.classList.toggle('comp-crop-mode', enabled);
  const btn = document.getElementById('dev-crop-toggle-btn');
  if (btn) {
    btn.textContent = enabled ? 'Crop Mode On' : 'Crop Mode';
    btn.classList.toggle('active', enabled);
  }
  if (!enabled) { selectedIndex = null; closeZoom(); }
  syncCropSelection();
  updateDevControlMessages();
}

// ── Crop drag ─────────────────────────────────────────────────────────────────

function startCropDrag(event) {
  if (!isDev || !isCropModeEnabled) return false;

  let index = null;
  if (event.target.closest('#hero-photo')) index = HERO;
  else {
    const fig = event.target.closest('.gallery figure[data-comp-index]');
    if (fig) index = parseInt(fig.dataset.compIndex, 10);
  }
  if (index === null) return false;
  if (expandedIndex !== index) return false; // panel must be open

  // If not yet selected for this slot, select it on click (no drag)
  if (selectedIndex !== index) {
    selectedIndex = index;
    syncCropSelection();
    updateDevControlMessages();
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  // Already selected — start a drag
  const container = getContainer(index);
  if (!container) return false;
  const rect = container.getBoundingClientRect();
  const p = parsePos(draftPos[index]);

  activeDrag = {
    index,
    startX: event.clientX, startY: event.clientY,
    originX: p.x, originY: p.y,
    w: Math.max(rect.width, 1), h: Math.max(rect.height, 1),
    moved: false, isZoom: false,
    pointerId: event.pointerId,
  };
  document.body.classList.add('comp-dragging');
  event.preventDefault();
  event.stopPropagation();
  return true;
}

function onPointerMove(event) {
  if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
  event.preventDefault();
  const dx = (event.clientX - activeDrag.startX) / activeDrag.w * 100;
  const dy = (event.clientY - activeDrag.startY) / activeDrag.h * 100;
  if (Math.hypot(dx, dy) > 0.5) activeDrag.moved = true;
  if (!activeDrag.moved) return;
  draftPos[activeDrag.index] = formatPos(
    clamp(activeDrag.originX - dx, 0, 100),
    clamp(activeDrag.originY - dy, 0, 100),
  );
  applyPos(activeDrag.index);
  updateDevLabel(activeDrag.index);
}

function onPointerUp(event) {
  if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
  activeDrag = null;
  document.body.classList.remove('comp-dragging');
}

// ── Zoom overlay ──────────────────────────────────────────────────────────────

function openZoom(index) {
  zoomIndex = index;
  const overlay   = document.getElementById('comp-zoom-overlay');
  const container = document.getElementById('comp-zoom-container');
  const img       = document.getElementById('comp-zoom-img');
  if (!overlay || !container || !img) return;

  const src = getContainer(index);
  if (src) {
    const r = src.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) container.style.aspectRatio = `${r.width} / ${r.height}`;
  }
  img.src = draftFiles[index] || '';
  img.style.objectPosition = draftPos[index] || '50% 50%';
  overlay.classList.add('visible');
}

function closeZoom() {
  document.getElementById('comp-zoom-overlay')?.classList.remove('visible');
  zoomIndex = null;
}

// ── Save ──────────────────────────────────────────────────────────────────────

async function saveCompLayout() {
  const payload = {
    heroPos:   draftPos[HERO],
    heroImage: draftFiles[HERO],
    photoPositions: Object.fromEntries((SITE.compPhotos || []).map((_, i) => [String(i), draftPos[i]])),
    photoFiles:     Object.fromEntries((SITE.compPhotos || []).map((_, i) => [String(i), draftFiles[i]])),
  };
  try {
    const res = await fetch(COMP_SAVE_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    window.COMP_LAYOUT = payload;
    renderSaveStatus('Saved');
  } catch (e) {
    console.error('Comp save failed:', e);
    renderSaveStatus('Save failed');
  }
}

function renderSaveStatus(message) {
  const el = document.getElementById('dev-save-status');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(renderSaveStatus._t);
  renderSaveStatus._t = setTimeout(() => el.classList.remove('visible'), 1800);
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderHeader() {
  const nameEl = document.getElementById('comp-name');
  if (nameEl) nameEl.textContent = SITE.name || '';
  const emailEl = document.getElementById('comp-email');
  if (emailEl) { emailEl.href = `mailto:${SITE.email}`; emailEl.textContent = SITE.email || ''; }
  const igEl = document.getElementById('comp-instagram');
  if (igEl) { igEl.href = SITE.instagram || '#'; igEl.textContent = (SITE.instagram || '').replace('https://', ''); }
}

function renderMeasurements() {
  const s = SITE.stats || {};
  const map = {
    'comp-height': s.height, 'comp-bust': s.bust, 'comp-waist': s.waist, 'comp-hips': s.hips,
    'comp-dress': s.dress ? `${s.dress} / 4` : '', 'comp-shoe': s.shoe, 'comp-hair': s.hair, 'comp-eyes': s.eyes,
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  });
}

function renderHero() {
  const img = document.getElementById('hero-img');
  if (!img) return;
  img.src = draftFiles[HERO] || '';
  img.alt = `${SITE.name || ''} front-facing portrait`;
  img.style.objectPosition = draftPos[HERO];

  if (isDev) {
    const section = document.getElementById('hero-photo');
    if (section) {
      section.querySelector('.dev-controls')?.remove();
      section.insertAdjacentHTML('afterbegin', buildDevControlsHTML(HERO));
    }
  }
}

function renderGallery() {
  const gallery = document.getElementById('comp-gallery');
  if (!gallery) return;
  gallery.innerHTML = '';
  (SITE.compPhotos || []).forEach((photo, i) => {
    const figure = document.createElement('figure');
    figure.dataset.compIndex = i;
    const img = document.createElement('img');
    img.src = draftFiles[i] || photo.file;
    img.alt = `${SITE.name || ''} comp photo ${i + 1}`;
    img.style.objectPosition = draftPos[i];
    figure.appendChild(img);
    if (isDev) figure.insertAdjacentHTML('afterbegin', buildDevControlsHTML(i));
    gallery.appendChild(figure);
  });
}

// ── Dev UI setup ──────────────────────────────────────────────────────────────

function renderDevUI() {
  if (!isDev) return;

  document.body.classList.add('dev-mode');

  // Crop Mode toggle (bottom-left, same as gallery)
  const cropBtn = document.createElement('button');
  cropBtn.id = 'dev-crop-toggle-btn';
  cropBtn.type = 'button';
  cropBtn.className = 'dev-crop-toggle-btn';
  cropBtn.textContent = 'Crop Mode';
  document.body.appendChild(cropBtn);

  // Save status (bottom-right, same as gallery)
  const status = document.createElement('div');
  status.id = 'dev-save-status';
  status.className = 'dev-save-status';
  document.body.appendChild(status);

  // Zoom overlay
  const overlay = document.createElement('div');
  overlay.id = 'comp-zoom-overlay';
  overlay.innerHTML = `
    <button id="comp-zoom-close" title="Close (Esc)">&times;</button>
    <div id="comp-zoom-container">
      <img id="comp-zoom-img" alt="" draggable="false">
    </div>
    <p id="comp-zoom-hint">Drag to reposition &nbsp;·&nbsp; Esc to close</p>
  `;
  document.body.appendChild(overlay);

  document.getElementById('comp-zoom-close').onclick = closeZoom;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeZoom(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && zoomIndex !== null) closeZoom(); });

  // Drag within zoom overlay
  document.getElementById('comp-zoom-img').addEventListener('pointerdown', event => {
    if (zoomIndex === null) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const p = parsePos(draftPos[zoomIndex]);
    activeDrag = {
      index: zoomIndex,
      startX: event.clientX, startY: event.clientY,
      originX: p.x, originY: p.y,
      w: Math.max(rect.width, 1), h: Math.max(rect.height, 1),
      moved: false, isZoom: true,
      pointerId: event.pointerId,
    };
    document.body.classList.add('comp-dragging');
    event.preventDefault();
    event.stopPropagation();
  }, { passive: false });

  // Click handler (expand/select/save/zoom buttons + image click-to-select)
  document.addEventListener('click', e => {
    if (suppressNextClick) { suppressNextClick = false; return; }

    // Expand/close button
    const expandBtn = e.target.closest('.dev-expand-btn[data-comp-index]');
    if (expandBtn) {
      e.preventDefault();
      e.stopPropagation();
      const index = Number(expandBtn.dataset.compIndex);
      toggleEditor(index);
      return;
    }

    // Save button
    const saveBtn = e.target.closest('.dev-save-btn[data-comp-index]');
    if (saveBtn) {
      e.preventDefault();
      e.stopPropagation();
      void saveCompLayout();
      return;
    }

    // Zoom button
    const zoomBtn = e.target.closest('.dev-zoom-btn[data-comp-index]');
    if (zoomBtn) {
      e.preventDefault();
      e.stopPropagation();
      const index = Number(zoomBtn.dataset.compIndex);
      openZoom(index);
      return;
    }

    // Absorb any other click within dev-controls
    if (e.target.closest('.dev-controls')) {
      e.stopPropagation();
      return;
    }

    // Image click to select for crop
    if (isCropModeEnabled) {
      let index = null;
      if (e.target.closest('#hero-photo')) index = HERO;
      else {
        const fig = e.target.closest('.gallery figure[data-comp-index]');
        if (fig) index = parseInt(fig.dataset.compIndex, 10);
      }
      if (index !== null && expandedIndex === index) {
        selectedIndex = index;
        syncCropSelection();
        updateDevControlMessages();
        return;
      }
    }
  });

  // Crop toggle button
  document.addEventListener('click', e => {
    const btn = e.target.closest('#dev-crop-toggle-btn');
    if (!btn) return;
    setCropMode(!isCropModeEnabled);
  });

  // Dropdown change
  document.addEventListener('change', e => {
    const select = e.target.closest('.dev-select[data-control="image"][data-comp-index]');
    if (!select) return;
    e.stopPropagation();
    const index = Number(select.dataset.compIndex);
    const newFile = select.value;
    draftFiles[index] = newFile;
    draftPos[index] = '50% 50%';
    const img = getContainer(index)?.querySelector('img');
    if (img) { img.src = newFile; img.style.objectPosition = '50% 50%'; }
    if (zoomIndex === index) {
      const zi = document.getElementById('comp-zoom-img');
      if (zi) { zi.src = newFile; zi.style.objectPosition = '50% 50%'; }
    }
    updateDevLabel(index);
    // Rebuild options to reflect new selection
    const sel = getContainer(index)?.querySelector('.dev-select[data-control="image"]');
    if (sel) sel.innerHTML = buildImageOptions(index);
  });

  // Pointer drag handlers
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('.dev-controls')) return;
    if (e.target.closest('#comp-zoom-overlay')) return;
    startCropDrag(e);
  });
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup', onPointerUp);
}

// ── Init ──────────────────────────────────────────────────────────────────────

initDraftPositions();
initDraftFiles();
renderHeader();
renderHero();
renderGallery();
renderMeasurements();
renderDevUI();
