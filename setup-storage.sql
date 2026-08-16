-- Supabase Storage setup for RAINMAN SHORTS
insert into storage.buckets(id,name,public) values('videos','videos',true)
on conflict(id) do update set public=true;
drop policy if exists "Public read RAINMAN videos" on storage.objects;
create policy "Public read RAINMAN videos" on storage.objects for select to anon,authenticated using(bucket_id='videos');
drop policy if exists "Users upload RAINMAN videos" on storage.objects;
create policy "Users upload RAINMAN videos" on storage.objects for insert to authenticated with check(bucket_id='videos' and (storage.foldername(name))[1]=(select auth.uid()::text));
drop policy if exists "Users delete own RAINMAN videos" on storage.objects;
create policy "Users delete own RAINMAN videos" on storage.objects for delete to authenticated using(bucket_id='videos' and owner_id=(select auth.uid()::text));
-- After registering your account, make yourself admin:
-- update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL');
