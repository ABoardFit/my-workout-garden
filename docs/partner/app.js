/* Offline interaction mockup. Fictional records; game progress and daily receipt are stored locally. */
'use strict';
const dictionary={};
let language=I18n.lang;
let selectedRole=null;
const t=s=>I18n.fromSource(s);
const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function icon(name,classes=''){const nodes=LUCIDE_ICONS[name];if(!nodes)throw Error('Missing icon '+name);return `<svg class="icon ${classes}" viewBox="0 0 24 24" aria-hidden="true">${nodes.map(([tag,attrs])=>`<${tag} ${Object.entries(attrs).map(([k,v])=>`${k}="${escapeHtml(v)}"`).join(' ')}></${tag}>`).join('')}</svg>`;}
const $=s=>document.querySelector(s);
const memberLabel=id=>{const m=data.members.find(m=>m.id===id);return m?.name||t(tr('partner.app.0392')+id);};
Object.assign(dictionary,MembershipUI.english,RecurringSchedule.english,{});
const fixture=()=>MembershipUI.fixture();
let data=InstructorUI.seed(GroupClasses.seed(fixture()));
const panes=[{role:'member',page:'home',preferencesOpen:false,filter:'all',query:'',date:'2026-11-09',month:10,year:2026,selected:9,coach:'all'},{role:'admin',page:'home',filter:'all',query:'',date:'2026-11-09',coach:'all'}];
const dayText=date=>I18n.date(date,{month:'long',day:'numeric',weekday:'short'});
function btnIcon(name,label,attrs=''){return `<button class="icon-button" aria-label="${escapeHtml(t(label))}" title="${escapeHtml(t(label))}" ${attrs}>${icon(name)}</button>`;}
function heading(title,over='',sub=''){return `<div class="page-heading">${over?`<div class="overline">${escapeHtml(over)}</div>`:''}<h2 tabindex="-1">${t(title)}</h2>${sub?`<p class="subtext">${t(sub)}</p>`:''}</div>`;}
function landEntry(){return `<button class="land-entry" data-go="land"><span class="land-symbol">${icon('TreePalm')}</span><span><strong>${tr('partner.app.0276')}</strong><small>${tr('partner.app.0277')}</small></span>${icon('ChevronRight')}</button>`;}
function nav(p){if(p.role==='member')return '';const items=[['home','House',tr('partner.app.0266')],['members','UsersRound',tr('partner.app.entry.0235')],['schedule','CalendarDays',tr('partner.app.0298')],['settings','Settings2',tr('partner.app.0317')]];return `<nav class="nav" aria-label="${tr('partner.app.0366')}">${items.map(([page,img,label])=>`<button data-go="${page}" aria-label="${t(label)}" title="${t(label)}" ${p.page===page?'aria-current="page"':''}>${icon(img)}</button>`).join('')}</nav>`;}
function coachLabel(id){return InstructorUI.label(data,id);}
function memberHome(){return MembershipUI.home();}
function success(){return MembershipUI.success();}
function profile(){return MembershipUI.profile();}
function memberAvatar(id,fallback){const photo=MemberPass.photoOf(id);return photo?`<img src="${escapeHtml(photo)}" alt="">`:fallback;}
function adminHome(){return MembershipUI.adminHome();}
function filteredMembers(p){return data.members.filter(m=>(p.filter==='archived'?m.archived:!m.archived)&&(p.filter==='all'||p.filter==='archived'||m.status===p.filter)&&`${memberLabel(m.id)} ${m.id}`.toLowerCase().includes(p.query.toLowerCase()));}
function memberRows(p){const list=filteredMembers(p);return `<p class="result-count">${list.length}${tr('partner.app.0381')}</p>${list.length?list.map(m=>`<button class="member-row${m.status==='inactive'?' member-inactive':''}" data-action="member-detail" data-id="${m.id}"><span class="avatar ${m.id==='B'?'pink':''}">${memberAvatar(m.id,escapeHtml(memberLabel(m.id).replace(tr('partner.app.0392'),'').slice(0,1)))}</span><span><strong>${escapeHtml(memberLabel(m.id))}</strong><p>${MembershipUI.remainingText(m)}</p></span><span class="badge ${m.status==='paused'?'pink':m.status==='inactive'?'':'green'}">${m.status==='inactive'?tr('partner.app.0393'):t(m.archived?tr('land.land.panels.0157'):m.status==='paused'?tr('partner.app.0295'):tr('partner.app.0294'))}</span>${icon('ChevronRight')}</button>`).join(''):`<div class="empty-state">${icon('Search')}${tr('partner.app.0340')}<br>${tr('partner.app.0341')}</div>`}`;}
function members(p){return `${heading(tr('partner.app.entry.0235'))}<button class="secondary wide" data-action="add-member">${icon('Plus')}${tr('partner.app.0385')}</button><label class="search-field">${icon('Search')}<input data-action="search" type="search" value="${escapeHtml(p.query)}" placeholder="${tr('partner.app.0292')}" aria-label="${tr('partner.app.0292')}"></label><div class="filter-row" role="group" aria-label="${tr('partner.app.entry.0235')}">${[['all',tr('partner.app.0293')],['active',tr('partner.app.0294')],['paused',tr('partner.app.0295')],['inactive',tr('partner.app.0393')],['archived',tr('land.land.panels.0157')]].map(([f,label])=>`<button class="chip" data-action="filter" data-filter="${f}" aria-pressed="${p.filter===f}">${escapeHtml(t(label))}</button>`).join('')}</div><div data-member-list aria-live="polite">${memberRows(p)}</div>`;}
function schedule(p){
 const personal=data.config.personalLessons&&p.scheduleView!=='group';p.scheduleView=personal?'personal':'group';
 if(personal)return RecurringSchedule.render(p);
 const source=personal?data.events:data.groups,list=source.filter(e=>e.date===p.date&&(p.coach==='all'||p.coach===e.coach)&&(!personal||!p.memberFilter||e.member===p.memberFilter));
 return `${heading(tr('partner.app.0394'),'',personal?tr('partner.app.0297'):tr('partner.app.0395'))}${personal?`<label class="field schedule-member">${tr('partner.app.0386')}<select data-input="schedule-member" data-pane="${panes.indexOf(p)}"><option value="">${tr('partner.app.0293')}</option>${data.members.filter(m=>!m.archived).map(m=>`<option value="${m.id}" ${p.memberFilter===m.id?'selected':''}>${escapeHtml(memberLabel(m.id))}${Number.isInteger(m.remaining)?` · ${m.remaining}${tr('partner.app.0273')}`:''}</option>`).join('')}</select></label>`:''}${data.config.personalLessons?`<div class="schedule-types" role="group" aria-label="${tr('partner.app.0285')}"><button class="chip" data-action="schedule-view" data-view="group" aria-pressed="${!personal}">${tr('partner.app.0269')}</button><button class="chip" data-action="schedule-view" data-view="personal" aria-pressed="${personal}">${tr('partner.app.0387')}</button></div>`:''}<div class="filter-row" role="group" aria-label="${tr('partner.app.0306')}">${[["all",tr('partner.app.0299')],...InstructorUI.choices(data,null,true)].map(([id,label])=>`<button class="chip" data-action="coach" data-id="${id}" aria-pressed="${p.coach===id}">${escapeHtml(t(label))}</button>`).join('')}</div><div class="date-strip">${btnIcon('ChevronLeft',tr('partner.app.0372'),'data-action="date" data-step="-1"')}<strong>${dayText(p.date)}</strong>${btnIcon('ChevronRight',tr('partner.app.0373'),'data-action="date" data-step="1"')}</div>${list.length?`<div class="schedule-timeline">${[...new Set([...list.map(e=>Number(e.time.slice(0,2))),...(personal?[10,11,12,13,14]:[])])].sort((a,b)=>a-b).map(hour=>`<div class="time-slot"><span class="time-label">${String(hour).padStart(2,'0')}:00</span><div class="time-cell">${list.filter(e=>Number(e.time.slice(0,2))===hour).sort((a,b)=>a.time.localeCompare(b.time)).map(e=>`<button class="event ${e.coach==='B'?'pink':''}" data-action="edit-event" data-id="${e.id}"><strong>${e.time} · ${personal?escapeHtml(memberLabel(e.member)):escapeHtml(t(e.kind))}</strong><small>${personal?escapeHtml(t(e.kind)):`${tr('partner.app.0388')} ${e.booked}/${e.capacity}`} · ${escapeHtml(coachLabel(e.coach))} · ${t(tr('partner.app.0396')+e.room)}</small></button>`).join('')}</div></div>`).join('')}</div>`:`<div class="empty-state">${icon('CalendarDays')}${tr('partner.app.0339')}</div>`}<button class="secondary wide add-event" data-action="add-event">${icon('Plus')}${tr('partner.app.0304')}</button>`;
}
function requests(){return MembershipUI.inbox();}
function settings(){return MembershipUI.settings();}
let sharedLandState=LandRules.fresh();
const savedDevice=DeviceSession.read();if(savedDevice){sharedLandState=LandRules.copy(savedDevice.snapshot);data.checked=savedDevice.claimDay===DeviceSession.day();data.config.location=savedDevice.studio;}
let currentAttendanceDay=DeviceSession.day();
PartnerUI.init(savedDevice);
data.members.find(m=>m.id==='A').points=sharedLandState.coins;
function publishLand(except=null){for(const frame of document.querySelectorAll('.land-frame'))if(frame!==except)sendLand(frame,{type:'land-init',snapshot:sharedLandState,language});}
function syncLandMember(){data.members.find(m=>m.id==='A').points=sharedLandState.coins;panes.forEach((p,i)=>{if(selectedRole==='member'&&p.role==='member'&&p.page==='profile')render(i);});}
function sendLand(frame,message){frame?.contentWindow?.postMessage(message,location.origin==='null'?'*':location.origin);}
function render(i,focus=false){
 const p=panes[i],app=$('#app-'+i);if(selectedRole!==p.role){app.replaceChildren();return;}const isLand=p.role==='member'&&p.page==='land';
 let chrome=app.querySelector(':scope > .app-chrome');
 if(!chrome){chrome=document.createElement('div');chrome.className='app-chrome';app.append(chrome);}
 let frame=app.querySelector('.land-frame');
 if(isLand&&!frame){frame=document.createElement('iframe');frame.className='land-frame';frame.title=tr('partner.app.0397');frame.src='land/index.html?lang='+language;frame.dataset.pane=i;app.append(frame);}
 app.classList.toggle('land-mode',isLand);chrome.hidden=isLand;
 if(frame){frame.hidden=!isLand;sendLand(frame,{type:'land-active',active:isLand,language});}
 if(!isLand){
  const body=p.role==='member'?(MembershipUI.profilePage()):(p.page==='booking'?`<section class="member-home">${heading(tr('partner.app.0398'))}${GroupClasses.memberCard()}${MembershipUI.sharedNotice()}</section>`:p.page==='home'?adminHome():p.page==='members'?members(p):p.page==='schedule'?schedule(p):settings());
  chrome.innerHTML=`<header class="app-header"><span class="brand-line"><span class="brand-dot"></span><span class="center-name">${p.role==='member'?'My Workout Land':escapeHtml(PartnerUI.label())}</span>${p.role==='admin'?`<span class="role-pill">${tr('partner.app.0263')}</span>`:''}</span><button class="icon-button entry-return" data-action="${p.role==='member'?'return-land':'entry'}" aria-label="${p.role==='member'?(tr('partner.app.0383')):(tr('partner.app.0384'))}" title="${p.role==='member'?(tr('partner.app.0383')):(tr('partner.app.0384'))}">${icon('ArrowLeft')}</button></header><div class="app-body">${body}</div>${nav(p)}`;
  if(focus)chrome.querySelector('h2')?.focus({preventScroll:true});
 }else if(focus)frame.focus();
 if(p.role==='member')publishMember();
 $('#label-'+i).textContent=`0${i+1} — ${t(p.role==='member'?tr('partner.app.entry.0235'):tr('partner.app.0263'))}`;
}
window.addEventListener('message',event=>{
 const frames=[...document.querySelectorAll('.land-frame')],frame=frames.find(f=>f.contentWindow===event.source);
 if(!frame||event.origin!==location.origin)return;
 const i=Number(frame.dataset.pane),msg=event.data;
 if(msg?.type==='land-ready'){sendLand(frame,{type:'land-init',snapshot:sharedLandState,language});sendLand(frame,{type:'land-active',active:panes[i].role==='member'&&panes[i].page==='land',language});}
 if(msg?.type==='land-state'&&LandRules.valid(msg.snapshot)){const next=msg.snapshot;if(next.rev>sharedLandState.rev||(next.rev===sharedLandState.rev&&JSON.stringify(next)===JSON.stringify(sharedLandState))){if(DeviceSession.save(next,data.config.location)){sharedLandState=LandRules.copy(next);publishLand(frame);syncLandMember();}else{const r=DeviceSession.read();if(r){sharedLandState=LandRules.copy(r.snapshot);data.checked=r.claimDay===DeviceSession.day();}publishLand();}}else sendLand(frame,{type:'land-init',snapshot:sharedLandState,language});}
 if(msg?.type==='land-profile'&&selectedRole==='member'&&!AttendanceUI.busy()){panes[i].page='profile';render(i,true);}
 if(msg?.type==='land-checkin')AttendanceUI.begin(i);
 if(msg?.type==='land-cancel-checkin'){AttendanceUI.cancel();render(i);}
 if(msg?.type==='land-ready')publishMember();
});

