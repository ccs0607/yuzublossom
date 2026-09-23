/* 月满人间 · 中秋贺卡 —— 交互引擎
   星尘 / 烟花 / 流星 / 萤火 / 祈愿天灯 / 桂花雨 / 程序化氛围乐 */
(()=>{'use strict';
const $=s=>document.querySelector(s),R=(a,b)=>a+Math.random()*(b-a),TAU=Math.PI*2;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const intro=$('#intro'),stage=$('#stage'),card=$('#wishCard'),btn=$('#wishBtn'),
      panel=$('#wishPanel'),wishInput=$('#wishInput'),launchBtn=$('#launchBtn'),
      wishCount=$('#wishCount'),poem=$('#poem'),toast=$('#toast'),
      seal=$('#seal'),soundBtn=$('#soundBtn');

/* ---------- 开场 ---------- */
setTimeout(()=>stage.classList.add('show'),700);
setTimeout(()=>intro.classList.add('hide'),2800);

/* ---------- CSS 灯笼与花瓣(远景观) ---------- */
const lanternsBox=$('.lanterns'),petalsBox=$('.petals');
for(let i=0;i<(RM?8:16);i++){let e=document.createElement('i');e.className='lantern';
  e.style.left=(4+Math.random()*92)+'vw';e.style.bottom=(-20-Math.random()*40)+'vh';
  e.style.transform=`scale(${.55+Math.random()*.8})`;
  e.style.animationDuration=(10+Math.random()*12)+'s';e.style.animationDelay=(4+Math.random()*10)+'s';
  lanternsBox.appendChild(e)}
for(let i=0;i<(RM?12:30);i++){let e=document.createElement('i');e.className='petal';
  e.style.left=Math.random()*100+'vw';e.style.top=(-10-Math.random()*40)+'vh';
  e.style.animationDuration=(8+Math.random()*11)+'s';e.style.animationDelay=(3+Math.random()*14)+'s';
  petalsBox.appendChild(e)}

/* ---------- 音频引擎(WebAudio 实时合成,无素材) ---------- */
const scaleN=[220,246.94,277.18,329.63,369.99,440,493.88,554.37]; // A 宫五声
const Snd={ctx:null,on:false,wet:null,
  init(){if(this.ctx)return;const C=this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    const master=this.master=C.createGain();master.gain.value=.9;master.connect(C.destination);
    const delay=C.createDelay(1);delay.delayTime.value=.42;
    const fb=C.createGain();fb.gain.value=.36;delay.connect(fb);fb.connect(delay);
    const wet=this.wet=C.createGain();wet.gain.value=.3;delay.connect(wet);wet.connect(master);
    this.pad()},
  pad(){const C=this.ctx,g=C.createGain();g.gain.value=0;g.connect(this.master);
    const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;lp.connect(g);
    [[110,'sine',.5],[164.81,'sine',.3],[220.5,'triangle',.11]].forEach(([f,t,v],i)=>{
      const o=C.createOscillator();o.type=t;o.frequency.value=f;o.detune.value=(i-1)*5;
      const og=C.createGain();og.gain.value=v;o.connect(og);og.connect(lp);o.start();
      const lfo=C.createOscillator();lfo.frequency.value=.05+Math.random()*.06;
      const lg=C.createGain();lg.gain.value=v*.45;lfo.connect(lg);lg.connect(og.gain);lfo.start()});
    g.gain.linearRampToValueAtTime(.05,C.currentTime+5);
    const nb=C.createBuffer(1,C.sampleRate*2,C.sampleRate),d=nb.getChannelData(0);let last=0;
    for(let i=0;i<d.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*3}
    const ns=C.createBufferSource();ns.buffer=nb;ns.loop=true;
    const nf=C.createBiquadFilter();nf.type='lowpass';nf.frequency.value=380;
    const ng=C.createGain();ng.gain.value=.028;ns.connect(nf);nf.connect(ng);ng.connect(this.master);ns.start()},
  pluck(f,v=1,when=0){if(!this.ctx||!this.on)return;const C=this.ctx,t=C.currentTime+when;
    const g=C.createGain();g.connect(this.master);g.connect(this.wet);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.15*v,t+.008);
    g.gain.exponentialRampToValueAtTime(.0001,t+2.6);
    const o=C.createOscillator();o.type='triangle';o.frequency.value=f;
    const o2=C.createOscillator();o2.type='sine';o2.frequency.value=f*2;
    const g2=C.createGain();g2.gain.value=.22;o2.connect(g2);g2.connect(g);
    o.connect(g);o.start(t);o2.start(t);o.stop(t+2.8);o2.stop(t+2.8)},
  melody(){if(!this.on||document.hidden)return;
    this.pluck(scaleN[Math.random()*scaleN.length|0]*(Math.random()<.3?2:1),.45+Math.random()*.5);
    if(Math.random()<.3)this.pluck(scaleN[Math.random()*scaleN.length|0],.3,.35);
    setTimeout(()=>this.melody(),(RM?4:1.8)+Math.random()*4200)},
  boom(){if(!this.ctx||!this.on)return;const C=this.ctx,t=C.currentTime;
    const nb=C.createBuffer(1,C.sampleRate*.5|0,C.sampleRate),d=nb.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    const s=C.createBufferSource();s.buffer=nb;
    const bp=C.createBiquadFilter();bp.type='bandpass';bp.Q.value=.8;
    bp.frequency.setValueAtTime(2400,t);bp.frequency.exponentialRampToValueAtTime(300,t+.5);
    const g=C.createGain();g.gain.setValueAtTime(.32,t);g.gain.exponentialRampToValueAtTime(.001,t+.55);
    s.connect(bp);bp.connect(g);g.connect(this.master);g.connect(this.wet);s.start(t);
    const o=C.createOscillator();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(45,t+.4);
    const og=C.createGain();og.gain.setValueAtTime(.2,t);og.gain.exponentialRampToValueAtTime(.001,t+.42);
    o.connect(og);og.connect(this.master);o.start(t);o.stop(t+.45)},
  chime(up){this.pluck(up?554.37:440,.55);this.pluck(up?739.99:554.37,.4,.14)},
  toggle(){this.init();this.on=!this.on;
    if(this.on){this.ctx.resume();this.chime(true);this.melody()}else this.ctx.suspend();
    soundBtn.classList.toggle('on',this.on);soundBtn.setAttribute('aria-pressed',this.on)}};
soundBtn.addEventListener('click',()=>Snd.toggle());
document.addEventListener('visibilitychange',()=>{
  if(!Snd.ctx)return;document.hidden?Snd.ctx.suspend():(Snd.on&&Snd.ctx.resume())});

/* ---------- 画布核心 ---------- */
const c=$('#fx'),x=c.getContext('2d');let W,H,dpr=Math.min(devicePixelRatio||1,2);
let dust=[],sparks=[],meteors=[],lanternSys=[],osmanthus=[],skyStars=[],flies=[];
function resize(){W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;
  c.style.width=W+'px';c.style.height=H+'px';x.setTransform(dpr,0,0,dpr,0,0);makeSky()}
resize();addEventListener('resize',resize);
const sprite=document.createElement('canvas');sprite.width=sprite.height=64;
{const s=sprite.getContext('2d'),g=s.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.6)');
 g.addColorStop(1,'rgba(255,255,255,0)');s.fillStyle=g;s.fillRect(0,0,64,64)}
