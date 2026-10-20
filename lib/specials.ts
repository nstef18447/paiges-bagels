// Limited-run menu items get the pink "this week only" treatment.
// Matching by name means a special can be added or retired from the admin
// panel without a code change.
const SPECIAL_PATTERN = /funfetti|birthday cake/i;

export function isSpecial(name: string): boolean {
  return SPECIAL_PATTERN.test(name);
}

export const PINK = {
  bg: '#FFF0F6',
  bgActive: '#FFE0EE',
  border: '#FFC2DD',
  strong: '#E8457F',
  text: '#B8336A',
  soft: '#FFD6E8',
};

export const SPRINKLE_BACKGROUND =
  'radial-gradient(circle at 12% 20%, #FFB3D1 0 2px, transparent 3px),' +
  'radial-gradient(circle at 88% 30%, #5BC0EB 0 2px, transparent 3px),' +
  'radial-gradient(circle at 70% 85%, #FFD23F 0 2px, transparent 3px),' +
  'radial-gradient(circle at 30% 75%, #9B5DE5 0 2px, transparent 3px),' +
  'radial-gradient(circle at 55% 12%, #00C49A 0 2px, transparent 3px)';
