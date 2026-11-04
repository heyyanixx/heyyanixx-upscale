// Hexy — mini editor bot. Rule-based smart suggestions, 100% on device (no API, no upload).
while(!window.HXapi) await new Promise(r=>setTimeout(r,50));
const H=window.HXapi, $=(id)=>document.getElementById(id);
const MOOD=`
.hxf{overflow:visible}
.hxf .ec,.hxf .es,.hxf .ew,.hxf .mg,.hxf .mo,.hxf .mz,.hxf .mt,.hxf .th,.hxf .zz{display:none}
.hxf .th{fill:#f5d48c}
.hxf .pu{transition:transform .35s ease}
.hxf .eL,.hxf .eR,.hxf .es path{transform-box:fill-box;transform-origin:center}
.hxf .hxbot{animation:hxfloat 3.2s ease-in-out infinite;transform-origin:32px 40px}
.hxf[data-mood=idle] .eL,.hxf[data-mood=idle] .eR{animation:hxblink 4.6s infinite}
.hxf .hxtip{animation:hxglow 1.8s ease-in-out infinite}
.hxf[data-mood=think] .pu{transform:translate(.8px,-2.7px)}
.hxf[data-mood=think] .ms{display:none}.hxf[data-mood=think] .mo,.hxf[data-mood=think] .th{display:inline}
.hxf[data-mood=think] .th circle{animation:hxdot 1.1s infinite}.hxf .th circle:nth-child(2){animation-delay:.18s}.hxf .th circle:nth-child(3){animation-delay:.36s}
.hxf[data-mood=star] .eo,.hxf[data-mood=star] .ms{display:none}.hxf[data-mood=star] .es,.hxf[data-mood=star] .mg{display:inline}
.hxf[data-mood=star] .es path{animation:hxspin 1.6s ease-in-out infinite}
.hxf[data-mood=star] .hxbot{animation:hxhop .7s ease-in-out 3}
.hxf[data-mood=wink] .eR,.hxf[data-mood=wink] .ms{display:none}.hxf[data-mood=wink] .ew,.hxf[data-mood=wink] .mt{display:inline}
.hxf[data-mood=wink] .hxarmR{animation:hxwave .5s ease-in-out 4;transform-box:fill-box;transform-origin:20% 10%}
.hxf[data-mood=sleep] .eo,.hxf[data-mood=sleep] .ms{display:none}.hxf[data-mood=sleep] .ec,.hxf[data-mood=sleep] .mz,.hxf[data-mood=sleep] .zz{display:inline}
.hxf[data-mood=sleep] .hxbot{animation:hxbreath 4.5s ease-in-out infinite}
.hxf[data-mood=sleep] .hxtip{animation:none;opacity:.3}.hxf[data-mood=sleep] .hxtipc{opacity:.45}
.hxf .zz text{animation:hxz 2.4s ease-in-out infinite}.hxf .zz .z2{animation-delay:1.2s}
@keyframes hxfloat{0%,100%{transform:translateY(1.4px)}50%{transform:translateY(-1.8px)}}
@keyframes hxbreath{0%,100%{transform:translateY(1.6px) scaleY(1)}50%{transform:translateY(1px) scaleY(1.015)}}
@keyframes hxhop{0%,100%{transform:translateY(1px)}40%{transform:translateY(-4px)}}
@keyframes hxblink{0%,91%,100%{transform:scaleY(1)}94.5%{transform:scaleY(.08)}}
@keyframes hxglow{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes hxdot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-1px)}}
@keyframes hxspin{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.12) rotate(18deg)}}
@keyframes hxwave{0%,100%{transform:rotate(0)}50%{transform:rotate(-28deg)}}
@keyframes hxz{0%{opacity:0;transform:translate(0,2px)}30%,70%{opacity:1}100%{opacity:0;transform:translate(2px,-3px)}}
@media (prefers-reduced-motion:reduce){.hxf *{animation:none!important;transition:none!important}}
`;
const ART=`<defs>
<radialGradient id="U_sh" cx="34%" cy="24%" r="85%"><stop offset="0" stop-color="#fffaf0"/><stop offset=".3" stop-color="#f7dea0"/><stop offset=".68" stop-color="#e3b65a"/><stop offset="1" stop-color="#9a6d1c"/></radialGradient>
<linearGradient id="U_ao" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#7a5310" stop-opacity="0"/><stop offset="1" stop-color="#5a3c08" stop-opacity=".55"/></linearGradient>
<linearGradient id="U_rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3cf"/><stop offset="1" stop-color="#7d5715"/></linearGradient>
<radialGradient id="U_v" cx="45%" cy="28%" r="80%"><stop offset="0" stop-color="#2c2c38"/><stop offset=".55" stop-color="#101016"/><stop offset="1" stop-color="#030305"/></radialGradient>
<radialGradient id="U_e" cx="50%" cy="38%" r="62%"><stop offset="0" stop-color="#fff6d2"/><stop offset=".35" stop-color="#f7d68e"/><stop offset=".72" stop-color="#e3b65a"/><stop offset="1" stop-color="#8a5a10"/></radialGradient>
<radialGradient id="U_b" cx="38%" cy="22%" r="85%"><stop offset="0" stop-color="#454550"/><stop offset=".5" stop-color="#18181f"/><stop offset="1" stop-color="#050507"/></radialGradient>
<radialGradient id="U_g" cx="38%" cy="28%" r="75%"><stop offset="0" stop-color="#fff2c8"/><stop offset=".55" stop-color="#e3b65a"/><stop offset="1" stop-color="#94681c"/></radialGradient>
<radialGradient id="U_t" r="50%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".35" stop-color="#f5d48c" stop-opacity=".9"/><stop offset="1" stop-color="#e3b65a" stop-opacity="0"/></radialGradient>
<radialGradient id="U_c" r="50%"><stop offset="0" stop-color="#ff8fab" stop-opacity=".95"/><stop offset="1" stop-color="#ff8fab" stop-opacity="0"/></radialGradient>
<radialGradient id="U_gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
</defs>
<ellipse cx="32" cy="61.6" rx="12.5" ry="2" fill="#000" opacity=".55"/>
<g class="hxbot">
<g class="hxarm"><ellipse cx="18.6" cy="52.4" rx="2.9" ry="4.6" transform="rotate(28 18.6 52.4)" fill="url(#U_g)"/></g>
<g class="hxarmR"><ellipse cx="45.4" cy="52.4" rx="2.9" ry="4.6" transform="rotate(-28 45.4 52.4)" fill="url(#U_g)"/></g>
<rect x="20.5" y="44" width="23" height="16.5" rx="8.2" fill="url(#U_b)" stroke="#e3b65a" stroke-width=".9"/>
<rect x="26.5" y="48.6" width="11" height="7" rx="3.5" fill="#09090d" stroke="#e3b65a" stroke-opacity=".6" stroke-width=".6"/>
<circle cx="32" cy="52.1" r="3.2" fill="url(#U_t)" class="hxcore"/><circle cx="32" cy="52.1" r="1.5" fill="#fff1c4"/>
<path d="M23.5 47.5 Q25 45.6 28 45.3" stroke="#fff" stroke-opacity=".35" stroke-width="1" stroke-linecap="round" fill="none"/>
<line x1="32" y1="10" x2="32" y2="4.6" stroke="#c9a24e" stroke-width="2" stroke-linecap="round"/>
<circle class="hxtip" cx="32" cy="4" r="5.4" fill="url(#U_t)"/><circle class="hxtipc" cx="32" cy="4" r="2.3" fill="#fff1c4"/><circle cx="31.3" cy="3.3" r=".7" fill="#fff"/>
<circle cx="6.2" cy="28" r="4.6" fill="url(#U_g)"/><circle cx="6.2" cy="28" r="2.3" fill="#121216"/><circle cx="6.2" cy="28" r=".9" fill="#f5d48c"/>
<circle cx="57.8" cy="28" r="4.6" fill="url(#U_g)"/><circle cx="57.8" cy="28" r="2.3" fill="#121216"/><circle cx="57.8" cy="28" r=".9" fill="#f5d48c"/>
<rect x="6" y="8.5" width="52" height="39" rx="19.5" fill="url(#U_sh)" stroke="url(#U_rim)" stroke-width=".8"/>
<rect x="6" y="8.5" width="52" height="39" rx="19.5" fill="url(#U_ao)"/>
<rect x="10.5" y="14.5" width="43" height="28" rx="14" fill="url(#U_v)" stroke="#000" stroke-width=".7"/>
<rect x="11.1" y="15.1" width="41.8" height="26.8" rx="13.4" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width=".6"/>
<g class="eo"><g class="eL"><ellipse cx="22.5" cy="28.6" rx="5.6" ry="7" fill="url(#U_e)"/><g class="pu"><ellipse cx="22.5" cy="29.7" rx="2.7" ry="3.7" fill="#1e1408"/><circle cx="20.5" cy="25.9" r="2.1" fill="#fff"/><circle cx="24.5" cy="32.4" r=".95" fill="#fff"/></g></g>
<g class="eR"><ellipse cx="41.5" cy="28.6" rx="5.6" ry="7" fill="url(#U_e)"/><g class="pu"><ellipse cx="41.5" cy="29.7" rx="2.7" ry="3.7" fill="#1e1408"/><circle cx="39.5" cy="25.9" r="2.1" fill="#fff"/><circle cx="43.5" cy="32.4" r=".95" fill="#fff"/></g></g></g>
<g class="ec"><path d="M17.3 28.4 Q22.5 33.4 27.7 28.4" stroke="#f5d48c" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M36.3 28.4 Q41.5 33.4 46.7 28.4" stroke="#f5d48c" stroke-width="2" stroke-linecap="round" fill="none"/></g>
<g class="es"><path d="M22.50 21.80 L24.26 26.17 L28.97 26.50 L25.35 29.53 L26.50 34.10 L22.50 31.60 L18.50 34.10 L19.65 29.53 L16.03 26.50 L20.74 26.17Z" fill="url(#U_e)" stroke="#fff3c4" stroke-width=".5" stroke-linejoin="round"/><path d="M41.50 21.80 L43.26 26.17 L47.97 26.50 L44.35 29.53 L45.50 34.10 L41.50 31.60 L37.50 34.10 L38.65 29.53 L35.03 26.50 L39.74 26.17Z" fill="url(#U_e)" stroke="#fff3c4" stroke-width=".5" stroke-linejoin="round"/><circle cx="20.8" cy="26.4" r="1.2" fill="#fff"/><circle cx="39.8" cy="26.4" r="1.2" fill="#fff"/></g>
<g class="ew"><path d="M36.4 30.6 Q41.5 24.6 46.6 30.6" stroke="#f5d48c" stroke-width="2.2" stroke-linecap="round" fill="none"/></g>
<ellipse cx="15.4" cy="37.2" rx="3.6" ry="2.3" fill="url(#U_c)"/><ellipse cx="48.6" cy="37.2" rx="3.6" ry="2.3" fill="url(#U_c)"/>
<path class="ms" d="M28.6 36.6 Q32 39.8 35.4 36.6" stroke="#f5d48c" stroke-width="1.5" stroke-linecap="round" fill="none"/>
<g class="mg"><path d="M27.6 35.6 Q32 42.4 36.4 35.6 Z" fill="#2a0c12" stroke="#f5d48c" stroke-width=".9" stroke-linejoin="round"/><ellipse cx="32" cy="38.7" rx="2.2" ry="1.2" fill="#ff7f9a"/></g>
<ellipse class="mo" cx="33.6" cy="37.3" rx="1.25" ry="1.45" fill="none" stroke="#f5d48c" stroke-width="1.1"/>
<ellipse class="mz" cx="32" cy="37.4" rx="1.6" ry="1" fill="#f5d48c" opacity=".7"/>
<g class="mt"><path d="M28.2 36.2 Q32 40.2 35.8 36.2" stroke="#f5d48c" stroke-width="1.5" stroke-linecap="round" fill="none"/><ellipse cx="33.4" cy="38.6" rx="1.35" ry="1.1" fill="#ff7f9a"/></g>
<ellipse cx="19" cy="13.2" rx="7" ry="2.6" transform="rotate(-14 19 13.2)" fill="url(#U_gl)"/>
<path d="M12.6 16.2 Q17.6 11.2 25.6 10.9" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".9"/>
<path d="M15.2 20.2 Q17.4 17.5 21.2 17" stroke="#fff" stroke-opacity=".22" stroke-width="1.2" stroke-linecap="round" fill="none"/>
<g class="th"><circle cx="50.5" cy="7" r="1.5"/><circle cx="55" cy="5.2" r="1.7"/><circle cx="60" cy="3.2" r="1.9"/></g>
<g class="zz" font-family="system-ui,Arial,sans-serif" font-weight="900" fill="#dbe7ff" stroke="#060608" stroke-width=".6" paint-order="stroke"><text class="z1" x="47" y="11" font-size="9">z</text><text class="z2" x="53" y="4.5" font-size="12">z</text></g>
</g>`;
let _u=0, mood='idle'; const face=()=>`<svg class="hxf" data-mood="${mood}" viewBox="0 0 64 64" aria-hidden="true">${ART.replace(/U_/g,'hx'+(++_u)+'_')}</svg>`;
const css=`
body{padding-bottom:64px}
#hxBtn{position:fixed;right:12px;bottom:14px;z-index:50;width:48px;height:48px;border-radius:50%;border:1.5px solid #e3b65a88;background:radial-gradient(circle at 50% 35%,#1d1a12,#060608 70%);padding:0;cursor:pointer;box-shadow:0 5px 16px #000b,0 0 12px #e3b65a33;overflow:visible}
#hxBtn svg{width:100%;height:100%;display:block;overflow:visible}#hxBtn:active{transform:scale(.92)}
#hxBtn .dot{position:absolute;top:-1px;right:-1px;width:11px;height:11px;border-radius:50%;background:#ff4d6d;border:2px solid #060608;display:none}
#hxBtn.new .dot{display:block}
#hxBtn .nm{position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);font:800 9px/1 system-ui,sans-serif;color:#060608;background:#e3b65a;border-radius:99px;padding:2px 5px}
`+MOOD+`
#hxP{position:fixed;right:10px;bottom:72px;z-index:51;width:min(250px,calc(100vw - 20px));max-height:40vh;display:flex;flex-direction:column;background:rgba(16,15,22,.58);-webkit-backdrop-filter:blur(14px) saturate(140%);backdrop-filter:blur(14px) saturate(140%);border:1px solid rgba(227,182,90,.55);border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.09);overflow:hidden}
#hxP.hidden,#hxP.hold{display:none}
#hxP.min{max-height:none}#hxP.min .bd,#hxP.min .hxs{display:none}
#hxP .hd{display:flex;align-items:center;gap:6px;padding:4px 4px 4px 7px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(135deg,rgba(227,182,90,.16),rgba(0,0,0,0))}
#hxP .hd svg{width:30px;height:30px;flex:0 0 30px;overflow:visible}#hxP .hd b{color:#f5d48c;font-size:13px}#hxP .hd small{display:block;color:#b3ad9f;font-size:10px;line-height:1.2}
#hxP .hb{margin-left:auto;display:flex}#hxP .hb button{background:none;border:0;color:#cfc9ba;font-size:18px;line-height:1;cursor:pointer;padding:5px 7px;border-radius:8px}#hxP .hb button:active{background:#ffffff14}
#hxP .bd{padding:7px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;overscroll-behavior:contain}
.hxm{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:12px 12px 12px 4px;padding:5px 8px;font-size:12px;line-height:1.35;color:#f3f0e8;max-width:97%;animation:hxin .28s ease-out}
.hxm.best{border-color:rgba(227,182,90,.6);background:rgba(227,182,90,.12)}.hxm.best b{color:#f5d48c}
.hxm ul{margin:2px 0 0;padding-left:14px}.hxm li{margin:1px 0}
.hxa{display:flex;gap:5px;flex-wrap:wrap}.hxa button{flex:1;min-height:32px;border-radius:10px;border:0;background:#e3b65a;color:#0a0804;font:800 12px system-ui,sans-serif;cursor:pointer;padding:0 7px}
.hxa button.g{background:rgba(255,255,255,.08);color:#f3f0e8;border:1px solid rgba(255,255,255,.12)}
.hxs{font-size:9.5px;color:#8f8a7e;text-align:center;padding:0 6px 5px}
.hxdots{display:inline-flex;gap:3px}.hxdots i{width:4px;height:4px;border-radius:50%;background:#e3b65a;animation:hxb 1s infinite}.hxdots i:nth-child(2){animation-delay:.15s}.hxdots i:nth-child(3){animation-delay:.3s}
.hxpt{position:fixed;z-index:60;pointer-events:none;font-size:14px;line-height:1;color:#f5d48c;text-shadow:0 0 6px rgba(227,182,90,.8);animation:hxpop var(--t,1.2s) ease-out forwards}
@keyframes hxpop{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}18%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(var(--r))}}
@keyframes hxin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes hxb{0%,100%{opacity:.25}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.hxm,.hxdots i{animation:none}.hxpt{display:none}}`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
const btn=document.createElement('button'); btn.id='hxBtn'; btn.setAttribute('aria-label','Hexy editor bot'); btn.innerHTML=face()+'<span class="dot"></span><span class="nm">Hexy</span>';
const P=document.createElement('div'); P.id='hxP'; P.className='hidden';
P.innerHTML=`<div class="hd">${face()}<div><b>Hexy ✨</b><small class="hxst">smart tips · ready 😊</small></div><div class="hb"><button class="mn" aria-label="minimize">–</button><button class="x" aria-label="close">×</button></div></div><div class="bd" id="hxB"></div><div class="hxs">Smart suggestions · clip device pe hi rehti 🔒</div>`;
document.body.append(btn,P);
const B=P.querySelector('#hxB');
let A=null, busy=false, lastFile=null;

