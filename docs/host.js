/* 시연 페이지와 게임(iframe) 사이의 연결. 실제 계정·GPS 없이 이 브라우저에만 저장한다. */
const KEY = 'my-workout-garden:land:v4';
const POP_MS = 640; // 출석 버튼 애니메이션 길이(demo.css와 맞춘다)
let checked = false; // 시연: 페이지를 열 때마다 다시 출석해 볼 수 있다
const SANDBOX_KEY = 'nutakeai-workout-land-sandbox-v1';
const frame = document.getElementById('game');
const R = window.LandRules;
const ENTRY_KEY = 'my-workout-garden:entry:v1';
function readEntry() {
  try { return JSON.parse(localStorage.getItem(ENTRY_KEY)) || {}; } catch { return {}; }
}
/* 회원 폰의 '회원/제휴사 선택 → 로그인' 화면을 게임 위에 띄운다 */
function syncMemberEntry() {
  const entryFrame = document.getElementById('member-entry');
  const show = !!readEntry().member;
  entryFrame.hidden = !show;
  if (show) entryFrame.src = 'partner/index.html?view=entry';
  else entryFrame.removeAttribute('src');
}
function setMemberEntry(show) {
  try { localStorage.setItem(ENTRY_KEY, JSON.stringify({ ...readEntry(), member: show })); } catch { /* 저장 실패 시 현재 화면 유지 */ }
  syncMemberEntry();
}
const day = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function read() {
  try {
    const saved = R.migrate(JSON.parse(localStorage.getItem(KEY)));
    if (saved) return saved;
  } catch { /* 저장소를 못 쓰면 새로 시작 */ }
  return R.fresh();
}
function write() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 저장 실패는 플레이에 영향 없음 */ }
}
let state = read();

const send = (msg) => frame.contentWindow?.postMessage(msg, location.origin);
const publishMember = () => send({
  type: 'land-member', eligible: !checked, status: 'idle', message: '', busy: false, day: day(),
});

addEventListener('message', (e) => {
  if (e.source === document.getElementById('booking').contentWindow && e.origin === location.origin && e.data?.type === 'member-close') {
    closeBooking();
    setMemberEntry(true);
  }
  if (e.source === document.getElementById('member-entry').contentWindow && e.origin === location.origin && e.data?.type === 'member-entered') setMemberEntry(false);
  if (e.source === document.getElementById('booking').contentWindow && e.origin === location.origin && e.data?.type === 'member-confirm') openMemberDialog(e.data.title, e.data.body);
  if (e.source !== frame.contentWindow || e.origin !== location.origin) return;
  const msg = e.data;
  if (msg?.type === 'land-ready') {
    send({ type: 'land-init', snapshot: state, language: 'ko' });
    send({ type: 'land-active', active: true, language: 'ko' });
    publishMember();
  }
  if (msg?.type === 'land-state' && R.valid(msg.snapshot) && msg.snapshot.rev >= state.rev) {
    state = R.copy(msg.snapshot);
    write();
  }
  if (msg?.type === 'land-booking') openOverlay('booking');
  if (msg?.type === 'land-profile') openOverlay('profile');
  if (msg?.type === 'land-notice') openNotice();
  if (msg?.type === 'land-checkin') {
    if (checked) return;
    checked = true;
    /* GPS 연동 전: 버튼을 누르면 바로 +100P */
    const from = state.coins;
    state = { ...R.copy(state), coins: from + 100, rev: state.rev + 1 };
    write();
    send({ type: 'land-init', snapshot: state, language: 'ko' });
    send({ type: 'land-attendance-award', day: day(), from, to: state.coins, amount: 100 });
    setTimeout(publishMember, POP_MS);
  }
});

document.getElementById('reset').addEventListener('click', () => {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SANDBOX_KEY);
    localStorage.removeItem('my-workout-garden:profile:v1');
    localStorage.removeItem('my-workout-garden:partners:v1');
    localStorage.removeItem('my-workout-garden:notice:v1');
    localStorage.removeItem('my-workout-garden:plans:v1');
    localStorage.removeItem('my-workout-garden:studio-place:v1');
    localStorage.setItem(ENTRY_KEY, JSON.stringify({ member: true, partner: true }));
    localStorage.removeItem('my-workout-garden:assignments:v1');
    localStorage.removeItem('my-workout-garden:partner-pending:v1');
    localStorage.removeItem('my-workout-garden:roster:v1');
    localStorage.removeItem('my-workout-garden:pass-requests:v2');
  } catch { /* 무시 */ }
  state = R.fresh();
  checked = false;
  syncMemberEntry();
  send({ type: 'land-reset', snapshot: state });
  publishMember();
});

