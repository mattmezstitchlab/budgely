/* MODUL — moteur musical partagé avec CHROMA (styles, samples, synthèse, structure). Généré depuis play/index.html, adapté. */
const INST=[{n:'Batterie',c:'#ff4f5e'},{n:'Basse',c:'#a78bfa'},{n:'Accords',c:'#4cc9f0'},{n:'Mélodie',c:'#00ed8b'},{n:'Percussions',c:'#ffd166'},{n:'Voix',c:'#ff5fa2'}];
const FORM=[['Intro',4],['Couplet',8],['Pré-refrain',4],['Refrain',8],['Couplet',8],['Pré-refrain',4],['Refrain',8],['Pont',8],['Refrain',8],['Final',8]];
const BASE_FORM=FORM.map(x=>x.slice());
/* structure modifiable par projet (jingle de 4 mesures, film de 40…) : on remplace le contenu, pas la référence */
function setForm(f){const ok=Array.isArray(f)&&f.length&&f.every(x=>Array.isArray(x)&&NEED_TYPES.includes(x[0])&&x[1]>=1);FORM.splice(0,FORM.length,...(ok?f.map(x=>[x[0],Math.min(64,Math.round(x[1]))]):BASE_FORM.map(x=>x.slice())));return FORM}
const NEED_TYPES=['Intro','Couplet','Pré-refrain','Refrain','Pont','Final'];
const NEED={Intro:[2],Couplet:[0,1],'Pré-refrain':[0,1,2],Refrain:[0,1,2,3],Pont:[2,3,5],Final:[0,1,2,3,4,5]};
const PROG={
  minor:{Intro:[0,0,5,5],Couplet:[0,5,2,6],'Pré-refrain':[3,3,6,6],Refrain:[5,6,0,0],Pont:[2,6,3,4],Final:[5,6,0,0]},
  major:{Intro:[0,0,3,3],Couplet:[0,4,5,3],'Pré-refrain':[1,3,4,4],Refrain:[0,4,5,3],Pont:[5,3,0,4],Final:[0,4,5,3]}
};
const SCALES={minor:[0,2,3,5,7,8,10],major:[0,2,4,5,7,9,11]};
const KEYS=['Do','Do♯','Ré','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'];
const ADJ=['Néon','Lent','Bleu','Sauvage','Minuit','Doux','Électrique','Pâle','Vif','Secret','Lunaire','Chaud','Sobre','Fauve','Clair'];
const NOUN=['Marée','Orage','Rivage','Comète','Verre','Nuit','Boulevard','Fièvre','Jardin','Satellite','Velours','Brume','Pulse','Horizon','Éclipse'];

/* ---------- styles : un style = un tempo, un kit, des voix, des motifs ---------- */
const KITS={ac:{bd:'ac_bd',sd:'ac_sd',hh:'ac_hh',oh:'ac_oh',cr:'ac_cr',cp:'pc_clap',rim:'808_rim'},el:{bd:'el_bd',sd:'el_sd',hh:'el_hh',oh:'el_oh',cr:'el_cr',cp:'el_cp',rim:'el_rim'},'808':{bd:'808_bd',sd:'808_sd',hh:'808_hh',oh:'808_oh',cr:'808_cr',cp:'808_cp',rim:'808_rim'}};
const TONAL={piano:{dir:'piano',notes:{C3:48,Fs3:54,C4:60,Fs4:66,C5:72}},ebass:{dir:'bass',notes:{E2:40,As2:46,Cs3:49}},guitar:{dir:'guitar',notes:{C3:48,Ds3:51,Fs3:54,A3:57,C4:60,Ds4:63,Fs4:66}},bells:{dir:'bells',notes:{G5:79,C6:84,G6:91,C7:96}}};
const STYLES={
  pop:  {n:'Pop',   d:'Piano, guitare, batterie acoustique', g:'linear-gradient(90deg,#4cc9f0,#00ed8b)', bpm:[104,118],minorP:.45,kit:'ac', bass:'ebass',chords:'piano',lead:'guitar',voice:'choir',  perc:['808_sh','pc_clap','808_rim'],swing:0,  half:false,seventh:false},
  house:{n:'House', d:'Kick droit, piano stabs, voix coupées',g:'linear-gradient(90deg,#a78bfa,#ff5fa2)', bpm:[122,126],minorP:.6, kit:'el', bass:'synth',chords:'stab', lead:'pluck', voice:'formant',perc:['808_sh','808_cb','808_rim'],swing:0,  half:false,seventh:true},
  trap: {n:'Trap',  d:'808, hats rapides, cloches',           g:'linear-gradient(90deg,#ff4f5e,#ffd166)', bpm:[70,78],  minorP:.9, kit:'808',bass:'sub',  chords:'dark', lead:'bells', voice:'choir',  perc:['808_rim','pc_snap','808_cb'],swing:0,  half:true, seventh:false},
  lofi: {n:'Lo-fi', d:'Accords jazz, souffle, douceur',       g:'linear-gradient(90deg,#ffd166,#a78bfa)', bpm:[76,88],  minorP:.5, kit:'ac', bass:'ebass',chords:'piano7',lead:'guitar',voice:'choir', perc:['pc_snap','pc_ta','808_sh'], swing:.58,half:false,seventh:true,tex:'tx_hiss',lp:3800}
};
function filesFor(st){const S=STYLES[st];const f=new Set(Object.values(KITS[S.kit]));S.perc.forEach(x=>f.add(x));if(S.voice==='choir')f.add('tx_choir');if(S.tex)f.add(S.tex);
  const list=[...f].map(k=>['drums/'+k,k]);const tonal=[S.bass,S.chords.startsWith('piano')||S.chords==='stab'||S.chords==='dark'?'piano':null,S.lead].filter(x=>TONAL[x]);
  tonal.forEach(tn=>Object.keys(TONAL[tn].notes).forEach(n=>list.push([TONAL[tn].dir+'/'+n,tn+'/'+n])));return list}

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function playerId(){let c=load('chroma-id','');if(!c){c=Math.random().toString(36).slice(2,8);save('chroma-id',c)}return c}
function api(path,opts){return fetch(path,opts).then(r=>r.ok?r.json():Promise.reject(r.status))}
let styleId=load('chroma-style','pop');if(!STYLES[styleId])styleId='pop';
let offsetMs=load('chroma-offset',0);

