import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AdminMenuPage() {
  return (
    <div>
      <PageHeader title="Administrácia" />
      <ul className="list-inside list-disc space-y-2">
        <li>
          <Link href="/admin/credit/pending">Čakajúce dobitia kreditu (bankový prevod)</Link>
        </li>
        <li>
          <Link href="/admin/users">Používatelia a ich kredit</Link>
        </li>
        <li>
          <Link href="/admin/orders">Objednávky</Link>
        </li>
      </ul>
    </div>
  );
}
