'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="container py-8">
      <ErrorState
        title="Something went wrong"
        message={error.message || 'An unexpected error occurred'}
        onRetry={reset}
      />
    </div>
  );
}
