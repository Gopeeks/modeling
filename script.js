// ── Apply config to page
document.getElementById('nav-name').textContent     = SITE.name;
document.getElementById('hero-bg').style.backgroundImage = `url('${SITE.heroImage}')`;
document.getElementById('hero-tagline').textContent = SITE.tagline;
document.getElementById('hero-name').textContent    = SITE.name;

document.getElementById('contact-heading').innerHTML = SITE.contactHeading.join('<br>');
document.getElementById('contact-body').textContent  = SITE.contactBody;
const emailEl = document.getElementById('contact-email');
emailEl.textContent = 'Email';
emailEl.href = `mailto:${SITE.email}`;
document.getElementById('social-instagram').textContent = 'Instagram';
document.getElementById('social-instagram').href       = SITE.instagram;
document.getElementById('footer-text').textContent     = SITE.footerText;
document.getElementById('footer-location').textContent = SITE.location;

// ── Build experience section
const expList = document.getElementById('experience-list');
SITE.experience.forEach(({ credit, detail }) => {
  expList.innerHTML += `
    <div class="experience-item">
      <span class="experience-credit">${credit}</span>
      <span class="experience-detail">${detail}</span>
    </div>`;
});

const photographerLinks = document.getElementById('photographer-links');
SITE.photographerCredits.forEach(({ handle, url, photoIndices }) => {
  const nameEl = url
    ? `<a class="photographer-name photographer-name-link" href="${url}" target="_blank" rel="noopener">${handle}</a>`
    : `<span class="photographer-name">${handle}</span>`;
  photographerLinks.innerHTML += `
    <div class="photographer-item">
      ${nameEl}
      <a class="photographer-photos-link" href="#portfolio" data-photographer="${handle}" data-photo-indices="${photoIndices.join(',')}">Photos</a>
    </div>`;
});

// ── Build portfolio grid from config
const grid = document.getElementById('grid');
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const DEV_GRID_STATE_KEY = 'devGridState';
const DEV_CROP_MODE_KEY = 'devCropModeEnabled';
const DEV_GRID_SAVE_URL = '/save-grid-layout';
const PHOTO_GROUPS = SITE.photographerCredits.map(({ handle, photoIndices }) => ({ handle, photoIndices }));
function normalizeGridSize(size) {
  if (size === 'tall') return 'tall';
  if (size === 'wide' || size === 'horizontal') return 'horizontal';
  return 'normal';
}

function getLightboxSrc(file) {
  return file;
}

function getDefaultGroupedPhotoOrder() {
  const seen = new Set();
  const grouped = [];

  PHOTO_GROUPS.forEach(({ photoIndices }) => {
    photoIndices.forEach((index) => {
      if (!seen.has(index) && SITE.photos[index]) {
        grouped.push(index);
        seen.add(index);
      }
    });
  });

  SITE.photos.forEach((_, index) => {
    if (!seen.has(index)) grouped.push(index);
  });

  return grouped;
}

function getGroupedPhotoOrder() {
  return getDefaultGroupedPhotoOrder();
}

function getDefaultSlotSizes(order) {
  const sizes = {};
  order.forEach((photoIndex, slotIndex) => {
    sizes[slotIndex] = normalizeGridSize(SITE.photos[photoIndex].size);
  });
  return sizes;
}

function getDefaultPhotoPositions() {
  const positions = {};
  SITE.photos.forEach((photo, photoIndex) => {
    positions[photoIndex] = photo.pos || '50% 50%';
  });
  return positions;
}

function getPublishedGridState() {
  return sanitizeDevGridState(window.GRID_LAYOUT || null);
}

function sanitizeDevGridState(state) {
  const defaultOrder = getDefaultGroupedPhotoOrder();
  const fallbackSizes = getDefaultSlotSizes(defaultOrder);
  const fallbackPositions = getDefaultPhotoPositions();

  if (!state || !Array.isArray(state.order)) {
    return { order: defaultOrder, slotSizes: fallbackSizes, photoPositions: fallbackPositions };
  }

  const seen = new Set();
  const order = [];
  state.order.forEach((value) => {
    if (Number.isInteger(value) && SITE.photos[value] && !seen.has(value)) {
      order.push(value);
      seen.add(value);
    }
  });
  defaultOrder.forEach((value) => {
    if (!seen.has(value)) order.push(value);
  });

  const slotSizes = {};
  order.forEach((_, slotIndex) => {
    const size = state.slotSizes?.[slotIndex];
    slotSizes[slotIndex] = normalizeGridSize(size || fallbackSizes[slotIndex] || 'normal');
  });

  const photoPositions = {};
  SITE.photos.forEach((photo, photoIndex) => {
    const nextPos = state.photoPositions?.[photoIndex];
    photoPositions[photoIndex] = typeof nextPos === 'string' && nextPos.trim()
      ? nextPos.trim()
      : fallbackPositions[photoIndex];
  });

  return { order, slotSizes, photoPositions };
}

function loadDevGridState() {
  if (!isDev) return getPublishedGridState();

  const publishedState = getPublishedGridState();
  try {
    const saved = localStorage.getItem(DEV_GRID_STATE_KEY);
    if (!saved) return publishedState;
    return sanitizeDevGridState({
      ...publishedState,
      ...JSON.parse(saved),
    });
  } catch (error) {
    return publishedState;
  }
}

let devGridState = loadDevGridState();
let devSaveStatus = '';
let isCropModeEnabled = false;
let selectedCropPhotoIndex = null;
let expandedDevSlotIndex = null;
let cropDraftPositions = { ...devGridState.photoPositions };
let activeCropDrag = null;
let suppressNextGridClick = false;
let activeReorderDrag = null;

