import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PortraitUpload } from '@/components/character-sheet/PortraitUpload';
import type { UsePortraitUploadResult } from '@/hooks/usePortraitUpload';

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string) => {
      const segments = key.split('.');
      return segments[segments.length - 1];
    },
  }),
}));

// Mutable state shared across all test renders
const mockHookState: UsePortraitUploadResult = {
  upload: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  isUploading: false,
  isRemoving: false,
  error: null,
};

vi.mock('@/hooks/usePortraitUpload', () => ({
  usePortraitUpload: () => mockHookState,
}));

describe('PortraitUpload', () => {
  const baseProps = {
    characterId: 'char-1',
    characterName: 'Aldric',
    portraitUrl: null,
  } as const;

  beforeEach(() => {
    vi.mocked(mockHookState.upload).mockClear();
    vi.mocked(mockHookState.remove).mockClear();
    mockHookState.isUploading = false;
    mockHookState.isRemoving = false;
    mockHookState.error = null;
  });

  it('renders initial placeholder with character name initial when no portrait', () => {
    render(<PortraitUpload {...baseProps} />);
    expect(screen.getByRole('button', { name: /upload/i })).toHaveTextContent('A');
  });

  it('renders an img element when portraitUrl is provided', () => {
    render(<PortraitUpload {...baseProps} portraitUrl="https://example.com/portrait.jpg" />);
    const img = screen.getByRole('img', { name: 'Aldric' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('https://example.com/portrait.jpg'));
  });

  it('shows a remove button when portraitUrl is provided', () => {
    render(<PortraitUpload {...baseProps} portraitUrl="https://example.com/portrait.jpg" />);
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('does not show a remove button when portraitUrl is null', () => {
    render(<PortraitUpload {...baseProps} />);
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('calls upload with the file and characterId when a valid image is selected', async () => {
    render(<PortraitUpload {...baseProps} />);

    const file = new File(['img'], 'portrait.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    expect(mockHookState.upload).toHaveBeenCalledWith(file, 'char-1');
  });

  it('does not call upload and shows error when a non-image file is selected', async () => {
    render(<PortraitUpload {...baseProps} />);

    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Use fireEvent to bypass the `accept="image/*"` filter that userEvent enforces;
    // we want the onChange handler to run so we can assert the guard inside it fires.
    Object.defineProperty(input, 'files', { value: [file], writable: false });
    fireEvent.change(input);

    expect(mockHookState.upload).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('notAnImage');
  });

  it('replaces placeholder button with aria-busy spinner when isUploading is true', () => {
    mockHookState.isUploading = true;

    render(<PortraitUpload {...baseProps} />);

    // The interactive placeholder button is replaced by a non-interactive div[aria-busy]
    expect(screen.queryByRole('button', { name: /upload/i })).not.toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
