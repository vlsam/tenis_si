import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableHead, Th, Tr, Td } from '@/components/ui/Table';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, credit_balance, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader title="Používatelia" />
      <Table>
        <TableHead>
          <Th>Meno</Th>
          <Th>E-mail</Th>
          <Th>Kredit</Th>
          <Th />
        </TableHead>
        <tbody>
          {users?.map(u => (
            <Tr key={u.id}>
              <Td>
                {u.first_name} {u.last_name}
              </Td>
              <Td>{u.email}</Td>
              <Td>{u.credit_balance.toFixed(2)} €</Td>
              <Td>
                <Link href={`/admin/users/${u.id}`}>Detail / pridať kredit</Link>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
