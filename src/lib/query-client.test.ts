import '@/lib/i18n';
import { getLogger } from '@/lib/logger';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query-client';

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('queryClient global mutation onError handler', () => {
  it('shows an error toast and logs via logger.error', () => {
    const queryClientLogger = getLogger('query-client');
    vi.spyOn(queryClientLogger, 'error').mockImplementation(() => {});
    const onError = queryClient.getDefaultOptions().mutations?.onError;
    expect(onError).toBeDefined();

    const testError = new Error('Network failure');
    onError!(testError, '' as never, undefined as never, undefined as never);

    expect(toast.error).toHaveBeenCalledWith('Save failed — your changes may not have been saved');
    expect(queryClientLogger.error).toHaveBeenCalledWith('Mutation failed:', testError);
  });
});
