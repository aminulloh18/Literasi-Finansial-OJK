/* dunia.js - tambahan dunia 3D: kendaraan, hewan, gedung topik, multiplayer, tampilan guru.
   Pasang: letakkan di folder yang sama dengan index.html, lalu tambah SATU baris sebelum </body>:
   <script src="dunia.js"></script> */
(function(){
const st=document.createElement('style');st.textContent=`
body{background:radial-gradient(1100px 600px at 15% -10%,#1e3a5f66,transparent),radial-gradient(900px 500px at 100% 0,#f59e0b26,transparent),#0F172A}
.card{background:linear-gradient(160deg,#1E293Bf2,#172033f2);border:1px solid #33415588;border-left:4px solid var(--a);box-shadow:0 10px 30px #0006}
button{transition:transform .12s,filter .12s}button:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.1)}button:active{transform:scale(.97)}
#app.wide:has(#ctl){max-width:1100px;display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:0 18px;align-items:start}
#app.wide:has(#ctl)>h1,#app.wide:has(#ctl)>p{grid-column:1/-1}
#app.wide:has(#ctl)>h1{font-size:36px;background:linear-gradient(90deg,#F59E0B,#FDE68A);-webkit-background-clip:text;background-clip:text;color:transparent}
#app.wide:has(#ctl)>div:nth-of-type(2),#app.wide:has(#ctl)>div:nth-of-type(3){grid-column:1/-1}
#ph{background:#F59E0B22;color:#FBBF24;border-radius:99px;padding:2px 10px;font-weight:700}
tr:nth-child(even) td{background:#ffffff08}
#hud{position:absolute;top:12px;left:12px;display:none;gap:8px;flex-wrap:wrap;pointer-events:auto;z-index:6}
.pill{background:#0F172Acc;color:#FDE68A;border:1px solid #F59E0B88;border-radius:99px;padding:8px 14px;font-weight:700}`;
document.head.appendChild(st);
const $=id=>document.getElementById(id),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const mat=c=>new THREE.MeshLambertMaterial({color:c});
const box=(w,h,d,c,x,y,z,g)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
const wheel=(x,y,z,g,r)=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(r||.6,r||.6,.4,10),mat(0x212121));w.rotation.z=Math.PI/2;w.position.set(x,y,z);g.add(w)};
const rider=(g,y,z)=>{const r=createCharacter(pick(skins));r.group.scale.setScalar(.45);r.group.position.set(0,y,z);g.add(r.group)};
function car(){const g=new THREE.Group();box(3,1.2,6,pick([0xE53935,0x1E88E5,0xFDD835,0x43A047,0xFFFFFF,0x8E24AA]),0,1.1,0,g);box(2.6,1,3,0xB3E5FC,0,2.2,-.3,g);[[-1.5,2],[1.5,2],[-1.5,-2],[1.5,-2]].forEach(p=>wheel(p[0],.6,p[1],g));return g}
function motor(){const g=new THREE.Group();box(.5,.6,2.4,pick([0xD32F2F,0x212121,0x1565C0]),0,1,0,g);wheel(0,.6,1.1,g);wheel(0,.6,-1.1,g);rider(g,.9,-.2);return g}
function becak(){const g=new THREE.Group();box(2.4,.4,3,0x6D4C41,0,1.2,1.2,g);box(2.6,.2,3.2,pick([0xE53935,0xFDD835,0x00ACC1]),0,3.4,1.2,g);box(.2,2,.2,0x6D4C41,-1.1,2.3,2.6,g);box(.2,2,.2,0x6D4C41,1.1,2.3,2.6,g);wheel(-1.4,.7,1.4,g,.7);wheel(1.4,.7,1.4,g,.7);wheel(0,.7,-1.6,g,.7);rider(g,1,-1.6);return g}
const veh=[];
function spawnVeh(){const lanes=[[0,-2.5,1,0],[0,2.5,-1,0],[-2.5,0,0,1],[2.5,0,0,-1]];
 for(let i=0;i<22;i++){const f=pick([car,car,motor,motor,becak]),g=f(),l=pick(lanes),al=rnd(-150,150),sp=f===becak?rnd(.12,.18):f===motor?rnd(.45,.65):rnd(.3,.45);
  g.position.set(l[2]?al:l[0],0,l[3]?al:l[1]);g.rotation.y=l[2]>0?Math.PI/2:l[2]<0?-Math.PI/2:l[3]>0?0:Math.PI;scene.add(g);veh.push({g,dx:l[2],dz:l[3],sp})}}