function loadDevCropMode() {
  if (!isDev) return false;
  try {
    return localStorage.getItem(DEV_CROP_MODE_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

function persistDevCropMode() {
  if (!isDev) return;
  try {
    localStorage.setItem(DEV_CROP_MODE_KEY, String(isCropModeEnabled));
  } catch (error) {
    // Ignore storage failures in dev customization.
  }
}

isCropModeEnabled = loadDevCropMode();

function persistDevGridState() {
  if (!isDev) return;
  try {
    localStorage.setItem(DEV_GRID_STATE_KEY, JSON.stringify(devGridState));
  } catch (error) {
    // Ignore storage failures in dev customization.
  }
}

async function saveDevGridStateToFile() {
  if (!isDev) return;

  const payload = {
    order: devGridState.order,
    slotSizes: devGridState.slotSizes,
    photoPositions: devGridState.photoPositions,
  };

  try {
    const response = await fetch(DEV_GRID_SAVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Save failed with status ${response.status}`);
    window.GRID_LAYOUT = sanitizeDevGridState(payload);
    devSaveStatus = 'Saved';
    renderDevSaveStatus();
  } catch (error) {
    console.error('Failed to save grid layout file.', error);
    devSaveStatus = 'Save failed';
    renderDevSaveStatus();
  }
}

function renderDevSaveStatus() {
  if (!isDev) return;
  let status = document.getElementById('dev-save-status');
  if (!status) {
    status = document.createElement('div');
    status.id = 'dev-save-status';
    status.className = 'dev-save-status';
    document.body.appendChild(status);
  }

  status.textContent = devSaveStatus;
  status.classList.toggle('visible', Boolean(devSaveStatus));

  if (devSaveStatus) {
    window.clearTimeout(renderDevSaveStatus.hideTimer);
    renderDevSaveStatus.hideTimer = window.setTimeout(() => {
      devSaveStatus = '';
      status.classList.remove('visible');
    }, 1800);
  }
}

function renderDevCropToggle() {
  if (!isDev) return;

  let button = document.getElementById('dev-crop-toggle-btn');
  if (!button) {
    button = document.createElement('button');
    button.id = 'dev-crop-toggle-btn';
    button.type = 'button';
    button.className = 'dev-crop-toggle-btn';
    document.body.appendChild(button);
  }

  button.textContent = isCropModeEnabled ? 'Crop Mode On' : 'Crop Mode';
  button.classList.toggle('active', isCropModeEnabled);
  document.body.classList.toggle('crop-mode-enabled', isCropModeEnabled);
}

function syncDevCropSelection() {
  if (!isDev) return;

  document.querySelectorAll('.grid-item').forEach((item) => {
    const photoIndex = Number(item.dataset.photoIndex);
    item.classList.toggle('crop-selected', isCropModeEnabled && photoIndex === selectedCropPhotoIndex);
  });

  document.querySelectorAll('.dev-crop-hint').forEach((hint) => {
    const controls = hint.closest('.dev-controls');
    const slotIndex = Number(controls?.dataset.slotIndex);
    const photoIndex = Number.isInteger(slotIndex) ? devGridState.order[slotIndex] : null;

    let text = 'Open crop mode to adjust framing';
    if (isCropModeEnabled) {
      text = photoIndex === selectedCropPhotoIndex
        ? 'Use W A S D to reposition'
        : 'Click image to select for crop';
    }

    hint.textContent = text;
  });
}

function applyCropPositionToDom(photoIndex) {
  document.querySelectorAll(`.grid-item[data-photo-index="${photoIndex}"] img`).forEach((img) => {
    img.style.objectPosition = getDraftPhotoObjectPosition(photoIndex);
  });
}

function setCropDraftPosition(photoIndex, nextPosition) {
  cropDraftPositions[photoIndex] = nextPosition;
  applyCropPositionToDom(photoIndex);
}

function startCropDrag(event) {
  if (!isDev || !isCropModeEnabled) return false;
  const item = event.target.closest('.grid-item');
  if (!item) return false;

  const slotIndex = Number(item.dataset.slotIndex);
  const photoIndex = Number(item.dataset.photoIndex);
  const cropEligible = Number.isInteger(expandedDevSlotIndex) && expandedDevSlotIndex === slotIndex;
  if (!cropEligible || !Number.isInteger(photoIndex)) return false;

  const img = item.querySelector('img');
  if (!img) return false;

  selectedCropPhotoIndex = photoIndex;
  const rect = item.getBoundingClientRect();
  const startPosition = parseObjectPosition(getDraftPhotoObjectPosition(photoIndex));
  activeCropDrag = {
    pointerId: event.pointerId,
    photoIndex,
    item,
    img,
    startX: event.clientX,
    startY: event.clientY,
    width: Math.max(rect.width, 1),
    height: Math.max(rect.height, 1),
    originX: startPosition.x,
    originY: startPosition.y,
  };

  item.classList.add('dragging-crop');
  if (typeof img.setPointerCapture === 'function') {
    img.setPointerCapture(event.pointerId);
  }
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  event.preventDefault();
  event.stopPropagation();
  syncDevCropSelection();
  return true;
}

function startReorderDrag(event) {
  if (!isDev) return false;

  const item = event.target.closest('.grid-item');
  if (!item || item.closest('.dev-controls')) return false;

  const slotIndex = Number(item.dataset.slotIndex);
  if (!Number.isInteger(slotIndex)) return false;

  const rect = item.getBoundingClientRect();
  activeReorderDrag = {
    pointerId: event.pointerId,
    fromSlotIndex: slotIndex,
    item,
    preview: item.cloneNode(true),
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    rect,
    active: false,
  };

  activeReorderDrag.preview.querySelectorAll('.dev-controls').forEach((controls) => controls.remove());
  activeReorderDrag.preview.classList.add('drag-preview');
  activeReorderDrag.preview.style.width = `${rect.width}px`;
  activeReorderDrag.preview.style.height = `${rect.height}px`;
  activeReorderDrag.preview.style.position = 'fixed';
  activeReorderDrag.preview.style.margin = '0';
  activeReorderDrag.preview.style.zIndex = '400';
  activeReorderDrag.preview.style.pointerEvents = 'none';
  document.body.appendChild(activeReorderDrag.preview);
  item.classList.add('dragging-reorder-source');
  item.style.opacity = '0.22';
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  event.preventDefault();
  event.stopPropagation();
  return true;
}

function updateDevControlMessages() {
  if (!isDev) return;

  document.querySelectorAll('.dev-controls').forEach((controls) => {
    const slotIndex = Number(controls.dataset.slotIndex);
    const photoIndex = Number.isInteger(slotIndex) ? devGridState.order[slotIndex] : null;
    const hint = controls.querySelector('.dev-crop-hint');
    const label = controls.querySelector('.dev-label');

    if (label != null && photoIndex != null) {
      label.textContent = `Slot ${slotIndex} · #${photoIndex} · ${SITE.photos[photoIndex].file.replace('photos/', '')}`;
    }

    if (hint != null) {
      let text = 'Open crop mode to adjust framing';
      if (isCropModeEnabled) {
        text = photoIndex === selectedCropPhotoIndex
          ? 'Use W A S D or drag beyond the frame'
          : 'Click image to select for crop';
      }
      hint.textContent = text;
    }
  });
}

function updateSlotShapeInDom(slotIndex) {
  const photoIndex = devGridState.order[slotIndex];
  const item = document.querySelector(`.grid-item[data-slot-index="${slotIndex}"]`);
  if (!item || photoIndex == null) return;

  item.classList.remove('normal', 'tall', 'horizontal');
  item.classList.add(normalizeGridSize(devGridState.slotSizes[slotIndex]));
}

function updateSlotImageInDom(slotIndex) {
  const photoIndex = devGridState.order[slotIndex];
  const item = document.querySelector(`.grid-item[data-slot-index="${slotIndex}"]`);
  if (!item || photoIndex == null) return;

  const { file } = SITE.photos[photoIndex];
  const img = item.querySelector('img');
  const objectPosition = getDraftPhotoObjectPosition(photoIndex);

  item.dataset.photoIndex = String(photoIndex);
  item.dataset.fullSrc = file;
  item.dataset.photographer = PHOTO_GROUPS.find(({ photoIndices }) => photoIndices.includes(photoIndex))?.handle || '';

  if (img) {
    img.src = file;
    img.style.objectPosition = objectPosition;
    img.removeAttribute('srcset');
  }
}

function toggleSlotEditor(slotIndex) {
  document.querySelectorAll('.dev-controls').forEach((controls) => {
    const controlsSlotIndex = Number(controls.dataset.slotIndex);
    const button = controls.querySelector('.dev-expand-btn');
    const isExpanded = controlsSlotIndex === slotIndex && expandedDevSlotIndex === slotIndex;
    controls.classList.toggle('is-expanded', isExpanded);
    if (button) button.textContent = isExpanded ? 'Close' : 'Edit';
  });
}

function getExpandedCropPhotoIndex() {
  if (!Number.isInteger(expandedDevSlotIndex)) return null;
  return devGridState.order[expandedDevSlotIndex] ?? null;
}

function parsePositionValue(value, axis) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.endsWith('%')) return Number.parseFloat(normalized);
  if (axis === 'x') {
    if (normalized === 'left') return 0;
    if (normalized === 'right') return 100;
  }
  if (axis === 'y') {
    if (normalized === 'top') return 0;
    if (normalized === 'bottom') return 100;
  }
  return 50;
}