function glow(px,py,r,color,a){x.globalAlpha=a;x.drawImage(color?tint(color):sprite,px-r,py-r,r*2,r*2);x.globalAlpha=1}
const tints={};function tint(col){if(tints[col])return tints[col];
  const t=document.createElement('canvas');t.width=t.height=64;const s=t.getContext('2d');
  s.drawImage(sprite,0,0);s.globalCompositeOperation='source-in';s.fillStyle=col;s.fillRect(0,0,64,64);
  return tints[col]=t}

/* 顶层粒子池在画布核心处声明 */
function makeSky(){skyStars=[];const n=(W*H>7e5?80:55);
  for(let i=0;i<n;i++)skyStars.push({x:R(0,W),y:R(0,H*.72),r:R(.4,1.4),ph:R(0,TAU),sp:R(.4,1.6)});
  flies=[];const m=(W*H>7e5?12:8);
  for(let i=0;i<m;i++)flies.push({x:R(0,W),y:R(H*.64,H*.93),ph:R(0,TAU),ph2:R(0,TAU),sp:R(.3,.8)})}

/* ---------- 星尘(指针轨迹) ---------- */
let mouse={x:-999,y:-999};
addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;
  if(Math.random()>.6&&dust.length<260)dust.push({x:e.clientX,y:e.clientY,
    vx:R(-.35,.35),vy:R(-1,-.3),a:1,r:R(1,3),l:R(55,95)})});

