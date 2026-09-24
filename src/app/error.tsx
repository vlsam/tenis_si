'use client';

import { PageHeader } from '@/components/ui/PageHeader';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="mb-2 text-6xl font-extrabold text-red-600">!</p>
      <PageHeader title="Niečo sa pokazilo" subtitle="Skúste to prosím znova. Ak problém pretrváva, kontaktujte klub." />
      <button className="btn" onClick={reset}>
        Skúsiť znova
      </button>
    </div>
  );
}