function parseObjectPosition(pos) {
  const raw = String(pos || '').trim();
  if (!raw) return { x: 50, y: 50 };
  const parts = raw.split(/\s+/);
  return {
    x: parsePositionValue(parts[0], 'x'),
    y: parsePositionValue(parts[1] || '50%', 'y'),
  };
}

function clampCropPosition(value) {
  // Allow pushing the image outside the frame while keeping object-position sane.
  return Math.min(Math.max(value, -200), 300);
}

function formatObjectPosition(x, y) {
  return `${clampCropPosition(x).toFixed(1)}% ${clampCropPosition(y).toFixed(1)}%`;
}

function getPhotoObjectPosition(photoIndex) {
  return devGridState.photoPositions?.[photoIndex] || SITE.photos[photoIndex].pos || '50% 50%';
}

function getDraftPhotoObjectPosition(photoIndex) {
  return cropDraftPositions?.[photoIndex] || getPhotoObjectPosition(photoIndex);
}

function getColumnCount() {
  if (window.innerWidth <= 768) return 2;
  if (window.innerWidth <= 1024) return 3;
  return 4;
}

function findPlacement(occupied, cols, size) {
  const spanCols = size === 'horizontal' ? Math.min(2, cols) : 1;
  const spanRows = size === 'tall' ? 2 : 1;
  let row = 0;

  while (true) {
    for (let col = 0; col < cols; col++) {
      if (col + spanCols > cols) continue;

      let fits = true;
      for (let r = row; r < row + spanRows && fits; r++) {
        for (let c = col; c < col + spanCols; c++) {
          if (occupied[`${r}:${c}`]) {
            fits = false;
            break;
          }
        }
      }

      if (fits) return { row, col };
    }

    row++;
  }
}

function markPlacement(occupied, placement, size) {
  const spanRows = size === 'tall' ? 2 : 1;
  const spanCols = size === 'horizontal' ? 2 : 1;

  for (let r = placement.row; r < placement.row + spanRows; r++) {
    for (let c = placement.col; c < placement.col + spanCols; c++) {
      occupied[`${r}:${c}`] = true;
    }
  }
}

