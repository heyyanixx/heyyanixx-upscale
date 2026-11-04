// Hexy — mini editor bot. Rule-based smart suggestions, 100% on device (no API, no upload).
while(!window.HXapi) await new Promise(r=>setTimeout(r,50));
const H=window.HXapi, $=(id)=>document.getElementById(id);
const css=`
body{padding-bottom:64px}
#hxBtn{position:fixed;right:12px;bottom:14px;z-index:50;width:48px;height:48px;border-radius:50%;border:1.5px solid #e3b65a88;background:radial-gradient(circle at 50% 35%,#1d1a12,#060608 70%);padding:0;cursor:pointer;box-shadow:0 5px 16px #000b,0 0 12px #e3b65a33;overflow:visible}
#hxBtn svg{width:100%;height:100%;display:block;overflow:visible}#hxBtn:active{transform:scale(.92)}
#hxBtn .dot{position:absolute;top:-1px;right:-1px;width:11px;height:11px;border-radius:50%;background:#ff4d6d;border:2px solid #060608;display:none}
#hxBtn.new .dot{display:block}
#hxBtn .nm{position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);font:800 9px/1 system-ui,sans-serif;color:#060608;background:#e3b65a;border-radius:99px;padding:2px 5px}
.hxbot{animation:hxfloat 3.2s ease-in-out infinite;transform-origin:32px 40px}
.hxeyes{animation:hxblink 4.6s infinite;transform-origin:32px 30px}
.hxtip{animation:hxglow 1.8s ease-in-out infinite}
@keyframes hxfloat{0%,100%{transform:translateY(1.5px)}50%{transform:translateY(-2px)}}
@keyframes hxblink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes hxglow{0%,100%{opacity:.75}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.hxbot,.hxeyes,.hxtip,.hxdots i{animation:none}}
#hxP{position:fixed;right:10px;bottom:72px;z-index:51;width:min(262px,calc(100vw - 20px));max-height:45vh;display:flex;flex-direction:column;background:rgba(14,13,18,.84);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid #e3b65a66;border-radius:18px;box-shadow:0 12px 36px #000c;overflow:hidden}
#hxP.hidden{display:none}
#hxP.min{max-height:none}#hxP.min .bd,#hxP.min .hxs{display:none}
#hxP .hd{display:flex;align-items:center;gap:7px;padding:6px 6px 6px 8px;border-bottom:1px solid #ffffff12;background:linear-gradient(135deg,#2a211288,#0000)}
#hxP .hd svg{width:30px;height:30px;flex:0 0 30px;overflow:visible}#hxP .hd b{color:#f5d48c;font-size:13.5px}#hxP .hd small{display:block;color:#a9a497;font-size:10.5px}
#hxP .hb{margin-left:auto;display:flex}#hxP .hb button{background:none;border:0;color:#bdb8aa;font-size:19px;line-height:1;cursor:pointer;padding:6px 8px;border-radius:8px}#hxP .hb button:active{background:#ffffff14}
#hxP .bd{padding:9px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain}
.hxm{background:#ffffff0f;border:1px solid #ffffff14;border-radius:14px 14px 14px 4px;padding:7px 9px;font-size:12.5px;line-height:1.38;color:#f3f0e8;max-width:96%}
.hxm.best{border-color:#e3b65a99;background:#e3b65a1c}.hxm.best b{color:#f5d48c}
.hxm ul{margin:3px 0 0;padding-left:16px}.hxm li{margin:2px 0}
.hxa{display:flex;gap:6px;flex-wrap:wrap}.hxa button{flex:1;min-height:38px;border-radius:11px;border:0;background:#e3b65a;color:#0a0804;font:800 13px system-ui,sans-serif;cursor:pointer;padding:0 8px}
.hxa button.g{background:#ffffff12;color:#f3f0e8;border:1px solid #ffffff1c}
.hxs{font-size:10px;color:#8f8a7e;text-align:center;padding:0 6px 6px}
.hxdots{display:inline-flex;gap:4px}.hxdots i{width:5px;height:5px;border-radius:50%;background:#e3b65a;animation:hxb 1s infinite}.hxdots i:nth-child(2){animation-delay:.15s}.hxdots i:nth-child(3){animation-delay:.3s}
@keyframes hxb{0%,100%{opacity:.25}50%{opacity:1}}`;
let _u=0; const face=()=>{ const u='hx'+(++_u); return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs>
<radialGradient id="${u}h" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#ece7dc"/><stop offset="1" stop-color="#b9b2a2"/></radialGradient>
<radialGradient id="${u}v" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#2b2b36"/><stop offset="1" stop-color="#07070b"/></radialGradient>
<radialGradient id="${u}g" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#fff0c2"/><stop offset=".6" stop-color="#e3b65a"/><stop offset="1" stop-color="#9c7425"/></radialGradient>
<radialGradient id="${u}e" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#ffe6a3"/><stop offset=".6" stop-color="#e3b65a"/><stop offset="1" stop-color="#7a5514"/></radialGradient>
<radialGradient id="${u}t" r="50%"><stop offset="0" stop-color="#fff6d6"/><stop offset=".5" stop-color="#f5d48c"/><stop offset="1" stop-color="#e3b65a00"/></radialGradient></defs>
<ellipse cx="32" cy="61" rx="13" ry="2.4" fill="#000" opacity=".45"/>
<g class="hxbot">
<path d="M21 49 Q15 52 16 57" stroke="url(#${u}g)" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M43 49 Q49 52 48 57" stroke="url(#${u}g)" stroke-width="4" stroke-linecap="round" fill="none"/>
<rect x="21" y="44" width="22" height="15" rx="7.5" fill="url(#${u}g)"/><circle cx="32" cy="51.5" r="2.6" fill="#060608"/><circle cx="32" cy="51.5" r="1.2" fill="#9fe8ff"/>
<line x1="32" y1="9" x2="32" y2="3.5" stroke="#cfc6b2" stroke-width="2.2" stroke-linecap="round"/><circle class="hxtip" cx="32" cy="3.5" r="5" fill="url(#${u}t)"/><circle cx="32" cy="3.5" r="2.2" fill="#f5d48c"/>
<rect x="6" y="9" width="52" height="38" rx="19" fill="url(#${u}h)" stroke="#e3b65a" stroke-width="1.6"/>
<rect x="3.5" y="22" width="5" height="11" rx="2.5" fill="url(#${u}g)"/><rect x="55.5" y="22" width="5" height="11" rx="2.5" fill="url(#${u}g)"/>
<rect x="11" y="15" width="42" height="27" rx="13.5" fill="url(#${u}v)"/>
<g class="hxeyes"><ellipse cx="23" cy="28.5" rx="5.4" ry="7" fill="url(#${u}e)"/><ellipse cx="41" cy="28.5" rx="5.4" ry="7" fill="url(#${u}e)"/>
<ellipse cx="23" cy="29.5" rx="2.6" ry="3.6" fill="#1a1206"/><ellipse cx="41" cy="29.5" rx="2.6" ry="3.6" fill="#1a1206"/>
<circle cx="21.2" cy="25.6" r="2" fill="#fff"/><circle cx="39.2" cy="25.6" r="2" fill="#fff"/><circle cx="24.8" cy="32" r=".9" fill="#fff"/><circle cx="42.8" cy="32" r=".9" fill="#fff"/></g>
<path d="M29 36.2 Q32 38.6 35 36.2" stroke="#f5d48c" stroke-width="1.6" stroke-linecap="round" fill="none"/>
<ellipse cx="15.5" cy="36" rx="3" ry="1.8" fill="#ff8fa8" opacity=".7"/><ellipse cx="48.5" cy="36" rx="3" ry="1.8" fill="#ff8fa8" opacity=".7"/>
<path d="M14 15 Q20 11 27 11.5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".9"/>
</g></svg>`; };
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
const btn=document.createElement('button'); btn.id='hxBtn'; btn.setAttribute('aria-label','Hexy editor bot'); btn.innerHTML=face()+'<span class="dot"></span><span class="nm">Hexy</span>';
const P=document.createElement('div'); P.id='hxP'; P.className='hidden';
P.innerHTML=`<div class="hd">${face()}<div><b>Hexy ✨</b><small>tera mini editor dost · smart tips</small></div><div class="hb"><button class="mn" aria-label="minimize">–</button><button class="x" aria-label="close">×</button></div></div><div class="bd" id="hxB"></div><div class="hxs">Smart suggestions · clip phone se bahar nahi jaati 🔒</div>`;
document.body.append(btn,P);
const B=P.querySelector('#hxB');
let A=null, busy=false, lastFile=null;

const msg=(html,cls='')=>{ const d=document.createElement('div'); d.className='hxm '+cls; d.innerHTML=html; B.appendChild(d); return d; };
function greet(){ B.innerHTML=''; msg('Heyy! 👋 Main <b>Hexy</b> hoon, tera chhota editor dost 🤖✨');
  msg('Clip upload kar 📁, main scan karke bataunga kaunsa look + upscale best rahega 😄');
  const a=document.createElement('div'); a.className='hxa'; a.innerHTML='<button>📁 Clip daalo</button><button class="g">📘 Guide</button>'; B.appendChild(a);
  a.children[0].onclick=()=>{ close(); $('file').click(); }; a.children[1].onclick=openGuide; }
function openGuide(){ close(); const g=$('guide'); if(g){ g.open=true; g.scrollIntoView({behavior:'smooth',block:'start'}); } }

// ---- analysis: ~10 frames sampled on a hidden video, all on device
async function analyse(){
  const S=H.S, I=S.info; const v=document.createElement('video'); v.muted=true; v.playsInline=true; v.preload='auto'; v.src=URL.createObjectURL(S.file);
  await new Promise((r,j)=>{ v.onloadeddata=r; v.onerror=j; setTimeout(r,8000); });
  const W=320, Hh=Math.max(2,Math.round(W*v.videoHeight/v.videoWidth)); const c=document.createElement('canvas'); c.width=W; c.height=Hh; const x=c.getContext('2d',{willReadFrequently:true});
  const n=10, acc={y:0,ys:0,s:0,rb:0,rf:0,bf:0,lap:0,noise:0,k:0};
  for(let f=0;f<n;f++){ const t=I.dur*(0.05+0.9*f/(n-1));
    await new Promise(r=>{ const d=()=>{v.removeEventListener('seeked',d); r();}; v.addEventListener('seeked',d); v.currentTime=t; setTimeout(r,3000); });
    x.drawImage(v,0,0,W,Hh); const p=x.getImageData(0,0,W,Hh).data, L=new Float32Array(W*Hh);
    let sy=0,sy2=0,ss=0,srb=0,rf=0,bf=0;
    for(let i=0,j=0;i<p.length;i+=4,j++){ const r=p[i]/255,g=p[i+1]/255,b=p[i+2]/255; const y=.2126*r+.7152*g+.0722*b; L[j]=y; sy+=y; sy2+=y*y;
      const mx=Math.max(r,g,b), mn=Math.min(r,g,b); ss+=mx>0.04?(mx-mn)/mx:0; srb+=r-b;
      if(mx>.12&&r>g*1.35&&r>b*1.35) rf++; if(mx>.12&&b>r*1.15&&b>=g*.85) bf++; }
    const N=W*Hh, my=sy/N; acc.y+=my; acc.ys+=Math.sqrt(Math.max(0,sy2/N-my*my)); acc.s+=ss/N; acc.rb+=srb/N; acc.rf+=rf/N; acc.bf+=bf/N;
    let lp=0, lps=[]; for(let yy=1;yy<Hh-1;yy++) for(let xx=1;xx<W-1;xx++){ const k=yy*W+xx; const l=Math.abs(4*L[k]-L[k-1]-L[k+1]-L[k-W]-L[k+W]); lp+=l; if((xx&7)==0&&(yy&7)==0) lps.push(l); }
    lps.sort((a,b)=>a-b); acc.lap+=lp/((W-2)*(Hh-2)); acc.noise+=lps[Math.floor(lps.length*.25)]||0; acc.k++; }
  URL.revokeObjectURL(v.src); const k=acc.k||1;
  return {w:I.sw,h:I.sh,fps:I.fps,bright:acc.y/k,contrast:acc.ys/k,sat:acc.s/k,rb:acc.rb/k,red:acc.rf/k,blue:acc.bf/k,sharp:acc.lap/k,noise:acc.noise/k};
}
function decide(m){
  const short=Math.min(m.w,m.h), dark=m.bright<.36, gpu=H.S.gpuOK;
  // dark + red-heavy → Dark Red; bright / blue → Bright HDR
  const score=(0.39-m.bright)*4 + (m.red-m.blue)*3 + m.rb;
  const best=score>0?'ffdark':(m.bright>=.42&&m.blue>=m.red?'ffbright':'ultra'), blurry=m.sharp<0.022, lowres=short<720, lowfps=m.fps<=31;
  const t=[];
  t.push(lowres?`📐 Clip <b>${short}p</b> hai — low-res. ${gpu?'<b>AI HD 2x</b> (laptop pe AI Max) upscale ON karenge':'Is phone pe <b>Fast Enhance 2x</b> upscale chalega'}, phir 1080p export.`
               :`📐 ${m.w}×${m.h} — achha base. ${gpu?'AI HD 2x':'Fast Enhance'} upscale + <b>1080p</b> export (Insta ke liye best).`);
  t.push(dark?`🌑 Clip dark hai (brightness ${Math.round(m.bright*100)}%) — moody look pe perfect, shadows aur deep honge.`
             :`☀️ Clip bright hai (brightness ${Math.round(m.bright*100)}%) — HDR look se colours aur pop karenge.`);
  if(m.red>m.blue*1.2&&m.rb>0) t.push(`🔴 Red tone zyada hai (${Math.round(m.red*100)}% red area) — clean cinematic grade usko balance karega (koi red tint nahi).`);
  else if(m.blue>m.red) t.push(`🔵 Blue/sky tone zyada (${Math.round(m.blue*100)}% area) — sky pop + vibrance up.`);
  if(m.contrast<.17) t.push('🌫️ Contrast flat hai — look contrast badhayega.');
  else if(m.sat<.22) t.push('🎨 Colours thode faded — vibrance up karenge.');
  t.push(blurry?'🔍 Clip thoda soft/blurry lag raha — <b>sharpness up</b> karenge (zyada mat karna, grain aata hai).':'🔍 Detail theek hai 👍 sharpness halki si hi badhayenge.');
  t.push(lowfps?`🎞️ Clip ${Math.round(m.fps)}fps hai → <b>60fps smooth ON</b>.`:`🎞️ Already ${Math.round(m.fps)}fps — 60fps smooth ki zaroorat nahi.`);
  return {best,blurry,lowres,lowfps,tips:t.slice(0,5),score};
}
function render(m,d){
  B.innerHTML='';
  msg('✅ <b>Clip scan done</b> (10 frames) — Hexy ke tips:<ul>'+d.tips.map(x=>'<li>'+x+'</li>').join('')+'</ul>');
  const L=H.LOOKS[d.best]; const alt=({ffdark:['darkcc','proedit'],ffbright:['hdrcc','coolteal'],ultra:[d.lowres?'q4k':'hdrcc','quality']}[d.best]||['hdrcc']).filter(k=>H.LOOKS[k]); msg(`⭐ <b>Best for this clip: ${L.n}</b><br><small style="color:#c9c3b4">${L.hint}</small><br><small style="color:#9a968c">Ya try: ${alt.map(k=>H.LOOKS[k].n).join(' · ')}</small>`,'best');
  const a=document.createElement('div'); a.className='hxa'; a.innerHTML=`<button>✅ Apply</button><button class="g">🔁 Rescan</button>`; B.appendChild(a);
  a.children[0].onclick=()=>apply(d); a.children[1].onclick=()=>run(true);
  B.scrollTop=0;
}
function apply(d){
  H.applyLook(d.best); const S=H.S;
  if(d.blurry) S.user.sharp=Math.min(1,(S.user.sharp||0)+.2);
  if(d.lowres&&S.gpuOK) S.mode='ai';
  if(H.syncUI) H.syncUI(); H.preview();
  const on=[`${{ai:'AI HD 2x',fast:'Fast Enhance 2x',max:'AI Max',off:'no'}[S.mode]} upscale`,'look grade', {ffdark:'deep blacks + clarity + vignette',ffbright:'vibrance + sky pop',ultra:'HDR tone + clarity + detail + soft bloom',hdrcc:'multi-level sharpen + HDR tone',darkcc:'deep blacks + soft glow + vignette',q4k:'crisp detail + deep glow'}[d.best], d.blurry?'sharpness++':'sharpness+', S.res+'p', S.smooth?'60fps smooth':null].filter(Boolean);
  msg('🎉 Apply ho gaya! ON: '+on.join(' · ')+'.<br>Ab bas <b>Export</b> dabao 👇 (sliders se aur tweak kar sakte ho)');
  const a=document.createElement('div'); a.className='hxa'; a.innerHTML='<button>🚀 Export pe chalo</button>'; B.appendChild(a);
  a.children[0].onclick=()=>{ close(); $('go').scrollIntoView({behavior:'smooth',block:'center'}); };
  B.scrollTop=B.scrollHeight;
}
async function run(force){
  if(!H.S.info||busy) return; if(!force&&A&&lastFile===H.S.file){ return; }
  busy=true; lastFile=H.S.file; B.innerHTML=''; msg('Clip scan kar raha hoon <span class="hxdots"><i></i><i></i><i></i></span>');
  try{ const m=await analyse(); const d=decide(m); A={m,d}; window.HXhexy=A; render(m,d); if(P.classList.contains('hidden')) btn.classList.add('new'); }
  catch(e){ B.innerHTML=''; msg('Scan nahi ho paaya 😅 ('+(e&&e.message||e)+'). Ek One-Click Look khud try karo.'); }
  busy=false;
}
function open(){ P.classList.remove('hidden','min'); place(); btn.classList.remove('new'); if(!H.S.info) greet(); else if(!A||lastFile!==H.S.file) run(); }
function close(){ P.classList.add('hidden'); }
btn.onclick=(e)=>{ e.stopPropagation(); P.classList.contains('hidden')?open():close(); }; P.querySelector('.x').onclick=close;
P.querySelector('.mn').onclick=()=>{ P.classList.toggle('min'); place(); };
document.addEventListener('pointerdown',e=>{ if(P.classList.contains('hidden')) return; if(P.contains(e.target)||btn.contains(e.target)) return; close(); },true);
window.addEventListener('hx:loaded',()=>run(true));
greet();
// keep Hexy off the Export / Download / Cancel buttons and the video centre
const keep=()=>[...new Set(['go','dl','cancel'].map(i=>$(i)).concat([...document.querySelectorAll('.btn')]))].filter(e=>e&&e.offsetParent).map(e=>e.getBoundingClientRect());
function centre(){ const c=$('stage')||document.querySelector('canvas'); if(!c||!c.offsetParent) return null; const r=c.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2; return {left:cx-r.width*.22,right:cx+r.width*.22,top:cy-r.height*.25,bottom:cy+r.height*.25}; }
const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
function dodge(){ const bh=48, vh=innerHeight; let top=vh-14-bh; const ks=keep();
  for(let pass=0;pass<3;pass++) for(const r of ks){ if(r.right<innerWidth-12-bh) continue;
    if(top<r.bottom+6&&top+bh>r.top-6){ top=r.top-bh-10; if(top<8) top=r.bottom+10; } }
  btn.style.bottom='auto'; btn.style.top=Math.round(top)+'px'; place(); }
function place(){ if(P.classList.contains('hidden')) return; P.style.maxHeight=''; const vh=innerHeight, bt=btn.getBoundingClientRect().top, w=P.offsetWidth, h=P.offsetHeight, L=innerWidth-10-w;
  const avoid=keep(); const c=centre(); if(c) avoid.push(c);
  const cands=[bt-8-h, bt+56, 10, vh-10-h, Math.round(vh*.5-h/2)].map(t=>Math.max(8,Math.min(vh-8-h,t)));
  let best=cands[0], bo=1e9; for(const t of cands){ const r={left:L,right:L+w,top:t,bottom:t+h}; let o=0; for(const a of avoid) if(hit(r,a)) o+=(Math.min(r.bottom,a.bottom)-Math.max(r.top,a.top))*(Math.min(r.right,a.right)-Math.max(r.left,a.left)); if(o<bo){bo=o;best=t;} if(!o) break; }
  if(bo&&c&&!P.classList.contains('min')){ const up=c.top-16, dn=vh-c.bottom-16; const g=Math.max(up,dn); if(g>=170){ const hh=Math.min(h,g); P.style.maxHeight=hh+'px'; best=up>=dn?c.top-8-hh:c.bottom+8; } }
  P.style.bottom='auto'; P.style.top=Math.round(best)+'px'; }
let raf=0; const q=()=>{ if(!raf) raf=requestAnimationFrame(()=>{raf=0;dodge();}); };
addEventListener('scroll',q,{passive:true}); addEventListener('resize',q); new MutationObserver(q).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']}); dodge();
window.HXbot={open,close,run,decide,analyse};
