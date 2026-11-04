// HEYYANIXX Upscale — desktop / PC power features. Mobile layout is untouched (everything visual here is ≥1024px only).
while(!window.HXapi) await new Promise(r=>setTimeout(r,50));
const H=window.HXapi, S=H.S, $=(id)=>document.getElementById(id), vid=H.vid;
const DESK=matchMedia('(min-width:1024px)'), FINE=matchMedia('(hover:hover) and (pointer:fine)');

// ---- layout: on desktop the Export card lives under the preview (always visible); on phones it stays as step 4
const exp=$('expCard'), ctrl=$('ctrl'), left=document.querySelector('.grid2>.sticky');
function place(){ if(DESK.matches){ if(exp.parentElement!==left) left.appendChild(exp); } else if(exp.parentElement!==ctrl) ctrl.appendChild(exp); }
place(); DESK.addEventListener('change',place);

// ---- compare: Split / Before / After
let view='split', lastSplit=S.split;
function setView(v){ if(v==='split'){ S.split=(lastSplit>=0&&lastSplit<=1)?lastSplit:.5; } else { if(view==='split') lastSplit=S.split; S.split= v==='before'?1.01:-1; }
  view=v; for(const [id,k] of [['dSplit','split'],['dBefore','before'],['dAfter','after']]) $(id).classList.toggle('on',view===k);
  if(S.info){ $('tagL').classList.toggle('hidden',v==='after'); $('tagR').classList.toggle('hidden',v==='before'); $('hint').classList.toggle('hidden',v!=='split'); }
  H.preview(); }
$('dSplit').onclick=()=>setView('split'); $('dBefore').onclick=()=>setView('before'); $('dAfter').onclick=()=>setView('after');
$('stage').addEventListener('pointerdown',()=>{ if(view!=='split' && S.info){ view='split'; for(const [id,k] of [['dSplit','split'],['dBefore','before'],['dAfter','after']]) $(id).classList.toggle('on',k==='split'); for(const id of ['tagL','tagR','hint']) $(id).classList.remove('hidden'); } },true);

// ---- play / pause the live graded preview
let playing=false;
const syncPlay=()=>{ const b=$('dPlay'); b.textContent=playing?'⏸ Pause':'▶ Play'; b.disabled=!S.info||S.busy; };
function tick(){ if(!playing) return; if(S.busy||vid.paused||vid.ended){ stopPlay(); return; } H.preview(); const d=S.info.dur||1;
  $('scrub').value=Math.round(vid.currentTime/d*1000); $('scrubO').textContent=vid.currentTime.toFixed(1)+'s';
  if(vid.requestVideoFrameCallback) vid.requestVideoFrameCallback(tick); else requestAnimationFrame(tick); }
async function startPlay(){ if(!S.info||S.busy||playing) return; if(vid.ended||vid.currentTime>=S.info.dur-.05) vid.currentTime=0;
  vid.muted=!!S._rtA; try{ await vid.play(); }catch(e){ vid.muted=true; try{ await vid.play(); }catch(_){ return; } } playing=true; syncPlay(); tick(); }
