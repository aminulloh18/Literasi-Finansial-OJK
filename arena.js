/* arena.js - Gerbang Arena + Pilihan Mode (Eliminasi / Bebas Naik Lagi) + Dashboard Guru Modern
   Pasang setelah dunia.js: <script src="dunia.js"></script> <script src="arena.js"></script> */
(function(){
const $=id=>document.getElementById(id),AY=40,COL={A:0x2563EB,B:0xD97706,C:0x7C3AED,D:0x059669};
const GAMES=[{id:'pulau',n:'PULAU MELAYANG',x:-18,z:14},{id:'dua',n:'DUA LANTAI',x:18,z:14}];
let GS={},on=false,lk='',rEnd=0,sent=false,vy=0,landT=0,tmr=null,lastHud='',arT=null;
let elim=false,enteredGame='',spec=false,lastElimNo=0,guruRule='elim';
const plats=[],gates=[];

// Helper memisahkan jenis game ('pulau'/'dua') dan aturan ('elim'/'bebas')
const parseGame=raw=>{
  if(!raw)return{id:'',rule:'elim'};
  const p=String(raw).split(':');
  return{id:p[0],rule:p[1]||'elim'};
};

/* ---- Teruskan state live ke arena ---- */
const _api=api;
api=async function(a,d){
  const j=await _api(a,d);
  if(a==='state')try{onState(j)}catch(e){}
  return j;
};
const _lv=lview;
lview=function(j){if(j.game)return;_lv(j)};

function onState(j){
  GS=j;
  const gInfo=parseGame(j.game);
  if(j.phase==='question'&&j.dur)rEnd=j.openAt+j.dur*1000;
  const k=j.phase+j.qi+(j.game||'');
  if(k===lk)return;
  lk=k;

  // Reset status eliminasi jika gerbang ditutup, game berganti, atau aturan diubah ke 'bebas'
  if(!gInfo.id || gInfo.rule==='bebas'){
    elim=false;
    if(!gInfo.id){enteredGame='';spec=false;if(on)exit();}
    updateElimHud();
    if(!gInfo.id)return;
  }
  if(enteredGame && enteredGame!==gInfo.id){
    elim=false;spec=false;updateElimHud();
  }

  if(j.phase==='board'||j.phase==='end'){
    if(on)exit();
    spec=false;updateElimHud();
    showBoard(j.phase==='end');
    return;
  }
  if(!on)return;
  if(j.phase==='question')start(j);
  else if(j.phase==='result')end(j);
  else lobby();
}

function showBoard(e){
  gameActive=false;
  for(const k in keys)keys[k]=false;
  $('quiz-modal').style.display='flex';
  target=$('quiz-modal-content');
  $('flee-btn').style.display='block';
  board(e);
}

const esc2=s=>String(s).replace(/[&<>]/g,c=>({'&':'&','<':'<','>':'>'}[c]));
function hud(h,keep){
  const e=$('ahud');
  if(!e)return;
  e.style.display='block';
  e.innerHTML='<div class="card" style="margin:0;background:#0F172Ae6;border:1px solid #22D3EE88">'+h+'</div>';
  if(window.renderTex)renderTex(e);
  if(!keep)lastHud=h;
}

function updateElimHud(){
  let b=$('elim-pill');
  if(!elim){
    if(b)b.remove();
    return;
  }
  if(!$('hud'))return;
  if(!b){
    $('hud').insertAdjacentHTML('beforeend','<div class="pill" id="elim-pill" style="background:#7F1D1Ddd;border-color:#F43F5E;color:#FECACA;cursor:pointer"></div>');
    b=$('elim-pill');
    b.onclick=()=>{
      if(!parseGame(GS.game).id)return;
      spec=!spec;
      if(spec)camOn();else camOff();
      updateElimHud();
    };
  }
  b.innerHTML=`💀 Tereliminasi (Soal ${lastElimNo}) · ${spec?'🚶 Kembali ke Desa':'🔭 Intip Arena'}`;
}

/* ---- Lantai melayang ---- */
function cleanCanvasTex(s){
  return String(s).replace(/\$/g,'')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g,'($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g,'√($1)')
    .replace(/\\times/g,'×').replace(/\\div/g,'÷')
    .replace(/\\pi/g,'π').replace(/\\le/g,'≤').replace(/\\ge/g,'≥')
    .replace(/[{}]/g,'');
}
function floorTex(L,tx,col,big){
  tx=cleanCanvasTex(tx);
  const c=document.createElement('canvas');c.width=c.height=512;
  const g=c.getContext('2d');
  g.fillStyle='#'+col.toString(16).padStart(6,'0');g.fillRect(0,0,512,512);
  g.strokeStyle='#fff';g.lineWidth=14;g.strokeRect(7,7,498,498);
  g.fillStyle='#fff';g.textAlign='center';
  if(big){
    g.font='bold 110px sans-serif';g.fillText(String(tx).toUpperCase(),256,290);
  }else{
    g.font='bold 170px sans-serif';g.fillText(L,256,185);
    g.font='bold 48px sans-serif';
    let l='',y=280;
    String(tx).split(' ').forEach(w=>{
      const n=l+w+' ';
      if(g.measureText(n).width>450&&l){g.fillText(l,256,y);l=w+' ';y+=54;}
      else l=n;
    });
    g.fillText(l,256,y);
  }
  return new THREE.CanvasTexture(c);
}
function cleanCanvasTex(s){
  return String(s).replace(/\$/g,'')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g,'($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g,'√($1)')
    .replace(/\\times/g,'×').replace(/\\div/g,'÷')
    .replace(/\\pi/g,'π').replace(/\\le/g,'≤').replace(/\\ge/g,'≥')
    .replace(/[{}]/g,'');
}
function clear(){plats.forEach(q=>scene.remove(q.g));plats.length=0;}
function build(o,rawGame){
  clear();
  const game=parseGame(rawGame).id;
  const two=game==='dua'||o.filter(Boolean).length<=2;
  const ix=[0,1,2,3].filter(i=>o[i]).slice(0,two?2:4);
  const sp=two?[[-12,0],[12,0]]:[[-10,-10],[10,-10],[-10,10],[10,10]];
  const s=two?24:20;
  ix.forEach((i,n)=>{
    const L='ABCD'[i];
    const col=game==='dua'?(n?0xE53935:0x43A047):COL[L];
    const g=new THREE.Group();
    const b=new THREE.Mesh(new THREE.BoxGeometry(s,2,s),new THREE.MeshLambertMaterial({color:0x37474F}));b.position.y=-1;g.add(b);
    const t=new THREE.Mesh(new THREE.PlaneGeometry(s-.6,s-.6),new THREE.MeshBasicMaterial({map:floorTex(L,o[i],col,game==='dua')}));
    t.rotation.x=-Math.PI/2;t.position.y=.05;g.add(t);
    g.position.set(sp[n][0],AY,sp[n][1]);scene.add(g);
    plats.push({g,x:sp[n][0],z:sp[n][1],sx:s,sz:s,letter:L,fall:false,v:0});
  });
}

const over=p=>plats.find(q=>Math.abs(p.x-q.x)<=q.sx/2&&Math.abs(p.z-q.z)<=q.sz/2);
const under=()=>{const p=player.group.position,q=over(p);return q&&!q.fall&&p.y>=AY-1.5?q:null;};

function lobby(){
  const isElim=parseGame(GS.game).rule==='elim';
  hud(`<div class="big">Kamu sudah di dalam gerbang 🎉</div><div class="m">${isElim?'⚠️ <b>Mode Eliminasi:</b> sekali salah pijakan langsung gugur ke desa!':'🔄 <b>Mode Bebas:</b> jika jatuh ke desa, kamu bisa masuk gerbang lagi untuk soal berikutnya.'}</div>`);
}

function start(j){
  clearInterval(tmr);sent=false;build(j.q.o,j.game);
  hud(`<div class="m">Soal ${j.q.no}/${j.total} · ketuk kotak ini untuk sembunyikan soal</div><div class="big qt">${esc2(j.q.q)}</div><div class="big" id="at"></div>`);
  tmr=setInterval(()=>{
    const l=Math.ceil((rEnd-(Date.now()+off))/1000),e=$('at');
    if(e)e.textContent='⏱ '+Math.max(0,l)+' dtk';
    if(l<=0&&!sent){
      sent=true;clearInterval(tmr);
      const q=under();
      api('ans',{pid:S.pid,j:q?q.letter:'-'}).catch(()=>{});
    }
  },200);
}

function end(j){
  clearInterval(tmr);
  const r=j.res,ok=r.j===r.k,isElim=parseGame(GS.game).rule==='elim';
  plats.forEach(q=>{if(q.letter!==r.k){q.fall=true;q.v=0;}});
  const rm=window.__rem||{};
  for(const id in rm){
    const g=rm[id].c.group;
    if(g.position.y>30){
      const q=over(g.position);
      if(!q||q.fall)rm[id].t.y=0;
    }
  }

  if(ok){
    hud(`<div class="big" style="color:var(--g)">✅ Bertahan! +${r.poin} poin</div><div>Jawaban benar: <b>${r.k}</b> · Siap-siap soal berikutnya!</div><div class="m">${esc2(r.x||'')}</div>`);
  }else if(isElim){
    elim=true;
    lastElimNo=(GS.qi||0)+1;
    hud(`<div class="big" style="color:var(--r)">💀 TERELIMINASI!</div><div>Jawaban benar: <b>${r.k}</b> · Kamu jatuh kembali ke desa & tidak bisa masuk gerbang lagi.</div><div class="m">${esc2(r.x||'')}</div>`);
    clearTimeout(landT);
    landT=setTimeout(()=>{exit();updateElimHud();},3200);
  }else{
    // Mode Bebas: jatuh ke desa, keluar arena sementara, dan boleh masuk gerbang lagi untuk soal berikutnya!
    hud(`<div class="big" style="color:var(--r)">💦 Jatuh ke Desa!</div><div>Jawaban benar: <b>${r.k}</b> · Lari masuk ke gerbang lagi untuk ikut soal berikutnya!</div><div class="m">${esc2(r.x||'')}</div>`);
    clearTimeout(landT);
    landT=setTimeout(()=>{exit();},3200);
  }
}

let camSave=null;
function camOn(){
  if(camSave)return;
  camSave={f:camera.fov,r:cameraRadius,p:cameraAngle.phi,n:scene.fog.near,fa:scene.fog.far};
  camera.fov=72;camera.updateProjectionMatrix();cameraAngle.phi=.9;
  const hf=Math.tan(36*Math.PI/180)*(innerWidth/innerHeight);
  cameraRadius=Math.min(85,Math.max(45,28/hf));
  scene.fog.near=150;scene.fog.far=500;
}
function camOff(){
  if(!camSave)return;
  camera.fov=camSave.f;camera.updateProjectionMatrix();
  cameraRadius=camSave.r;cameraAngle.phi=camSave.p;
  scene.fog.near=camSave.n;scene.fog.far=camSave.fa;
  camSave=null;
}

const _uc=updateCamera;
updateCamera=function(){
  if(!on && !spec)return _uc();
  const p=player.group.position,R=cameraRadius,ph=cameraAngle.phi,th=cameraAngle.theta;
  const tx=spec?0:p.x*.25, tz=spec?0:p.z*.25;
  const ty=spec?AY+R*.13:(p.y<AY-3?p.y+2:AY+R*.13);
  camera.position.lerp(new THREE.Vector3(tx+R*Math.sin(ph)*Math.sin(th),ty+R*Math.cos(ph),tz+R*Math.sin(ph)*Math.cos(th)),.12);
  camera.lookAt(tx,ty,tz);
};

async function enter(){
  const gInfo=parseGame(GS.game);
  if(on || !gInfo.id || (elim && gInfo.rule==='elim'))return;
  on=true;enteredGame=gInfo.id;camOn();lk='';vy=0;
  try{await api('arena_in',{pid:S.pid});}catch(e){}
  player.group.position.set(0,AY+.1,0);
  build(gInfo.id==='dua'?['Benar','Salah','','']:['Pilihan A','Pilihan B','Pilihan C','Pilihan D'],GS.game);

  // Jika siswa masuk di tengah sesi saat soal sedang berjalan atau hasil ditampilkan, langsung sinkronkan ke fase tersebut!
  if(GS.phase==='question'){
    start(GS);
  }else if(GS.phase==='result'){
    hud('<div class="big">⏳ Menunggu Soal Berikutnya...</div><div class="m">Soal sebelumnya baru saja selesai. Bersiap di atas pulau!</div>');
  }else{
    lobby();
  }
}

function exit(){
  on=false;camOff();clearInterval(tmr);clearTimeout(landT);clear();
  if(player)player.group.position.set(0,0,22);
  if($('ahud'))$('ahud').style.display='none';
}

/* ---- Gerbang di desa ---- */
function sign(t){
  const c=document.createElement('canvas');c.width=512;c.height=128;
  const g=c.getContext('2d');
  g.fillStyle='#0F172A';g.fillRect(0,0,512,128);
  g.strokeStyle='#22D3EE';g.lineWidth=8;g.strokeRect(4,4,504,120);
  g.fillStyle='#FDE68A';g.font='bold 46px sans-serif';g.textAlign='center';
  g.fillText(t,256,82);
  return new THREE.Mesh(new THREE.PlaneGeometry(11,2.75),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));
}

function mkGates(){
  GAMES.forEach(G=>{
    const g=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:0x6D4C41});
    [-5,5].forEach(x=>{const p=new THREE.Mesh(new THREE.BoxGeometry(1.5,10,1.5),m);p.position.set(x,5,0);p.castShadow=true;g.add(p);});
    const bm=new THREE.Mesh(new THREE.BoxGeometry(12.5,1.6,1.8),m);bm.position.y=10;g.add(bm);
    const s=sign(G.n);s.position.set(0,12.2,.1);g.add(s);
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(8.5,9.2),new THREE.MeshBasicMaterial({color:0x475569,transparent:true,opacity:.25,side:THREE.DoubleSide}));
    pl.position.y=4.6;g.add(pl);
    g.position.set(G.x,0,G.z);g.rotation.y=Math.atan2(-G.x,-G.z);scene.add(g);
    gates.push({id:G.id,p:pl,pos:new THREE.Vector3(G.x,0,G.z)});
  });
}

