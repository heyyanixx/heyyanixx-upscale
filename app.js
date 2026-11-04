// HEYYANIXX Upscale — 100% client-side. Videos never leave the device.
// MP4 libs (~430 KB) load on demand — page start stays light on budget phones
let Muxer, ArrayBufferTarget, FSTarget, createFile, DataStream, MP4BoxBuffer, Endianness, libsP=null;
function libs(){ if(!libsP) libsP=Promise.all([import('./vendor/mp4-muxer.mjs'),import('./vendor/mp4box.all.mjs')]).then(([a,b])=>{ ({Muxer,ArrayBufferTarget}=a); FSTarget=a.FileSystemWritableFileStreamTarget; ({createFile,DataStream,MP4BoxBuffer,Endianness}=b); }).catch(e=>{ libsP=null; throw new Error('Video tools load nahi hue — internet check karke page refresh karo.'); }); return libsP; }

const $ = (id) => document.getElementById(id);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------------------------------------------------------------- presets
const N = { exp:0,con:0,sat:0,vib:0,temp:0,tint:0,hl:0,sh:0,lift:0,fade:0,clar:0,sharp:0,vig:0,bloom:0,grain:0,curve:0,to:0,split:0,skin:0,ca:0,leak:0,lb:0,mono:0,flick:0 };
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
const FX = [['flick','💡 Flicker (light)',0,1],['bloom','✨ Glow / bloom',0,1],['ca','🌈 Chromatic ab.',0,1],['leak','🟠 Light leak',0,1],['grain','🎞️ Film grain',0,1],['vig','⚫ Vignette',0,1],['fade','🌫️ Fade / matte',0,1],['lift','⬛ Lift blacks',0,.2],['lb','🎬 Letterbox',0,1],['skin','🙂 Skin protect',0,1]];
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
let gl = null; // created on first video load (keeps page start instant)
const GLOPT={ preserveDrawingBuffer:false, premultipliedAlpha:false, antialias:false, depth:false, stencil:false, powerPreference:'high-performance' };
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
// separable form of the same Catmull-Rom (identical maths, ~2.5x fewer fetches): X pass at source height into a float texture,
// then Y pass at output size with the same 2x2 anti-ringing clamp read from the source.
const FS_UPX = `#version 300 es
precision highp float; in vec2 v; out vec4 o; uniform sampler2D S;
vec4 cr(float t){ float t2=t*t,t3=t2*t; return vec4(-.5*t3+t2-.5*t, 1.5*t3-2.5*t2+1., -1.5*t3+2.*t2+.5*t, .5*t3-.5*t2); }
void main(){ ivec2 sz=textureSize(S,0); int mx=sz.x-1; int y=int(gl_FragCoord.y); float p=v.x*float(sz.x)-.5; float fp=floor(p); int ix=int(fp); vec4 w=cr(p-fp);
 vec3 c=texelFetch(S,ivec2(clamp(ix-1,0,mx),y),0).rgb*w.x+texelFetch(S,ivec2(clamp(ix,0,mx),y),0).rgb*w.y+texelFetch(S,ivec2(clamp(ix+1,0,mx),y),0).rgb*w.z+texelFetch(S,ivec2(clamp(ix+2,0,mx),y),0).rgb*w.w;
 o=vec4(c,1.); }`;
const FS_UPY = `#version 300 es
precision highp float; in vec2 v; out vec4 o; uniform sampler2D S; uniform sampler2D X;
vec4 cr(float t){ float t2=t*t,t3=t2*t; return vec4(-.5*t3+t2-.5*t, 1.5*t3-2.5*t2+1., -1.5*t3+2.*t2+.5*t, .5*t3-.5*t2); }
vec3 f(ivec2 p,ivec2 m){ return texelFetch(S,clamp(p,ivec2(0),m),0).rgb; }
void main(){ ivec2 sz=textureSize(S,0); ivec2 m=sz-1; vec2 p=v*vec2(sz)-.5; vec2 fp=floor(p); ivec2 ip=ivec2(fp); vec4 wy=cr(p.y-fp.y);
 int x=int(gl_FragCoord.x); int my=m.y;
 vec3 c=texelFetch(X,ivec2(x,clamp(ip.y-1,0,my)),0).rgb*wy.x+texelFetch(X,ivec2(x,clamp(ip.y,0,my)),0).rgb*wy.y+texelFetch(X,ivec2(x,clamp(ip.y+1,0,my)),0).rgb*wy.z+texelFetch(X,ivec2(x,clamp(ip.y+2,0,my)),0).rgb*wy.w;
 vec3 a=f(ip,m),b=f(ip+ivec2(1,0),m),d=f(ip+ivec2(0,1),m),e=f(ip+ivec2(1,1),m);
 vec3 cl=clamp(c,min(min(a,b),min(d,e)),max(max(a,b),max(d,e)));
 o=vec4(mix(c,cl,.6),1.); }`;
const FS_GRADE = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
uniform sampler2D T; uniform sampler2D B; uniform sampler2D LUT; uniform vec2 px; uniform float aspect, lodB, useLut, useClut, useBT; uniform sampler2D CL; uniform sampler2D BT;
uniform float uExp,uCon,uSat,uVib,uTemp,uTint,uHl,uSh,uLift,uFade,uClar,uSharp,uVig,uBloom,uGrain,uLo,uHi,uSplit,uSkin,uTO,uCurve,uCA,uLeak,uLB,uTime,uMono;
uniform vec3 uSS,uSH,uLkA,uLkB; uniform float uHH[6],uHS[6],uHL[6];
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 sm(vec2 uv){return texture(T,uv).rgb;}
vec3 sb(vec2 uv){return textureLod(B,uv,lodB).rgb;}
vec3 colorize(vec3 c){
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
 return c; }
vec3 clut(vec3 c){ float bz=c.b*63.; float b0=floor(bz); float f=bz-b0; float b1=min(b0+1.,63.); vec2 rg=c.rg*63.+.5;
 return mix(texture(CL,vec2((b0*64.+rg.x)/4096.,rg.y/64.)).rgb, texture(CL,vec2((b1*64.+rg.x)/4096.,rg.y/64.)).rgb, f); }