function describe(seed,st,over={}){
  const S=STYLES[st]||STYLES.pop;const r=mulberry32(seed);
  let mode=r()<S.minorP?'minor':'major';let root=Math.floor(r()*12);let bpm=S.bpm[0]+Math.floor(r()*(S.bpm[1]-S.bpm[0]+1));
  const name=ADJ[Math.floor(r()*ADJ.length)]+' '+NOUN[Math.floor(r()*NOUN.length)];
  if(over.mode)mode=over.mode;if(over.root!=null)root=over.root;if(over.bpm)bpm=over.bpm;
  return {seed,style:st,S,mode,root,bpm,name:over.name||name,keyName:KEYS[root]+(mode==='minor'?' mineur':' majeur')};
}
function sectionAt(bar){let b=bar,i=0,level=0;for(;;){const [type,len]=FORM[i];if(b<len)return {type,len,index:i,pos:b,level};b-=len;i++;if(i>=FORM.length){i=1;level++}}}
const voicings=new Map();
function chordOf(d,bar){
  if(voicings.has(bar))return voicings.get(bar);
  const s=sectionAt(bar),sc=SCALES[d.mode],deg=PROG[d.mode][s.type][Math.floor(s.pos/2)%4];
  const n=k=>sc[(deg+k)%7]+(deg+k>=7?12:0);let notes=[n(0),n(2),n(4)];if(d.S.seventh)notes.push(n(6));
  /* conduite des voix : parmi les renversements, celui qui bouge le moins depuis l'accord précédent */
  if(bar>0){const prev=chordOf(d,bar-1).notes;let best=null,bd=1e9;
    for(let inv=0;inv<notes.length;inv++){const cand=notes.map((x,i)=>i<inv?x+12:x).sort((a,b)=>a-b);
      for(const shift of [-12,0,12]){const c2=cand.map(x=>x+shift);if(c2[0]<-5||c2[c2.length-1]>26)continue;
        const dist=c2.reduce((acc,x,i)=>acc+Math.abs(x-(prev[Math.min(i,prev.length-1)])),0);if(dist<bd){bd=dist;best=c2}}}
    if(best)notes=best}
  const ch={deg,notes,root:d.root+n(0)};voicings.set(bar,ch);return ch;
}
/* chiffrage romain de la progression d'une section, pour la fiche du morceau */
const ROMAN={minor:['i','ii°','III','iv','v','VI','VII'],major:['I','ii','iii','IV','V','vi','vii°']};
function romanOf(d,type){return PROG[d.mode][type].map(x=>ROMAN[d.mode][x]+(d.S.seventh?'7':'')).join(' – ')}
const motifs=new Map();
function motif(d,bar){
  const s=sectionAt(bar);const phrase=Math.floor(s.pos/2);
  const key=s.type+':'+(s.type==='Refrain'||s.type==='Pré-refrain'?phrase:(s.level*100+phrase));
  if(motifs.has(key))return motifs.get(key);
  const r=mulberry32(d.seed*7+key.length*131+phrase*17+(s.type.charCodeAt(0)<<4));
  const density=(s.type==='Refrain'?.62:s.type==='Pont'?.4:.48)*(d.S.half?.6:1);
  const sc=SCALES[d.mode];let deg=4+Math.floor(r()*3);const out=[];
  for(let i=0;i<32;i++){const strong=i%4===0;if(r()<(strong?density+.25:i%2?density*.35:density)){deg+=Math.round((r()-.5)*(strong?4:2));deg=Math.max(2,Math.min(11,deg));out.push({i,deg,len:strong&&r()<.4?2:1})}}
  const m={notes:out,sc};motifs.set(key,m);return m;
}

