/**
 * Centralized business constants and helpers for RL Trading & SEat n Go Shuttle Services.
 */

export const BUSINESS_NAME = 'RL Trading & SEat n Go Shuttle Services';
export const SHORT_NAME = 'RL Trading & SEat n Go';
export const ADDRESS_FULL = 'MacArthur Highway, Pulung Bulu, Angeles City, Pampanga';
export const LANDMARK = 'Beside Shell Station, in front of Motech Auto Center';

export const PHONE_SMART = '0923 730 9644';
export const PHONE_GLOBE = '0917 440 3909';
export const PHONE_SMART_TEL = '09237309644';
export const PHONE_GLOBE_TEL = '09174403909';

export const MAPS_URL = 'https://maps.app.goo.gl/JFw6ufXYTxyfvWHk8';
export const VIEWING_HOURS = 'Monday – Saturday, 8:00 AM – 6:00 PM';
export const SUNDAY_NOTE = 'Sunday viewings by appointment';

/**
 * Returns the Metropolitan Manila / Central Luzon coding day restriction
 * based on the last digit of the vehicle's license plate or conduction sticker.
 *
 * @param plateEnding - The 1 or 2-character ending string (e.g. "8", "4", "A")
 * @returns Human-readable day restriction (e.g. "Thursday (7, 8)") or fallback
 */
export function getCodingDay(plateEnding: string): string {
  const lastDigit = plateEnding.trim().slice(-1);
  switch (lastDigit) {
    case '1':
    case '2':
      return 'Monday (1, 2)';
    case '3':
    case '4':
      return 'Tuesday (3, 4)';
    case '5':
    case '6':
      return 'Wednesday (5, 6)';
    case '7':
    case '8':
      return 'Thursday (7, 8)';
    case '9':
    case '0':
      return 'Friday (9, 0)';
    default:
      return 'No coding (special plate)';
  }
}

