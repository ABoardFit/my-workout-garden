import {gardenPalette as P} from './art-style.js';
export const treeKinds=[{id:0,key:'mint',ko:'민트 큐브 나무',en:'Mint cube tree'},{id:1,key:'cloud',ko:'층층 구름 나무',en:'Layered cloud tree'},{id:2,key:'fan',ko:'두 갈래 나무',en:'Twin-branch tree'}];
export const gardenAssets=[...treeKinds.flatMap(t=>[0,1,2].map(stage=>({key:`tree-${t.key}-${stage}`,kind:'tree',variant:t.id,stage,ko:t.ko+[' · 씨앗',' · 새싹',' · 성장'][stage],en:t.en+' · '+['seed','sapling','grown'][stage]}))),{key:'pinkShrub',kind:'prop',ko:'분홍 가지풀',en:'Pink branching grass'},{key:'flowerSpray',kind:'prop',ko:'별꽃 화초',en:'Starflower cluster'},{key:'pinkFern',kind:'prop',ko:'분홍 고사리',en:'Pink fern'},{key:'stepTerrace',kind:'prop',ko:'겹친 분홍 단차',en:'Layered pink terrace'},{key:'mintArch',kind:'prop',ko:'민트 아치 지형',en:'Mint arch'},{key:'backCliff',kind:'prop',ko:'뒤쪽 계단 절벽',en:'Backdrop stepped cliff'}];
export function gardenAssetFactory({T,box,mat}){
 function cube(g,w,h,d,x,y,z,c,r=.035){const m=box(g,w,h,d,x,y,z,mat(c),r);m.userData.localShape=true;m.userData.owned=true;return m;}
 function tree(variant=0,stage=2){const g=new T.Group();if(stage===0){cube(g,.20,.10,.17,0,.05,0,'#bd718b',.04);cube(g,.075,.06,.07,0,.12,0,P.bark,.025);return g;}const k=Number(variant)||0;
  if(stage===1){cube(g,.10,.43,.10,0,.215,0,P.bark,.02);cube(g,.28,.25,.27,-.1,.48,0,P.leaf,.04);cube(g,.22,.21,.22,.14,.59,0,P.leafShade,.04);return g;}
  if(k===0){cube(g,.28,1.65,.28,0,.825,0,P.bark,.055);cube(g,1.0,.20,.24,-.25,1.18,0,P.bark,.035);cube(g,.21,.58,.21,-.65,1.42,0,P.bark,.035);for(const [x,y,z,s]of [[-.65,1.95,0,.8],[0,2.27,0,.88],[.66,1.84,0,.78],[0,1.7,.44,.8],[0,1.89,-.45,.78]])cube(g,s,s*.95,s,x,y,z,P.leaf,.10);}
  else if(k===1){cube(g,.27,1.8,.27,0,.9,0,P.bark,.05);for(const [y,w]of [[1.27,1.5],[1.84,1.16],[2.32,.72]]){cube(g,w,.53,.8,0,y,0,P.leaf,.09);cube(g,w*.55,.48,.68,-.12,y+.20,-.24,P.leafShade,.08);}}
  else{cube(g,.24,1.0,.24,0,.5,0,P.bark,.04);cube(g,1.18,.21,.22,0,.95,0,P.bark,.035);for(const x of [-.48,.48]){cube(g,.20,.75,.20,x,1.24,0,P.bark,.035);cube(g,.78,.73,.76,x,1.83,0,P.leaf,.10);cube(g,.58,.56,.56,x,2.16,-.05,P.leafShade,.09);}cube(g,.67,.63,.67,0,1.54,.24,P.leaf,.09);}
  return g;
 }
 function prop(kind){const g=new T.Group();
  if(['pinkShrub','flowerSpray','pinkFern'].includes(kind)){for(let i=0;i<9;i++){const x=(i%3-1)*.14,z=(Math.floor(i/3)-1)*.13,h=.24+(i*7%5)*.10;cube(g,.065,h,.065,x,h/2,z,P.grass,.008);if(kind==='pinkFern'){for(const side of [-1,1])for(let j=1;j<4;j++)cube(g,.12,.04,.06,x+side*j*.035,h*j/4,z,'#ffb8cc',.008);}else if(kind==='flowerSpray'){cube(g,.13,.08,.13,x,h+.02,z,i%2?'#ffd4df':'#ffb2d0',.02);cube(g,.055,.05,.055,x,h+.07,z,'#ffe28a',.01);}else if(i%3===0)cube(g,.13,.055,.065,x+.04,h*.65,z,'#ffb7cb',.008);}return g;}
  if(kind==='stepTerrace'){cube(g,.79,.25,.79,0,.125,0,P.soilTop,.006);}
  if(kind==='mintArch'){for(const x of [-.8,.8])for(let y=0;y<4;y++)cube(g,.79,.5,.79,x,y*.5+.25,0,'#669f94',.025);for(let x=-1;x<=1;x++)cube(g,.79,.5,.79,x*.8,2.25,0,'#6aab9e',.025);for(const x of [-.8,.8]){const p=prop('pinkShrub');p.scale.setScalar(.6);p.position.set(x,2.5,0);g.add(p);}}
  if(kind==='backCliff'){for(let x=-1;x<=1;x++){const height=2+(x+1);for(let y=0;y<height;y++)cube(g,.79,.5,.79,x*.8,y*.5+.25,0,'#609b92',.018);if(x!==0){const p=prop('pinkShrub');p.scale.setScalar(.55);p.position.set(x*.8,height*.5,0);g.add(p);}}}
  return g;
 }
 return {tree,prop,create:entry=>entry.kind==='tree'?tree(entry.variant,entry.stage):prop(entry.key)};
}