/* ============================ AUDIO ============================ */
let ctx,master,comp,busDrum,kitFilter,busMusic,busSend,verb,noise;
const SMP={};const loaded=new Set();
function buildAudio(existing){
  if(ctx&&!existing)return;
  const AC=window.AudioContext||window.webkitAudioContext;ctx=existing||new AC({latencyHint:'interactive'});
  master=ctx.createGain();master.gain.value=.9;
  comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=18;comp.ratio.value=3.5;comp.attack.value=.004;comp.release.value=.18;
  const lim=ctx.createDynamicsCompressor();lim.threshold.value=-3;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.08;
  busDrum=ctx.createGain();busMusic=ctx.createGain();busSend=ctx.createGain();busSend.gain.value=.26;
  kitFilter=ctx.createBiquadFilter();kitFilter.type='lowpass';kitFilter.frequency.value=20000;
  verb=ctx.createConvolver();const len=Math.floor(ctx.sampleRate*2.4),ir=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let ch=0;ch<2;ch++){const dd=ir.getChannelData(ch);for(let i=0;i<len;i++){dd[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)*(i<ctx.sampleRate*.01?i/(ctx.sampleRate*.01):1)}}
  verb.buffer=ir;const vf=ctx.createBiquadFilter();vf.type='lowpass';vf.frequency.value=5200;
  const delayL=ctx.createDelay(2),delayR=ctx.createDelay(2),fbL=ctx.createGain(),fbR=ctx.createGain(),pL=ctx.createStereoPanner(),pR=ctx.createStereoPanner(),dIn=ctx.createGain();
  fbL.gain.value=.32;fbR.gain.value=.32;pL.pan.value=-.6;pR.pan.value=.6;dIn.gain.value=.22;const df=ctx.createBiquadFilter();df.type='highpass';df.frequency.value=500;
  dIn.connect(df);df.connect(delayL);delayL.connect(fbL);fbL.connect(delayR);delayR.connect(fbR);fbR.connect(delayL);delayL.connect(pL);delayR.connect(pR);pL.connect(master);pR.connect(master);
  busMusic.delaySend=dIn;busMusic.delay=[delayL,delayR];
  busSend.connect(verb);verb.connect(vf);vf.connect(master);
  busDrum.connect(kitFilter);kitFilter.connect(comp);busMusic.connect(comp);comp.connect(lim);lim.connect(master);master.connect(ctx.destination);
  noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const nd=noise.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
}
async function loadStyle(st,onProgress){
  buildAudio();const list=filesFor(st).filter(([p,k])=>!SMP[k]);let done=0;
  await Promise.all(list.map(async([p,k])=>{try{const url='samples/'+p+(p.startsWith('drums/')?drumExt(k):'.mp3');const ab=await (await fetch(url)).arrayBuffer();
    SMP[k]=await new Promise((res,rej)=>{const q=ctx.decodeAudioData(ab,res,rej);if(q&&q.then)q.then(res,rej)})}catch(e){}
    done++;onProgress&&onProgress(done/list.length)}));
  loaded.add(st);
}
const drumExt=k=>(k.startsWith('808_')||k==='pc_clap'||k==='pc_snap')?'.wav':'.flac';
const mtof=m=>440*Math.pow(2,(m-69)/12);
function env(g,t,a,d,s,peak){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*s),t+a+d)}
function kill(g,t){g.gain.setTargetAtTime(.0001,t,.03)}
/* sample one-shot */
function smp(k,t,v=1,o={}){const b=SMP[k];if(!b)return false;const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;s.playbackRate.value=o.rate||1;
  let out=g;if(o.lp){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;s.connect(f);f.connect(g)}else s.connect(g);
  if(o.dur){g.gain.setValueAtTime(v,t);g.gain.setValueAtTime(v,t+o.dur);g.gain.exponentialRampToValueAtTime(.0001,t+o.dur+(o.rel||.12))}else g.gain.value=v;
  let dest=o.bus||busDrum;if(o.pan){const p=ctx.createStereoPanner();p.pan.value=o.pan;p.connect(dest);dest=p}
  g.connect(dest);if(o.send)g.connect(busSend);if(o.dly)g.connect(busMusic.delaySend);
  s.start(t);if(o.dur)s.stop(t+o.dur+(o.rel||.12)+.05);return true}
/* instrument tonal échantillonné : note la plus proche + playbackRate */
function tonal(tn,m,t,dur,v,o={}){const T=TONAL[tn];if(!T)return false;let best=null,bd=99;for(const [n,mm] of Object.entries(T.notes)){const d=Math.abs(mm-m);if(d<bd&&SMP[tn+'/'+n]){bd=d;best=[n,mm]}}
  if(!best)return false;return smp(tn+'/'+best[0],t,v,{rate:Math.pow(2,(m-best[1])/12),dur,rel:o.rel||.25,bus:busMusic,send:o.send!==false,lp:o.lp,dly:o.dly,pan:o.pan})}
/* --- synthés --- */
function kickS(t,v){const o=ctx.createOscillator(),g=ctx.createGain(),c=ctx.createOscillator(),cg=ctx.createGain();
  o.frequency.setValueAtTime(165,t);o.frequency.exponentialRampToValueAtTime(48,t+.11);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.42);
  c.type='square';c.frequency.setValueAtTime(900,t);c.frequency.exponentialRampToValueAtTime(100,t+.02);cg.gain.setValueAtTime(v*.25,t);cg.gain.exponentialRampToValueAtTime(.001,t+.025);
  o.connect(g);g.connect(busDrum);c.connect(cg);cg.connect(busDrum);o.start(t);o.stop(t+.45);c.start(t);c.stop(t+.03)}
function snareS(t,v){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),o=ctx.createOscillator(),og=ctx.createGain();
  s.buffer=noise;f.type='bandpass';f.frequency.value=2600;f.Q.value=.7;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.19);
  o.frequency.setValueAtTime(230,t);o.frequency.exponentialRampToValueAtTime(150,t+.08);og.gain.setValueAtTime(v*.5,t);og.gain.exponentialRampToValueAtTime(.001,t+.1);
  s.connect(f);f.connect(g);g.connect(busDrum);g.connect(busSend);o.connect(og);og.connect(busDrum);s.start(t);s.stop(t+.25);o.start(t);o.stop(t+.12)}