void main(){
 vec2 uv=v;
 if(uLB>0.&&(uv.y<uLB||uv.y>1.-uLB)){o=vec4(0,0,0,1);return;}
 vec2 d=uv-.5; vec3 c;
 if(uCA>0.){ vec2 off=d*uCA*.012; c=vec3(sm(uv+off).r,sm(uv).g,sm(uv-off).b);} else c=sm(uv);
 if(uSharp!=0.){ vec2 s=px*1.25; vec3 n=sm(uv+vec2(s.x,0.))+sm(uv-vec2(s.x,0.))+sm(uv+vec2(0.,s.y))+sm(uv-vec2(0.,s.y)); vec3 df=c-n*.25; c+=df*uSharp*2.2/(1.+length(df)*5.); }
 vec3 bl=vec3(0); float lb=luma(c);
 if(uClar!=0.||uBloom>0.){ if(useBT>.5){ vec4 q=texture(BT,uv); bl=q.rgb; lb=q.a; } else { vec3 b=vec3(0); float r1=.012;
 for(int i=0;i<8;i++){ float a=float(i)*.785398; vec3 s1=sb(uv+vec2(cos(a)*r1/aspect,sin(a)*r1)); vec3 s2=sb(uv+vec2(cos(a+.39)*r1*3./aspect,sin(a+.39)*r1*3.)); b+=s1; bl+=max(s1-.6,0.)+max(s2-.6,0.)*1.3; }
 b/=8.; bl/=8.; lb=luma(b); } }
 float lc=luma(c); if(uClar!=0.) c+=(lc-lb)*uClar*1.6*(1.-abs(lc*2.-1.)*.6);
 c = useClut>.5 ? clut(clamp(c,0.,1.)) : colorize(c);
 c=1.-(1.-clamp(c,0.,1.))*(1.-clamp(bl*uBloom*2.2,0.,1.));
 if(uLeak>0.){ float t=uTime*.15; vec2 a1=(uv-vec2(.1+.15*sin(t),.85+.1*cos(t*1.3)))*vec2(aspect,1.)/max(aspect,1.); vec2 a2=(uv-vec2(.95+.05*cos(t*.7),.2+.15*sin(t*.9)))*vec2(aspect,1.)/max(aspect,1.);
   vec3 lk=uLkA*exp(-dot(a1,a1)*5.)+uLkB*exp(-dot(a2,a2)*7.)*.8; c=1.-(1.-c)*(1.-clamp(lk*uLeak,0.,1.)); }
 c=c*(1.-uLift)+uLift; c=mix(c,c*.85+.06,uFade);
 float vr=length(d)*1.414; c*=mix(1.,1.-smoothstep(.45,1.2,vr),uVig);
 if(uGrain>0.){ vec2 fc=floor(gl_FragCoord.xy); float g=hash(fc+fract(uTime*7.31)*91.)+hash(fc*1.37+fract(uTime*3.7)*53.)-1.; c+=g*uGrain*.08*(1.-abs(luma(c)-.5)); }
 o=vec4(clamp(c,0.,1.),1.);
}`;
const FS_GRADE_F = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
uniform sampler2D T; uniform sampler2D B; uniform sampler2D LUT; uniform vec2 px; uniform float aspect, lodB, useLut, useClut, useBT; uniform sampler2D CL; uniform sampler2D BT;
uniform float uExp,uCon,uSat,uVib,uTemp,uTint,uHl,uSh,uLift,uFade,uClar,uSharp,uVig,uBloom,uGrain,uLo,uHi,uSplit,uSkin,uTO,uCurve,uCA,uLeak,uLB,uTime,uMono;
uniform vec3 uSS,uSH,uLkA,uLkB; uniform float uHH[6],uHS[6],uHL[6];
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 sm(vec2 uv){return texture(T,uv).rgb;}
vec3 sb(vec2 uv){return textureLod(B,uv,lodB).rgb;}
vec3 clut(vec3 c){ float bz=c.b*63.; float b0=floor(bz); float f=bz-b0; float b1=min(b0+1.,63.); vec2 rg=c.rg*63.+.5;
 return mix(texture(CL,vec2((b0*64.+rg.x)/4096.,rg.y/64.)).rgb, texture(CL,vec2((b1*64.+rg.x)/4096.,rg.y/64.)).rgb, f); }
void main(){
 vec2 uv=v;
 if(uLB>0.&&(uv.y<uLB||uv.y>1.-uLB)){o=vec4(0,0,0,1);return;}
 vec2 d=uv-.5; vec3 c;
 if(uCA>0.){ vec2 off=d*uCA*.012; c=vec3(sm(uv+off).r,sm(uv).g,sm(uv-off).b);} else c=sm(uv);
 if(uSharp!=0.){ vec2 s=px*1.25; vec3 n=sm(uv+vec2(s.x,0.))+sm(uv-vec2(s.x,0.))+sm(uv+vec2(0.,s.y))+sm(uv-vec2(0.,s.y)); vec3 df=c-n*.25; c+=df*uSharp*2.2/(1.+length(df)*5.); }
 vec3 bl=vec3(0); float lb=luma(c);
 if(useBT>.5){ vec4 q=texture(BT,uv); bl=q.rgb; lb=q.a; }
 float lc=luma(c); if(uClar!=0.) c+=(lc-lb)*uClar*1.6*(1.-abs(lc*2.-1.)*.6);
 c = clut(clamp(c,0.,1.));
 c=1.-(1.-clamp(c,0.,1.))*(1.-clamp(bl*uBloom*2.2,0.,1.));
 if(uLeak>0.){ float t=uTime*.15; vec2 a1=(uv-vec2(.1+.15*sin(t),.85+.1*cos(t*1.3)))*vec2(aspect,1.)/max(aspect,1.); vec2 a2=(uv-vec2(.95+.05*cos(t*.7),.2+.15*sin(t*.9)))*vec2(aspect,1.)/max(aspect,1.);
   vec3 lk=uLkA*exp(-dot(a1,a1)*5.)+uLkB*exp(-dot(a2,a2)*7.)*.8; c=1.-(1.-c)*(1.-clamp(lk*uLeak,0.,1.)); }
 c=c*(1.-uLift)+uLift; c=mix(c,c*.85+.06,uFade);
 float vr=length(d)*1.414; c*=mix(1.,1.-smoothstep(.45,1.2,vr),uVig);
 if(uGrain>0.){ vec2 fc=floor(gl_FragCoord.xy); float g=hash(fc+fract(uTime*7.31)*91.)+hash(fc*1.37+fract(uTime*3.7)*53.)-1.; c+=g*uGrain*.08*(1.-abs(luma(c)-.5)); }
 o=vec4(clamp(c,0.,1.),1.);
}`;
const FS_CLUT = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
uniform sampler2D T; uniform sampler2D B; uniform sampler2D LUT; uniform vec2 px; uniform float aspect, lodB, useLut, useClut, useBT; uniform sampler2D CL; uniform sampler2D BT;
uniform float uExp,uCon,uSat,uVib,uTemp,uTint,uHl,uSh,uLift,uFade,uClar,uSharp,uVig,uBloom,uGrain,uLo,uHi,uSplit,uSkin,uTO,uCurve,uCA,uLeak,uLB,uTime,uMono;
uniform vec3 uSS,uSH,uLkA,uLkB; uniform float uHH[6],uHS[6],uHL[6];
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 sm(vec2 uv){return texture(T,uv).rgb;}
vec3 sb(vec2 uv){return textureLod(B,uv,lodB).rgb;}
vec3 colorize(vec3 c){
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
 return c; }
void main(){ vec2 fc=floor(gl_FragCoord.xy); float bi=floor(fc.x/64.); float ri=fc.x-bi*64.; o=vec4(clamp(colorize(vec3(ri,fc.y,bi)/63.),0.,1.),1.); }
`;
const FS_BLUR = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
uniform sampler2D T; uniform sampler2D B; uniform sampler2D LUT; uniform vec2 px; uniform float aspect, lodB, useLut, useClut, useBT; uniform sampler2D CL; uniform sampler2D BT;
uniform float uExp,uCon,uSat,uVib,uTemp,uTint,uHl,uSh,uLift,uFade,uClar,uSharp,uVig,uBloom,uGrain,uLo,uHi,uSplit,uSkin,uTO,uCurve,uCA,uLeak,uLB,uTime,uMono;
uniform vec3 uSS,uSH,uLkA,uLkB; uniform float uHH[6],uHS[6],uHL[6];
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 sm(vec2 uv){return texture(T,uv).rgb;}
vec3 sb(vec2 uv){return textureLod(B,uv,lodB).rgb;}
void main(){ vec2 uv=v; vec3 b=vec3(0),bl=vec3(0); float r1=.012;
 for(int i=0;i<8;i++){ float a=float(i)*.785398; vec3 s1=sb(uv+vec2(cos(a)*r1/aspect,sin(a)*r1)); vec3 s2=sb(uv+vec2(cos(a+.39)*r1*3./aspect,sin(a+.39)*r1*3.)); b+=s1; bl+=max(s1-.6,0.)+max(s2-.6,0.)*1.3; }
 b/=8.; bl/=8.; o=vec4(bl,luma(b)); }
`;
const FS_OUT = `#version 300 es
precision highp float; in vec2 v; out vec4 o; uniform sampler2D A,B,Sr; uniform float w,split; uniform vec2 res;
void main(){ vec3 c=mix(texture(A,v).rgb,texture(B,v).rgb,w);
 if(split>=0.){ if(v.x<split) c=texture(Sr,v).rgb; if(abs(gl_FragCoord.x-split*res.x)<max(1.5,res.x*.0025)) c=vec3(.89,.71,.35); }
 o=vec4(c,1.); }`;

// shaders compile in the background (KHR_parallel_shader_compile) so the page never freezes while they build
let PSC=null;
function progStart(fs){ const p=gl.createProgram(); p.sh=[]; for(const [t,src] of [[gl.VERTEX_SHADER,VS],[gl.FRAGMENT_SHADER,fs]]){ const sh=gl.createShader(t); gl.shaderSource(sh,src); gl.compileShader(sh); gl.attachShader(p,sh); p.sh.push(sh); } gl.linkProgram(p); return p; }
function progEnd(p){ if(!gl.getProgramParameter(p,gl.LINK_STATUS)){ const m=p.sh.map(x=>gl.getShaderInfoLog(x)).join(' ')+gl.getProgramInfoLog(p); throw new Error(m); }
  p.u={}; const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS); for(let i=0;i<n;i++){ const a=gl.getActiveUniform(p,i); p.u[a.name.replace('[0]','')]=gl.getUniformLocation(p,a.name);} return p; }
