/* Local demonstration rules shared by the member screen and 3D preview. No payment or mail network. */
(function(root){
 'use strict';
 const HALF_LEVEL=-.4,FOOTPRINT_SIZE={mintTree:2,mintArch:3,backCliff:3};
 const SEED_PRICE=10,UNLIMITED=999,MAX_EXPANSION=15,UNLOCK_SECONDS=[30,120,300,900,1800,3600,7200,14400,28800,86400]; // 시연: 씨앗·아이템·땅 확장 무제한
 const rarities={common:{ko:'일반',en:'Common'},uncommon:{ko:'고급',en:'Uncommon'},rare:{ko:'희귀',en:'Rare'},legendary:{ko:'전설',en:'Legendary'}};
 const crops={pink:{ko:'분홍꽃',en:'Pink flower',price:6,rarity:'common',weight:.65,model:'flower-pink',color:'#bd437d'},yellow:{ko:'노란꽃',en:'Yellow flower',price:8,rarity:'uncommon',weight:.25,model:'flower-yellow',color:'#997400'},lilac:{ko:'보라꽃',en:'Lilac flower',price:25,rarity:'rare',weight:.09,model:'flower-lilac',color:'#825596'},fruit:{ko:'열매',en:'Fruit',price:100,rarity:'legendary',weight:.01,model:'fruit-tree',color:'#d9566f'}};
 function pickCrop(random){const entries=Object.entries(crops),sum=entries.reduce((n,[,v])=>n+v.weight,0);if(!Number.isFinite(random)||random<0||random>=1||entries.some(([,v])=>!Number.isFinite(v.weight)||v.weight<=0)||Math.abs(sum-1)>1e-10)return null;let cumulative=0;for(const [kind,v] of entries){cumulative+=v.weight;if(random<cumulative)return kind;}return null;}
 const decor={food:{ko:'먹이 그릇',en:'Food bowl',price:15,icon:'Utensils',radius:.35},toy:{ko:'공 장난감',en:'Ball toy',price:20,icon:'CircleDot',radius:.32},bench:{ko:'벤치',en:'Bench',price:40,icon:'Armchair',radius:.52},house:{ko:'작은 집',en:'Little house',price:70,icon:'House',radius:.65},mintTree:{ko:'민트 나무',en:'Mint tree',price:60,icon:'TreePalm',radius:.65},pinkShrub:{ko:'분홍 화초',en:'Pink shrub',price:25,icon:'Flower2',radius:.32},flowerSpray:{ko:'별꽃 화초',en:'Starflower cluster',price:0,icon:'Flower2',radius:.32,sandboxOnly:true},pinkFern:{ko:'분홍 고사리',en:'Pink fern',price:0,icon:'Sprout',radius:.32,sandboxOnly:true},stepTerrace:{ko:'겹친 분홍 단차',en:'Layered pink terrace',price:0,icon:'Expand',radius:.34,sandboxOnly:true},mintArch:{ko:'민트 아치',en:'Mint arch',price:0,icon:'Expand',radius:.36,sandboxOnly:true},backCliff:{ko:'배경 절벽',en:'Backdrop cliff',price:0,icon:'Expand',radius:.36,sandboxOnly:true}};
 const animals={dog:{ko:'강아지',en:'Dog',price:0},cat:{ko:'고양이',en:'Cat',price:0},bunny:{ko:'토끼',en:'Bunny',price:0},fox:{ko:'여우',en:'Fox',price:60},panda:{ko:'판다',en:'Panda',price:80},penguin:{ko:'펭귄',en:'Penguin',price:90}};
 const accessories={bow:{ko:'분홍 리본',en:'Pink bow',price:20,icon:'Ribbon'},hat:{ko:'노란 모자',en:'Yellow hat',price:30,icon:'Crown'}};
 const friends={A:{ko:'가상 친구 하나',en:'Demo friend Hana'},B:{ko:'가상 친구 두리',en:'Demo friend Duri'}};
 const copy=s=>JSON.parse(JSON.stringify(s)),integer=(n,max=1000000000)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 const knownItem=item=>typeof item==='string'&&((item.startsWith('crop:')&&Object.hasOwn(crops,item.slice(5)))||(item.startsWith('decor:')&&Object.hasOwn(decor,item.slice(6)))||(item.startsWith('accessory:')&&Object.hasOwn(accessories,item.slice(10))));
 const fresh=(now=Date.now())=>({version:3,terrain:[],rev:0,expandReady:now+UNLOCK_SECONDS[0]*1000,coins:1000000,seeds:UNLIMITED,inventory:{pink:0,yellow:0,lilac:0,fruit:0},plants:[],nextId:1,expansion:0,decorStock:Object.fromEntries(Object.keys(decor).map(k=>[k,UNLIMITED])),decor:[],pets:{dog:{gear:'none'},cat:{gear:'none'},bunny:{gear:'none'},fox:{gear:'none'},panda:{gear:'none'},penguin:{gear:'none'}},accessories:{bow:UNLIMITED,hat:UNLIMITED},giftStock:{},attendance:[],topups:0,mail:{inbox:[{id:'welcome',friend:'A',items:{'crop:pink':1,'crop:fruit':2},claimed:false}],sent:[]},explore:{startedAt:now,claimed:false},visit:{discovered:false,photo:false,greeted:false,souvenir:false},box:{available:false,opened:false,reward:null},discovered:[]});
 const islandCache=[];
 /* 기본 섬에서 시작해 단계마다 사방(대각선 포함) 2칸씩 넓힌다: 모서리가 비지 않는다 */
 function islandCells(level){if(islandCache[level])return islandCache[level];const cells=new Set();if(level===0){for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++)if(a*a/(5.45**2)+b*b/(5.55**2)<1.03)cells.add(a+','+b);}else for(const key of islandCells(level-1)){const [a,b]=key.split(',').map(Number);for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)cells.add((a+dx)+','+(b+dz));}islandCache[level]=cells;return cells;}
 function onIsland(x,z,level=0){const a=Math.round(x/.8),b=Math.round(z/.8);return Number.isFinite(x)&&Number.isFinite(z)&&islandCells(level).has(a+','+b)&&Math.abs(x-a*.8)<=.405&&Math.abs(z-b*.8)<=.405;}
 const amount=(s,item)=>item.startsWith('crop:')?s.inventory[item.slice(5)]:item.startsWith('decor:')?s.decorStock[item.slice(6)]:item.startsWith('accessory:')?s.accessories[item.slice(10)]:0;
 const equipped=(s,key)=>Object.values(s.pets).filter(p=>p.gear===key).length;
 const available=(s,item)=>Math.max(0,(amount(s,item)||0)-(item.startsWith('accessory:')?equipped(s,item.slice(10)):0));
 function stock(s,item,n){if(item.startsWith('crop:'))s.inventory[item.slice(5)]+=n;else if(item.startsWith('decor:'))s.decorStock[item.slice(6)]+=n;else s.accessories[item.slice(10)]+=n;}
 const radius=item=>item.startsWith('decor:')?.36:.35; // 히트박스는 칸 단위(footprint)로 계산한다
 const TERRAIN_STEP=.5,TERRAIN_MAX=20;
 const cell=(x,z)=>({x:Math.round(x/.8),z:Math.round(z/.8)});
 function heightAt(s,x,z){const c=cell(x,z),h=(s.terrain||[]).find(t=>t.x===c.x&&t.z===c.z)?.height||0;if(h)return h;return s.base?.[c.x+','+c.z]?HALF_LEVEL:0;}
 function unlockSeconds(level){return UNLOCK_SECONDS[Math.min(level,UNLOCK_SECONDS.length-1)];}
 /* 남은 시간 1분당 10P, 최소 10P */
 function expandCost(s,now=Date.now()){return Math.max(10,Math.ceil((s.expandReady-now)/6000));}
 function baseOf(s,x,z){const c=cell(x,z);return s.base?.[c.x+','+c.z]||null;}
 function solidBase(s,x,z){const b=baseOf(s,x,z);return !b||b==='half';}
 /* 바깥쪽 두 면이 비어 있는 모서리 칸이면 어느 방향을 깎을지 돌려준다 */
 function cornerOf(s,c){const here=(x,z)=>onIsland(x*.8,z*.8,s.expansion)&&s.base?.[x+','+z]!=='gone',px=here(c.x+1,c.z),nx=here(c.x-1,c.z),pz=here(c.x,c.z+1),nz=here(c.x,c.z-1);if(!px&&!pz&&nx&&nz)return 'c0';if(!px&&!nz&&nx&&pz)return 'c1';if(!nx&&!nz&&px&&pz)return 'c2';if(!nx&&!pz&&px&&nz)return 'c3';return null;}
 /* 여러 칸을 차지하는 물건의 칸 중심들 */
 function footprintSize(item){return (item&&FOOTPRINT_SIZE[item.slice(6)])||1;}
 function footprint(item,rot,x,z){const n=footprintSize(item),out=[];for(let i=0;i<n;i++)for(let j=0;j<n;j++)out.push([x+(i-(n-1)/2)*.8,z+(j-(n-1)/2)*.8]);return out;}
 function flatSurface(s,x,z,r=.32){const h=heightAt(s,x,z);return [[x-r,z-r],[x-r,z+r],[x+r,z-r],[x+r,z+r]].every(([a,b])=>heightAt(s,a,b)===h&&solidBase(s,a,b));}
 function cellOccupied(s,c){const x=c.x*.8,z=c.z*.8,intersects=(px,pz,r)=>Math.hypot(Math.max(0,Math.abs(px-x)-.4),Math.max(0,Math.abs(pz-z)-.4))<r;
  return (Math.abs(c.x+2)<=1&&Math.abs(c.z+2)<=1)||s.plants.some(p=>intersects(p.x,p.z,.34))||s.decor.some(d=>footprint(d.item,d.rotation,d.x,d.z).some(([px,pz])=>intersects(px,pz,radius(d.item))));
 }
 function fits(s,cx,cz,r=.32,exclude=null,item=null,rot=0){const base=heightAt(s,cx,cz);return footprint(item,rot,cx,cz).every(([x,z])=>heightAt(s,x,z)===base&&flatSurface(s,x,z,r)&&onIsland(x,z,s.expansion)&&onIsland(x-r,z-r,s.expansion)&&onIsland(x+r,z+r,s.expansion)&&!(Math.abs(Math.round(x/.8)+2)<=1&&Math.abs(Math.round(z/.8)+2)<=1)&&s.plants.every(p=>p.id===exclude||Math.hypot(p.x-x,p.z-z)>=.32+r)&&s.decor.every(p=>p.id===exclude||footprint(p.item,p.rotation,p.x,p.z).every(([px,pz])=>Math.hypot(px-x,pz-z)>=radius(p.item)+r)));}
 function validate(s){
  if(!s||s.version!==3||!integer(s.rev)||!integer(s.coins)||!integer(s.seeds)||!integer(s.nextId)||s.nextId<1||!integer(s.expansion,MAX_EXPANSION))return false;
  if(!Array.isArray(s.terrain)||s.terrain.length>5000||s.terrain.some(c=>!Number.isSafeInteger(c.x)||!Number.isSafeInteger(c.z)||!integer(c.height,TERRAIN_MAX)||c.height<1||!onIsland(c.x*.8,c.z*.8,s.expansion))||new Set(s.terrain.map(c=>c.x+','+c.z)).size!==s.terrain.length)return false;
  for(const [key,defs] of [['inventory',crops],['decorStock',decor],['accessories',accessories]])if(!s[key]||Object.keys(s[key]).length!==Object.keys(defs).length||!Object.keys(defs).every(k=>integer(s[key][k])))return false;
  if(!Array.isArray(s.plants)||s.plants.length>500||!Array.isArray(s.decor)||s.decor.length>500)return false;
  const ids=[...s.plants,...s.decor].map(p=>p.id);if(new Set(ids).size!==ids.length||!ids.every(id=>integer(id)&&id>0&&id<s.nextId))return false;
  if(!s.plants.every(p=>crops[p.kind]&&(p.variant===undefined||(p.kind==='fruit'&&integer(p.variant,2)))&&onIsland(p.x,p.z,s.expansion)&&Number.isFinite(p.plantedAt)&&p.plantedAt>0&&flatSurface(s,p.x,p.z)))return false;
  if(!s.decor.every(p=>knownItem(p.item)&&!p.item.startsWith('accessory:')&&(p.source==='owned'||p.source==='gift')&&onIsland(p.x,p.z,s.expansion)&&integer(p.rotation,3)&&flatSurface(s,p.x,p.z,radius(p.item))))return false;
  if(!s.pets||!['dog','cat','bunny'].every(k=>s.pets[k])||Object.keys(s.pets).some(k=>!Object.hasOwn(animals,k)||!['none',...Object.keys(accessories)].includes(s.pets[k]?.gear)))return false;
  if(!Object.keys(accessories).every(k=>equipped(s,k)<=s.accessories[k]))return false;
  if(!s.giftStock||Object.entries(s.giftStock).some(([k,v])=>!knownItem(k)||k.startsWith('accessory:')||!integer(v)))return false;
  if(!Array.isArray(s.attendance)||s.attendance.length>20||new Set(s.attendance).size!==s.attendance.length||!s.attendance.every(v=>/^\d{4}-\d{2}-\d{2}$/.test(v))||!integer(s.topups,100))return false;
  if(!s.mail||!Array.isArray(s.mail.inbox)||s.mail.inbox.length!==1||!Array.isArray(s.mail.sent)||s.mail.sent.length>5)return false;
  const welcome=s.mail.inbox[0];if(welcome.id!=='welcome'||welcome.friend!=='A'||typeof welcome.claimed!=='boolean'||JSON.stringify(welcome.items)!==JSON.stringify({'crop:pink':1,'crop:fruit':2}))return false;
  if(!s.mail.sent.every((m,i)=>m.id===i+1&&friends[m.friend]&&knownItem(m.item)&&m.quantity===1&&m.fee===(i===0?0:30)))return false;
  if(!s.explore||!Number.isFinite(s.explore.startedAt)||s.explore.startedAt<=0||typeof s.explore.claimed!=='boolean'||!s.visit||!['discovered','photo','greeted','souvenir'].every(k=>typeof s.visit[k]==='boolean')||!s.box||typeof s.box.available!=='boolean'||typeof s.box.opened!=='boolean'||!Array.isArray(s.discovered)||s.discovered.some(k=>!crops[k])||new Set(s.discovered).size!==s.discovered.length)return false;
  if(s.box.opened&&(!s.box.available||!['bench','house','hat'].includes(s.box.reward)))return false;
  if(!s.box.opened&&s.box.reward!==null)return false;
  return true;
 }
 function valid(s){try{return validate(s);}catch{return false;}}
 function migrate(old,now=Date.now()){if(valid(old))return copy(old);if(old?.version===3&&old.decorStock&&['food','toy','bench','house','mintTree','pinkShrub'].every(k=>Object.hasOwn(old.decorStock,k))){const s=copy(old);for(const k of ['flowerSpray','pinkFern','stepTerrace','mintArch','backCliff'])if(!Object.hasOwn(s.decorStock,k))s.decorStock[k]=0;return valid(s)?s:null;}if(old?.version===2){const s=copy(old);s.version=3;s.terrain=[];if(s.decorStock){for(const k of Object.keys(decor).filter(k=>!['food','toy','bench','house'].includes(k)))if(!Object.hasOwn(s.decorStock,k))s.decorStock[k]=0;}return valid(s)?s:null;}if(!old||old.version!==1||!integer(old.coins)||!integer(old.seeds)||!integer(old.nextId)||!Array.isArray(old.plants))return null;const s=fresh(now);s.coins=old.coins;s.seeds=old.seeds;s.nextId=old.nextId;s.plants=copy(old.plants);for(const k of ['pink','yellow','lilac']){if(!integer(old.inventory?.[k]))return null;s.inventory[k]=old.inventory[k];}return valid(s)?s:null;}
 function apply(current,a,now=Date.now(),random=Math.random()){
  if(a?.type==='plant-tree'&&[0,1,2].includes(a.variant)&&['sapling','mid','full'].includes(a.size)){random=.991+a.variant*.0035;a={...a,type:'plant'};}
  if(!valid(current)||!a||typeof a.type!=='string'||!Number.isFinite(now)||now<=0)return {ok:false,error:'invalid',state:current};
  const s=copy(current),fail=error=>({ok:false,error,state:current});let changed=true;
  const spend=n=>{if(s.coins<n)return false;s.coins-=n;return true;};
  switch(a.type){
   case 'attendance':if(!/^\d{4}-\d{2}-\d{2}$/.test(a.day)||s.attendance.includes(a.day))return fail('already');s.attendance.push(a.day);s.coins+=100;break;
   case 'topup':if(![100,300].includes(a.amount))return fail('invalid');s.coins+=a.amount;s.topups++;break;
   case 'buy-seed':if(!integer(a.quantity,9)||a.quantity<1)return fail('quantity');if(!spend(a.quantity*SEED_PRICE))return fail('funds');s.seeds+=a.quantity;break;
   case 'plant':if(s.seeds<1)return fail('seeds');if(s.plants.length>=500)return fail('limit');if(!fits(s,a.x,a.z))return fail('space');const kind=crops[a.kind]?a.kind:pickCrop(random);if(!kind)return fail('invalid');s.plants.push({id:s.nextId++,x:a.x,z:a.z,kind,plantedAt:now,...(a.size?{size:a.size}:{}),...([1,2,3].includes(a.rotation)?{rotation:a.rotation}:{}),...(kind==='fruit'?{variant:Math.max(0,Math.min(2,Math.floor((random-.99)/.01*3)))}:{})});s.seeds--;break;
   case 'harvest':{const p=s.plants.find(p=>p.id===a.id);if(!p)return fail('missing');if(now-p.plantedAt<15000)return fail('growing');s.inventory[p.kind]++;if(!s.discovered.includes(p.kind))s.discovered.push(p.kind);s.plants=s.plants.filter(p=>p.id!==a.id);break;}
   case 'sell':{if(!Array.isArray(a.kinds)||!a.kinds.length||new Set(a.kinds).size!==a.kinds.length||a.kinds.some(k=>!crops[k]))return fail('invalid');let count=0;for(const k of a.kinds){count+=s.inventory[k];s.coins+=s.inventory[k]*crops[k].price;s.inventory[k]=0;}if(!count)return fail('missing');break;}
   case 'buy-decor':if(!decor[a.kind]||decor[a.kind].sandboxOnly)return fail('invalid');if(!spend(decor[a.kind].price))return fail('funds');s.decorStock[a.kind]++;break;
   case 'buy-pet':if(!animals[a.kind]||!animals[a.kind].price)return fail('invalid');if(s.pets[a.kind])return fail('already');if(!spend(animals[a.kind].price))return fail('funds');s.pets[a.kind]={gear:'none'};break;
   case 'buy-accessory':if(!accessories[a.kind])return fail('invalid');if(!spend(accessories[a.kind].price))return fail('funds');s.accessories[a.kind]++;break;
   case 'equip':if(!s.pets[a.pet]||!['none',...Object.keys(accessories)].includes(a.kind))return fail('invalid');if(s.pets[a.pet].gear===a.kind)return fail('already');if(a.kind!=='none'&&available(s,'accessory:'+a.kind)<1)return fail('missing');s.pets[a.pet].gear=a.kind;break;
   case 'place':{if(s.decor.length>=500)return fail('limit');if(!knownItem(a.item)||a.item.startsWith('accessory:')||!['owned','gift'].includes(a.source)||(!a.item.startsWith('decor:')&&a.source!=='gift'))return fail('invalid');const n=a.source==='gift'?s.giftStock[a.item]||0:available(s,a.item);if(n<1)return fail('missing');if(!fits(s,a.x,a.z,radius(a.item),null,a.item,[1,2,3].includes(a.rotation)?a.rotation:0))return fail('space');if(a.source==='gift')s.giftStock[a.item]--;else stock(s,a.item,-1);s.decor.push({id:s.nextId++,item:a.item,source:a.source,x:a.x,z:a.z,rotation:[1,2,3].includes(a.rotation)?a.rotation:0});break;}
   case 'move-plant':{const p=s.plants.find(p=>p.id===a.id);if(!p)return fail('missing');if(!fits(s,a.x,a.z,.32,p.id))return fail('space');p.x=a.x;p.z=a.z;if([0,1,2,3].includes(a.rotation))p.rotation=a.rotation;break;}
   case 'remove-plant':if(!s.plants.some(p=>p.id===a.id))return fail('missing');s.plants=s.plants.filter(p=>p.id!==a.id);break;
   case 'pet-spot':if(!s.pets[a.pet]||![0,1,2,3].includes(a.rotation))return fail('invalid');if(!fits(s,a.x,a.z,.3))return fail('space');s.petSpots={...(s.petSpots||{}),[a.pet]:{x:a.x,z:a.z,r:a.rotation}};break;
   case 'move':{const d=s.decor.find(d=>d.id===a.id);if(!d)return fail('missing');if(!fits(s,a.x,a.z,radius(d.item),d.id,d.item,[0,1,2,3].includes(a.rotation)?a.rotation:d.rotation))return fail('space');d.x=a.x;d.z=a.z;if([0,1,2,3].includes(a.rotation))d.rotation=a.rotation;break;}
   case 'rotate':{const d=s.decor.find(d=>d.id===a.id);if(!d)return fail('missing');d.rotation=(d.rotation+1)%4;break;}
   case 'store':{const d=s.decor.find(d=>d.id===a.id);if(!d)return fail('missing');if(d.source==='gift')s.giftStock[d.item]=(s.giftStock[d.item]||0)+1;else stock(s,d.item,1);s.decor=s.decor.filter(d=>d.id!==a.id);break;}
   case 'expand':{if(s.expansion>=MAX_EXPANSION)return fail('limit');if(a.auto&&now<s.expandReady)return fail('invalid');if(a.paid&&!spend(expandCost(s,now)))return fail('funds');const from=a.auto?s.expandReady:now;s.expansion++;s.expandReady=from+unlockSeconds(s.expansion)*1000;break;}
   case 'terrain':{if(!Number.isFinite(a.x)||!Number.isFinite(a.z)||![1,-1].includes(a.delta))return fail('invalid');const c=cell(a.x,a.z),key=c.x+','+c.z;if(!onIsland(c.x*.8,c.z*.8,s.expansion))return fail('space');if(cellOccupied(s,c))return fail('occupied');s.base=s.base||{};const b=s.base[key],col=s.terrain.find(t=>t.x===c.x&&t.z===c.z),h=col?col.height:0;if(a.delta>0){if(b==='half')delete s.base[key];else if(b)s.base[key]='half';else if(h>=TERRAIN_MAX)return fail('height');else if(col)col.height++;else s.terrain.push({...c,height:1});}else if(h>0){if(h===1)s.terrain=s.terrain.filter(t=>t!==col);else col.height--;}else if(!b)s.base[key]='half';else if(b==='half')s.base[key]=cornerOf(s,c)||'gone';else if(b==='gone')return fail('height');else s.base[key]='gone';break;}
   case 'tick':changed=false;break;
   case 'photo':if(!s.visit.discovered)return fail('missing');if(s.visit.photo)return fail('already');s.visit.photo=true;break;
   case 'greet':if(!s.visit.discovered)return fail('missing');if(s.visit.greeted)return fail('already');s.visit.greeted=true;break;
   case 'box':if(!s.box.available)return fail('missing');if(s.box.opened)return fail('already');if(!Number.isFinite(random)||random<0||random>=1)return fail('invalid');s.box.opened=true;s.box.reward=['bench','house','hat'][Math.floor(random*3)];s.seeds+=1;if(s.box.reward==='hat')s.accessories.hat++;else s.decorStock[s.box.reward]++;break;
   case 'explore':if(s.explore.claimed)return fail('already');if(now-s.explore.startedAt<20000)return fail('exploring');s.explore.claimed=true;s.coins+=20;break;
   case 'claim-mail':{const m=s.mail.inbox.find(m=>m.id===a.id);if(!m)return fail('missing');if(m.claimed)return fail('already');m.claimed=true;for(const [item,n] of Object.entries(m.items))s.giftStock[item]=(s.giftStock[item]||0)+n;break;}
   case 'send-mail':{if(!friends[a.friend]||!knownItem(a.item)||a.quantity!==1)return fail('invalid');if(s.mail.sent.length>=5)return fail('limit');if(available(s,a.item)<a.quantity)return fail('missing');const fee=s.mail.sent.length===0?0:30;if(!spend(fee))return fail('funds');stock(s,a.item,-a.quantity);s.mail.sent.push({id:s.mail.sent.length+1,friend:a.friend,item:a.item,quantity:a.quantity,fee});break;}
   default:return fail('invalid');
  }
  if(!s.visit.discovered&&['food','toy'].every(kind=>s.decor.some(d=>d.item==='decor:'+kind))){s.visit.discovered=true;s.box.available=true;changed=true;}
  if(s.visit.photo&&s.visit.greeted&&!s.visit.souvenir){s.visit.souvenir=true;changed=true;}
  if(!changed)return {ok:true,state:current,changed:false};s.seeds=UNLIMITED;for(const k of Object.keys(decor))s.decorStock[k]=UNLIMITED;for(const k of Object.keys(accessories))s.accessories[k]=UNLIMITED;s.rev++;
  if(!valid(s))return fail('invalid');return {ok:true,state:s,changed:true};
 }
 const api={MAX_EXPANSION,unlockSeconds,expandCost,baseOf,solidBase,footprint,footprintSize,TERRAIN_STEP,TERRAIN_MAX,heightAt,flatSurface,cellOccupied,SEED_PRICE,rarities,pickCrop,fresh,valid,migrate,apply,onIsland,fits,available,knownItem,crops,decor,animals,accessories,friends,copy,radius};root.LandRules=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