function animal(k){const g=new THREE.Group();
 if(k==='sapi'){box(2,1.6,3.4,0xFFFFFF,0,2,0,g);box(1.2,1.2,1.2,0xFFFFFF,0,2.6,2.1,g);box(.9,.9,.1,0x212121,.6,2.4,0,g);[[-.7,1.2],[.7,1.2],[-.7,-1.2],[.7,-1.2]].forEach(p=>box(.4,1.3,.4,0x424242,p[0],.65,p[1],g))}
 else if(k==='kambing'){box(1.2,1,2,0xBCAAA4,0,1.5,0,g);box(.8,.8,.8,0xBCAAA4,0,2.1,1.3,g);[[-.4,.7],[.4,.7],[-.4,-.7],[.4,-.7]].forEach(p=>box(.25,1,.25,0x6D4C41,p[0],.5,p[1],g))}
 else{box(.7,.7,1,0xFFFFFF,0,.8,0,g);box(.4,.5,.4,0xFFFFFF,0,1.3,.5,g);box(.15,.2,.2,0xE53935,0,1.65,.5,g);box(.15,.5,.15,0xFFB300,-.15,.25,0,g);box(.15,.5,.15,0xFFB300,.15,.25,0,g)}
 return g}
const an=[];
function spawnAn(){[...'sssskkkkaaaaaa'].forEach(c=>{const k=c=='s'?'sapi':c=='k'?'kambing':'ayam',g=animal(k);g.position.set(rnd(-110,110),0,rnd(-110,110));scene.add(g);an.push({g,t:new THREE.Vector3(rnd(-110,110),0,rnd(-110,110)),w:0,sp:k=='ayam'?.04:.025})})}
function trees(){for(let i=0;i<70;i++){let x,z;do{x=rnd(-140,140);z=rnd(-140,140)}while(Math.abs(x)<14||Math.abs(z)<14);const g=new THREE.Group();box(.8,3,.8,0x6D4C41,0,1.5,0,g);const c=new THREE.Mesh(new THREE.ConeGeometry(2.5,5,8),mat(0x2E7D32));c.position.y=5;c.castShadow=true;g.add(c);g.position.set(x,0,z);scene.add(g)}}
/* ===== gedung topik: soal diberi awalan [Aljabar] [Geometri] [Peluang] [Bilangan] ===== */
const BL=[{tp:'aljabar',n:'ALJABAR',c:0x1E88E5,x:30,z:30},{tp:'geometri',n:'GEOMETRI',c:0x43A047,x:-30,z:30},{tp:'peluang',n:'ANALISIS DATA & PELUANG',c:0x8E24AA,x:30,z:-30},{tp:'bilangan',n:'BILANGAN',c:0xFB8C00,x:-30,z:-30}];
const blds=[],beac=[];
function sign(t){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d'),lg=t.length>12;g.fillStyle='#0F172A';g.fillRect(0,0,512,128);g.strokeStyle='#F59E0B';g.lineWidth=8;g.strokeRect(4,4,504,120);g.fillStyle='#FDE68A';g.font='bold '+(lg?32:54)+'px sans-serif';g.textAlign='center';g.fillText(t,256,lg?76:84);return new THREE.Mesh(new THREE.PlaneGeometry(11,2.75),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}))}
function build(){
 const mq=scene.children.find(o=>o.isGroup&&Math.abs(o.position.x+25)<.01&&Math.abs(o.position.z+25)<.01);if(mq)mq.position.set(-70,0,-70);
 BL.forEach(b=>{scene.children.slice().forEach(o=>{if(o.isGroup&&o!==mq&&o!==player.group&&!bots.some(k=>k.char.group===o)&&!questionBoxes.some(k=>k.mesh===o)&&!veh.some(k=>k.g===o)&&!an.some(k=>k.g===o)&&Math.hypot(o.position.x-b.x,o.position.z-b.z)<16)scene.remove(o)});
  const g=new THREE.Group();box(16,10,16,b.c,0,5,0,g);box(17,1,17,0xFFFFFF,0,10.5,0,g);box(3.4,5,.4,0x263238,0,2.5,8.1,g);box(5,.5,2,0xFFFFFF,0,5.3,8.8,g);
  const s=sign(b.n);s.position.set(0,8,8.15);g.add(s);
  const o=new THREE.Mesh(new THREE.OctahedronGeometry(1.6),new THREE.MeshLambertMaterial({color:0xFFD700,emissive:0xAA6600}));o.position.y=14;g.add(o);beac.push(o);
  g.position.set(b.x,0,b.z);g.rotation.y=Math.atan2(-b.x,-b.z);scene.add(g);
  blds.push({tp:b.tp,door:new THREE.Vector3(0,0,10.2).applyEuler(new THREE.Euler(0,g.rotation.y,0)).add(g.position)})})}
function closeQ(){$('quiz-modal').style.display='none';if(activeBox){activeBox.active=false;scene.remove(activeBox.mesh);activeBox=null}gameActive=true}
function openUI(){gameActive=false;for(const k in keys)keys[k]=false;joy.x=joy.y=0;$('quiz-modal').style.display='flex';target=$('quiz-modal-content')}
mandiri=async function(tp){tp=tp||'umum';stop();openUI();target.innerHTML='<div class="card"><div class="big">Mengambil soal...</div></div>';
 try{const j=await api('qt',{pid:S.pid,tp});$('flee-btn').style.display='block';
  if(j.done){target.innerHTML=`<div class=card><div class=big>${j.n?'Semua soal di sini sudah kamu jawab 🎉':'Belum ada soal di sini. Tunggu guru mengisinya.'}</div></div>`;if(tp=='umum'&&activeBox){activeBox.active=false;scene.remove(activeBox.mesh);activeBox=null}return}
  off=j.now-Date.now();
  qView(j.q,j.dur,j.t0,S.total,async l=>{$('flee-btn').style.display='none';let r;
   try{r=await api('ans',{pid:S.pid,i:j.i,j:l})}catch(e){if(/Sudah|habis/.test(e.message)){closeQ();return}throw e}
   resView(r,l,()=>tp=='umum'?closeQ():mandiri(tp));$('flee-btn').style.display='block'})}
 catch(e){err(e);window.fleeQuiz()}};
function showLb(){activeBox=null;openUI();$('flee-btn').style.display='block';board(false)}
/* ===== multiplayer: posisi lewat Apps Script tiap 2,5 detik ===== */
const rem={};let syncOn=false,lastP=new THREE.Vector3();
function tag(txt){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.fillStyle='rgba(15,23,42,.8)';g.fillRect(0,8,256,48);g.fillStyle='#F59E0B';g.font='bold 30px sans-serif';g.textAlign='center';g.fillText(String(txt).slice(0,16),128,44);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));s.scale.set(6,1.5,1);s.position.y=6.4;return s}
function applyRem(list){const seen={};list.forEach(r=>{seen[r[0]]=1;let o=rem[r[0]];if(!o){const c=createCharacter(skins[r[5]%skins.length]||skins[0]);c.group.add(tag(r[1]));c.group.position.set(r[2],0,r[3]);scene.add(c.group);o=rem[r[0]]={c,t:new THREE.Vector3(),ry:0,ph:0}}o.t.set(r[2],0,r[3]);o.ry=r[4]});
 for(const id in rem)if(!seen[id]){scene.remove(rem[id].c.group);delete rem[id]}}