function getCellCount(size) {
  if (size === 'tall') return 2;
  if (size === 'horizontal') return 2;
  return 1;
}

function findLastIndexMatching(sizes, locked, predicate) {
  for (let i = sizes.length - 1; i >= 0; i--) {
    if (!locked.has(i) && predicate(sizes[i], i)) return i;
  }

  for (let i = sizes.length - 1; i >= 0; i--) {
    if (predicate(sizes[i], i)) return i;
  }

  return -1;
}

function rebalanceGridSizes(sizes, cols, locked = new Set()) {
  let totalCells = sizes.reduce((sum, size) => sum + getCellCount(size), 0);

  while (totalCells % cols !== 0) {
    const lastTall = findLastIndexMatching(sizes, locked, size => size === 'tall');
    if (lastTall >= 0) {
      sizes[lastTall] = 'normal';
      totalCells--;
      continue;
    }

    break;
  }
}

function getInitialGridSizes(cols) {
  const sizes = SITE.photos.map(photo => normalizeGridSize(photo.size));
  const locked = new Set();

  if (cols === 4) {
    const heroGridPattern = ['tall', 'normal', 'normal', 'tall', 'normal', 'normal'];
    heroGridPattern.forEach((size, index) => {
      sizes[index] = size;
      locked.add(index);
    });
  }

  rebalanceGridSizes(sizes, cols, locked);
  return { sizes, locked };
}

function applyDevGridOverrides(order, sizes, locked) {
  if (!isDev) return;

  const devOrder = devGridState.order.slice();
  order.splice(0, order.length, ...devOrder);

  sizes.fill('normal');
  order.forEach((photoIndex, slotIndex) => {
    sizes[photoIndex] = normalizeGridSize(devGridState.slotSizes[slotIndex]);
  });

  locked.clear();
}

function reduceTallAdjacency(order, sizes, cols, locked) {
  for (let pass = 0; pass < SITE.photos.length; pass++) {
    const occupied = {};
    const tallStartsByRow = new Map();
    let changed = false;

    for (const index of order) {
      let size = sizes[index];
      let placement = findPlacement(occupied, cols, size);

      // Prefer mixing tile heights within a row. If a tall tile would sit
      // directly beside another tall tile, downgrade it and rebalance later.
      if (size === 'tall') {
        const rowTallStarts = tallStartsByRow.get(placement.row) || [];
        const hasAdjacentTall = rowTallStarts.some(col => Math.abs(col - placement.col) === 1);

        if (hasAdjacentTall && !locked.has(index)) {
          size = 'normal';
          sizes[index] = 'normal';
          placement = findPlacement(occupied, cols, size);
          changed = true;
        }
      }

      if (size === 'tall') {
        const rowTallStarts = tallStartsByRow.get(placement.row) || [];
        rowTallStarts.push(placement.col);
        tallStartsByRow.set(placement.row, rowTallStarts);
      }

      markPlacement(occupied, placement, size);
    }

    if (!changed) break;
    rebalanceGridSizes(sizes, cols, locked);
  }

  rebalanceGridSizes(sizes, cols, locked);
}

function getPlacements(order, sizes, cols) {
  const occupied = {};
  const placements = new Map();

  order.forEach((index) => {
    const placement = findPlacement(occupied, cols, sizes[index]);
    placements.set(index, placement);
    markPlacement(occupied, placement, sizes[index]);
  });

  return placements;
}

function getRowCoverage(order, sizes, cols) {
  const placements = getPlacements(order, sizes, cols);
  const maxRow = order.reduce((max, index) => {
    const placement = placements.get(index);
    const lastRow = placement.row + (sizes[index] === 'tall' ? 1 : 0);
    return Math.max(max, lastRow);
  }, 0);
  const rows = Array.from({ length: maxRow + 1 }, (_, row) => ({ row, hasTall: false, normalIndices: [] }));

  order.forEach((index) => {
    const placement = placements.get(index);
    const spanRows = sizes[index] === 'tall' ? 2 : 1;

    for (let row = placement.row; row < placement.row + spanRows; row++) {
      rows[row].hasTall = rows[row].hasTall || sizes[index] === 'tall';
      if (sizes[index] === 'normal' && row === placement.row) rows[row].normalIndices.push(index);
    }
  });

  return { placements, rows };
}

function rangesOverlap(startA, spanA, startB, spanB) {
  return startA < startB + spanB && startB < startA + spanA;
}

function areSideBySide(aPlacement, aSize, bPlacement, bSize) {
  const aRowSpan = aSize === 'tall' ? 2 : 1;
  const bRowSpan = bSize === 'tall' ? 2 : 1;

  const rowsOverlap = rangesOverlap(aPlacement.row, aRowSpan, bPlacement.row, bRowSpan);
  if (!rowsOverlap) return false;

  const aRight = aPlacement.col + 1;
  const bRight = bPlacement.col + 1;
  return aRight === bPlacement.col || bRight === aPlacement.col;
}

function keepPhotosSeparated(order, sizes, cols, firstIndex, secondIndex, lockedOrderCount = 0) {
  for (let pass = 0; pass < order.length; pass++) {
    const placements = getPlacements(order, sizes, cols);
    const firstPlacement = placements.get(firstIndex);
    const secondPlacement = placements.get(secondIndex);

    if (!firstPlacement || !secondPlacement) break;
    if (!areSideBySide(firstPlacement, sizes[firstIndex], secondPlacement, sizes[secondIndex])) break;

    const currentPos = order.indexOf(secondIndex);
    const nextPos = currentPos + 1;

    if (currentPos < lockedOrderCount || nextPos >= order.length) break;

    [order[currentPos], order[nextPos]] = [order[nextPos], order[currentPos]];
  }
}