function prog(fs){ return progEnd(progStart(fs)); }
const progReady=(p)=>!PSC||gl.getProgramParameter(p,PSC.COMPLETION_STATUS_KHR);
let P_DEN,P_UP,P_GRADE,P_OUT,P_CLUT,P_BLUR,P_GRADE_F,P_UPX,P_UPY, FLOATRT=false;
const T = {};
function tex(name,w,h,mip,hdr){ let t=T[name]; if(!t){ t=T[name]={t:gl.createTexture(),w:0,h:0,fb:null}; }
  gl.bindTexture(gl.TEXTURE_2D,t.t);
  if(w&&(t.w!==w||t.h!==h)){ if(hdr&&FLOATRT) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,w,h,0,gl.RGBA,gl.HALF_FLOAT,null); else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null); t.w=w;t.h=h; if(t.fb){gl.deleteFramebuffer(t.fb);t.fb=null;} }
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mip?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); return t; }
function upload(name,src,w,h){ const t=tex(name); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,src); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false); t.w=w;t.h=h; return t; }
function fbo(t){ if(!t.fb){ t.fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,t.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t.t,0);} gl.bindFramebuffer(gl.FRAMEBUFFER,t.fb); gl.viewport(0,0,t.w,t.h); }
function bindT(unit,t,loc){ gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,t.t); gl.uniform1i(loc,unit); }
function mip(t){ gl.bindTexture(gl.TEXTURE_2D,t.t); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR); gl.generateMipmap(gl.TEXTURE_2D); }
let lutTex=null;
let lutKey='';
function buildLut(){ const c=S.curves; const any=c.m.some(x=>x)||c.r.some(x=>x)||c.g.some(x=>x)||c.b.some(x=>x); if(!any) return false;
  const key=c.m.join()+'|'+c.r.join()+'|'+c.g.join()+'|'+c.b.join(); if(lutTex&&key===lutKey) return true; lutKey=key;
  const bump=(x,m,w)=>Math.exp(-((x-m)**2)/(2*w*w)); const f=(x,a)=>clamp(x+.18*(a[0]*bump(x,.2,.12)+a[1]*bump(x,.5,.15)+a[2]*bump(x,.8,.12)),0,1);
  const d=new Uint8Array(256*4); for(let i=0;i<256;i++){ const m=f(i/255,c.m); d[i*4]=f(m,c.r)*255; d[i*4+1]=f(m,c.g)*255; d[i*4+2]=f(m,c.b)*255; d[i*4+3]=255; }
  if(!lutTex) lutTex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,lutTex); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,256,1,0,gl.RGBA,gl.UNSIGNED_BYTE,d);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); return true; }

function params(){ const p=(S.ov&&S.ov.p)||PRESETS[S.preset]||{}; const I=S.intensity; const o={}; const ov=S.ov||{}; const z=ov.zero||[];
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
// live preview renders at a lighter size on weaker devices (what you see is the same grade); export is always full size
function previewDims(sw,sh){ const [W,H]=outDims(sw,sh); const cap={low:1280,mid:1920}[S.tier]||99999; const k=Math.min(1,cap/Math.max(W,H)); return k<1?[Math.floor(W*k/2)*2,Math.floor(H*k/2)*2]:[W,H]; }
function effMode(){ if((S.mode==='ai'||S.mode==='max')&&!GPU.ok) return 'fast'; return S.mode; }
// renders one source frame. target: texture name ('G','G0','G1') or 'screen' (straight into the canvas — no extra copy).
// Fast path (v4 perf): denoise at source res → ONE edge-aware bicubic pass straight to output size → fused grade pass.
// Blur (clarity/glow) taps read a mip chain of the small source-res texture instead of the big upscaled one.
let MAXT=0, frozenP=null;
function processFrame(src,sw,sh,W,H,time,target){
  const mode=effMode(); if(!MAXT) MAXT=gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const p=frozenP||params(); const needBlur=p.clar!==0||p.bloom>0;
  const tSrc=upload('src',src,sw,sh); let tIn=tSrc, tB=tSrc, lodH=sh, px=[1/(2*sw),1/(2*sh)];
  if(mode==='fast'){
    const tD=tex('den',sw,sh); fbo(tD); gl.useProgram(P_DEN); bindT(0,tSrc,P_DEN.u.S); gl.uniform1f(P_DEN.u.str,.07); gl.drawArrays(gl.TRIANGLES,0,3);
    if(W>sw && W<=MAXT && H<=MAXT){ const tU=tex('up',W,H);
      if(FLOATRT && S.sepUp!==false){ const tX=tex('upx',W,sh,false,true); fbo(tX); gl.useProgram(P_UPX); bindT(0,tD,P_UPX.u.S); gl.drawArrays(gl.TRIANGLES,0,3);
        fbo(tU); gl.useProgram(P_UPY); bindT(0,tD,P_UPY.u.S); bindT(1,tX,P_UPY.u.X); gl.drawArrays(gl.TRIANGLES,0,3); }
      else { fbo(tU); gl.useProgram(P_UP); bindT(0,tD,P_UP.u.S); gl.drawArrays(gl.TRIANGLES,0,3); }
      tIn=tU; if(needBlur) mip(tD); }
    else { mip(tD); tIn=tD; }
    tB=tD; lodH=sh/2;
  } else if(mode==='ai'||mode==='max'){
    gpuSetup(sw,sh,mode); const c=gpuRun(src,sw,sh); tIn=upload('gpu',c,GPU.ow,GPU.oh); mip(tIn); tB=tIn; lodH=tIn.h/2; px=[1/tIn.w,1/tIn.h];
  } else { if(W<sw||needBlur) mip(tSrc); lodH=sh/2; px=[1/sw,1/sh]; }
  // 1) colour pipeline → 64³ LUT, baked only when the grade changes (flicker: when its exposure step changes, ~10×/s) — not per pixel per frame.
  const fk=p.flick>0?(Math.abs(Math.sin(Math.floor(time*10)*12.9898+78.233)*43758.5453)%1-.5)*2*p.flick*.08:0;
  const hasLut=buildLut(); const useClut=S.fused!==false;
  if(useClut){ const key=fk+'|'+JSON.stringify(p)+'|'+lutKey+'|'+(hasLut?1:0)+'|'+S.hsl.h.join()+S.hsl.s.join()+S.hsl.l.join();
    if(key!==clutKey||!T.clut){ const tc=tex('clut',4096,64,false,true); fbo(tc); gl.useProgram(P_CLUT); setU(P_CLUT,p,fk,time,W,H,hasLut,tIn); gl.drawArrays(gl.TRIANGLES,0,3); clutKey=key; } }
  // 2) clarity/glow blur → quarter-size texture (it is a smooth, wide field), 16 taps there instead of at every output pixel
  const useBT=S.fused!==false && needBlur;
  if(useBT){ const tb=tex('blur',Math.max(2,W>>BLURSH),Math.max(2,H>>BLURSH),false,true); fbo(tb); gl.useProgram(P_BLUR); bindT(2,tB,P_BLUR.u.B); gl.uniform1f(P_BLUR.u.aspect,W/H); gl.uniform1f(P_BLUR.u.lodB,Math.max(0,Math.log2(.012*lodH))); gl.drawArrays(gl.TRIANGLES,0,3); }
  // 3) one fused pass: sharpen + clarity + LUT + glow + leak + lift/fade + vignette + grain
  let tG=null;
  if(target==='screen'){ gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,W,H); }
  else { tG=tex(target||'G',W,H); fbo(tG); }
  const PG=useClut?P_GRADE_F:P_GRADE; gl.useProgram(PG); const u=PG.u;
  bindT(0,tIn,u.T); bindT(2,tB,u.B);
  gl.uniform1f(u.useClut,useClut?1:0); if(useClut) bindT(3,T.clut,u.CL);
  gl.uniform1f(u.useBT,useBT?1:0); if(useBT) bindT(4,T.blur,u.BT);
  gl.uniform2f(u.px,px[0],px[1]); gl.uniform1f(u.lodB,Math.max(0,Math.log2(.012*lodH)));
  setU(PG,p,fk,time,W,H,hasLut,tIn);
  gl.drawArrays(gl.TRIANGLES,0,3);
  return tG;
}
let clutKey=''; let BLURSH=2;
function setU(P,p,fk,time,W,H,hasLut,tIn){ const u=P.u; const f=(n,x)=>{ if(u[n]) gl.uniform1f(u[n],x); };
  if(u.LUT){ gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,lutTex||tIn.t); gl.uniform1i(u.LUT,1); } f('useLut',hasLut?1:0); f('aspect',W/H);
  f('uExp',p.exp+fk); f('uCon',clamp(p.con,-1,1)); f('uSat',p.sat); f('uVib',p.vib); f('uTemp',p.temp); f('uTint',p.tint);
  f('uHl',p.hl); f('uSh',p.sh); f('uLift',clamp(p.lift,0,.3)); f('uFade',clamp(p.fade,0,1)); f('uClar',p.clar); f('uSharp',p.sharp);
  f('uVig',clamp(p.vig,0,1)); f('uBloom',Math.max(0,p.bloom)); f('uGrain',Math.max(0,p.grain)); f('uLo',p.lo); f('uHi',p.hi); f('uSplit',p.split);
  f('uSkin',clamp(p.skin,0,1)); f('uTO',p.to); f('uCurve',Math.max(0,p.curve)); f('uCA',Math.max(0,p.ca)); f('uLeak',Math.max(0,p.leak));
  f('uLB',lbBar(W,H,p.lb)); f('uTime',time); f('uMono',p.mono);
  if(u.uSS) gl.uniform3fv(u.uSS,p.sS); if(u.uSH) gl.uniform3fv(u.uSH,p.sH); if(u.uLkA) gl.uniform3fv(u.uLkA,p.lk[0]); if(u.uLkB) gl.uniform3fv(u.uLkB,p.lk[1]);
  if(u.uHH) gl.uniform1fv(u.uHH,S.hsl.h); if(u.uHS) gl.uniform1fv(u.uHS,S.hsl.s); if(u.uHL) gl.uniform1fv(u.uHL,S.hsl.l); }
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
  S.file=file; S.info=null; $('done').classList.add('hidden'); ensureGL().catch(e=>console.warn(e)); const libsReady=libs();
  if(vid.src&&vid.src.startsWith('blob:')) URL.revokeObjectURL(vid.src); vid.src=URL.createObjectURL(file);
  await new Promise((res,rej)=>{ vid.onloadedmetadata=res; vid.onerror=()=>rej(new Error('Ye video browser open nahi kar paaya (codec?). MP4 H.264 try karo.')); });
  const buf=await file.arrayBuffer(); await libsReady; const dm=await demux(buf);
  let canDec=false;
  if(dm&&!dm.rot&&window.VideoDecoder){ try{ dm.vcfg={codec:dm.v.codec,codedWidth:dm.v.video.width,codedHeight:dm.v.video.height,description:dm.desc||undefined}; canDec=(await VideoDecoder.isConfigSupported(dm.vcfg)).supported; }catch(e){ canDec=false; } }
  const sw=vid.videoWidth, sh=vid.videoHeight, dur=vid.duration;
  const fps = dm&&dm.fps>5&&dm.fps<121 ? dm.fps : 30;
  S.info={sw,sh,dur,fps,dm,canDec,buf};
  $('finfo').innerHTML=`✅ <b>${file.name.slice(0,40)}</b> — ${sw}×${sh}, ${dur.toFixed(1)}s, ${fps.toFixed(fps%1?2:0)} fps${dm&&dm.a?', audio ✓':''}`;
  const w=[]; if(dur>62) w.push(diskOK() ? 'Video 60s se lamba hai — export slow hoga. Output seedha device storage pe likha jayega (RAM full nahi hogi).' : 'Video 60s se lamba hai — processing slow hoga aur is browser me output memory (RAM) me banta hai, phone ki memory full ho sakti hai. Short clip best hai (ya Chrome/Edge latest use karo).'); else if(dur>30 && S.tier==='low') w.push('Low device: is clip ke export me kuch minute lagenge — progress me ETA dikhega, screen ON rahegi.');
  if(Math.max(sw,sh)>=3000) w.push('4K input — phone pe memory heavy. Agar hang ho to 1080p clip use karo.');
  if(Math.min(sw,sh)>1080) w.push('Input 1080p se bada hai — AI upscale skip ho sakta hai (GPU limit). Colour + export chalega.');
  $('fwarn').textContent=w.join(' '); $('fwarn').classList.toggle('hidden',!w.length);
  $('smooth').disabled = fps>40; if(fps>40) S.smooth=false, $('smooth').checked=false;
  else if(S.tier==='high' && !S.smoothTouched && !S.look){ S.smooth=fps<=31; $('smooth').checked=S.smooth; }
  for(const id of ['cv','tagL','tagR','hint','scrubRow']) $(id).classList.remove('hidden'); $('empty').classList.add('hidden');
  $('go').disabled=false;
  lookSmooth();
  await seekTo(Math.min(dur*.3, 2));
  window.dispatchEvent(new Event('hx:loaded'));
}
function seekTo(t){ return new Promise(res=>{ const done=()=>{ vid.removeEventListener('seeked',done); res(); preview(); }; vid.addEventListener('seeked',done); vid.currentTime=t; $('scrubO').textContent=t.toFixed(1)+'s'; }); }

