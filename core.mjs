export const WORLD={w:1440,h:960};
export const ITEMS=[
 {id:'carrot1',stage:0,x:180,y:580,kind:'carrot'},{id:'carrot2',stage:0,x:475,y:680,kind:'carrot'},{id:'carrot3',stage:0,x:530,y:320,kind:'carrot'},
 {id:'gem1',stage:1,x:195,y:790,kind:'gem'},{id:'gem2',stage:1,x:600,y:760,kind:'gem'},{id:'gem3',stage:1,x:705,y:270,kind:'gem'},
 {id:'fly1',stage:2,x:1020,y:690,kind:'fly'},{id:'fly2',stage:2,x:1280,y:650,kind:'fly'},{id:'fly3',stage:2,x:1300,y:350,kind:'fly'}
];
export const DESTINATIONS=[{x:320,y:365},{x:795,y:465},{x:1155,y:350},{x:1200,y:165}];
export function freshState(){return {version:1,stage:0,collected:[],x:290,y:610,color:'pink',voice:true};}
export function restoreState(raw){const s=freshState();if(!raw||raw.version!==1)return s;const stage=Number.isInteger(raw.stage)&&raw.stage>=0&&raw.stage<=4?raw.stage:0;const valid=ITEMS.filter(i=>i.stage<=stage).map(i=>i.id);return {...s,stage,collected:Array.isArray(raw.collected)?[...new Set(raw.collected.filter(id=>valid.includes(id)))]:[],x:Number.isFinite(raw.x)?Math.max(55,Math.min(1385,raw.x)):s.x,y:Number.isFinite(raw.y)?Math.max(85,Math.min(895,raw.y)):s.y,color:['pink','purple','blue'].includes(raw.color)?raw.color:'pink',voice:raw.voice!==false};}
export function count(s){return ITEMS.filter(i=>i.stage===s.stage&&s.collected.includes(i.id)).length;}
export function target(s){if(s.stage>=4)return null;const remaining=ITEMS.filter(i=>i.stage===s.stage&&!s.collected.includes(i.id));return remaining.sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0]||DESTINATIONS[s.stage];}
export function canStand(x,y,stage){return x>=55&&x<=1385&&y>=85&&y<=895&&(!(x>835&&x<935)||(stage>=2&&y>419&&y<516));}
export function collectNearby(s){const got=[];for(const item of ITEMS){if(item.stage===s.stage&&!s.collected.includes(item.id)&&Math.hypot(s.x-item.x,s.y-item.y)<51){s.collected.push(item.id);got.push(item);}}return got;}
export function interact(s){if(s.stage>=4)return 'explore';const p=DESTINATIONS[s.stage];if(Math.hypot(s.x-p.x,s.y-p.y)>115)return 'hint';if(s.stage<3&&count(s)<3)return 'need-items';s.stage++;return s.stage===4?'win':'complete';}
export function hint(s){if(s.stage===0)return count(s)<3?`Find ${3-count(s)} orange carrot${count(s)===2?'':'s'} for Clover the bunny. Follow the sparkles!`:'Take your carrots to Clover the bunny. Tap Magic!';if(s.stage===1)return count(s)<3?`Find ${3-count(s)} rainbow gem${count(s)===2?'':'s'}. They will mend the bridge!`:'Go to the little sign by the river. Tap Magic to make a rainbow bridge!';if(s.stage===2)return count(s)<3?`Find ${3-count(s)} glowing firefl${count(s)===2?'y':'ies'} across the bridge. They will wake our dragon friend!`:'Bring the fireflies to Doodle the dragon. Tap Magic!';if(s.stage===3)return 'Doodle opened the castle! Find the golden crown and tap Magic.';return 'You made the whole meadow happy! Explore and make some more sparkles.';}