function renderAll(){AppEntry.shell();panes.forEach((_,i)=>render(i));document.documentElement.lang=language;}
let toastTimer;function toast(message){$('#toast').textContent=t(message);$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200);}
let opener=null;const sheet=$('#sheet');
/* 제휴사 폰의 상태바까지 함께 어둡게 하도록 바깥 페이지에 알린다 */
new MutationObserver(()=>parent.postMessage({type:'partner-sheet',open:sheet.open},location.origin)).observe(sheet,{attributes:true,attributeFilter:['open']});
function openSheet(title,body){opener=document.activeElement;$('#sheet-content').innerHTML=`<div class="sheet-head"><h2 id="sheet-title">${t(title)}</h2>${btnIcon('X',tr('land.expansion.0030'),'data-close')}</div>${body}`;sheet.showModal();sheet.querySelector('[data-close]').focus();}
function closeSheet(){sheet.close();}
sheet.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});
sheet.addEventListener('click',e=>{if(e.target.closest('[data-action="partner-remove"]')){closeSheet();PartnerUI.remove();return;}if(e.target===sheet){const r=sheet.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSheet();}if(e.target.closest('[data-close]'))closeSheet();});
function publishMember(){const status=AttendanceUI.getState().status;for(const f of document.querySelectorAll('.land-frame'))sendLand(f,{type:'land-member',eligible:!data.checked,status:DeviceSession.healthy()?status:'storage',message:DeviceSession.healthy()?AttendanceUI.message():(tr('partner.app.0382')),busy:AttendanceUI.busy(),day:DeviceSession.day()});}
async function completeAttendance(proof,isLive=()=>true){
 const eligible=()=>selectedRole==='member'&&!data.checked&&isLive()&&GeoAttendance.acceptsSummary(proof)&&proof.studioVersion===(data.config.locationVersion||0);
 if(!eligible())return false;
 const reward=await DeviceSession.claim(sharedLandState,data.config.location,eligible);
 if(!reward.ok){if(reward.record){sharedLandState=LandRules.copy(reward.record.snapshot);data.checked=reward.record.claimDay===DeviceSession.day();publishLand();}publishMember();return false;}
 sharedLandState=reward.state;data.members.find(m=>m.id==='A').points=sharedLandState.coins;data.checked=true;data.attendance.push(9);data.attendanceProof={...proof};publishLand();
 for(const f of document.querySelectorAll('.land-frame'))sendLand(f,{type:'land-attendance-award',day:reward.day,from:reward.from,to:reward.to,amount:100});
 publishMember();return true;
}
function refreshDeviceDay(){const today=DeviceSession.day();if(today!==currentAttendanceDay){currentAttendanceDay=today;AttendanceUI.reset();const r=DeviceSession.read();data.checked=r?.claimDay===today;renderAll();}}
window.addEventListener('languagechange',()=>{if(!I18n.choice)location.reload();});
window.addEventListener('storage',e=>{if(e.key!==DeviceSession.key)return;const r=DeviceSession.read();if(r){sharedLandState=LandRules.copy(r.snapshot);data.checked=r.claimDay===DeviceSession.day();data.config.location=r.studio;}publishLand();publishMember();});
window.addEventListener('focus',refreshDeviceDay);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDeviceDay();});setInterval(refreshDeviceDay,30000);
function openCheckin(i){AttendanceUI.begin(i);}
function memberDetail(id){return MembershipUI.memberDetail(id);}
const minute=s=>{const[a,b]=s.split(':').map(Number);return a*60+b;};
function eventConflict(next){return ScheduleEngine.conflictBatch(data,[next],{excludeIds:[next.id]});}
function eventDialog(i,id){
 const current=[...data.events,...data.groups].find(e=>e.id===id),group=current?!current.member:panes[i].scheduleView==='group';
 if(!group&&!data.config.personalLessons){toast(tr('partner.app.0399'));return;}
 const ev=current||{id:null,...(group?{capacity:12,booked:0}:{member:panes[i].memberFilter||'A'}),coach:InstructorUI.first(data),room:'1',date:panes[i].date,time:group?'20:00':'15:00',duration:50,kind:group?tr('partner.app.0269'):'1:1 필라테스'};
 const options=(values,value)=>values.map(([v,label])=>`<option value="${v}" ${v==value?'selected':''}>${escapeHtml(t(label))}</option>`).join('');
 openSheet(current?tr('partner.app.0305'):tr('partner.app.0304'),`${group&&current?GroupClasses.roster(current.id):''}<form id="event-form">${group?`<label class="field">${tr('partner.app.0389')}<input name="kind" value="${escapeHtml(ev.kind)}" required maxlength="60"></label><label class="field">${tr('partner.app.0390')}<input name="capacity" type="number" value="${ev.capacity}" min="${Math.max(1,ev.booked)}" max="100" required></label>`:`<label class="field">${tr('partner.app.entry.0235')}<select name="member">${options(data.members.filter(m=>!m.archived).map(m=>[m.id,memberLabel(m.id)]),ev.member)}</select></label>`}<div class="form-row"><label class="field">${tr('partner.app.0306')}<select name="coach">${options(InstructorUI.choices(data,ev.coach),ev.coach)}</select></label><label class="field">${tr('partner.app.0310')}<select name="room">${options([['1','룸 1'],['2','룸 2']],ev.room)}</select></label></div><label class="field">${tr('partner.app.0307')}<input type="date" name="date" required value="${ev.date}"></label><div class="form-row"><label class="field">${tr('partner.app.0308')}<input type="time" name="time" required value="${ev.time}" step="300"></label><label class="field">${tr('partner.app.0309')}<select name="duration">${options([30,50,60,90].map(n=>[n,n+tr('partner.app.0400')]),ev.duration)}</select></label></div><div class="form-summary">${current?`${current.date} ${current.time} → `:''}${tr('partner.app.0357')}</div><div class="error-message" role="alert" id="event-error"></div><button class="primary" type="submit">${icon('Check')}${tr('partner.app.0313')}</button></form>`);
 $('#event-form').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget),next={...ev,...Object.fromEntries(fd),duration:Number(fd.get('duration'))};const error=$('#event-error');if(!/^\d{4}-\d{2}-\d{2}$/.test(next.date)||!/^\d{2}:\d{2}$/.test(next.time)||!Number.isFinite(Date.parse(next.date+'T'+next.time))){error.textContent=tr('partner.app.0355');return;}if(minute(next.time)<360||minute(next.time)+next.duration>1320){error.textContent=tr('partner.app.0356');return;}if(group){next.capacity=Number(next.capacity);next.kind=next.kind.trim();if(!Number.isInteger(next.capacity)||next.capacity<Math.max(1,next.booked)||next.capacity>100||!next.kind){error.textContent=tr('partner.app.0391');return;}}if(eventConflict(next)){error.textContent=tr('partner.app.0354');return;}if(current)Object.assign(current,next);else (group?data.groups:data.events).push({...next,id:data.nextId++});panes[i].page='schedule';panes[i].date=next.date;panes[i].scheduleView=group?'group':'personal';panes[i].coach='all';closeSheet();renderAll();$('#app-'+i+' h2').focus();toast(tr('partner.app.0353'));};
}
function handleClick(i,e){const el=e.target.closest('button');if(!el)return;const p=panes[i];if(selectedRole!==p.role)return;if(MemberPass.handle(el))return;if(el.dataset.go){const allowed=p.role==='member'?['land','profile']:['home','members','schedule','settings'];if(!allowed.includes(el.dataset.go))return;p.page=el.dataset.go;render(i,true);return;}const action=el.dataset.action;if(PartnerUI.handle(el)||InstructorUI.handle(i,el)||GroupClasses.handle(i,el)||MembershipUI.handleClick(i,el)||RecurringSchedule.handleClick(i,el))return;if(action==='return-land'){p.page='land';render(i,true);return;}if(action==='check-in')openCheckin(i);if(action==='entry'){AppEntry.leave();return;}if(action==='studio-locate'){AttendanceUI.searchMap();return;}if(action==='cancel-location'){AttendanceUI.cancel();render(i);return;}if(action==='notifications')openSheet(tr('partner.app.0361'),`<p class="sheet-copy">${tr('partner.app.0362')}</p><button class="primary" data-close>${tr('land.shop.ui.0212')}</button>`);if(action==='filter'){p.filter=el.dataset.filter;render(i);}if(action==='coach'){p.coach=el.dataset.id;render(i);}if(action==='date'){const date=new Date(p.date+'T12:00:00');date.setDate(date.getDate()+Number(el.dataset.step));p.date=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;render(i);}if(action==='member-detail')memberDetail(el.dataset.id);if(action==='edit-event')eventDialog(i,Number(el.dataset.id));if(action==='add-event')eventDialog(i,null);}
panes.forEach((p,i)=>{$('#app-'+i).addEventListener('click',e=>handleClick(i,e));$('#app-'+i).addEventListener('submit',e=>{if(!PartnerUI.submit(e))AttendanceUI.save(e,i);});$('#app-'+i).addEventListener('toggle',e=>{if(e.target.id==='member-preferences')p.preferencesOpen=e.target.open;},true);$('#app-'+i).addEventListener('change',e=>{MembershipUI.handleInput(e);RecurringSchedule.handleChange(e);});$('#app-'+i).addEventListener('input',e=>{MembershipUI.handleInput(e);if(e.target.dataset.action==='search'){p.query=e.target.value;$('#app-'+i+' [data-member-list]').innerHTML=memberRows(p);}});});
document.addEventListener('toggle',e=>{if(e.target.classList?.contains('studio-location-details')&&e.target.open)AttendanceUI.showSavedMap();},true);
$('#role-entry').addEventListener('click',e=>{const b=e.target.closest('[data-enter-role]');if(b)AppEntry.choose(b.dataset.enterRole);else{const a=e.target.closest('[data-auth]');if(a)AppEntry.action(a);}});
$('#role-entry').addEventListener('submit',AppEntry.submit);
$('#reset-demo').onclick=()=>{AppEntry.reset();PartnerUI.reset();DeviceSession.reset();try{localStorage.removeItem('nutakeai-workout-land-sandbox-v1');}catch{}currentAttendanceDay=DeviceSession.day();AttendanceUI.reset();selectedRole=null;MembershipUI.reset();sharedLandState=LandRules.fresh();document.querySelectorAll('.land-frame').forEach(f=>sendLand(f,{type:'land-reset',snapshot:sharedLandState}));clearTimeout(toastTimer);$('#toast').classList.remove('visible');GroupClasses.reset();data=InstructorUI.seed(GroupClasses.seed(fixture()));data.members.find(m=>m.id==='A').points=sharedLandState.coins;language=DeviceSession.locale();Object.assign(panes[0],{role:'member',page:'home',preferencesOpen:false,filter:'all',query:'',date:'2026-11-09',month:10,year:2026,selected:9,coach:'all'});Object.assign(panes[1],{role:'admin',page:'home',scheduleView:'personal',lessonView:'day',memberFilter:'',filter:'all',query:'',date:'2026-11-09',coach:'all'});renderAll();};
renderAll();
if(new URLSearchParams(location.search).get('view')==='profile'){document.documentElement.classList.add('booking-view');window.memberStartPage='profile';try{const saved=JSON.parse(localStorage.getItem('my-workout-garden:land:v4'));if(saved&&Number.isInteger(saved.coins)){sharedLandState.coins=saved.coins;data.members.find(m=>m.id==='A').points=saved.coins;}}catch{}AppEntry.enter('member');}
else if(new URLSearchParams(location.search).get('view')==='booking'){document.documentElement.classList.add('booking-view');AppEntry.enter('admin',PartnerUI.adminPartner('YOGA-DEMO'));const trial=MembershipUI.fixture().members.find(m=>m.id==='A');data.members=data.members.filter(m=>m.id!=='A').concat({...trial,status:'active',archived:false});panes[1].page='booking';render(1);}
else if(new URLSearchParams(location.search).get('view')==='entry'){document.documentElement.classList.add('booking-view','entry-view');window.entrySide='member';renderAll();}
else if(partnerEntryPending()){document.documentElement.classList.add('entry-view');window.entrySide='partner';window.onEntryDone=()=>{clearPartnerEntry();syncRoster();renderAll();};renderAll();}
else AppEntry.enter('admin',PartnerUI.adminPartner('NUTAKEAI-DEMO')); // 시연: 코드 입력 없이 제휴사 홈으로 바로 입장