const msg=(html,cls='')=>{ const d=document.createElement('div'); d.className='hxm '+cls; d.innerHTML=html; B.appendChild(d); return d; };
function greet(){ B.innerHTML=''; msg('Heyy! 👋 Main <b>Hexy</b> 🤖✨ tera mini editor dost');
  msg('Clip daalo 📁 — scan karke best look bataunga 😄');
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
  const t=[], gm=gpu?'AI HD 2x':'Fast 2x';
  t.push(lowres?`📐 ${short}p low-res → <b>${gm}</b> upscale + 1080p`:`📐 ${m.w}×${m.h} 👍 ${gm} + <b>1080p</b>`);
  t.push(dark?`🌑 Dark clip (${Math.round(m.bright*100)}%) — moody look perfect`:`☀️ Bright clip (${Math.round(m.bright*100)}%) — HDR pop 🔥`);
  if(m.red>m.blue*1.2&&m.rb>0) t.push(`🔴 Red zyada (${Math.round(m.red*100)}%) — clean grade, no red tint`);
  else if(m.blue>m.red) t.push(`🔵 Blue/sky zyada — vibrance + sky pop 💙`);
  if(m.contrast<.17) t.push('🌫️ Contrast flat — look badhayega');
  else if(m.sat<.22) t.push('🎨 Colours faded — vibrance up');
  t.push(blurry?'🔍 Thoda soft — <b>sharpness up</b>':'🔍 Detail sahi 👍 halka sharpen');
  t.push(lowfps?`🎞️ ${Math.round(m.fps)}fps → <b>60fps smooth ON</b>`:`🎞️ ${Math.round(m.fps)}fps — smooth ki zaroorat nahi`);
  return {best,blurry,lowres,lowfps,tips:t.slice(0,5),score};
}
function render(m,d){
  B.innerHTML='';
  const L=H.LOOKS[d.best]; const alt=({ffdark:['darkcc','proedit'],ffbright:['hdrcc','coolteal'],ultra:[d.lowres?'q4k':'hdrcc','quality']}[d.best]||['hdrcc']).filter(k=>H.LOOKS[k]);
  msg(`🤩 <b>Best for this clip: ${L.n}</b><br><small style="color:#c9c3b4">${L.hint}</small><br><small style="color:#9a968c">Ya try: ${alt.map(k=>H.LOOKS[k].n).join(' · ')}</small><br><small style="color:#c9c3b4">Sirf suggestion 🙂 Tour me har setting dikhaunga — tum khud badlo, ya ⚡ Auto set all tap karo</small>`,'best');
  const a=document.createElement('div'); a.className='hxa'; a.innerHTML=`<button>🧭 Settings sahi karo</button><button class="g">⚡ Auto set all</button><button class="g" style="flex:0 0 38px" aria-label="rescan">🔁</button>`; B.appendChild(a);
  a.children[0].onclick=()=>tour(d); a.children[1].onclick=()=>autoAll(d,true); a.children[2].onclick=()=>run(true);
  msg('💡 <b>Tips</b><ul>'+d.tips.map(x=>'<li>'+x+'</li>').join('')+'</ul>');
  setMood('star',4200); burst('star');
  B.scrollTop=0;
}
async function run(force){
  if(!H.S.info||busy) return; if(!force&&A&&lastFile===H.S.file){ return; }
  busy=true; lastFile=H.S.file; B.innerHTML=''; setMood('think'); msg('🤔 Clip scan kar raha hoon <span class="hxdots"><i></i><i></i><i></i></span>');
  try{ const m=await analyse(); const d=decide(m); A={m,d}; window.HXhexy=A; render(m,d); if(P.classList.contains('hidden')) btn.classList.add('new'); }
  catch(e){ B.innerHTML=''; setMood('idle'); msg('😅 Scan nahi ho paaya ('+(e&&e.message||e)+'). Ek One-Click Look try karo.'); }
  busy=false;
}
function open(){ P.classList.remove('hidden','min'); autoMin=false; wake(); dock(); btn.classList.remove('new'); if(!H.S.info) greet(); else if(!A||lastFile!==H.S.file) run(); }
function close(){ P.classList.add('hidden'); }
btn.onclick=(e)=>{ e.stopPropagation(); P.classList.contains('hidden')?open():close(); }; P.querySelector('.x').onclick=close;
P.querySelector('.mn').onclick=()=>{ if(autoMin){ dock(); return; } P.classList.toggle('min'); place(); };
document.addEventListener('pointerdown',e=>{ if(P.classList.contains('hidden')) return; if(P.contains(e.target)||btn.contains(e.target)) return; close(); },true);
window.addEventListener('hx:loaded',()=>run(true));
greet();
// keep Hexy off the Export / Download / Cancel buttons; the panel never covers the video preview
const keep=()=>[...new Set(['go','dl','cancel'].map(i=>$(i)).concat([...document.querySelectorAll('.btn')]))].filter(e=>e&&e.offsetParent).map(e=>e.getBoundingClientRect());
const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
function dodge(){ const bh=48, vh=innerHeight; let top=vh-14-bh; const ks=keep();
  for(let pass=0;pass<3;pass++) for(const r of ks){ if(r.right<innerWidth-12-bh) continue;
    if(top<r.bottom+6&&top+bh>r.top-6){ top=r.top-bh-10; if(top<8) top=r.bottom+10; } }
  btn.style.bottom='auto'; btn.style.top=Math.round(top)+'px'; place(); }