function hatS(t,v,open){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise;f.type='highpass';f.frequency.value=8200;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+(open?.28:.05));s.connect(f);f.connect(g);g.connect(busDrum);s.start(t);s.stop(t+.3)}
function shakerS(t,v){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise;f.type='bandpass';f.frequency.value=6000;f.Q.value=1.2;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.07);s.connect(f);f.connect(g);g.connect(busDrum);s.start(t);s.stop(t+.1)}
function crashS(t,v){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise;f.type='highpass';f.frequency.value=5000;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+1.4);s.connect(f);f.connect(g);g.connect(busDrum);g.connect(busSend);s.start(t);s.stop(t+1.5)}
function bassS(t,m,dur,v,bright){const o=ctx.createOscillator(),s=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();
  o.type='sawtooth';o.frequency.value=mtof(m);s.frequency.value=mtof(m-12);f.type='lowpass';f.Q.value=6;
  f.frequency.setValueAtTime(bright,t);f.frequency.exponentialRampToValueAtTime(Math.max(90,bright*.18),t+dur*.9);
  env(g,t,.006,dur*.5,.5,v);kill(g,t+dur);o.connect(f);s.connect(f);f.connect(g);g.connect(busMusic);o.start(t);s.start(t);o.stop(t+dur+.2);s.stop(t+dur+.2)}
function sub808(t,m,dur,v,slideTo){const o=ctx.createOscillator(),g=ctx.createGain(),sh=ctx.createWaveShaper(),k=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;k[i]=Math.tanh(2.2*x)}sh.curve=k;
  o.frequency.setValueAtTime(mtof(m+12),t);o.frequency.exponentialRampToValueAtTime(mtof(m),t+.04);if(slideTo!=null){o.frequency.setValueAtTime(mtof(m),t+dur*.55);o.frequency.exponentialRampToValueAtTime(mtof(slideTo),t+dur)}
  g.gain.setValueAtTime(v,t);g.gain.setTargetAtTime(.0001,t+dur*.8,dur*.12);o.connect(sh);sh.connect(g);g.connect(busMusic);o.start(t);o.stop(t+dur+.3)}
function padS(t,notes,dur,v,cut){notes.forEach((m,i)=>{for(let k=0;k<2;k++){const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain(),p=ctx.createStereoPanner();
  o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=(k?7:-7)+i*2;f.type='lowpass';f.frequency.value=cut;f.Q.value=.5;p.pan.value=k?.35:-.35;
  env(g,t,Math.min(.6,dur*.35),dur*.4,.7,v/notes.length/2);kill(g,t+dur);o.connect(f);f.connect(g);g.connect(p);p.connect(busMusic);g.connect(busSend);o.start(t);o.stop(t+dur+.3)}})}
function stabS(t,notes,v){notes.forEach(m=>{const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type='square';o.frequency.value=mtof(m);f.type='lowpass';
  f.frequency.setValueAtTime(3800,t);f.frequency.exponentialRampToValueAtTime(400,t+.22);env(g,t,.004,.2,.05,v/notes.length);kill(g,t+.25);o.connect(f);f.connect(g);g.connect(busMusic);g.connect(busSend);o.start(t);o.stop(t+.4)})}
function pluckS(t,m,dur,v){const o=ctx.createOscillator(),o2=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type='triangle';o2.type='square';
  o.frequency.value=mtof(m);o2.frequency.value=mtof(m);o2.detune.value=4;f.type='lowpass';f.frequency.setValueAtTime(5000,t);f.frequency.exponentialRampToValueAtTime(900,t+dur);
  const g2=ctx.createGain();g2.gain.value=.3;env(g,t,.004,dur*.7,.25,v);kill(g,t+dur);o.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);g.connect(busMusic);g.connect(busSend);g.connect(busMusic.delaySend);
  o.start(t);o2.start(t);o.stop(t+dur+.2);o2.stop(t+dur+.2)}
function formantS(t,m,dur,v,vowel){const o=ctx.createOscillator(),g=ctx.createGain(),mix=ctx.createGain();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.setValueAtTime(-30,t);o.detune.linearRampToValueAtTime(0,t+.08);
  [[700,1200],[400,2000],[300,870]][vowel%3].forEach(fr=>{const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=fr;f.Q.value=9;o.connect(f);f.connect(mix)});
  env(g,t,.03,dur*.6,.5,v*1.6);kill(g,t+dur);mix.connect(g);g.connect(busMusic);g.connect(busSend);g.connect(busMusic.delaySend);o.start(t);o.stop(t+dur+.3)}
function riser(t,dur,v){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise;s.loop=true;f.type='bandpass';f.Q.value=1.5;
  f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(7000,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+dur);g.gain.setTargetAtTime(.0001,t+dur,.02);
  s.connect(f);f.connect(g);g.connect(busDrum);g.connect(busSend);s.start(t);s.stop(t+dur+.1)}