/* 제휴사 화면: 홈이 아닌 곳에 있을 때 회원 가입 신청을 상단 알림으로 띄운다. 누르면 승인 카드로 이동 */
function showJoinApproval(){
 panes[1].page='home';
 render(1,true);
 const card=document.querySelector('.partner-join-card');
 if(!card)return;
 card.scrollIntoView({block:'center'});
 card.classList.add('join-highlight');
 setTimeout(()=>card.classList.remove('join-highlight'),1600);
}
window.addEventListener('partner-join-request',()=>{
 if(document.body.dataset.role==='entry'||document.documentElement.classList.contains('booking-view')||panes[1].page==='home')return;
 document.querySelector('.join-banner')?.remove();
 const banner=document.createElement('button');
 banner.type='button';banner.className='join-banner';banner.setAttribute('role','status');
 banner.insertAdjacentHTML('beforeend',icon('Bell'));
 const copy=document.createElement('span');
 const app=document.createElement('small');app.textContent='My Workout Land';
 const text=document.createElement('strong');text.textContent=PartnerUI.memberName()+tr('partner.app.0401');
 copy.append(app,text);banner.append(copy);
 const dismiss=()=>{banner.classList.add('leaving');setTimeout(()=>banner.remove(),260);};
 const timer=setTimeout(dismiss,5000);
 banner.addEventListener('click',()=>{clearTimeout(timer);banner.remove();showJoinApproval();});
 document.body.append(banner);
});

