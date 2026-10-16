/* MODUL Studio — la vue 3D du cube (three.js via vendor/three.bundle.js).
   Le cube se prend en main : on le fait tourner au doigt ou à la souris, il retombe sur la face la plus proche.
   Un tap sur un pad le fait passer éteint → présent → fort. La logique (sections, pads, moteur) est dans studio.html ;
   ce fichier ne fait que dessiner et transmettre les gestes via window.STUDIO. */
import * as T from './vendor/three.bundle.js';

const S=window.STUDIO; if(!S)throw new Error('STUDIO absent');
const host=document.getElementById('stage');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- rendu ---------- */
let renderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'})}catch(e){S.noWebGL();throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0x000000,1);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;touch-action:none;outline:0';renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Cube MODUL : glisse pour tourner, tape un pad pour l’activer');
host.appendChild(renderer.domElement);
const scene=new T.Scene();
const camera=new T.PerspectiveCamera(32,1,.1,50);camera.position.set(0,0,7.2);
scene.add(new T.HemisphereLight(0xffffff,0x202028,.9));
const key=new T.DirectionalLight(0xffffff,1.8);key.position.set(3,5,6);scene.add(key);
const rim=new T.DirectionalLight(0x9db4ff,1.1);rim.position.set(-5,-2,-4);scene.add(rim);
const fill=new T.PointLight(0xffffff,25,20,2);fill.position.set(-3,3,5);scene.add(fill);

