# RAINMAN SHORTS v2 — Supabase bağlantılı sürüm

## 1) Supabase bağlantısı
`config.js` dosyasını aç:
- `url`: Supabase Project URL
- `key`: Supabase Publishable key

Secret / service_role key KULLANMA.

## 2) Storage
Supabase > SQL Editor > `storage-fix.sql` içeriğini çalıştır.
Bu sürüm Free plan için video sınırını 50 MB'a ayarlar.

Supabase Free planında maksimum dosya yükleme boyutu 50 MB'dır. 100 MB kabul eden eski arayüz bu yüzden yanıltıcıydı.

## 3) Admin
Önce siteden hesabını oluştur.
Sonra SQL Editor'da `admin-check.sql` içindeki:
`SENIN_EMAILIN`
kısmını kendi e-postanla değiştirip çalıştır.

Son sorguda `role = admin` görünmeli.

## 4) GitHub
Şunları repository köküne yükle:
- index.html
- style.css
- app.js
- config.js
- storage-fix.sql
- admin-check.sql

GitHub Pages'i main / root olarak çalıştır.

## 5) Upload hatası
Artık yükleme ekranında gerçek Supabase hatası gösterilir:
- Bucket/policy hatası
- 50 MB sınırı
- Oturum hatası
- videos tablosu/RLS hatası

Böylece "buton çalışmıyor" durumunda hatanın ne olduğunu doğrudan görebileceğiz.
