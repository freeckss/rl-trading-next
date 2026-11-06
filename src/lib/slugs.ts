/**
 * Helper to generate URL-safe slugs: e.g. 2019-toyota-hilux-conquest-2-4-g-at-diesel
 */
export function generateVehicleSlug(
  year: number,
  make: string,
  model: string,
  variant: string,
  transmission: string,
  fuel: string
): string {
  const raw = `${year} ${make} ${model} ${variant} ${transmission} ${fuel}`;
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
}

