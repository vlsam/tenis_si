import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="mb-2 text-6xl font-extrabold text-court">404</p>
      <PageHeader title="Stránka sa nenašla" subtitle="Odkaz je neplatný, alebo bola stránka presunutá." />
      <Link href="/" className="btn">
        Späť na úvod
      </Link>
    </div>
  );
}
