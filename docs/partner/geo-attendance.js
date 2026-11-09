/* One-shot 100m check-in. Client-side demonstration only; no background location tracking. */
(function(root){
 const RADIUS=100,EARTH=6371008.8;
 const coord=c=>!!c&&Number.isFinite(c.latitude)&&Number.isFinite(c.longitude)&&Math.abs(c.latitude)<=90&&Math.abs(c.longitude)<=180;
 function distance(a,b){if(!coord(a)||!coord(b))return NaN;const rad=d=>d*Math.PI/180,dlat=rad(b.latitude-a.latitude),dlon=rad(b.longitude-a.longitude),h=Math.sin(dlat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlon/2)**2;return 2*EARTH*Math.atan2(Math.sqrt(Math.min(1,h)),Math.sqrt(Math.max(0,1-h)));}
 function evaluate(center,position,now=Date.now()){
  if(!coord(center))return {ok:false,status:'unconfigured'};
  if(!position||!coord(position.coords)||!Number.isFinite(position.coords.accuracy)||position.coords.accuracy<0||!Number.isFinite(position.timestamp)||!Number.isFinite(now))return {ok:false,status:'invalid'};
  if(now-position.timestamp>60000||position.timestamp-now>5000)return {ok:false,status:'stale'};
  const d=distance(center,position.coords),accuracy=position.coords.accuracy;
  // Accuracy is a reported estimate, not proof of physical presence. Borderline fixes are retried.
  if(d>RADIUS&&d-accuracy>RADIUS)return {ok:false,status:'outside',distance:d,accuracy};
  if(d>RADIUS||d+accuracy>RADIUS+1e-8)return {ok:false,status:'uncertain',distance:d,accuracy};
  return {ok:true,status:'inside',distance:d,accuracy,checkedAt:now};
 }
 function membershipAllowed(m,day){const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;return !!m&&!m.archived&&m.status==='active'&&date(day)&&date(m.expiry)&&m.expiry>=day&&(m.remaining===null||(Number.isSafeInteger(m.remaining)&&m.remaining>0));}
 function acceptsSummary(p,now=Date.now()){return !!p&&p.source==='gps'&&Number.isFinite(p.distanceM)&&p.distanceM>=0&&Number.isFinite(p.accuracyM)&&p.accuracyM>=0&&p.distanceM+p.accuracyM<=RADIUS+1e-8&&Number.isFinite(p.checkedAt)&&now-p.checkedAt<=60000&&p.checkedAt-now<=5000;}
 const api={RADIUS,coord,distance,evaluate,membershipAllowed,acceptsSummary};root.GeoAttendance=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

const AttendanceUI=(()=>{
 let current={status:'idle'},sequence=0;
 const L=(ko,en)=>language==='en'?en:ko;
 function message(){const m={unlinked:L('내 정보에서 제휴사에 가입 신청하고 승인을 받아 주세요.','Request to join your studio in Profile and wait for approval.'),idle:L('센터에서 100m 안에 오면 출석할 수 있어요.','Tap check in when you are within 100m of your studio.'),locating:L('현재 위치를 확인하고 있어요.','Checking your current location.'),unconfigured:L('센터 위치가 아직 등록되지 않았어요. 관리자에게 알려 주세요.','Your studio location is not registered. Please contact your manager.'),outside:L('센터에서 100m 안으로 이동한 뒤 다시 눌러 주세요.','Move within 100m of your studio and try again.'),uncertain:L('위치가 정확하지 않아요. 잠시 후 다시 확인해 주세요.','Location accuracy is low. Please try again shortly.'),denied:L('위치 사용을 허용한 뒤 다시 눌러 주세요.','Allow location access, then try again.'),unavailable:L('위치를 찾지 못했어요. 위치 서비스를 확인해 주세요.','Could not find your location. Check location services.'),timeout:L('위치 확인이 오래 걸렸어요. 다시 눌러 주세요.','Location request timed out. Try again.'),unsupported:L('이 환경에서는 위치를 확인할 수 없어요.','Location is unavailable in this environment.'),insecure:L('위치 확인이 가능한 연결에서 다시 열어 주세요.','Open this app in a secure connection to use location.'),stale:L('최신 위치를 확인하지 못했어요. 다시 눌러 주세요.','The location is outdated. Please try again.'),invalid:L('위치 정보를 확인할 수 없어요. 다시 눌러 주세요.','Could not validate the location. Please try again.'),membership:L('회원권의 이용 상태를 관리자에게 확인해 주세요.','Please check membership eligibility with your studio.'),inside:L('센터 근처 위치를 확인했어요. 출석 완료!','Location confirmed near your studio. Checked in!')};return m[current.status]||m.invalid;}
 function statusHtml(){return `<div class="gps-status ${['idle','locating','inside'].includes(current.status)?'':'gps-error'}" data-gps-status="${current.status}" role="status" aria-live="polite">${icon(current.status==='inside'?'CircleCheck':'MapPin')}<span>${message()}</span>${current.status==='locating'?`<button class="text-button" data-action="cancel-location">${L('취소','Cancel')}</button>`:''}</div>`;}
 function busy(){return current.status==='locating';}
 function cancel(){sequence++;if(busy())current={status:'idle'};}
 function reset(){sequence++;current={status:'idle'};}
 function begin(i){
  if(selectedRole!=='member'||i!==0||data.checked||busy())return;
  refreshDeviceDay();if(data.checked||!DeviceSession.healthy()){render(i);return;}
  if(!PartnerUI.connected()){current={status:'unlinked'};render(i);return;}
  const m=data.members.find(m=>m.id==='A');if(!GeoAttendance.membershipAllowed(m,data.demoClock.date)){current={status:'membership'};render(i);return;}
  const center=data.config.location;if(!GeoAttendance.coord(center)){current={status:'unconfigured'};render(i);return;}
  if(!window.isSecureContext){current={status:'insecure'};render(i);return;}if(!navigator.geolocation){current={status:'unsupported'};render(i);return;}
  const token=++sequence,version=data.config.locationVersion||0;current={status:'locating'};render(i);
  const live=()=>token===sequence&&selectedRole==='member'&&version===(data.config.locationVersion||0)&&!data.checked;
  try{navigator.geolocation.getCurrentPosition(async position=>{if(!live())return;const result=GeoAttendance.evaluate(center,position);current={status:result.ok?'locating':result.status};if(result.ok){if(await completeAttendance({source:'gps',distanceM:result.distance,accuracyM:result.accuracy,checkedAt:result.checkedAt,studioVersion:version},live)){current={status:'inside'};renderAll();}else{current={status:'idle'};render(i);}}else render(i);},error=>{if(!live())return;current={status:({1:'denied',2:'unavailable',3:'timeout'})[error?.code]||'invalid'};render(i);},{enableHighAccuracy:true,maximumAge:0,timeout:12000});}catch{if(live()){current={status:'unavailable'};render(i);}}
 }
 /* ABoardFit 핀 등록처럼 주소로 지도 위치를 찾는다. 시안에는 Google 키가 없어 지도 표시만 하고, 좌표는 실제 연동 때 Geocoder 결과로 채운다 */
 const PLACE_KEY='my-workout-garden:studio-place:v1',DEMO_POINT={latitude:37.4979,longitude:127.0276};
 function readAddress(){try{return localStorage.getItem(PLACE_KEY)||'';}catch{return '';}}
 function mapFrame(address){const frame=document.createElement('iframe');frame.title=L('센터 위치 지도','Studio location map');frame.loading='lazy';frame.referrerPolicy='no-referrer';frame.src='https://www.google.com/maps?q='+encodeURIComponent(address)+'&hl=ko&z=16&output=embed';return frame;}
 function settings(){const address=readAddress();return `<details class="studio-location-details"><summary>${icon('MapPin')}<span>${L('제휴사 기본 위치','Studio location')}<small>${L('100m 출석 확인의 기준 장소','Reference location for 100m check-in')}</small></span>${icon('ChevronRight')}</summary><section class="location-settings"><div class="section-title"><h3>${L('출석 위치','Check-in location')}</h3><span class="badge ${address?'green':'pink'}">${address?L('등록됨','Registered'):L('등록 필요','Not registered')}</span></div><form id="location-form" novalidate><label class="field">${L('센터 주소','Studio address')}<input name="address" maxlength="120" autocomplete="off" placeholder="${L('주소 또는 센터 이름','Address or studio name')}" value="${escapeHtml(address)}"></label><button class="secondary wide" type="button" data-action="studio-locate">${icon('MapPin')}${L('지도에서 찾기','Find on map')}</button><div class="location-map" id="location-map" data-address="${escapeHtml(address)}"></div><p id="location-error" class="error-message" role="alert"></p><button class="primary" type="submit">${L('이 위치로 저장','Save this location')}</button></form></section></details>`;}
 function save(e,i){if(e.target.id!=='location-form')return false;e.preventDefault();if(selectedRole!=='admin'||i!==1)return true;const address=new FormData(e.target).get('address').trim();if(!address){$('#location-error').textContent=L('센터 주소를 입력해 주세요.','Enter the studio address.');return true;}const next=GeoAttendance.coord(data.config.location)?data.config.location:DEMO_POINT;if(!DeviceSession.save(sharedLandState,next)){$('#location-error').textContent=L('기기에 저장하지 못했어요. 저장 공간을 확인해 주세요.','Could not save on this device. Check local storage.');return true;}try{localStorage.setItem(PLACE_KEY,address);}catch{}cancel();data.config.location=next;PartnerUI.saveLocation(next);data.config.locationVersion=(data.config.locationVersion||0)+1;current={status:'idle'};renderAll();toast(L('센터 위치를 저장했어요.','Studio location saved.'));return true;}
 function searchMap(){const form=$('#location-form');if(!form)return;const address=form.elements.address.value.trim();$('#location-error').textContent=address?'':L('센터 주소를 입력해 주세요.','Enter the studio address.');if(address)$('#location-map').replaceChildren(mapFrame(address));}
 function showSavedMap(){const box=$('#location-map');if(box?.dataset.address&&!box.firstChild)box.replaceChildren(mapFrame(box.dataset.address));}
 return {begin,message,statusHtml,busy,reset,cancel,settings,save,searchMap,showSavedMap,getState:()=>({...current})};
})();