function ensureTallPerRow(order, sizes, cols, locked) {
  for (let pass = 0; pass < SITE.photos.length; pass++) {
    const { placements, rows } = getRowCoverage(order, sizes, cols);
    const missingRow = rows.find(({ hasTall }) => !hasTall);

    if (!missingRow) break;

    const rowItems = order
      .map((index, orderPos) => ({ index, orderPos, placement: placements.get(index) }))
      .filter(({ placement, index }) => {
        const spanRows = sizes[index] === 'tall' ? 2 : 1;
        return missingRow.row >= placement.row && missingRow.row < placement.row + spanRows;
      });

    const insertAfter = rowItems.reduce((max, item) => Math.max(max, item.orderPos), -1);
    let candidatePos = order.findIndex((index, orderPos) => (
      orderPos > insertAfter &&
      sizes[index] === 'tall' &&
      !locked.has(index)
    ));

    if (candidatePos === -1) {
      for (let orderPos = order.length - 1; orderPos >= 0; orderPos--) {
        const index = order[orderPos];
        if (orderPos > insertAfter) continue;
        if (sizes[index] !== 'tall' || locked.has(index)) continue;
        candidatePos = orderPos;
        break;
      }
    }

    if (candidatePos === -1) break;

    const [candidate] = order.splice(candidatePos, 1);
    const targetPos = candidatePos < insertAfter ? insertAfter : insertAfter + 1;
    order.splice(targetPos, 0, candidate);
  }
}

function getLayoutPlan(cols) {
  const publishedState = getPublishedGridState();
  const order = isDev ? getGroupedPhotoOrder() : publishedState.order.slice();
  const { sizes, locked } = getInitialGridSizes(cols);

  applyDevGridOverrides(order, sizes, locked);

  if (!isDev) {
    sizes.fill('normal');
    order.forEach((photoIndex, slotIndex) => {
      sizes[photoIndex] = normalizeGridSize(publishedState.slotSizes[slotIndex]);
    });
    return { order, sizes };
  }

  if (isDev) {
    return { order, sizes };
  }

  reduceTallAdjacency(order, sizes, cols, locked);
  ensureTallPerRow(order, sizes, cols, locked);

  if (cols === 4) {
    keepPhotosSeparated(order, sizes, cols, 20, 21, 6);
  }

  return { order, sizes };
}

let currentCols = null;

function buildDevOptions(selectedIndex) {
  return SITE.photos.map(({ file }, photoIndex) => {
    const selected = photoIndex === selectedIndex ? ' selected' : '';
    return `<option value="${photoIndex}"${selected}>#${photoIndex} · ${file.replace('photos/', '')}</option>`;
  }).join('');
}

function buildDevControls(slotIndex, photoIndex) {
  if (!isDev) return '';
  const selectedSize = normalizeGridSize(devGridState.slotSizes[slotIndex]);
  const isExpanded = expandedDevSlotIndex === slotIndex;
  const cropMessage = isCropModeEnabled
    ? (selectedCropPhotoIndex === photoIndex ? 'Use W A S D or drag beyond the frame' : 'Click image to select for crop')
    : 'Open crop mode to adjust framing';
  return `
    <div class="dev-controls ${isExpanded ? 'is-expanded' : ''}" data-slot-index="${slotIndex}">
      <button type="button" class="dev-expand-btn" data-slot-index="${slotIndex}">
        ${isExpanded ? 'Close' : 'Edit'}
      </button>
      <div class="dev-controls-panel">
        <div class="dev-label">Slot ${slotIndex} · #${photoIndex} · ${SITE.photos[photoIndex].file.replace('photos/', '')}</div>
        <label class="dev-control">
          <span>Image</span>
          <select class="dev-select" data-control="image" data-slot-index="${slotIndex}">
            ${buildDevOptions(photoIndex)}
          </select>
        </label>
        <label class="dev-control">
          <span>Shape</span>
          <select class="dev-select" data-control="shape" data-slot-index="${slotIndex}">
            <option value="normal"${selectedSize === 'normal' ? ' selected' : ''}>Square</option>
            <option value="tall"${selectedSize === 'tall' ? ' selected' : ''}>Vertical</option>
            <option value="horizontal"${selectedSize === 'horizontal' ? ' selected' : ''}>Horizontal</option>
          </select>
        </label>
        <div class="dev-crop-hint">${cropMessage}</div>
        <button type="button" class="dev-save-btn" data-slot-index="${slotIndex}">Save</button>
      </div>
    </div>`;
}

function renderGrid() {
  const cols = getColumnCount();
  const { order, sizes } = getLayoutPlan(cols);

  renderDevCropToggle();
  grid.innerHTML = '';

  order.forEach((index, renderIndex) => {
    const { file } = SITE.photos[index];
    const div = document.createElement('div');
    div.className = `grid-item ${normalizeGridSize(sizes[index])} reveal`;
    if (isDev && isCropModeEnabled && selectedCropPhotoIndex === index) {
      div.classList.add('crop-selected');
    }
    div.dataset.delay = (renderIndex % cols) * 80;
    div.dataset.fullSrc = getLightboxSrc(file);
    div.dataset.photoIndex = index;
    div.dataset.slotIndex = renderIndex;
    const photographer = PHOTO_GROUPS.find(({ photoIndices }) => photoIndices.includes(index))?.handle || '';
    div.dataset.photographer = photographer;
    const label = isDev
      ? buildDevControls(renderIndex, index)
      : '';
    const objectPosition = getDraftPhotoObjectPosition(index);
    const imgStyle = objectPosition ? ` style="object-position:${objectPosition}"` : '';
    const altText = photographer
      ? `Gopika Nair, NYC model — photo by ${photographer}`
      : `Gopika Nair, NYC model`;
    div.innerHTML = `<img src="${file}" alt="${altText}" loading="lazy" draggable="false"${imgStyle}><div class="grid-overlay"></div>${label}`;
    grid.appendChild(div);
    observer.observe(div);
  });

  applyPhotographerFilter(activePhotographerFilter);
  currentCols = cols;
}