/* 수업 예약·내 정보 화면: 회원 폰 안에서 옆으로 밀려 들어온다 */
const bookingLayer = document.getElementById('booking-layer');
const bookingFrame = document.getElementById('booking');
function openOverlay(view) {
  /* 프로필은 포인트가 최신이어야 하므로 열 때마다 새로 불러온다 */
  if (view === 'profile' || bookingFrame.dataset.view !== view) {
    bookingFrame.dataset.view = view;
    bookingFrame.src = `partner/index.html?view=${view}`;
  }
  document.getElementById('booking-title').textContent = view === 'profile' ? '프로필' : '';
  bookingLayer.classList.add('open');
  bookingLayer.inert = false;
}
function closeBooking() {
  bookingLayer.classList.remove('open');
  bookingLayer.inert = true;
}
document.getElementById('booking-back').addEventListener('click', closeBooking);
document.getElementById('reset').addEventListener('click', () => {
  closeBooking();
  bookingFrame.removeAttribute('src');
  delete bookingFrame.dataset.view;
});

/* 회원 폰 전체(상태바·헤더 포함)를 덮는 중앙 확인 창 */
const memberDialog = document.getElementById('member-dialog');
function openMemberDialog(title, body) {
  document.getElementById('member-dialog-title').textContent = title;
  document.getElementById('member-dialog-body').textContent = body;
  memberDialog.hidden = false;
  document.getElementById('member-dialog-ok').focus();
}
function answerMemberDialog(ok) {
  if (memberDialog.hidden) return;
  memberDialog.hidden = true;
  bookingFrame.contentWindow?.postMessage({ type: 'member-confirm-result', ok }, location.origin);
}
document.getElementById('member-dialog-ok').addEventListener('click', () => answerMemberDialog(true));
document.getElementById('member-dialog-cancel').addEventListener('click', () => answerMemberDialog(false));
memberDialog.addEventListener('click', (e) => { if (e.target === memberDialog) answerMemberDialog(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') answerMemberDialog(false); });
document.getElementById('reset').addEventListener('click', () => { memberDialog.hidden = true; });

syncMemberEntry();

/* 제휴사 폰 상태바: 로그인 전 민트, 관리화면에서는 화면색 */
const partnerDemo = document.querySelector('.demo-partner');
partnerDemo.classList.toggle('is-entry', !!readEntry().partner);
addEventListener('message', (e) => {
  if (e.source !== document.getElementById('partner').contentWindow || e.origin !== location.origin || e.data?.type !== 'partner-entry-state') return;
  partnerDemo.classList.toggle('is-entry', !!e.data.entry);
});

addEventListener('message', (e) => {
  if (e.source !== document.getElementById('partner').contentWindow || e.origin !== location.origin || e.data?.type !== 'partner-sheet') return;
  partnerDemo.classList.toggle('sheet-open', !!e.data.open);
});
document.getElementById('reset').addEventListener('click', () => partnerDemo.classList.remove('sheet-open'));

/* 제휴사가 쓴 공지를 회원 폰 중앙 창으로 보여준다 */
const noticeDialog = document.getElementById('notice-dialog');
function openNotice() {
  let notice = null;
  try { notice = JSON.parse(localStorage.getItem('my-workout-garden:notice:v1')); } catch { /* 공지 없음으로 처리 */ }
  if (!notice) return;
  document.getElementById('notice-dialog-title').textContent = notice.title;
  document.getElementById('notice-dialog-body').textContent = notice.body;
  noticeDialog.hidden = false;
  document.getElementById('notice-dialog-close').focus();
}
const closeNotice = () => { noticeDialog.hidden = true; };
document.getElementById('notice-dialog-close').addEventListener('click', closeNotice);
noticeDialog.addEventListener('click', (e) => { if (e.target === noticeDialog) closeNotice(); });
document.getElementById('reset').addEventListener('click', closeNotice);

function tickClock() {
  const d = new Date();
  document.querySelectorAll(".clock").forEach((el) => { el.textContent = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`; });
}
tickClock();
setInterval(tickClock, 15000);

/* 제휴사 화면도 함께 초기화 */
document.getElementById('reset').addEventListener('click', () => {
  const partner = document.getElementById('partner');
  try {
    partner.contentDocument.getElementById('reset-demo').click();
    partner.contentWindow.location.reload();
  } catch { /* 화면이 아직 준비되지 않았으면 건너뜀 */ }
});
