// Hexy — mini editor bot. Rule-based smart suggestions, 100% on device (no API, no upload).
while(!window.HXapi) await new Promise(r=>setTimeout(r,50));
const H=window.HXapi, $=(id)=>document.getElementById(id);
const css=`
body{padding-bottom:76px}
#hxBtn{position:fixed;right:14px;bottom:16px;z-index:50;width:58px;height:58px;border-radius:50%;border:2px solid #e3b65a;background:#060608;padding:0;cursor:pointer;box-shadow:0 6px 22px #000a,0 0 0 4px #e3b65a22}
#hxBtn svg{width:100%;height:100%;display:block}#hxBtn:active{transform:scale(.94)}
#hxBtn .dot{position:absolute;top:1px;right:1px;width:14px;height:14px;border-radius:50%;background:#ff3b3b;border:2px solid #060608;display:none}
#hxBtn.new .dot{display:block}
#hxBtn .nm{position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);font:800 10px/1 system-ui,sans-serif;color:#060608;background:#e3b65a;border-radius:99px;padding:2px 6px;letter-spacing:.3px}
#hxP{position:fixed;right:10px;bottom:84px;z-index:51;width:min(360px,calc(100vw - 20px));max-height:min(78vh,660px);display:flex;flex-direction:column;background:#0d0d11;border:1.5px solid #e3b65a;border-radius:18px;box-shadow:0 16px 50px #000d;overflow:hidden}
#hxP.hidden{display:none}
#hxP .hd{display:flex;align-items:center;gap:10px;padding:10px 12px;background:linear-gradient(135deg,#2a2112,#0d0d11);border-bottom:1px solid #2a2618}
#hxP .hd svg{width:36px;height:36px;flex:0 0 36px}#hxP .hd b{color:#e3b65a;font-size:15px}#hxP .hd small{display:block;color:#9a968c;font-size:11.5px}
#hxP .x{margin-left:auto;background:none;border:0;color:#9a968c;font-size:22px;cursor:pointer;padding:4px 8px}
#hxP .bd{padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}
.hxm{background:#18181f;border:1px solid #26262e;border-radius:14px 14px 14px 4px;padding:8px 10px;font-size:13.5px;line-height:1.4;color:#f3f0e8;max-width:94%}
.hxm.best{border-color:#e3b65a;background:#1d1a10}.hxm.best b{color:#f5d48c}
.hxm ul{margin:4px 0 0;padding-left:18px}.hxm li{margin:3px 0}
.hxa{display:flex;gap:8px;flex-wrap:wrap}.hxa button{flex:1;min-height:46px;border-radius:12px;border:0;background:#e3b65a;color:#0a0804;font:800 15px system-ui,sans-serif;cursor:pointer}
.hxa button.g{background:#1b1b22;color:#f3f0e8;border:1px solid #2c2c35}
.hxs{font-size:11.5px;color:#9a968c;text-align:center;padding:2px 0 0}
.hxdots{display:inline-flex;gap:4px}.hxdots i{width:6px;height:6px;border-radius:50%;background:#e3b65a;animation:hxb 1s infinite}.hxdots i:nth-child(2){animation-delay:.15s}.hxdots i:nth-child(3){animation-delay:.3s}
@keyframes hxb{0%,100%{opacity:.25}50%{opacity:1}}`;
const face=`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="25" fill="#060608" stroke="#e3b65a" stroke-width="3"/><line x1="32" y1="9" x2="32" y2="3" stroke="#e3b65a" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="3.5" r="3" fill="#f5d48c"/><ellipse cx="23" cy="32" rx="5" ry="6.5" fill="#e3b65a"/><ellipse cx="41" cy="32" rx="5" ry="6.5" fill="#e3b65a"/><circle cx="24.6" cy="29.5" r="1.8" fill="#060608"/><circle cx="42.6" cy="29.5" r="1.8" fill="#060608"/><path d="M24 43 Q32 50 40 43" fill="none" stroke="#e3b65a" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="41" r="3" fill="#e3b65a" opacity=".35"/><circle cx="48" cy="41" r="3" fill="#e3b65a" opacity=".35"/></svg>`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
const btn=document.createElement('button'); btn.id='hxBtn'; btn.setAttribute('aria-label','Hexy editor bot'); btn.innerHTML=face+'<span class="dot"></span><span class="nm">Hexy</span>';
const P=document.createElement('div'); P.id='hxP'; P.className='hidden';
P.innerHTML=`<div class="hd">${face}<div><b>Hexy 🤖</b><small>Mini editor bot · smart suggestions</small></div><button class="x" aria-label="close">×</button></div><div class="bd" id="hxB"></div><div class="hxs" style="padding:0 0 8px">Rule-based smart suggestions · clip tere phone se bahar nahi jaati 🔒</div>`;
document.body.append(btn,P);
const B=P.querySelector('#hxB');
let A=null, busy=false, lastFile=null;

