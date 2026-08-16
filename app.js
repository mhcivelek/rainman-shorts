const cfg=window.RAINMAN_CONFIG||{};
const isConfigured=cfg.url && cfg.key && !cfg.url.includes("PASTE_") && !cfg.key.includes("PASTE_");
const db=isConfigured?supabase.createClient(cfg.url,cfg.key):null;
const $=id=>document.getElementById(id);
let user=null,profile=null,mode="login";
const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const msg=(text,ok=false)=>{const el=$("globalMessage");if(el){el.textContent=text;el.className=ok?"ok":"error";}};
function go(p){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 $(p)?.classList.add("active");
 if(p==="home") feed(); if(p==="categories") cats(); if(p==="upload") loadCatSelect();
 if(p==="profile") myProfile(); if(p==="admin") admin(); scrollTo(0,0);
}
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>go(b.dataset.page));

function authOpen(m){mode=m;$("authModal").classList.remove("hide");$("usernameWrap").classList.toggle("hide",m!=="register");$("authSubmit").textContent=m==="register"?"Kayıt Ol":"Giriş Yap";$("tabLogin").classList.toggle("active",m==="login");$("tabRegister").classList.toggle("active",m==="register");$("authMessage").textContent=""}
$("loginBtn").onclick=()=>authOpen("login"); $("registerBtn").onclick=()=>authOpen("register");
$("closeAuth").onclick=()=>$("authModal").classList.add("hide");
$("tabLogin").onclick=()=>authOpen("login"); $("tabRegister").onclick=()=>authOpen("register");

$("authForm").onsubmit=async e=>{
 e.preventDefault(); if(!db){$("authMessage").textContent="Önce config.js içine Supabase URL ve Publishable key eklenmeli.";return}
 try{
  const email=$("authEmail").value.trim(), password=$("authPassword").value;
  if(mode==="register"){
   const u=$("authUsername").value.trim().toLowerCase();
   if(!/^[a-z0-9_.-]{3,30}$/.test(u)) throw Error("Kullanıcı adı 3-30 karakter olmalı.");
   const r=await db.auth.signUp({email,password,options:{data:{username:u}}});
   if(r.error) throw r.error;
   if(r.data.user){
    const p=await db.from("profiles").upsert({id:r.data.user.id,username:u},{onConflict:"id"});
    if(p.error) throw p.error;
   }
   $("authMessage").textContent=r.data.session?"Kayıt ve giriş başarılı.":"Kayıt başarılı. E-posta doğrulaması gerekiyorsa gelen kutunu kontrol et.";
  }else{
   const r=await db.auth.signInWithPassword({email,password}); if(r.error) throw r.error;
   $("authModal").classList.add("hide"); await refresh(); msg("Giriş başarılı.",true);
  }
 }catch(x){$("authMessage").textContent=x.message||"Giriş/kayıt hatası."}
};

async function refresh(){
 if(!db){msg("Supabase bağlantısı yapılmamış. config.js dosyasını doldur.");return}
 const r=await db.auth.getSession(); user=r.data.session?.user||null; profile=null;
 if(user){
  const r2=await db.from("profiles").select("id,username,bio,role").eq("id",user.id).maybeSingle();
  profile=r2.data||null;
 }
 $("loginBtn").classList.toggle("hide",!!user); $("registerBtn").classList.toggle("hide",!!user); $("logoutBtn").classList.toggle("hide",!user);
 $("adminNav").classList.toggle("hide",!["admin","moderator"].includes(profile?.role));
 const roleEl=$("roleBadge"); if(roleEl) roleEl.textContent=user?`@${profile?.username||user.email} · ${profile?.role||"user"}`:"Misafir";
}
$("logoutBtn").onclick=async()=>{await db.auth.signOut();await refresh();go("home")};
if(db) db.auth.onAuthStateChange(()=>setTimeout(refresh,0));

