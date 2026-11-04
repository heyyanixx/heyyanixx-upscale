// HEYYANIXX Upscale — offline support. App shell is cached on install; the AI upscale model (open-source shader library)
// is cached the first time it is used (or prefetched on desktop GPUs), so Fast Enhance + AI work offline afterwards.
const V='hx-v5';
const SHELL=['./','index.html','app.js','hexy.js','desk.js','vendor/mp4-muxer.mjs','vendor/mp4box.all.mjs','vendor/rolldown-runtime-CNh9ExCG.mjs','vendor/styp-BV5G3FS-.mjs','hexy-32.png','hexy-96.png','hexy-180.png','hexy-icon.png','manifest.webmanifest'];
const AI=['https://cdn.jsdelivr.net/npm/anime4k-webgpu@1.0.0/lib/index.js','https://unpkg.com/anime4k-webgpu@1.0.0/lib/index.js'];
const AIC='hx-ai-1';
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==AIC).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
async function warmAI(){ const c=await caches.open(AIC); if(await c.match(AI[0])) return; try{ const r=await fetch(AI[0],{mode:'cors',credentials:'omit'}); if(r.ok) await c.put(AI[0],r); }catch(e){} }
self.addEventListener('message',e=>{ if(e.data&&e.data.hx==='warmAI') e.waitUntil(warmAI()); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return; const u=new URL(r.url);
  if(AI.includes(r.url)){ // AI model: cache-first (versioned URL never changes)
    e.respondWith(caches.open(AIC).then(async c=>{ const hit=await c.match(r.url); if(hit) return hit; const res=await fetch(r); if(res.ok) c.put(r.url,res.clone()); return res; })); return; }
  if(u.origin!==location.origin) return;
  // same-origin: network first (always fresh when online), cache fallback when offline
  e.respondWith(fetch(r).then(res=>{ if(res.ok&&res.type==='basic'){ const cp=res.clone(); caches.open(V).then(c=>c.put(r,cp)); } return res; })
    .catch(async()=>{ const c=await caches.open(V); return (await c.match(r)) || (await c.match(r,{ignoreSearch:true})) || (r.mode==='navigate' ? (await c.match('index.html')) : Response.error()); }));
});