function loop(){
  requestAnimationFrame(loop);
  if(typeof scene==='undefined'||!scene||!player||!gates.length)return;
  const t=performance.now()/1000,p=player.group.position;
  const gInfo=parseGame(GS.game);

  gates.forEach(G=>{
    const op=gInfo.id===G.id;
    if(op && elim && gInfo.rule==='elim'){
      G.p.material.color.set(0xF43F5E);
      G.p.material.opacity=0.22;
    }else{
      G.p.material.color.set(op?0x22D3EE:0x475569);
      G.p.material.opacity=op?.5+.25*Math.sin(t*4):.22;
    }

    if(op&&!on&&gameActive&&!inMenu&&S.mode==='live'&&p.distanceTo(G.pos)<3.5){
      if(elim && gInfo.rule==='elim'){
        hud('<div class="big" style="color:var(--r)">🔒 Gerbang Terkunci!</div><div class="m">Kamu sudah tereliminasi pada ronde ini. Silakan berkeliling desa atau klik <b>Intip Arena</b> di pojok kiri atas.</div>',1);
        clearTimeout(landT);
        landT=setTimeout(()=>{if(!on&&$('ahud'))$('ahud').style.display='none';},2500);
        const away=p.clone().sub(G.pos);away.y=0;away.normalize();p.addScaledVector(away,3);
      }else{
        enter();
      }
    }
  });

  if(!on)return;
  plats.forEach(q=>{
    if(q.fall===true){
      q.g.position.y-=q.v;q.v+=.03;q.g.rotation.z+=.012;
      if(q.g.position.y<-40){scene.remove(q.g);q.fall=2;}
    }
  });
  const sup=plats.some(q=>!q.fall&&Math.abs(p.x-q.x)<=q.sx/2&&Math.abs(p.z-q.z)<=q.sz/2);
  if(sup&&p.y>=AY-1.5){p.y=AY;vy=0;}
  else if(p.y>0){
    vy+=.03;p.y=Math.max(0,p.y-vy);
    if(p.y===0){
      vy=0;
      if(GS.phase==='question' || GS.phase==='result'){
        if(gInfo.rule==='elim'){
          elim=true;
          lastElimNo=(GS.qi||0)+1;
          hud('<div class="big" style="color:var(--r)">💦 Terjatuh ke Desa · TERELIMINASI!</div><div class="m">Kamu keluar dari arena dan tidak bisa naik lagi.</div>',1);
          clearTimeout(landT);
          landT=setTimeout(()=>{exit();updateElimHud();},2200);
        }else{
          hud('<div class="big" style="color:var(--r)">💦 Terjatuh ke Desa!</div><div class="m">Masuk ke gerbang lagi untuk ikut soal berikutnya.</div>',1);
          clearTimeout(landT);
          landT=setTimeout(()=>{exit();},2200);
        }
      }else{
        hud('<div class="big">💦 Terpeleset saat lobi! Kembali ke atas...</div>',1);
        clearTimeout(landT);
        landT=setTimeout(()=>{if(!on)return;p.set(0,AY+.1,0);hud(lastHud);},1200);
      }
    }
  }
}

