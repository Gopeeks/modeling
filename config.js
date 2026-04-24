// ─────────────────────────────────────────────
//  SITE CONFIGURATION — edit this file to
//  update your portfolio without touching HTML.
// ─────────────────────────────────────────────

const SITE = {

  // ── Identity
  name:    "Gopika Nair",
  tagline: "Model & Creative • New York City",

  // ── Hero (full-screen image at the top)
  heroImage: "High-res photos/PGN_6062.jpg",

  // ── Experience
  experience: [
    {
      credit: "Bumble (Acquired Brand Campaign)",
      detail: "New York City subway ads & digital campaign",
    },
    {
      credit: "Saj Dhaj Ke",
      detail: "Brand imagery featured on official website",
    },
    {
      credit: "Revare",
      detail: "Brand imagery",
    },
  ],

  photographerCredits: [
    {
      handle: "@chris_dobey",
      url: "https://instagram.com/chris_dobey",
      photoIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    },
    {
      handle: "@it_me___jp",
      url: "https://instagram.com/it_me___jp",
      photoIndices: [8, 9, 10, 11, 20, 21, 26, 27, 28, 29, 30],
    },
    {
      handle: "@photosbykundan",
      url: "https://instagram.com/photosbykundan",
      photoIndices: [13, 14, 15, 18, 19],
    },
    {
      handle: "@studiomonae",
      url: "https://instagram.com/studiomonae",
      photoIndices: [22, 25, 31],
    },
    {
      handle: "@bobbyzphotographer",
      url: "https://instagram.com/bobbyzphotographer",
      photoIndices: [24, 32, 23, 33],
    },
  ],

  // ── Stats
  stats: {
    height:    `5'9"`,
    bust:      `32"`,
    waist:     `27"`,
    hips:      `35"`,
    dress:     `S`,
    shoe:      `8`,
    hair:      `Brown`,
    eyes:      `Brown`,
  },

  // ── About section
  aboutImage: "photos/IMG_9263.jpg",
  aboutHeading: ["Presence.", "Emotion.", "Story."],
  aboutBody: `Every frame is a conversation. I bring authenticity, elegance, and intention to every shoot — whether editorial, commercial, or artistic. Based in New York City.`,
  aboutCtaText: "Work Together",
  aboutCtaLink: "#contact",

  // ── Contact section
  contactHeading: ["Let's Connect"],
  contactBody: "Available for editorial, commercial, and artistic collaborations.",
  email:     "contact@gopikanair.co",
  instagram: "https://instagram.com/gopeeks",
  linkedin:  "https://linkedin.com/in/yourhandle",

  // ── Location
  location: "New York City & San Francisco Bay Area",

  // ── Footer
  footerText: `© ${new Date().getFullYear()} Gopika Nair. All rights reserved.`,

  // ── Comp card
  compHeroImage: "photos/PGN_6062.jpg",
  compHeroPos:   "57% 0%",
  compPhotoPool: [
    "photos/comp/IMG_3468.jpg",
    "photos/comp/IMG_3469.jpg",
    "photos/comp/IMG_3470.jpg",
    "photos/comp/IMG_3474.jpg",
    "photos/comp/IMG_3475.jpg",
    "photos/comp/IMG_3476.jpg",
    "photos/comp/IMG_3477.jpg",
    "photos/comp/IMG_3478.jpg",
    "photos/comp/IMG_3483.jpg",
  ],
  compPhotos: [
    { file: "photos/comp/IMG_3475.jpg", pos: "center 12%" },
    { file: "photos/comp/IMG_3483.jpg", pos: "center 18%" },
    { file: "photos/comp/IMG_3477.jpg", pos: "44% 10%" },
    { file: "photos/comp/IMG_3470.jpg", pos: "center 10%" },
  ],

  // ── Portfolio images
  // size: "normal" | "tall" (2x height) | "wide" (2x width)
  // pos: CSS object-position to control crop
  photos: [
    { file: "photos/PGN_5921.jpg",   size: "tall",   pos: "center 8%" },  // pinned tall
    { file: "photos/PGN_5948.jpg",   size: "tall",   pos: "center 5%" },  // pinned tall
    { file: "photos/PGN_5960.jpg",   size: "normal", pos: "center 6%" },
    { file: "photos/PGN_6062.jpg",   size: "normal", pos: "57% 8%" },
    { file: "photos/PGN_6069.jpg",   size: "tall",   pos: "center 7%" },
    { file: "photos/PGN_6316.jpg",   size: "tall",   pos: "center 6%" },  // pinned tall
    { file: "photos/PGN_6321.jpg",   size: "normal", pos: "43% 8%" },
    { file: "photos/PGN_6353.jpg",   size: "tall",   pos: "center 3%" },  // pinned tall
    { file: "photos/1.jpeg",         size: "normal", pos: "center 17%" },
    { file: "photos/2.jpeg",         size: "tall",   pos: "center 28%" },  // pinned tall
    { file: "photos/3.jpeg",         size: "normal", pos: "41% 10%" },
    { file: "photos/4.jpeg",         size: "tall",   pos: "center 10%" },  // pinned tall
    { file: "photos/5.jpeg",         size: "normal", pos: "42% 27%" },
    { file: "photos/IMG_9151.jpg",   size: "tall",   pos: "78% 45%" },
    { file: "photos/IMG_9179.jpg",   size: "normal", pos: "center 12%" },
    { file: "photos/IMG_9214.jpg",   size: "tall",   pos: "center 12%" },
    { file: "photos/IMG_9249.jpg",   size: "normal", pos: "center 11%" },
    { file: "photos/IMG_9254.jpg",   size: "normal", pos: "center 14%" },
    { file: "photos/IMG_9263.jpg",   size: "tall",   pos: "center 21%" },
    { file: "photos/IMG_9279.jpg",   size: "normal", pos: "center 14%" },
    { file: "photos/IMG_3459.JPG",     size: "normal", pos: "center 8%" },
    { file: "photos/IMG_3460.JPG",     size: "tall",   pos: "center 10%" },
    { file: "photos/IMG_6937.JPG",     size: "normal", pos: "center 12%" },
    { file: "photos/Gopika-3833.jpg",  size: "tall",   pos: "center 22%" },  // pinned tall
    { file: "photos/IMG_3632.JPG",     size: "tall",   pos: "center 12%" },  // pinned tall
    { file: "photos/IMG_6940.JPG",     size: "tall",   pos: "center 10%" },
    { file: "photos/IMG_3442.JPG",     size: "normal", pos: "center 12%" },
    { file: "photos/IMG_3457.JPG",     size: "normal", pos: "center 12%" },
    { file: "photos/IMG_3461.JPG",     size: "normal", pos: "center 10%" },
    { file: "photos/IMG_3462.JPG",     size: "normal", pos: "center 10%" },
    { file: "photos/IMG_6964.JPG",     size: "normal", pos: "center 12%" },
  ],
};