// blocked strips in the panel's column: video preview(s), Export/Download/Cancel, Hexy's own button
function blocks(L,R){ const out=[]; for(const id of ['stage','outv','go','dl','cancel','hxBtn']){ const e=$(id); if(!e||!e.offsetParent&&id!=='hxBtn') continue; const r=e.getBoundingClientRect(); if(r.height&&r.right>L-4&&r.left<R+4) out.push([r.top-6,r.bottom+6]); } return out.sort((a,b)=>a[0]-b[0]); }
function gaps(L,R){ const vh=innerHeight; let y=8; const g=[]; for(const [t,b] of blocks(L,R)){ if(t>y) g.push([y,Math.min(t,vh-8)]); y=Math.max(y,b); } if(vh-8>y) g.push([y,vh-8]); return g.filter(x=>x[1]-x[0]>0); }
let autoMin=false;
function natural(){ const m=P.classList.contains('min'); if(autoMin) P.classList.remove('min'); P.style.maxHeight=Math.round(innerHeight*.4)+'px'; const h=P.offsetHeight; if(autoMin) P.classList.add('min'); return h; }
function place(){ if(P.classList.contains('hidden')) return; P.classList.remove('hold'); const w=P.offsetWidth||250, L=innerWidth-10-w, R=L+w;
  const userMin=P.classList.contains('min')&&!autoMin; const h0=userMin?P.offsetHeight:natural(); const need=userMin?h0:Math.min(h0,150);
  const gs=gaps(L,R).sort((a,b)=>b[1]-a[1]); // lowest gap first → docked low
  let g=gs.find(x=>x[1]-x[0]>=need+4);
  if(g&&!userMin){ if(autoMin){ autoMin=false; P.classList.remove('min'); } const h=Math.min(h0,g[1]-g[0]-4); P.style.maxHeight=h+'px'; P.style.bottom='auto'; P.style.top=Math.round(g[1]-h)+'px'; return true; }
  if(g&&userMin){ P.style.bottom='auto'; P.style.top=Math.round(g[1]-h0)+'px'; return true; }
  // no room for the chat → shrink to its header strip; if even that has no room, step aside
  if(!userMin){ autoMin=true; P.classList.add('min'); }
  const hh=P.offsetHeight; g=gs.find(x=>x[1]-x[0]>=hh+2);
  if(g){ P.style.bottom='auto'; P.style.top=Math.round(g[1]-hh)+'px'; } else P.classList.add('hold');
  return false; }
