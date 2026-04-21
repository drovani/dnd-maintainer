import * as React from 'react';

import { cn } from '@/lib/utils';

function ValidationError({ message, className, ...props }: { message: string } & React.ComponentProps<'p'>) {
  if (!message) return null;
  return (
    <p data-slot="validation-error" role="alert" className={cn('text-sm text-destructive', className)} {...props}>
      {message}
    </p>
  );
}

export { ValidationError };