/* ---------- 视差 ---------- */
const bgL=$('.bg'),glowL=$('.moonGlow'),mistL=$('.mist');
let px=0,py=0,tx=0,ty=0;
addEventListener('pointermove',e=>{tx=e.clientX/W*2-1;ty=e.clientY/H*2-1});
function parallax(){px+=(tx-px)*.05;py+=(ty-py)*.05;
  bgL.style.translate=`${-px*7}px ${-py*4}px`;glowL.style.translate=`${-px*16}px ${-py*10}px`;
  mistL.style.translate=`${-px*10}px ${-py*5}px`;card.style.translate=`${px*4}px ${py*2}px`}

/* ---------- 烟花 ---------- */
const PALETTE=['#ffd58b','#ff9db0','#9be8c0','#9cc8ff','#fff3d6','#f7a8ff'];
function firework(txp,typ){if(sparks.length>820)return;
  sparks.push({rocket:1,x:txp+R(-40,40),y:H+10,vx:R(-.25,.25),vy:-R(9.5,12.5),ty:Math.max(H*.05,Math.min(typ,H*.72)),
    hue:PALETTE[Math.random()*PALETTE.length|0]})}
function explode(p){const n=(RM?36:56)+Math.random()*30|0;
  for(let i=0;i<n;i++){const a=Math.random()*TAU,s=R(1,5.2);
    sparks.push({x:p.x,y:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,a:1,r:R(1,2.4),
      l:R(60,110),hue:Math.random()<.85?p.hue:'#fff3d6',tw:Math.random()<.35,g:.016})}
  if(Math.random()<.25){const h2=PALETTE[Math.random()*PALETTE.length|0];
    for(let i=0;i<26;i++){const a=Math.random()*TAU,s=R(.4,1.6);
      sparks.push({x:p.x,y:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,a:1,r:1.4,l:R(90,140),hue:h2,g:.005})}}
  Snd.boom()}
/* 点击夜空放烟花(避开控件) */
addEventListener('pointerdown',e=>{
  if(!stage.classList.contains('show'))return;
  if(e.target.closest('button,input,.card,.wishPanel,header,a'))return;
  firework(e.clientX,e.clientY)});
/* 自动烟花:避开嫦娥(中右)与左侧题字,取安全区 */
const ZONES=[[.05,.34,.06,.26],[.80,.95,.07,.30],[.38,.56,.03,.12]];
function autoFirework(){if(!document.hidden&&!RM){const z=ZONES[Math.random()*ZONES.length|0];
  firework(W*R(z[0],z[1]),H*R(z[2],z[3]))}
  setTimeout(autoFirework,(RM?22:9)+Math.random()*8)}
setTimeout(autoFirework,8500);

/* ---------- 流星 ---------- */
function meteor(){if(!document.hidden&&!RM&&meteors.length<3){
  const dir=Math.random()<.55?-1:1,ang=dir<0?R(2.6,2.9):R(.25,.55);
  meteors.push({x:W*R(.15,.75),y:H*R(.04,.3),vx:Math.cos(ang)*R(9,13)*dir,vy:Math.abs(Math.sin(ang))*R(4,7),
    len:R(90,150),a:1,l:R(46,64)})}
  setTimeout(meteor,(RM?14:5)+Math.random()*6)}
setTimeout(meteor,4500);

/* ---------- 祈愿天灯 ---------- */
const DEFAULT_WISHES=['所念之人 岁岁平安','花好月圆 事事圆满','但愿人长久','月圆人圆 梦想成真','千里共婵娟'];
function skyLantern(text){lanternSys.push({x:W/2+R(-60,60),y:H*.86,bx:W/2+R(-60,60),ph:R(0,TAU),
  vy:R(.5,.75),a:0,drift:R(-1,1)*R(14,30),s:R(.9,1.25),text})}
function count(){try{return +localStorage.getItem('mf_wish')||0}catch(e){return 0}}
function setCount(v){try{localStorage.setItem('mf_wish',v)}catch(e){}
  wishCount.textContent=v>0?`已放飞 ${v} 盏祈愿灯`:''
  wishCount.style.opacity=v>0?1:0}
function release(){let t=wishInput.value.trim();
  if(!t)t=DEFAULT_WISHES[Math.random()*DEFAULT_WISHES.length|0];
  skyLantern(t);setCount(count()+1);wishInput.value='';Snd.chime(true);
  burst(W/2,H*.8,50)}
launchBtn.addEventListener('click',release);
wishInput.addEventListener('keydown',e=>{if(e.key==='Enter')release()});

