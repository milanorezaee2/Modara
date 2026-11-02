// Garment cut-outs photographed on a wooden hanger.
// Generated for the home rack: every file is a transparent, full-length
// product shot of exactly the piece the catalogue describes.

export type HangerGarment = {
  /** Transparent cut-out on a wooden hanger. */
  image: string;
  /** Average colour of the garment, used for glow and the selvedge line. */
  hex: string;
};

/**
 * Keyed by product slug. Add an entry here (and the webp in
 * public/images/hangers/) to put a product on a real hanger in the rack.
 */
export const hangerGarments: Record<string, HangerGarment> = {
  'wool-blazer-navy-men': { image: '/images/hangers/wool-blazer-navy-men.webp', hex: '#1e2130' },
  'trench-coat-camel-women': {
    image: '/images/hangers/trench-coat-camel-women.webp',
    hex: '#b58d65',
  },
  'satin-blazer-black-women': {
    image: '/images/hangers/satin-blazer-black-women.webp',
    hex: '#242423',
  },
  'denim-jacket-men': { image: '/images/hangers/denim-jacket-men.webp', hex: '#1c2735' },
  'midi-dress-floral-women': {
    image: '/images/hangers/midi-dress-floral-women.webp',
    hex: '#9b9b8f',
  },
  'knit-cardigan-cream-women': {
    image: '/images/hangers/knit-cardigan-cream-women.webp',
    hex: '#dccdb8',
  },
  'silk-blouse-cream-women': {
    image: '/images/hangers/silk-blouse-cream-women.webp',
    hex: '#dbd1be',
  },
  'hoodie-charcoal-men': { image: '/images/hangers/hoodie-charcoal-men.webp', hex: '#4c4b4d' },
  'hoodie-blush-women': { image: '/images/hangers/hoodie-blush-women.webp', hex: '#dcb3a9' },
  'knit-sweater-gray-men': {
    image: '/images/hangers/knit-sweater-gray-men.webp',
    hex: '#6a6a69',
  },
};

/** True when a product has a real hanger cut-out, i.e. it hangs as itself. */
export function hangerFor(slug: string): HangerGarment | undefined {
  return hangerGarments[slug];
}
