import '@/lib/i18n';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('queryClient global mutation onError handler', () => {
  it('shows an error toast and logs to console.error', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = queryClient.getDefaultOptions().mutations?.onError;
    expect(onError).toBeDefined();

    const testError = new Error('Network failure');
    onError!(testError, '' as never, undefined as never, undefined as never);

    expect(toast.error).toHaveBeenCalledWith('Save failed \u2014 your changes may not have been saved');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Mutation failed:', testError);

    consoleErrorSpy.mockRestore();
  });
});