/* ---- Dashboard Guru Modern & Pilihan Mode Eliminasi / Bebas ---- */
function inject(){
  const ctl=$('ctl');
  if(!ctl||$('ar-card'))return;
  const card=ctl.closest('.card');
  if(!card||!card.parentNode)return;

  const c=document.createElement('div');
  c.className='card';
  c.id='ar-card';
  c.style.gridColumn='1/-1';
  c.style.borderLeftColor='#06B6D4';
  c.innerHTML=`
    <div class="row" style="justify-content:space-between;margin-bottom:8px">
      <b style="font-size:18px;color:#67E8F9">🎮 Arena Permainan (Mode Serentak)</b>
      <span id="ar-badge" style="background:#06B6D422;color:#67E8F9;border:1px solid #06B6D455;padding:3px 12px;border-radius:99px;font-size:12px;font-weight:700">GERBANG TERTUTUP</span>
    </div>
    <div class="row" style="background:#0B1120;padding:10px 12px;border-radius:12px;border:1px solid #334155;margin-bottom:10px">
      <span class="m" style="flex:1"><b>Aturan jika siswa jatuh / salah:</b></span>
      <button id="r-elim" style="padding:8px 12px;font-size:14px" data-rule="elim">💀 Eliminasi (Gugur)</button>
      <button id="r-bebas" class="s" style="padding:8px 12px;font-size:14px" data-rule="bebas">🔄 Bebas (Bisa Naik Lagi)</button>
    </div>
    <div class="row" style="margin:10px 0">
      <button id="g-pulau" class="s" data-g="pulau">🏝️ Pulau Melayang (A-D)</button>
      <button id="g-dua" class="s" data-g="dua">🏢 Dua Lantai (Benar/Salah)</button>
      <button id="g-off" class="d" data-g="">🔒 Tutup Gerbang</button>
    </div>
    <div id="ar-st" class="m" style="background:#0B1120;padding:10px 14px;border-radius:10px;border:1px solid #334155">Mulai sesi mode <b>Serentak</b> terlebih dahulu.</div>
  `;
  card.parentNode.insertBefore(c,card);

  let activeGameId='';
  const syncRuleBtns=()=>{
    if($('r-elim'))$('r-elim').className=guruRule==='elim'?'':'s';
    if($('r-bebas'))$('r-bebas').className=guruRule==='bebas'?'':'s';
  };
  syncRuleBtns();

  c.onclick=async e=>{
    const b=e.target.closest('button');
    if(!b)return;
    try{
      if(b.dataset.rule){
        guruRule=b.dataset.rule;
        syncRuleBtns();
        if(activeGameId){
          await api('a_game',{pin:sessionStorage.pin,game:`${activeGameId}:${guruRule}`});
        }
        return;
      }
      const g=b.dataset.g;
      activeGameId=g;
      await api('a_game',{pin:sessionStorage.pin,game:g?`${g}:${guruRule}`:''});
    }catch(x){alert(x.message||x);}
  };

  clearInterval(arT);
  arT=setInterval(async()=>{
    if(!$('ar-st'))return clearInterval(arT);
    try{
      const j=await api('a_info',{pin:sessionStorage.pin});
      const info=parseGame(j.st.game);
      activeGameId=info.id;
      if(info.id){guruRule=info.rule;syncRuleBtns();}
      if($('g-pulau'))$('g-pulau').style.outline=info.id==='pulau'?'3px solid #22D3EE':'none';
      if($('g-dua'))$('g-dua').style.outline=info.id==='dua'?'3px solid #22D3EE':'none';
      if($('ar-badge')){
        $('ar-badge').textContent=info.id?`🟢 ${info.id==='pulau'?'PULAU MELAYANG':'DUA LANTAI'} (${info.rule==='elim'?'ELIMINASI':'BEBAS'})`:'🔴 GERBANG TERTUTUP';
        $('ar-badge').style.color=info.id?'#6EE7B7':'#FDA4AF';
        $('ar-badge').style.borderColor=info.id?'#10B98166':'#F43F5E66';
      }
      $('ar-st').innerHTML=j.st.mode!=='live'
        ?'⚠️ Ubah mode sesi menjadi <b>Serentak</b> di atas agar gerbang arena dapat dibuka.'
        :info.id
          ?`🚪 Gerbang <b>${info.id==='pulau'?'Pulau Melayang':'Dua Lantai'}</b> TERBUKA · Aturan: <b>${info.rule==='elim'?'💀 Eliminasi (Sekali Gugur)':'🔄 Bebas (Boleh masuk gerbang lagi untuk soal berikutnya)'}</b> · <b>${j.ain||0}</b>/${j.peserta} siswa masuk.`
          :'Gerbang tertutup (kuis layar biasa). Pilih aturan & wahana di atas untuk membuka gerbang.';
    }catch(e){}
  },2500);
}

