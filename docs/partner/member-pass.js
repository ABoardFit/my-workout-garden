/* 회원 프로필: 사진·이름·전화번호, 제휴사 신청, 회원권. 회원권 구조는 ABoardFit 앱(유형·남은 기간·홀딩 한도·신청 대기)을 따른다. */
const MemberPass = (() => {
  const PROFILE_KEY = 'my-workout-garden:profile:v1';
  const REQUEST_KEY = 'my-workout-garden:pass-requests:v2';
  const ASSIGN_KEY = 'my-workout-garden:assignments:v1';
  const PARTNER_KEY = 'my-workout-garden:partners:v1';
  const PENDING_KEY = 'my-workout-garden:partner-pending:v1';
  const ROSTER_KEY = 'my-workout-garden:roster:v1';
  const TODAY = '2026-11-09';
  const APPROVAL_PARTNER = 'anatomya'; // 오른쪽 제휴사 폰에서 승인·연동하는 제휴사
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /* 다른 회원의 시연용 신청. ABoardFit MembershipChangeRequest와 같은 항목을 쓴다 */
  const REQUEST_SEED = [
    { id: 1, partner: 'anatomya', memberId: 'C', memberName: '회원 C', kind: 'hold', status: 'pending', holdStart: '2026-11-12', holdEnd: '2026-11-18' },
    { id: 2, partner: 'anatomya', memberId: 'B', memberName: '회원 B', kind: 'renewal', status: 'pending', planName: '주 3회 회원권', planDurationDays: 28, requestedStart: '2026-11-13' },
  ];
  /* 앱 판매 전부터 제휴사에 있던 회원. 앱에서 이름·전화번호가 맞으면 연동된다 */
  const ROSTER_SEED = [
    { id: 'R1', name: '홍길동', phone: '010-1234-5678', plan: '주 2회 회원권', start: '2026-10-01', end: '2026-12-31', remaining: 18, maxHolds: 3, maxHoldDays: 21, status: 'inactive' },
    { id: 'R2', name: '김서연', phone: '010-2222-3333', plan: '3개월 회원권', start: '2026-11-01', end: '2027-01-31', remaining: null, maxHolds: 2, maxHoldDays: 14, status: 'inactive' },
    { id: 'R3', name: '이도윤', phone: '010-5555-6666', plan: '1개월 회원권', start: '2026-11-03', end: '2026-12-03', remaining: null, maxHolds: 1, maxHoldDays: 7, status: 'inactive' },
  ];
  /* 시연용 가상 제휴사. 좌표는 지역 대표 지점이다 */
  const PARTNERS = [
    { id: 'anatomya', name: '아나토미야 · 시안', type: '필라테스', lat: 37.4979, lng: 127.0276 },
    { id: 'pt', name: 'NUTAKEAI PT · 시안', type: 'PT샵', lat: 37.5563, lng: 126.9236 },
    { id: 'yoga', name: '민트 요가 · 시안', type: '요가', lat: 37.5145, lng: 127.1059 },
    { id: 'box-incheon', name: '송도 크로스핏 · 시안', type: '크로스핏', lat: 37.3829, lng: 126.6569 },
    { id: 'gym-daejeon', name: '둔산 웨이트 · 시안', type: '헬스', lat: 36.3518, lng: 127.3849 },
    { id: 'pilates-daegu', name: '수성 필라테스 · 시안', type: '필라테스', lat: 35.8582, lng: 128.6306 },
    { id: 'box-busan', name: '해운대 크로스핏 · 시안', type: '크로스핏', lat: 35.1631, lng: 129.1635 },
    { id: 'yoga-gwangju', name: '상무 요가 · 시안', type: '요가', lat: 35.1531, lng: 126.8526 },
  ];
  const plans = () => MembershipPlans.list().map((p) => ({ id: p.id, name: p.name, type: p.type === 'count' ? '횟수제' : '기간제', detail: p.type === 'count' ? `${p.total}회 · ${p.days}일` : `${p.days}일`, days: p.days, sessions: p.type === 'count' ? p.total : null }));
  const JOIN_START_MAX_DAYS = 90;
  const KIND_LABEL = { renewal: '연장 신청', hold: '홀딩 신청' };

  let query = '';
  let userLocation = null;

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('이 기기에 저장하지 못했어요.'); }
  };
  const profile = () => read(PROFILE_KEY, { name: '회원 A', phone: '', photo: '' });
  const saveProfile = (patch) => write(PROFILE_KEY, { ...profile(), ...patch });
  const partnerState = () => read(PARTNER_KEY, { registered: [], active: null });
  const activePartner = () => PARTNERS.find((p) => p.id === partnerState().active) || null;
  const allRequests = () => read(REQUEST_KEY, null) || REQUEST_SEED;
  const requests = () => allRequests().filter((r) => r.partner === activePartner()?.id && r.memberId === 'A' && r.status === 'pending');
  const roster = () => read(ROSTER_KEY, null) || ROSTER_SEED;
  const saveRoster = (list) => write(ROSTER_KEY, list);
  const me = () => data.members.find((m) => m.id === 'A');
  const digits = (value) => String(value || '').replace(/\D/g, '');
  const dotted = (date) => date.replaceAll('-', '.');
  const shortDate = (date) => {
    const [y, m, d] = date.split('-');
    return `${y.slice(2)}.${MONTHS[Number(m) - 1]}.${d}`;
  };
  const shortName = (name) => name.replace(' · 시안', '');
  const addDays = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
  const dayGap = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
  const formatPhone = (value) => {
    const n = digits(value).slice(0, 11);
    if (n.length < 4) return n;
    if (n.length < 8) return `${n.slice(0, 3)}-${n.slice(3)}`;
    return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
  };

  /* 제휴사 신청 상태 */
  const joinRequests = () => PartnerUI.getState().requests.filter((r) => r.partner === APPROVAL_PARTNER);
  const joinPending = () => joinRequests().some((r) => r.status === 'pending');
  const otherPending = () => read(PENDING_KEY, []);
  const pendingIds = () => [...(joinPending() ? [APPROVAL_PARTNER] : []), ...otherPending()];
  const linkedMember = () => roster().find((r) => r.status === 'linked') || null;

  const assignments = () => read(ASSIGN_KEY, []);
  const saveAssignments = (list) => write(ASSIGN_KEY, list);
  const current = () => { const list = assignments(); return list.find((x) => x.start <= TODAY) || list[0] || null; };
  const isJoin = (r) => r.kind === 'renewal' && r.first;
  const kindLabel = (r) => (isJoin(r) ? '회원권 신청' : KIND_LABEL[r.kind]);
  function summaryOf(r) {
    if (r.kind === 'hold') return `${r.holdStart} ~ ${r.holdEnd} · ${dayGap(r.holdStart, r.holdEnd) + 1}일`;
    return `${r.planName} · ${r.planDurationDays}일 · ${r.requestedStart} 시작`;
  }

  /* 제휴사 폰의 승인·내보내기 결과를 회원 쪽 등록 목록에 반영한다 */
  function syncApproval() {
    const state = partnerState();
    const approved = PartnerUI.getState().approved.includes(APPROVAL_PARTNER);
    const registered = state.registered.includes(APPROVAL_PARTNER);
    if (approved && !registered) write(PARTNER_KEY, { registered: [...state.registered, APPROVAL_PARTNER], active: APPROVAL_PARTNER });
    if (!approved && registered) {
      const rest = state.registered.filter((id) => id !== APPROVAL_PARTNER);
      write(PARTNER_KEY, { registered: rest, active: state.active === APPROVAL_PARTNER ? rest[0] || null : state.active });
    }
  }

  function identity() {
    const p = profile();
    const avatar = p.photo ? `<img src="${escapeHtml(p.photo)}" alt="">` : icon('UserRound');
    return `<section class="pass-identity">
      <button class="pass-avatar" data-action="pass-photo" aria-label="프로필 사진 변경">${avatar}<span class="pass-avatar-edit">${icon('Camera')}</span></button>
      <input id="pass-camera-input" type="file" accept="image/*" capture="user" hidden>
      <input id="pass-library-input" type="file" accept="image/*" hidden>
      <div class="pass-fields">
        <label><span>이름</span><input id="pass-name" value="${escapeHtml(p.name)}" maxlength="24" autocomplete="name" placeholder="이름을 입력해 주세요"></label>
        <label><span>전화번호</span><input id="pass-phone" type="tel" inputmode="numeric" value="${escapeHtml(p.phone)}" maxlength="13" autocomplete="tel" placeholder="010-0000-0000"></label>
      </div>
    </section>`;
  }

  function distanceM(p) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(p.lat - userLocation.lat);
    const dLng = toRad(p.lng - userLocation.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(userLocation.lat)) * Math.cos(toRad(p.lat)) * Math.sin(dLng / 2) ** 2;
    return 12742000 * Math.asin(Math.sqrt(h));
  }
  const formatDistance = (m) => (m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)}km`);

  function resultsHtml() {
    const q = query.trim().toLowerCase();
    const taken = new Set([...partnerState().registered, ...pendingIds()]);
    const rows = PARTNERS.filter((p) => !taken.has(p.id) && (!q || p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)))
      .map((p) => ({ ...p, distance: userLocation ? distanceM(p) : null }));
    if (userLocation) rows.sort((a, b) => a.distance - b.distance);
    if (!rows.length) return '<p class="partner-empty">검색 결과가 없어요.</p>';
    return rows.map((p) => `<button class="partner-row" data-action="partner-pick" data-id="${p.id}"><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.type)}${p.distance === null ? '' : ` · ${formatDistance(p.distance)}`}</small></span>${icon('ChevronRight')}</button>`).join('');
  }
  function pickerHtml() {
    return `<div class="partner-search">${icon('Search')}<input id="partner-search" type="search" value="${escapeHtml(query)}" placeholder="이름·종목으로 검색" autocomplete="off" aria-label="제휴사 검색"></div><button class="partner-locate${userLocation ? ' on' : ''}" data-action="partner-locate">${icon('MapPin')}<span id="partner-locate-label">${userLocation ? '가까운 순으로 정렬됨' : '가까운 순으로 정렬'}</span></button><div id="partner-results">${resultsHtml()}</div>`;
  }
  function refreshResults() {
    const el = document.getElementById('partner-results');
    if (!el) return;
    el.replaceChildren();
    el.insertAdjacentHTML('beforeend', resultsHtml());
  }
  function locate() {
    const label = document.getElementById('partner-locate-label');
    if (!navigator.geolocation) { label.textContent = '이 기기에서는 위치를 쓸 수 없어요'; return; }
    label.textContent = '위치 확인 중…';
    navigator.geolocation.getCurrentPosition((pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      label.textContent = '가까운 순으로 정렬됨';
      label.parentElement.classList.add('on');
      refreshResults();
    }, () => { label.textContent = '위치를 가져오지 못했어요. 검색해 주세요.'; }, { timeout: 8000, maximumAge: 60000 });
  }
  function pendingRows() {
    return pendingIds().map((id) => {
      const p = PARTNERS.find((x) => x.id === id);
      return `<div class="partner-waiting" role="status"><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.type)}</small></span><em>승인 대기중</em><button class="secondary" data-action="partner-cancel" data-id="${id}">취소</button></div>`;
    }).join('');
  }

  /* 이름과 전화번호가 모두 같은 미연동 회원을 찾는다 */
  function matchRoster() {
    const p = profile();
    if (!p.name.trim() || digits(p.phone).length < 10) return null;
    return roster().find((r) => r.status === 'inactive' && r.name.trim() === p.name.trim() && digits(r.phone) === digits(p.phone)) || null;
  }
  function afterPick(message) {
    query = '';
    if (document.getElementById('sheet').open) closeSheet();
    render(0);
    if (message) toast(message);
  }
  function pick(id) {
    if (id !== APPROVAL_PARTNER) {
      write(PENDING_KEY, [...otherPending(), id]);
      afterPick();
      return;
    }
    const match = matchRoster();
    if (match) {
      saveRoster(roster().map((r) => (r.id === match.id ? { ...r, status: 'linked' } : r)));
      saveAssignments([{ id: Date.now(), plan: match.plan, start: match.start, end: match.end, remaining: match.remaining, maxHolds: match.maxHolds, usedHolds: 0, maxHoldDays: match.maxHoldDays, holds: [] }]);
      PartnerUI.autoApprove(id);
      afterPick('기존 회원 정보와 연결됐어요.');
      return;
    }
    if (PartnerUI.requestJoin(id)) afterPick();
  }

  function bottom() {
    syncApproval();
    const state = partnerState();
    const list = state.active ? `<section class="partner-bottom"><h3>제휴사 등록</h3>${pendingRows()}${state.registered.map((id) => {
      const p = PARTNERS.find((x) => x.id === id);
      const on = id === state.active;
      return `<button class="partner-row" data-action="partner-switch" data-id="${id}" aria-pressed="${on}"><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.type)}</small></span>${on ? '<span class="badge green">이용 중</span>' : icon('ChevronRight')}</button>`;
    }).join('')}<button class="secondary wide" data-action="partner-add">${icon('Plus')}제휴사 추가</button></section>` : '';
    return `${list}<div class="account-actions"><button class="logout-button" data-action="account-logout">로그아웃</button><button class="delete-account" data-action="account-delete">계정 삭제</button></div>`;
  }
  /* 확인 창은 상태바·헤더까지 덮어야 해서 바깥 페이지의 폰 화면에 띄운다 */
  let onDialogConfirm = null;
  function confirmDialog(title, body, onConfirm) {
    onDialogConfirm = onConfirm;
    parent.postMessage({ type: 'member-confirm', title, body }, location.origin);
  }
  addEventListener('message', (e) => {
    if (e.source !== parent || e.origin !== location.origin || e.data?.type !== 'member-confirm-result') return;
    const run = onDialogConfirm;
    onDialogConfirm = null;
    if (e.data.ok && run) run();
  });

  function passes() {
    syncApproval();
    const partner = activePartner();
    if (!partner) return `<section class="pass-section" aria-label="제휴사 선택"><div class="pass-title"><h3>제휴사 선택</h3></div>${pendingRows()}${joinRequests().at(-1)?.status === 'rejected' && !joinPending() ? '<p class="join-rejected" role="status">가입 신청이 거절되었어요. 다시 신청할 수 있어요.</p>' : ''}${pickerHtml()}</section>`;
    const list = assignments();
    const pending = requests();
    const hasHold = pending.some((r) => r.kind === 'hold');
    const hasRenewal = pending.some((r) => r.kind === 'renewal');
    const rows = pending.map((r) => `<div class="pass-pending"><span><strong>${kindLabel(r)} · 승인 대기</strong><small>${escapeHtml(summaryOf(r))}</small></span><button class="secondary" data-action="pass-cancel" data-id="${r.id}">취소</button></div>`).join('');
    const head = `<h3 class="pass-heading">내 회원권</h3><p class="pass-studio">${escapeHtml(shortName(partner.name))}</p>`;
    if (!list.length) return `<section class="pass-section" aria-label="내 회원권">${head}<p class="pass-empty">아직 회원권이 없어요.</p>${rows}<button class="primary wide pass-apply" data-action="pass-renewal" ${hasRenewal ? 'disabled' : ''}>회원권 신청</button></section>`;
    const cards = list.map((item) => {
      const days = Math.max(0, MembershipUI.daysLeft({ expiry: item.end }));
      const waiting = item.start > TODAY ? `<p class="pass-meta">시작 대기 ${dayGap(TODAY, item.start)}일</p>` : '';
      const holds = (item.holds || []).map((h) => `<p class="pass-meta">홀딩 · ${dotted(h.start)} ~ ${dotted(h.end)}</p>`).join('');
      return `<div class="pass-card"><p class="pass-line"><strong>${escapeHtml(item.plan)}</strong><span>${shortDate(item.start)} ~ ${shortDate(item.end)}</span></p><div class="pass-stats"><div><span>남은 횟수</span><strong>${item.remaining === null ? '무제한' : `${Math.max(0, item.remaining)}<small>회</small>`}</strong></div><div><span>남은 기간</span><strong>${days}<small>일</small></strong></div></div><p class="pass-meta">남은 홀딩 ${item.maxHolds - item.usedHolds}회 - 1회 최대 ${item.maxHoldDays}일</p>${waiting}${holds}</div>`;
    }).join('');
    const holdsLeft = current().maxHolds - current().usedHolds;
    return `<section class="pass-section" aria-label="내 회원권">${head}${cards}${rows}<div class="pass-actions"><button class="primary" data-action="pass-renewal" ${hasRenewal ? 'disabled' : ''}>연장신청</button><button class="secondary" data-action="pass-hold" ${hasHold || holdsLeft < 1 ? 'disabled' : ''}>홀딩신청</button></div></section>`;
  }

  /* 달력 동작은 ABoardFit 회원 화면과 같다: 연장은 시작일만 고르고 회원권 기간만큼 띠로 표시, 홀딩은 시작·종료를 고른다 */
  function mountRenewalCalendar(planId, start) {
    const form = document.getElementById('pass-plan-form');
    const span = plans().find((p) => p.id === planId).days;
    const end = addDays(start, span - 1);
    const lastEnd = current()?.end || TODAY;
    const latest = lastEnd > TODAY ? lastEnd : TODAY;
    const fill = (range) => {
      form.elements.start.value = range.start;
      document.getElementById('pass-start-value').textContent = range.start || '—';
    };
    fill({ start });
    RangeCalendar.mount(document.getElementById('pass-calendar'), {
      start, end, single: true, min: addDays(TODAY, -(span - 1)), max: addDays(latest, JOIN_START_MAX_DAYS),
      onChange: (range) => { fill(range); mountRenewalCalendar(planId, range.start); },
    });
  }
  function renewalForm() {
    const options = plans().map((p, i) => `<label class="pass-plan-option"><input type="radio" name="plan" value="${p.id}" ${i === 0 ? 'checked' : ''}><span><strong>${p.name}</strong><small>${p.type} · ${p.detail}</small></span></label>`).join('');
    openSheet(current() ? KIND_LABEL.renewal : '회원권 신청', `<form id="pass-plan-form"><div class="pass-plan-list">${options}</div><input type="hidden" name="start"><div class="cal-range"><div><small>시작일</small><strong id="pass-start-value">—</strong></div></div><div id="pass-calendar"></div><button class="primary wide" type="submit">신청하기</button></form>`);
    mountRenewalCalendar(plans()[0].id, current() ? addDays(current().end, 1) : TODAY);
  }
  function holdForm() {
    const a = current();
    const min = a.start > TODAY ? a.start : TODAY;
    openSheet(KIND_LABEL.hold, `<form id="pass-hold-form" data-max="${a.maxHoldDays}"><p class="sheet-copy">쉬는 기간만큼 회원권 종료일이 늘어나요. 1회 최대 ${a.maxHoldDays}일까지 신청할 수 있어요.</p><input type="hidden" name="start"><input type="hidden" name="end"><div class="cal-range"><div><small>시작일</small><strong id="pass-hold-start">—</strong></div><div><small>종료일</small><strong id="pass-hold-end">—</strong></div></div><div id="pass-calendar"></div><p class="pass-form-error" role="alert"></p><button class="primary wide" type="submit">신청하기</button></form>`);
    const form = document.getElementById('pass-hold-form');
    RangeCalendar.mount(document.getElementById('pass-calendar'), {
      min, max: a.end, initial: min,
      onChange: (range) => {
        form.elements.start.value = range.start;
        form.elements.end.value = range.end || range.start;
        document.getElementById('pass-hold-start').textContent = range.start || '—';
        document.getElementById('pass-hold-end').textContent = range.end || range.start || '—';
        form.querySelector('.pass-form-error').textContent = '';
      },
    });
  }
  function photoSheet() {
    const hasPhoto = !!profile().photo;
    openSheet('프로필 사진', `<div class="photo-options"><button class="photo-option" data-action="photo-camera">${icon('Camera')}사진 촬영</button><button class="photo-option" data-action="photo-library">${icon('Archive')}사진 보관함</button><button class="photo-option danger" data-action="photo-delete" ${hasPhoto ? '' : 'disabled'}>${icon('X')}사진 삭제</button></div>`);
  }
  function addRequest(fields) {
    const id = Date.now();
    knownStatus.set(id, 'pending');
    write(REQUEST_KEY, [...allRequests(), { id, partner: activePartner().id, memberId: 'A', memberName: PartnerUI.memberName(), status: 'pending', ...fields }]);
    closeSheet();
    render(0);
    toast('신청했어요. 제휴사 승인을 기다려 주세요.');
  }

  /* 앱 화면 안의 버튼 */
  function handle(el) {
    const action = el.dataset.action;
    if (action === 'pass-photo') photoSheet();
    else if (action === 'pass-renewal') renewalForm();
    else if (action === 'pass-hold') holdForm();
    else if (action === 'pass-cancel') {
      write(REQUEST_KEY, allRequests().filter((r) => r.id !== Number(el.dataset.id)));
      render(0);
    } else return false;
    return true;
  }

  /* 시트(대화상자)는 앱 화면 밖에 있어서 문서 단위로 받는다 */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'pass-decide') decide(Number(el.dataset.id), el.dataset.approve === 'true');
    else if (action === 'partner-pick') pick(el.dataset.id);
    else if (action === 'partner-locate') locate();
    else if (action === 'partner-cancel') {
      if (el.dataset.id === APPROVAL_PARTNER) PartnerUI.cancelJoin(APPROVAL_PARTNER);
      else write(PENDING_KEY, otherPending().filter((id) => id !== el.dataset.id));
      render(0);
    } else if (action === 'partner-switch') {
      write(PARTNER_KEY, { ...partnerState(), active: el.dataset.id });
      render(0);
    } else if (action === 'partner-add') {
      query = '';
      openSheet('제휴사 추가', pickerHtml());
    } else if (action === 'photo-camera' || action === 'photo-library') {
      closeSheet();
      document.getElementById(action === 'photo-camera' ? 'pass-camera-input' : 'pass-library-input').click();
    } else if (action === 'photo-delete') {
      saveProfile({ photo: '' });
      closeSheet();
      render(0);
    } else if (action === 'account-logout') {
      confirmDialog('로그아웃', '정말 로그아웃 하시겠습니까?', () => parent.postMessage({ type: 'member-close' }, location.origin));
    } else if (action === 'account-delete') {
      confirmDialog('계정 삭제', '계정과 모든 기록·활동 정보가 영구 삭제되며 되돌릴 수 없습니다. 진행할까요?', () => {
        for (const key of [PROFILE_KEY, PARTNER_KEY, PENDING_KEY, ASSIGN_KEY]) localStorage.removeItem(key);
        write(REQUEST_KEY, allRequests().filter((r) => r.memberId !== 'A'));
        saveRoster(roster().map((r) => ({ ...r, status: 'inactive' })));
        PartnerUI.reset();
        userLocation = null;
        render(0);
        toast('시연 계정 정보를 삭제했어요.');
      });
    }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'pass-plan-form') {
      e.preventDefault();
      const form = new FormData(e.target);
      const plan = plans().find((p) => p.id === form.get('plan'));
      addRequest({ kind: 'renewal', first: !current(), planId: plan.id, planName: plan.name, planDurationDays: plan.days, requestedStart: form.get('start') });
    } else if (e.target.id === 'pass-hold-form') {
      e.preventDefault();
      const form = new FormData(e.target);
      const start = form.get('start');
      const end = form.get('end') || start;
      const max = Number(e.target.dataset.max);
      const error = e.target.querySelector('.pass-form-error');
      if (!start) { error.textContent = '시작일을 골라 주세요.'; return; }
      if (dayGap(start, end) + 1 > max) { error.textContent = `1회 최대 ${max}일까지 신청할 수 있어요.`; return; }
      addRequest({ kind: 'hold', holdStart: start, holdEnd: end });
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'partner-search') {
      query = e.target.value;
      refreshResults();
    }
    if (e.target.id === 'pass-name') saveProfile({ name: e.target.value.trim() });
    if (e.target.id === 'pass-phone') {
      e.target.value = formatPhone(e.target.value);
      saveProfile({ phone: e.target.value });
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.name === 'plan' && e.target.form?.id === 'pass-plan-form') {
      mountRenewalCalendar(e.target.value, e.target.form.elements.start.value);
      return;
    }
    if (!['pass-camera-input', 'pass-library-input'].includes(e.target.id) || !e.target.files[0]) return;
    const url = URL.createObjectURL(e.target.files[0]);
    e.target.value = '';
    const image = new Image();
    image.onload = () => {
      const size = 240;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const side = Math.min(image.width, image.height);
      canvas.getContext('2d').drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      saveProfile({ photo: canvas.toDataURL('image/jpeg', 0.82) });
      render(0);
    };
    image.onerror = () => { URL.revokeObjectURL(url); toast('이 사진은 열 수 없어요.'); };
    image.src = url;
  });

  /* 제휴사 쪽 신청 목록과 처리: ABoardFit PinMembershipRequests와 같은 카드(회원·종류·내용·거절/승인) */
  const partnerPending = () => allRequests().filter((r) => r.partner === APPROVAL_PARTNER && r.status === 'pending');
  function requestsHtml() {
    return partnerPending().map((r) => {
      const photo = r.memberId === 'A' ? profile().photo : '';
      const name = r.memberId === 'A' ? PartnerUI.memberName() : r.memberName;
      const avatar = photo ? `<img src="${escapeHtml(photo)}" alt="">` : escapeHtml(name.replace('회원 ', '').slice(0, 1));
      return `<section class="request-card pass-request" data-request="${r.id}"><div class="request-title"><span class="avatar pink">${avatar}</span><div><strong>${escapeHtml(name)}</strong><p>${kindLabel(r)}</p></div></div><div class="request-detail">${escapeHtml(summaryOf(r))}</div><div class="pass-decide-row"><button class="pass-reject" data-action="pass-decide" data-id="${r.id}" data-approve="false">거절</button><button class="primary" data-action="pass-decide" data-id="${r.id}" data-approve="true">승인</button></div></section>`;
    }).join('');
  }
  function applyApproval(r) {
    if (r.memberId !== 'A') {
      const m = data.members.find((x) => x.id === r.memberId);
      if (!m) return;
      if (r.kind === 'hold') m.expiry = addDays(m.expiry, dayGap(r.holdStart, r.holdEnd) + 1);
      else m.expiry = addDays(r.requestedStart, r.planDurationDays - 1);
      return;
    }
    const list = assignments();
    if (r.kind === 'hold') {
      const target = list.find((x) => x.start <= TODAY) || list[0];
      if (!target) return;
      const added = dayGap(r.holdStart, r.holdEnd) + 1;
      target.end = addDays(target.end, added);
      target.usedHolds += 1;
      target.holds = [...(target.holds || []), { start: r.holdStart, end: r.holdEnd }];
      saveRoster(roster().map((x) => (x.status === 'linked' ? { ...x, end: target.end } : x)));
    } else {
      const plan = plans().find((p) => p.id === r.planId);
      list.push({ id: r.id, plan: r.planName, start: r.requestedStart, end: addDays(r.requestedStart, r.planDurationDays - 1), remaining: plan ? plan.sessions : null, maxHolds: 2, usedHolds: 0, maxHoldDays: 14, holds: [] });
      list.sort((x, y) => (x.start < y.start ? -1 : 1));
    }
    saveAssignments(list);
  }
  function decide(id, approve) {
    const target = allRequests().find((r) => r.id === id && r.status === 'pending');
    if (!target) return;
    if (approve) applyApproval(target);
    write(REQUEST_KEY, allRequests().map((r) => (r.id === id ? { ...r, status: approve ? 'approved' : 'rejected', decidedAt: Date.now() } : r)));
    syncRoster();
    renderAll();
    toast(approve ? '승인했어요.' : '거절했어요.');
  }
  /* 회원 화면: 제휴사 처리 결과를 바로 반영 */
  let knownStatus = new Map(allRequests().map((r) => [r.id, r.status]));
  addEventListener('storage', (e) => {
    if (e.key !== REQUEST_KEY && e.key !== ASSIGN_KEY) return;
    if (window.memberStartPage !== 'profile') return;
    const decided = allRequests().find((r) => r.memberId === 'A' && knownStatus.get(r.id) === 'pending' && r.status !== 'pending');
    knownStatus = new Map(allRequests().map((r) => [r.id, r.status]));
    render(0);
    if (decided) toast(`${kindLabel(decided)}이 ${decided.status === 'approved' ? '승인' : '거절'}되었어요.`);
  });
  const requestKindText = (r) => kindLabel(r);

  function addRoster(member) {
    const list = roster();
    saveRoster([...list, { id: `R${Date.now()}`, start: TODAY, maxHolds: 2, maxHoldDays: 14, status: 'inactive', ...member }]);
  }
  /* 제휴사가 바꾼 이용권을 명단과 앱 회원의 회원권에 함께 저장한다 */
  function updatePass(id, pass) {
    if (roster().some((r) => r.id === id)) saveRoster(roster().map((r) => (r.id === id ? { ...r, ...pass } : r)));
    if (id !== (linkedMember()?.id || 'A')) return;
    const list = assignments();
    saveAssignments(list.length ? [{ ...list[0], ...pass }, ...list.slice(1)] : [{ id: Date.now(), usedHolds: 0, holds: [], ...pass }]);
  }
  /* 앱을 쓰는 회원은 연동된 명단 행(없으면 A) 하나뿐이다 */
  function photoOf(id) {
    const owner = linkedMember()?.id || 'A';
    return id === owner ? profile().photo || '' : '';
  }
  return { identity, passes, bottom, handle, roster, addRoster, assignments, requestsHtml, partnerPending, requestKindText, photoOf, updatePass, ROSTER_KEY, PARTNER_KEY, REQUEST_KEY, PROFILE_KEY };
})();
