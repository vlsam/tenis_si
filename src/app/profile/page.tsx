import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate, minuteToTime, ORDER_STATUS_LABELS } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { updateProfile, uploadProfileImage } from './actions';

export default async function ProfilePage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const avatarUrl = profile?.image_path
    ? supabase.storage.from('public-images').getPublicUrl(profile.image_path).data.publicUrl
    : null;
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, order_date, from_minute, to_minute, price, courts(name)')
    .eq('user_id', user.id)
    .order('order_date', { ascending: false });

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <PageHeader title="Môj profil" />

        {searchParams.error && <div className="alert-danger mb-4">{searchParams.error}</div>}

        <p className="mb-4">
          {user.email} - Kredit: <strong>{profile?.credit_balance.toFixed(2)} €</strong> -{' '}
          <Link href="/credit/topup">dobiť</Link>
        </p>

        <div className="card mb-4 flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, next/image remote config not worth it for an avatar
            <img src={avatarUrl} alt="" width={64} height={64} className="rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          )}
          <form action={uploadProfileImage} className="flex items-center gap-2">
            <input type="file" name="image" accept="image/png,image/jpeg,image/gif,image/webp" required />
            <button className="btn-secondary !px-3 !py-1.5 text-sm" type="submit">
              Nahrať
            </button>
          </form>
        </div>

        <form action={updateProfile} className="card space-y-3">
          <div>
            <label className="mb-1 block text-sm">Meno</label>
            <input className="input" name="firstName" defaultValue={profile?.first_name ?? ''} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Priezvisko</label>
            <input className="input" name="lastName" defaultValue={profile?.last_name ?? ''} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Telefón</label>
            <input className="input" name="phone" defaultValue={profile?.phone ?? ''} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Dátum narodenia</label>
            <input className="input" type="date" name="birthday" defaultValue={profile?.birthday ?? ''} />
          </div>
          <button className="btn" type="submit">
            Uložiť
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Moje rezervácie</h2>
        <div className="space-y-3">
          {orders?.map(order => {
            const court = Array.isArray(order.courts) ? order.courts[0] : order.courts;
            return (
              <Link key={order.id} href={`/orders/${order.id}`} className="card block hover:shadow-md">
                <div className="flex justify-between">
                  <span className="font-medium">{court?.name}</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{ORDER_STATUS_LABELS[order.status]}</span>
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {formatDate(order.order_date)}, {minuteToTime(order.from_minute)} - {minuteToTime(order.to_minute)} -{' '}
                  {order.price.toFixed(2)} €
                </div>
              </Link>
            );
          })}
          {orders?.length === 0 && <p className="text-neutral-500 dark:text-neutral-400">Zatiaľ žiadne rezervácie.</p>}
        </div>
      </div>
    </div>
  );
}
