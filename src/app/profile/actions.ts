'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Column-level GRANTs in the migration make this the full set of columns
  // `authenticated` can write at all - there's no way to smuggle
  // `is_admin`/`credit_balance` through here even if we forgot to filter
  // formData, because Postgres itself would reject the write.
  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: String(formData.get('firstName') ?? ''),
      last_name: String(formData.get('lastName') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      birthday: (formData.get('birthday') as string) || null,
      country: (formData.get('country') as string) || null,
      nationality: (formData.get('nationality') as string) || null
    })
    .eq('id', user.id);

  if (error) {
    redirect(`/profile?error=${encodeURIComponent('Profil sa nepodarilo uložiť.')}`);
  }

  revalidatePath('/profile');
  redirect('/profile');
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// MIME type -> file extension. Deriving the stored extension from the
// validated content type (not from the user-supplied file.name) means a
// caller can't smuggle an arbitrary extension - e.g. `avatar.html` - into
// the storage object key. The storage bucket is public and served by URL,
// so the object name is attacker-influenced input that ends up in a path.
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
};
const ALLOWED_IMAGE_TYPES = new Set(Object.keys(IMAGE_EXTENSIONS));

export async function uploadProfileImage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const file = formData.get('image') as File | null;
  if (!file || file.size === 0) {
    redirect('/profile');
  }

  // Belt-and-braces client-visible checks - the storage bucket itself also
  // enforces file_size_limit/allowed_mime_types (see migration), so a
  // request that bypasses this app entirely still can't upload anything else.
  if (file.size > MAX_IMAGE_BYTES || !ALLOWED_IMAGE_TYPES.has(file.type)) {
    redirect(`/profile?error=${encodeURIComponent('Obrázok musí byť JPEG/PNG/GIF/WebP do 5 MB.')}`);
  }

  // The storage RLS policy only allows writes under profiles/<own uid>/... -
  // this path can't be used to overwrite anyone else's file. The extension
  // comes from the validated MIME type (see IMAGE_EXTENSIONS), never the
  // user-supplied file.name, so it can't inject a path/extension of its own.
  const extension = IMAGE_EXTENSIONS[file.type] ?? 'jpg';
  const path = `profiles/${user.id}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage.from('public-images').upload(path, file, { upsert: true });
  if (uploadError) {
    redirect(`/profile?error=${encodeURIComponent('Obrázok sa nepodarilo nahrať.')}`);
  }

  await supabase.from('profiles').update({ image_path: path }).eq('id', user.id);

  revalidatePath('/profile');
  redirect('/profile');
}