/* ---------- 主按钮 / 祝福卡 ---------- */
let firstOpen=true;
btn.addEventListener('click',()=>{card.classList.toggle('open');
  const open=card.classList.contains('open');
  panel.classList.toggle('show',open);
  if(open){burst(innerWidth*.62,innerHeight*.52,90);Snd.chime(false);
    if(firstOpen){firstOpen=false;setTimeout(()=>{skyLantern('但愿人长久');setCount(Math.max(count(),1))},900)}
    setTimeout(()=>wishInput.focus(),650)}});

/* ---------- 月印彩蛋:桂花雨 ---------- */
seal.addEventListener('click',e=>{e.stopPropagation();
  Snd.pluck(659.25,.5);Snd.pluck(554.37,.4,.16);
  showToast('桂子月中落 天香云外飘');
  for(let i=0;i<(RM?40:110);i++)osmanthus.push({x:R(0,W),y:-R(10,300),
    vy:R(1.1,2.4),ph:R(0,TAU),amp:R(8,26),r:R(1.8,3.4),a:R(.7,1),rot:R(0,TAU)})});
let toastT;function showToast(t){toast.textContent=t;toast.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>toast.classList.remove('show'),3200)}

/* ---------- 诗词轮播 ---------- */
const POEMS=[['海上生明月，天涯共此时','张九龄'],['此生此夜不长好，明月明年何处看','苏轼'],
  ['一轮秋影转金波，飞镜又重磨','辛弃疾'],['至今不会天中事，应是嫦娥掷与人','皮日休'],
  ['一年逢好夜，万里见明时','张祜'],['尘中见月心亦闲，况是清秋仙府间','顾况']];
let pi=0;function setPoem(){poem.style.opacity=0;
  setTimeout(()=>{const p=POEMS[pi++%POEMS.length];
    poem.innerHTML=`${p[0]}<small>—— ${p[1]}</small>`;poem.style.opacity=1},1200)}
setPoem();setInterval(setPoem,9000);

/* ---------- 粒子更新与绘制 ---------- */
function burst(px,py,n){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=R(.5,2.5);
  dust.push({x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,a:1,r:R(1,2.6),l:R(80,135)})}}
function drawLantern(L,t){const sway=Math.sin(t*.0009+L.ph)*L.drift;L.bx+=0;L.x=L.bx+sway;
  L.y-=L.vy;if(L.y<H*.3)L.a-=.006;else if(L.a<1)L.a+=.02;if(L.a<0)return false;
  const w=34*L.s,h=46*L.s,X=L.x,Y=L.y;
  x.save();x.globalAlpha=Math.min(1,L.a);
  const flick=.85+Math.sin(t*.012+L.ph)*.15;
  glow(X,Y+h*.4,52*L.s,'#ffb659',.5*L.a*flick);
  const g=x.createLinearGradient(X,Y-h/2,X,Y+h/2);
  g.addColorStop(0,'#ffe9b0');g.addColorStop(.55,'#ffc266');g.addColorStop(1,'#f2953d');
  x.fillStyle=g;x.beginPath();
  if(x.roundRect)x.roundRect(X-w/2,Y-h/2,w,h,[w*.3,w*.3,w*.12,w*.12]);else x.rect(X-w/2,Y-h/2,w,h);
  x.fill();
  x.strokeStyle='rgba(120,50,10,.45)';x.lineWidth=1;x.stroke();
  x.fillStyle=`rgba(255,240,190,${.85*flick})`;
  x.beginPath();x.ellipse(X,Y+h*.22,w*.2*flick,4*L.s,0,0,TAU);x.fill();
  if(L.text){x.fillStyle='rgba(110,38,8,.9)';x.font=`${Math.round(13*L.s)}px "Noto Serif SC","Songti SC",serif`;
    x.textAlign='center';x.textBaseline='middle';
    const t2=L.text.length>9?[L.text.slice(0,9),L.text.slice(9,18)]:[L.text];
    t2.forEach((row,i)=>x.fillText(row,X,Y-h*.08+i*17*L.s))}
  x.restore();return L.y>-80}
