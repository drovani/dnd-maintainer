import { render, screen } from '@testing-library/react';
import { ValidationError } from '@/components/ui/validation-error';

describe('ValidationError', () => {
  it('renders the error message when message is non-empty', () => {
    render(<ValidationError message="Title is required" />);
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('renders nothing when message is an empty string', () => {
    const { container } = render(<ValidationError message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('has role="alert" for screen reader accessibility', () => {
    render(<ValidationError message="Something went wrong" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('merges custom className via cn()', () => {
    render(<ValidationError message="Error" className="mt-2" />);
    const el = screen.getByRole('alert');
    expect(el).toHaveClass('mt-2');
    expect(el).toHaveClass('text-destructive');
  });
});