/* fond : dégradé doux dessiné dans la scène (le post-traitement ne gère pas bien la transparence) */
(function(){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');const g=x.createRadialGradient(256,200,10,256,256,340);g.addColorStop(0,'#1b1b21');g.addColorStop(.55,'#0b0b0d');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,512,512);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(60,60),new T.MeshBasicMaterial({map:t,toneMapped:false}));m.position.z=-12;scene.add(m)})();

/* ---------- le cube ---------- */
const root=new T.Group();scene.add(root);
const SIZE=2,PAD=.4,GAP=.47;
const body=new T.Mesh(new T.RoundedBoxGeometry(SIZE,SIZE,SIZE,5,.14),new T.MeshPhysicalMaterial({color:0x121216,roughness:.42,metalness:.15,clearcoat:.7,clearcoatRoughness:.25}));
root.add(body);
/* orientation de chaque face : Intro +Z, Couplet +X, Pré-refrain −Z, Refrain −X, Pont +Y, Final −Y (même ordre que le jeu) */
const FACE_ROT=[[0,0,0],[0,Math.PI/2,0],[0,Math.PI,0],[0,-Math.PI/2,0],[-Math.PI/2,0,0],[Math.PI/2,0,0]].map(e=>new T.Quaternion().setFromEuler(new T.Euler(...e)));
const padGeo=new T.RoundedBoxGeometry(PAD,PAD,.09,3,.05);
const OFF=new T.Color(0x2b2b32),OFF_E=new T.Color(0x000000);
let labelTex=S.PADS.map(p=>makeLabel(p[2],'#ffffff')),labelDark=S.PADS.map(p=>makeLabel(p[2],'#0b0b0f')),labelKey=S.PADS.map(p=>p[2]).join();
/* les noms des pads changent avec le mode (musique, lumière, séance) */
function relabel(names){const k=names.join();if(k===labelKey)return;labelKey=k;labelTex.forEach(t=>t.dispose());labelDark.forEach(t=>t.dispose());labelTex=names.map(n=>makeLabel(n,'#ffffff'));labelDark=names.map(n=>makeLabel(n,'#0b0b0f'))}
const pads=[];/* pads[face][i] = {mesh,label,face,i} */
const labelGeo=new T.PlaneGeometry(PAD*.92,PAD*.92);
for(let f=0;f<6;f++){const g=new T.Group();g.quaternion.copy(FACE_ROT[f]);root.add(g);pads[f]=[];
  for(let i=0;i<16;i++){const row=i>>2,col=i&3;const m=new T.Mesh(padGeo,new T.MeshStandardMaterial({color:OFF.clone(),emissive:OFF_E.clone(),roughness:.5,metalness:.05}));
    m.position.set((col-1.5)*GAP,(1.5-row)*GAP,SIZE/2+.03);m.userData={face:f,i};g.add(m);
    const l=new T.Mesh(labelGeo,new T.MeshBasicMaterial({map:labelTex[i],transparent:true,opacity:.5,depthWrite:false,toneMapped:false}));l.position.set(m.position.x,m.position.y,m.position.z+.062);g.add(l);
    pads[f][i]={mesh:m,label:l,face:f,i,scale:1}}}
function makeLabel(text,color){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.clearRect(0,0,256,256);x.fillStyle=color;const F='-apple-system,BlinkMacSystemFont,Inter,Helvetica,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';const up=text.toUpperCase();
  /* noms longs (« grands-parents », « encouragements ») : on réduit, puis on coupe en deux lignes */
  let size=58;x.font=`700 ${size}px ${F}`;while(x.measureText(up).width>236&&size>40){size-=2;x.font=`700 ${size}px ${F}`}
  if(x.measureText(up).width>236&&/[ -]/.test(up)){const i=up.search(/[ -]/);const a=up.slice(0,i+(up[i]==='-'?1:0)).trim(),b=up.slice(i+1).trim();size=Math.min(52,size);x.font=`700 ${size}px ${F}`;while(Math.max(x.measureText(a).width,x.measureText(b).width)>236&&size>34){size-=2;x.font=`700 ${size}px ${F}`}x.fillText(a,128,100);x.fillText(b,128,160)}
  else{while(x.measureText(up).width>236&&size>30){size-=2;x.font=`700 ${size}px ${F}`}x.fillText(up,128,132)}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t}

const INSTC=S.INST.map(x=>new T.Color(x.c));
const colorCache={};function colorOf(i){const h=S.padColor&&S.padColor(i);if(!h)return INSTC[S.PADS[i][0]];return colorCache[h]||(colorCache[h]=new T.Color(h))}
const DIM=new T.Color(0x1a1a1f);
export function refresh(){if(S.padNames)relabel(S.padNames());const used=S.used?S.used():null;for(let f=0;f<6;f++){const t=S.TYPES[f],lv=S.proj.pads[t],off=used&&!used.includes(t);for(let i=0;i<16;i++){const p=pads[f][i],l=off?0:lv[i],c=colorOf(i);const mat=p.mesh.material;
  if(off){mat.color.copy(DIM);mat.emissive.set(0);mat.emissiveIntensity=0;p.label.material.map=labelTex[i];p.label.material.opacity=.14;p.label.material.needsUpdate=true;continue}
  /* éteint : gris mat, nom en blanc discret · présent : couleur pleine, nom sombre · fort : couleur + légère lueur */
  const lm=p.label.material;
  if(l===0){mat.color.copy(OFF);mat.emissive.set(0);mat.emissiveIntensity=0;lm.map=labelTex[i];lm.opacity=.45}
  else if(l===1){mat.color.copy(c).multiplyScalar(.8);mat.emissive.copy(c);mat.emissiveIntensity=.1;lm.map=labelDark[i];lm.opacity=.8}
  else{mat.color.copy(c);mat.emissive.copy(c);mat.emissiveIntensity=.55;lm.map=labelDark[i];lm.opacity=.9}
  lm.needsUpdate=true}}}

/* ---------- post-traitement : lueur des pads « fort » ---------- */
const composer=new T.EffectComposer(renderer);composer.addPass(new T.RenderPass(scene,camera));
const bloom=new T.UnrealBloomPass(new T.Vector2(1,1),reduce?.1:.22,.25,.92);composer.addPass(bloom);composer.addPass(new T.OutputPass());

/* ---------- taille ---------- */
function resize(){const w=host.clientWidth||1,h=host.clientHeight||1;renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;
  /* le cube doit tenir dans le plus petit côté, avec de l'air */
  const a=w/h,base=7.2;camera.position.z=a<1?base/Math.min(1,a*1.15):base;camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(host);resize();

/* ---------- manipulation : glisser pour tourner, relâcher pour retomber sur une face ---------- */
const st={down:false,moved:false,x:0,y:0,t:0,vx:0,vy:0,snapping:false,target:null,snapT:0,from:null};
const ray=new T.Raycaster(),ndc=new T.Vector2();
const el=renderer.domElement;
el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);st.down=true;st.moved=false;st.x=e.clientX;st.y=e.clientY;st.t=performance.now();st.vx=st.vy=0;st.snapping=false;S.onGrab&&S.onGrab()});
el.addEventListener('pointermove',e=>{if(!st.down)return;const dx=e.clientX-st.x,dy=e.clientY-st.y;if(!st.moved&&Math.hypot(dx,dy)<6)return;st.moved=true;
  rotateBy(dx,dy);const now=performance.now(),dt=Math.max(1,now-st.t);st.vx=dx/dt;st.vy=dy/dt;st.x=e.clientX;st.y=e.clientY;st.t=now});