async function cats(){
 if(!db)return;
 const r=await db.from("categories").select("id,name").order("name");
 if(r.error){msg("Kategoriler okunamadı: "+r.error.message);return}
 $("categoryGrid").innerHTML=(r.data||[]).map(c=>`<button class="cat" data-cat="${c.id}">${esc(c.name)}</button>`).join("");
 document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>catVideos(b.dataset.cat));
}
async function catVideos(id){
 const r=await db.from("videos").select("*,profiles(username),categories(name)").eq("category_id",id).eq("status","approved").order("created_at",{ascending:false});
 if(r.error){msg("Videolar okunamadı: "+r.error.message);return}
 $("categoryVideos").innerHTML=(r.data||[]).map(card).join("")||'<div class="panel">Bu kategoride henüz video yok.</div>';
}
function card(v){return `<article class="card"><video src="${esc(v.video_url)}" controls playsinline preload="metadata"></video><div class="pad"><h3>${esc(v.title)}</h3><p>@${esc(v.profiles?.username||"kullanıcı")} · ${esc(v.categories?.name||"")}</p><span class="status">${esc(v.status)}</span></div></article>`}
function short(v){return `<article class="card"><video src="${esc(v.video_url)}" controls playsinline loop preload="metadata"></video><div class="pad"><h3>${esc(v.title)}</h3><p>@${esc(v.profiles?.username||"kullanıcı")} · ${esc(v.categories?.name||"")}</p><div class="actions"><button class="action like" data-id="${v.id}">♡ Beğen</button></div></div></article>`}
async function feed(){
 if(!db)return;
 const r=await db.from("videos").select("*,profiles(username),categories(name)").eq("status","approved").order("created_at",{ascending:false}).limit(40);
 if(r.error){$("feedStatus").textContent="DB hatası";$("shortsFeed").innerHTML=`<div class="panel error">${esc(r.error.message)}</div>`;return}
 $("feedStatus").textContent=`${r.data?.length||0} video`; $("shortsFeed").innerHTML=(r.data||[]).map(short).join("")||'<div class="panel">Henüz yayınlanmış video yok.</div>';
 document.querySelectorAll("#shortsFeed video").forEach(v=>{const io=new IntersectionObserver(es=>es.forEach(x=>x.isIntersecting?v.play().catch(()=>{}):v.pause()),{threshold:.65});io.observe(v)});
}
document.addEventListener("click",async e=>{
 const b=e.target.closest(".like"); if(!b)return;
 if(!user){authOpen("login");return}
 const r=await db.from("likes").select("*").eq("user_id",user.id).eq("video_id",b.dataset.id).maybeSingle();
 if(r.error){msg("Beğeni hatası: "+r.error.message);return}
 const q=r.data?await db.from("likes").delete().eq("user_id",user.id).eq("video_id",b.dataset.id):await db.from("likes").insert({user_id:user.id,video_id:b.dataset.id});
 if(q.error){msg("Beğeni hatası: "+q.error.message);return} b.textContent=r.data?"♡ Beğen":"♥ Beğen";
});

$("videoFile").onchange=()=>{
 const f=$("videoFile").files[0]; $("uploadMessage").textContent="";
 if(!f)return;
 if(f.size>50*1024*1024){$("uploadMessage").textContent="Bu Supabase Free proje için 50 MB sınırını aşar."; $("uploadPreview").classList.add("hide");return}
 if(!/^video\/(mp4|webm|quicktime|x-matroska)$/.test(f.type) && !/\.(mp4|webm|mov|mkv)$/i.test(f.name)){ $("uploadMessage").textContent="MP4, WebM, MOV veya MKV seç.";return}
 $("uploadPreview").src=URL.createObjectURL(f);$("uploadPreview").classList.remove("hide");
 $("fileInfo").textContent=`${f.name} · ${(f.size/1024/1024).toFixed(1)} MB`;
};

async function loadCatSelect(){
 if(!db)return;
 const r=await db.from("categories").select("id,name").order("name");
 if(r.error){$("uploadMessage").textContent="Kategori hatası: "+r.error.message;return}
 $("videoCategory").innerHTML=(r.data||[]).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("");
}

