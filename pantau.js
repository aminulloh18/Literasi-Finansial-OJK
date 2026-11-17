/* pantau.js - Mode Drone / Spectator 3D untuk Guru & Layar Proyektor (#pantau)
   Menampilkan seluruh avatar siswa secara live di desa maupun di atas Pulau Melayang. */
(function(){
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&','<':'<','>':'>','"':'"'}[c]));

window.startSpectator=function(A){
  $('app').style.display='none';
  if($('game-ui'))$('game-ui').style.display='none';

  // Inisialisasi Scene 3D Khusus Drone Guru
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x87CEEB);
  scene.fog=new THREE.Fog(0x87CEEB,90,320);

  camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,500);
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;
  rendererCanvas=renderer.domElement;
  Object.assign(rendererCanvas.style,{position:'fixed',inset:'0',zIndex:'1',touchAction:'none',cursor:'grab'});
  document.body.appendChild(rendererCanvas);

  scene.add(new THREE.AmbientLight(0xffffff,0.75));
  const dl=new THREE.DirectionalLight(0xffffff,0.75);
  dl.position.set(60,120,60);dl.castShadow=true;
  scene.add(dl);

  const gr=new THREE.Mesh(new THREE.PlaneGeometry(320,320),new THREE.MeshLambertMaterial({color:0x7CB342}));
  gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;
  scene.add(gr);

  // Bangun seluruh kota dari dunia.js
  const kit=window.__duniaKit;
  if(kit){
    kit.buildRoadsAndAlunAlun();
    kit.buildTown();
    kit.spawnVeh();
    kit.spawnAn();
    kit.build();
    kit.trees();
  }

  // Bangun Gerbang Arena & Pulau Melayang (Visualisasi untuk Proyektor)
  const COL={A:0x2563EB,B:0xD97706,C:0x7C3AED,D:0x059669},AY=40;
  let arenaPlats=[];
  function buildArenaVisual(rawGame){
    arenaPlats.forEach(p=>scene.remove(p));arenaPlats=[];
    const gid=(rawGame||'').split(':')[0];
    if(!gid)return;
    const two=gid==='dua';
    const sp=two?[[-12,0],[12,0]]:[[-10,-10],[10,-10],[-10,10],[10,10]];
    const s=two?24:20;
    const cols=two?[0x43A047,0xE53935]:[COL.A,COL.B,COL.C,COL.D];
    const lbls=two?['BENAR','SALAH']:['A','B','C','D'];
    sp.forEach((pos,idx)=>{
      const g=new THREE.Group();
      const b=new THREE.Mesh(new THREE.BoxGeometry(s,2,s),new THREE.MeshLambertMaterial({color:0x37474F}));
      b.position.y=-1;g.add(b);
      const c=document.createElement('canvas');c.width=c.height=256;
      const ctx=c.getContext('2d');ctx.fillStyle='#'+cols[idx].toString(16).padStart(6,'0');ctx.fillRect(0,0,256,256);
      ctx.strokeStyle='#fff';ctx.lineWidth=10;ctx.strokeRect(5,5,246,246);
      ctx.fillStyle='#fff';ctx.font='bold 72px sans-serif';ctx.textAlign='center';ctx.fillText(lbls[idx],128,150);
      const t=new THREE.Mesh(new THREE.PlaneGeometry(s-0.6,s-0.6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));
      t.rotation.x=-Math.PI/2;t.position.y=0.05;g.add(t);
      g.position.set(pos[0],AY,pos[1]);scene.add(g);arenaPlats.push(g);
    });
  }

  // UI Overlay Drone Kontrol untuk Guru
  const ui=document.createElement('div');
  ui.id='drone-ui';
  ui.innerHTML=`
    <div style="position:fixed;top:14px;left:14px;z-index:20;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <div style="background:#0F172Ae6;border:1px solid #22D3EE88;color:#67E8F9;padding:8px 16px;border-radius:99px;font-weight:800;backdrop-filter:blur(8px)">
        🎥 DRONE VIEW · <span id="dr-cnt">0</span> Siswa Aktif
      </div>
      <button id="dr-desa" style="padding:8px 14px;border-radius:99px;font-size:13px">🏙️ Sorot Alun-Alun</button>
      <button id="dr-arena" class="s" style="padding:8px 14px;border-radius:99px;font-size:13px">🏝️ Sorot Pulau Arena</button>
      <select id="dr-follow" style="width:auto;margin:0;padding:7px 12px;border-radius:99px;font-size:13px;background:#0F172Ae6;border:1px solid #F59E0B88;color:#FDE68A">
        <option value="">📷 Kamera Bebas (Geser/Scroll)</option>
      </select>
    </div>

    <div id="dr-top" style="position:fixed;top:14px;right:14px;z-index:20;background:#0F172Ae6;border:1px solid #F59E0B88;border-radius:16px;padding:12px 16px;min-width:220px;backdrop-filter:blur(8px)">
      <div style="font-weight:800;color:#F59E0B;font-size:13px;margin-bottom:6px">🏆 TOP 5 KLASEMEN LIVE</div>
      <div id="dr-lb" style="font-size:13px;color:#F8FAFC">Menunggu skor...</div>
    </div>

    <div style="position:fixed;bottom:14px;left:14px;z-index:20;background:#0F172Acc;color:#94A3B8;padding:8px 14px;border-radius:12px;font-size:12px">
      <b>Klik + Geser</b>: Putar Kamera · <b>Scroll</b>: Zoom · <b>WASD / Panah</b>: Geser Drone
    </div>
  `;
  document.body.appendChild(ui);

  // Kontrol Kamera Drone Bebas & Follow Target
  let camTarget=new THREE.Vector3(0,4,0);
  let camTheta=0.4,camPhi=0.85,camDist=65,followPid='';
  let dragging=false,prev={x:0,y:0};
  const dKeys={w:0,a:0,s:0,d:0,ArrowUp:0,ArrowLeft:0,ArrowDown:0,ArrowRight:0};

  rendererCanvas.addEventListener('mousedown',e=>{dragging=true;prev={x:e.clientX,y:e.clientY};rendererCanvas.style.cursor='grabbing'});
  window.addEventListener('mouseup',()=>{dragging=false;rendererCanvas.style.cursor='grab'});
  window.addEventListener('mousemove',e=>{
    if(!dragging)return;
    camTheta-=(e.clientX-prev.x)*0.007;
    camPhi=Math.max(0.15,Math.min(Math.PI/2-0.05,camPhi-(e.clientY-prev.y)*0.007));
    prev={x:e.clientX,y:e.clientY};
  });
  rendererCanvas.addEventListener('wheel',e=>{
    camDist=Math.max(12,Math.min(180,camDist+e.deltaY*0.05));
  },{passive:true});
  window.addEventListener('keydown',e=>{if(e.key in dKeys){dKeys[e.key]=1;followPid='';$('dr-follow').value=''}});
  window.addEventListener('keyup',e=>{if(e.key in dKeys)dKeys[e.key]=0});

  $('dr-desa').onclick=()=>{followPid='';$('dr-follow').value='';camTarget.set(0,4,0);camDist=65;camPhi=0.85};
  $('dr-arena').onclick=()=>{followPid='';$('dr-follow').value='';camTarget.set(0,AY+2,0);camDist=48;camPhi=0.9};
  $('dr-follow').onchange=e=>{followPid=e.target.value;if(followPid)camDist=22};

  // Sinkronisasi Posisi Semua Siswa dari Server
  let lastGameStr='';
  async function pollDrone(){
    try{
      const j=await A('a_pos');
      if(kit)kit.applyRem(j.p);
      $('dr-cnt').textContent=j.p.length;

      // Update Arena Melayang jika guru membuka gerbang
      const gStr=(j.st&&j.st.game)||'';
      if(gStr!==lastGameStr){lastGameStr=gStr;buildArenaVisual(gStr)}

      // Update Dropdown Daftar Siswa untuk Diikuti Kamera
      const sel=$('dr-follow'),curVal=sel.value;
      sel.innerHTML='<option value="">📷 Kamera Bebas (Geser/Scroll)</option>'+
        j.p.map(p=>`<option value="${esc(p[0])}"${p[0]===curVal?' selected':''}>🎯 Ikuti: ${esc(p[1])}</option>`).join('');

      // Update Top 5 Klasemen
      $('dr-lb').innerHTML=j.lb&&j.lb.length
        ?j.lb.map((r,i)=>`<div style="display:flex;justify-content:space-between;gap:12px;padding:2px 0"><span>${['🥇','🥈','🥉'][i]||i+1+'.'} ${esc(r.nama)}</span><b>${r.poin}</b></div>`).join('')
        :'Belum ada poin masuk.';
    }catch(e){}
    setTimeout(pollDrone,2500);
  }
  pollDrone();

  // Render Loop 3D Drone
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
  (function anim(){
    requestAnimationFrame(anim);
    const t=performance.now()/1000;

    // Gerakkan Drone dengan WASD jika tidak sedang follow siswa
    const sp=0.8;
    const fwd=new THREE.Vector3(-Math.sin(camTheta),0,-Math.cos(camTheta));
    const rgt=new THREE.Vector3(Math.cos(camTheta),0,-Math.sin(camTheta));
    if(dKeys.w||dKeys.ArrowUp)camTarget.addScaledVector(fwd,sp);
    if(dKeys.s||dKeys.ArrowDown)camTarget.addScaledVector(fwd,-sp);
    if(dKeys.a||dKeys.ArrowLeft)camTarget.addScaledVector(rgt,-sp);
    if(dKeys.d||dKeys.ArrowRight)camTarget.addScaledVector(rgt,sp);

    // Jika mode follow siswa aktif, sorot avatar siswa tersebut
    if(followPid && kit && kit.rem[followPid]){
      const pos=kit.rem[followPid].c.group.position;
      camTarget.lerp(new THREE.Vector3(pos.x,pos.y+3,pos.z),0.12);
    }

    // Animasi kendaraan, hewan, beacon gedung, dan avatar siswa
    if(kit){
      kit.veh.forEach(v=>{const p=v.g.position;p.x+=v.dx*v.sp;p.z+=v.dz*v.sp;if(Math.abs(p.x)>155)p.x=-Math.sign(p.x)*155;if(Math.abs(p.z)>155)p.z=-Math.sign(p.z)*155});
      kit.an.forEach(a=>{const p=a.g.position;if(a.w>0){a.w--;return}const d=a.t.clone().sub(p);d.y=0;if(d.length()<1){a.w=60+Math.random()*140;a.t.set((Math.random()-.5)*220,0,(Math.random()-.5)*220);return}d.normalize();p.addScaledVector(d,a.sp);a.g.rotation.y=Math.atan2(d.x,d.z);p.y=Math.abs(Math.sin(t*6+p.x))*.12});
      kit.beac.forEach((o,i)=>{o.rotation.y+=.03;o.position.y=14+Math.sin(t*2+i)*.5});
      for(const id in kit.rem){
        const o=kit.rem[id],g=o.c.group,d=g.position.distanceTo(o.t);
        if(d>40)g.position.copy(o.t);else g.position.lerp(o.t,.08);
        let df=o.ry-g.rotation.y;while(df>Math.PI)df-=2*Math.PI;while(df<-Math.PI)df+=2*Math.PI;g.rotation.y+=df*.12;
        if(d>.25){o.ph+=.25;const s=Math.sin(o.ph)*.8;o.c.leftLeg.rotation.x=s;o.c.rightLeg.rotation.x=-s;o.c.leftArm.rotation.x=-s;o.c.rightArm.rotation.x=s}
        else{o.c.leftLeg.rotation.x*=.8;o.c.rightLeg.rotation.x*=.8;o.c.leftArm.rotation.x*=.8;o.c.rightArm.rotation.x*=.8}
      }
    }

    camera.position.set(
      camTarget.x+camDist*Math.sin(camPhi)*Math.sin(camTheta),
      camTarget.y+camDist*Math.cos(camPhi),
      camTarget.z+camDist*Math.sin(camPhi)*Math.cos(camTheta)
    );
    camera.lookAt(camTarget);
    renderer.render(scene,camera);
  })();
};
})();
