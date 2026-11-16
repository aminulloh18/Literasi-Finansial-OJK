/* arena.js - gerbang game di desa + Pulau Melayang (A-D) + Dua Lantai (Benar/Salah).
   Pasang setelah dunia.js:  <script src="dunia.js"></script>  <script src="arena.js"></script> */
(function(){
const $=id=>document.getElementById(id),AY=40,COL={A:0x2563EB,B:0xD97706,C:0x7C3AED,D:0x059669};
const GAMES=[{id:'pulau',n:'PULAU MELAYANG',x:-18,z:14},{id:'dua',n:'DUA LANTAI',x:18,z:14}];
let GS={},on=false,lk='',rEnd=0,sent=false,vy=0,landT=0,tmr=null,lastHud='',arT=null;const plats=[],gates=[];
/* ---- teruskan state live ke arena, matikan modal kuis biasa saat game aktif ---- */
const _api=api;api=async function(a,d){const j=await _api(a,d);if(a==='state')try{onState(j)}catch(e){}return j};
const _lv=lview;lview=function(j){if(j.game)return;_lv(j)};
function onState(j){GS=j;if(j.phase==='question'&&j.dur)rEnd=j.openAt+j.dur*1000;
 const k=j.phase+j.qi+(j.game||'');if(k===lk)return;lk=k;
 if(!j.game){if(on)exit();return}
 if(j.phase==='board'||j.phase==='end'){if(on)exit();showBoard(j.phase==='end');return}
 if(!on)return;
 if(j.phase==='question')start(j);else if(j.phase==='result')end(j);else lobby()}
function showBoard(e){gameActive=false;for(const k in keys)keys[k]=false;$('quiz-modal').style.display='flex';target=$('quiz-modal-content');$('flee-btn').style.display='block';board(e)}
const esc2=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function hud(h,keep){const e=$('ahud');e.style.display='block';e.innerHTML='<div class="card" style="margin:0;background:#0F172Add">'+h+'</div>';if(!keep)lastHud=h}
/* ---- lantai melayang ---- */
function floorTex(L,tx,col,big){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#'+col.toString(16).padStart(6,'0');g.fillRect(0,0,512,512);g.strokeStyle='#fff';g.lineWidth=14;g.strokeRect(7,7,498,498);g.fillStyle='#fff';g.textAlign='center';
 if(big){g.font='bold 110px sans-serif';g.fillText(String(tx).toUpperCase(),256,290)}else{g.font='bold 210px sans-serif';g.fillText(L,256,250);g.font='bold 36px sans-serif';let l='',y=315;String(tx).split(' ').forEach(w=>{const n=l+w+' ';if(g.measureText(n).width>440&&l){g.fillText(l,256,y);l=w+' ';y+=42}else l=n});g.fillText(l,256,y)}return new THREE.CanvasTexture(c)}
function clear(){plats.forEach(q=>scene.remove(q.g));plats.length=0}
function build(o,game){clear();const two=game==='dua'||o.filter(Boolean).length<=2,ix=[0,1,2,3].filter(i=>o[i]).slice(0,two?2:4),sp=two?[[-15,0],[15,0]]:[[-12.5,-12.5],[12.5,-12.5],[-12.5,12.5],[12.5,12.5]],s=two?30:25;
 ix.forEach((i,n)=>{const L='ABCD'[i],col=game==='dua'?(n?0xE53935:0x43A047):COL[L],g=new THREE.Group();
  const b=new THREE.Mesh(new THREE.BoxGeometry(s,2,s),new THREE.MeshLambertMaterial({color:0x37474F}));b.position.y=-1;g.add(b);
  const t=new THREE.Mesh(new THREE.PlaneGeometry(s-.6,s-.6),new THREE.MeshBasicMaterial({map:floorTex(L,o[i],col,game==='dua')}));t.rotation.x=-Math.PI/2;t.position.y=.05;g.add(t);
  g.position.set(sp[n][0],AY,sp[n][1]);scene.add(g);plats.push({g,x:sp[n][0],z:sp[n][1],sx:s,sz:s,letter:L,fall:false,v:0})})}
const over=p=>plats.find(q=>Math.abs(p.x-q.x)<=q.sx/2&&Math.abs(p.z-q.z)<=q.sz/2);
const under=()=>{const p=player.group.position,q=over(p);return q&&!q.fall&&p.y>=AY-1.5?q:null};
function lobby(){hud('<div class="big">Kamu sudah di dalam gerbang 🎉</div><div class="m">Jalan-jalan di lantai melayang. Tunggu guru membuka soal pertama.</div>')}
function start(j){clearInterval(tmr);sent=false;build(j.q.o,j.game);
 hud(`<div class="m">Soal ${j.q.no} dari ${j.total} · lari ke lantai jawabanmu!</div><div class="big">${esc2(j.q.q)}</div><div class="big" id="at"></div>`);
 tmr=setInterval(()=>{const l=Math.ceil((rEnd-(Date.now()+off))/1000),e=$('at');if(e)e.textContent='⏱ '+Math.max(0,l)+' dtk';
  if(l<=0&&!sent){sent=true;clearInterval(tmr);const q=under();api('ans',{pid:S.pid,j:q?q.letter:'-'}).catch(()=>{})}},200)}
function end(j){clearInterval(tmr);const r=j.res,ok=r.j===r.k;plats.forEach(q=>{if(q.letter!==r.k){q.fall=true;q.v=0}});
 const rm=window.__rem||{};for(const id in rm){const g=rm[id].c.group;if(g.position.y>30){const q=over(g.position);if(!q||q.fall)rm[id].t.y=0}}
 hud(`<div class="big" style="color:${ok?'var(--g)':'var(--r)'}">${r.j==='-'?'⏰ Tidak berada di lantai mana pun':ok?'✅ Aman! +'+r.poin+' poin':'💦 Jatuh!'}</div><div>Jawaban benar: <b>${r.k}</b></div><div class="m">${esc2(r.x||'')}</div>`)}
async function enter(){if(on)return;on=true;lk='';vy=0;try{await api('arena_in',{pid:S.pid})}catch(e){}
 player.group.position.set(0,AY+.1,0);build(GS.game==='dua'?['Benar','Salah','','']:['pilihan A','pilihan B','pilihan C','pilihan D'],GS.game);lobby();onState(GS)}
function exit(){on=false;clearInterval(tmr);clearTimeout(landT);clear();player.group.position.set(0,0,22);$('ahud').style.display='none'}
/* ---- gerbang di desa ---- */
function sign(t){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle='#0F172A';g.fillRect(0,0,512,128);g.strokeStyle='#22D3EE';g.lineWidth=8;g.strokeRect(4,4,504,120);g.fillStyle='#FDE68A';g.font='bold 46px sans-serif';g.textAlign='center';g.fillText(t,256,82);return new THREE.Mesh(new THREE.PlaneGeometry(11,2.75),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}))}
function mkGates(){GAMES.forEach(G=>{const g=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:0x6D4C41});
 [-5,5].forEach(x=>{const p=new THREE.Mesh(new THREE.BoxGeometry(1.5,10,1.5),m);p.position.set(x,5,0);p.castShadow=true;g.add(p)});
 const bm=new THREE.Mesh(new THREE.BoxGeometry(12.5,1.6,1.8),m);bm.position.y=10;g.add(bm);const s=sign(G.n);s.position.set(0,12.2,.1);g.add(s);
 const pl=new THREE.Mesh(new THREE.PlaneGeometry(8.5,9.2),new THREE.MeshBasicMaterial({color:0x475569,transparent:true,opacity:.25,side:THREE.DoubleSide}));pl.position.y=4.6;g.add(pl);
 g.position.set(G.x,0,G.z);g.rotation.y=Math.atan2(-G.x,-G.z);scene.add(g);gates.push({id:G.id,p:pl,pos:new THREE.Vector3(G.x,0,G.z)})})}