// ---------------------------------------------------------------- preview
let pv=false;
function preview(){ if(pv||!S.info||S.busy) return; pv=true; requestAnimationFrame(async()=>{ pv=false; try{
  await ensureGL();
  if((S.mode==='ai'||S.mode==='max')&&GPU.ok) await loadA4K();
  if(S.busy) return; // an export started while we were waiting — never resize its canvas
  const {sw,sh}=S.info; const [W,H]=previewDims(sw,sh); if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
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
  // hardware encoder first (phones/iGPUs: much faster, frees the CPU for processing), then software
  const hws = S._noHW ? ['no-preference'] : ['prefer-hardware','no-preference'];
  for(const hw of hws) for(const codec of list){ const cfg={codec,width:W,height:H,bitrate,bitrateMode:'variable',framerate:fps,hardwareAcceleration:hw,latencyMode:'quality',avc:{format:'avc'}}; try{ if((await VideoEncoder.isConfigSupported(cfg)).supported) return cfg; }catch(e){} } return null; }

// screen wake lock — phone screen stays on while exporting
let wakeLock=null;
async function wake(on){ try{ if(on){ if('wakeLock' in navigator && !wakeLock){ wakeLock=await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release',()=>{ wakeLock=null; }); } } else if(wakeLock){ await wakeLock.release(); wakeLock=null; } }catch(e){ wakeLock=null; } }
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible'&&S.busy) wake(true); });
function exportBitrate(W,H,fps){ const base=W*H*fps*(S.qual==='high'?.16:.09); const minSide=Math.min(W,H);
  const floor= S.qual==='high' ? (minSide>=2160?40e6:minSide>=1440?24e6:minSide>=1080?12e6:minSide>=720?8e6:4e6) : 0;
  return Math.round(Math.min(60e6,Math.max(base,floor))); }

async function exportVideo(){
  if((!window.VideoEncoder||!window.VideoFrame||S.forceRT) && rtOK()) return exportRealtime(); // Safari/old browsers: real-time fallback
  const info=S.info; if(!info||S.busy) return; S.busy=true; S.cancel=false; document.body.classList.add('hx-busy');
  const ui=(on)=>{ $('prog').classList.toggle('hidden',!on); $('go').disabled=on; };
  ui(true); $('done').classList.add('hidden'); setProg(0,'','Shuru…'); wake(true);
  const t0=performance.now(); let stats=null, vcfg=null, retryHW=false, enc=null, disk=null, noAudio=false;
  try{
    if(!window.VideoEncoder||!window.VideoFrame){
      throw new Error('Is browser me video export support nahi hai. Chrome / Edge (Android ya PC) ka latest version use karo. iPhone pe iOS 17+ (Safari) chahiye.'); }
    await Promise.all([ensureGL(),libs()]); if((S.mode==='ai'||S.mode==='max')&&GPU.ok) await loadA4K();
    const {sw,sh}=info; const [W,H]=outDims(sw,sh); cv.width=W; cv.height=H;
    const smooth=S.smooth&&info.fps<=40; const outFps=smooth?info.fps*2:info.fps;
    const bitrate=exportBitrate(W,H,outFps);
    vcfg=await pickCodec(W,H,outFps,bitrate); if(!vcfg) throw new Error(`Tera browser ${W}×${H} H.264 export nahi kar sakta. Chhota resolution (1080p) choose karo.`);
    // audio
    const dm=info.dm; let audio=null;
    if(dm&&dm.a&&dm.as.length&&String(dm.a.codec).startsWith('mp4a')&&dm.adesc) audio={kind:'copy',codec:'aac',ch:dm.a.audio.channel_count,sr:dm.a.audio.sample_rate};
    let pcm=null;
    if(!audio){ try{ const ac=new (window.AudioContext||window.webkitAudioContext)({sampleRate:48000}); pcm=await ac.decodeAudioData(info.buf.slice(0)); ac.close();
        if(pcm&&window.AudioEncoder){ const ch=Math.min(2,pcm.numberOfChannels); const sup=await AudioEncoder.isConfigSupported({codec:'mp4a.40.2',sampleRate:48000,numberOfChannels:ch,bitrate:160000}).catch(()=>({supported:false}));
          audio={kind:'enc',codec:sup.supported?'aac':'opus',ch,sr:48000}; } }catch(e){ pcm=null; } }
    if(!audio && dm && dm.a) noAudio=true; // source has sound but this browser can't re-encode it
    // long clips / big files: write encoded chunks straight to on-device storage (OPFS) instead of RAM, where the browser supports it
    const estBytes=bitrate/8*info.dur+4e6;
    if(diskOK() && FSTarget && (S.forceDisk || info.dur>60 || estBytes>180e6)){ try{ disk=await openDisk(); }catch(e){ console.warn('opfs',e); disk=null; } }
    const target= disk ? new FSTarget(disk.ws,{chunkSize:8*1024*1024}) : new ArrayBufferTarget();
    const muxer=new Muxer({target,video:{codec:'avc',width:W,height:H,frameRate:Math.round(outFps)},audio:audio?{codec:audio.codec,numberOfChannels:audio.ch,sampleRate:audio.sr}:undefined,fastStart:disk?false:'in-memory',firstTimestampBehavior:'offset'});
    let encErr=null; enc=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m),error:e=>encErr=e}); enc.configure(vcfg);
    frozenP=params(); // grade is fixed for the whole export (no per-frame object churn)
    const totalIn=Math.max(1,Math.round(info.dur*info.fps)); const total=smooth?totalIn*2:totalIn; let nOut=0,nIn=0,prevG=null,prevTs=0,t00=null;
    const gop=Math.round(outFps*2); const QMAX=S.tier==='low'?2:S.tier==='high'?6:4;
    // backpressure: wait for the encoder BEFORE drawing, so the canvas is read in the same task it was drawn
    const room=async()=>{ while(enc.encodeQueueSize>QMAX){ await new Promise(r=>setTimeout(r,4)); } if(encErr) throw encErr; };
    const emit=(ts,dur)=>{ const f=new VideoFrame(cv,{timestamp:ts,duration:dur}); enc.encode(f,{keyFrame:nOut%gop===0}); f.close(); nOut++; };
    const src= info.canDec ? framesDecode(info) : framesSeek(info);
    const direct=effMode()==='fast'||effMode()==='off'; // AI path: WebGPU→WebGL hand-off, keep the proven texture→present route
    const fdur=Math.round(1e6/outFps); let lastY=performance.now(), lastP=0; const win=[];
    for await (const fr of src){ if(S.cancel) { fr.close(); break; }
      if(t00===null) t00=fr.ts; const ts=fr.ts-t00;
      if(!smooth){ await room(); if(direct){ processFrame(fr.src,sw,sh,W,H,ts/1e6,'screen'); fr.close(); } else { const g=processFrame(fr.src,sw,sh,W,H,ts/1e6,'G'); fr.close(); present(g,g,1,-1); } emit(ts,fdur); }
      else { const cur=processFrame(fr.src,sw,sh,W,H,ts/1e6,nIn%2?'G1':'G0'); fr.close();
        if(prevG){ await room(); present(prevG,cur,.5,-1); emit(Math.round((prevTs+ts)/2),fdur); }
        await room(); present(cur,cur,1,-1); emit(ts,fdur); prevG=cur; }
      prevTs=ts; nIn++;
      const now=performance.now();
      if(now-lastP>350){ lastP=now; win.push([now,nIn]); while(win.length>8) win.shift(); const el=(now-t0)/1000; const pct=Math.min(.99,nOut/total);
        const fpsNow=win.length>1?(win[win.length-1][1]-win[0][1])/((win[win.length-1][0]-win[0][0])/1000):nIn/el; const left=(totalIn-nIn)/Math.max(.01,fpsNow);
        setProg(pct,`${fpsNow.toFixed(1)} fps`,`ETA ${fmt(left)}`); }
      if(now-lastY>40){ lastY=now; await new Promise(r=>setTimeout(r,0)); } // keep taps/scroll responsive
    }
    if(S.cancel) throw new Error('cancelled');
    if(smooth&&prevG){ await room(); present(prevG,prevG,1,-1); emit(prevTs+fdur,fdur); }
    setProg(.995,'','Finishing…'); await enc.flush(); if(encErr) throw encErr; enc.close(); enc=null;
    if(audio&&audio.kind==='copy'){ let first=true; for(const s of dm.as){ const ts=Math.round(s.cts*1e6/s.timescale), d=Math.round(s.duration*1e6/s.timescale);
        muxer.addAudioChunkRaw(new Uint8Array(s.data),'key',ts,d, first?{decoderConfig:{codec:dm.a.codec,sampleRate:audio.sr,numberOfChannels:audio.ch,description:dm.adesc}}:undefined); first=false; } }
    else if(audio&&audio.kind==='enc'&&pcm){ await encodePcm(pcm,audio,muxer); }
    muxer.finalize();
    let blob; if(disk){ await disk.ws.close(); blob=await disk.h.getFile(); S.lastDiskName=disk.name; disk=null; } else blob=new Blob([target.buffer],{type:'video/mp4'});
    const el=(performance.now()-t0)/1000;
    stats={W,H,frames:nOut,inFrames:nIn,secs:el,fpsProc:nIn/el,size:blob.size,mode:effMode(),gpu:GPU.ok,codec:vcfg.codec,hw:vcfg.hardwareAcceleration,bitrate,tier:S.tier,audio:audio?audio.kind+':'+audio.codec:'none',outFps,disk:!!S.lastDiskName&&blob instanceof File};
    if(S.lastUrl) URL.revokeObjectURL(S.lastUrl);
    S.lastBlob=blob; S.lastStats=stats;
    const url=URL.createObjectURL(blob); S.lastUrl=url; const name=(S.file.name.replace(/\.[^.]+$/,'')||'video')+`_HX_${H>W?W:H}p.mp4`;
    $('dl').href=url; $('dl').download=name; $('outv').src=url;
    $('doneInfo').textContent=`✅ Ready! ${W}×${H} · ${outFps.toFixed(0)}fps · ${(blob.size/1048576).toFixed(1)} MB · ${fmt(el)} me bana`+(noAudio?' · ⚠️ audio nahi aaya (is browser me audio encoder nahi — Chrome/Edge me aayega)':'');
    $('done').classList.remove('hidden'); setProg(1,'','Done ✅');
  }catch(e){ console.error(e); if(disk){ try{ await disk.ws.abort(); }catch(_){} try{ await disk.root.removeEntry(disk.name); }catch(_){} disk=null; }
    if(String(e.message)!=='cancelled' && vcfg && vcfg.hardwareAcceleration==='prefer-hardware' && !S._noHW){ S._noHW=true; retryHW=true; }
    else if(String(e.message)!=='cancelled') showErr('Export fail: '+e.message);
    else { const n=$('expNote'); if(n){ n.dataset.t=n.dataset.t||n.textContent; n.textContent='✖ Export cancel ho gaya — settings same hain, dobara Export daba sakte ho.'; setTimeout(()=>{ n.textContent=n.dataset.t; },6000); } }
    S.lastError=String(e&&e.message||e); }
  finally{ frozenP=null; if(enc){ try{ enc.close(); }catch(_){} } S.busy=false; document.body.classList.remove('hx-busy'); ui(false); wake(false); if(!retryHW) preview(); }
  if(retryHW){ setProg(0,'','Hardware encoder fail — software se dobara…'); return exportVideo(); }
  return stats;
}
// ---------------------------------------------------------------- on-device storage for big exports (OPFS)
function diskOK(){ try{ return !!(navigator.storage&&navigator.storage.getDirectory&&window.FileSystemFileHandle&&'createWritable' in FileSystemFileHandle.prototype); }catch(e){ return false; } }
async function openDisk(){ const root=await navigator.storage.getDirectory(); await cleanDisk(root);
  const name='hx-export-'+Date.now()+'.mp4'; const h=await root.getFileHandle(name,{create:true}); const ws=await h.createWritable(); return {root,h,ws,name}; }
async function cleanDisk(root){ try{ root=root||await navigator.storage.getDirectory(); const old=[]; for await (const [n] of root.entries()) if(/^hx-export-/.test(n)) old.push(n);
    for(const n of old){ try{ await root.removeEntry(n); }catch(e){} } if(S.lastDiskName&&old.includes(S.lastDiskName)) S.lastDiskName=null; }catch(e){} }
// ---------------------------------------------------------------- fallback export for browsers without WebCodecs (older Safari / iPhone): real-time record
function rtOK(){ try{ return !!(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream); }catch(e){ return false; } }
async function exportRealtime(){
  const info=S.info; if(!info||S.busy) return; S.busy=true; S.cancel=false; document.body.classList.add('hx-busy');
  const ui=(on)=>{ $('prog').classList.toggle('hidden',!on); $('go').disabled=on; };
  ui(true); $('done').classList.add('hidden'); setProg(0,'','Real-time mode…'); wake(true); const t0=performance.now(); let stats=null, rec=null;
  try{
    await ensureGL(); if((S.mode==='ai'||S.mode==='max')&&GPU.ok) await loadA4K();
    const {sw,sh}=info; const [W,H]=outDims(sw,sh); cv.width=W; cv.height=H; const fps=Math.min(60,Math.round(info.fps));
    const mt=['video/mp4;codecs=avc1.640028,mp4a.40.2','video/mp4;codecs=avc1,mp4a','video/mp4','video/webm;codecs=vp9,opus','video/webm'].find(t=>{ try{ return MediaRecorder.isTypeSupported(t); }catch(e){ return false; } });
    if(!mt) throw new Error('Is browser me video record/export support nahi hai — Chrome / Edge latest use karo.');
    const stream=cv.captureStream(fps);
    try{ if(!S._rtA){ const ac=new (window.AudioContext||window.webkitAudioContext)(); const n=ac.createMediaElementSource(vid); const d=ac.createMediaStreamDestination(); n.connect(d); S._rtA={ac,d}; }
      await S._rtA.ac.resume(); S._rtA.d.stream.getAudioTracks().forEach(t=>stream.addTrack(t)); }catch(e){ console.warn('rt audio',e); }
    rec=new MediaRecorder(stream,{mimeType:mt,videoBitsPerSecond:exportBitrate(W,H,fps),audioBitsPerSecond:160000});
    const chunks=[]; rec.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); }; const stopped=new Promise(r=>rec.onstop=r);
    vid.pause(); await new Promise(r=>{ const f=()=>{ vid.removeEventListener('seeked',f); r(); }; vid.addEventListener('seeked',f); vid.currentTime=0; });
    frozenP=params(); const direct=effMode()==='fast'||effMode()==='off';
    const draw=()=>{ if(direct) processFrame(vid,sw,sh,W,H,vid.currentTime,'screen'); else { const g=processFrame(vid,sw,sh,W,H,vid.currentTime,'G'); present(g,g,1,-1); } };
    draw(); vid.muted=false; rec.start(1000); await vid.play();
    await new Promise(res=>{ let fin=false; const end=()=>{ if(!fin){ fin=true; res(); } }; vid.onended=end;
      const step=()=>{ if(fin) return; if(S.cancel||vid.ended){ end(); return; } try{ draw(); }catch(e){ console.warn(e); }
        setProg(Math.min(.99,vid.currentTime/info.dur),'real-time',`ETA ${fmt(info.dur-vid.currentTime)}`);
        if(vid.requestVideoFrameCallback) vid.requestVideoFrameCallback(step); else requestAnimationFrame(step); }; step(); });
    vid.pause(); vid.muted=true; rec.stop(); await stopped; if(S.cancel) throw new Error('cancelled');
    const type=mt.split(';')[0]; const blob=new Blob(chunks,{type}); const el=(performance.now()-t0)/1000; const ext=type.includes('mp4')?'mp4':'webm';
    stats={W,H,secs:el,size:blob.size,mode:effMode(),realtime:true,type,tier:S.tier}; if(S.lastUrl) URL.revokeObjectURL(S.lastUrl); S.lastBlob=blob; S.lastStats=stats;
    const url=URL.createObjectURL(blob); S.lastUrl=url; const name=(S.file.name.replace(/\.[^.]+$/,'')||'video')+`_HX_${H>W?W:H}p.${ext}`;
    $('dl').href=url; $('dl').download=name; $('outv').src=url;
    $('doneInfo').textContent=`✅ Ready (real-time mode)! ${W}×${H} · ${(blob.size/1048576).toFixed(1)} MB · ${fmt(el)} me bana`+(ext==='webm'?' · WebM file (is browser me MP4 record nahi hota)':'');
    $('done').classList.remove('hidden'); setProg(1,'','Done ✅');
  }catch(e){ console.error(e); try{ if(rec&&rec.state!=='inactive') rec.stop(); }catch(_){} vid.pause(); vid.muted=true; if(String(e.message)!=='cancelled') showErr('Export fail: '+e.message); S.lastError=String(e&&e.message||e); }
  finally{ frozenP=null; S.busy=false; document.body.classList.remove('hx-busy'); ui(false); wake(false); preview(); }
  return stats; }
function showErr(m){ const el=$('fwarn'); if(el){ el.textContent='⚠️ '+m; el.classList.remove('hidden'); el.scrollIntoView({block:'center',behavior:'smooth'}); } else alert(m); }
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
  ffdark:{n:'🌑 FF Dark Cinematic',hint:'Deep blacks, punchy, cool-neutral — clean cinematic',sw:'#000,#1d2630,#8fa3b5',base:'original',I:1,
    sS:[.45,.5,.56],sH:[.52,.5,.49],
    p:{con:.26,clar:.42,sharp:.35,vib:.12,sat:-.04,hl:-.28,sh:.08,temp:-.05,bloom:.15,vig:.35,split:.28,curve:.3},
    curves:{m:[-.25,0,.1],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,0,0,0],s:[-.1,0,0,0,0,0],l:[0,0,0,0,0,0]}},
  ffbright:{n:'☀️ FF Bright HDR',hint:'Bright clean HDR — sky pop, crisp gameplay',sw:'#3aa0ff,#cfe3ff,#ffd27f',base:'insta',I:.7,
    zero:['vig','grain'],
    p:{sat:.1,vib:.42,sharp:.25,clar:.15,exp:.3,sh:.18,con:.05},
    curves:{m:[0,0,0],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,-.05,.03,0],s:[0,0,.1,.25,.4,0],l:[0,0,0,0,-.08,0]}},
  ultra:{n:'⚡ Ultra Graphics',hint:'Next-gen graphics feel — crisp + HDR',sw:'#0b1a2e,#9fe8ff,#e3b65a',base:'original',I:1,
    sS:[.44,.5,.58],sH:[.6,.53,.44],
    p:{exp:.06,hl:-.5,sh:.35,clar:.5,sharp:.42,vib:.36,sat:.04,con:.18,bloom:.22,split:.22,curve:.4,temp:.02},
    curves:{m:[0,0,0],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,0,0,0],s:[0,0,0,0,0,0],l:[0,0,0,0,0,0]}},
  coolteal:{n:'❄️ Cool Teal CC',my:1,hint:'Cool teal-blue, clean blacks, vibrant — reel CC',sw:'#001a2a,#00aaff,#fce45d',base:'original',I:1,
    sS:[.38,.5,.66],sH:[.56,.55,.46],
    p:{exp:.15,sh:.18,con:.22,sat:.1,vib:.6,tint:.05,temp:-.12,split:.4,ca:.08,vig:.25,bloom:.15,clar:.2,sharp:.2,curve:.3},
    curves:{m:[-.3,0,0],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,-.08,-.1,0],s:[0,0,0,.2,.3,0],l:[0,0,0,0,-.05,0]}},
  golden:{n:'🌅 Golden Rays CC',my:1,hint:'Warm golden glow + cool shadows, sharp',sw:'#1a1030,#ffa100,#ffd27f',base:'original',I:1,
    sS:[.42,.48,.62],sH:[.68,.56,.38],lk:[[1,.63,0],[1,.75,.35]],
    p:{sharp:.5,clar:.25,sh:.3,exp:.08,vig:.35,tint:.06,vib:.55,bloom:.35,leak:.3,split:.38,con:.15,curve:.3},
    curves:{m:[0,0,0],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,0,0,0],s:[0,0,0,0,0,0],l:[0,0,0,0,0,0]}},
  quality:{n:'💎 Quality HDR CC',my:1,hint:'Clean HDR detail + soft white glow, no colour cast',sw:'#0a0a0a,#ffffff,#9ad0ff',base:'original',I:1,
    p:{exp:.08,con:.22,sharp:.4,clar:.45,hl:-.5,sh:.4,bloom:.3,vib:.12,curve:.3},
    curves:{m:[0,0,0],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,0,0,0],s:[0,0,0,0,0,0],l:[0,0,0,0,0,0]}},
  proedit:{n:'🎬 Pro Edit',my:1,hint:'Sharp + unsharp detail, teal-warm cinematic, light flicker',sw:'#0d2228,#e3b65a,#f3f0e8',base:'original',I:1,
    sS:[.42,.52,.58],sH:[.58,.52,.45],
    p:{sharp:.6,clar:.32,con:.2,split:.3,vib:.15,hl:-.2,sh:.1,curve:.3,flick:.3},
    curves:{m:[0,0,0],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,0,0,0],s:[0,0,0,0,0,0],l:[0,0,0,0,0,0]}},
  hdrcc:{n:'🌟 HDR CC',my:1,hint:'Multi-level sharp detail + HDR tone, clean & crisp',sw:'#06121e,#7fd3ff,#fff3c4',base:'original',I:1,
    p:{sharp:.55,clar:.55,con:.26,hl:-.45,sh:.28,exp:.04,vib:.32,sat:.04,curve:.35},
    curves:{m:[-.14,.03,.04],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,0,0,0],s:[0,0,0,0,0,0],l:[0,0,0,0,0,0]}},
  darkcc:{n:'🖤 Dark CC',my:1,hint:'Dark moody — deep blacks, soft glow, vignette, reds natural',sw:'#000,#22262c,#d9d9d9',base:'original',I:1,
    p:{sharp:.5,clar:.42,con:.4,exp:-.5,hl:-.15,sh:-.08,bloom:.38,vig:.65,curve:.3,vib:.06},
    curves:{m:[-.45,-.28,-.06],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,0,0,0],s:[0,-.2,-.28,-.22,-.18,0],l:[0,0,0,0,0,0]}},
  q4k:{n:'🔷 4K Quality CC',my:1,hint:'Max upscale + crisp detail + soft deep glow',sw:'#081a33,#3d8bff,#ffffff',base:'original',I:1,max:1,
    p:{sharp:.65,clar:.42,con:.12,exp:.12,hl:-.3,sh:.15,bloom:.32,curve:.3,sat:.1,vib:.3},
    curves:{m:[-.1,0,.06],r:[0,0,0],g:[0,0,0],b:[0,0,0]}, hsl:{h:[0,0,0,0,0,0],s:[0,0,0,0,0,0],l:[0,0,0,0,0,0]}},
};
const bigDevice=()=>{ try{ return !matchMedia('(pointer:coarse)').matches && (navigator.deviceMemory||8)>=8 && (navigator.hardwareConcurrency||4)>=8; }catch(e){ return false; } };
function lookP(L){ const b=PRESETS[L.base]||{}, z=L.zero||[], o={}; for(const k in N){ const v=(z.includes(k)?0:(b[k]||0)*L.I)+(L.p[k]||0); if(v) o[k]=v; } return o; }
function applyLook(k){ const L=LOOKS[k]; resetGrade('original'); S.look=k; S.intensity=1;
  S.ov={p:lookP(L),sS:L.sS||(PRESETS[L.base]||{}).sS,sH:L.sH||(PRESETS[L.base]||{}).sH,lk:L.lk};
  S.curves=JSON.parse(JSON.stringify(L.curves)); S.hsl=JSON.parse(JSON.stringify(L.hsl));
  S.mode= S.tier==='low' ? 'fast' : S.gpuOK ? (L.max&&bigDevice()&&S.tier==='high'?'max':'ai') : 'fast'; S.res=1080; S.qual='high'; lookSmooth();
  const it=$('intensity'); it.value=100; it.nextElementSibling.textContent='100%';
  syncUI(); preview(); }