async function sync(){if(!S.pid)return;const g=player.group;lastP.copy(g.position);
 try{const j=await api('pos',{pid:S.pid,x:+g.position.x.toFixed(1),z:+g.position.z.toFixed(1),ry:+g.rotation.y.toFixed(2),sk:currentSkinIndex});applyRem(j.p);$('hud-sc').textContent='⭐ '+j.me.poin+(j.me.rank?' · #'+j.me.rank:'');$('hud-on').textContent='👥 '+(j.p.length+1)}catch(e){}
 setTimeout(sync,2500)}
function loop(){requestAnimationFrame(loop);const t=performance.now()/1000,pp=player.group.position;
 veh.forEach(v=>{const p=v.g.position;p.x+=v.dx*v.sp;p.z+=v.dz*v.sp;if(Math.abs(p.x)>150)p.x=-Math.sign(p.x)*150;if(Math.abs(p.z)>150)p.z=-Math.sign(p.z)*150;
  if(p.distanceTo(pp)<2.8){const a=pp.clone().sub(p);a.y=0;a.normalize();pp.addScaledVector(a,.8)}});
 an.forEach(a=>{const p=a.g.position;if(a.w>0){a.w--;return}const d=a.t.clone().sub(p);d.y=0;if(d.length()<1){a.w=rnd(60,200);a.t.set(rnd(-110,110),0,rnd(-110,110));return}d.normalize();p.addScaledVector(d,a.sp);a.g.rotation.y=Math.atan2(d.x,d.z);p.y=Math.abs(Math.sin(t*6+p.x))*.12});
 beac.forEach((o,i)=>{o.rotation.y+=.03;o.position.y=14+Math.sin(t*2+i)*.5});
 for(const id in rem){const o=rem[id],g=o.c.group,d=g.position.distanceTo(o.t);if(d>40)g.position.copy(o.t);else g.position.lerp(o.t,.05);let df=o.ry-g.rotation.y;while(df>Math.PI)df-=2*Math.PI;while(df<-Math.PI)df+=2*Math.PI;g.rotation.y+=df*.1;
  if(d>.3){o.ph+=.25;const s=Math.sin(o.ph)*.8;o.c.leftLeg.rotation.x=s;o.c.rightLeg.rotation.x=-s;o.c.leftArm.rotation.x=-s;o.c.rightArm.rotation.x=s}else{o.c.leftLeg.rotation.x*=.8;o.c.rightLeg.rotation.x*=.8;o.c.leftArm.rotation.x*=.8;o.c.rightArm.rotation.x*=.8}}
 if(gameActive&&!inMenu&&S.mode!='live')for(const b of blds)if(pp.distanceTo(b.door)<4){activeBox=null;$('flee-btn').style.display='block';mandiri(b.tp);break}}
function dunia(){if(window.__dn)return;window.__dn=1;
 $('game-ui').insertAdjacentHTML('afterbegin','<div id="hud"><div class="pill" id="hud-sc">⭐ 0 poin</div><div class="pill" id="hud-on">👥 1</div><button class="s" id="hud-lb" style="border-radius:99px">🏆 Klasemen</button></div>');
 $('hud-lb').onclick=showLb;spawnVeh();spawnAn();build();trees();loop()}
const _sg=window.startGame;window.startGame=function(){_sg();$('hud').style.display='flex';if(S.mode==='live')$('hud-lb').style.display='none';if(!syncOn){syncOn=true;sync()}};
const _i=init3D;init3D=function(){_i();dunia()};if(typeof scene!=='undefined'&&scene)dunia();
})();