function stopPlay(){ if(!vid.paused) vid.pause(); vid.muted=true; if(playing){ playing=false; syncPlay(); H.preview(); } }
const togglePlay=()=>playing?stopPlay():startPlay();
$('dPlay').onclick=togglePlay; vid.addEventListener('ended',stopPlay);
$('scrub').addEventListener('pointerdown',stopPlay); $('go').addEventListener('click',stopPlay,true);
window.addEventListener('hx:loaded',()=>{ stopPlay(); syncPlay(); setView(view); if(DESK.matches){ const g=document.querySelector('.grid2'); if(g.getBoundingClientRect().top>12) g.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'}); } });
new MutationObserver(syncPlay).observe(document.body,{attributes:true,attributeFilter:['class']});

// ---- undo / redo (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y) for every grade/look/setting change
const KEYS=['mode','preset','intensity','user','curves','hsl','res','qual','smooth','look','ov','auto'];
const snap=()=>JSON.stringify(KEYS.map(k=>S[k]===undefined?null:S[k]));
const undo=[], redo=[]; let gest=null;
function begin(){ if(gest) return; gest=snap(); }
function commit(){ if(!gest) return; const now=snap(); if(now!==gest){ undo.push(gest); if(undo.length>100) undo.shift(); redo.length=0; } gest=null; }
function restore(s){ const v=JSON.parse(s); KEYS.forEach((k,i)=>{ S[k]= v[i]===null && (k==='look'||k==='ov'||k==='auto') ? null : v[i]; });
  const c=$('smooth'); if(c) c.checked=!!S.smooth; H.syncUI(); H.preview(); flash(undo.length?'↶ Undo':'↶ Undo (shuru wali setting)'); }
const inUI=(t)=>t&&t.closest&&t.closest('#ctrl,#expCard,#hxP,#hxTip,.hero');
document.addEventListener('input',e=>{ if(e.target.type==='range'&&inUI(e.target)) begin(); },true);
document.addEventListener('change',e=>{ if(inUI(e.target)) setTimeout(commit,0); },true);
document.addEventListener('pointerup',()=>setTimeout(commit,30),true);
document.addEventListener('keyup',()=>setTimeout(commit,30),true);
document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('button,input[type=checkbox]'); if(!b||!inUI(b)) return; begin(); setTimeout(commit,60); },true);

// ---- keyboard shortcuts (desktop): Space play/pause, B before/after, E export, Ctrl+Z undo
const typing=(t)=>t&&(t.isContentEditable||/^(TEXTAREA|SELECT)$/.test(t.tagName)||(t.tagName==='INPUT'&&!/^(range|checkbox|radio|button|file)$/.test(t.type)));
document.addEventListener('keydown',e=>{ if(typing(e.target)) return; const k=e.key.toLowerCase(), mod=e.ctrlKey||e.metaKey;
  if(mod&&k==='z'&&!e.shiftKey){ e.preventDefault(); if(gest) commit(); if(undo.length){ redo.push(snap()); restore(undo.pop()); } else flash('Undo ke liye kuch nahi'); return; }
  if(mod&&(k==='y'||(k==='z'&&e.shiftKey))){ e.preventDefault(); if(redo.length){ undo.push(snap()); restore(redo.pop()); flash('↷ Redo'); } return; }
  if(mod||e.altKey) return;
  if(e.code==='Space'){ if(!S.info) return; e.preventDefault(); togglePlay(); }
  else if(k==='b'){ if(!S.info) return; e.preventDefault(); setView(view==='before'?'after':'before'); flash(view==='before'?'Before (original)':'After (result)'); }
  else if(k==='e'){ const g=$('go'); if(g&&!g.disabled&&!S.busy){ e.preventDefault(); g.click(); flash('🚀 Export shuru'); } }
  else if(k==='escape'&&S.busy){ S.cancel=true; } });

// ---- mouse wheel = fine adjust on sliders (hover a slider and scroll; Shift = extra fine)
document.addEventListener('wheel',e=>{ const r=e.target.closest&&e.target.closest('input[type=range]'); if(!r||!FINE.matches||r.disabled) return;
  e.preventDefault(); const mn=+r.min, mx=+r.max, st=Math.max(1,Math.round((mx-mn)/100))*(e.shiftKey?.25:1); const dir=(e.deltaY||e.deltaX)<0?1:-1;
  const lab=r.closest('label.sl'); if(!lab||lab.id!=='scrubRow') begin();
  r.value=Math.max(mn,Math.min(mx,+r.value+dir*Math.max(1,Math.round(st)))); r.dispatchEvent(new Event('input',{bubbles:true}));
  clearTimeout(r._wt); r._wt=setTimeout(()=>{ r.dispatchEvent(new Event('change',{bubbles:true})); commit(); },350); },{passive:false});

// ---- drag & drop a video anywhere on the page
const drop=$('drop'); let dragN=0; const hasFile=(e)=>e.dataTransfer&&[...(e.dataTransfer.types||[])].includes('Files');
window.addEventListener('dragenter',e=>{ if(!hasFile(e)) return; e.preventDefault(); dragN++; if(!S.busy) drop.classList.remove('hidden'); });
window.addEventListener('dragover',e=>{ if(!hasFile(e)) return; e.preventDefault(); e.dataTransfer.dropEffect=S.busy?'none':'copy'; });
window.addEventListener('dragleave',e=>{ if(!hasFile(e)) return; if(--dragN<=0){ dragN=0; drop.classList.add('hidden'); } });
window.addEventListener('drop',e=>{ if(!hasFile(e)) return; e.preventDefault(); dragN=0; drop.classList.add('hidden'); if(S.busy){ flash('Export chal raha hai — khatam hone do'); return; }
  const f=[...e.dataTransfer.files].find(f=>/^video\//.test(f.type)||/\.(mp4|mov|m4v|webm|mkv)$/i.test(f.name));
  if(!f){ flash('Ye video file nahi hai — MP4 / MOV / WebM daalo'); return; }
  const dt=new DataTransfer(); dt.items.add(f); const inp=$('file'); inp.files=dt.files; inp.dispatchEvent(new Event('change')); });

// ---- hover tooltips (mouse only)
const TIPS={exp:'Poori video ki brightness',con:'Dark aur bright ka farak (punch)',sat:'Saare colours ki strength',vib:'Halke colours boost — skin safe rehti hai',temp:'Warm (orange) ↔ Cool (blue)',tint:'Green ↔ Magenta',hl:'Bright parts (sky, lights) kam / zyada',sh:'Dark parts kholo — detail dikhegi',clar:'Mid-detail punch (texture, HUD)',sharp:'Edges crisp — zyada mat karo',
 flick:'Light flicker effect (beat jaisa)',bloom:'Bright cheezon pe soft glow',ca:'Edges pe RGB split (glitch feel)',leak:'Corner se warm light leak',grain:'Film grain texture',vig:'Kinaron ko dark — focus center pe',fade:'Matte / faded blacks',lift:'Blacks thode grey (soft look)',lb:'Cinema black bars upar-neeche',skin:'Face / skin ka colour natural rakho',
 c0:'Is channel ke shadows',c1:'Is channel ke mid-tones',c2:'Is channel ke highlights',h:'Is colour ka hue shift',s:'Is colour ki saturation',l:'Is colour ki brightness'};
function addTips(){ document.querySelectorAll('label.sl[data-k]').forEach(l=>{ if(TIPS[l.dataset.k]&&!l.dataset.tip) l.dataset.tip=TIPS[l.dataset.k]+' · scroll = fine adjust'; });
  document.querySelectorAll('#modes .opt,.look').forEach(b=>{ const s=b.querySelector('small'); if(s&&!b.dataset.tip) b.dataset.tip=s.textContent; });
  const set=(sel,t)=>{ const el=document.querySelector(sel); if(el&&!el.dataset.tip) el.dataset.tip=t; };
  set('#intensity','Look kitna strong — 100% normal, 150% max'); set('#auto','Clip scan karke auto grade (one tap)'); set('#reset','Saari grade settings reset');
  set('#go','Export HD MP4 (E)'); set('#pick','Video choose karo — ya file page pe drag & drop karo'); set('#cancel','Export rok do (Esc)');
  set('#scrubRow','Frame chuno · Space = play'); set('label[for=smooth]','Frame blend se 60fps — export ~2x time');
  document.querySelectorAll('#res button').forEach(b=>b.dataset.tip=b.dataset.tip||({1080:'Insta / YT Shorts ke liye best',1440:'2K — badi file',2160:'4K — sabse badi file, slow export'}[b.dataset.k]||''));
  document.querySelectorAll('#qual button').forEach(b=>b.dataset.tip=b.dataset.tip||(b.dataset.k==='high'?'High bitrate — best quality':'Chhoti file — share karne ke liye'));
  document.querySelectorAll('.chip').forEach(b=>{ if(!b.dataset.tip) b.dataset.tip='Base grade: '+b.textContent.trim(); }); }
addTips(); setTimeout(addTips,1500);
const tip=$('tip'); let tipT=null, tipEl=null;
document.addEventListener('mouseover',e=>{ if(!FINE.matches) return; const el=e.target.closest&&e.target.closest('[data-tip]'); if(el===tipEl) return; tipEl=el; clearTimeout(tipT); tip.classList.add('hidden'); if(!el||!el.dataset.tip) return;
  tipT=setTimeout(()=>{ if(tipEl!==el) return; tip.textContent=el.dataset.tip; tip.classList.remove('hidden'); const r=el.getBoundingClientRect(), tw=tip.offsetWidth, th=tip.offsetHeight;
    let x=Math.min(innerWidth-tw-8,Math.max(8,r.left+r.width/2-tw/2)), y=r.top-th-8; if(y<6) y=r.bottom+8; tip.style.left=x+'px'; tip.style.top=y+'px'; },380); });
document.addEventListener('pointerdown',()=>{ clearTimeout(tipT); tip.classList.add('hidden'); },true);

// ---- tiny toast for shortcut feedback
let fl=null; function flash(t){ if(!fl){ fl=document.createElement('div'); fl.style.cssText='position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:9999;background:rgba(18,17,22,.96);border:1px solid #e3b65a;color:#f5d48c;font:700 14px system-ui,sans-serif;padding:8px 14px;border-radius:99px;pointer-events:none;transition:opacity .25s'; document.body.appendChild(fl); }
  fl.textContent=t; fl.style.opacity='1'; clearTimeout(fl._t); fl._t=setTimeout(()=>fl.style.opacity='0',1100); }
window.HXdesk={setView,togglePlay,undo,redo,get view(){return view;},get playing(){return playing;}};
