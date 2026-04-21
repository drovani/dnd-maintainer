import { QueryClient } from '@tanstack/react-query';
import i18next from 'i18next';
import { toast } from 'sonner';
import { getLogger } from '@/lib/logger';

const logger = getLogger('query-client');

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        toast.error(i18next.t('errors.saveFailed', { ns: 'common' }));
        logger.error('Mutation failed:', error);
      },
    },
  },
});