/* --- enregistreur de notes : alimenté pendant un rendu hors-ligne, sert à l'export MIDI --- */
const REC={on:false,notes:[]};
const GM={bd:36,sd:38,cp:39,hh:42,oh:46,cr:49,rim:37};
function rec(ch,m,t,dur,v){if(REC.on)REC.notes.push([ch,Math.round(m),t,Math.max(.05,dur),Math.min(127,Math.round(30+v*95))])}
/* --- couche "instrument" : sample si chargé, sinon synthé --- */
function drum(kind,t,v,S){const k=KITS[S.kit][kind];rec(9,GM[kind]||37,t,.1,v);
  if(kind==='bd'){if(!smp(k,t,v*1.1))kickS(t,v);busMusic.gain.cancelScheduledValues(t);busMusic.gain.setValueAtTime(.6,t);busMusic.gain.linearRampToValueAtTime(1,t+.2);return}
  if(kind==='sd'||kind==='cp'){if(!smp(k,t,v*.9,{send:true}))snareS(t,v);return}
  if(kind==='hh'){if(!smp(k,t,v*.8,{dur:.06}))hatS(t,v,false);return}
  if(kind==='oh'){if(!smp(k,t,v*.7,{dur:.3}))hatS(t,v,true);return}
  if(kind==='cr'){if(!smp(k,t,v*.6,{send:true}))crashS(t,v);return}
  if(kind==='rim'){if(!smp(k,t,v,{send:true}))shakerS(t,v)}}
function perc(i,t,v,S){const k=S.perc[i%S.perc.length];rec(9,[70,75,56][i%3],t,.1,v);if(!smp(k,t,v,{send:i>0,dur:k.includes('sh')?.09:undefined}))shakerS(t,v)}
function playBass(d,t,m,dur,v,bright,slideTo){const b=d.S.bass;rec(1,m,t,dur,v);if(b==='ebass'&&tonal('ebass',m,t,dur,v*1.3,{send:false,lp:d.S.lp?2500:undefined}))return;if(b==='sub'){sub808(t,m-12,dur,v*1.1,slideTo);return}bassS(t,m,dur,v,bright)}
function playChord(d,t,notes,dur,v,bright,kind){const c=d.S.chords;notes.forEach(m=>rec(2,m,t,dur,v));
  if(c==='piano'||c==='piano7'){if(notes.every(m=>tonal('piano',m,t,dur,v*(c==='piano7'?.8:.9)/Math.sqrt(notes.length),{lp:c==='piano7'?2600:undefined,pan:(m%7-3)*.1})))return;padS(t,notes,dur,v,bright);return}
  if(c==='stab'){if(kind==='stab'){if(notes.every(m=>tonal('piano',m,t,.28,v*.9/Math.sqrt(notes.length),{rel:.08})))return;stabS(t,notes,v);return}padS(t,notes,dur,v*.6,bright);return}
  if(c==='dark'){padS(t,notes,dur,v,Math.min(bright,1600));if(kind==='pad')tonal('piano',notes[0]-12,t,dur,v*.5,{lp:1800});return}
  padS(t,notes,dur,v,bright)}
function playLead(d,t,m,dur,v){const l=d.S.lead;rec(3,m,t,dur,v);if(l==='guitar'&&tonal('guitar',m-12,t,dur*1.6,v*1.1,{dly:true,lp:d.S.lp?3200:undefined}))return;if(l==='bells'&&tonal('bells',m,t,dur*2,v*.9,{dly:true}))return;pluckS(t,m,dur,v)}
function playVoice(d,t,m,dur,v,vowel){rec(4,m,t,dur,v);if(d.S.voice==='choir'&&SMP['tx_choir']){smp('tx_choir',t,v*1.2,{rate:Math.pow(2,((m%12)-7)/12),dur,rel:.3,bus:busMusic,send:true,pan:(vowel%2?.3:-.3)});return}formantS(t,m,dur,v,vowel)}

/* ============================ MOTEUR ============================ */
const DYN={Intro:.62,Couplet:.84,'Pré-refrain':.92,Refrain:1,Pont:.78,Final:1.06};
const engine={on:false,desc:null,start:0,beat:.5,step:0,energy:[0,0,0,0,0,0],events:[],evIdx:0,replay:false,endBar:Infinity,timer:0,tex:null};
function engineStart(desc,opts={}){
  buildAudio();if(ctx.state==='suspended')ctx.resume();
  motifs.clear();voicings.clear();
  Object.assign(engine,{on:true,desc,beat:60/desc.bpm,step:0,energy:[0,0,0,0,0,0],events:opts.events||[],evIdx:0,replay:!!opts.events,endBar:opts.bars||Infinity,ended:false,arr:opts.arr||null});
  engine.start=ctx.currentTime+.12;
  [busMusic,busDrum].forEach(b=>{b.gain.cancelScheduledValues(ctx.currentTime);b.gain.setValueAtTime(1,ctx.currentTime)});
  kitFilter.frequency.value=desc.S.lp||20000;busMusic.delay.forEach(dl=>dl.delayTime.value=engine.beat*.75);
  if(engine.tex){try{engine.tex.stop()}catch(e){}engine.tex=null}
  if(desc.S.tex&&SMP[desc.S.tex]){const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=SMP[desc.S.tex];s.loop=true;g.gain.value=.14;s.connect(g);g.connect(busDrum);s.start(engine.start);engine.tex=s}
  clearInterval(engine.timer);engine.timer=setInterval(schedule,25);schedule();
}
function engineStop(){engine.on=false;clearInterval(engine.timer);if(engine.tex){try{engine.tex.stop(ctx.currentTime+.4)}catch(e){}engine.tex=null}
  if(ctx){const t=ctx.currentTime;busMusic.gain.cancelScheduledValues(t);busMusic.gain.setTargetAtTime(.0001,t,.2);busDrum.gain.setTargetAtTime(.0001,t,.2)}}