function tick(ts){x.clearRect(0,0,W,H);
  /* 闪烁星空 */
  for(const s of skyStars){const a=.25+.55*(.5+.5*Math.sin(ts*.001*s.sp+s.ph));
    x.globalAlpha=a;x.fillStyle='#fff';x.beginPath();x.arc(s.x,s.y,s.r,0,TAU);x.fill()}
  x.globalAlpha=1;
  /* 流星 */
  for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];m.x+=m.vx;m.y+=m.vy;m.l--;
    m.a=Math.min(1,m.l/14)*(Math.min(1,(m.maxL||60)/60));if(m.l<=0){meteors.splice(i,1);continue}
    const sp=Math.hypot(m.vx,m.vy),ux=m.vx/sp,uy=m.vy/sp,tail=Math.min(m.len,m.l*3);
    const gr=x.createLinearGradient(m.x,m.y,m.x-ux*tail,m.y-uy*tail);
    gr.addColorStop(0,`rgba(255,250,225,${.9*Math.min(1,m.l/16)})`);gr.addColorStop(1,'rgba(255,250,225,0)');
    x.strokeStyle=gr;x.lineWidth=1.6;x.beginPath();x.moveTo(m.x,m.y);
    x.lineTo(m.x-ux*tail,m.y-uy*tail);x.stroke();glow(m.x,m.y,7,'#fff6d8',.75)}
  /* 祈愿天灯 */
  for(let i=lanternSys.length-1;i>=0;i--)if(!drawLantern(lanternSys[i],ts))lanternSys.splice(i,1);
  /* 烟花与火花 */
  for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];
    if(p.rocket){p.x+=p.vx;p.y+=p.vy;p.vy+=.06;
      x.strokeStyle='rgba(255,220,150,.85)';x.lineWidth=2;
      x.beginPath();x.moveTo(p.x,p.y);x.lineTo(p.x-p.vx*2.4,p.y-p.vy*2.4);x.stroke();
      glow(p.x,p.y,9,'#ffd58b',.85);
      if(p.y<=p.ty||p.vy>=-1){p.rocket=0;explode(p);sparks.splice(i,1)}continue}
    const ox=p.x,oy=p.y;p.x+=p.vx;p.y+=p.vy;p.vy+=p.g||.014;p.vx*=.985;p.vy*=.985;
    p.a-=1/p.l;let a=p.a;
    if(p.tw)a*= .4+.6*Math.abs(Math.sin(ts*.02+p.x));
    if(p.a<=0){sparks.splice(i,1);continue}
    x.strokeStyle=p.hue;x.globalAlpha=a*.9;x.lineWidth=p.r;
    x.beginPath();x.moveTo(ox,oy);x.lineTo(p.x,p.y);x.stroke();x.globalAlpha=1;
    glow(p.x,p.y,p.r*3.2,p.hue,a*.5)}
  /* 桂花雨 */
  for(let i=osmanthus.length-1;i>=0;i--){const o=osmanthus[i];
    o.y+=o.vy;o.rot+=.05;o.x+=Math.sin(ts*.001+o.ph)*.4;
    if(o.y>H+20){osmanthus.splice(i,1);continue}
    x.save();x.translate(o.x,o.y);x.rotate(o.rot);x.globalAlpha=o.a;
    x.fillStyle='#ffd977';
    for(let k=0;k<4;k++){x.beginPath();x.arc(Math.cos(k*TAU/4)*o.r,Math.sin(k*TAU/4)*o.r,o.r*.72,0,TAU);x.fill()}
    x.fillStyle='rgba(200,120,20,.9)';x.beginPath();x.arc(0,0,o.r*.4,0,TAU);x.fill();x.restore()}
  /* 萤火虫 */
  for(const f of flies){f.x+=Math.sin(ts*.0004*f.sp+f.ph)*.6;f.y+=Math.cos(ts*.0003*f.sp+f.ph2)*.4;
    if(f.x<-10)f.x=W+10;if(f.x>W+10)f.x=-10;
    const a=.25+.75*Math.pow(.5+.5*Math.sin(ts*.0012*f.sp+f.ph2),2);
    glow(f.x,f.y,10,'#d9ff9e',a*.8);x.globalAlpha=a;x.fillStyle='#f4ffd0';
    x.beginPath();x.arc(f.x,f.y,1.2,0,TAU);x.fill();x.globalAlpha=1}
  /* 星尘 */
  for(let i=dust.length-1;i>=0;i--){const p=dust[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.004;
    p.a-=1/p.l;if(p.a<=0){dust.splice(i,1);continue}
    glow(p.x,p.y,p.r*4.5,'#ffe8b8',p.a*.85)}
  parallax();requestAnimationFrame(tick)}
requestAnimationFrame(tick);
setCount(count());
setTimeout(()=>burst(W*.68,H*.31,75),4100);
})();
