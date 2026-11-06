/**
 * Client-side image compressor converting input image files to optimized WebP.
 * Resizes images exceeding maxDimension while maintaining aspect ratio,
 * applies iterative quality reduction (0.80 down to 0.52) if file size exceeds 160KB,
 * and releases canvas memory immediately for iOS Safari compatibility.
 *
 * @param file - The original File object (e.g. from an <input type="file">)
 * @param maxDimension - Maximum allowed width or height in pixels (default: 1600)
 * @param initialQuality - Initial WebP quality factor from 0 to 1 (default: 0.80)
 * @returns A Promise resolving to the compressed WebP File (~100KB-140KB)
 */
export async function compressImageToWebP(
  file: File,
  maxDimension = 1600,
  initialQuality = 0.80
): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('compressImageToWebP can only run in a browser environment.');
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const targetWidth = Math.round(img.width * scale);
      const targetHeight = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        canvas.width = 0;
        canvas.height = 0;
        reject(new Error('Failed to get 2D canvas rendering context.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const canvasToBlob = (quality: number): Promise<Blob> => {
        return new Promise((res, rej) => {
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.type !== 'image/webp') {
                rej(new Error('WebP encoding not supported on this browser.'));
                return;
              }
              res(blob);
            },
            'image/webp',
            quality
          );
        });
      };

      try {
        const MAX_SIZE_BYTES = 160 * 1024; // 160KB
        const QUALITY_FLOOR = 0.52;
        const QUALITY_STEP = 0.07;

        let currentQuality = Math.min(initialQuality, 0.80);
        let blob = await canvasToBlob(currentQuality);

        // Iterative quality step-down if output exceeds 160KB
        while (blob.size > MAX_SIZE_BYTES && currentQuality > QUALITY_FLOOR) {
          currentQuality = Math.max(
            QUALITY_FLOOR,
            Number((currentQuality - QUALITY_STEP).toFixed(2))
          );
          blob = await canvasToBlob(currentQuality);
          if (currentQuality <= QUALITY_FLOOR) {
            break;
          }
        }

        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const webpFileName = `${baseName}.webp`;

        const compressedFile = new File([blob], webpFileName, {
          type: 'image/webp',
          lastModified: Date.now(),
        });

        resolve(compressedFile);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        // Release iOS Safari canvas backing store memory immediately
        canvas.width = 0;
        canvas.height = 0;
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image file: ${file.name}`));
    };

    img.src = objectUrl;
  });
}