function lookSmooth(){ if(!S.look) return; const on=!!(S.info&&S.info.fps<=31) && S.tier==='high'; S.smooth=on; const c=$('smooth'); if(c) c.checked=on; }

// ---------------------------------------------------------------- UI
function slider(host,key,label,min,max,get,set){ const l=document.createElement('label'); l.className='sl'; l.dataset.k=key;
  l.innerHTML=`${label}<input type="range" min="${min*100}" max="${max*100}" value="${get()*100}"><output>${Math.round(get()*100)}</output>`;
  const i=l.querySelector('input'), o=l.querySelector('output'); i.oninput=()=>{ set(i.value/100); o.textContent=i.value; preview(); }; l._sync=()=>{ i.value=get()*100; o.textContent=Math.round(get()*100); }; host.appendChild(l); return l; }
const syncers=[];
function buildUI(){
  const lk0=$('looks'), lk1=$('mylooks')||lk0; for(const k in LOOKS){ const L=LOOKS[k], lk=L.my?lk1:lk0; const b=document.createElement('button'); b.className='look'; b.dataset.k=k; b.innerHTML=`<i style="background:linear-gradient(135deg,${L.sw})"></i><span><b>${L.n}</b><small>${L.hint}</small></span>`; b.onclick=()=>applyLook(k); lk.appendChild(b); }
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
  $('file').onchange=async()=>{ const f=$('file').files[0]; if(!f) return; try{ await loadFile(f); }catch(e){ showErr(e.message); } };
  $('smooth').onchange=()=>{ S.smooth=$('smooth').checked; S.smoothTouched=true; };
  $('go').onclick=exportVideo; $('cancel').onclick=()=>{ S.cancel=true; };
  $('scrub').oninput=()=>{ if(S.info) seekTo(S.info.dur*$('scrub').value/1000); };
  const st=$('stage'); let drag=false; const mv=(e)=>{ const r=cv.getBoundingClientRect(); S.split=clamp((e.clientX-r.left)/r.width,0,1); preview(); };
  st.onpointerdown=(e)=>{ if(!S.info) return; drag=true; st.setPointerCapture(e.pointerId); mv(e); }; st.onpointermove=(e)=>{ if(drag) mv(e); }; st.onpointerup=()=>drag=false;
}
function syncUI(){
  document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',b.dataset.k===S.preset));
  document.querySelectorAll('.look').forEach(b=>b.classList.toggle('on',b.dataset.k===S.look));
  { const ln=$('lookNote'); if(ln){ ln.classList.toggle('hidden',!S.look); if(S.look){ const hs=(LOOKS[S.look].my&&$('mylooks'))||$('looks'); if(hs&&ln.previousElementSibling!==hs) hs.after(ln); const m={ai:'🤖 AI HD 2x upscale (WebGPU)',fast:'⚡ Fast Enhance upscale'+(S.gpuOK?' (is device ke liye fast, same quality)':' (is device pe WebGPU nahi)'),max:'🔥 AI Max upscale',off:'🎨 Sirf Colour (upscale OFF)'}[S.mode];
    ln.textContent=`✅ ${LOOKS[S.look].n.replace(/^\S+ /,'')} set: ${m} + grade + effects + ${S.res}p${S.smooth?' + 60fps smooth':''}. Ab sirf Export dabao 👇`; } } }
  document.querySelectorAll('#modes .opt').forEach(b=>b.classList.toggle('on',b.dataset.m===S.mode));
  document.querySelectorAll('#curveCh button').forEach(b=>b.classList.toggle('on',b.dataset.k===S.curveCh));
  document.querySelectorAll('#hslB button').forEach(b=>b.classList.toggle('on',+b.dataset.k===S.hslBand));
  document.querySelectorAll('#res button').forEach(b=>b.classList.toggle('on',+b.dataset.k===S.res));
  document.querySelectorAll('#qual button').forEach(b=>b.classList.toggle('on',b.dataset.k===S.qual));
  $('intensity').value=S.intensity*100; $('intensity').nextElementSibling.textContent=Math.round(S.intensity*100)+'%';
  $('auto').textContent=S.auto?'✨ Auto Pro ON':'✨ Auto Pro'; syncers.forEach(s=>s._sync());
  { const rw=$('resWarn'); if(rw){ let w=''; if(S.res>=2160) w= S.tier==='high' ? '4K: file badi + export lamba. Insta/YT Shorts ke liye 1080p kaafi hai.' : '🐢 4K is device pe bahut slow + memory heavy ho sakta hai (phone hang/crash). 1080p recommended — chaho to 4K bhi chalega.';
      else if(S.res>=1440 && S.tier==='low') w='🐢 1440p is device pe slow ho sakta hai — 1080p fast rahega.';
      rw.textContent=w; rw.classList.toggle('hidden',!w); } }
  if(typeof syncSmoothNote==='function') syncSmoothNote();
  const notes={fast:'⚡ Fast Enhance: 2x upscale + denoise + sharpen (WebGL). Sabse fast.',ai:'🤖 AI HD: neural-net 2x upscale on your GPU. Edges & text crisp.',max:'🔥 AI Max: heaviest neural net (4x GAN for ≤720p input). Bahut slow ho sakta hai — laptop/PC best.',off:'🎨 Sirf colour grade + effects, original resolution pe phir export size pe scale.'};
  syncNote();
}
function syncNote(){ const notes={fast:'⚡ Fast Enhance: 2x upscale + denoise + sharpen (WebGL). Sabse fast.',ai:'🤖 AI HD: neural-net 2x upscale on your GPU. Edges & text crisp.',max:'🔥 AI Max: heaviest neural net (4x GAN for ≤720p input). Bahut slow ho sakta hai — laptop/PC best.',off:'🎨 Sirf colour grade + effects, original resolution pe phir export size pe scale.'};
  $('modeNote').textContent=notes[S.mode]+((S.mode==='ai'||S.mode==='max')&&!GPU.ok?' (Is device pe WebGPU nahi mila — Fast Enhance use hoga.)':'');
}