// on open: if the preview leaves no room, scroll a little so the chat docks just below it
function dock(){ if(place()) return; const s=$('stage'); if(!s||!s.offsetParent) return; const r=s.getBoundingClientRect(), vh=innerHeight;
  const want=vh-62-Math.min(220,Math.round(vh*.4))-10; const dy=Math.max(r.bottom-want, r.top-8>0?0:r.top-8);
  autoMin=false; P.classList.remove('min');
  if(Math.abs(dy)>2){ scrollBy({top:dy,behavior:'instant'}); } requestAnimationFrame(()=>place()); }
// ---- emotions: idle 😊 · think 🤔 · star 🤩 · wink 😉 · sleep 😴
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const STATUS={idle:'smart tips · ready 😊',think:'scan kar raha… 🤔',star:'mil gaya! 🤩',wink:'applied 😉',sleep:'so raha hoon… 😴 tap karo'};
let moodT=0, lastAct=Date.now();
function setMood(m,ms){ clearTimeout(moodT); mood=m; document.querySelectorAll('#hxBtn .hxf,#hxP .hxf,#hxFly .hxf').forEach(s=>s.setAttribute('data-mood',m)); const st=P.querySelector('.hxst'); if(st) st.textContent=STATUS[m]||''; btn.setAttribute('aria-label','Hexy editor bot — '+(STATUS[m]||m)); if(ms) moodT=setTimeout(()=>{ if(mood===m) setMood(busy?'think':'idle'); },ms); }
function burst(kind){ if(RM.matches) return; const src=[btn]; const av=P.querySelector('.hd svg'); if(!P.classList.contains('hidden')&&av) src.push(av);
  const set=kind==='heart'?['💛','💖','💛','❤️','💕','💛']:['✨','✦','⭐','✦','✨','✦','🌟','✦'];
  for(const el of src){ const r=el.getBoundingClientRect(); if(!r.width) continue; const cx=r.left+r.width/2, cy=r.top+r.height/2;
    set.forEach((ch,i)=>{ const s=document.createElement('span'); s.className='hxpt'; s.textContent=ch; let dx,dy;
      if(kind==='heart'){ dx=(Math.random()*2-1)*26; dy=-(34+Math.random()*34); } else { const a=i/set.length*Math.PI*2+Math.random()*.4; const d=24+Math.random()*16; dx=Math.cos(a)*d; dy=Math.sin(a)*d; }
      s.style.cssText=`left:${cx}px;top:${cy}px;--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px;--r:${Math.round((Math.random()*2-1)*40)}deg;--t:${(1+Math.random()*.5).toFixed(2)}s;font-size:${(kind==='heart'?11:10)+Math.random()*6}px;animation-delay:${(i*40)}ms`;
      document.body.appendChild(s); setTimeout(()=>s.remove(),1900); }); } }
