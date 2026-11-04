// HEYYANIXX Upscale — 100% client-side. Videos never leave the device.
import { Muxer, ArrayBufferTarget } from './vendor/mp4-muxer.mjs';
import { createFile, DataStream, MP4BoxBuffer, Endianness } from './vendor/mp4box.all.mjs';

const $ = (id) => document.getElementById(id);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------------------------------------------------------------- presets
const N = { exp:0,con:0,sat:0,vib:0,temp:0,tint:0,hl:0,sh:0,lift:0,fade:0,clar:0,sharp:0,vig:0,bloom:0,grain:0,curve:0,to:0,split:0,skin:0,ca:0,leak:0,lb:0,mono:0 };
const PRESETS = {
  original:{n:'Original',sw:'#444,#888'},
  insta:{n:'Insta Clean HDR',sw:'#cfe3ff,#ffd9b0',hl:-.45,sh:.4,clar:.35,vib:.3,con:.12,sharp:.3,curve:.6,skin:.8,temp:.03},
  teal:{n:'Teal & Orange',sw:'#0f6b78,#f08a3c',to:.9,split:.45,sS:[.35,.5,.62],sH:[.66,.52,.4],con:.25,sat:-.05,vib:.1,curve:.8,lift:.03,vig:.3,skin:1,hl:-.2},
  moody:{n:'Moody Dark',sw:'#1b2326,#5a5040',exp:-.4,con:.3,sat:-.35,lift:.07,fade:.1,split:.35,sS:[.4,.5,.56],sH:[.58,.52,.44],vig:.55,grain:.25,hl:-.35,curve:.6,skin:.8},
  neon:{n:'Neon Gaming Pop',sw:'#ff2bd6,#21e6ff',vib:.7,sat:.25,con:.3,bloom:.7,clar:.45,sharp:.4,tint:.12,split:.35,sS:[.55,.38,.65],sH:[.4,.6,.66],vig:.3,ca:.25},
  golden:{n:'Golden Hour',sw:'#ffb347,#ffd27f',temp:.5,tint:.06,split:.4,sS:[.58,.48,.38],sH:[.7,.58,.38],bloom:.35,con:.12,vib:.25,hl:-.25,curve:.5,leak:.35,skin:.6},
  anime:{n:'Anime Vivid',sw:'#5ab0ff,#ff7aa8',sat:.4,vib:.45,con:.18,sh:.35,clar:.25,bloom:.25,temp:-.06,sharp:.4,curve:.5,hl:-.2,skin:.5},
  ffvivid:{n:'FF Vivid',sw:'#ffcc00,#ff5a1f',vib:.6,sat:.2,clar:.5,sharp:.55,con:.22,sh:.25,hl:-.25,curve:.5,skin:.6},
  hdrpop:{n:'HDR Pop',sw:'#3cf,#fc3',hl:-.6,sh:.55,clar:.7,vib:.35,sharp:.45,curve:.8,con:.1,skin:.6},
  esports:{n:'Esports Crisp',sw:'#9ff,#fff',clar:.6,sharp:.6,vib:.4,con:.2,temp:-.08,hl:-.3,sh:.3,skin:.5},
  neonnight:{n:'Neon Night',sw:'#3b2bff,#ff2bb0',exp:-.2,temp:-.35,tint:.18,bloom:.8,vib:.55,con:.32,split:.4,sS:[.42,.42,.66],sH:[.66,.42,.6],vig:.45,ca:.2},
  sunset:{n:'Warm Sunset',sw:'#ff7e5f,#feb47b',temp:.65,tint:.12,sat:.12,bloom:.3,split:.35,sS:[.52,.45,.5],sH:[.72,.5,.48],con:.12,fade:.04,leak:.4,skin:.6},
  bw:{n:'B&W Contrast',sw:'#000,#fff',mono:1,con:.5,clar:.45,grain:.25,vig:.4,curve:.6,sh:.1},
};
const FINE = [['exp','☀️ Exposure',-1,1],['con','◐ Contrast',-1,1],['sat','🎨 Saturation',-1,1],['vib','🌈 Vibrance',-1,1],['temp','🔥 Warmth',-1,1],['tint','💜 Tint',-1,1],['hl','⬆ Highlights',-1,1],['sh','⬇ Shadows',-1,1],['clar','💎 Clarity',-1,1],['sharp','🔪 Sharpness',-.5,1]];
const FX = [['bloom','✨ Glow / bloom',0,1],['ca','🌈 Chromatic ab.',0,1],['leak','🟠 Light leak',0,1],['grain','🎞️ Film grain',0,1],['vig','⚫ Vignette',0,1],['fade','🌫️ Fade / matte',0,1],['lift','⬛ Lift blacks',0,.2],['lb','🎬 Letterbox',0,1],['skin','🙂 Skin protect',0,1]];
const S = {
  mode:'fast', preset:'original', intensity:1, user:{...N}, auto:null,
  curves:{m:[0,0,0],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, curveCh:'m',
  hsl:{h:[0,0,0,0,0,0],s:[0,0,0,0,0,0],l:[0,0,0,0,0,0]}, hslBand:0,
  res:1080, qual:'high', split:.5, smooth:false,
  file:null, info:null, gpuOK:false, busy:false, cancel:false,
};
window.HX = S;

// ---------------------------------------------------------------- WebGL
const cv = $('cv');
const gl = cv.getContext('webgl2', { preserveDrawingBuffer:true, premultipliedAlpha:false, antialias:false });
const VS = `#version 300 es
out vec2 v; void main(){ vec2 p=vec2((gl_VertexID<<1)&2, gl_VertexID&2); v=p; gl_Position=vec4(p*2.-1.,0,1); }`;
const FS_DEN = `#version 300 es
precision highp float; in vec2 v; out vec4 o; uniform sampler2D S; uniform float str;
void main(){ ivec2 p=ivec2(gl_FragCoord.xy); ivec2 m=textureSize(S,0)-1; vec3 c0=texelFetch(S,p,0).rgb; vec3 acc=vec3(0); float ws=0.;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){ vec3 c=texelFetch(S,clamp(p+ivec2(i,j),ivec2(0),m),0).rgb; float d=length(c-c0); float w=exp(-d*d/(str*str+1e-5))*((i==0&&j==0)?1.:.7); acc+=c*w; ws+=w; }
 o=vec4(str>0.001?acc/ws:c0,1.); }`;
const FS_UP = `#version 300 es
precision highp float; in vec2 v; out vec4 o; uniform sampler2D S;
vec3 f(ivec2 p,ivec2 m){ return texelFetch(S,clamp(p,ivec2(0),m),0).rgb; }
vec4 cr(float t){ float t2=t*t,t3=t2*t; return vec4(-.5*t3+t2-.5*t, 1.5*t3-2.5*t2+1., -1.5*t3+2.*t2+.5*t, .5*t3-.5*t2); }
void main(){ ivec2 sz=textureSize(S,0); ivec2 m=sz-1; vec2 p=v*vec2(sz)-.5; vec2 fp=floor(p); vec2 fr=p-fp; ivec2 ip=ivec2(fp);
 vec4 wx=cr(fr.x), wy=cr(fr.y); vec3 c=vec3(0);
 for(int j=0;j<4;j++){ vec3 r=vec3(0); for(int i=0;i<4;i++) r+=f(ip+ivec2(i-1,j-1),m)*wx[i]; c+=r*wy[j]; }
 vec3 a=f(ip,m),b=f(ip+ivec2(1,0),m),d=f(ip+ivec2(0,1),m),e=f(ip+ivec2(1,1),m);
 vec3 cl=clamp(c,min(min(a,b),min(d,e)),max(max(a,b),max(d,e)));
 o=vec4(mix(c,cl,.6),1.); }`;
const FS_GRADE = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
uniform sampler2D T; uniform sampler2D LUT; uniform vec2 px; uniform float aspect, lodB, useLut;
uniform float uExp,uCon,uSat,uVib,uTemp,uTint,uHl,uSh,uLift,uFade,uClar,uSharp,uVig,uBloom,uGrain,uLo,uHi,uSplit,uSkin,uTO,uCurve,uCA,uLeak,uLB,uTime,uMono;
uniform vec3 uSS,uSH,uLkA,uLkB; uniform float uHH[6],uHS[6],uHL[6];
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 sm(vec2 uv){return texture(T,uv).rgb;}
vec3 sb(vec2 uv){return textureLod(T,uv,lodB).rgb;}
void main(){
 vec2 uv=v;
 if(uLB>0.&&(uv.y<uLB||uv.y>1.-uLB)){o=vec4(0,0,0,1);return;}
 vec2 d=uv-.5; vec3 c;
 if(uCA>0.){ vec2 off=d*uCA*.012; c=vec3(sm(uv+off).r,sm(uv).g,sm(uv-off).b);} else c=sm(uv);
 if(uSharp!=0.){ vec2 s=px*1.25; vec3 n=sm(uv+vec2(s.x,0.))+sm(uv-vec2(s.x,0.))+sm(uv+vec2(0.,s.y))+sm(uv-vec2(0.,s.y)); vec3 df=c-n*.25; c+=df*uSharp*2.2/(1.+length(df)*5.); }
 vec3 b=vec3(0),bl=vec3(0); float r1=.012;
 for(int i=0;i<8;i++){ float a=float(i)*.785398; vec3 s1=sb(uv+vec2(cos(a)*r1/aspect,sin(a)*r1)); vec3 s2=sb(uv+vec2(cos(a+.39)*r1*3./aspect,sin(a+.39)*r1*3.)); b+=s1; bl+=max(s1-.6,0.)+max(s2-.6,0.)*1.3; }
 b/=8.; bl/=8.;
 float lc=luma(c); c+=(lc-luma(b))*uClar*1.6*(1.-abs(lc*2.-1.)*.6);
 c=clamp(c,0.,1.);
 c=clamp((c-uLo)/max(uHi-uLo,.05),0.,1.);
 vec3 l=pow(c,vec3(2.2))*exp2(uExp);
 l*=vec3(1.+uTemp*.3+uTint*.05,1.-uTint*.15,1.-uTemp*.3+uTint*.05);
 float y=luma(l); l*=1.+uSh*(1.-smoothstep(0.,.3,y))*1.5; l*=1.+uHl*smoothstep(.25,1.,y)*.7; l=max(l,0.);
 float k=uCurve*.8; l=l*(1.+k)/(1.+k*l);
 c=pow(clamp(l,0.,1.),vec3(1./2.2));
 c= uCon>=0. ? mix(c,c*c*(3.-2.*c),uCon) : mix(c,vec3(.5),-uCon*.5);
 if(useLut>.5){ vec3 q=c*(255./256.)+.5/256.; c=vec3(texture(LUT,vec2(q.r,.5)).r,texture(LUT,vec2(q.g,.5)).g,texture(LUT,vec2(q.b,.5)).b); }
 vec3 toned=c;
 vec3 h=rgb2hsv(c);
 float skin=smoothstep(0.,.03,h.x)*(1.-smoothstep(.1,.15,h.x))*smoothstep(.12,.25,h.y)*(1.-smoothstep(.7,.9,h.y))*smoothstep(.15,.35,h.z);
 if(uTO!=0.){ float tw=smoothstep(.2,.3,h.x)*(1.-smoothstep(.72,.8,h.x)); h.x=mix(h.x,.52,tw*uTO*.55); float ow=smoothstep(.01,.04,h.x)*(1.-smoothstep(.13,.19,h.x))*(1.-skin); h.x=mix(h.x,.075,ow*uTO*.5); h.y=clamp(h.y*(1.+(tw+ow)*uTO*.15),0.,1.); }
 float dh=0.,ds=0.,dl=0.;
 for(int i=0;i<6;i++){ float cen=float(i)/6.; float dd=abs(h.x-cen); dd=min(dd,1.-dd); float w=max(0.,1.-dd*6.); dh+=w*uHH[i]; ds+=w*uHS[i]; dl+=w*uHL[i]; }
 h.x=fract(h.x+dh*.0833); h.y=clamp(h.y*(1.+ds),0.,1.); h.z=clamp(h.z*(1.+dl*.5*h.y),0.,1.);
 float sp=1.-skin*uSkin*.7; float vb=uVib*(1.-h.y)*sp;
 h.y=clamp(h.y*(1.+uSat*(uSat>0.?sp:1.))*(1.+vb),0.,1.);
 c=hsv2rgb(h);
 c=mix(c,vec3(luma(c)),uMono);
 float L=luma(c); c+=(uSS-.5)*uSplit*(1.-L)*(1.-L)*1.2+(uSH-.5)*uSplit*L*L;
 c=mix(c,toned,skin*uSkin*.45*(1.-uMono));
 c=1.-(1.-clamp(c,0.,1.))*(1.-clamp(bl*uBloom*2.2,0.,1.));
 if(uLeak>0.){ float t=uTime*.15; vec2 a1=(uv-vec2(.1+.15*sin(t),.85+.1*cos(t*1.3)))*vec2(aspect,1.)/max(aspect,1.); vec2 a2=(uv-vec2(.95+.05*cos(t*.7),.2+.15*sin(t*.9)))*vec2(aspect,1.)/max(aspect,1.);
   vec3 lk=uLkA*exp(-dot(a1,a1)*5.)+uLkB*exp(-dot(a2,a2)*7.)*.8; c=1.-(1.-c)*(1.-clamp(lk*uLeak,0.,1.)); }
 c=c*(1.-uLift)+uLift; c=mix(c,c*.85+.06,uFade);
 float vr=length(d)*1.414; c*=mix(1.,1.-smoothstep(.45,1.2,vr),uVig);
 if(uGrain>0.){ vec2 fc=floor(gl_FragCoord.xy); float g=hash(fc+fract(uTime*7.31)*91.)+hash(fc*1.37+fract(uTime*3.7)*53.)-1.; c+=g*uGrain*.08*(1.-abs(luma(c)-.5)); }
 o=vec4(clamp(c,0.,1.),1.);
}`;
const FS_OUT = `#version 300 es
precision highp float; in vec2 v; out vec4 o; uniform sampler2D A,B,Sr; uniform float w,split; uniform vec2 res;
void main(){ vec3 c=mix(texture(A,v).rgb,texture(B,v).rgb,w);
 if(split>=0.){ if(v.x<split) c=texture(Sr,v).rgb; if(abs(gl_FragCoord.x-split*res.x)<max(1.5,res.x*.0025)) c=vec3(.89,.71,.35); }
 o=vec4(c,1.); }`;

function prog(fs){ const p=gl.createProgram(); for(const [t,s] of [[gl.VERTEX_SHADER,VS],[gl.FRAGMENT_SHADER,fs]]){ const sh=gl.createShader(t); gl.shaderSource(sh,s); gl.compileShader(sh); if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); gl.attachShader(p,sh);} gl.linkProgram(p); if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); p.u={}; const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS); for(let i=0;i<n;i++){ const a=gl.getActiveUniform(p,i); p.u[a.name.replace('[0]','')]=gl.getUniformLocation(p,a.name);} return p; }
let P_DEN,P_UP,P_GRADE,P_OUT;
const T = {};
function tex(name,w,h,mip){ let t=T[name]; if(!t){ t=T[name]={t:gl.createTexture(),w:0,h:0,fb:null}; }
  gl.bindTexture(gl.TEXTURE_2D,t.t);
  if(w&&(t.w!==w||t.h!==h)){ gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null); t.w=w;t.h=h; if(t.fb){gl.deleteFramebuffer(t.fb);t.fb=null;} }
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mip?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); return t; }
function upload(name,src,w,h){ const t=tex(name); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,src); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false); t.w=w;t.h=h; return t; }
function fbo(t){ if(!t.fb){ t.fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,t.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t.t,0);} gl.bindFramebuffer(gl.FRAMEBUFFER,t.fb); gl.viewport(0,0,t.w,t.h); }
function bindT(unit,t,loc){ gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,t.t); gl.uniform1i(loc,unit); }
function mip(t){ gl.bindTexture(gl.TEXTURE_2D,t.t); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR); gl.generateMipmap(gl.TEXTURE_2D); }
let lutTex=null;
function buildLut(){ const c=S.curves; const any=Object.values(c).some(a=>a.some(x=>x)); if(!any) return false;
  const bump=(x,m,w)=>Math.exp(-((x-m)**2)/(2*w*w)); const f=(x,a)=>clamp(x+.18*(a[0]*bump(x,.2,.12)+a[1]*bump(x,.5,.15)+a[2]*bump(x,.8,.12)),0,1);
  const d=new Uint8Array(256*4); for(let i=0;i<256;i++){ const m=f(i/255,c.m); d[i*4]=f(m,c.r)*255; d[i*4+1]=f(m,c.g)*255; d[i*4+2]=f(m,c.b)*255; d[i*4+3]=255; }
  if(!lutTex) lutTex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,lutTex); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,256,1,0,gl.RGBA,gl.UNSIGNED_BYTE,d);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); return true; }

function params(){ const p=PRESETS[S.preset]||{}; const I=S.intensity; const o={}; const ov=S.ov||{}; const z=ov.zero||[];
  for(const k in N) o[k]=(z.includes(k)?0:(p[k]||0)*I) + (S.user[k]||0) + (S.auto&&S.auto[k]||0);
  o.sS=(ov.sS||p.sS||[.5,.5,.5]); o.sH=(ov.sH||p.sH||[.5,.5,.5]); o.lk=ov.lk||[[1,.55,.25],[1,.3,.45]]; o.lo=S.auto?S.auto.lo:0; o.hi=S.auto?S.auto.hi:1; o.mono=clamp(o.mono,0,1); return o; }

// ---------------------------------------------------------------- WebGPU (Anime4K neural-net upscale)
const GPU = { ok:false, device:null, key:'', canvas:null, ctx:null };
async function gpuProbe(){ try{ if(!navigator.gpu) return false; const a=await navigator.gpu.requestAdapter({powerPreference:'high-performance'}); if(!a) return false;
  GPU.adapter=a; GPU.device=await a.requestDevice({requiredLimits:{maxTextureDimension2D:Math.min(8192,a.limits.maxTextureDimension2D)}});
  GPU.device.lost.then(()=>{GPU.ok=false;}); GPU.ok=true; return true; }catch(e){ console.warn('webgpu',e); return false; } }
let a4kLoading=null;
const A4K_SRC=['https://cdn.jsdelivr.net/npm/anime4k-webgpu@1.0.0/lib/index.js','https://unpkg.com/anime4k-webgpu@1.0.0/lib/index.js','vendor/anime4k-webgpu.js'];
function loadA4K(){ if(window['anime4k-webgpu']) return Promise.resolve(); if(!a4kLoading) a4kLoading=(async()=>{ for(const u of A4K_SRC){ try{ await new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=u; if(u.startsWith('http')){ s.crossOrigin='anonymous'; s.integrity='sha384-14eDWIaZfHSe/3i4Z5jQB6j1JljJeUqfZjjIm3urKw85xMXW/ihnZVuKdI1pf/DP'; } s.onload=res; s.onerror=rej; document.head.appendChild(s); }); if(window['anime4k-webgpu']) return; }catch(e){ console.warn('a4k load fail',u); } } a4kLoading=null; throw new Error('AI model load nahi hua (internet check karo).'); })(); return a4kLoading; }
function gpuSetup(w,h,mode){ const key=w+'x'+h+mode; if(GPU.key===key) return; const dev=GPU.device, A=window['anime4k-webgpu'];
  GPU.inTex=dev.createTexture({size:[w,h,1],format:'rgba16float',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});
  let pipes; if(mode==='max'){ pipes = Math.min(w,h)<=720 ? [new A.GANx4UUL({device:dev,inputTexture:GPU.inTex})] : [new A.CNNx2UL({device:dev,inputTexture:GPU.inTex})]; GPU.maxName=Math.min(w,h)<=720?'4x GAN':'2x CNN-UL'; }
  else pipes=[new A.CNNx2VL({device:dev,inputTexture:GPU.inTex})];
  GPU.pipes=pipes; const out=pipes[pipes.length-1].getOutputTexture(); GPU.ow=out.width; GPU.oh=out.height;
  if(!GPU.canvas){ GPU.canvas=document.createElement('canvas'); GPU.ctx=GPU.canvas.getContext('webgpu'); GPU.format=navigator.gpu.getPreferredCanvasFormat();
    const m=dev.createShaderModule({code:`@group(0) @binding(0) var s: sampler; @group(0) @binding(1) var t: texture_2d<f32>;
struct VO { @builtin(position) p: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VO { var pos = array<vec2f,3>(vec2f(-1.,-1.), vec2f(3.,-1.), vec2f(-1.,3.)); var o: VO; o.p = vec4f(pos[i],0.,1.); o.uv = vec2f((pos[i].x+1.)*.5, (1.-pos[i].y)*.5); return o; }
@fragment fn fs(i: VO) -> @location(0) vec4f { return vec4f(clamp(textureSample(t, s, i.uv).rgb, vec3f(0.), vec3f(1.)), 1.); }`});
    GPU.rp=dev.createRenderPipeline({layout:'auto',vertex:{module:m,entryPoint:'vs'},fragment:{module:m,entryPoint:'fs',targets:[{format:GPU.format}]}});
    GPU.samp=dev.createSampler({magFilter:'linear',minFilter:'linear'}); }
  GPU.canvas.width=GPU.ow; GPU.canvas.height=GPU.oh; GPU.ctx.configure({device:dev,format:GPU.format,alphaMode:'opaque'});
  GPU.bg=dev.createBindGroup({layout:GPU.rp.getBindGroupLayout(0),entries:[{binding:0,resource:GPU.samp},{binding:1,resource:out.createView()}]});
  GPU.key=key; }
function gpuRun(src,w,h){ const dev=GPU.device;
  if(!GPU.via2d){ try{ dev.queue.copyExternalImageToTexture({source:src},{texture:GPU.inTex},[w,h]); }catch(e){ GPU.via2d=true; console.warn('gpu copy via 2d',e.message); } }
  if(GPU.via2d){ if(!GPU.tmp){ GPU.tmp=document.createElement('canvas'); GPU.tctx=GPU.tmp.getContext('2d'); } if(GPU.tmp.width!==w||GPU.tmp.height!==h){ GPU.tmp.width=w; GPU.tmp.height=h; } GPU.tctx.drawImage(src,0,0,w,h); dev.queue.copyExternalImageToTexture({source:GPU.tmp},{texture:GPU.inTex},[w,h]); }
  const e=dev.createCommandEncoder(); for(const p of GPU.pipes) p.pass(e);
  const rp=e.beginRenderPass({colorAttachments:[{view:GPU.ctx.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:'clear',storeOp:'store'}]});
  rp.setPipeline(GPU.rp); rp.setBindGroup(0,GPU.bg); rp.draw(3); rp.end(); dev.queue.submit([e.finish()]); return GPU.canvas; }

// ---------------------------------------------------------------- frame pipeline
function outDims(sw,sh){ let s=S.res/Math.min(sw,sh); s=Math.min(s,4096/Math.max(sw,sh),Math.sqrt(8.8e6/(sw*sh))); return [Math.floor(sw*s/2)*2, Math.floor(sh*s/2)*2]; }
function effMode(){ if((S.mode==='ai'||S.mode==='max')&&!GPU.ok) return 'fast'; return S.mode; }
// renders one source frame into texture 'G' (graded, output size). returns nothing.
function processFrame(src,sw,sh,W,H,time){
  const mode=effMode(); const maxT=gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const tSrc=upload('src',src,sw,sh); let tIn=tSrc;
  if(mode==='fast' && sw*2<=maxT && sh*2<=maxT){
    const tD=tex('den',sw,sh); fbo(tD); gl.useProgram(P_DEN); bindT(0,tSrc,P_DEN.u.S); gl.uniform1f(P_DEN.u.str,.07); gl.drawArrays(gl.TRIANGLES,0,3);
    const tU=tex('up',sw*2,sh*2); fbo(tU); gl.useProgram(P_UP); bindT(0,tD,P_UP.u.S); gl.drawArrays(gl.TRIANGLES,0,3); tIn=tU;
  } else if(mode==='ai'||mode==='max'){
    gpuSetup(sw,sh,mode); const c=gpuRun(src,sw,sh); tIn=upload('gpu',c,GPU.ow,GPU.oh);
  }
  mip(tIn);
  const tG=tex('G',W,H); fbo(tG); gl.useProgram(P_GRADE); const u=P_GRADE.u; const p=params();
  gl.activeTexture(gl.TEXTURE1); const hasLut=buildLut(); bindT(0,tIn,u.T); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,lutTex||tIn.t); gl.uniform1i(u.LUT,1); gl.uniform1f(u.useLut,hasLut?1:0);
  gl.uniform2f(u.px,1/tIn.w,1/tIn.h); gl.uniform1f(u.aspect,W/H); gl.uniform1f(u.lodB,Math.max(0,Math.log2(.012*tIn.h/2)));
  const map={uExp:p.exp,uCon:clamp(p.con,-1,1),uSat:p.sat,uVib:p.vib,uTemp:p.temp,uTint:p.tint,uHl:p.hl,uSh:p.sh,uLift:clamp(p.lift,0,.3),uFade:clamp(p.fade,0,1),uClar:p.clar,uSharp:p.sharp,uVig:clamp(p.vig,0,1),uBloom:Math.max(0,p.bloom),uGrain:Math.max(0,p.grain),uLo:p.lo,uHi:p.hi,uSplit:p.split,uSkin:clamp(p.skin,0,1),uTO:p.to,uCurve:Math.max(0,p.curve),uCA:Math.max(0,p.ca),uLeak:Math.max(0,p.leak),uLB:lbBar(W,H,p.lb),uTime:time,uMono:p.mono};
  for(const k in map) gl.uniform1f(u[k],map[k]);
  gl.uniform3fv(u.uSS,p.sS); gl.uniform3fv(u.uSH,p.sH); gl.uniform3fv(u.uLkA,p.lk[0]); gl.uniform3fv(u.uLkB,p.lk[1]); gl.uniform1fv(u.uHH,S.hsl.h); gl.uniform1fv(u.uHS,S.hsl.s); gl.uniform1fv(u.uHL,S.hsl.l);
  gl.drawArrays(gl.TRIANGLES,0,3);
  return tG;
}
function lbBar(W,H,a){ if(a<=0) return 0; const A=W/H; const bar=A<2.39?(1-A/2.39)/2:0; return Math.min(bar,.12)*clamp(a,0,1); }
function present(tA,tB,w,split){ gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,cv.width,cv.height); gl.useProgram(P_OUT); const u=P_OUT.u;
  bindT(0,tA,u.A); bindT(1,tB,u.B); bindT(2,T.src,u.Sr); gl.uniform1f(u.w,w); gl.uniform1f(u.split,split); gl.uniform2f(u.res,cv.width,cv.height); gl.drawArrays(gl.TRIANGLES,0,3); }

// ---------------------------------------------------------------- loading + demux
const vid=$('vid');
function demux(buf){ return new Promise((resolve)=>{ try{
  const f=createFile(); const out={v:null,a:null,vs:[],as:[]}; let info=null;
  f.onError=()=>resolve(null);
  f.onReady=(i)=>{ info=i; out.v=i.videoTracks[0]||null; out.a=(i.audioTracks||[])[0]||null;
    if(out.v) f.setExtractionOptions(out.v.id,'v',{nbSamples:1e9}); if(out.a) f.setExtractionOptions(out.a.id,'a',{nbSamples:1e9}); f.start(); };
  f.onSamples=(id,user,samples)=>{ (user==='v'?out.vs:out.as).push(...samples); };
  const b=MP4BoxBuffer&&MP4BoxBuffer.fromArrayBuffer?MP4BoxBuffer.fromArrayBuffer(buf,0):Object.assign(buf,{fileStart:0});
  f.appendBuffer(b); f.flush();
  setTimeout(()=>{ if(!info||!out.v) return resolve(null);
    const trak=f.getTrackById(out.v.id); let desc=null;
    for(const e of trak.mdia.minf.stbl.stsd.entries){ const box=e.avcC||e.hvcC||e.vpcC||e.av1C; if(box){ const s=new DataStream(undefined,0,Endianness?Endianness.BIG_ENDIAN:DataStream.BIG_ENDIAN); box.write(s); desc=new Uint8Array(s.buffer,8); break; } }
    out.desc=desc; const m=out.v.matrix; out.rot = m && !(m[0]===65536 && m[4]===65536);
    out.fps = out.v.nb_samples/(out.v.duration/out.v.timescale);
    if(out.a){ try{ const at=f.getTrackById(out.a.id); const e=at.mdia.minf.stbl.stsd.entries[0]; out.adesc=e.esds.esd.descs[0].descs[0].data; }catch(e){ out.adesc=null; } }
    out.mp4=f; resolve(out); },0);
 }catch(e){ console.warn('demux',e); resolve(null);} }); }

async function loadFile(file){
  S.file=file; S.info=null; $('done').classList.add('hidden');
  vid.src=URL.createObjectURL(file);
  await new Promise((res,rej)=>{ vid.onloadedmetadata=res; vid.onerror=()=>rej(new Error('Ye video browser open nahi kar paaya (codec?). MP4 H.264 try karo.')); });
  const buf=await file.arrayBuffer(); const dm=await demux(buf);
  let canDec=false;
  if(dm&&!dm.rot&&window.VideoDecoder){ try{ dm.vcfg={codec:dm.v.codec,codedWidth:dm.v.video.width,codedHeight:dm.v.video.height,description:dm.desc||undefined}; canDec=(await VideoDecoder.isConfigSupported(dm.vcfg)).supported; }catch(e){ canDec=false; } }
  const sw=vid.videoWidth, sh=vid.videoHeight, dur=vid.duration;
  const fps = dm&&dm.fps>5&&dm.fps<121 ? dm.fps : 30;
  S.info={sw,sh,dur,fps,dm,canDec,buf};
  $('finfo').innerHTML=`✅ <b>${file.name.slice(0,40)}</b> — ${sw}×${sh}, ${dur.toFixed(1)}s, ${fps.toFixed(fps%1?2:0)} fps${dm&&dm.a?', audio ✓':''}`;
  const w=[]; if(dur>62) w.push('Video 60s se lamba hai — processing slow hoga aur phone ki memory full ho sakti hai. Short clip best hai.');
  if(Math.min(sw,sh)>1080) w.push('Input 1080p se bada hai — AI upscale skip ho sakta hai (GPU limit). Colour + export chalega.');
  $('fwarn').textContent=w.join(' '); $('fwarn').classList.toggle('hidden',!w.length);
  $('smooth').disabled = fps>40; if(fps>40) S.smooth=false, $('smooth').checked=false;
  for(const id of ['cv','tagL','tagR','hint','scrubRow']) $(id).classList.remove('hidden'); $('empty').classList.add('hidden');
  $('go').disabled=false;
  lookSmooth();
  await seekTo(Math.min(dur*.3, 2));
}
function seekTo(t){ return new Promise(res=>{ const done=()=>{ vid.removeEventListener('seeked',done); res(); preview(); }; vid.addEventListener('seeked',done); vid.currentTime=t; $('scrubO').textContent=t.toFixed(1)+'s'; }); }

// ---------------------------------------------------------------- preview
let pv=false;
function preview(){ if(pv||!S.info||S.busy) return; pv=true; requestAnimationFrame(async()=>{ pv=false; try{
  if((S.mode==='ai'||S.mode==='max')&&GPU.ok) await loadA4K();
  const {sw,sh}=S.info; const [W,H]=outDims(sw,sh); if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
  if(vid.readyState<2){ setTimeout(preview,150); return; }
  let src=vid;
  try{ const g=processFrame(src,sw,sh,W,H,vid.currentTime); present(g,g,1,S.split); } finally { if(src!==vid) src.close(); }
  pvErr=0; syncNote();
 }catch(e){ console.error(e); if(++pvErr<4) setTimeout(preview,300); else $('modeNote').textContent='⚠️ '+e.message; } }); }
let pvErr=0;

// ---------------------------------------------------------------- export
async function* framesDecode(info){ const dm=info.dm; const q=[]; let wake=null, err=null, done=false, flushing=false, si=0;
  const ping=()=>{ if(wake){ const w=wake; wake=null; w(); } };
  const dec=new VideoDecoder({output:f=>{q.push(f); ping();}, error:e=>{err=e; ping();}}); dec.configure(info.dm.vcfg);
  const ss=dm.vs;
  try{ while(true){ if(err) throw err; if(S.cancel) break;
    while(si<ss.length && dec.decodeQueueSize<6 && q.length<4){ const s=ss[si++]; dec.decode(new EncodedVideoChunk({type:s.is_sync?'key':'delta',timestamp:Math.round(s.cts*1e6/s.timescale),duration:Math.round(s.duration*1e6/s.timescale),data:s.data})); }
    if(si>=ss.length && !flushing){ flushing=true; dec.flush().then(()=>{done=true;ping();},e=>{err=e;ping();}); }
    if(q.length){ const f=q.shift(); yield {src:f,ts:f.timestamp,close:()=>f.close()}; continue; }
    if(done) break; await new Promise(r=>{ wake=r; setTimeout(r,50); }); }
  } finally { while(q.length) q.shift().close(); try{ dec.close(); }catch(e){} } }
async function* framesSeek(info){ const n=Math.max(1,Math.floor(info.dur*info.fps)); for(let i=0;i<n&&!S.cancel;i++){ const t=(i+.5)/info.fps; await new Promise(r=>{ vid.addEventListener('seeked',r,{once:true}); vid.currentTime=Math.min(t,info.dur-.001); }); yield {src:vid,ts:Math.round(i*1e6/info.fps),close:()=>{}}; } }

async function pickCodec(W,H,fps,bitrate){ const big=W*H; const list= big>2560*1600 ? ['avc1.640034','avc1.640033','avc1.4d0034'] : big>1920*1200 ? ['avc1.640032','avc1.640033','avc1.640034'] : ['avc1.640028','avc1.64002a','avc1.640032','avc1.4d0028'];
  for(const codec of list){ const cfg={codec,width:W,height:H,bitrate,framerate:fps,avc:{format:'avc'}}; try{ if((await VideoEncoder.isConfigSupported(cfg)).supported) return cfg; }catch(e){} } return null; }

async function exportVideo(){
  const info=S.info; if(!info||S.busy) return; S.busy=true; S.cancel=false;
  const ui=(on)=>{ $('prog').classList.toggle('hidden',!on); $('go').disabled=on; };
  ui(true); $('done').classList.add('hidden'); setProg(0,'','Shuru…');
  const t0=performance.now(); let stats=null;
  try{
    if(!window.VideoEncoder) throw new Error('Is browser me HD export support nahi hai. Chrome (Android/PC) latest use karo.');
    if((S.mode==='ai'||S.mode==='max')&&GPU.ok) await loadA4K();
    const {sw,sh}=info; const [W,H]=outDims(sw,sh); cv.width=W; cv.height=H;
    const smooth=S.smooth&&info.fps<=40; const outFps=smooth?info.fps*2:info.fps;
    const bitrate=Math.min(60e6,Math.round(W*H*outFps*(S.qual==='high'?.16:.09)));
    const vcfg=await pickCodec(W,H,outFps,bitrate); if(!vcfg) throw new Error(`Tera browser ${W}×${H} H.264 export nahi kar sakta. Chhota resolution (1080p) choose karo.`);
    // audio
    const dm=info.dm; let audio=null;
    if(dm&&dm.a&&dm.as.length&&String(dm.a.codec).startsWith('mp4a')&&dm.adesc) audio={kind:'copy',codec:'aac',ch:dm.a.audio.channel_count,sr:dm.a.audio.sample_rate};
    let pcm=null;
    if(!audio){ try{ const ac=new (window.AudioContext||window.webkitAudioContext)({sampleRate:48000}); pcm=await ac.decodeAudioData(info.buf.slice(0)); ac.close();
        if(pcm&&window.AudioEncoder){ const ch=Math.min(2,pcm.numberOfChannels); const sup=await AudioEncoder.isConfigSupported({codec:'mp4a.40.2',sampleRate:48000,numberOfChannels:ch,bitrate:160000}).catch(()=>({supported:false}));
          audio={kind:'enc',codec:sup.supported?'aac':'opus',ch,sr:48000}; } }catch(e){ pcm=null; } }
    const target=new ArrayBufferTarget();
    const muxer=new Muxer({target,video:{codec:'avc',width:W,height:H,frameRate:Math.round(outFps)},audio:audio?{codec:audio.codec,numberOfChannels:audio.ch,sampleRate:audio.sr}:undefined,fastStart:'in-memory',firstTimestampBehavior:'offset'});
    let encErr=null; const enc=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m),error:e=>encErr=e}); enc.configure(vcfg);
    const totalIn=Math.max(1,Math.round(info.dur*info.fps)); const total=smooth?totalIn*2:totalIn; let nOut=0,nIn=0,prevG=null,prevTs=0,t00=null;
    const gop=Math.round(outFps*2);
    const emit=async(ts,dur)=>{ while(enc.encodeQueueSize>4){ await new Promise(r=>setTimeout(r,4)); } if(encErr) throw encErr;
      const f=new VideoFrame(cv,{timestamp:ts,duration:dur}); enc.encode(f,{keyFrame:nOut%gop===0}); f.close(); nOut++; };
    const src= info.canDec ? framesDecode(info) : framesSeek(info);
    const fdur=Math.round(1e6/outFps);
    for await (const fr of src){ if(S.cancel) { fr.close(); break; }
      if(t00===null) t00=fr.ts; const ts=fr.ts-t00;
      const g=processFrame(fr.src,sw,sh,W,H,ts/1e6); fr.close();
      // ping-pong keep current graded frame
      const cur=tex(nIn%2?'G1':'G0',W,H); fbo(cur); gl.bindFramebuffer(gl.READ_FRAMEBUFFER,g.fb); gl.blitFramebuffer(0,0,W,H,0,0,W,H,gl.COLOR_BUFFER_BIT,gl.NEAREST);
      if(smooth&&prevG){ present(prevG,cur,.5,-1); await emit(Math.round((prevTs+ts)/2),fdur); }
      present(cur,cur,1,-1); await emit(ts,fdur);
      prevG=cur; prevTs=ts; nIn++;
      if(nIn%3===0){ const el=(performance.now()-t0)/1000; const pct=Math.min(.99,nOut/total); setProg(pct,`${(nIn/el).toFixed(1)} fps`,`ETA ${fmt(el/pct-el)}`); await new Promise(r=>setTimeout(r,0)); }
    }
    if(S.cancel) throw new Error('cancelled');
    if(smooth&&prevG){ present(prevG,prevG,1,-1); await emit(prevTs+fdur,fdur); }
    setProg(.995,'','Finishing…'); await enc.flush(); if(encErr) throw encErr; enc.close();
    if(audio&&audio.kind==='copy'){ let first=true; for(const s of dm.as){ const ts=Math.round(s.cts*1e6/s.timescale), d=Math.round(s.duration*1e6/s.timescale);
        muxer.addAudioChunkRaw(new Uint8Array(s.data),'key',ts,d, first?{decoderConfig:{codec:dm.a.codec,sampleRate:audio.sr,numberOfChannels:audio.ch,description:dm.adesc}}:undefined); first=false; } }
    else if(audio&&audio.kind==='enc'&&pcm){ await encodePcm(pcm,audio,muxer); }
    muxer.finalize();
    const blob=new Blob([target.buffer],{type:'video/mp4'}); const el=(performance.now()-t0)/1000;
    stats={W,H,frames:nOut,inFrames:nIn,secs:el,fpsProc:nIn/el,size:blob.size,mode:effMode(),gpu:GPU.ok,codec:vcfg.codec,audio:audio?audio.kind+':'+audio.codec:'none',outFps};
    S.lastBlob=blob; S.lastStats=stats;
    const url=URL.createObjectURL(blob); const name=(S.file.name.replace(/\.[^.]+$/,'')||'video')+`_HX_${H>W?W:H}p.mp4`;
    $('dl').href=url; $('dl').download=name; $('outv').src=url;
    $('doneInfo').textContent=`✅ Ready! ${W}×${H} · ${outFps.toFixed(0)}fps · ${(blob.size/1048576).toFixed(1)} MB · ${fmt(el)} me bana`;
    $('done').classList.remove('hidden'); setProg(1,'','Done ✅');
  }catch(e){ console.error(e); if(String(e.message)!=='cancelled') alert('Export fail: '+e.message); S.lastError=String(e&&e.message||e); }
  finally{ S.busy=false; ui(false); preview(); }
  return stats;
}
async function encodePcm(pcm,audio,muxer){ let err=null; const ae=new AudioEncoder({output:(c,m)=>muxer.addAudioChunk(c,m),error:e=>err=e});
  ae.configure({codec:audio.codec==='aac'?'mp4a.40.2':'opus',sampleRate:audio.sr,numberOfChannels:audio.ch,bitrate:160000});
  const n=pcm.length, step=4800; for(let i=0;i<n;i+=step){ const len=Math.min(step,n-i); const data=new Float32Array(len*audio.ch);
    for(let c=0;c<audio.ch;c++) data.set(pcm.getChannelData(Math.min(c,pcm.numberOfChannels-1)).subarray(i,i+len),c*len);
    const ad=new AudioData({format:'f32-planar',sampleRate:audio.sr,numberOfFrames:len,numberOfChannels:audio.ch,timestamp:Math.round(i*1e6/audio.sr),data}); ae.encode(ad); ad.close();
    if(ae.encodeQueueSize>20) await new Promise(r=>setTimeout(r,2)); }
  await ae.flush(); ae.close(); if(err) throw err; }
const fmt=(s)=>!isFinite(s)?'…':s<60?`${Math.round(s)}s`:`${Math.floor(s/60)}m ${Math.round(s%60)}s`;
function setProg(p,fps,eta){ $('barI').style.width=(p*100).toFixed(1)+'%'; $('pPct').textContent=Math.floor(p*100)+'%'; $('pFps').textContent=fps; $('pEta').textContent=eta; }

// ---------------------------------------------------------------- Auto Pro
function autoPro(){ if(!S.info) return; const c=document.createElement('canvas'); c.width=96; c.height=54; const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(vid,0,0,96,54);
  const d=x.getImageData(0,0,96,54).data; const L=[]; let r=0,g=0,b=0,ml=0; const n=d.length/4;
  for(let i=0;i<d.length;i+=4){ const R=d[i]/255,G=d[i+1]/255,B=d[i+2]/255; r+=R; g+=G; b+=B; L.push(.2126*R+.7152*G+.0722*B); }
  L.sort((a,b)=>a-b); const lo=clamp(L[Math.floor(n*.01)],0,.12)*.8, hi=clamp(L[Math.floor(n*.995)],.75,1); r/=n; g/=n; b/=n;
  for(const l of L){ const v=clamp((l-lo)/(hi-lo),0,1); ml+=Math.pow(v,2.2); } ml/=n;
  const A={lo,hi,exp:clamp(Math.log2(.2/Math.max(ml,1e-3))*.6,-1,1),temp:clamp((b-r)*1.5,-.35,.35),tint:clamp((g-(r+b)/2)*2,-.25,.25),clar:.25,sharp:.2,vib:.15};
  resetGrade('insta'); S.auto=A; syncUI(); preview(); }
function resetGrade(k){ S.preset=k; S.intensity=1; S.look=null; S.ov=null; const it=$('intensity'); if(it){ it.value=100; it.nextElementSibling.textContent='100%'; } S.user={...N}; S.auto=null; S.curves={m:[0,0,0],r:[0,0,0],g:[0,0,0],b:[0,0,0]}; S.hsl={h:[0,0,0,0,0,0],s:[0,0,0,0,0,0],l:[0,0,0,0,0,0]}; }
function setPreset(k){ resetGrade(k); syncUI(); preview(); }

// ---------------------------------------------------------------- one-click looks (combo presets)
const LOOKS = {
  ffdark:{n:'🔴 FF Dark Red',hint:'Dark red moody — FF India style',sw:'#000,#7a0a0a,#ff2a2a',base:'moody',I:.7,
    zero:['grain','sat','lift','fade','skin'],sS:[.68,.42,.4],sH:[.64,.47,.42],lk:[[1,.12,.06],[1,.08,.18]],
    user:{con:.32,exp:-.18,sharp:.18,bloom:.45,vig:.7,leak:.22,vib:.1,clar:.15},
    curves:{m:[-1,-.25,.1],r:[.45,.45,.15],g:[-.3,-.35,-.1],b:[-.25,-.35,-.1]}, hsl:{h:[0,-.25,0,0,0,0],s:[.4,-.25,-.55,-.5,-.45,0],l:[0,-.15,-.25,-.1,-.1,0]}},
  ffbright:{n:'☀️ FF Bright HDR',hint:'Bright clean HDR — sky pop, crisp gameplay',sw:'#3aa0ff,#cfe3ff,#ffd27f',base:'insta',I:.7,
    zero:['vig','grain'],
    user:{sat:.1,vib:.42,sharp:.25,clar:.15,exp:.3,sh:.18,con:.05},
    curves:{m:[0,0,0],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,-.05,.03,0],s:[0,0,.1,.25,.4,0],l:[0,0,0,0,-.08,0]}},
};
function applyLook(k){ const L=LOOKS[k]; resetGrade(L.base); S.look=k; S.intensity=L.I;
  S.ov={zero:L.zero||[],sS:L.sS,sH:L.sH,lk:L.lk}; Object.assign(S.user,L.user);
  S.curves=JSON.parse(JSON.stringify(L.curves)); S.hsl=JSON.parse(JSON.stringify(L.hsl));
  S.mode=S.gpuOK?'ai':'fast'; S.res=1080; S.qual='high'; lookSmooth();
  const it=$('intensity'); it.value=Math.round(L.I*100); it.nextElementSibling.textContent=it.value+'%';
  syncUI(); preview(); }
function lookSmooth(){ if(!S.look) return; const on=!!(S.info&&S.info.fps<=31); S.smooth=on; const c=$('smooth'); if(c) c.checked=on; }

// ---------------------------------------------------------------- UI
function slider(host,key,label,min,max,get,set){ const l=document.createElement('label'); l.className='sl';
  l.innerHTML=`${label}<input type="range" min="${min*100}" max="${max*100}" value="${get()*100}"><output>${Math.round(get()*100)}</output>`;
  const i=l.querySelector('input'), o=l.querySelector('output'); i.oninput=()=>{ set(i.value/100); o.textContent=i.value; preview(); }; l._sync=()=>{ i.value=get()*100; o.textContent=Math.round(get()*100); }; host.appendChild(l); return l; }
const syncers=[];
function buildUI(){
  const lk=$('looks'); for(const k in LOOKS){ const L=LOOKS[k]; const b=document.createElement('button'); b.className='look'; b.dataset.k=k; b.innerHTML=`<i style="background:linear-gradient(135deg,${L.sw})"></i><span><b>${L.n}</b><small>${L.hint}</small></span>`; b.onclick=()=>applyLook(k); lk.appendChild(b); }
  const chips=$('chips'); for(const k in PRESETS){ const p=PRESETS[k]; const b=document.createElement('button'); b.className='chip'; b.dataset.k=k; b.innerHTML=`<i style="background:linear-gradient(135deg,${p.sw})"></i>${p.n}`; b.onclick=()=>setPreset(k); chips.appendChild(b); }
  for(const [k,n,a,b] of FINE) syncers.push(slider($('fine'),k,n,a,b,()=>S.user[k],v=>S.user[k]=v));
  for(const [k,n,a,b] of FX) syncers.push(slider($('fx'),k,n,a,b,()=>S.user[k],v=>S.user[k]=v));
  const ch=[['m','Master'],['r','Red'],['g','Green'],['b','Blue']]; const cc=$('curveCh');
  ch.forEach(([k,n])=>{ const b=document.createElement('button'); b.textContent=n; b.dataset.k=k; b.onclick=()=>{ S.curveCh=k; syncUI(); }; cc.appendChild(b); });
  ['Shadows','Mids','Highlights'].forEach((n,i)=>syncers.push(slider($('curveS'),'c'+i,n,-1,1,()=>S.curves[S.curveCh][i],v=>S.curves[S.curveCh][i]=v)));
  const bands=['Red','Yellow','Green','Cyan','Blue','Magenta']; const hb=$('hslB');
  bands.forEach((n,i)=>{ const b=document.createElement('button'); b.textContent=n; b.dataset.k=i; b.onclick=()=>{ S.hslBand=i; syncUI(); }; hb.appendChild(b); });
  [['h','Hue'],['s','Saturation'],['l','Luminance']].forEach(([k,n])=>syncers.push(slider($('hslS'),k,n,-1,1,()=>S.hsl[k][S.hslBand],v=>S.hsl[k][S.hslBand]=v)));
  const res=$('res'); [[1080,'1080p'],[1440,'1440p (2K)'],[2160,'4K']].forEach(([v,n])=>{ const b=document.createElement('button'); b.textContent=n; b.dataset.k=v; b.onclick=()=>{ S.res=v; syncUI(); preview(); }; res.appendChild(b); });
  const q=$('qual'); [['high','💎 High quality'],['small','📦 Smaller file']].forEach(([v,n])=>{ const b=document.createElement('button'); b.textContent=n; b.dataset.k=v; b.onclick=()=>{ S.qual=v; syncUI(); }; q.appendChild(b); });
  document.querySelectorAll('#modes .opt').forEach(b=>b.onclick=()=>{ if(b.disabled) return; S.mode=b.dataset.m; syncUI(); preview(); });
  const it=$('intensity'); it.oninput=()=>{ S.intensity=it.value/100; it.nextElementSibling.textContent=it.value+'%'; preview(); };
  $('auto').onclick=autoPro; $('reset').onclick=()=>{ S.look=null; S.ov=null; S.user={...N}; S.auto=null; S.intensity=1; S.curves={m:[0,0,0],r:[0,0,0],g:[0,0,0],b:[0,0,0]}; S.hsl={h:[0,0,0,0,0,0],s:[0,0,0,0,0,0],l:[0,0,0,0,0,0]}; syncUI(); preview(); };
  $('pick').onclick=()=>$('file').click();
  $('file').onchange=async()=>{ const f=$('file').files[0]; if(!f) return; try{ await loadFile(f); }catch(e){ alert(e.message); } };
  $('smooth').onchange=()=>{ S.smooth=$('smooth').checked; };
  $('go').onclick=exportVideo; $('cancel').onclick=()=>{ S.cancel=true; };
  $('scrub').oninput=()=>{ if(S.info) seekTo(S.info.dur*$('scrub').value/1000); };
  const st=$('stage'); let drag=false; const mv=(e)=>{ const r=cv.getBoundingClientRect(); S.split=clamp((e.clientX-r.left)/r.width,0,1); preview(); };
  st.onpointerdown=(e)=>{ if(!S.info) return; drag=true; st.setPointerCapture(e.pointerId); mv(e); }; st.onpointermove=(e)=>{ if(drag) mv(e); }; st.onpointerup=()=>drag=false;
}
function syncUI(){
  document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',b.dataset.k===S.preset));
  document.querySelectorAll('.look').forEach(b=>b.classList.toggle('on',b.dataset.k===S.look));
  { const ln=$('lookNote'); if(ln){ ln.classList.toggle('hidden',!S.look); if(S.look){ const m={ai:'🤖 AI HD 2x upscale (WebGPU)',fast:'⚡ Fast Enhance 2x upscale (is device pe WebGPU nahi)',max:'🔥 AI Max upscale',off:'🎨 Sirf Colour (upscale OFF)'}[S.mode];
    ln.textContent=`✅ ${LOOKS[S.look].n.replace(/^\S+ /,'')} set: ${m} + grade + effects + ${S.res}p${S.smooth?' + 60fps smooth':''}. Ab sirf Export dabao 👇`; } } }
  document.querySelectorAll('#modes .opt').forEach(b=>b.classList.toggle('on',b.dataset.m===S.mode));
  document.querySelectorAll('#curveCh button').forEach(b=>b.classList.toggle('on',b.dataset.k===S.curveCh));
  document.querySelectorAll('#hslB button').forEach(b=>b.classList.toggle('on',+b.dataset.k===S.hslBand));
  document.querySelectorAll('#res button').forEach(b=>b.classList.toggle('on',+b.dataset.k===S.res));
  document.querySelectorAll('#qual button').forEach(b=>b.classList.toggle('on',b.dataset.k===S.qual));
  $('intensity').value=S.intensity*100; $('intensity').nextElementSibling.textContent=Math.round(S.intensity*100)+'%';
  $('auto').textContent=S.auto?'✨ Auto Pro ON':'✨ Auto Pro'; syncers.forEach(s=>s._sync());
  const notes={fast:'⚡ Fast Enhance: 2x upscale + denoise + sharpen (WebGL). Sabse fast.',ai:'🤖 AI HD: neural-net 2x upscale on your GPU. Edges & text crisp.',max:'🔥 AI Max: heaviest neural net (4x GAN for ≤720p input). Bahut slow ho sakta hai — laptop/PC best.',off:'🎨 Sirf colour grade + effects, original resolution pe phir export size pe scale.'};
  syncNote();
}
function syncNote(){ const notes={fast:'⚡ Fast Enhance: 2x upscale + denoise + sharpen (WebGL). Sabse fast.',ai:'🤖 AI HD: neural-net 2x upscale on your GPU. Edges & text crisp.',max:'🔥 AI Max: heaviest neural net (4x GAN for ≤720p input). Bahut slow ho sakta hai — laptop/PC best.',off:'🎨 Sirf colour grade + effects, original resolution pe phir export size pe scale.'};
  $('modeNote').textContent=notes[S.mode]+((S.mode==='ai'||S.mode==='max')&&!GPU.ok?' (Is device pe WebGPU nahi mila — Fast Enhance use hoga.)':'');
}

async function boot(){
  P_DEN=prog(FS_DEN); P_UP=prog(FS_UP); P_GRADE=prog(FS_GRADE); P_OUT=prog(FS_OUT);
  buildUI(); syncUI();
  const ok=await gpuProbe(); S.gpuOK=ok;
  $('gpuPill').textContent= ok ? '✅ AI GPU (WebGPU) ready' : '⚡ WebGPU nahi — Fast Enhance mode';
  if(ok){ S.mode='ai'; } else { document.querySelectorAll('#modes .opt').forEach(b=>{ if(b.dataset.m==='ai'||b.dataset.m==='max') b.disabled=true; }); }
  syncUI();
}
window.HXapi={applyLook,LOOKS,loadFile,exportVideo,preview,autoPro,S,PRESETS,setPreset,setMode:(m)=>{S.mode=m;syncUI();preview();},seekTo,processFrame,present,cv,gpuReady:()=>GPU.ok};
boot().then(()=>{ window.HXready=true; });
