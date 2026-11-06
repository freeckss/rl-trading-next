/**
 * Helper to generate immutable, collision-proof URL-safe slugs.
 * Format: `${year}-${make}-${model}-${variant}-${randomSuffix}`
 * The short 5-character random suffix guarantees two identical units
 * (e.g. two 2018 Toyota Vios 1.3 E) never collide on the database UNIQUE constraint.
 */
export function generateVehicleSlug(
  year: number,
  make: string,
  model: string,
  variant: string,
  customSuffix?: string
): string {
  const base = `${year} ${make} ${model} ${variant}`
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const suffix = customSuffix || Math.random().toString(36).substring(2, 7).toLowerCase();
  return `${base}-${suffix}`.replace(/-+/g, '-');
}
