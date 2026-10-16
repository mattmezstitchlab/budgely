/* CHROMA — analyse audio en pur JavaScript (navigateur et Node).
   - onsetEnvelope : courbe d'attaques (flux d'énergie, graves accentués)
   - estimateTempo  : autocorrélation + a priori de tempo, affinage sub-hop
   - estimatePhase  : position du premier temps
   - estimateKey    : tonalité par profils de Krumhansl sur un chroma FFT
   - renderDemoTrack: génère un "vrai" morceau de test (batterie, basse, accords)
*/
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ChromaAnalysis=factory();
})(typeof self!=='undefined'?self:this,function(){
'use strict';

const NOTE_NAMES=['Do','Do♯','Ré','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'];

/* ---------- Onset envelope ---------- */
function onsetEnvelope(x,sr,hopSec=0.0116){
  const hop=Math.max(64,Math.round(sr*hopSec)),frames=Math.floor(x.length/hop);
  const full=new Float32Array(frames),low=new Float32Array(frames);
  // one-pole lowpass ~150 Hz for the kick band
  const a=1-Math.exp(-2*Math.PI*150/sr);let y=0;
  for(let f=0;f<frames;f++){
    let eF=0,eL=0;const o=f*hop;
    for(let i=0;i<hop;i++){const s=x[o+i];y+=a*(s-y);eF+=s*s;eL+=y*y}
    full[f]=Math.log(1+eF/hop*1e3);low[f]=Math.log(1+eL/hop*1e4);
  }
  const env=new Float32Array(frames);
  for(let f=1;f<frames;f++)env[f]=Math.max(0,full[f]-full[f-1])+2*Math.max(0,low[f]-low[f-1]);
  // remove slow trend
  const win=Math.round(0.25/hopSec);const out=new Float32Array(frames);
  let acc=0;const q=[];
  for(let f=0;f<frames;f++){q.push(env[f]);acc+=env[f];if(q.length>win)acc-=q.shift();out[f]=Math.max(0,env[f]-acc/q.length)}
  return {env:out,hop,frames};
}

/* ---------- Tempo ---------- */
function autocorr(env,minLag,maxLag){
  const n=env.length,r=new Float32Array(maxLag+1);
  for(let L=minLag;L<=maxLag;L++){let s=0;for(let i=L;i<n;i++)s+=env[i]*env[i-L];r[L]=s/(n-L)}
  return r;
}
function estimateTempo(env,hop,sr,{minBpm=65,maxBpm=185,prior=118}={}){
  const fps=sr/hop;
  const minLag=Math.floor(fps*60/maxBpm),maxLag=Math.ceil(fps*60/minBpm);
  const r=autocorr(env,minLag,Math.min(maxLag*2+2,env.length>>1));
  // normalise by lag-0 energy
  let e0=0;for(let i=0;i<env.length;i++)e0+=env[i]*env[i];e0=e0/env.length||1;
  let best=-1,bestLag=minLag;
  for(let L=minLag;L<=maxLag;L++){
    const bpm=60*fps/L;
    const w=Math.exp(-0.5*Math.pow(Math.log2(bpm/prior)/0.9,2));// Ellis-style log-gaussian prior
    // reward lags whose doubles are also periodic (true beat vs. eighth notes)
    const r2=2*L<r.length?r[2*L]:0;
    const score=(r[L]+0.5*r2)/e0*w;
    if(score>best){best=score;bestLag=L}
  }
  // refine: locate the k-th multiple of the peak precisely, period = peak_k / k
  let period=bestLag;
  const rFine=autocorr(env,minLag,Math.min(env.length>>1,bestLag*12+bestLag));
  for(let k=12;k>=2;k--){
    const c=bestLag*k;if(c+bestLag/4>=rFine.length)continue;
    const lo=Math.max(minLag,Math.round(c-bestLag/4)),hi=Math.round(c+bestLag/4);
    let m=-1,mi=lo;for(let L=lo;L<=hi;L++)if(rFine[L]>m){m=rFine[L];mi=L}
    if(mi<=lo||mi>=hi)continue;
    const y0=rFine[mi-1],y1=rFine[mi],y2=rFine[mi+1];
    const d=(y0-y2)/(2*(y0-2*y1+y2)||1);
    period=(mi+(isFinite(d)?Math.max(-.5,Math.min(.5,d)):0))/k;break;
  }
  return {period,bpm:60*fps/period,confidence:best};
}

/* ---------- Phase (first beat) ---------- */
function estimatePhase(env,period){
  let best=-1,bestPhi=0;
  const steps=Math.ceil(period*4);
  for(let s=0;s<steps;s++){
    const phi=s/4;let sum=0,n=0;
    for(let t=phi;t<env.length;t+=period){
      const i=Math.round(t);if(i<env.length){sum+=env[i];n++}
      // prefer grids whose offbeat is quieter
      const j=Math.round(t+period/2);if(j<env.length)sum-=0.35*env[j];
    }
    if(n&&sum/n>best){best=sum/n;bestPhi=phi}
  }
  return bestPhi;
}

/* ---------- Key ---------- */
function fft(re,im){
  const n=re.length;
  for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]]}}
  for(let len=2;len<=n;len<<=1){
    const ang=-2*Math.PI/len,wr=Math.cos(ang),wi=Math.sin(ang);
    for(let i=0;i<n;i+=len){let cr=1,ci=0;
      for(let k=0;k<len/2;k++){const a=i+k,b=a+len/2;const tr=re[b]*cr-im[b]*ci,ti=re[b]*ci+im[b]*cr;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;const t=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t}}
  }
}
const MAJOR=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
const MINOR=[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
function corr(a,b){const n=a.length;let ma=0,mb=0;for(let i=0;i<n;i++){ma+=a[i];mb+=b[i]}ma/=n;mb/=n;let num=0,da=0,db=0;for(let i=0;i<n;i++){const x=a[i]-ma,y=b[i]-mb;num+=x*y;da+=x*x;db+=y*y}return num/Math.sqrt(da*db||1)}
function estimateKey(x,sr,frames=96,N=8192){
  const chroma=new Float64Array(12),bassHist=new Float64Array(12),re=new Float64Array(N),im=new Float64Array(N);
  const win=new Float64Array(N);for(let i=0;i<N;i++)win[i]=.5-.5*Math.cos(2*Math.PI*i/N);
  const stride=Math.max(N,Math.floor((x.length-N)/frames));
  for(let f=0;f<frames;f++){
    const o=f*stride;if(o+N>x.length)break;
    for(let i=0;i<N;i++){re[i]=x[o+i]*win[i];im[i]=0}
    fft(re,im);
    const frameChroma=new Float64Array(12);let bassPc=-1,bassMag=0;
    const kMin=Math.max(2,Math.floor(60*N/sr)),kMax=Math.min(N/2-2,Math.ceil(2500*N/sr));
    const mags=new Float64Array(kMax+2);let floor=0;
    for(let k=kMin-1;k<=kMax+1;k++){mags[k]=Math.sqrt(re[k]*re[k]+im[k]*im[k]);floor+=mags[k]}
    floor=floor/(kMax-kMin+3)*2.5; // only spectral peaks well above the broadband floor count (removes drums)
    for(let k=kMin;k<=kMax;k++){
      const mag=mags[k];if(mag<floor||mag<=mags[k-1]||mag<mags[k+1])continue;
      // parabolic interpolation of the peak frequency for precision in the low range
      const d=(mags[k-1]-mags[k+1])/(2*(mags[k-1]-2*mag+mags[k+1])||1);
      const fr=(k+(isFinite(d)?Math.max(-.5,Math.min(.5,d)):0))*sr/N;
      const midi=69+12*Math.log2(fr/440);const near=Math.round(midi);
      if(Math.abs(midi-near)>.3)continue;
      const pc=((near%12)+12)%12;
      frameChroma[pc]+=mag*(fr<1200?1:.6);
      if(fr<200&&mag>bassMag){bassMag=mag;bassPc=pc}
    }
    // normalise per frame so loud sections don't dominate
    let sum=0;for(let i=0;i<12;i++)sum+=frameChroma[i];
    if(sum>0)for(let i=0;i<12;i++)chroma[i]+=frameChroma[i]/sum;
    if(bassPc>=0)bassHist[bassPc]+=1;
  }
  let bassSum=0;for(let i=0;i<12;i++)bassSum+=bassHist[i];
  let best=-2,tonic=0,mode='minor';
  for(let t=0;t<12;t++){
    const rotated=new Array(12);
    for(let i=0;i<12;i++)rotated[i]=chroma[(i+t)%12];
    // the most frequent bass note is a strong hint for the tonic
    const bassBonus=bassSum?0.25*bassHist[t]/bassSum:0;
    const cM=corr(rotated,MAJOR)+bassBonus,cm=corr(rotated,MINOR)+bassBonus;
    if(cM>best){best=cM;tonic=t;mode='major'}
    if(cm>best){best=cm;tonic=t;mode='minor'}
  }
  return {tonic,mode,confidence:best,name:NOTE_NAMES[tonic]+' '+(mode==='major'?'majeur':'mineur'),chroma:Array.from(chroma)};
}
/* Four-chord loop in the detected key, voiced around MIDI 53–71 like the original score. */
function chordsForKey(tonic,mode){
  const base=mode==='major'
    ?[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]]  // I vi IV V (in C)
    :[[57,60,64,67],[53,57,60,64],[60,64,67,71],[55,59,62,65]]; // i VI III VII (in Am)
  const ref=mode==='major'?0:9;
  let shift=((tonic-ref)%12+12)%12;if(shift>6)shift-=12;
  return base.map(ch=>ch.map(n=>n+shift));
}

