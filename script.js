// ── Apply config to page
document.getElementById('page-title').textContent  = `${SITE.name} — Portfolio`;
document.getElementById('nav-name').textContent     = SITE.name;
document.getElementById('hero-bg').style.backgroundImage = `url('${SITE.heroImage}')`;
document.getElementById('hero-tagline').textContent = SITE.tagline;
document.getElementById('hero-name').textContent    = SITE.name;
document.getElementById('hero-cta').href            = '#portfolio';

document.getElementById('about-img').src            = SITE.aboutImage;
document.getElementById('about-img').alt            = SITE.name;
document.getElementById('about-heading').innerHTML  = SITE.aboutHeading.join('<br>');
document.getElementById('about-body').textContent   = SITE.aboutBody;
document.getElementById('about-cta').textContent    = SITE.aboutCtaText;
document.getElementById('about-cta').href           = SITE.aboutCtaLink;

document.getElementById('contact-heading').innerHTML = SITE.contactHeading.join('<br>');
document.getElementById('contact-body').textContent  = SITE.contactBody;
document.getElementById('contact-email').textContent = SITE.email;
document.getElementById('contact-email').href        = `mailto:${SITE.email}`;
document.getElementById('social-instagram').href     = SITE.instagram;
document.getElementById('social-linkedin').href      = SITE.linkedin;
document.getElementById('footer-text').textContent   = SITE.footerText;

// ── Build portfolio grid from config
const grid = document.getElementById('grid');
SITE.photos.forEach(({ file, size }) => {
  const div = document.createElement('div');
  div.className = `grid-item reveal${size === 'tall' ? ' tall' : ''}${size === 'wide' ? ' wide' : ''}`;
  div.innerHTML = `<img src="${file}" alt=""><div class="grid-overlay"></div>`;
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