// ── Nav scroll effect
const nav = document.getElementById('nav');
const navName = document.getElementById('nav-name');
const hero = document.getElementById('hero');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
  navName.classList.toggle('visible', window.scrollY > hero.offsetHeight * 0.85);
});

// ── Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => {
  if (!el.closest('.grid')) observer.observe(el);
});

// ── Lightbox
const lightbox = document.getElementById('lightbox');
const lbImg    = document.getElementById('lb-img');
const lbClose  = document.getElementById('lb-close');
const lbPrev   = document.getElementById('lb-prev');
const lbNext   = document.getElementById('lb-next');

let items   = [];
let current = 0;
let activePhotographerFilter = null;
let photographerFilterTimeout = null;

// Items are built dynamically, so grab them after grid renders
function getItems() { return Array.from(document.querySelectorAll('.grid-item')); }

function updateDevSlotImage(slotIndex, nextPhotoIndex) {
  const currentPhotoIndex = devGridState.order[slotIndex];
  if (currentPhotoIndex === nextPhotoIndex) return [slotIndex];

  const existingSlot = devGridState.order.indexOf(nextPhotoIndex);
  if (existingSlot >= 0) {
    [devGridState.order[slotIndex], devGridState.order[existingSlot]] = [devGridState.order[existingSlot], devGridState.order[slotIndex]];
    return [slotIndex, existingSlot];
  } else {
    devGridState.order[slotIndex] = nextPhotoIndex;
    return [slotIndex];
  }
}

function updateDevSlotSize(slotIndex, nextSize) {
  devGridState.slotSizes[slotIndex] = normalizeGridSize(nextSize);
}

function updateDevPhotoPosition(photoIndex, nextPosition) {
  devGridState.photoPositions[photoIndex] = nextPosition;
}

function applyPhotographerFilter(handle) {
  activePhotographerFilter = handle;
  if (photographerFilterTimeout) {
    clearTimeout(photographerFilterTimeout);
    photographerFilterTimeout = null;
  }
  getItems().forEach((item) => {
    const isMatch = !handle || item.dataset.photographer === handle;
    item.classList.toggle('dimmed', !isMatch);
  });
  document.querySelectorAll('.photographer-photos-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.photographer === handle);
  });
  if (handle) {
    photographerFilterTimeout = setTimeout(() => applyPhotographerFilter(null), 4000);
  }
}

const lbThumbs = document.getElementById('lb-thumbs');

// ── Lightbox zoom + pan
const LB_ZOOM_SCALE = 2.5;
let lbZoomed = false;
let lbPanX = 0, lbPanY = 0;
let lbPanDrag = null;
let lbLastPanWasMoved = false; // preserved across pointerup → click

function applyLbTransform() {
  lbImg.style.transform = lbZoomed
    ? `scale(${LB_ZOOM_SCALE}) translate(${lbPanX}px, ${lbPanY}px)`
    : '';
}

function resetLbZoom() {
  lbZoomed = false; lbPanX = 0; lbPanY = 0; lbPanDrag = null; lbLastPanWasMoved = false;
  lbImg.classList.remove('lb-zoomed', 'lb-panning');
  applyLbTransform();
}

lbImg.addEventListener('click', e => {
  e.stopPropagation();
  if (lbLastPanWasMoved) { lbLastPanWasMoved = false; return; } // was a pan, not a tap
  if (lbZoomed) {
    resetLbZoom();
  } else {
    lbZoomed = true; lbPanX = 0; lbPanY = 0;
    lbImg.classList.add('lb-zoomed');
    applyLbTransform();
  }
});

lbImg.addEventListener('pointerdown', e => {
  if (!lbZoomed) return;
  e.preventDefault(); e.stopPropagation();
  lbLastPanWasMoved = false;
  lbPanDrag = { startX: e.clientX, startY: e.clientY, originX: lbPanX, originY: lbPanY, moved: false };
  lbImg.classList.add('lb-panning');
  lbImg.setPointerCapture(e.pointerId);
});

lbImg.addEventListener('pointermove', e => {
  if (!lbPanDrag) return;
  const dx = (e.clientX - lbPanDrag.startX) / LB_ZOOM_SCALE;
  const dy = (e.clientY - lbPanDrag.startY) / LB_ZOOM_SCALE;
  if (Math.hypot(dx, dy) > 2) lbPanDrag.moved = true;
  lbPanX = lbPanDrag.originX + dx;
  lbPanY = lbPanDrag.originY + dy;
  applyLbTransform();
});

lbImg.addEventListener('pointerup', () => {
  if (!lbPanDrag) return;
  lbLastPanWasMoved = lbPanDrag.moved; // save before clearing
  lbImg.classList.remove('lb-panning');
  lbPanDrag = null;
});

function buildLbThumbs() {
  lbThumbs.innerHTML = '';
  items.forEach((item, i) => {
    const src = item.querySelector('img')?.src || '';
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.dataset.lbIndex = i;
    if (i === current) img.classList.add('lb-thumb-active');
    lbThumbs.appendChild(img);
  });
}

function updateLbThumbs() {
  lbThumbs.querySelectorAll('img').forEach((img, i) => {
    img.classList.toggle('lb-thumb-active', i === current);
  });
  // Scroll active thumb into view
  const activeThumb = lbThumbs.querySelector('.lb-thumb-active');
  if (activeThumb) activeThumb.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}