function beatNow(){return ctx?(ctx.currentTime-engine.start)/engine.beat:0}
function addEnergy(i,amt){engine.energy[i]=Math.min(1,engine.energy[i]+amt)}
function schedule(){
  if(!engine.on)return;
  const ahead=ctx.currentTime+.14;
  while(engine.start+engine.step*engine.beat/4<ahead){
    const k=engine.step,t=engine.start+k*engine.beat/4;const bar=k>>4,beat=(k>>2)&3,sub=k&3;
    if(bar>=engine.endBar){finalHit(t);engine.on=false;clearInterval(engine.timer);if(engine.tex){try{engine.tex.stop(t+.5)}catch(e){}engine.tex=null}return}
    if(sub===0&&beat===0&&bar>0&&bar%4===0&&engine.onBar)engine.onBar(bar);
    if(sub===0){const b=bar*4+beat;
      if(engine.arr){const a=engine.arr[sectionAt(bar).type]||[0,0,0,0,0,0];engine.energy=a.slice()}
      else{if(engine.replay){while(engine.evIdx<engine.events.length&&engine.events[engine.evIdx][0]<=b){const e=engine.events[engine.evIdx++];addEnergy(e[1],tapEnergy(e[2],e[3]))}}
      engine.energy=engine.energy.map(e=>e*.965)}}
    playStep(k,t,bar,beat,sub);
    engine.step++;
  }
}
function tapEnergy(size,q){return (q?.3:.14)+Math.min(.3,size*.045)}
function playStep(k,t0,bar,beat,sub){
  const d=engine.desc,S=d.S,s=sectionAt(bar),E=engine.energy,ch=chordOf(d,bar),bt=engine.beat,last=s.pos===s.len-1,next=sectionAt(bar+1);
  const hum=(mulberry32(((k+1)*2654435761)^d.seed)()-.5)*.009; /* ±4,5 ms, déterministe */
  const t=t0+(sub%2?(S.swing-.5)*bt/2:0)+(sub||beat?hum:0); /* swing sur les doubles-croches impaires, le 1 reste carré */
  const dyn=DYN[s.type]*(s.level?1.04:1);
  const vol=i=>E[i]<.1?0:Math.pow(E[i],.7)*dyn;
  const chorus=s.type==='Refrain'||s.type==='Final',intro=s.type==='Intro',i16=beat*4+sub;
  /* --- Batterie --- */
  if(vol(0)>0){const v=vol(0),full=E[0]>.45&&!intro;
    if(S.half){ /* trap : demi-temps */
      if(i16===0)drum('bd',t,.9*v,S);if(beat===1&&sub===2&&(bar&1))drum('bd',t,.7*v,S);if(beat===3&&sub===1&&!(bar&1)&&E[0]>.6)drum('bd',t,.6*v,S);
      if(full&&beat===2&&sub===0)drum('sd',t,.7*v,S);
      drum('hh',t,(sub%2?.28:.42)*v,S);if(full&&beat===3&&(bar%2===1)&&sub>=2)drum('hh',t+bt/8,.3*v,S); /* roulement de triples */
      if(last&&beat===3&&sub===0&&full)drum('oh',t,.4*v,S);
    }else{
      if(S.kit==='el'){if(sub===0&&(!intro||beat===0))drum('bd',t,.85*v,S)} /* house : four on the floor */
      else if(sub===0&&(beat===0||beat===2||(chorus&&beat===3&&(bar&1))))drum('bd',t,.85*v,S);
      if(sub===2&&beat===1&&chorus&&E[0]>.7&&S.kit!=='el')drum('bd',t,.5*v,S);
      if(full&&sub===0&&(beat===1||beat===3))drum(S.kit==='el'?'cp':'sd',t,.6*v,S);
      if(sub%2===0&&!(last&&beat===3))drum(sub===2&&chorus&&(beat===3||S.kit==='el')?'oh':'hh',t,(sub?.42:.3)*v,S);
      if(last&&beat===3&&full)drum('sd',t,.3*v*(1+sub*.15),S);
    }
    if(last&&beat===0&&sub===0&&next.type!==s.type&&(next.type==='Refrain'||next.type==='Final'))riser(t,bt*4,.2);
    if(s.pos===0&&beat===0&&sub===0&&chorus)drum('cr',t,.5,S);
  }
  /* --- Percussions --- */
  if(vol(4)>0){const v=vol(4);
    if(sub%2===1&&!S.half)perc(0,t,.35*v*(sub===3?1:.7),S);
    if(sub===0&&((beat===1&&!chorus)||(beat===3))&&E[4]>.5)perc(1,t,.5*v,S);
    if(sub===2&&beat===2&&(chorus||S.half))perc(2,t,.45*v,S)}
  /* --- Basse --- */
  if(vol(1)>0){const v=vol(1),m=bassNote(ch.root),bright=600+1600*E[1];
    if(S.half){if(i16===0){const nx=bassNote(chordOf(d,bar+1).root);playBass(d,t,m,bt*2.6,.7*v,bright,(bar%2===1&&s.pos%2===1)?nx:null)}if(i16===10&&E[1]>.5)playBass(d,t,m,bt*1.2,.5*v,bright)}
    else{const pat=s.type==='Couplet'?[1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,1]:s.type==='Pré-refrain'?[1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0]:s.type==='Pont'?[1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0]:S.kit==='el'?[0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1]:[1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1];
      if(pat[i16]||(intro&&i16===0)){const oct=chorus&&i16%4===2&&S.bass!=='ebass'?12:(i16===15?-5:0);playBass(d,t,m+oct,s.type==='Pré-refrain'?bt*1.8:bt*.45,.5*v,bright)}}}
  /* --- Accords --- */
  if(vol(2)>0){const v=vol(2),notes=ch.notes.map(n=>d.root+n+48);
    if(S.chords==='stab'){if(sub===2&&(beat===0||beat===1||beat===3)&&!intro)playChord(d,t,notes,bt*.3,.5*v,0,'stab');if(beat===0&&sub===0&&(intro||s.pos%2===0))playChord(d,t,notes,bt*8,.3*v,1200+2500*E[2],'pad')}
    else if(S.chords==='piano7'){if(i16===0||(i16===10&&E[2]>.4))playChord(d,t,notes,bt*(i16?1.4:2.4),.42*v,0,'pad')}
    else if(chorus){if(i16===0||i16===6||i16===12)playChord(d,t,notes,bt*(i16===12?1:1.5),.42*v,1200+2500*E[2],i16?'stab':'pad')}
    else if(i16===0&&(s.pos%2===0||S.chords!=='piano'))playChord(d,t,notes,bt*8,.4*v,700+2800*E[2],'pad')}
  /* --- Mélodie --- */
  if(vol(3)>0&&!intro){const v=vol(3),mo=motif(d,bar),idx=(s.pos%2)*16+i16;
    mo.notes.forEach(n=>{if(n.i===idx){const m=d.root+72+mo.sc[n.deg%7]+12*Math.floor(n.deg/7);playLead(d,t,m,bt*n.len*.5,.32*v)}})}
  /* --- Voix --- */
  if(vol(5)>0&&!intro&&s.type!=='Couplet'){const v=vol(5),notes=ch.notes;
    if(sub===2&&(beat===1||beat===3))playVoice(d,t,d.root+60+notes[(beat>>1)%3],bt*.9,.22*v,bar+beat);
    if(chorus&&beat===0&&sub===0)playVoice(d,t,d.root+60+notes[2],bt*1.6,.2*v,bar)}
}
const bassNote=r=>{const m=36+(r%12);return m>43?m-12:m}; /* Sol1–Sol2 */
function finalHit(t){const d=engine.desc,ch=chordOf(d,0);drum('bd',t,.9,d.S);drum('cr',t,.6,d.S);playChord(d,t,ch.notes.map(n=>d.root+n+48),2.6,.6,2600,'pad');playBass(d,t,bassNote(d.root+ch.notes[0]),2.2,.6,900);
  if(!engine.offline)setTimeout(()=>{engine.onEnd&&engine.onEnd()},2800)}

