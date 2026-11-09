/* Palette sampled from the user's 2026-11-09 island reference. Materials are calibrated for this scene; this is not the original shader. */
export const gardenPalette={soilTop:'#fd7a97',soilSide:'#d85572',soilEdge:'#d84b64',leaf:'#74ddb1',leafTop:'#86e9c0',leafShade:'#7adcb1',bark:'#f68f6f',barkTop:'#ffb690',grass:'#ffadc0'};
export function gardenMaterial(T,color,{map=null,topColor=null,mosaic=false}={}){
 const leaf=[gardenPalette.leaf,gardenPalette.leafShade].includes(color);
 const m=new T.MeshStandardMaterial({color,map,roughness:mosaic?.97:.76,metalness:0});
 m.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vGardenPosition;\nvarying float vGardenUp;\nvarying vec3 vGardenNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
vec4 gardenPoint=vec4(position,1.0);
#ifdef USE_INSTANCING
 gardenPoint=instanceMatrix*gardenPoint;
#endif
vGardenPosition=(modelMatrix*gardenPoint).xyz;
vGardenNormal=normalize(mat3(modelMatrix)*normal);
vGardenUp=clamp(vGardenNormal.y,0.0,1.0);`);
  shader.fragmentShader='varying vec3 vGardenPosition;\nvarying float vGardenUp;\nvarying vec3 vGardenNormal;\n'+shader.fragmentShader;
  if(topColor){shader.uniforms.uGardenTop={value:new T.Color(topColor)};shader.fragmentShader='uniform vec3 uGardenTop;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,uGardenTop,vGardenUp*.85);');}
  if(mosaic){const uv=`vec2 gardenUV=abs(vGardenNormal.y)>.5?vGardenPosition.xz:abs(vGardenNormal.z)>.5?vGardenPosition.xy:vGardenPosition.zy;`;const chunk=T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, gardenUV*1.2 )');shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',uv+'\n'+chunk);shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.03;');}
  // Keep reference colors stable under scene lighting, while retaining soft directional/contact shading.
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(outgoingLight,diffuseColor.rgb,'+(mosaic?'.88':leaf?'.9':'.6')+');\n#include <opaque_fragment>');
 };
 m.customProgramCacheKey=()=> 'garden-reference-v11-'+Boolean(topColor)+'-'+mosaic+'-'+leaf;
 return m;
}
// Eight pink tones clustered from a clear ground patch in the supplied image. No image pixels are embedded.
export const soilMosaicPalette=[[254,109,138],[253,96,125],[253,103,133],[254,118,147],[254,114,143],[254,122,151],[254,134,161],[254,127,155]];
export function terrainTexture(T,face='top'){
 const c=document.createElement('canvas');c.width=c.height=192;const ctx=c.getContext('2d');let seed=173;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const factor=face==='side'?[216/253,85/122,114/151]:face==='edge'?[216/253,75/122,100/151]:[1,1,1];
 const fill=(rgb,x,z,w,h)=>{ctx.fillStyle='rgb('+rgb.map((v,i)=>Math.round(v*factor[i])).join(',')+')';ctx.fillRect(x,z,w,h);};
 for(let z=0;z<12;z++)for(let x=0;x<12;x++){const rgb=soilMosaicPalette[Math.floor(rand()*soilMosaicPalette.length)];fill(rgb,x*16,z*16,16,16);if(rand()>.45)fill(soilMosaicPalette[Math.floor(rand()*soilMosaicPalette.length)],x*16+(rand()>.5?8:0),z*16+(rand()>.5?8:0),8,8);}
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.LinearFilter;texture.wrapS=texture.wrapT=T.RepeatWrapping;return texture;
}