const up=e=>{if(!st.down)return;st.down=false;if(!st.moved){tap(e);return}if(Math.hypot(st.vx,st.vy)<.05)snapToNearest()};
el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
function rotateBy(dx,dy){const k=.0115;const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),dx*k).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),dy*k));root.quaternion.premultiply(q)}
function tap(e){const r=el.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
  const hits=ray.intersectObjects(pads.flat().map(p=>p.mesh),false);if(!hits.length)return;const {face,i}=hits[0].object.userData;S.toggle(face,i);bump(pads[face][i])}
function bump(p){p.scale=1.18}

/* face tournée vers la caméra */
const N=new T.Vector3();
export function facingFace(){let best=0,bd=-2;for(let f=0;f<6;f++){N.set(0,0,1).applyQuaternion(FACE_ROT[f]).applyQuaternion(root.quaternion);if(N.z>bd){bd=N.z;best=f}}return best}
function targetFor(f){return FACE_ROT[f].clone().invert()}
export function goFace(f){st.from=root.quaternion.clone();st.target=targetFor(f);st.snapT=0;st.snapping=true;st.vx=st.vy=0}
function snapToNearest(){goFace(facingFace())}
/* pulsation sur le temps pendant la lecture */
export function pulse(face,strength=1){const t=S.TYPES[face],lv=S.proj.pads[t];for(let i=0;i<16;i++)if(lv[i])pads[face][i].scale=1+.08*strength*lv[i]}

/* ---------- boucle ---------- */
let last=performance.now(),lastFacing=-1;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!st.down&&!st.snapping&&(Math.abs(st.vx)>.001||Math.abs(st.vy)>.001)){rotateBy(st.vx*dt*1000,st.vy*dt*1000);st.vx*=Math.pow(.08,dt);st.vy*=Math.pow(.08,dt);if(Math.hypot(st.vx,st.vy)<.03){st.vx=st.vy=0;snapToNearest()}}
  if(st.snapping){st.snapT=Math.min(1,st.snapT+dt/(reduce?.01:.55));const k=1-Math.pow(1-st.snapT,3);root.quaternion.slerpQuaternions(st.from,st.target,k);if(st.snapT>=1)st.snapping=false}
  for(const f of pads)for(const p of f){if(p.scale!==1){p.scale+=(1-p.scale)*Math.min(1,dt*14);if(Math.abs(p.scale-1)<.004)p.scale=1;p.mesh.scale.setScalar(p.scale);p.label.scale.setScalar(p.scale)}}
  const ff=facingFace();if(ff!==lastFacing){lastFacing=ff;S.onFacing(ff)}
  fill.position.x=-3+Math.sin(now*.0004)*1.5;
  composer.render();requestAnimationFrame(frame)}
requestAnimationFrame(frame);

/* clavier : flèches pour tourner, Entrée/Espace gérés par la page */
el.addEventListener('keydown',e=>{const f=facingFace();const nextH=[[1,3],[2,0],[3,1],[0,2],[1,3],[1,3]];
  if(e.key==='ArrowRight')goFace(nextH[f][0]);else if(e.key==='ArrowLeft')goFace(nextH[f][1]);else if(e.key==='ArrowUp')goFace(f===4?2:f===5?0:4);else if(e.key==='ArrowDown')goFace(f===5?2:f===4?0:5);else return;e.preventDefault()});

refresh();root.quaternion.copy(targetFor(0));
S.attachView({goFace,refresh,pulse,facingFace,bump:(f,i)=>bump(pads[f][i])});