/* ---------- Full analysis ---------- */
function analyze(x,sr){
  const {env,hop}=onsetEnvelope(x,sr);
  const tempo=estimateTempo(env,hop,sr);
  const phi=estimatePhase(env,tempo.period);
  const key=estimateKey(x,sr);
  const beat=tempo.period*hop/sr;
  return {bpm:tempo.bpm,beat,firstBeat:phi*hop/sr,tempoConfidence:tempo.confidence,key,chords:chordsForKey(key.tonic,key.mode)};
}

/* ---------- Demo track generator (deterministic, pure math) ---------- */
function renderDemoTrack(sr,{bpm=124,tonic=9,mode='minor',seconds=32,offset=0.3,seed=7}={}){
  const n=Math.floor(sr*seconds),out=new Float32Array(n),beat=60/bpm;
  const chords=chordsForKey(tonic,mode);
  const f=m=>440*Math.pow(2,(m-69)/12);
  let s=seed;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
  const noise=new Float32Array(sr);for(let i=0;i<sr;i++)noise[i]=rnd()*2-1;
  const totalBeats=Math.floor((seconds-offset)/beat);
  for(let b=0;b<totalBeats;b++){
    const t0=offset+b*beat,bar=Math.floor(b/4),pos=b%4,ch=chords[Math.floor(bar/2)%4];
    const i0=Math.floor(t0*sr);
    // kick on every beat
    for(let i=0;i<sr*.25&&i0+i<n;i++){const t=i/sr;out[i0+i]+=Math.sin(2*Math.PI*(50+110*Math.exp(-t*25))*t)*0.9*Math.exp(-t*9)}
    // snare on 2 and 4
    if(pos===1||pos===3)for(let i=0;i<sr*.18&&i0+i<n;i++){const t=i/sr;out[i0+i]+=noise[i%sr]*0.45*Math.exp(-t*22)+Math.sin(2*Math.PI*190*t)*0.3*Math.exp(-t*30)}
    // hats on eighths
    for(const h of[0,.5]){const j0=Math.floor((t0+h*beat)*sr);for(let i=0;i<sr*.05&&j0+i<n;i++){const t=i/sr;const v=noise[(i*7)%sr]-noise[(i*7+1)%sr];out[j0+i]+=v*0.12*Math.exp(-t*60)}}
    // bass: root on beats 1 & 3, fifth on offbeat
    const bassNote=(pos===0||pos===2)?ch[0]-24:ch[2]-24;
    for(let i=0;i<sr*beat*.9&&i0+i<n;i++){const t=i/sr;const ph=f(bassNote)*t;out[i0+i]+=(2*(ph-Math.floor(ph))-1)*0.22*Math.exp(-t*3)}
    // chord stab on beat 1 (sustain 1 bar)
    if(pos===0)for(let i=0;i<sr*beat*3.8&&i0+i<n;i++){const t=i/sr;let v=0;for(const m of ch)v+=Math.sin(2*Math.PI*f(m)*t);out[i0+i]+=v*0.07*Math.exp(-t*1.2)}
    // melody: arpeggio on the chord every eighth
    for(let k=0;k<2;k++){const j0=Math.floor((t0+k*beat/2)*sr);const m=ch[(b*2+k)%4]+12;for(let i=0;i<sr*.2&&j0+i<n;i++){const t=i/sr;out[j0+i]+=Math.sin(2*Math.PI*f(m)*t)*0.12*Math.exp(-t*12)}}
  }
  // soft clip
  for(let i=0;i<n;i++)out[i]=Math.tanh(out[i]*1.1)*0.9;
  return out;
}

return {onsetEnvelope,estimateTempo,estimatePhase,estimateKey,chordsForKey,analyze,renderDemoTrack,NOTE_NAMES};
});