/* 제휴사 화면: 앱 판매 전부터 있던 회원을 회색(앱 미연동)으로 보여주고, 회원이 앱에서 연동되면 활성화한다 */
const onPartnerScreen=()=>!document.documentElement.classList.contains('booking-view');
function syncRoster(){
 if(!onPartnerScreen()||PartnerUI.getState().active!=='anatomya')return;
 const list=MemberPass.roster();
 for(const r of list){let m=data.members.find(x=>x.id===r.id);if(!m){m={id:r.id,points:0};data.members.push(m);}Object.assign(m,{name:r.name,phone:r.phone,plan:r.plan,start:r.start,remaining:r.remaining,expiry:r.end,status:r.status==='linked'?'active':'inactive',archived:false});}
 const self=data.members.find(m=>m.id==='A');
 self.name=PartnerUI.memberName();
 const pass=MemberPass.assignments()[0];
 if(pass){self.expiry=pass.end;if(pass.remaining!==null)self.remaining=pass.remaining;}
 if(list.some(r=>r.status==='linked'))self.archived=true;
}
function showPassRequest(id){
 panes[1].page='home';
 render(1,true);
 const card=document.querySelector('.pass-request[data-request="'+id+'"]');
 if(!card)return;
 card.scrollIntoView({block:'center'});
 card.classList.add('join-highlight');
 setTimeout(()=>card.classList.remove('join-highlight'),1600);
}
function showRosterBanner(message,onOpen){
 if(document.body.dataset.role==='entry')return;
 document.querySelector('.join-banner')?.remove();
 const banner=document.createElement('button');
 banner.type='button';banner.className='join-banner';banner.setAttribute('role','status');
 banner.insertAdjacentHTML('beforeend',icon('Bell'));
 const copy=document.createElement('span');
 const app=document.createElement('small');app.textContent='My Workout Land';
 const text=document.createElement('strong');text.textContent=message;
 copy.append(app,text);banner.append(copy);
 const dismiss=()=>{banner.classList.add('leaving');setTimeout(()=>banner.remove(),260);};
 const timer=setTimeout(dismiss,5000);
 banner.addEventListener('click',()=>{clearTimeout(timer);banner.remove();onOpen();});
 document.body.append(banner);
}
if(onPartnerScreen()){
 syncRoster();renderAll();
 let knownRequests=new Set(MemberPass.partnerPending().map(r=>r.id));
 let lastLinked=new Set(MemberPass.roster().filter(r=>r.status==='linked').map(r=>r.id));
 window.addEventListener('storage',e=>{
  if(e.key===MemberPass.REQUEST_KEY){
   syncRoster();renderAll();
   const added=MemberPass.partnerPending().find(r=>!knownRequests.has(r.id));
   knownRequests=new Set(MemberPass.partnerPending().map(r=>r.id));
   if(added&&panes[1].page!=='home')showRosterBanner(PartnerUI.memberName()+tr('partner.app.0402')+MemberPass.requestKindText(added)+tr('partner.app.0403'),()=>showPassRequest(added.id));
   return;
  }
  if(e.key!==MemberPass.ROSTER_KEY&&e.key!=='nutakeai-partner-preview-v1'&&e.key!==MemberPass.PROFILE_KEY)return;
  syncRoster();renderAll();
  if(e.key!==MemberPass.ROSTER_KEY)return;
  const linked=MemberPass.roster().filter(r=>r.status==='linked');
  const fresh=linked.find(r=>!lastLinked.has(r.id));
  lastLinked=new Set(linked.map(r=>r.id));
  if(fresh)showRosterBanner(fresh.name+tr('partner.app.0404'),()=>{panes[1].page='members';panes[1].filter='all';render(1,true);});
 });
}