function wake(){ lastAct=Date.now(); if(mood==='sleep') setMood('idle'); }
['pointerdown','keydown','touchstart','wheel'].forEach(ev=>addEventListener(ev,wake,{passive:true,capture:true}));
setInterval(()=>{ if(mood==='idle'&&!busy&&!document.hidden&&Date.now()-lastAct>30000) setMood('sleep'); },2000);
let raf=0; const q=()=>{ if(!raf) raf=requestAnimationFrame(()=>{raf=0;dodge();}); };
addEventListener('scroll',()=>{ lastAct=Date.now(); if(mood==='sleep') setMood('idle'); q(); },{passive:true}); addEventListener('resize',q); new MutationObserver(q).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']}); dodge();

// ---- Guide tour: mini Hexy flies to each setting and SUGGESTS the value. It never changes anything — the user does.
const tcss=document.createElement('style'); tcss.textContent=`
#hxFly{position:fixed;z-index:62;width:40px;height:40px;pointer-events:none;transition:left .6s cubic-bezier(.5,1.5,.5,1),top .6s cubic-bezier(.5,1.5,.5,1);filter:drop-shadow(0 4px 8px #000a)}
#hxFly svg{width:100%;height:100%;overflow:visible}
#hxTip{position:fixed;z-index:61;width:min(236px,calc(100vw - 24px));background:rgba(16,15,22,.62);-webkit-backdrop-filter:blur(14px) saturate(140%);backdrop-filter:blur(14px) saturate(140%);border:1px solid rgba(227,182,90,.6);border-radius:16px;padding:8px 9px 8px 12px;color:#f3f0e8;font:12px/1.38 system-ui,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.55);transition:left .45s ease,top .45s ease}
#hxTip .k{font-size:10px;color:#b3ad9f;display:flex;justify-content:space-between;align-items:center;margin-bottom:2px}#hxTip .k button{background:none;border:0;color:#cfc9ba;font-size:16px;line-height:1;padding:0 2px;cursor:pointer}
#hxTip .v{font-weight:800;color:#f5d48c;font-size:13.5px}#hxTip .w{color:#d9d4c7}#hxTip .ok{color:#9be59b;font-weight:700;display:none}#hxTip.good .ok:not(.al),#hxTip.pre .ok.al{display:block}#hxTip .r{gap:6px}#hxTip .r button.g2{background:rgba(255,255,255,.1);color:#f3f0e8;border:1px solid rgba(227,182,90,.5)}
#hxTip .r{display:flex;justify-content:flex-end;margin-top:6px}#hxTip .r button{min-height:30px;border-radius:10px;border:0;background:#e3b65a;color:#0a0804;font:800 12px system-ui,sans-serif;padding:0 12px;cursor:pointer}
.hxring{position:relative;outline:2px solid #e3b65a!important;outline-offset:3px;border-radius:12px;box-shadow:0 0 0 6px rgba(227,182,90,.18),0 0 22px rgba(227,182,90,.55)!important;animation:hxring 1.4s ease-in-out infinite}
@keyframes hxring{0%,100%{box-shadow:0 0 0 4px rgba(227,182,90,.14),0 0 14px rgba(227,182,90,.4)}50%{box-shadow:0 0 0 8px rgba(227,182,90,.22),0 0 26px rgba(227,182,90,.7)}}
@media (prefers-reduced-motion:reduce){#hxFly,#hxTip{transition:none}.hxring{animation:none}}`; document.head.appendChild(tcss);
const lbl=(host,pre)=>[...document.querySelectorAll('#'+host+' label.sl')].find(l=>l.textContent.trim().startsWith(pre));
function steps(d){ const S=H.S, m=A&&A.m||{}, gpu=S.gpuOK, L=H.LOOKS[d.best]||{n:d.best};
  const mode=gpu?'ai':'fast', it=m.contrast<.17?115:m.sat<.22?110:m.bright>.55?90:100, sh=d.blurry?20:0, gl=m.bright<.36?15:0, fps=Math.round(m.fps||30);
  return [
   {el:()=>document.querySelector(`#modes .opt[data-m="${mode}"]`), t:'Upscale mode', v:gpu?'🤖 AI HD 2x':'⚡ Fast Enhance', w:d.lowres?`Clip ${Math.min(m.w,m.h)}p hai — upscale zaroori`:(gpu?'GPU hai — AI se best detail':'Is phone pe sabse fast + clean'), ok:()=>S.mode===mode, set:()=>{S.mode=mode}},
   {el:()=>document.querySelector(`.look[data-k="${d.best}"]`), t:'Look', v:L.n, w:'Is clip pe best — button khud tap karo', ok:()=>S.look===d.best, set:()=>{ if(S.look!==d.best) H.applyLook(d.best); }},
   {el:()=>$('intensity').closest('label'), t:'Intensity', v:it+'%', w:it>100?'Clip flat/faded hai — thoda zyada':it<100?'Clip already bright — thoda kam':'Perfect balance', ok:()=>Math.abs(S.intensity*100-it)<=5, set:()=>{S.intensity=it/100}},
   {el:()=>lbl('fine','🔪'), t:'Sharpness', v:sh?'+'+sh:'0 (as is)', w:sh?'Clip thoda soft hai':'Look me sharpen already hai — zyada = grain', ok:()=>Math.abs((S.user.sharp||0)*100-sh)<=5, set:()=>{S.user.sharp=sh/100}},
   {el:()=>lbl('fx','✨'), t:'Glow', v:gl?'+'+gl:'0 (as is)', w:gl?'Dark clip — highlights pe halka glow':'Bright clip — extra glow mat do', ok:()=>Math.abs((S.user.bloom||0)*100-gl)<=5, set:()=>{S.user.bloom=gl/100}},
   {el:()=>$('smooth').closest('.toggle'), t:'60fps smooth', v:d.lowfps?'ON':'OFF', w:`Clip ${fps}fps hai`+(d.lowfps?' → 60fps smoother':' — zaroorat nahi'), ok:()=>S.smooth===d.lowfps, set:()=>{ const c=$('smooth'); S.smooth=!!d.lowfps&&!(c&&c.disabled); if(c) c.checked=S.smooth; }},
   {el:()=>$('res'), t:'Export resolution', v:'1080p', w:'Insta/YT Shorts ke liye best', ok:()=>S.res===1080, set:()=>{S.res=1080}},
   {el:()=>$('go'), t:'Last step', v:'Sab set! Export karo 🎬', w:'Upar wali settings check karke Export dabao', ok:()=>false, end:true}]; }

