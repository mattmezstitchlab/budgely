/* MUSICBOX — serveur minimal (Node ≥ 22.13, zéro dépendance).
   - sert la plateforme (landing, jeu, Cote, Studio) en statique
   - API :
       POST /api/plays     une piste jouée (envoyée par le jeu à la fin d'un niveau)
       POST /api/events    partage / clic sur le lien artiste
       GET  /api/cote      agrégats 30 jours : classement, inventaire par région, totaux
       GET/POST /api/tracks  morceaux composés dans le jeu (classement « playlist », rejouables)
       GET  /api/health
   Données : SQLite (node:sqlite) dans chroma/server/data/musicbox.db
   Lancement : node chroma/server/server.mjs   (PORT=8090 par défaut, HOST=0.0.0.0)
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const DATA_DIR=process.env.MUSICBOX_DATA||path.join(__dirname,'data');
fs.mkdirSync(DATA_DIR,{recursive:true});
const db=new DatabaseSync(path.join(DATA_DIR,'musicbox.db'));
db.exec(`
CREATE TABLE IF NOT EXISTS plays(
  id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, player TEXT NOT NULL,
  title TEXT NOT NULL, artist TEXT NOT NULL, track_url TEXT, partner INTEGER DEFAULT 0, real INTEGER DEFAULT 0,
  win INTEGER, collected INTEGER, goal INTEGER, on_beat INTEGER, taps INTEGER, minutes REAL, region TEXT, daily INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS plays_ts ON plays(ts);
CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, player TEXT NOT NULL, type TEXT NOT NULL,
  title TEXT, artist TEXT, track_url TEXT, region TEXT
);
CREATE INDEX IF NOT EXISTS events_ts ON events(ts);
CREATE TABLE IF NOT EXISTS tracks(
  id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, player TEXT NOT NULL, name TEXT NOT NULL,
  seed INTEGER NOT NULL, bpm INTEGER, key_name TEXT, bars INTEGER, seconds REAL, score INTEGER, sections INTEGER, max_combo INTEGER, events TEXT
);
CREATE INDEX IF NOT EXISTS tracks_bars ON tracks(bars);
`);
try{db.exec('ALTER TABLE tracks ADD COLUMN style TEXT')}catch(e){}
const insTrack=db.prepare(`INSERT INTO tracks(ts,player,name,seed,bpm,key_name,bars,seconds,score,sections,max_combo,events,style) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const selTop=db.prepare(`SELECT id,ts,player,name,seed,bpm,key_name keyName,bars,seconds,score,sections,max_combo maxCombo,style FROM tracks WHERE ts>=? ORDER BY bars DESC, score DESC LIMIT ?`);
const selTrack=db.prepare(`SELECT id,ts,player,name,seed,bpm,key_name keyName,bars,seconds,score,sections,max_combo maxCombo,style,events FROM tracks WHERE id=?`);
const insPlay=db.prepare(`INSERT INTO plays(ts,player,title,artist,track_url,partner,real,win,collected,goal,on_beat,taps,minutes,region,daily) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insEvent=db.prepare(`INSERT INTO events(ts,player,type,title,artist,track_url,region) VALUES(?,?,?,?,?,?,?)`);
const selPlays=db.prepare(`SELECT * FROM plays WHERE ts>=? ORDER BY ts`);
const selEvents=db.prepare(`SELECT * FROM events WHERE ts>=?`);
const selFirstSeen=db.prepare(`SELECT title,artist,MIN(ts) first FROM plays GROUP BY title,artist`);
const selEarly=db.prepare(`SELECT COUNT(DISTINCT player) n FROM plays WHERE title=? AND artist=? AND ts<?`);

const DAY=86400000;
const str=(v,max)=>String(v==null?'':v).trim().slice(0,max);
const int=(v,lo,hi)=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):0};
const num=(v,lo,hi)=>{const n=Number(v);return Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):0};

/* anti-abus léger : 60 écritures / minute / IP */
const buckets=new Map();
function allow(ip){const now=Date.now();const b=buckets.get(ip)||{t:now,n:0};if(now-b.t>60000){b.t=now;b.n=0}b.n++;buckets.set(ip,b);return b.n<=60}