// ---------------------------------------------------------------- device tier (Low / Mid / High) — only sets DEFAULTS, never locks anything
const TIER_N={low:'Low',mid:'Mid',high:'High'};
const gpuDone=async()=>{ const f=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0); gl.flush(); const t0=performance.now();
  while(gl.getSyncParameter(f,gl.SYNC_STATUS)!==gl.SIGNALED && performance.now()-t0<5000) await new Promise(r=>setTimeout(r,2)); gl.deleteSync(f); };
async function benchGPU(){ // ~0.3–1 s, never blocks the page: real fast-path work (denoise + upscale + grade) on a synthetic 640×360 frame → 1280×720
  try{ const c=document.createElement('canvas'); c.width=640; c.height=360; const x=c.getContext('2d'); const g=x.createLinearGradient(0,0,640,360); g.addColorStop(0,'#1a3050'); g.addColorStop(.5,'#e3b65a'); g.addColorStop(1,'#202020'); x.fillStyle=g; x.fillRect(0,0,640,360); x.fillStyle='#fff'; x.font='bold 60px sans-serif'; x.fillText('HEYYANIXX',40,200);
    const BP={...N,sharp:.4,clar:.3,bloom:.3,vib:.2,con:.15,sS:[.5,.5,.5],sH:[.5,.5,.5],lk:[[1,.55,.25],[1,.3,.45]],lo:0,hi:1,mono:0};
    const one=async(t)=>{ const m=S.mode; S.mode='fast'; frozenP=BP; try{ processFrame(c,640,360,1280,720,t,'bench'); } finally{ frozenP=null; S.mode=m; } await gpuDone(); };
    await one(0); // warm-up (driver compile)
    let n=0; const t0=performance.now(); while(n<6 && performance.now()-t0<700){ await one(n*.033); n++; }
    const ms=(performance.now()-t0)/n; const tb=T.bench; if(tb){ gl.deleteFramebuffer(tb.fb); gl.deleteTexture(tb.t); delete T.bench; }
    return ms/0.92; // ms per output megapixel
  }catch(e){ frozenP=null; console.warn('bench',e); return 999; } }