// ⚡ Auto set all — the ONLY thing that changes settings, and only when the user taps it
function autoAll(d,fromPanel){ const S=H.S, L=steps(d); const look=L.find(s=>s.t==='Look'); look&&look.set(); for(const s of L) if(s.set&&s!==look) s.set();
  if(H.syncUI) H.syncUI(); H.preview(); setMood('wink',3600); burst('heart');
  const SL={'Upscale mode':'','Look':'','Intensity':'Intensity ','Sharpness':'Sharp ','Glow':'Glow ','60fps smooth':'60fps ','Export resolution':''}; const on=L.filter(s=>!s.end).map(s=>(SL[s.t]||'')+s.v.replace(/ \(as is\)/,'').replace(/^\S+ (?=[A-Z])/,'')).join(' · ');
  if(TS){ TS.tip.className='good'; TS.tip.querySelector('.v').textContent='⚡ Sab set! Ab Export karo 🎬'; TS.tip.querySelector('.w').textContent=on; const a=TS.tip.querySelector('[data-a=all]'); if(a) a.remove(); TS.tip.querySelector('.ok').textContent='✅ Done 😉'; pos(); return; }
  msg('😉 <b>Sab set!</b> '+on+'<br>Ab <b>Export</b> dabao 👇 💛');
  const a=document.createElement('div'); a.className='hxa'; a.innerHTML='<button>🚀 Export pe chalo</button>'; B.appendChild(a);
  a.children[0].onclick=()=>{ close(); $('go').scrollIntoView({behavior:RM.matches?'auto':'smooth',block:'center'}); }; B.scrollTop=B.scrollHeight; }
