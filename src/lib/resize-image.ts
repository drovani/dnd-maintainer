/**
 * Resizes an image file to fit within a square of `maxDim × maxDim` pixels,
 * preserving aspect ratio. Output is always JPEG at 85% quality.
 *
 * Only the guard (non-image rejection) is unit-tested here; the canvas pixel
 * math cannot be exercised in jsdom (toBlob is unimplemented).
 */
export async function resizeImage(file: File, maxDim: number): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error(`Expected an image file but received type "${file.type}"`));
  }

  return new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to decode image'));

      img.onload = () => {
        const { width, height } = img;
        const longestEdge = Math.max(width, height);
        const scale = longestEdge > maxDim ? maxDim / longestEdge : 1;
        const targetWidth = Math.round(width * scale);
        const targetHeight = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not obtain 2D canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('canvas.toBlob produced null'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.85
        );
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
