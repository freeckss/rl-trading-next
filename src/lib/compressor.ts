/**
 * Client-side image compressor converting input image files to optimized WebP.
 * Resizes images exceeding maxWidth while maintaining aspect ratio, and exports
 * a high-efficiency WebP File ready for Supabase Storage.
 *
 * @param file - The original File object (e.g. from an <input type="file">)
 * @param maxWidth - Maximum allowed width in pixels (default: 1600)
 * @param quality - WebP quality factor from 0 to 1 (default: 0.82)
 * @returns A Promise resolving to the compressed WebP File
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1600,
  quality = 0.82
): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('compressImageToWebP can only run in a browser environment.');
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.naturalWidth || img.width;
      let targetHeight = img.naturalHeight || img.height;

      if (targetWidth > maxWidth) {
        const scale = maxWidth / targetWidth;
        targetWidth = maxWidth;
        targetHeight = Math.round(targetHeight * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas rendering context.'));
        return;
      }

      // Draw image onto canvas
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to WebP blob conversion failed.'));
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const webpFileName = `${baseName}.webp`;

          const compressedFile = new File([blob], webpFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image file: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

