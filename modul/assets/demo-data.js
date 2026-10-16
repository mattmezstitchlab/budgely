/* MUSICBOX — jeu de données de DÉMONSTRATION.
   Déterministe (seed fixe). Sert uniquement à montrer l'interface de La Cote et du Studio
   tant qu'aucun backend ne collecte de vraies écoutes. Tout est inventé. */
(function(root){
'use strict';
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd=mulberry32(20261016);
const GENRES=['Électro','Hip-hop','Pop','Rock','Chanson','Jazz','Ambient','Afro'];
const REGIONS=['Hauts-de-France','Île-de-France','Belgique','Auvergne-Rhône-Alpes','Occitanie','Bretagne','Suisse romande','Québec'];
const COLORS=['#00e985','#ffe400','#a14bdf','#00c8d6','#ff286c','#ff9000'];
const TYPES=['Titre','Titre','Titre','Titre','Podcast','Bande-annonce','Événement','Titre','Titre','Marque via artiste'];
const names=[
['Zoé','Nuit Bleue'],['Kasimir','Rue des Postes'],['Lune Faible','Tramway 4h12'],['Oriel','Sel & Sable'],['Mado','Encore un tour'],
['Nébuleuse FM','Épisode 12 — La scène lilloise'],['Ciné Majestic','Bande-annonce : Les Dunes'],['Festival Latitudes','Édition 2026 · Teaser'],
['Hassan Idrissi','Bab el Nord'],['Toundra','Verre dépoli'],['Petra & les Lampes','Dimanche sans fin'],['Dorian Vey','Grand Large'],
['Les Orfèvres','Fil rouge'],['Marguerite Cole','Blue Hour'],['Radio Campus','Live session #88'],['Salle Le Grand Mix','Nuit électro · 24 oct.'],
['Ilan K','Trop vite'],['Clémence Ardent','Les Toits'],['Vesper','Métal doux'],['Brasserie du Nord × Oriel','Sel & Sable (session acoustique)'],
['Nova Nord','Cent lumières'],['Amine Delcourt','Porte de Paris'],['Juno Ravel','Photosensible'],['Sœurs Lagrange','Trois heures du matin'],
];
const tracks=names.map((n,i)=>{
  const days=30,base=20+rnd()*140,trend=(rnd()-.35)*4,burst=rnd()<.3?Math.floor(rnd()*20)+5:-1;
  const plays=[];
  for(let d=0;d<days;d++){let v=base+trend*d+(rnd()-.5)*base*.35;if(burst>=0&&d>=burst)v+=base*(1.2*Math.exp(-(d-burst)/6));plays.push(Math.max(2,Math.round(v)))}
  const total=plays.reduce((a,b)=>a+b,0),last7=plays.slice(-7).reduce((a,b)=>a+b,0),prev7=plays.slice(-14,-7).reduce((a,b)=>a+b,0);
  const onBeat=.28+rnd()*.4,shareRate=.04+rnd()*.1,convRate=.008+rnd()*.03;
  const shares=Math.round(total*shareRate),clicks=Math.round(shares*(1.5+rnd()*2)),conversions=Math.round(clicks*convRate*8);
  const early=Math.round(12+rnd()*120);
  return {id:'t'+(i+1),artist:n[0],title:n[1],type:TYPES[i%TYPES.length],genre:GENRES[Math.floor(rnd()*GENRES.length)],region:REGIONS[Math.floor(rnd()*REGIONS.length)],color:COLORS[i%6],bpm:Math.round(84+rnd()*70),
    plays,total,last7,prev7,delta:prev7?(last7-prev7)/prev7:1,minutes:Math.round(total*2.6),onBeat,shares,clicks,conversions,early,sponsored:TYPES[i%TYPES.length]!=='Titre'||rnd()<.15};
});
function score(t){return t.last7*(1+t.onBeat)+t.shares*.6+t.conversions*6}
tracks.forEach(t=>t.score=Math.round(score(t)));
/* inventaire par région (7 derniers jours), fictif */
const inventory={};REGIONS.forEach(r=>{inventory[r]={plays7:Math.round(400+rnd()*3800),minutes7:0,age1834:Math.round(48+rnd()*30),topGenre:GENRES[Math.floor(rnd()*GENRES.length)]};inventory[r].minutes7=Math.round(inventory[r].plays7*2.6)});
root.MUSICBOX_DEMO={tracks,GENRES,REGIONS,COLORS,inventory,cpp:0.12,generatedAt:'2026-10-16'};
})(typeof self!=='undefined'?self:this);
