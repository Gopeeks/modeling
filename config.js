// ─────────────────────────────────────────────
//  SITE CONFIGURATION — edit this file to
//  update your portfolio without touching HTML.
// ─────────────────────────────────────────────

const SITE = {

  // ── Identity
  name:    "Gopika Nair",
  tagline: "New York City Based Model",
  heroStats: `5'9  ·  NYC  ·  Brown Hair  ·  Brown Eyes`,

  // ── Hero (full-screen image at the top)
  heroImage: "photos/PGN_6062.jpg",

  // ── Experience
  experience: [
    {
      credit: "Bumble (Acquired Brand Campaign)",
      detail: "New York City subway ads & digital campaign",
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
  contactHeading: ["Let's Create", "Something Beautiful"],
  contactBody: "For booking and representation inquiries:",
  email:     "contact@gopikanair.co",
  instagram: "https://instagram.com/gopeeks",
  linkedin:  "https://linkedin.com/in/yourhandle",

  // ── Footer
  footerText: `© ${new Date().getFullYear()} Gopika Nair. All rights reserved.`,

  // ── Portfolio images
  // size: "normal" | "tall" (2x height) | "wide" (2x width)
  // pos: CSS object-position to control crop
  photos: [
    { file: "photos/PGN_5948.jpg",   size: "tall",   pos: "center 5%" },
    { file: "photos/PGN_5960.jpg",   size: "normal", pos: "center 6%" },
    { file: "photos/PGN_6062.jpg",   size: "normal", pos: "57% 8%" },
    { file: "photos/PGN_6069.jpg",   size: "tall",   pos: "center 7%" },
    { file: "photos/PGN_6316.jpg",   size: "normal", pos: "center 6%" },
    { file: "photos/PGN_6321.jpg",   size: "normal", pos: "43% 8%" },
    { file: "photos/PGN_6353.jpg",   size: "tall",   pos: "center 3%" },
    { file: "photos/PGN_6418.jpg",   size: "normal", pos: "center 5%" },
    { file: "photos/PGN_6462.jpg",   size: "normal", pos: "center 10%" },
    { file: "photos/1.jpeg",         size: "normal", pos: "center 17%" },
    { file: "photos/2.jpeg",         size: "tall",   pos: "center 28%" },
    { file: "photos/3.jpeg",         size: "normal", pos: "41% 10%" },
    { file: "photos/4.jpeg",         size: "normal", pos: "center 10%" },
    { file: "photos/5.jpeg",         size: "normal", pos: "42% 27%" },
    { file: "photos/IMG_9139.jpg",   size: "tall",   pos: "56% 10%" },
    { file: "photos/IMG_9145.jpg",   size: "normal", pos: "77% 60%" },
    { file: "photos/IMG_9151.jpg",   size: "normal", pos: "78% 45%" },
    { file: "photos/IMG_9179.jpg",   size: "normal", pos: "center 12%" },
    { file: "photos/IMG_9214.jpg",   size: "tall",   pos: "center 12%" },
    { file: "photos/IMG_9249.jpg",   size: "normal", pos: "center 11%" },
    { file: "photos/IMG_9254.jpg",   size: "normal", pos: "center 14%" },
    { file: "photos/IMG_9255.jpg",   size: "tall",   pos: "center 12%" },
    { file: "photos/IMG_9263.jpg",   size: "normal", pos: "center 21%" },
    { file: "photos/IMG_9276.jpg",   size: "normal", pos: "center 18%" },
    { file: "photos/IMG_9279.jpg",   size: "normal", pos: "center 14%" },
    { file: "photos/IMG_9282.jpg",   size: "normal", pos: "center 9%" },
  ],
};