function cote(){
const now=Date.now(),since=now-30*DAY;
const plays=selPlays.all(since),events=selEvents.all(since);
const firstSeen=new Map(selFirstSeen.all().map(r=>[r.title+'|'+r.artist,r.first]));
const tracks=new Map(),inventory={},totals={plays7:0,prev7:0,minutes7:0,onBeatTaps:0,taps:0};
const counted=p=>p.win||(p.goal>0&&p.collected>=p.goal*.5); // un niveau abandonné avant 50 % ne compte pas
for(const p of plays){
  if(!counted(p))continue;
  const key=p.title+'|'+p.artist;const day=Math.min(29,Math.floor((now-p.ts)/DAY));
  const t=tracks.get(key)||{key,title:p.title,artist:p.artist,url:p.track_url||'',partner:!!p.partner,real:!!p.real,plays:new Array(30).fill(0),total:0,last7:0,prev7:0,minutes:0,onBeatTaps:0,taps:0,shares:0,clicks:0,conversions:0,players:new Set(),regions:{}};
  t.plays[29-day]++;t.total++;t.minutes+=p.minutes||0;t.onBeatTaps+=p.on_beat||0;t.taps+=p.taps||0;t.players.add(p.player);
  if(day<7){t.last7++;totals.plays7++;totals.minutes7+=p.minutes||0;totals.onBeatTaps+=p.on_beat||0;totals.taps+=p.taps||0}else if(day<14){t.prev7++;totals.prev7++}
  const r=p.region||'Non renseignée';t.regions[r]=(t.regions[r]||0)+1;
  if(day<7){inventory[r]=inventory[r]||{plays7:0,minutes7:0};inventory[r].plays7++;inventory[r].minutes7+=p.minutes||0}
  tracks.set(key,t);
}
for(const e of events){const t=tracks.get(e.title+'|'+e.artist);if(!t)continue;if(e.type==='share')t.shares++;else if(e.type==='click')t.clicks++;else if(e.type==='conversion')t.conversions++}
const list=[...tracks.values()].map(t=>{
  const first=firstSeen.get(t.key)||now;const early=selEarly.get(t.title,t.artist,first+7*DAY).n;
  const onBeat=t.taps?t.onBeatTaps/t.taps:0;
  const region=Object.entries(t.regions).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
  return {key:t.key,title:t.title,artist:t.artist,url:t.url,partner:t.partner,real:t.real,plays:t.plays,total:t.total,last7:t.last7,prev7:t.prev7,delta:t.prev7?(t.last7-t.prev7)/t.prev7:(t.last7?1:0),minutes:Math.round(t.minutes),onBeat,shares:t.shares,clicks:t.clicks,conversions:t.conversions,early,players:t.players.size,region,regions:t.regions,score:Math.round(t.last7*(1+onBeat)+t.shares*.6+t.conversions*6)};
}).sort((a,b)=>b.score-a.score);
return {generatedAt:new Date(now).toISOString(),days:30,real:list.length>0,tracks:list,inventory,totals:{...totals,minutes7:Math.round(totals.minutes7),onBeat:totals.taps?totals.onBeatTaps/totals.taps:0},rawPlays30:plays.length};
}

const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.flac':'audio/flac','.ogg':'audio/ogg','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
function send(res,code,body,type='application/json'){res.writeHead(code,{'Content-Type':type,'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store'});res.end(typeof body==='string'?body:JSON.stringify(body))}
function readJson(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>120000){reject(new Error('too large'));req.destroy()}});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}});req.on('error',reject)})}

