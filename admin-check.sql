-- RAINMAN SHORTS ADMIN KONTROLÜ
-- 1) Kendi hesabının durumunu gör:
select id, email, created_at from auth.users order by created_at desc;

-- 2) Kendi email adresini aşağıya yazıp admin yap:
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where lower(email)=lower('SENIN_EMAILIN')
);

-- 3) Sonucu doğrula:
select p.id, p.username, p.role, u.email
from public.profiles p
join auth.users u on u.id=p.id
where lower(u.email)=lower('SENIN_EMAILIN');

-- Beklenen: role = admin
