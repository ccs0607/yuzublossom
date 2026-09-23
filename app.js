(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const app=$('#app'),scene=$('#scene'),canvas=$('#fx'),ctx=canvas.getContext('2d');
const moonWrap=$('#moonWrap'),narration=$('#narration'),skipBtn=$('#skipBtn'),replayBtn=$('#replayBtn');
const soundBtn=$('#soundBtn'),wishPanel=$('#wishPanel'),collapseBtn=$('#collapseBtn'),wishChip=$('#wishChip');
const wishInput=$('#wishInput'),wishBtn=$('#wishBtn'),touchMoonBtn=$('#touchMoonBtn');
const lanternField=$('#lanternField'),petalField=$('#petalField'),toast=$('#toast'),finalScene=$('.final-scene');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
let W=innerWidth,H=innerHeight,D=Math.min(devicePixelRatio||1,2),phase='stars',token=0,interactive=false;
let stars=[],sparks=[],meteors=[],gather=0,mouseX=0,mouseY=0,toastTimer=0;
const TAU=Math.PI*2;
const copy={
  stars:'今夜，从一片安静的黑开始。',
  gather:'细碎星光，正向月轮缓缓聚拢。',
  moon:'云后，一轮明月缓缓升起。',
  awake:'月面渐亮，清辉落满夜空。',
  clouds:'流云掠过，夜色也有了呼吸。',
  silhouette:'她的轮廓，先从月光里浮现。',
  reveal:'衣袂舒展，嫦娥从清辉中显现。',
  title:'中秋落笔，月满人间。',
  complete:'愿花长好，月长圆，人长久。'
};
const gatherBy={stars:0,gather:.86,moon:.92,awake:.72,clouds:.46,silhouette:.28,reveal:.17,title:.11,complete:.055};
function resize(){
  W=innerWidth;H=innerHeight;D=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.floor(W*D);canvas.height=Math.floor(H*D);canvas.style.width=W+'px';canvas.style.height=H+'px';
  ctx.setTransform(D,0,0,D,0,0);
  if(!stars.length)makeStars();
}
function makeStars(){
  stars=[];const n=W*H>900000?180:130;
  for(let i=0;i<n;i++){
    const x=Math.random()*W,y=Math.random()*H*.78;
    stars.push({bx:x,by:y,x,y,r:.35+Math.random()*1.45,a:.12+Math.random()*.7,p:Math.random()*TAU,s:.008+Math.random()*.018,orb:12+Math.random()*44});
  }
}
function moonTarget(){
  if(phase==='complete'||phase==='title')return{x:W*.72,y:H*.25};
  const r=moonWrap.getBoundingClientRect();
  if(r.width>10)return{x:r.left+r.width/2,y:r.top+r.height/2};
  return{x:W*.68,y:H*.24};
}
function addBurst(x,y,n=24,power=1){
  if(sparks.length>750)return;
  for(let i=0;i<n;i++){
    const a=Math.random()*TAU,v=(.45+Math.random()*2.8)*power;
    sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:38+Math.random()*28,max:66,r:.6+Math.random()*2.1,h:Math.random()>.25?'gold':'blue'});
  }
}
function addMeteor(){
  if(!interactive||RM||meteors.length>2)return;
  const fromRight=Math.random()>.5;
  meteors.push({x:fromRight?W*.82:W*.22,y:H*(.06+Math.random()*.25),vx:fromRight?-7-Math.random()*3:7+Math.random()*3,vy:3+Math.random()*2,life:50+Math.random()*18});
}
function draw(){
  ctx.clearRect(0,0,W,H);
  const t=moonTarget();
  for(const s of stars){
    s.p+=s.s;
    const ax=s.bx+Math.sin(s.p*.7)*2.4, ay=s.by+Math.cos(s.p*.9)*2.2;
    const gx=t.x+Math.cos(s.p*1.5+s.bx*.01)*s.orb, gy=t.y+Math.sin(s.p*1.35+s.by*.01)*s.orb;
    s.x=ax*(1-gather)+gx*gather;s.y=ay*(1-gather)+gy*gather;
    const pulse=.5+.5*Math.sin(s.p),alpha=Math.min(1,s.a*(.6+.4*pulse)+gather*.12);
    ctx.fillStyle='rgba(255,240,211,'+alpha+')';ctx.beginPath();ctx.arc(s.x,s.y,s.r+pulse*.55,0,TAU);ctx.fill();
    if(Math.random()<.003+gather*.008){ctx.fillStyle='rgba(255,214,126,'+(alpha*.18)+')';ctx.beginPath();ctx.arc(s.x,s.y,(s.r+1)*3.4,0,TAU);ctx.fill();}
  }
  for(let i=sparks.length-1;i>=0;i--){
    const p=sparks[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.982;p.vy*=.982;p.vy+=.008;p.life--;
    const a=Math.max(0,p.life/p.max);ctx.fillStyle=p.h==='gold'?'rgba(255,218,137,'+a+')':'rgba(171,205,255,'+a+')';
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*a+.25,0,TAU);ctx.fill();if(p.life<=0)sparks.splice(i,1);
  }
  for(let i=meteors.length-1;i>=0;i--){
    const m=meteors[i];m.x+=m.vx;m.y+=m.vy;m.life--;const a=Math.min(1,m.life/18);
    const len=95,sp=Math.hypot(m.vx,m.vy),ux=m.vx/sp,uy=m.vy/sp;
    const g=ctx.createLinearGradient(m.x,m.y,m.x-ux*len,m.y-uy*len);g.addColorStop(0,'rgba(255,244,216,'+a+')');g.addColorStop(1,'rgba(255,244,216,0)');
    ctx.strokeStyle=g;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x-ux*len,m.y-uy*len);ctx.stroke();
    if(m.life<=0)meteors.splice(i,1);
  }
  requestAnimationFrame(draw);
}
function setPhase(p){
  phase=p;app.className='phase-'+p;gather=gatherBy[p]??0;narration.textContent=copy[p]||'';
  if(p==='reveal'){spawnPetals(34);for(let i=0;i<18;i++)setTimeout(()=>addBurst(W*(.58+Math.random()*.34),H*(.2+Math.random()*.5),3,.8),i*60);}
  if(p==='title'){spawnPetals(50);Snd.chime(false);}
}
function wait(ms,t){return new Promise(r=>setTimeout(()=>r(t===token),ms))}
async function runIntro(skip=false){
  token++;const t=token;interactive=false;document.body.classList.remove('panel-collapsed');wishChip.classList.add('hidden');
  if(skip||RM){finish();return}
  setPhase('stars');if(!await wait(1050,t))return;
  setPhase('gather');addBurst(W*.68,H*.24,48,1.15);if(!await wait(1450,t))return;
  setPhase('moon');addBurst(W*.68,H*.24,54,1.25);if(!await wait(1700,t))return;
  setPhase('awake');if(!await wait(1400,t))return;
  setPhase('clouds');if(!await wait(1500,t))return;
  setPhase('silhouette');addBurst(W*.74,H*.42,34,.9);if(!await wait(1600,t))return;
  setPhase('reveal');if(!await wait(1750,t))return;
  setPhase('title');if(!await wait(1800,t))return;
  finish();
}
function finish(){
  token++;setPhase('complete');interactive=true;gather=gatherBy.complete;
  replayBtn.classList.remove('hidden');addBurst(W*.55,H*.18,64,1.15);spawnPetals(32);createLantern('团圆',18);
  setTimeout(()=>showToast('月满人间 · 愿今夜所念皆有回响'),520);
}
function createLantern(text,x){
  const e=document.createElement('div');e.className='lantern';
  e.style.setProperty('--x',(x??(14+Math.random()*72))+'%');e.style.setProperty('--dur',(10+Math.random()*7)+'s');
  e.style.setProperty('--s',(.7+Math.random()*.58).toFixed(2));e.style.setProperty('--drift',(-55+Math.random()*110)+'px');
  const s=document.createElement('span');s.textContent=text;e.appendChild(s);lanternField.appendChild(e);setTimeout(()=>e.remove(),18000);
}
function spawnPetals(n=40){
  for(let i=0;i<n;i++){
    const e=document.createElement('i');e.className='falling-petal';e.style.setProperty('--x',Math.random()*100+'%');
    e.style.setProperty('--dur',(7+Math.random()*8)+'s');e.style.setProperty('--dx',(-100+Math.random()*200)+'px');e.style.animationDelay=Math.random()*1.4+'s';
    petalField.appendChild(e);setTimeout(()=>e.remove(),17000);
  }
}
function domSpark(x,y,n=14){
  for(let i=0;i<n;i++){
    const e=document.createElement('i');e.className='spark';e.style.left=x+'px';e.style.top=y+'px';
    e.style.setProperty('--tx',(-105+Math.random()*210)+'px');e.style.setProperty('--ty',(-105+Math.random()*145)+'px');
    scene.appendChild(e);setTimeout(()=>e.remove(),1450);
  }
  addBurst(x,y,n,1);
}
function moonRipple(){
  const x=W*.72,y=H*.25,size=Math.min(W,H)*.34;
  const e=document.createElement('i');e.className='ripple';e.style.width=size+'px';e.style.height=size+'px';e.style.left=(x-size/2)+'px';e.style.top=(y-size/2)+'px';
  scene.appendChild(e);setTimeout(()=>e.remove(),1800);domSpark(x,y,24);spawnPetals(10);Snd.chime(true);showToast('月光落在掌心');
}
function showToast(t){
  toast.textContent=t;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2500);
}
function setMode(mode){
  document.body.classList.remove('mode-moon','mode-osmanthus','mode-lantern');document.body.classList.add('mode-'+mode);
  $$('.mode[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  if(mode==='osmanthus'){spawnPetals(RM?28:85);showToast('桂子月中落，天香云外飘');Snd.chime(false);}
  if(mode==='lantern'){for(let i=0;i<(RM?5:13);i++)setTimeout(()=>createLantern(['平安','团圆','顺遂','如愿'][i%4]),i*160);showToast('灯火升起，愿望有了方向');}
  if(mode==='moon'){showToast('澄月 · 清辉如水');}
}
const Snd={
  ctx:null,on:false,master:null,timer:0,
  init(){if(this.ctx)return;const C=this.ctx=new (AudioContext||webkitAudioContext)();this.master=C.createGain();this.master.gain.value=.16;this.master.connect(C.destination);const o=C.createOscillator(),g=C.createGain();o.type='sine';o.frequency.value=110;g.gain.value=.035;o.connect(g);g.connect(this.master);o.start();},
  pluck(f,v=.5,delay=0){if(!this.on||!this.ctx)return;const C=this.ctx,t=C.currentTime+delay,o=C.createOscillator(),g=C.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12*v,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+2.2);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+2.3);},
  chime(up=true){this.pluck(up?523.25:440,.65);this.pluck(up?659.25:554.37,.45,.14);},
  melody(){if(!this.on)return;const a=[220,246.94,293.66,329.63,392,440];this.pluck(a[Math.random()*a.length|0],.24);this.timer=setTimeout(()=>this.melody(),2600+Math.random()*3600);},
  toggle(){this.init();this.on=!this.on;if(this.on){this.ctx.resume();this.chime(true);this.melody()}else{clearTimeout(this.timer);this.ctx.suspend()}soundBtn.classList.toggle('on',this.on);soundBtn.setAttribute('aria-pressed',String(this.on));}
};
skipBtn.addEventListener('click',()=>runIntro(true));
replayBtn.addEventListener('click',()=>{lanternField.innerHTML='';petalField.innerHTML='';runIntro(false)});
soundBtn.addEventListener('click',()=>Snd.toggle());
wishBtn.addEventListener('click',()=>{const v=wishInput.value.trim()||'愿人长久';createLantern(v);wishInput.value='';domSpark(W*.32,H*.82,20);Snd.chime(true);showToast('心愿已随灯火升起')});
wishInput.addEventListener('keydown',e=>{if(e.key==='Enter')wishBtn.click()});
touchMoonBtn.addEventListener('click',moonRipple);
moonWrap.addEventListener('click',()=>{if(interactive)moonRipple()});
moonWrap.addEventListener('keydown',e=>{if(interactive&&(e.key==='Enter'||e.key===' ')){e.preventDefault();moonRipple()}});
collapseBtn.addEventListener('click',()=>{document.body.classList.add('panel-collapsed');wishChip.classList.remove('hidden')});
wishChip.addEventListener('click',()=>{document.body.classList.remove('panel-collapsed');wishChip.classList.add('hidden');setTimeout(()=>wishInput.focus(),250)});
$$('.mode[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
scene.addEventListener('pointerdown',e=>{if(!interactive||e.target.closest('button,input,.wish-panel,.topbar'))return;domSpark(e.clientX,e.clientY,15);Snd.pluck(440,.18)});
addEventListener('pointermove',e=>{mouseX=(e.clientX/W-.5)*2;mouseY=(e.clientY/H-.5)*2;if(!interactive)return;finalScene.style.transform='scale(1.012) translate('+(-mouseX*4)+'px,'+(-mouseY*2.5)+'px)';$('.title-stage').style.translate=(mouseX*-3)+'px '+(mouseY*-2)+'px';});
addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{if(!Snd.ctx)return;document.hidden?Snd.ctx.suspend():(Snd.on&&Snd.ctx.resume())});
setInterval(()=>{if(interactive&&!document.hidden)addMeteor()},5200);
resize();draw();setMode('moon');runIntro(false);
window.midAutumnDebug={setPhase,finish,runIntro,setMode,moonRipple};
})();
