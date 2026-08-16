# RAINMAN SHORTS — Supabase v1

1. Supabase SQL Editor'da `setup-storage.sql` dosyasını çalıştır.
2. `app.js` içindeki iki alanı doldur:
   SUPABASE_URL = Project URL
   SUPABASE_PUBLISHABLE_KEY = Publishable key
3. Secret/service_role key'i ASLA kullanma.
4. Dosyaları GitHub repository köküne yükle: index.html, style.css, app.js, setup-storage.sql.
5. GitHub Pages'i main / root olarak yayınla.
6. İlk kullanıcıyı siteden kaydet. Sonra SQL Editor:
   update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL');
7. Auth URL Configuration:
   Site URL: https://mhcivelek.github.io/rainman-shorts/
   Redirect: https://mhcivelek.github.io/rainman-shorts/**

Not: +18 engeli bu sürümde yükleyicinin beyanı + admin onayı ile çalışır. Gerçek otomatik içerik moderasyonu için ayrıca sunucu tarafı video moderasyon servisi gerekir.
