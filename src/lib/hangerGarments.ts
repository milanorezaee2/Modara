// Garment cut-outs photographed on a wooden hanger.
// Every file is a transparent, full-length product shot of exactly the piece
// the catalogue describes — used by the home rack, where they hang edge-on.

export type HangerGarment = {
  /** Transparent cut-out on a wooden hanger. */
  image: string;
  /** Average colour of the garment, used for the glow behind the rack. */
  hex: string;
  /** width / height of the cut-out, so a side-on piece keeps its true width. */
  aspect: number;
};

/**
 * Keyed by product slug. All 17 clothing pieces of the catalogue have one, so
 * every garment on the rack is the product itself. Add an entry here (and the
 * webp in public/images/hangers/) to hang another product.
 */
export const hangerGarments: Record<string, HangerGarment> = {
  'wool-blazer-navy-men': { image: '/images/hangers/wool-blazer-navy-men.webp', hex: '#1b1e2c', aspect: 0.662 },
  'trench-coat-camel-women': { image: '/images/hangers/trench-coat-camel-women.webp', hex: '#b58d65', aspect: 0.523 },
  'satin-blazer-black-women': { image: '/images/hangers/satin-blazer-black-women.webp', hex: '#232323', aspect: 0.694 },
  'denim-jacket-men': { image: '/images/hangers/denim-jacket-men.webp', hex: '#1c2735', aspect: 0.856 },
  'midi-dress-floral-women': { image: '/images/hangers/midi-dress-floral-women.webp', hex: '#9e9f95', aspect: 0.431 },
  'knit-cardigan-cream-women': { image: '/images/hangers/knit-cardigan-cream-women.webp', hex: '#dccdb8', aspect: 0.756 },
  'silk-blouse-cream-women': { image: '/images/hangers/silk-blouse-cream-women.webp', hex: '#dbd3c4', aspect: 0.677 },
  'hoodie-charcoal-men': { image: '/images/hangers/hoodie-charcoal-men.webp', hex: '#4f4f51', aspect: 0.737 },
  'hoodie-blush-women': { image: '/images/hangers/hoodie-blush-women.webp', hex: '#dcb3a9', aspect: 0.744 },
  'knit-sweater-gray-men': { image: '/images/hangers/knit-sweater-gray-men.webp', hex: '#6b6b6a', aspect: 0.715 },
  'turtleneck-sweater-beige-women': { image: '/images/hangers/turtleneck-sweater-beige-women.webp', hex: '#bb9370', aspect: 0.69 },
  'elegant-pink-blouse': { image: '/images/hangers/elegant-pink-blouse.webp', hex: '#ce9e99', aspect: 0.719 },
  'oxford-blue-shirt-men': { image: '/images/hangers/oxford-blue-shirt-men.webp', hex: '#a5b5d1', aspect: 0.735 },
  'classic-white-shirt': { image: '/images/hangers/classic-white-shirt.webp', hex: '#e4e4e5', aspect: 0.812 },
  'polo-shirt-green-men': { image: '/images/hangers/polo-shirt-green-men.webp', hex: '#595738', aspect: 0.752 },
  'oversize-tshirt-white-women': { image: '/images/hangers/oversize-tshirt-white-women.webp', hex: '#dcdcdc', aspect: 0.844 },
  'basic-tshirt-black-men': { image: '/images/hangers/basic-tshirt-black-men.webp', hex: '#191919', aspect: 0.798 },
};

/** True when a product has a real hanger cut-out, i.e. it hangs as itself. */
export function hangerFor(slug: string): HangerGarment | undefined {
  return hangerGarments[slug];
}