function devInfo(){ const cores=navigator.hardwareConcurrency||4, mem=navigator.deviceMemory||0, mobile=/Android|iPhone|iPad|Mobi/i.test(navigator.userAgent); return {cores,mem,mobile,soft:false,rend:'',webgpu:GPU.ok}; }
function devInfoGL(){ let rend=''; try{ const e=gl.getExtension('WEBGL_debug_renderer_info'); rend=String(e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)); }catch(e){}
  return {rend:rend.slice(0,80),soft:/swiftshader|llvmpipe|softpipe|software|basic render/i.test(rend)}; }
function tierFrom(d,msMP){ // msMP: measured ms per output megapixel of the real fast path (null = not measured yet)
  if(d.soft || (mem0(d) && d.mem<=3) || d.cores<=2 || (msMP!=null && msMP>40)) return 'low';
  if(d.cores>=8 && (d.mem? d.mem>=8 : !d.mobile) && (msMP!=null ? msMP<7 : d.webgpu)) return 'high';
  return 'mid'; }
const mem0=(d)=>!!d.mem;
function hintTier(){ S.dev=devInfo(); return tierFrom(S.dev,null); } // instant, no GPU work at page load
// first video load: compile shaders (background) + 1-second GPU micro-benchmark → refine the Auto tier
let glP=null;
function ensureGL(){ if(!glP) glP=(async()=>{ await initGL(); const ms=await benchGPU(); S.dev.msMP=Math.round(ms*10)/10;
    const t=tierFrom(S.dev,ms); if(t!==S.tierAuto){ const prevDefault=tierDefaults(); S.tierAuto=t;
      if(S.tierChoice==='auto'){ const keep=S.look||S.mode!==prevDefault.mode; S.tier=t; document.body.classList.toggle('hx-low',t==='low'); const pill=$('tierPill'); if(pill) pill.dataset.t=t;
        if(!keep){ const d=tierDefaults(); S.mode=d.mode; if(!d.smoothOK){ S.smooth=false; const c=$('smooth'); if(c) c.checked=false; } } }
      const sel=$('tierSel'); if(sel) sel.options[0].textContent=`Auto (${TIER_N[t]})`; syncUI(); } })().catch(e=>{ glP=null; throw e; }); return glP; }