/* 가로로 넘치는 필터 줄: 마우스로 끌어서 넘긴다(터치는 기본 스크롤). 다시 그려져도 위치 유지 */
{
 let drag=null,keepLeft=null,justDragged=false;
 document.addEventListener('pointerdown',e=>{const row=e.target.closest('.filter-row');if(!row||e.pointerType!=='mouse'||e.button!==0)return;drag={row,x:e.clientX,left:row.scrollLeft,moved:false};});
 addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>6)drag.moved=true;if(drag.moved)drag.row.scrollLeft=drag.left-dx;});
 addEventListener('pointerup',()=>{if(!drag)return;justDragged=drag.moved;drag=null;setTimeout(()=>{justDragged=false;},0);});
 document.addEventListener('click',e=>{const row=e.target.closest('.filter-row');if(!row)return;if(justDragged){e.preventDefault();e.stopPropagation();return;}keepLeft=row.scrollLeft;setTimeout(()=>{const next=document.querySelector('.filter-row');if(next&&keepLeft!==null)next.scrollLeft=keepLeft;keepLeft=null;},0);},true);
 document.addEventListener('wheel',e=>{const row=e.target.closest('.filter-row');if(row&&row.scrollWidth>row.clientWidth&&!e.deltaX)row.scrollLeft+=e.deltaY;},{passive:true});
}

/* '처음부터 다시' 뒤에는 코드를 입력해야 제휴사 화면에 들어간다 */
function readEntry(){try{return JSON.parse(localStorage.getItem('my-workout-garden:entry:v1'))||{};}catch{return {};}}
function partnerEntryPending(){return !!readEntry().partner;}
function clearPartnerEntry(){try{localStorage.setItem('my-workout-garden:entry:v1',JSON.stringify({...readEntry(),partner:false}));}catch{}}