new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});
setInterval(inject,800);
inject();

/* ---- Styling Modern untuk Dashboard Guru & HUD Arena ---- */
const st=document.createElement('style');
st.textContent=`
  #ahud{pointer-events:auto!important}
  #ahud .card{padding:10px 14px!important;max-height:28vh;overflow:auto;background:#0F172Ae6!important;backdrop-filter:blur(8px)}
  #ahud .big{font-size:17px}
  #ahud.min .qt{display:none}
  #app.wide:has(#ctl){max-width:1160px!important;gap:16px 22px!important;padding-top:24px}
  #app.wide:has(#ctl) .card{
    background:linear-gradient(155deg,#1E293Bf5,#0F172Af5)!important;
    backdrop-filter:blur(10px);
    border:1px solid #334155aa!important;
    border-left:5px solid var(--a)!important;
    border-radius:18px!important;
    padding:20px 22px!important;
    box-shadow:0 12px 32px #00000066!important;
    margin:0!important;
  }
  #app.wide:has(#ctl) > div:nth-of-type(4){grid-column:1/-1}
  #app.wide:has(#ctl) h1{font-size:34px!important;letter-spacing:-0.5px}
  #app.wide:has(#ctl) #sx .row{background:#0B1120;padding:12px;border-radius:14px;border:1px solid #334155}
  #app.wide:has(#ctl) #sx img{border-radius:10px;border:4px solid #fff;background:#fff}
  #app.wide:has(#ctl) #sx .big{font-size:32px;color:var(--a);letter-spacing:3px}
  #app.wide:has(#ctl) button{border-radius:12px;box-shadow:0 4px 12px #0004}
  #app.wide:has(#ctl) th{color:var(--a);font-size:12px;text-transform:uppercase;letter-spacing:.06em}
`;
document.head.appendChild(st);

function boot(){
  if(gates.length)return;
  mkGates();
  if(!$('ahud')){
    $('game-ui').insertAdjacentHTML('afterbegin','<div id="ahud" style="position:absolute;top:58px;left:50%;transform:translateX(-50%);width:min(92vw,720px);display:none;text-align:center;pointer-events:none;z-index:6"></div>');
    $('ahud').onclick=()=>$('ahud').classList.toggle('min');
  }
  loop();
}
const _i=init3D;
init3D=function(){_i();boot();};
if(typeof scene!=='undefined'&&scene&&!gates.length)boot();
})();
