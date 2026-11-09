/* 제휴사 회원권 설정. 항목과 검증은 ABoardFit PinMembershipScreen(이름·기간권/횟수권·기간·홀딩 한도)을 따른다. */
const MembershipPlans = (() => {
  const KEY = 'my-workout-garden:plans:v1';
  const PRESETS = [30, 90, 180, 365];
  const SEED = [
    { id: 'count12', name: '주 3회 회원권', type: 'count', days: 28, total: 12, maxHolds: 2, maxHoldDays: 14 },
    { id: 'count24', name: '주 2회 회원권', type: 'count', days: 90, total: 24, maxHolds: 3, maxHoldDays: 21 },
    { id: 'month1', name: '1개월 회원권', type: 'period', days: 30, total: null, maxHolds: 1, maxHoldDays: 7 },
    { id: 'month3', name: '3개월 회원권', type: 'period', days: 90, total: null, maxHolds: 2, maxHoldDays: 14 },
  ];

  function list() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(saved) && saved.length ? saved : SEED;
    } catch { return SEED; }
  }
  function save(next) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); return true; } catch { toast('이 기기에 저장하지 못했어요.'); return false; }
  }
  const isCount = (plan) => plan.type === 'count';
  const summary = (plan) => `${isCount(plan) ? `횟수권 · ${plan.total}회` : '기간권'} · ${plan.days}일`;
  const options = (selected) => list().map((p) => `<option value="${escapeHtml(p.id)}" ${p.id === selected?.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
  function swap(title, body) {
    if (sheet.open) closeSheet();
    openSheet(title, body);
  }

  function open() {
    swap('회원권', `<div class="plan-list">${list().map((p) => `<button type="button" class="plan-row" data-plan="${escapeHtml(p.id)}"><span><strong>${escapeHtml(p.name)}</strong><small>${summary(p)} · 홀딩 ${p.maxHolds}회 · 1회 최대 ${p.maxHoldDays}일</small></span>${icon('ChevronRight')}</button>`).join('')}</div><button type="button" class="primary wide" id="plan-add">회원권 추가</button>`);
    document.querySelectorAll('.plan-row').forEach((row) => { row.onclick = () => form(list().find((p) => p.id === row.dataset.plan)); });
    document.getElementById('plan-add').onclick = () => form(null);
  }

  function form(plan) {
    const draft = plan || { name: '', type: 'period', days: 30, total: 10, maxHolds: 1, maxHoldDays: 14 };
    let type = draft.type;
    swap(plan ? '회원권 수정' : '회원권 추가', `<form id="plan-form" novalidate>
      <label class="field">회원권 이름<input name="name" maxlength="40" placeholder="예: 3개월 회원권" value="${escapeHtml(draft.name)}"></label>
      <p class="plan-label">회원권 종류</p>
      <div class="plan-choice"><button type="button" class="chip" data-plan-type="period">기간권</button><button type="button" class="chip" data-plan-type="count">횟수권</button></div>
      <p class="plan-label">이용 기간</p>
      <div class="plan-presets">${PRESETS.map((d) => `<button type="button" class="chip" data-plan-days="${d}">${d}일</button>`).join('')}</div>
      <label class="field">기간 (일)<input name="days" type="number" inputmode="numeric" min="1" max="3660" value="${draft.days}"></label>
      <label class="field" id="plan-total-field">총 횟수<input name="total" type="number" inputmode="numeric" min="1" max="10000" value="${draft.total ?? 10}"></label>
      <div class="form-row"><label class="field">최대 홀딩 횟수<input name="maxHolds" type="number" inputmode="numeric" min="0" max="100" value="${draft.maxHolds}"></label><label class="field">1회 최대 홀딩 일수<input name="maxHoldDays" type="number" inputmode="numeric" min="0" max="3660" value="${draft.maxHoldDays}"></label></div>
      <p class="error-message" id="plan-error" role="alert"></p>
      <button class="primary wide" type="submit">저장</button>
      ${plan ? `<button type="button" class="text-button wide" id="plan-delete" ${list().length < 2 ? 'disabled' : ''}>회원권 삭제</button>` : ''}
    </form>`);
    const el = document.getElementById('plan-form');
    const syncChoices = () => {
      el.querySelectorAll('[data-plan-type]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.planType === type)));
      el.querySelectorAll('[data-plan-days]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.planDays === el.elements.days.value)));
      document.getElementById('plan-total-field').hidden = type !== 'count';
    };
    el.querySelectorAll('[data-plan-type]').forEach((b) => { b.onclick = () => { type = b.dataset.planType; syncChoices(); }; });
    el.querySelectorAll('[data-plan-days]').forEach((b) => { b.onclick = () => { el.elements.days.value = b.dataset.planDays; syncChoices(); }; });
    el.elements.days.oninput = syncChoices;
    syncChoices();
    if (plan && list().length > 1) {
      document.getElementById('plan-delete').onclick = () => {
        if (save(list().filter((p) => p.id !== plan.id))) { open(); toast('회원권을 삭제했어요.'); }
      };
    }
    el.onsubmit = (e) => {
      e.preventDefault();
      const error = (text) => { document.getElementById('plan-error').textContent = text; };
      const f = new FormData(el);
      const name = f.get('name').trim();
      const days = Number(f.get('days'));
      const total = Number(f.get('total'));
      const maxHolds = Number(f.get('maxHolds'));
      const maxHoldDays = Number(f.get('maxHoldDays'));
      if (!name) return error('회원권 이름을 입력해 주세요.');
      if (!Number.isInteger(days) || days < 1 || days > 3660) return error('이용 기간을 확인해 주세요.');
      if (type === 'count' && (!Number.isInteger(total) || total < 1 || total > 10000)) return error('총 횟수를 확인해 주세요.');
      if (!Number.isInteger(maxHolds) || maxHolds < 0 || maxHolds > 100) return error('최대 홀딩 횟수를 확인해 주세요.');
      if (!Number.isInteger(maxHoldDays) || maxHoldDays < 0 || maxHoldDays > 3660) return error('홀딩 일수를 확인해 주세요.');
      const next = { id: plan?.id || `plan-${Date.now()}`, name, type, days, total: type === 'count' ? total : null, maxHolds, maxHoldDays };
      if (save(plan ? list().map((p) => (p.id === plan.id ? next : p)) : [...list(), next])) { open(); toast('회원권을 저장했어요.'); }
      return undefined;
    };
  }

  return { list, isCount, options, open };
})();