function tierDefaults(){ // what a fresh session / one-tap look starts with on this tier
  const t=S.tier; return { mode: t==='low' ? 'fast' : (S.gpuOK ? 'ai' : 'fast'), smoothOK: t==='high' }; }
function setTier(choice,first){ // choice: 'auto' | 'low' | 'mid' | 'high'
  try{ localStorage.setItem('hxTier',choice); }catch(e){}
  S.tierChoice=choice; S.tier= choice==='auto' ? S.tierAuto : choice;
  document.body.classList.toggle('hx-low',S.tier==='low');
  const sel=$('tierSel'); if(sel){ sel.value=choice; sel.options[0].textContent=`Auto (${TIER_N[S.tierAuto]})`; }
  const pill=$('tierPill'); if(pill) pill.dataset.t=S.tier;
  const d=tierDefaults(); S.mode=d.mode; if(!d.smoothOK){ S.smooth=false; const c=$('smooth'); if(c) c.checked=false; } else if(S.look) lookSmooth();
  syncUI(); syncSmoothNote(); if(!first) preview(); }
function syncSmoothNote(){ const n=$('smoothNote'); if(!n) return; const slow=S.tier!=='high'; n.textContent= slow ? '🐢 60fps = is device pe slow (export ~2x time). Default OFF — chaho to ON karo.' : ''; n.classList.toggle('hidden',!slow); }
async function initGL(){ if(!gl){ gl=cv.getContext('webgl2',GLOPT); if(!gl) throw new Error('Is browser/phone me WebGL2 nahi hai — Chrome latest use karo.'); } const d=devInfoGL(); Object.assign(S.dev,d); FLOATRT=!!gl.getExtension('EXT_color_buffer_float'); gl.getExtension('OES_texture_float_linear'); PSC=gl.getExtension('KHR_parallel_shader_compile');
  const ps=[FS_DEN,FS_UP,FS_GRADE,FS_OUT,FS_CLUT,FS_BLUR,FS_GRADE_F,FS_UPX,FS_UPY].map(progStart);
  if(PSC){ const t0=performance.now(); while(!ps.every(progReady) && performance.now()-t0<15000) await new Promise(r=>setTimeout(r,30)); }
  [P_DEN,P_UP,P_GRADE,P_OUT,P_CLUT,P_BLUR,P_GRADE_F,P_UPX,P_UPY]=ps.map(progEnd); }
// WebGL context lost (phones under memory pressure): stop cleanly, rebuild on restore
cv.addEventListener('webglcontextlost',e=>{ e.preventDefault(); if(S.busy) S.cancel=true; const n=$('modeNote'); if(n) n.textContent='⚠️ Graphics memory full ho gayi — thoda ruk, phir se try karo (chhota resolution/clip best).'; });
cv.addEventListener('webglcontextrestored',()=>{ for(const k in T) delete T[k]; lutTex=null; lutKey=''; clutKey=''; MAXT=0; glP=null; preview(); });
async function boot(){
  buildUI(); syncUI();
  const ok=await gpuProbe(); S.gpuOK=ok;
  $('gpuPill').textContent= ok ? '✅ AI GPU ready' : '⚡ Fast mode (no WebGPU)';
  if(!ok) document.querySelectorAll('#modes .opt').forEach(b=>{ if(b.dataset.m==='ai'||b.dataset.m==='max'){ const sm=b.querySelector('small'); if(sm) sm.textContent+=' (is browser me WebGPU nahi → Fast Enhance chalega)'; } });
  S.tierAuto=hintTier(); let ch='auto'; try{ ch=localStorage.getItem('hxTier')||'auto'; }catch(e){} if(!['auto','low','mid','high'].includes(ch)) ch='auto';
  setTier(ch,true);
  const sel=$('tierSel'); if(sel) sel.onchange=()=>setTier(sel.value);
  syncUI();
}
window.HXapi={vid,exportRealtime,diskOK,rtOK,loadA4K,cleanDisk,gpuOK:()=>GPU.ok,syncUI,applyLook,LOOKS,loadFile,exportVideo,preview,autoPro,S,PRESETS,setPreset,setMode:(m)=>{S.mode=m;syncUI();preview();},seekTo,processFrame,present,cv,gpuReady:()=>GPU.ok,_dbg:{get gl(){return gl;},setFloat:(b)=>{FLOATRT=b; for(const k of ['clut','blur']){ if(T[k]){ gl.deleteTexture(T[k].t); delete T[k]; } } clutKey='';},setBlurShift:(n)=>BLURSH=n,T,tex,fbo,bindT,upload,mip,pr:()=>({P_DEN,P_UP,P_GRADE,P_OUT})}};
boot().then(()=>{ window.HXready=true;
  // Safari / older browsers: say clearly what export path will be used (feature-detected, not UA-sniffed)
  if(!('VideoEncoder' in window)){ const n=$('expNote'); if(n){ n.classList.add('warn'); n.textContent = rtOK() ? '📱 Is browser me fast HD export (WebCodecs) nahi hai — real-time export chalega (video ki length jitna time, tab khula rakho). Best speed: Chrome / Edge latest, iPhone pe iOS 17+.' : '⚠️ Is browser me video export support nahi hai — Chrome / Edge latest use karo (iPhone pe iOS 17+).'; } }
  const idle=window.requestIdleCallback||((f)=>setTimeout(f,2500));
  idle(()=>{ if(diskOK()) cleanDisk(); });
  // offline: app shell + (once used/prefetched) the AI model are cached by the service worker
  if('serviceWorker' in navigator && window.isSecureContext && !S.noSW){ navigator.serviceWorker.register('sw.js').then(()=>{
      if(GPU.ok && !/Android|iPhone|iPad|Mobi/i.test(navigator.userAgent)) setTimeout(()=>idle(()=>{ navigator.serviceWorker.ready.then(r=>r.active&&r.active.postMessage({hx:'warmAI'})); }),6000); }).catch(e=>console.warn('sw',e)); }
});
// warm the MP4 libs the moment the user reaches for the picker (not at page load — keeps scrolling smooth)
$('pick').addEventListener('pointerdown',()=>libs().catch(()=>{}),{once:true});
