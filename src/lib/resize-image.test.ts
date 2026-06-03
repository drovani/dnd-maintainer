import { describe, it, expect } from 'vitest';
import { resizeImage } from '@/lib/resize-image';

// NOTE: jsdom does not implement canvas.toBlob, so pixel-math / scaling behavior
// cannot be unit-tested here. These tests cover only the guard path (non-image rejection).
// The full resize pipeline is exercised indirectly via the usePortraitUpload hook tests,
// where resizeImage is mocked out.

describe('resizeImage', () => {
  it('rejects when the file is not an image', async () => {
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await expect(resizeImage(file, 512)).rejects.toThrow('Expected an image file but received type "text/plain"');
  });

  it('rejects for an empty MIME type', async () => {
    const file = new File(['data'], 'no-type', { type: '' });
    await expect(resizeImage(file, 512)).rejects.toThrow('Expected an image file');
  });
});
