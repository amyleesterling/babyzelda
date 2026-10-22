import {WORLD,ITEMS,DESTINATIONS,freshState,restoreState,count,target,canStand,collectNearby,interact,hint} from './core.mjs';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
const SAVE='babyzelda.adventure.v1';
const silentTest=new URLSearchParams(location.search).get('silent')==='1';
let state=freshState(),storageOK=true;
try{state=restoreState(JSON.parse(localStorage.getItem(SAVE)));}catch{storageOK=false;}
if(silentTest)state.voice=false;
let playing=false,wonOpen=false,keys=new Set(),route=[],particles=[],time=0,last=0,saveClock=0,toastTimer,face=1,moving=false,view={x:720,y:480,scale:1,w:900,h:600,dpr:1};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const palettes={pink:['#dfa4c8','#be7faa','#eac5dd'],purple:['#b79bd9','#8e76bc','#d6c6e9'],blue:['#8abed2','#599cb6','#bedce6']};
const cocoSprite=new Image();cocoSprite.src='assets/coco-unicorn.png';
const questData=[['🥕','A bunny’s picnic','Carrots for Clover'],['💎','A rainbow crossing','Mend the little bridge'],['✨','Wake up, Doodle!','A dragon’s bright morning']];
function save(){try{localStorage.setItem(SAVE,JSON.stringify(state));}catch{storageOK=false;}$('saved').textContent=storageOK?'Progress saves here':'Progress lasts this visit';}
function speak(text,force=false){if(silentTest||!('speechSynthesis'in window)||(!state.voice&&!force))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.86;u.pitch=1.15;u.volume=.85;const voices=speechSynthesis.getVoices();const v=voices.find(v=>v.lang.startsWith('en')&&/Samantha|Aria|Jenny|Google US|Zira/i.test(v.name))||voices.find(v=>v.lang.startsWith('en'));if(v)u.voice=v;speechSynthesis.speak(u);}
let audio;
function chime(celebrate=false){if(silentTest||!state.voice)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();[523,659,784,...(celebrate?[1047]:[])].forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.10;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.4);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+.42);});}catch{}}
function toast(text,voice=true){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4500);if(voice)speak(text);}
function updateUI(){
 $('quests').innerHTML=questData.map(([icon,title,sub],i)=>`<div class="quest-card ${state.stage>i?'complete':state.stage===i?'active':''}"><span class="quest-icon" aria-hidden="true">${state.stage>i?'✓':icon}</span><div><strong>${title}</strong><small>${state.stage>i?'Kindness delivered!':state.stage===i?`${count(state)} of 3 found`:sub}</small></div></div>`).join('');
 $('hint').textContent=hint(state);$('sound').innerHTML=`♫ <span>Voice ${state.voice?'on':'off'}</span>`;$('sound').setAttribute('aria-label',`Turn spoken hints ${state.voice?'off':'on'}`);$('sound').setAttribute('aria-pressed',String(state.voice));
 $('inventory').innerHTML=state.stage>=3?'<span class="pocket-item">🌈 Rainbow magic</span>'+ (state.stage===4?'<span class="pocket-item">👑 Kindness crown</span>':''):count(state)?`<span class="pocket-item">${['🥕','💎','✨'][state.stage]} ${count(state)} / 3</span>`:'<span class="empty-pocket">A little space for lovely things</span>';
 $('play').innerHTML=(state.stage||state.collected.length?'Keep adventuring':'Let’s play')+' <span aria-hidden="true">➜</span>';$('unicornColor').value=state.color;save();
}
function burst(x,y,n=16){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*120,vy:-30-Math.random()*110,life:1.2,max:1.2,color:['#fff3ad',palettes[state.color][0],'#dceba8','#fffdf1'][i%4],r:3+Math.random()*4});}
function pickup(){const found=collectNearby(state);if(!found.length)return;for(const i of found)burst(i.x,i.y);chime();const label=['Carrot','Rainbow gem','Firefly'][state.stage];toast(count(state)===3?hint(state):`${label} found! ${count(state)} of 3.`,count(state)===3);updateUI();}
function magic(){if(!playing||wonOpen||$('settingsDialog').open)return;burst(state.x+face*25,state.y-30,24);pickup();const result=interact(state);if(result==='complete'){
 route=[];chime(true);const messages=['Thank you! A picnic for my bunny family! Now find three rainbow gems.','You made a rainbow bridge! Cross over and find three glowing fireflies.','Good morning! You woke me with a little light. My castle crown is yours!'];toast(messages[state.stage-1]);updateUI();
 }else if(result==='win'){route=[];wonOpen=true;$('win').classList.remove('hidden');chime(true);speak('Hooray! You are the meadow’s little hero. Kindness is your superpower!');updateUI();for(let i=0;i<6;i++)burst(state.x+(Math.random()-.5)*300,state.y-100,16);
 }else if(result==='need-items'){toast(hint(state));}else if(result==='hint'){toast(hint(state));}else toast('A little extra sparkle for the meadow!',false);
}
function start(){playing=true;$('intro').classList.add('hidden');canvas.focus({preventScroll:true});speak('Welcome, little unicorn! Tap the grass to move, or use the arrow keys. Tap Magic to talk to friends. '+hint(state));}
$('play').onclick=start;$('magic').onclick=()=>{magic();canvas.focus({preventScroll:true});};$('repeat').onclick=()=>speak(hint(state),true);
$('sound').onclick=()=>{state.voice=!state.voice;if(!state.voice&&'speechSynthesis'in window)speechSynthesis.cancel();updateUI();if(state.voice)speak(hint(state));};
$('explore').onclick=()=>{wonOpen=false;$('win').classList.add('hidden');canvas.focus({preventScroll:true});};
function reset(){state={...freshState(),voice:state.voice,color:state.color};route=[];keys.clear();wonOpen=false;$('win').classList.add('hidden');updateUI();view.x=state.x;view.y=state.y;toast('A new adventure! '+hint(state));}
$('again').onclick=reset;
$('settings').onclick=()=>{keys.clear();route=[];$('reset').textContent='Start a fresh adventure';$('settingsDialog').showModal();};
let resetArmed=false;$('settingsDialog').addEventListener('close',()=>{resetArmed=false;canvas.focus({preventScroll:true});});
$('reset').onclick=()=>{if(!resetArmed){resetArmed=true;$('reset').textContent='Yes, clear progress and start again';return;}reset();$('settingsDialog').close();};
$('unicornColor').onchange=e=>{state.color=e.target.value;updateUI();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Use your browser’s full screen or add this game to your home screen.',false);}catch{toast('Full screen isn’t available in this browser.',false);}};
const directions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
window.addEventListener('keydown',e=>{if(!playing||wonOpen||$('settingsDialog').open||/INPUT|SELECT|BUTTON/.test(e.target.tagName))return;const dir=directions[e.key]||directions[e.key.toLowerCase()];if(dir){e.preventDefault();keys.add(dir);route=[];}if([' ','e','E','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)magic();}});
window.addEventListener('keyup',e=>{keys.delete(directions[e.key]||directions[e.key.toLowerCase()]);});
function clearKeys(){keys.clear();document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));}
window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',()=>{clearKeys();save();});
document.querySelectorAll('[data-dir]').forEach(b=>{b.onpointerdown=e=>{if(!playing||wonOpen)return;e.preventDefault();route=[];b.setPointerCapture(e.pointerId);keys.add(b.dataset.dir);b.classList.add('held');};const release=()=>{keys.delete(b.dataset.dir);b.classList.remove('held');};b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;});
canvas.addEventListener('pointerdown',e=>{if(!playing||wonOpen||$('settingsDialog').open)return;canvas.focus({preventScroll:true});const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left-view.w/2)/view.scale+view.x,y=(e.clientY-r.top-view.h/2)/view.scale+view.y;const dest={x:Math.max(60,Math.min(1380,x)),y:Math.max(90,Math.min(890,y))};route=[];
 if(dest.x>835&&dest.x<935){dest.x=state.x<885?805:965;dest.y=465;}
 if((state.x<835&&dest.x>935)||(state.x>935&&dest.x<835)){if(state.stage<2){toast('The bridge needs a little rainbow magic first. '+hint(state));return;}const from=state.x<835?795:975,to=state.x<835?975:795;route.push({x:from,y:466},{x:to,y:466});}
 route.push(dest);burst(dest.x,dest.y,5);
});
function resize(){const r=canvas.getBoundingClientRect();view.w=r.width;view.h=r.height;view.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*view.dpr);canvas.height=Math.round(r.height*view.dpr);view.scale=Math.max(r.width/WORLD.w,r.height/WORLD.h,r.width<550?.76:.58);}
new ResizeObserver(resize).observe(canvas);
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function path(c,points,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function star(c,x,y,r,color,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,rr=i%2?r*.3:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fill();c.restore();}
function round(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function tree(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,6,20,34,13,'#6c8e5533');round(c,-5,-5,11,29,4,'#897b52');ellipse(c,0,-18,33,37,'#638352');ellipse(c,-12,-31,28,29,'#73975d');ellipse(c,11,-42,26,29,'#85a768');ellipse(c,-6,-53,25,23,'#95b779');ellipse(c,-14,-61,11,9,'#a6c58b');c.restore();}
function flower(c,x,y,color='#f8efd1',size=3){for(let i=0;i<5;i++){const a=i*1.256;ellipse(c,x+Math.cos(a)*size,y+Math.sin(a)*size,size*.75,size*.75,color);}ellipse(c,x,y,size*.55,size*.55,'#c4a458');}
const ground=document.createElement('canvas');ground.width=WORLD.w;ground.height=WORLD.h;const g=ground.getContext('2d');
let seed=24;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function makeGround(){g.fillStyle='#b9ce91';g.fillRect(0,0,1440,960);
 for(let i=0;i<120;i++)ellipse(g,rand()*1440,rand()*960,30+rand()*110,15+rand()*65,['#c5d59b','#aec789','#c0d298','#b4ce93'][i%4]);
 ellipse(g,345,540,325,300,'#c8d8a2');ellipse(g,1195,540,270,295,'#bdd2a2');
 const roads=[[[280,960],[290,670],[315,530],[320,370],[510,260],[700,270]],[[310,530],[560,500],[795,466],[1000,466],[1150,350],[1200,180]],[[310,530],[480,680],[600,770],[780,785]],[[1010,466],[1015,670],[1265,650],[1300,360]]];
 for(const p of roads){path(g,p,'#a9bd8340',83);path(g,p,'#e1d6aa',68);path(g,p,'#e8ddb6',47);}
 for(let i=0;i<1100;i++){const x=rand()*1440,y=rand()*960;if(x>817&&x<949)continue;const a=rand();if(a<.45){path(g,[[x-3,y+4],[x,y],[x+2,y+4]],'#8eaa6d66',1.4);}else if(a<.8){ellipse(g,x,y,1.5,1,'#edebc1');}else flower(g,x,y,i%3?'#eef0c7':'#e5b6c7',2.3);}
 // A winding blue ribbon, with softly scalloped banks.
 path(g,[[882,-50],[879,150],[891,320],[883,500],[879,690],[887,1010]],'#8fab7e',121);path(g,[[882,-50],[879,150],[891,320],[883,500],[879,690],[887,1010]],'#dce3b2',109);path(g,[[882,-50],[879,150],[891,320],[883,500],[879,690],[887,1010]],'#79bdb5',93);path(g,[[875,-50],[871,150],[882,320],[875,500],[871,690],[879,1010]],'#91ccc2',56);
 for(let i=0;i<75;i++){const x=852+rand()*61,y=rand()*960;path(g,[[x,y],[x+10+rand()*12,y]],'#d9ece088',2);}
 for(let i=0;i<18;i++){let y=rand()*960;ellipse(g,rand()>.5?833:938,y,9+rand()*7,5+rand()*6,'#9eab82');}
 for(let i=0;i<17;i++){let y=rand()*960;const x=rand()>.5?839:928;path(g,[[x,y],[x-4,y-19],[x+2,y-10]],'#729864',2);}
 // A tiny picnic and vegetable patch.
 round(g,170,286,120,80,9,'#e7b4a1');for(let x=176;x<285;x+=20)for(let y=291;y<362;y+=20)round(g,x,y,9,9,1,'#f4d9b9');ellipse(g,221,323,22,13,'#a48358');ellipse(g,221,319,19,10,'#ead6ad');
 for(let i=0;i<5;i++){ellipse(g,157+i*22,539,8,5,'#a4b47e');path(g,[[157+i*22,536],[154+i*22,525],[160+i*22,531]],'#6e9d5a',3);}
 // Castle in the clouds, made from warm pale stone.
 ellipse(g,1200,210,133,39,'#9cae8360');round(g,1094,103,211,122,12,'#d7c7ad');round(g,1104,91,191,120,8,'#f0e2c4');
 for(const x of [1080,1270]){round(g,x,58,53,164,8,'#e2d4bb');round(g,x+6,61,40,153,5,'#f4e7ce');g.fillStyle='#9c8eaf';g.beginPath();g.moveTo(x-8,70);g.lineTo(x+26,12);g.lineTo(x+62,70);g.fill();round(g,x+18,102,17,31,9,'#8ca9a1');path(g,[[x+26,13],[x+26,-12]],'#968963',3);g.fillStyle='#dca7b8';g.beginPath();g.moveTo(x+28,-12);g.lineTo(x+53,-5);g.lineTo(x+28,4);g.fill();}
 for(let i=0;i<6;i++)round(g,1130+i*24,81,15,23,2,'#f0e2c4');round(g,1170,147,60,80,30,'#b4a387');round(g,1177,156,46,71,23,'#837b88');round(g,1140,118,17,25,8,'#8ca9a1');round(g,1240,118,17,25,8,'#8ca9a1');
 // Scattered daisies, mushrooms, and storybook trees at the edges.
 for(let i=0;i<100;i++){const x=rand()*1440,y=rand()*960;if(x>800&&x<970||Math.hypot(x-1200,y-150)<170)continue;if(y<120||y>900||x<80||x>1380){tree(g,x,y,.75+rand()*.55);}else if(i%3===0){flower(g,x,y,'#f9efcf',4);flower(g,x+12,y+8,'#e6b8c8',3);}}
 for(const [x,y,s]of [[90,260,1.5],[80,430,1.2],[630,120,1.4],[720,150,1],[600,870,1.2],[760,890,1.2],[1015,130,1.3],[1395,520,1.3],[1340,830,1.4],[1000,850,1.2],[420,140,1.1],[55,750,1.3]])tree(g,x,y,s);
 for(const [x,y]of [[440,340],[675,580],[1030,780],[1350,250]]){round(g,x-3,y,6,14,2,'#f5e8cf');ellipse(g,x,y,12,8,'#bf8396');ellipse(g,x-4,y-3,2,2,'#f8e4d1');}
 // Carved trail signs.
 for(const[x,y]of [[430,520],[1000,470]]){round(g,x-3,y-8,6,32,2,'#93825c');round(g,x-28,y-27,57,26,5,'#bc9e6b');path(g,[[x-14,y-14],[x+14,y-14],[x+7,y-20]],'#f7e7bd',3);}
}
makeGround();
function label(text,x,y,color='#405538'){ctx.font=`600 ${Math.max(16,12/view.scale)}px 'Trebuchet MS',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';const w=ctx.measureText(text).width;round(ctx,x-w/2-10,y-12,w+20,25,12,'#fffbebed');ctx.fillStyle=color;ctx.fillText(text,x,y+1);}
function bridge(){if(state.stage<2){for(const x of [824,940]){round(ctx,x,424,13,91,4,'#b19b73');ellipse(ctx,x+6,420,10,6,'#d1bd91');}path(ctx,[[824,455],[834,461]],'#b19b73',12);path(ctx,[[945,489],[936,489]],'#b19b73',12);star(ctx,792,418,10,'#f8e2a0',time*.3);return;}
 ctx.save();round(ctx,824,428,122,77,6,'#9c9e8c');const colors=['#d7a7aa','#e8bf8a','#e7da99','#b3c88f','#99c6be','#a8b5d3','#c1a7cc'];colors.forEach((c,i)=>round(ctx,829,431+i*10,113,10,2,c));for(const y of [424,506])path(ctx,[[817,y],[827,y-7],[944,y-7],[953,y]],'#f6ead0',6);for(const x of[824,944])for(const y of[419,504]){round(ctx,x-3,y-12,7,26,3,'#e9d9ba');ellipse(ctx,x,y-13,7,7,'#f8e3a9');}ctx.restore();}
function bunny(x,y){ctx.save();ctx.translate(x,y);ellipse(ctx,0,15,28,11,'#67865033');ellipse(ctx,0,-5,23,25,'#f6e6cf');ellipse(ctx,-13,-43,8,25,'#f6e6cf');ellipse(ctx,9,-45,8,27,'#f6e6cf');ellipse(ctx,-13,-45,3,16,'#ddb1b0');ellipse(ctx,9,-47,3,17,'#ddb1b0');ellipse(ctx,-1,-19,25,23,'#fff0d8');ellipse(ctx,-9,-23,2.7,3.5,'#4c5141');ellipse(ctx,10,-23,2.7,3.5,'#4c5141');ellipse(ctx,-15,-13,5,3,'#e4b9ad');ellipse(ctx,15,-13,5,3,'#e4b9ad');ellipse(ctx,1,-14,3,2,'#a97f7e');path(ctx,[[-4,-7],[1,-5],[6,-7]],'#ac8f7a',1.7);round(ctx,-18,4,35,9,4,'#a6b882');ellipse(ctx,-17,16,10,6,'#f9ecd6');ellipse(ctx,17,16,10,6,'#f9ecd6');ctx.restore();label('Clover',x,y+41);}
function dragon(x,y){ctx.save();ctx.translate(x,y);const asleep=state.stage<3;ellipse(ctx,4,24,66,19,'#688b6030');path(ctx,[[25,10],[65,9],[82,-10],[78,6],[58,27],[25,30]],'#91ada5',20);ctx.fillStyle='#d0c2d8';ctx.beginPath();ctx.moveTo(-4,-12);ctx.quadraticCurveTo(-48,-80,-49,-28);ctx.quadraticCurveTo(-70,-54,-60,-4);ctx.lineTo(-12,13);ctx.fill();ellipse(ctx,0,1,44,36,'#9fbbb0');ellipse(ctx,-3,9,24,25,'#d4dbc0');ellipse(ctx,-28,27,23,12,'#92afa4');ellipse(ctx,26,29,23,11,'#92afa4');ellipse(ctx,25,-28,31,29,'#adc8ba');ellipse(ctx,42,-16,27,18,'#b5cebd');for(let i=0;i<3;i++){ctx.fillStyle='#b7a9c4';ctx.beginPath();ctx.moveTo(-18+i*18,-28-i*2);ctx.lineTo(-10+i*18,-45-i*2);ctx.lineTo(-1+i*18,-28-i*2);ctx.fill();}ellipse(ctx,57,-20,2.5,3,'#6b8c7b');if(asleep){path(ctx,[[23,-34],[29,-31],[35,-34]],'#4e7162',2.7);ctx.fillStyle='#6c837d';ctx.font='bold 21px Georgia';ctx.fillText('z',63,-57-Math.sin(time)*3);ctx.font='bold 15px Georgia';ctx.fillText('z',81,-75-Math.sin(time)*4);}else{ellipse(ctx,30,-34,3.5,5,'#476b5b');ellipse(ctx,31,-36,1.3,1.6,'#fffbea');path(ctx,[[42,-7],[48,-4],[55,-7]],'#688a75',2);}
ctx.restore();label('Doodle',x,y+62);}
function unicorn(x,y){ctx.save();ctx.translate(x,y);ctx.scale(face,1);const bob=moving?Math.sin(time*14)*2:Math.sin(time*2)*1.2;ctx.translate(0,bob);const [mane,dark,light]=palettes[state.color];ellipse(ctx,0,21,31,10,'#4d75483b');
 if(cocoSprite.complete&&cocoSprite.naturalWidth){const frame=moving?1+Math.floor(time*9)%4:0;ctx.drawImage(cocoSprite,frame*256,0,256,256,-65,-105,130,130);if(state.stage===4){star(ctx,0,-111,13,'#f6d269');}ctx.restore();return;}
 // A flowing tail, four tiny hooves, and a very brave little nose.
 path(ctx,[[-24,-6],[-44,-12],[-42,7],[-52,13]],mane,13);path(ctx,[[-29,-10],[-47,-11],[-44,7]],light,5);
 for(const [i,lx]of [-16,14].entries()){const step=moving?Math.sin(time*14+i*Math.PI)*5:0;round(ctx,lx-4,3,9,23+step,4,'#deded3');round(ctx,lx-4,21+step,10,7,3,'#b9a5bd');round(ctx,lx+7,2,9,25-step,4,'#fffaf0');round(ctx,lx+7,22-step,10,7,3,'#c3acc6');}
 ellipse(ctx,-1,-1,32,22,'#fffaf0');ellipse(ctx,3,-7,25,12,'#ffffff');
 ctx.fillStyle='#fffaf0';ctx.beginPath();ctx.moveTo(9,-7);ctx.quadraticCurveTo(11,-42,25,-50);ctx.lineTo(43,-37);ctx.lineTo(37,-2);ctx.closePath();ctx.fill();
 for(let i=0;i<4;i++)ellipse(ctx,13-i*3,-34+i*9,10,10,i%2?light:mane);ellipse(ctx,32,-40,21,18,'#fffaf0');ellipse(ctx,45,-30,18,12,'#fffaf0');ellipse(ctx,52,-28,10,7,'#efd9d7');
 ctx.fillStyle='#d6b56f';ctx.beginPath();ctx.moveTo(30,-55);ctx.lineTo(39,-84);ctx.lineTo(43,-52);ctx.fill();path(ctx,[[34,-59],[41,-63]],'#f5e5ae',2);path(ctx,[[36,-68],[40,-70]],'#f5e5ae',2);
 ctx.fillStyle='#fffaf0';ctx.beginPath();ctx.moveTo(13,-48);ctx.lineTo(11,-70);ctx.quadraticCurveTo(29,-64,28,-49);ctx.fill();path(ctx,[[17,-59],[22,-53]],'#d5b1c1',4);ellipse(ctx,23,-50,12,7,mane);ellipse(ctx,38,-41,3,4.5,'#3e4b44');ellipse(ctx,39,-43,1,1.5,'white');ellipse(ctx,39,-31,5,3,'#edc1cd');ellipse(ctx,56,-29,1.5,1.8,'#b28a8f');
 if(state.stage===4){ctx.fillStyle='#dfbb68';ctx.beginPath();ctx.moveTo(17,-61);ctx.lineTo(13,-79);ctx.lineTo(25,-71);ctx.lineTo(32,-86);ctx.lineTo(38,-70);ctx.lineTo(49,-78);ctx.lineTo(45,-59);ctx.fill();ellipse(ctx,31,-68,3,4,'#9a83bc');}
ctx.restore();}
function item(i){const y=i.y+(reduced?0:Math.sin(time*2.2+i.x)*4);ctx.save();ctx.translate(i.x,y);ellipse(ctx,0,12,19,7,'#6e915330');if(i.kind==='carrot'){ctx.rotate(.25);ctx.fillStyle='#db9858';ctx.beginPath();ctx.moveTo(-10,-10);ctx.quadraticCurveTo(0,-18,11,-8);ctx.lineTo(0,20);ctx.closePath();ctx.fill();path(ctx,[[-2,-12],[-9,-25]],'#789657',5);path(ctx,[[0,-12],[3,-29]],'#8aa566',5);path(ctx,[[2,-12],[13,-23]],'#6f9253',5);path(ctx,[[-7,-2],[-1,0]],'#efb67b',2);}else if(i.kind==='gem'){ctx.fillStyle=['#b68ecb','#db9ba6','#8bbfc0'][ITEMS.indexOf(i)%3];ctx.beginPath();ctx.moveTo(-17,-6);ctx.lineTo(-8,-19);ctx.lineTo(9,-19);ctx.lineTo(18,-6);ctx.lineTo(0,20);ctx.closePath();ctx.fill();path(ctx,[[-16,-6],[17,-6],[0,19],[-6,-6],[0,-18],[7,-6]],'#fff5e899',2);star(ctx,-15,-22,5,'#fff6c8');}else{ellipse(ctx,0,0,30,30,'#f8ec9d28');ellipse(ctx,-9,-6,10,6,'#f8f7d6bb');ellipse(ctx,9,-6,10,6,'#f8f7d6bb');ellipse(ctx,0,3,7,10,'#f0d67b');ellipse(ctx,0,-6,5,5,'#7b8864');ellipse(ctx,-2,-7,1,1,'#fff');ellipse(ctx,2,-7,1,1,'#fff');star(ctx,0,7,5,'#fff5ba');}ctx.restore();}
function crown(){if(state.stage<3||state.stage>=4)return;const x=1200,y=165+Math.sin(time*2)*3;ellipse(ctx,x,y+15,28,9,'#f3dfa655');ctx.fillStyle='#e4bc60';ctx.beginPath();ctx.moveTo(x-20,y+8);ctx.lineTo(x-25,y-14);ctx.lineTo(x-9,y-5);ctx.lineTo(x,y-25);ctx.lineTo(x+10,y-5);ctx.lineTo(x+25,y-14);ctx.lineTo(x+20,y+8);ctx.closePath();ctx.fill();round(ctx,x-20,y+5,40,8,3,'#cda24c');ellipse(ctx,x,y,4,5,'#b496cb');star(ctx,x-31,y-21,7,'#fff8d6',time);star(ctx,x+33,y+2,5,'#fff8d6',-time);}
function drawGuide(){let t=target(state);if(!t)return;if(state.stage>=2){if(state.x<835&&t.x>935)t=Math.hypot(state.x-795,state.y-466)>28?{x:795,y:466}:{x:975,y:466};else if(state.x>835&&state.x<935)t={x:t.x>935?975:795,y:466};else if(state.x>935&&t.x<835)t=Math.hypot(state.x-975,state.y-466)>28?{x:975,y:466}:{x:795,y:466};}const dist=Math.hypot(state.x-t.x,state.y-t.y),a=Math.atan2(t.y-state.y,t.x-state.x);if(!reduced){for(let i=1;i<9;i++){const travel=(i*32+(time*15)%32),d=Math.min(dist-30,travel);if(d<30)continue;const x=state.x+Math.cos(a)*d,y=state.y+Math.sin(a)*d;star(ctx,x,y,3.6,'#fff7beaa',time*.3);}}
 const halo=40+Math.sin(time*2)*4;ctx.strokeStyle='#fff5beaa';ctx.lineWidth=2.5;ctx.setLineDash([4,9]);ctx.beginPath();ctx.ellipse(t.x,t.y+6,halo,halo*.55,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 const fx=state.x+Math.cos(a)*67,fy=state.y+Math.sin(a)*55-30;ellipse(ctx,fx,fy,15,15,'#fff5c440');star(ctx,fx,fy,9,'#fff5b7',time*.4);
 // A screen-edge compass remains visible when the next friend is off camera.
 const sx=(t.x-view.x)*view.scale+view.w/2,sy=(t.y-view.y)*view.scale+view.h/2;
 if(sx<30||sx>view.w-30||sy<80||sy>view.h-40){const ex=Math.max(35,Math.min(view.w-35,sx)),ey=Math.max(95,Math.min(view.h-55,sy));ctx.save();ctx.translate((ex-view.w/2)/view.scale+view.x,(ey-view.h/2)/view.scale+view.y);ctx.scale(1/view.scale,1/view.scale);ellipse(ctx,0,0,22,22,'#fff9e8ee');ctx.rotate(a);ctx.fillStyle='#86659f';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-6,-7);ctx.lineTo(-3,0);ctx.lineTo(-6,7);ctx.fill();ctx.restore();}
}
function draw(){const {w,h,dpr,scale}=view;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.scale(scale,scale);ctx.translate(-view.x,-view.y);ctx.drawImage(ground,0,0);bridge();
 for(let i=0;i<8;i++){const yy=((time*12+i*137)%960);path(ctx,[[858+i%3*20,yy],[868+i%3*20,yy]],'#e2f4e577',2);}
 if(playing)drawGuide();
 for(const i of ITEMS)if(i.stage===state.stage&&!state.collected.includes(i.id))item(i);
 const actors=[{y:365,draw:()=>bunny(320,365)},{y:350,draw:()=>dragon(1155,350)},{y:state.y,draw:()=>unicorn(state.x,state.y)}];actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());crown();
 if(state.stage===1)label('Rainbow Bridge',775,378);if(state.stage===3)label('A gift for you!',1200,256);
 for(const p of particles){ctx.globalAlpha=p.life/p.max;star(ctx,p.x,p.y,p.r,p.color,p.life*2);}ctx.globalAlpha=1;ctx.restore();
 // A little soft light at the edges of the world.
 const vignette=ctx.createRadialGradient(w/2,h/2,w*.25,w/2,h/2,Math.max(w,h)*.7);vignette.addColorStop(0,'#eaf0bb00');vignette.addColorStop(1,'#527b3022');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
}
function update(dt){time+=dt;const paused=!playing||wonOpen||$('settingsDialog').open;moving=false;if(!paused){let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0);if(route.length&&!dx&&!dy){const p=route[0],distance=Math.hypot(p.x-state.x,p.y-state.y);if(distance<8)route.shift();else{dx=(p.x-state.x)/distance;dy=(p.y-state.y)/distance;}}
 const len=Math.hypot(dx,dy);if(len){dx/=len;dy/=len;const speed=180,xx=state.x+dx*speed*dt,yy=state.y+dy*speed*dt;if(canStand(xx,state.y,state.stage))state.x=xx;if(canStand(state.x,yy,state.stage))state.y=yy;moving=true;if(dx>.1)face=1;else if(dx<-.1)face=-1;pickup();}
 saveClock+=dt;if(saveClock>2){saveClock=0;save();}
 const place=state.x>935?(state.y<280?'Doodle’s Castle':'Firefly Garden'):(state.y>715?'Daisy Hollow':'Sunny Meadow');$('location').textContent=place;
 const d=DESTINATIONS[Math.min(state.stage,3)],near=state.stage<4&&Math.hypot(state.x-d.x,state.y-d.y)<115;const text=near&&state.stage===0?'Talk':near&&state.stage===3?'Crown':'Magic';$('magic').querySelector('strong').textContent=text;
 }
 const camX=playing?state.x:720,camY=playing?state.y:470,halfW=view.w/(2*view.scale),halfH=view.h/(2*view.scale);const tx=halfW>=720?720:Math.max(halfW,Math.min(1440-halfW,camX)),ty=halfH>=480?480:Math.max(halfH,Math.min(960-halfH,camY));view.x+=(tx-view.x)*Math.min(1,dt*7);view.y+=(ty-view.y)*Math.min(1,dt*7);
 for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=55*dt;}particles=particles.filter(p=>p.life>0);
}
function loop(now){const dt=last?Math.min((now-last)/1000,.04):0;last=now;update(dt);draw();requestAnimationFrame(loop);}
updateUI();resize();requestAnimationFrame(loop);