let TS=null;
function tour(d){ close(); endTour(); const fly=document.createElement('div'); fly.id='hxFly'; fly.innerHTML=face(); const tip=document.createElement('div'); tip.id='hxTip';
  const b=btn.getBoundingClientRect(); fly.style.left=b.left+'px'; fly.style.top=b.top+'px'; document.body.append(fly,tip);
  TS={d,list:steps(d),i:-1,fly,tip,el:null,good:false}; tip.onclick=e=>{ const k=e.target.closest('button'); if(!k) return; if(k.dataset.a==='x') endTour(); else if(k.dataset.a==='all'){ autoAll(TS.d,false); } else go(TS.i+1); };
  addEventListener('input',check,true); addEventListener('click',check,true); addEventListener('change',check,true); go(0); }
function endTour(){ if(!TS) return; TS.el&&TS.el.classList.remove('hxring'); TS.fly.remove(); TS.tip.remove(); removeEventListener('input',check,true); removeEventListener('click',check,true); removeEventListener('change',check,true); TS=null; if(mood!=='sleep') setMood('idle'); }
function go(i){ if(!TS) return; if(i>=TS.list.length){ endTour(); return; } const s=TS.list[i]; let el=s.el(); if(!el){ go(i+1); return; }
  TS.el&&TS.el.classList.remove('hxring'); TS.i=i; TS.el=el; TS.good=false; const dt=el.closest('details'); if(dt) dt.open=true;
  el.classList.add('hxring'); el.scrollIntoView({block:'center',behavior:RM.matches?'auto':'smooth'});
  TS.tip.className=''; TS.tip.innerHTML=`<div class="k"><span>🧭 Hexy tip ${i+1}/${TS.list.length} · ${s.t}</span><button data-a="x" aria-label="close tour">×</button></div><div class="v">${s.end?'':'👉 '}${s.v}</div><div class="w">${s.w}</div><div class="ok">✅ Perfect! Tumne set kar diya 😉</div><div class="ok al">✅ Already sahi hai 👍</div><div class="r">${s.end?'<button data-a="all" class="g2">⚡ Auto set all</button>':''}<button>${s.end?'Done 🎬':'Next ➜'}</button></div>`;
  TS.pre=!s.end&&!!s.ok(); if(TS.pre) TS.tip.classList.add('pre');
  setMood(s.end?'star':'think'); if(s.end) burst('star'); setTimeout(()=>{ pos(); check(); },RM.matches?0:420); pos(); }
