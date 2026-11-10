/* Local demonstration rules shared by the member screen and 3D preview. No payment or mail network. */
(function(root){
 'use strict';
 const HALF_LEVEL=-.4,FOOTPRINT_SIZE={mintTree:2,mintArch:3,backCliff:3};
 const SEED_PRICE=10,UNLIMITED=999,MAX_EXPANSION=15,UNLOCK_SECONDS=[30,120,300,900,1800,3600,7200,14400,28800,86400]; // 시연: 씨앗·아이템·땅 확장 무제한
 const rarities={common:{get ko(){return tr('land.land.rules.0160');},get en(){return tr('land.land.rules.0160');}},uncommon:{get ko(){return tr('land.land.rules.0161');},get en(){return tr('land.land.rules.0161');}},rare:{get ko(){return tr('land.land.rules.0162');},get en(){return tr('land.land.rules.0162');}},legendary:{get ko(){return tr('land.land.rules.0163');},get en(){return tr('land.land.rules.0163');}}};
 const crops={pink:{get ko(){return tr('land.land.rules.0164');},get en(){return tr('land.land.rules.0164');},price:6,rarity:'common',weight:.65,model:'flower-pink',color:'#bd437d'},yellow:{get ko(){return tr('land.land.rules.0165');},get en(){return tr('land.land.rules.0165');},price:8,rarity:'uncommon',weight:.25,model:'flower-yellow',color:'#997400'},lilac:{get ko(){return tr('land.land.rules.0166');},get en(){return tr('land.land.rules.0166');},price:25,rarity:'rare',weight:.09,model:'flower-lilac',color:'#825596'},fruit:{get ko(){return tr('land.land.rules.0167');},get en(){return tr('land.land.rules.0167');},price:100,rarity:'legendary',weight:.01,model:'fruit-tree',color:'#d9566f'}};
 function pickCrop(random){const entries=Object.entries(crops),sum=entries.reduce((n,[,v])=>n+v.weight,0);if(!Number.isFinite(random)||random<0||random>=1||entries.some(([,v])=>!Number.isFinite(v.weight)||v.weight<=0)||Math.abs(sum-1)>1e-10)return null;let cumulative=0;for(const [kind,v] of entries){cumulative+=v.weight;if(random<cumulative)return kind;}return null;}
 const decor={food:{get ko(){return tr('land.land.rules.0168');},get en(){return tr('land.land.rules.0168');},price:15,icon:'Utensils',radius:.35},toy:{get ko(){return tr('land.land.rules.0169');},get en(){return tr('land.land.rules.0169');},price:20,icon:'CircleDot',radius:.32},bench:{get ko(){return tr('land.land.rules.0170');},get en(){return tr('land.land.rules.0170');},price:40,icon:'Armchair',radius:.52},house:{get ko(){return tr('land.land.rules.0171');},get en(){return tr('land.land.rules.0171');},price:70,icon:'House',radius:.65},mintTree:{get ko(){return tr('land.land.rules.0172');},get en(){return tr('land.land.rules.0172');},price:60,icon:'TreePalm',radius:.65},pinkShrub:{get ko(){return tr('land.land.rules.0173');},get en(){return tr('land.land.rules.0173');},price:25,icon:'Flower2',radius:.32},flowerSpray:{get ko(){return tr('land.land.rules.0174');},get en(){return tr('land.land.rules.0174');},price:0,icon:'Flower2',radius:.32,sandboxOnly:true},pinkFern:{get ko(){return tr('land.land.rules.0175');},get en(){return tr('land.land.rules.0175');},price:0,icon:'Sprout',radius:.32,sandboxOnly:true},stepTerrace:{get ko(){return tr('land.land.rules.0176');},get en(){return tr('land.land.rules.0176');},price:0,icon:'Expand',radius:.34,sandboxOnly:true},mintArch:{get ko(){return tr('land.land.rules.0177');},get en(){return tr('land.land.rules.0177');},price:0,icon:'Expand',radius:.36,sandboxOnly:true},backCliff:{get ko(){return tr('land.land.rules.0178');},get en(){return tr('land.land.rules.0178');},price:0,icon:'Expand',radius:.36,sandboxOnly:true},lantern:{get ko(){return tr('land.land.rules.0179');},get en(){return tr('land.land.rules.0179');},price:0,icon:'House',radius:.36,sandboxOnly:true},well:{get ko(){return tr('land.land.rules.0180');},get en(){return tr('land.land.rules.0180');},price:0,icon:'House',radius:.36,sandboxOnly:true},fountain:{get ko(){return tr('land.land.rules.0181');},get en(){return tr('land.land.rules.0181');},price:0,icon:'House',radius:.36,sandboxOnly:true},windmill:{get ko(){return tr('land.land.rules.0182');},get en(){return tr('land.land.rules.0182');},price:0,icon:'House',radius:.36,sandboxOnly:true},lighthouse:{get ko(){return tr('land.land.rules.0183');},get en(){return tr('land.land.rules.0183');},price:0,icon:'House',radius:.36,sandboxOnly:true}};
 const animals={dog:{get ko(){return tr('land.land.rules.0184');},get en(){return tr('land.land.rules.0184');},price:0},cat:{get ko(){return tr('land.land.rules.0185');},get en(){return tr('land.land.rules.0185');},price:0},bunny:{get ko(){return tr('land.land.rules.0186');},get en(){return tr('land.land.rules.0186');},price:0},fox:{get ko(){return tr('land.land.rules.0187');},get en(){return tr('land.land.rules.0187');},price:60},panda:{get ko(){return tr('land.land.rules.0188');},get en(){return tr('land.land.rules.0188');},price:80},penguin:{get ko(){return tr('land.land.rules.0189');},get en(){return tr('land.land.rules.0189');},price:90}};
 const accessories={bow:{get ko(){return tr('land.land.rules.0190');},get en(){return tr('land.land.rules.0190');},price:20,icon:'Ribbon'},hat:{get ko(){return tr('land.land.rules.0191');},get en(){return tr('land.land.rules.0191');},price:30,icon:'Crown'}};
 const friends={A:{get ko(){return tr('land.land.rules.0192');},get en(){return tr('land.land.rules.0192');}},B:{get ko(){return tr('land.land.rules.0193');},get en(){return tr('land.land.rules.0193');}}};
 /* 보유함·뽑기·구역 보상. 시연용이라 결제 없이 게임 포인트만 쓴다 */
 const GACHA={price:1000,tenPrice:10000,rates:{common:.6,uncommon:.28,rare:.1,legendary:.02},pools:{building:{food:'common',toy:'common',lantern:'common',bench:'uncommon',well:'uncommon',house:'rare',fountain:'rare',windmill:'legendary',lighthouse:'legendary'},pet:{dog:'common',cat:'common',bunny:'uncommon',fox:'rare',panda:'rare',penguin:'legendary'}}};
 const SEED_PRICES={pink:10,yellow:20,lilac:60,fruit:200},SELL_PRICES={common:50,uncommon:100,rare:300,legendary:20000},STARTER_PETS=['dog','cat','bunny'],START_SEEDS={pink:5,yellow:3,lilac:1,fruit:0};
 function bagOf(s){const b=s.bag||{};return {seed:{...(b.seed||START_SEEDS)},building:{...(b.building||{})},pet:b.pet?{...b.pet}:Object.fromEntries(Object.keys(s.pets).map(k=>[k,1]))};}
 function rarityOf(group,kind){return group==='seed'?crops[kind]?.rarity:GACHA.pools[group]?.[kind];}
 function sellPrice(group,kind){return group==='seed'?Math.floor(SEED_PRICES[kind]/2):SELL_PRICES[rarityOf(group,kind)];}
 const canPart=(s,group,kind)=>{const n=bagOf(s)[group]?.[kind]||0;return n>0&&!(group==='pet'&&STARTER_PETS.includes(kind)&&n<=1);};
 function roller(seed){let x=seed>>>0;const next=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};for(let i=0;i<4;i++)next();return next;}
 function rollRarity(value,guaranteed){const entries=Object.entries(GACHA.rates).filter(([k])=>!guaranteed||k==='rare'||k==='legendary'),sum=entries.reduce((n,[,w])=>n+w,0);let hit=value*sum;for(const [k,w] of entries){hit-=w;if(hit<0)return k;}return entries[0][0];}
 function rollFrom(group,next,guaranteed){const rarity=rollRarity(next(),guaranteed),kinds=Object.keys(GACHA.pools[group]).filter(k=>GACHA.pools[group][k]===rarity);return {kind:kinds[Math.floor(next()*kinds.length)],rarity};}
 /* 잠긴 고리 위에 놓일 물건. 같은 섬이면 몇 번을 다시 열어도 같은 자리에 같은 물건이 있다 */
 function zoneRewards(s,level=s.expansion){if(level>=MAX_EXPANSION)return [];const next=roller(Math.imul((s.zoneSeed||7)+level*97,2654435761)),span=7+level*2,cells=[];for(let x=-span;x<=span;x++)for(let z=-span;z<=span;z++)if(onIsland(x*.8,z*.8,level+1)&&!onIsland(x*.8,z*.8,level))cells.push([x,z]);for(let i=cells.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}const picked=[],goal=Math.min(3+level,8);for(const [x,z] of cells){if(picked.length>=goal)break;if(picked.some(p=>Math.max(Math.abs(p.x-x),Math.abs(p.z-z))<3))continue;const plant=next()<.5,kind=plant?pickCrop(next()):rollFrom('building',next).kind;picked.push({x,z,item:(plant?'crop:':'decor:')+kind,rotation:Math.floor(next()*4)});}return picked;}
 const copy=s=>JSON.parse(JSON.stringify(s)),integer=(n,max=1000000000)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 const knownItem=item=>typeof item==='string'&&((item.startsWith('crop:')&&Object.hasOwn(crops,item.slice(5)))||(item.startsWith('decor:')&&Object.hasOwn(decor,item.slice(6)))||(item.startsWith('accessory:')&&Object.hasOwn(accessories,item.slice(10))));
 const fresh=(now=Date.now())=>({version:3,zoneSeed:now%1000000007,terrain:[],rev:0,expandReady:now+UNLOCK_SECONDS[0]*1000,coins:1000000,seeds:UNLIMITED,inventory:{pink:0,yellow:0,lilac:0,fruit:0},plants:[],nextId:1,expansion:0,decorStock:Object.fromEntries(Object.keys(decor).map(k=>[k,UNLIMITED])),decor:[],pets:{dog:{gear:'none'},cat:{gear:'none'},bunny:{gear:'none'}},accessories:{bow:UNLIMITED,hat:UNLIMITED},giftStock:{},attendance:[],topups:0,mail:{inbox:[{id:'welcome',friend:'A',items:{'crop:pink':1,'crop:fruit':2},claimed:false}],sent:[]},explore:{startedAt:now,claimed:false},visit:{discovered:false,photo:false,greeted:false,souvenir:false},box:{available:false,opened:false,reward:null},discovered:[]});
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
 function heightAt(s,x,z){const c=cell(x,z),h=(s.terrain||[]).find(t=>t.x===c.x&&t.z===c.z)?.height||0;if(h)return h;const b=s.base?.[c.x+','+c.z];return b&&b[0]!=='d'?HALF_LEVEL:0;}
 function unlockSeconds(level){return UNLOCK_SECONDS[Math.min(level,UNLOCK_SECONDS.length-1)];}
 /* 남은 시간 1분당 10P, 최소 10P */
 function expandCost(s,now=Date.now()){return Math.max(10,Math.ceil((s.expandReady-now)/6000));}
 function baseOf(s,x,z){const c=cell(x,z);return s.base?.[c.x+','+c.z]||null;}
 /* 한 층의 대각선 방향. 예전 저장값(cut/cutFrom)도 읽는다 */
const layerCut=(c,n)=>c.cuts?.[n]||(c.cut&&n>=(c.cutFrom||0)?c.cut:null);
function normCuts(c){if(c.cut){const from=c.cutFrom||0;c.cuts=c.cuts||{};for(let n=from;n<c.height;n++)c.cuts[n]=c.cut;delete c.cut;delete c.cutFrom;}if(c.holes){c.holes=c.holes.filter(v=>v<c.height-1);if(!c.holes.length)delete c.holes;}if(c.cuts){for(const n of Object.keys(c.cuts))if(+n>=c.height||c.holes?.includes(+n))delete c.cuts[n];if(!Object.keys(c.cuts).length)delete c.cuts;}}
function solidBase(s,x,z){const c=cell(x,z),col=(s.terrain||[]).find(t=>t.x===c.x&&t.z===c.z);if(col&&layerCut(col,col.height-1))return false;const b=baseOf(s,x,z);return !b||b==='half';}
/* 쌓은 땅의 모서리: 두 바깥 면의 이웃이 더 낮으면 깎을 방향을 돌려준다 */
const CORNER_DIRS={c0:[1,1],c1:[1,-1],c2:[-1,-1],c3:[-1,1]};
function cutFloor(s,c,name){const level=(x,z)=>s.terrain.find(t=>t.x===x&&t.z===z)?.height||0,[dx,dz]=CORNER_DIRS[name];return Math.max(level(c.x+dx,c.z),level(c.x,c.z+dz));}
/* n층(0부터)에서 이웃이 그 층까지 차 있지 않으면 낮은 면 */
function layerCorner(s,c,n){const level=(x,z)=>s.terrain.find(t=>t.x===x&&t.z===z)?.height||0;return pickCorner(c.x,c.z,(x,z)=>level(x,z)<=n);}
function columnCorner(s,c,h){const level=(x,z)=>{const t=s.terrain.find(t=>t.x===x&&t.z===z);return t?t.height:0;};return pickCorner(c.x,c.z,(x,z)=>level(x,z)<h);}
 /* 바깥쪽 두 면이 비어 있는 모서리 칸이면 어느 방향을 깎을지 돌려준다 */
 /* 깎을 모서리 고르기: 맞닿은 두 면이 모두 낮은 꼭짓점이 후보.
   후보가 여럿이면(L자 끝처럼 세 면이 낮은 칸) 깎은 선이 이웃 높은 칸과 45도로 이어지는 쪽을 고른다. 정할 수 없으면 깎지 않는다 */
function pickCorner(x,z,low){const opts=[[1,1,'c0'],[1,-1,'c1'],[-1,-1,'c2'],[-1,1,'c3']].filter(([dx,dz])=>low(x+dx,z)&&low(x,z+dz));if(opts.length<=1)return opts[0]?.[2]||null;let best=null,top=0,tie=false;for(const [dx,dz,name] of opts){const score=(low(x-dx,z+dz)?0:1)+(low(x+dx,z-dz)?0:1);if(score>top){top=score;best=name;tie=false;}else if(score===top)tie=true;}return tie||!top?null:best;}
function cornerOf(s,c){const here=(x,z)=>onIsland(x*.8,z*.8,s.expansion)&&s.base?.[x+','+z]!=='gone';return pickCorner(c.x,c.z,(x,z)=>!here(x,z));}
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
  if(!Array.isArray(s.terrain)||s.terrain.length>5000||s.terrain.some(c=>!Number.isSafeInteger(c.x)||!Number.isSafeInteger(c.z)||!integer(c.height,TERRAIN_MAX)||c.height<1||(c.cut!==undefined&&!['c0','c1','c2','c3'].includes(c.cut))||(c.cutFrom!==undefined&&(!c.cut||!integer(c.cutFrom)||c.cutFrom<1||c.cutFrom>=c.height))||(c.cuts!==undefined&&(typeof c.cuts!=='object'||!Object.keys(c.cuts).length||Object.entries(c.cuts).some(([n,v])=>!/^\d+$/.test(n)||+n>=c.height||c.holes?.includes(+n)||!['c0','c1','c2','c3'].includes(v))))||(c.holes!==undefined&&(!Array.isArray(c.holes)||!c.holes.length||c.holes.some((v,k)=>!integer(v)||v>=c.height-1||(k&&v<=c.holes[k-1]))))||!onIsland(c.x*.8,c.z*.8,s.expansion))||new Set(s.terrain.map(c=>c.x+','+c.z)).size!==s.terrain.length)return false;
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
 function migrate(old,now=Date.now()){if(valid(old))return copy(old);if(old?.version===3&&old.decorStock&&['food','toy','bench','house','mintTree','pinkShrub'].every(k=>Object.hasOwn(old.decorStock,k))){const s=copy(old);for(const k of Object.keys(decor))if(!Object.hasOwn(s.decorStock,k))s.decorStock[k]=0;return valid(s)?s:null;}if(old?.version===2){const s=copy(old);s.version=3;s.terrain=[];if(s.decorStock){for(const k of Object.keys(decor).filter(k=>!['food','toy','bench','house'].includes(k)))if(!Object.hasOwn(s.decorStock,k))s.decorStock[k]=0;}return valid(s)?s:null;}if(!old||old.version!==1||!integer(old.coins)||!integer(old.seeds)||!integer(old.nextId)||!Array.isArray(old.plants))return null;const s=fresh(now);s.coins=old.coins;s.seeds=old.seeds;s.nextId=old.nextId;s.plants=copy(old.plants);for(const k of ['pink','yellow','lilac']){if(!integer(old.inventory?.[k]))return null;s.inventory[k]=old.inventory[k];}return valid(s)?s:null;}
 function apply(current,a,now=Date.now(),random=Math.random()){
  if(a?.type==='plant-tree'&&[0,1,2].includes(a.variant)&&['sapling','mid','full'].includes(a.size)){random=.991+a.variant*.0035;a={...a,type:'plant'};}
  if(!valid(current)||!a||typeof a.type!=='string'||!Number.isFinite(now)||now<=0)return {ok:false,error:'invalid',state:current};
  const s=copy(current),fail=error=>({ok:false,error,state:current});let changed=true;s.bag=bagOf(s);
  const spend=n=>{if(s.coins<n)return false;s.coins-=n;return true;};
  switch(a.type){
   case 'attendance':if(!/^\d{4}-\d{2}-\d{2}$/.test(a.day)||s.attendance.includes(a.day))return fail('already');s.attendance.push(a.day);s.coins+=100;break;
   case 'topup':if(![100,300].includes(a.amount))return fail('invalid');s.coins+=a.amount;s.topups++;break;
   case 'buy-seed':if(!integer(a.quantity,9)||a.quantity<1)return fail('quantity');if(!spend(a.quantity*SEED_PRICE))return fail('funds');s.seeds+=a.quantity;break;
   case 'plant':if(s.seeds<1)return fail('seeds');if(s.plants.length>=500)return fail('limit');if(!fits(s,a.x,a.z))return fail('space');if(crops[a.kind]&&!a.size){if(!(s.bag.seed[a.kind]>0))return fail('seeds');s.bag.seed[a.kind]--;}const kind=crops[a.kind]?a.kind:pickCrop(random);if(!kind)return fail('invalid');s.plants.push({id:s.nextId++,x:a.x,z:a.z,kind,plantedAt:now,...(a.size?{size:a.size}:{}),...([1,2,3].includes(a.rotation)?{rotation:a.rotation}:{}),...(kind==='fruit'?{variant:Math.max(0,Math.min(2,Math.floor((random-.99)/.01*3)))}:{})});s.seeds--;break;
   case 'harvest':{const p=s.plants.find(p=>p.id===a.id);if(!p)return fail('missing');if(now-p.plantedAt<15000)return fail('growing');s.inventory[p.kind]++;if(!s.discovered.includes(p.kind))s.discovered.push(p.kind);s.plants=s.plants.filter(p=>p.id!==a.id);break;}
   case 'sell':{if(!Array.isArray(a.kinds)||!a.kinds.length||new Set(a.kinds).size!==a.kinds.length||a.kinds.some(k=>!crops[k]))return fail('invalid');let count=0;for(const k of a.kinds){count+=s.inventory[k];s.coins+=s.inventory[k]*crops[k].price;s.inventory[k]=0;}if(!count)return fail('missing');break;}
   case 'buy-decor':if(!decor[a.kind]||decor[a.kind].sandboxOnly)return fail('invalid');if(!spend(decor[a.kind].price))return fail('funds');s.decorStock[a.kind]++;break;
   case 'buy-pet':if(!animals[a.kind]||!animals[a.kind].price)return fail('invalid');if(s.pets[a.kind])return fail('already');if(!spend(animals[a.kind].price))return fail('funds');s.pets[a.kind]={gear:'none'};break;
   case 'buy-accessory':if(!accessories[a.kind])return fail('invalid');if(!spend(accessories[a.kind].price))return fail('funds');s.accessories[a.kind]++;break;
   case 'equip':if(!s.pets[a.pet]||!['none',...Object.keys(accessories)].includes(a.kind))return fail('invalid');if(s.pets[a.pet].gear===a.kind)return fail('already');if(a.kind!=='none'&&available(s,'accessory:'+a.kind)<1)return fail('missing');s.pets[a.pet].gear=a.kind;break;
   case 'place':{if(s.decor.length>=500)return fail('limit');if(!knownItem(a.item)||a.item.startsWith('accessory:')||!['owned','gift'].includes(a.source)||(!a.item.startsWith('decor:')&&a.source!=='gift'))return fail('invalid');const n=a.source==='gift'?s.giftStock[a.item]||0:available(s,a.item);if(n<1)return fail('missing');if(!fits(s,a.x,a.z,radius(a.item),null,a.item,[1,2,3].includes(a.rotation)?a.rotation:0))return fail('space');if(a.bag){const k=a.item.slice(6);if(!(s.bag.building[k]>0))return fail('missing');s.bag.building[k]--;}if(a.source==='gift')s.giftStock[a.item]--;else stock(s,a.item,-1);s.decor.push({id:s.nextId++,...(a.bag?{bag:true}:{}),item:a.item,source:a.source,x:a.x,z:a.z,rotation:[1,2,3].includes(a.rotation)?a.rotation:0});break;}
   case 'move-plant':{const p=s.plants.find(p=>p.id===a.id);if(!p)return fail('missing');if(!fits(s,a.x,a.z,.32,p.id))return fail('space');p.x=a.x;p.z=a.z;if([0,1,2,3].includes(a.rotation))p.rotation=a.rotation;break;}
   case 'remove-plant':if(!s.plants.some(p=>p.id===a.id))return fail('missing');s.plants=s.plants.filter(p=>p.id!==a.id);break;
   case 'pet-spot':if(!s.pets[a.pet]||![0,1,2,3].includes(a.rotation))return fail('invalid');if(!fits(s,a.x,a.z,.3))return fail('space');s.petSpots={...(s.petSpots||{}),[a.pet]:{x:a.x,z:a.z,r:a.rotation}};break;
   case 'move':{const d=s.decor.find(d=>d.id===a.id);if(!d)return fail('missing');if(!fits(s,a.x,a.z,radius(d.item),d.id,d.item,[0,1,2,3].includes(a.rotation)?a.rotation:d.rotation))return fail('space');d.x=a.x;d.z=a.z;if([0,1,2,3].includes(a.rotation))d.rotation=a.rotation;break;}
   case 'rotate':{const d=s.decor.find(d=>d.id===a.id);if(!d)return fail('missing');d.rotation=(d.rotation+1)%4;break;}
   case 'store':{const d=s.decor.find(d=>d.id===a.id);if(!d)return fail('missing');if(d.bag){const k=d.item.slice(6);s.bag.building[k]=(s.bag.building[k]||0)+1;}if(d.source==='gift')s.giftStock[d.item]=(s.giftStock[d.item]||0)+1;else stock(s,d.item,1);s.decor=s.decor.filter(d=>d.id!==a.id);break;}
   case 'expand':{if(s.expansion>=MAX_EXPANSION)return fail('limit');if(a.auto&&now<s.expandReady)return fail('invalid');if(a.paid&&!spend(expandCost(s,now)))return fail('funds');const from=a.auto?s.expandReady:now,gained=zoneRewards(s,s.expansion);s.lastZone=gained.map(r=>r.item);s.expansion++;for(const r of gained){const [group,kind]=r.item.split(':'),x=r.x*.8,z=r.z*.8;/* 보상은 있던 자리에 남는다. 식물은 다 자란 상태, 건물은 보관하면 보유함으로 */if(group==='crop'){if(s.plants.length<500)s.plants.push({id:s.nextId++,x,z,kind,plantedAt:Math.max(1,now-15000),...(r.rotation?{rotation:r.rotation}:{}),...(kind==='fruit'?{variant:r.rotation%3}:{})});}else if(s.decor.length<500)s.decor.push({id:s.nextId++,bag:true,item:r.item,source:'owned',x,z,rotation:r.rotation});}s.expandReady=from+unlockSeconds(s.expansion)*1000;break;}
   case 'terrain':{if(!Number.isFinite(a.x)||!Number.isFinite(a.z)||![1,-1].includes(a.delta)||(a.level!==undefined&&!integer(a.level,TERRAIN_MAX)))return fail('invalid');const c=cell(a.x,a.z),key=c.x+','+c.z;if(!onIsland(c.x*.8,c.z*.8,s.expansion))return fail('space');
   s.base=s.base||{};const b=s.base[key],col=s.terrain.find(t=>t.x===c.x&&t.z===c.z);if(col)normCuts(col);const h=col?col.height:0;
   /* level: 고른 블록의 층(1=바닥 위 첫 블록, 0=바닥). 없으면 맨 위. single: 블록을 골라 -/+ 를 누른 경우 */
   const L=a.level===undefined?h:Math.min(a.level,h),k=L-1,inside=h>0&&L<h,single=!!a.single;
   if(!inside&&cellOccupied(s,c))return fail('occupied');
   const lowerBase=()=>{if(!b){const corner=h?null:cornerOf(s,c);s.base[key]=corner?'d'+corner[1]:'half';}else if(b[0]==='d')s.base[key]='c'+b[1];else if(b==='half')s.base[key]=(h?null:cornerOf(s,c))||'gone';else if(b==='gone')return false;else s.base[key]='gone';return true;};
   const raiseBase=()=>{if(b==='half'||(b&&b[0]==='d'))delete s.base[key];else if(b&&b[0]==='c')s.base[key]='d'+b[1];else s.base[key]='half';};
   const removeLayer=n=>{if(n===col.height-1){col.height--;while(col.height>0&&col.holes?.includes(col.height-1))col.height--;}else col.holes=[...(col.holes||[]),n].sort((p,q)=>p-q);normCuts(col);if(!col.height)s.terrain=s.terrain.filter(t=>t!==col);};
   const setCut=(n,corner)=>{col.cuts={...(col.cuts||{}),[n]:corner};};
   if(a.delta>0){
    /* 쌓기: 고른 블록이 대각선이면 그 블록만 네모로, 빈 층이면 채운다. 네모 블록을 고른 + 는 할 일이 없다 */
    if(h>0&&L>0&&col.holes?.includes(k)){col.holes=col.holes.filter(v=>v!==k);normCuts(col);}
    else if(h>0&&L>0&&col.cuts?.[k]){delete col.cuts[k];normCuts(col);}
    else if(L===0&&b)raiseBase();
    else if(single)return fail('full');
    else if(h>=TERRAIN_MAX)return fail('height');else if(col)col.height++;else s.terrain.push({...c,height:1});}
   else if(h>0&&L>0){
    if(col.holes?.includes(k))return fail('height');
    if(col.cuts?.[k])removeLayer(k);
    /* 땅 낮추기로 모서리 기둥의 맨 위를 누르면 낮은 이웃 높이 위의 모든 층을 한 번에 깎는다 */
    else if(!single&&L===h&&columnCorner(s,c,h)){const corner=columnCorner(s,c,h);for(let n=cutFloor(s,c,corner);n<h;n++)if(!col.holes?.includes(n)&&!col.cuts?.[n])setCut(n,corner);}
    /* 그 밖에는 고른 블록만: 그 층에서 모서리면 대각선, 아니면 빼서 구멍(맨 위면 한 층 낮아짐) */
    else{const corner=layerCorner(s,c,k);if(corner)setCut(k,corner);else removeLayer(k);}}
   else if(!lowerBase())return fail('height');break;}
   case 'buy-seed-kind':if(!SEED_PRICES[a.kind])return fail('invalid');if(!spend(SEED_PRICES[a.kind]))return fail('funds');s.bag.seed[a.kind]++;break;
   case 'gacha':{const pool=GACHA.pools[a.pool];if(!pool||![1,11].includes(a.count)||!Number.isFinite(random)||random<0||random>=1)return fail('invalid');if(!spend(a.count===1?GACHA.price:GACHA.tenPrice))return fail('funds');const next=roller(Math.floor(random*4294967296)),items=[];for(let i=0;i<a.count;i++){const guaranteed=a.count===11&&i===10,got=rollFrom(a.pool,next,guaranteed);s.bag[a.pool][got.kind]=(s.bag[a.pool][got.kind]||0)+1;items.push({...got,...(guaranteed?{guaranteed:true}:{})});}s.lastPull={pool:a.pool,items};break;}
   case 'deploy-pet':if(!(s.bag.pet[a.pet]>0))return fail('missing');if(s.pets[a.pet])return fail('already');s.pets[a.pet]={gear:'none'};break;
   case 'sell-item':case 'gift-item':{if(!['seed','building','pet'].includes(a.group)||!rarityOf(a.group,a.kind))return fail('invalid');if(a.type==='gift-item'&&!friends[a.friend])return fail('invalid');if(!(s.bag[a.group][a.kind]>0))return fail('missing');if(!canPart(s,a.group,a.kind))return fail('starter');s.bag[a.group][a.kind]--;if(a.type==='sell-item')s.coins+=sellPrice(a.group,a.kind);if(a.group==='pet'&&!s.bag.pet[a.kind]&&s.pets[a.kind]){delete s.pets[a.kind];if(s.petSpots)delete s.petSpots[a.kind];}break;}
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
 const api={layerCut,GACHA,SEED_PRICES,bagOf,rarityOf,sellPrice,canPart,zoneRewards,MAX_EXPANSION,unlockSeconds,expandCost,baseOf,solidBase,footprint,footprintSize,TERRAIN_STEP,TERRAIN_MAX,heightAt,flatSurface,cellOccupied,SEED_PRICE,rarities,pickCrop,fresh,valid,migrate,apply,onIsland,fits,available,knownItem,crops,decor,animals,accessories,friends,copy,radius};root.LandRules=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