$("uploadForm").onsubmit=async e=>{
 e.preventDefault(); $("uploadMessage").textContent="";
 if(!db){$("uploadMessage").textContent="Supabase bağlantısı yok. config.js kontrol et.";return}
 if(!user){authOpen("login");return}
 const f=$("videoFile").files[0];
 try{
  if(!f)throw Error("Önce bir video seç.");
  if(f.size>50*1024*1024)throw Error("Supabase Free planında maksimum 50 MB. 50 MB altı bir dosya seç.");
  if(!$("safeContent").checked)throw Error("+18 olmadığını onaylamalısın.");
  if(!$("videoTitle").value.trim())throw Error("Başlık gir.");
  if(!$("videoCategory").value)throw Error("Kategori seç.");

  $("uploadButton").disabled=true;$("uploadButton").textContent="Yükleniyor...";
  $("progressBar").style.width="15%";

  const ext=(f.name.split(".").pop()||"mp4").toLowerCase();
  const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
  const u=await db.storage.from("videos").upload(path,f,{contentType:f.type||"video/mp4",cacheControl:"3600",upsert:false});
  if(u.error) throw Error(`Storage yükleme hatası: ${u.error.message}`);

  $("progressBar").style.width="75%";
  const url=db.storage.from("videos").getPublicUrl(path).data.publicUrl;
  const v=await db.from("videos").insert({
   user_id:user.id,title:$("videoTitle").value.trim(),description:$("videoDescription").value.trim(),
   category_id:$("videoCategory").value,video_url:url,status:"pending"
  });
  if(v.error) throw Error(`Video kayıt hatası: ${v.error.message}`);

  $("progressBar").style.width="100%"; $("uploadMessage").textContent="✓ Video yüklendi. Admin onayı bekliyor."; $("uploadMessage").className="ok";
  $("uploadForm").reset();$("uploadPreview").classList.add("hide");$("fileInfo").textContent="";
 }catch(x){$("uploadMessage").textContent=x.message||"Video yüklenemedi.";$("uploadMessage").className="error";$("progressBar").style.width="0%";console.error(x)}
 finally{$("uploadButton").disabled=false;$("uploadButton").textContent="Videoyu Yükle"}
};

async function myProfile(){
 if(!user){$("profileBox").innerHTML='<div class="panel">Profil için giriş yapmalısın.</div>';return}
 const r=await db.from("profiles").select("*").eq("id",user.id).single();
 if(r.error){$("profileBox").innerHTML=`<div class="panel error">${esc(r.error.message)}</div>`;return}
 profile=r.data;
 $("profileBox").innerHTML=`<h2>@${esc(profile.username||"")}</h2><p class="muted">${esc(profile.bio||"RAINMAN SHORTS kullanıcısı")}</p><p>Rol: <b>${esc(profile.role||"user")}</b></p><p class="muted">UID: ${esc(user.id)}</p>`;
 const v=await db.from("videos").select("*,categories(name)").eq("user_id",user.id).order("created_at",{ascending:false});
 $("myVideos").innerHTML=(v.data||[]).map(card).join("")||'<div class="panel">Henüz video yok.</div>';
}

async function admin(){
 if(!["admin","moderator"].includes(profile?.role)){msg("Bu hesap admin değil. SQL ile role='admin' ver.");go("home");return}
 const r=await db.from("videos").select("*,profiles(username),categories(name)").eq("status","pending").order("created_at");
 if(r.error){$("adminVideos").innerHTML=`<div class="panel error">Admin sorgusu: ${esc(r.error.message)}</div>`;return}
 $("adminVideos").innerHTML=(r.data||[]).map(v=>`<article class="card"><video src="${esc(v.video_url)}" controls playsinline></video><div class="pad"><h3>${esc(v.title)}</h3><p>@${esc(v.profiles?.username||"")}</p><div class="actions"><button class="action decision" data-id="${v.id}" data-status="approved">✓ Onayla</button><button class="action decision" data-id="${v.id}" data-status="rejected">✕ Reddet</button></div></div></article>`).join("")||'<div class="panel">Onay bekleyen video yok.</div>';
}
document.addEventListener("click",async e=>{
 const b=e.target.closest(".decision");if(!b)return;
 const r=await db.from("videos").update({status:b.dataset.status}).eq("id",b.dataset.id);
 if(r.error)msg("Admin işlem hatası: "+r.error.message);else admin();
});

(async()=>{if(!isConfigured){msg("Supabase bağlantısı hazır değil. config.js dosyasını doldur.");return}await refresh();await loadCatSelect();await feed()})();