-- Create the character-portraits storage bucket.
-- This is a PUBLIC bucket (unauthenticated reads allowed) for character portrait images.
-- File size limit: 1 MB. Accepted MIME types: JPEG, PNG, WebP.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'character-portraits',
  'character-portraits',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- RLS policies for storage.objects scoped to the character-portraits bucket.
-- WARNING: These policies are intentionally PERMISSIVE — they allow any anonymous
-- user to read, upload, update, and delete portraits. This is acceptable for the
-- current no-auth development state, but MUST be tightened when authentication lands:
-- replace the permissive policies with user-scoped ones (e.g. auth.uid() = owner).

create policy "character-portraits: public select"
  on storage.objects
  for select
  using (bucket_id = 'character-portraits');

create policy "character-portraits: public insert"
  on storage.objects
  for insert
  with check (bucket_id = 'character-portraits');

create policy "character-portraits: public update"
  on storage.objects
  for update
  using (bucket_id = 'character-portraits');

create policy "character-portraits: public delete"
  on storage.objects
  for delete
  using (bucket_id = 'character-portraits');