function setLbAlt() {
  const ph = items[current]?.dataset.photographer;
  lbImg.alt = ph ? `Gopika Nair, NYC model — photo by ${ph}` : `Gopika Nair, NYC model`;
}
function openLightbox(index) {
  items   = getItems();
  current = index;
  resetLbZoom();
  lbImg.src = items[current].dataset.fullSrc || items[current].querySelector('img').src;
  setLbAlt();
  buildLbThumbs();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  resetLbZoom();
}
function showNext() {
  items   = getItems();
  current = (current + 1) % items.length;
  resetLbZoom();
  lbImg.src = items[current].dataset.fullSrc || items[current].querySelector('img').src;
  setLbAlt();
  updateLbThumbs();
}
function showPrev() {
  items   = getItems();
  current = (current - 1 + items.length) % items.length;
  resetLbZoom();
  lbImg.src = items[current].dataset.fullSrc || items[current].querySelector('img').src;
  setLbAlt();
  updateLbThumbs();
}

grid.addEventListener('click', (e) => {
  if (suppressNextGridClick) {
    suppressNextGridClick = false;
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  const expandButton = e.target.closest('.dev-expand-btn');
  if (expandButton) {
    e.preventDefault();
    e.stopPropagation();
    const slotIndex = Number(expandButton.dataset.slotIndex);
    const nextExpandedSlot = expandedDevSlotIndex === slotIndex ? null : slotIndex;
    if (expandedDevSlotIndex === slotIndex) {
      const closingPhotoIndex = devGridState.order[slotIndex];
      if (selectedCropPhotoIndex === closingPhotoIndex) selectedCropPhotoIndex = null;
    }
    expandedDevSlotIndex = nextExpandedSlot;
    toggleSlotEditor(slotIndex);
    updateDevControlMessages();
    syncDevCropSelection();
    return;
  }

  const saveButton = e.target.closest('.dev-save-btn');
  if (saveButton) {
    e.preventDefault();
    e.stopPropagation();
    devGridState.photoPositions = { ...cropDraftPositions };
    persistDevGridState();
    void saveDevGridStateToFile();
    return;
  }

  if (e.target.closest('.dev-controls')) {
    e.stopPropagation();
    return;
  }
  const item = e.target.closest('.grid-item');
  if (!item) return;

  const photoIndex = Number(item.dataset.photoIndex);
  const slotIndex = Number(item.dataset.slotIndex);
  const cropEligible = isDev && isCropModeEnabled && Number.isInteger(expandedDevSlotIndex) && expandedDevSlotIndex === slotIndex;

  if (cropEligible) {
    selectedCropPhotoIndex = photoIndex;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    syncDevCropSelection();
    return;
  }

  openLightbox(getItems().indexOf(item));
});
grid.addEventListener('change', (e) => {
  const select = e.target.closest('.dev-select');
  if (!select) return;

  e.stopPropagation();
  const slotIndex = Number(select.dataset.slotIndex);
  if (!Number.isInteger(slotIndex)) return;

  if (select.dataset.control === 'image') {
    const updatedSlots = updateDevSlotImage(slotIndex, Number(select.value));
    updatedSlots.forEach((updatedSlotIndex) => updateSlotImageInDom(updatedSlotIndex));
  }
  if (select.dataset.control === 'shape') {
    updateDevSlotSize(slotIndex, select.value);
    updateSlotShapeInDom(slotIndex);
  }

  persistDevGridState();
  updateDevControlMessages();
  syncDevCropSelection();
});
grid.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.dev-controls')) return;
  if (isDev && startReorderDrag(e)) return;
});
window.addEventListener('pointermove', (e) => {
  if (!activeReorderDrag || e.pointerId !== activeReorderDrag.pointerId) return;

  const dx = e.clientX - activeReorderDrag.startX;
  const dy = e.clientY - activeReorderDrag.startY;
  const distance = Math.hypot(dx, dy);

  if (!activeReorderDrag.active) {
    if (distance < 4) return;
    activeReorderDrag.active = true;
    suppressNextGridClick = true;
  }

  e.preventDefault();
  activeReorderDrag.preview.style.left = `${e.clientX - activeReorderDrag.offsetX}px`;
  activeReorderDrag.preview.style.top = `${e.clientY - activeReorderDrag.offsetY}px`;
});
window.addEventListener('pointerup', (e) => {
  if (!activeReorderDrag || e.pointerId !== activeReorderDrag.pointerId) return;

  const dragged = activeReorderDrag;

  if (typeof dragged.item.releasePointerCapture === 'function' && dragged.item.hasPointerCapture?.(e.pointerId)) {
    dragged.item.releasePointerCapture(e.pointerId);
  }

  dragged.item.classList.remove('dragging-reorder-source');
  dragged.item.style.opacity = '';
  if (dragged.preview && dragged.preview.isConnected) dragged.preview.remove();

  if (dragged.active) {
    const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('.grid-item');
    const targetSlotIndex = Number(targetEl?.dataset.slotIndex);

    if (Number.isInteger(targetSlotIndex) && targetSlotIndex !== dragged.fromSlotIndex) {
      [devGridState.order[dragged.fromSlotIndex], devGridState.order[targetSlotIndex]] = [
        devGridState.order[targetSlotIndex],
        devGridState.order[dragged.fromSlotIndex],
      ];
      persistDevGridState();
      renderGrid();
    }
  }

  activeReorderDrag = null;
});
window.addEventListener('pointercancel', (e) => {
  if (!activeReorderDrag || e.pointerId !== activeReorderDrag.pointerId) return;

  const dragged = activeReorderDrag;
  if (typeof dragged.item.releasePointerCapture === 'function' && dragged.item.hasPointerCapture?.(e.pointerId)) {
    dragged.item.releasePointerCapture(e.pointerId);
  }
  dragged.item.classList.remove('dragging-reorder-source');
  dragged.item.style.opacity = '';
  if (dragged.preview && dragged.preview.isConnected) dragged.preview.remove();
  activeReorderDrag = null;
});
document.addEventListener('click', (e) => {
  const button = e.target.closest('#dev-crop-toggle-btn');
  if (!button) return;

  isCropModeEnabled = !isCropModeEnabled;
  if (isCropModeEnabled && Number.isInteger(expandedDevSlotIndex)) {
    selectedCropPhotoIndex = devGridState.order[expandedDevSlotIndex] ?? null;
  } else {
    selectedCropPhotoIndex = null;
  }
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  persistDevCropMode();
  renderDevCropToggle();
  syncDevCropSelection();
});
photographerLinks.addEventListener('click', (e) => {
  const link = e.target.closest('.photographer-photos-link');
  if (!link) return;

  e.preventDefault();
  const nextHandle = activePhotographerFilter === link.dataset.photographer ? null : link.dataset.photographer;
  applyPhotographerFilter(nextHandle);

  if (nextHandle) {
    // Scroll to the first photo belonging to this photographer
    const firstPhoto = document.querySelector(`.grid-item[data-photographer="${CSS.escape(nextHandle)}"]`);
    if (firstPhoto) {
      firstPhoto.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }
  const target = document.querySelector(link.getAttribute('href'));
  if (target) target.scrollIntoView({ behavior: 'smooth' });
});
lbClose.addEventListener('click', closeLightbox);
lbNext.addEventListener('click', showNext);
lbPrev.addEventListener('click', showPrev);
lightbox.addEventListener('click', (e) => {
  const thumb = e.target.closest('#lb-thumbs img');
  if (thumb) {
    current = Number(thumb.dataset.lbIndex);
    resetLbZoom();
    lbImg.src = items[current].dataset.fullSrc || items[current].querySelector('img').src;
    updateLbThumbs();
    return;
  }
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  const keyToAxis = {
    a: ['x', 1],
    d: ['x', -1],
    w: ['y', 1],
    s: ['y', -1],
    ArrowLeft: ['x', 1],
    ArrowRight: ['x', -1],
    ArrowUp: ['y', 1],
    ArrowDown: ['y', -1],
  };
  const move = keyToAxis[e.key] || keyToAxis[e.key.toLowerCase()];

  if (isDev && isCropModeEnabled && move) {
    const editingControl = e.target instanceof HTMLElement && e.target.closest('select, input, textarea');
    if (editingControl) return;

    const expandedPhotoIndex = getExpandedCropPhotoIndex();
    const activePhotoIndex = Number.isInteger(selectedCropPhotoIndex) ? selectedCropPhotoIndex : expandedPhotoIndex;
    if (!Number.isInteger(activePhotoIndex) || activePhotoIndex !== expandedPhotoIndex) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    selectedCropPhotoIndex = activePhotoIndex;
    const [axis, direction] = move;
    const currentPosition = parseObjectPosition(getDraftPhotoObjectPosition(activePhotoIndex));
    const baseStep = axis === 'x' ? 4 : 2;
    const step = e.shiftKey ? Math.max(1, baseStep / 2) : baseStep;
    const nextPosition = formatObjectPosition(
      axis === 'x' ? currentPosition.x + direction * step : currentPosition.x,
      axis === 'y' ? currentPosition.y + direction * step : currentPosition.y,
    );

    cropDraftPositions[activePhotoIndex] = nextPosition;
    applyCropPositionToDom(activePhotoIndex);
    syncDevCropSelection();
    return;
  }

  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft')  showPrev();
}, true);

// ── Analytics event tracking ──────────────────────────────────────────────────
function gaEvent(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params);
}

