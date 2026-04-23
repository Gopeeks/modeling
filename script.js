// ── Apply config to page
document.getElementById('nav-name').textContent     = SITE.name;
document.getElementById('hero-bg').style.backgroundImage = `url('${SITE.heroImage}')`;
document.getElementById('hero-tagline').textContent = SITE.tagline;
document.getElementById('hero-name').textContent    = SITE.name;
document.getElementById('hero-cta').href            = '#portfolio';
document.getElementById('hero-stats').textContent   = SITE.heroStats;

document.getElementById('about-img').src            = SITE.aboutImage;
document.getElementById('about-img').alt            = SITE.name;
document.getElementById('about-heading').innerHTML  = SITE.aboutHeading.join('<br>');
document.getElementById('about-body').textContent = SITE.aboutBody;
document.getElementById('about-cta').textContent    = SITE.aboutCtaText;
document.getElementById('about-cta').href           = SITE.aboutCtaLink;

document.getElementById('contact-heading').innerHTML = SITE.contactHeading.join('<br>');
document.getElementById('contact-body').textContent  = SITE.contactBody;
const emailEl = document.getElementById('contact-email');
emailEl.textContent = SITE.email;
emailEl.href = `mailto:${SITE.email}`;
document.getElementById('social-instagram').textContent = 'Instagram';
document.getElementById('social-instagram').href       = SITE.instagram;
document.getElementById('footer-text').textContent   = SITE.footerText;

// ── Build experience section
const expList = document.getElementById('experience-list');
SITE.experience.forEach(({ credit, detail }) => {
  expList.innerHTML += `
    <div class="experience-item">
      <span class="experience-credit">${credit}</span>
      <span class="experience-detail">${detail}</span>
    </div>`;
});

// ── Build portfolio grid from config
const grid = document.getElementById('grid');
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// ── Grid size assignment — uses size from config, adjusted to prevent gaps
//
// Each 'tall' occupies 2 cells (1 col × 2 rows); all others occupy 1 cell.
// Total cells must be divisible by 4 for a gap-free grid with dense flow.
// If not, the last 'tall' is demoted to 'normal' until the count is clean.
const gridSizes = SITE.photos.map(p => p.size || 'normal');
let totalCells = gridSizes.reduce((s, sz) => s + (sz === 'tall' ? 2 : 1), 0);
while (totalCells % 4 !== 0) {
  const lastTall = gridSizes.lastIndexOf('tall');
  if (lastTall >= 0) { gridSizes[lastTall] = 'normal'; totalCells--; }
  else { gridSizes[gridSizes.length - 1] = 'wide'; totalCells++; break; }
}

SITE.photos.forEach(({ file, pos }, index) => {
  const div = document.createElement('div');
  div.className = `grid-item ${gridSizes[index]} reveal`;
  const label = isDev
    ? `<div class="dev-label">#${index} · ${file.replace('photos/', '')}</div>`
    : '';
  const imgStyle = pos ? ` style="object-position:${pos}"` : '';
  div.innerHTML = `<img src="${file}" alt="" loading="lazy"${imgStyle}><div class="grid-overlay"></div>${label}`;
  grid.appendChild(div);
});

// ── Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
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

document.querySelectorAll('.reveal').forEach((el, i) => {
  if (el.closest('.grid')) el.dataset.delay = (i % 4) * 80;
  observer.observe(el);
});

// ── Lightbox
const lightbox = document.getElementById('lightbox');
const lbImg    = document.getElementById('lb-img');
const lbClose  = document.getElementById('lb-close');
const lbPrev   = document.getElementById('lb-prev');
const lbNext   = document.getElementById('lb-next');

let items   = [];
let current = 0;

// Items are built dynamically, so grab them after grid renders
function getItems() { return Array.from(document.querySelectorAll('.grid-item')); }

function openLightbox(index) {
  items   = getItems();
  current = index;
  lbImg.src = items[current].querySelector('img').src;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}
function showNext() {
  items   = getItems();
  current = (current + 1) % items.length;
  lbImg.src = items[current].querySelector('img').src;
}
function showPrev() {
  items   = getItems();
  current = (current - 1 + items.length) % items.length;
  lbImg.src = items[current].querySelector('img').src;
}

grid.addEventListener('click', (e) => {
  const item = e.target.closest('.grid-item');
  if (item) openLightbox(getItems().indexOf(item));
});
lbClose.addEventListener('click', closeLightbox);
lbNext.addEventListener('click', showNext);
lbPrev.addEventListener('click', showPrev);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft')  showPrev();
});

// ── Lightbox swipe (mobile)
let touchStartX = 0;
lightbox.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) diff > 0 ? showNext() : showPrev();
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
if (localStorage.getItem('cookieChoice')) cookieNotice.classList.add('hidden');
document.getElementById('cookie-accept').addEventListener('click', () => {
  localStorage.setItem('cookieChoice', 'accepted');
  cookieNotice.classList.add('hidden');
});
document.getElementById('cookie-decline').addEventListener('click', () => {
  localStorage.setItem('cookieChoice', 'declined');
  cookieNotice.classList.add('hidden');
});

// ── Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});
