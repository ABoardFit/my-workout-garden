/* Separate creative-mode snapshots. No transfers or rewards into normal play. */
(function(root){
 const R=root.LandRules||(typeof require==='function'?require('./land-rules.js'):null);
 function replenish(s){s.coins=0;s.seeds=99;for(const k of Object.keys(R.decor))s.decorStock[k]=99;for(const k of Object.keys(R.accessories))s.accessories[k]=99;return s;}
 const fresh=(now=Date.now())=>replenish(R.fresh(now));
 function apply(current,a,now=Date.now(),random=Math.random()){
  const allowed=['terrain','plant','plant-tree','harvest','place','move','rotate','store','expand','buy-pet','equip'];
  if(!R.valid(current)||!allowed.includes(a?.type))return {ok:false,error:'invalid',state:current};
  if(a.type==='plant-tree'){if(![0,1,2].includes(a.variant))return {ok:false,error:'invalid',state:current};random=.991+a.variant*.0035;a={...a,type:'plant'};}
  const base=R.copy(current);base.coins=100000;base.seeds=99;for(const k of Object.keys(R.decor))base.decorStock[k]=99;for(const k of Object.keys(R.accessories))base.accessories[k]=99;
  const result=R.apply(base,a,now,random);if(!result.ok)return {...result,state:current};
  if(a.type==='plant')result.state.plants.at(-1).plantedAt=Math.max(1,now-16000);
  replenish(result.state);return R.valid(result.state)?result:{ok:false,error:'invalid',state:current};
 }
 function reference(now=Date.now()){
  let s=fresh(now);s.expansion=1;
  for(let x=2;x<=5;x++)for(let z=-4;z<=0;z++)if(R.onIsland(x*.8,z*.8,s.expansion)&&!R.cellOccupied(s,{x,z}))s.terrain.push({x,z,height:z<=-4&&x>=4?2:1});
  const actions=[{type:'place',item:'decor:mintTree',source:'owned',x:-2.4,z:1.6},{type:'place',item:'decor:mintTree',source:'owned',x:2.4,z:-1.6},{type:'place',item:'decor:pinkShrub',source:'owned',x:-3.2,z:-.3},{type:'place',item:'decor:pinkShrub',source:'owned',x:2.4,z:1.6},{type:'place',item:'decor:pinkShrub',source:'owned',x:-1.6,z:2.4},{type:'plant',x:1.6,z:-.8},{type:'plant',x:-.8,z:2.4},{type:'plant',x:0,z:2.4}];
  for(const a of actions){const r=apply(s,a,now,.1);if(!r.ok)throw Error('Invalid reference garden: '+JSON.stringify(a)+' '+r.error);s=r.state;}
  return s;
 }
 const api={fresh,apply,reference};root.SandboxRules=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