function pos(){ if(!TS||!TS.el) return; const r=TS.el.getBoundingClientRect(), vh=innerHeight, w=TS.tip.offsetWidth, h=TS.tip.offsetHeight;
  let top=r.bottom+12; if(top+h>vh-70) top=r.top-12-h; top=Math.max(8,Math.min(vh-8-h,top)); const left=Math.max(12,Math.min(innerWidth-12-w,r.left+Math.min(40,r.width/4)));
  TS.tip.style.left=left+'px'; TS.tip.style.top=top+'px'; TS.fly.style.left=(left-14)+'px'; TS.fly.style.top=(top-26)+'px'; }
function check(){ if(!TS) return; setTimeout(()=>{ if(!TS) return; const s=TS.list[TS.i]; if(!s||s.end) return; const g=!!s.ok(); if(TS.pre){ if(g) return; TS.pre=false; TS.tip.classList.remove('pre'); } if(g&&!TS.good){ TS.tip.classList.add('good'); setMood('wink',2600); burst('heart'); } if(!g) TS.tip.classList.remove('good'); TS.good=g; pos(); },60); }
let tq=0; addEventListener('scroll',()=>{ if(TS&&!tq) tq=requestAnimationFrame(()=>{tq=0;pos();}); },{passive:true}); addEventListener('resize',()=>TS&&pos());
// tapping the suggested look yourself (outside the tour) → wink + hearts
document.addEventListener('click',e=>{ if(TS||!A) return; const b=e.target.closest('.look'); if(b&&b.dataset.k===A.d.best) setTimeout(()=>{ setMood('wink',3200); burst('heart'); },50); },true);
window.HXbot={open,close,run,decide,analyse,setMood,burst,face,tour,endTour,autoAll,get tourStep(){return TS&&{i:TS.i,good:TS.good,v:TS.list[TS.i].v}},get mood(){return mood},MOODS:['idle','think','star','wink','sleep']};