const msg=(html,cls='')=>{ const d=document.createElement('div'); d.className='hxm '+cls; d.innerHTML=html; B.appendChild(d); return d; };
function greet(){ B.innerHTML=''; msg('Hi! Main <b>Hexy</b> hoon 👋 tera mini editor bot.');
  msg('Pehle upar <b>clip upload karo</b> 📁 — main use scan karke batata hoon kaunsa look, upscale aur setting best rahegi.');
  const a=document.createElement('div'); a.className='hxa'; a.innerHTML='<button>📁 Clip upload karo</button><button class="g">📘 Guide</button>'; B.appendChild(a);
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
  const L=H.LOOKS[d.best]; const alt={ffdark:'proedit',ffbright:'coolteal',ultra:'quality'}[d.best]; msg(`⭐ <b>Best for this clip: ${L.n}</b><br><small style="color:#c9c3b4">${L.hint}</small><br><small style="color:#9a968c">Ya try: ${H.LOOKS[alt].n}</small>`,'best');
  const a=document.createElement('div'); a.className='hxa'; a.innerHTML=`<button>✅ Apply</button><button class="g">🔁 Rescan</button>`; B.appendChild(a);
  a.children[0].onclick=()=>apply(d); a.children[1].onclick=()=>run(true);
  B.scrollTop=0;
}
function apply(d){
  H.applyLook(d.best); const S=H.S;
  if(d.blurry) S.user.sharp=Math.min(1,(S.user.sharp||0)+.2);
  if(d.lowres&&S.gpuOK) S.mode='ai';
  if(H.syncUI) H.syncUI(); H.preview();
  const on=[`${{ai:'AI HD 2x',fast:'Fast Enhance 2x',max:'AI Max',off:'no'}[S.mode]} upscale`,'look grade', {ffdark:'deep blacks + clarity + vignette',ffbright:'vibrance + sky pop',ultra:'HDR tone + clarity + detail + soft bloom'}[d.best], d.blurry?'sharpness++':'sharpness+', S.res+'p', S.smooth?'60fps smooth':null].filter(Boolean);
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
function open(){ P.classList.remove('hidden'); btn.classList.remove('new'); if(!H.S.info) greet(); else if(!A||lastFile!==H.S.file) run(); }
function close(){ P.classList.add('hidden'); }
btn.onclick=()=>P.classList.contains('hidden')?open():close(); P.querySelector('.x').onclick=close;
window.addEventListener('hx:loaded',()=>run(true));
greet();
// keep Hexy off the Export / Download / Cancel buttons
function dodge(){ const els=[...new Set(['go','dl','cancel'].map(i=>$(i)).concat([...document.querySelectorAll('.btn')]))]; const bh=58, vh=innerHeight; let top=vh-16-bh;
  for(let pass=0;pass<3;pass++) for(const e of els){ if(!e||!e.offsetParent) continue; const r=e.getBoundingClientRect(); if(r.right<innerWidth-14-bh) continue;
    if(top<r.bottom+6&&top+bh>r.top-6){ top=r.top-bh-10; if(top<8) top=r.bottom+10; } }
  btn.style.bottom='auto'; btn.style.top=Math.round(top)+'px'; P.style.bottom=(top>vh*.55?Math.max(10,vh-top+10):84)+'px'; }
let raf=0; const q=()=>{ if(!raf) raf=requestAnimationFrame(()=>{raf=0;dodge();}); };
addEventListener('scroll',q,{passive:true}); addEventListener('resize',q); new MutationObserver(q).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']}); dodge();
window.HXbot={open,close,run,decide,analyse};