// Contact button clicks
document.getElementById('contact-email').addEventListener('click', () => {
  gaEvent('contact_click', { method: 'email' });
});
document.getElementById('social-instagram').addEventListener('click', () => {
  gaEvent('contact_click', { method: 'instagram' });
});

// Comp card link click (nav)
document.querySelectorAll('a[href="comp-card.html"]').forEach(el => {
  el.addEventListener('click', () => gaEvent('comp_card_view'));
});

// Lightbox open — track which photo was viewed
const _origOpenLightbox = openLightbox;
openLightbox = function(index) {
  _origOpenLightbox(index);
  const file = SITE.photos[devGridState.order[index]]?.file?.split('/').pop() || String(index);
  gaEvent('photo_view', { photo: file });
};

// ── Lightbox swipe (mobile)
let touchStartX = 0;
lightbox.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) diff > 0 ? showNext() : showPrev();
});

renderGrid();

window.addEventListener('resize', () => {
  const cols = getColumnCount();
  if (cols !== currentCols) renderGrid();
});

// ── Hamburger menu
const toggle     = document.querySelector('.nav-toggle');
const mobileMenu = document.getElementById('mobileMenu');

toggle.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  toggle.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    toggle.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ── Cookie notice
const cookieNotice = document.getElementById('cookie-notice');
const cookieAccept = document.getElementById('cookie-accept');
const cookieDecline = document.getElementById('cookie-decline');

window.setCookieChoice = function setCookieChoice(choice) {
  try {
    localStorage.setItem('cookieChoice', choice);
  } catch (error) {
    // Ignore storage failures and still honor the user's choice for this page load.
  }

  if (choice === 'accepted' && typeof window.enableAnalytics === 'function') {
    window.enableAnalytics();
  }
  if (choice === 'declined' && typeof window.disableAnalytics === 'function') {
    window.disableAnalytics();
  }

  cookieNotice.classList.add('hidden');
};

try {
  if (localStorage.getItem('cookieChoice')) cookieNotice.classList.add('hidden');
} catch (error) {
  // Leave the notice visible if storage is unavailable.
}

cookieAccept.addEventListener('click', () => window.setCookieChoice('accepted'));
cookieDecline.addEventListener('click', () => window.setCookieChoice('declined'));

// ── Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});