const server=http.createServer(async(req,res)=>{
try{
const url=new URL(req.url,'http://x');const p=url.pathname;const ip=req.headers['x-forwarded-for']?.split(',')[0]||req.socket.remoteAddress||'?';
if(req.method==='OPTIONS')return send(res,204,'');
if(p==='/api/health')return send(res,200,{ok:true,ts:Date.now()});
if(p==='/api/cote'&&req.method==='GET')return send(res,200,cote());
if(p==='/api/plays'&&req.method==='POST'){
  if(!allow(ip))return send(res,429,{error:'trop de requêtes'});
  const b=await readJson(req);
  const title=str(b.title,120),artist=str(b.artist,80),player=str(b.player,40)||'anon';
  if(!title||!artist)return send(res,400,{error:'title et artist requis'});
  insPlay.run(Date.now(),player,title,artist,str(b.trackUrl,500)||null,b.partner?1:0,b.real?1:0,b.win?1:0,int(b.collected,0,999),int(b.goal,0,999),int(b.onBeatTaps,0,999),int(b.taps,0,999),num(b.minutes,0,60),str(b.region,60)||null,b.daily?1:0);
  return send(res,201,{ok:true});
}
if(p==='/api/events'&&req.method==='POST'){
  if(!allow(ip))return send(res,429,{error:'trop de requêtes'});
  const b=await readJson(req);const type=str(b.type,20);
  if(!['share','click','conversion'].includes(type))return send(res,400,{error:'type invalide'});
  insEvent.run(Date.now(),str(b.player,40)||'anon',type,str(b.title,120)||null,str(b.artist,80)||null,str(b.trackUrl,500)||null,str(b.region,60)||null);
  return send(res,201,{ok:true});
}
if(p==='/api/tracks'&&req.method==='GET'){
  const id=url.searchParams.get('id');
  if(id){const t=selTrack.get(int(id,0,1e12));if(!t)return send(res,404,{error:'inconnu'});t.events=JSON.parse(t.events||'[]');return send(res,200,t)}
  return send(res,200,{days:30,tracks:selTop.all(Date.now()-30*DAY,int(url.searchParams.get('limit')||50,1,100))});
}
if(p==='/api/tracks'&&req.method==='POST'){
  if(!allow(ip))return send(res,429,{error:'trop de requêtes'});
  const b=await readJson(req);const name=str(b.name,60),events=Array.isArray(b.events)?b.events.slice(0,4000):[];
  const bars=int(b.bars,1,100000);if(!name||!bars)return send(res,400,{error:'name et bars requis'});
  const ev=events.filter(e=>Array.isArray(e)&&e.length===4).map(e=>[num(e[0],0,1e6),int(e[1],0,5),int(e[2],2,99),e[3]?1:0]);
  const r=insTrack.run(Date.now(),str(b.player,40)||'anon',name,int(b.seed,0,2**31),int(b.bpm,60,200),str(b.keyName,20)||null,bars,num(b.seconds,0,36000),int(b.score,0,1e9),int(b.sections,0,9999),int(b.maxCombo,0,999),JSON.stringify(ev),str(b.style,20)||null);
  return send(res,201,{ok:true,id:Number(r.lastInsertRowid)});
}
if(p.startsWith('/api/'))return send(res,404,{error:'inconnu'});
/* statique */
let file=path.normalize(path.join(ROOT,decodeURIComponent(p)));
if(!file.startsWith(ROOT)||file.startsWith(path.join(ROOT,'server')))return send(res,403,'Interdit','text/plain');
if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
if(!fs.existsSync(file))return send(res,404,'Introuvable','text/plain');
res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':/\/samples\//.test(file)?'public, max-age=31536000, immutable':'no-cache'});
fs.createReadStream(file).pipe(res);
}catch(e){send(res,500,{error:'erreur serveur'})}
});
const PORT=Number(process.env.PORT||8090),HOST=process.env.HOST||'0.0.0.0';
server.listen(PORT,HOST,()=>console.log(`[musicbox] http://${HOST}:${PORT}  données : ${DATA_DIR}`));