/* ============================ EXPORT ============================ */
/* Rejoue un morceau (graine + style + journal) dans un OfflineAudioContext : même moteur, même musique.
   Retourne {buffer:AudioBuffer, notes:[...]} ; notes alimente l'export MIDI. */
async function renderTrack(t,onProgress){
  const st=STYLES[t.style]?t.style:'pop';if(!loaded.has(st))await loadStyle(st);
  const desc=describe(t.seed,st,t.over||{}),beat=60/desc.bpm,sr=44100,len=Math.ceil((t.bars*4*beat+3.2)*sr);
  const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;const off=new OAC(2,len,sr);
  const saved={ctx,master,comp,busDrum,kitFilter,busMusic,busSend,verb,noise,engine:{...engine,energy:engine.energy.slice()}};
  const wasOn=engine.on;clearInterval(engine.timer);engine.on=false;
  ctx=null;buildAudio(off);
  motifs.clear();voicings.clear();REC.on=true;REC.notes=[];
  Object.assign(engine,{on:true,offline:true,desc,beat,step:0,energy:[0,0,0,0,0,0],events:t.events||[],evIdx:0,replay:true,endBar:t.bars,start:.1,onBar:null,tex:null,arr:t.arr||null});
  [busMusic,busDrum].forEach(b=>b.gain.setValueAtTime(1,0));kitFilter.frequency.value=desc.S.lp||20000;busMusic.delay.forEach(dl=>dl.delayTime.value=beat*.75);
  if(desc.S.tex&&SMP[desc.S.tex]){const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=SMP[desc.S.tex];s.loop=true;g.gain.value=.14;s.connect(g);g.connect(busDrum);s.start(.1);s.stop(t.bars*4*beat+.1)}
  for(;;){const k=engine.step,tt=engine.start+k*beat/4,bar=k>>4,bt=(k>>2)&3,sub=k&3;
    if(bar>=t.bars){finalHit(tt);break}
    if(sub===0){if(engine.arr){engine.energy=(engine.arr[sectionAt(bar).type]||[0,0,0,0,0,0]).slice()}else{const b=bar*4+bt;while(engine.evIdx<engine.events.length&&engine.events[engine.evIdx][0]<=b){const e=engine.events[engine.evIdx++];addEnergy(e[1],tapEnergy(e[2],e[3]))}engine.energy=engine.energy.map(e=>e*.965)}}
    playStep(k,tt,bar,bt,sub);engine.step++;
    if(onProgress&&k%64===0){onProgress(bar/t.bars);await new Promise(r=>setTimeout(r,0))}}
  const notes=REC.notes;REC.on=false;REC.notes=[];
  const buffer=await off.startRendering();
  /* restauration du contexte temps réel */
  ({ctx,master,comp,busDrum,kitFilter,busMusic,busSend,verb,noise}=saved);Object.assign(engine,saved.engine,{on:false,offline:false});if(wasOn)engine.on=false;
  return {buffer,notes,desc};
}
function wavBlob(buf){const n=buf.length,ch=buf.numberOfChannels,sr=buf.sampleRate,out=new DataView(new ArrayBuffer(44+n*ch*2));
  const w=(o,s)=>{for(let i=0;i<s.length;i++)out.setUint8(o+i,s.charCodeAt(i))};
  w(0,'RIFF');out.setUint32(4,36+n*ch*2,true);w(8,'WAVE');w(12,'fmt ');out.setUint32(16,16,true);out.setUint16(20,1,true);out.setUint16(22,ch,true);out.setUint32(24,sr,true);out.setUint32(28,sr*ch*2,true);out.setUint16(32,ch*2,true);out.setUint16(34,16,true);w(36,'data');out.setUint32(40,n*ch*2,true);
  const d=[];for(let c=0;c<ch;c++)d.push(buf.getChannelData(c));let o=44;for(let i=0;i<n;i++)for(let c=0;c<ch;c++){const x=Math.max(-1,Math.min(1,d[c][i]));out.setInt16(o,x<0?x*32768:x*32767,true);o+=2}
  return new Blob([out],{type:'audio/wav'})}
