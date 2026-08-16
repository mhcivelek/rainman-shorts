-- RAINMAN SHORTS STORAGE + RLS FIX
-- Supabase SQL Editor'da bir kez çalıştır.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
 'videos','videos',true,52428800,
 array['video/mp4','video/webm','video/quicktime','video/x-matroska']
)
on conflict(id) do update set
 public=true,
 file_size_limit=52428800,
 allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "RAINMAN videos public read" on storage.objects;
create policy "RAINMAN videos public read"
on storage.objects for select
to anon, authenticated
using(bucket_id='videos');

drop policy if exists "RAINMAN users upload own folder" on storage.objects;
create policy "RAINMAN users upload own folder"
on storage.objects for insert
to authenticated
with check(
 bucket_id='videos'
 and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "RAINMAN users delete own files" on storage.objects;
create policy "RAINMAN users delete own files"
on storage.objects for delete
to authenticated
using(
 bucket_id='videos'
 and owner_id = (select auth.uid()::text)
);

-- Admin/moderator video güncellemesi için:
drop policy if exists "RAINMAN admins update videos" on public.videos;
create policy "RAINMAN admins update videos"
on public.videos for update
to authenticated
using(
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','moderator'))
)
with check(
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','moderator'))
);