function loop(){requestAnimationFrame(loop);if(typeof scene==='undefined'||!scene||!player||!gates.length)return;const t=performance.now()/1000,p=player.group.position;
 gates.forEach(G=>{const op=GS.game===G.id;G.p.material.color.set(op?0x22D3EE:0x475569);G.p.material.opacity=op?.5+.25*Math.sin(t*4):.22;if(op&&!on&&gameActive&&!inMenu&&S.mode==='live'&&p.distanceTo(G.pos)<3.5)enter()});
 if(!on)return;
 plats.forEach(q=>{if(q.fall===true){q.g.position.y-=q.v;q.v+=.03;q.g.rotation.z+=.012;if(q.g.position.y<-40){scene.remove(q.g);q.fall=2}}});
 const sup=plats.some(q=>!q.fall&&Math.abs(p.x-q.x)<=q.sx/2&&Math.abs(p.z-q.z)<=q.sz/2);
 if(sup&&p.y>=AY-1.5){p.y=AY;vy=0}
 else if(p.y>0){vy+=.03;p.y=Math.max(0,p.y-vy);if(p.y===0){vy=0;hud('<div class="big">💦 Splash! Sebentar lagi kembali ke arena...</div>',1);clearTimeout(landT);landT=setTimeout(()=>{if(!on)return;p.set(0,AY+.1,0);hud(lastHud)},1500)}}}
/* ---- panel guru: disisipkan otomatis ke dashboard ---- */
new MutationObserver(()=>{if($('ctl')&&!$('ar-card')){const c=document.createElement('div');c.className='card';c.id='ar-card';c.style.gridColumn='1/-1';
 c.innerHTML='<b>🎮 Arena: pilih game, siswa masuk gerbang di desa</b><div class="row" style="margin:10px 0"><button data-g="pulau">Pulau Melayang (A-D)</button><button data-g="dua">Dua Lantai (Benar/Salah)</button><button class="s" data-g="">Tutup gerbang</button></div><div id="ar-st" class="m">Mulai sesi mode Serentak, lalu pilih game.</div>';
 $('ctl').closest('.card').before(c);
 c.onclick=async e=>{const b=e.target.closest('button');if(!b)return;try{await api('a_game',{pin:sessionStorage.pin,game:b.dataset.g})}catch(x){alert(x.message)}};
 clearInterval(arT);arT=setInterval(async()=>{try{const j=await api('a_info',{pin:sessionStorage.pin});$('ar-st').innerHTML=j.st.mode!=='live'?'Mulai sesi mode <b>Serentak</b> dulu.':j.st.game?`Gerbang <b>${j.st.game==='pulau'?'Pulau Melayang':'Dua Lantai'}</b> terbuka · <b>${j.ain}</b> dari ${j.peserta} siswa sudah masuk. Kalau sudah kumpul, tekan <b>Buka soal 1</b> di Kontrol kuis.`:'Gerbang tertutup. Pilih game di atas.'}catch(e){}},3000)}}).observe(document.body,{childList:true,subtree:true});
function boot(){mkGates();$('game-ui').insertAdjacentHTML('afterbegin','<div id="ahud" style="position:absolute;top:56px;left:50%;transform:translateX(-50%);width:min(92vw,720px);display:none;text-align:center;pointer-events:none;z-index:6"></div>');loop()}
const _i=init3D;init3D=function(){_i();boot()};if(typeof scene!=='undefined'&&scene&&!gates.length)boot();
})();