/* SMF type 1 : piste tempo + une piste par canal (basse, accords, mélodie, voix, batterie GM) */
function midiBlob(notes,desc,bars){
  const PPQ=480,beat=60/desc.bpm,tick=t=>Math.max(0,Math.round((t-.1)/beat*PPQ));
  const vlq=n=>{const b=[n&127];while(n>>=7)b.unshift((n&127)|128);return b};const str=s=>[...s].map(c=>c.charCodeAt(0));
  const track=ev=>{ev.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const out=[];let last=0;for(const e of ev){out.push(...vlq(e[0]-last),...e.slice(2));last=e[0]}out.push(0,0xFF,0x2F,0);return out};
  const chunk=(id,data)=>[...str(id),(data.length>>>24)&255,(data.length>>16)&255,(data.length>>8)&255,data.length&255,...data];
  const mpq=Math.round(60000000/desc.bpm);const name=`MODUL - ${desc.name} (${desc.keyName}, ${desc.bpm} BPM)`;
  const t0=[[0,0,0xFF,0x51,3,(mpq>>16)&255,(mpq>>8)&255,mpq&255],[0,0,0xFF,0x58,4,4,2,24,8],[0,0,0xFF,0x03,...vlq(name.length),...str(name)]];
  const KEYSIG=[[0,0],[7,0],[2,0],[-3,0],[4,0],[-1,0],[6,0],[1,0],[-4,0],[3,0],[-2,0],[5,0]];let [sf]=KEYSIG[desc.root];if(desc.mode==='minor')sf=((sf-3+6+12)%12)-6; /* relative mineure */
  t0.push([0,0,0xFF,0x59,2,sf&255,desc.mode==='minor'?1:0]);
  const PROGRAM={1:desc.S.bass==='ebass'?33:38,2:desc.S.chords.startsWith('piano')?0:desc.S.chords==='stab'?2:89,3:desc.S.lead==='guitar'?27:desc.S.lead==='bells'?11:80,4:desc.S.voice==='choir'?52:54};
  const NAMES={1:'Basse',2:'Accords',3:'Mélodie',4:'Voix',9:'Batterie'};const tracks=[track(t0)];
  for(const ch of [1,2,3,4,9]){const ev=[[0,0,0xFF,0x03,...vlq(NAMES[ch].length),...str(NAMES[ch])]];if(PROGRAM[ch]!=null)ev.push([0,0,0xC0|ch,PROGRAM[ch]]);
    for(const [c,m,t,dur,v] of notes){if(c!==ch)continue;const on=tick(t),offT=Math.max(on+1,tick(t+dur));ev.push([on,1,0x90|ch,m,v],[offT,0,0x80|ch,m,0])}
    tracks.push(track(ev))}
  const head=[0,1,(tracks.length>>8)&255,tracks.length&255,(PPQ>>8)&255,PPQ&255];
  const bytes=[...chunk('MThd',head)];tracks.forEach(tr=>bytes.push(...chunk('MTrk',tr)));
  return new Blob([new Uint8Array(bytes)],{type:'audio/midi'})}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}

/* Reconstitue, sans audio, l'énergie moyenne de chaque instrument par type de section à partir du journal des tapes. */
function arrangementFrom(events,bars){const acc={},n={};let e=[0,0,0,0,0,0],i=0;
  for(let b=0;b<bars*4;b++){while(i<events.length&&events[i][0]<=b){const ev=events[i++];e[ev[1]]=Math.min(1,e[ev[1]]+tapEnergy(ev[2],ev[3]))}e=e.map(x=>x*.965);
    const type=sectionAt(Math.floor(b/4)).type;acc[type]=acc[type]||[0,0,0,0,0,0];n[type]=(n[type]||0)+1;e.forEach((x,k)=>acc[type][k]+=x)}
  const out={};for(const t in acc)out[t]=acc[t].map(x=>Math.round(x/n[t]*100)/100);return out}
