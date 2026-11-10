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
    try { localStorage.setItem(KEY, JSON.stringify(next)); return true; } catch { toast(tr('partner.member.pass.0504')); return false; }
  }
  const isCount = (plan) => plan.type === 'count';
  const summary = (plan) => tr('partner.membership.plans.0557',{v0:isCount(plan) ? tr('partner.membership.plans.0558',{v0:plan.total}) : tr('partner.membership.plans.0559'),v1:plan.days});
  const options = (selected) => list().map((p) => `<option value="${escapeHtml(p.id)}" ${p.id === selected?.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
  function swap(title, body) {
    if (sheet.open) closeSheet();
    openSheet(title, body);
  }

  /* 강사 관리처럼 등록한 회원권을 설정 화면에 바로 펼쳐 둔다 */
  function section() {
    return `<section class="instructor-settings plan-settings"><div class="section-title"><h3>${tr('partner.app.0321')}</h3><button class="text-button inline" data-action="plan-add">${icon('Plus')}${tr('partner.instructors.0455')}</button></div>${list().map((p) => `<div class="instructor-row"><span class="avatar">${icon('Ticket')}</span><div><strong>${escapeHtml(p.name)}</strong><small>${summary(p)} ${tr('partner.membership.plans.0560')} ${p.maxHolds}${tr('partner.membership.plans.0561')} ${p.maxHoldDays}${tr('partner.member.pass.0531')}</small></div><button class="icon-button" data-action="plan-edit" data-plan="${escapeHtml(p.id)}" aria-label="${tr('common.editItem',{name:escapeHtml(p.name)})}">${icon('Pencil')}</button></div>`).join('')}</section>`;
  }
  function done(message) {
    closeSheet();
    renderAll();
    toast(message);
  }
  const edit = (id) => form(id ? list().find((p) => p.id === id) : null);

  function form(plan) {
    const draft = plan || { name: '', type: 'period', days: 30, total: 10, maxHolds: 1, maxHoldDays: 14 };
    let type = draft.type;
    swap(plan ? tr('partner.membership.plans.0562') : tr('partner.membership.plans.0563'), `<form id="plan-form" novalidate>
      <label class="field">${tr('partner.membership.plans.0565')}<input name="name" maxlength="40" placeholder="${tr('partner.membership.plans.0564')}" value="${escapeHtml(draft.name)}"></label>
      <p class="plan-label">${tr('partner.membership.plans.0566')}</p>
      <div class="plan-choice"><button type="button" class="chip" data-plan-type="period">${tr('partner.membership.plans.0559')}</button><button type="button" class="chip" data-plan-type="count">${tr('partner.membership.plans.0567')}</button></div>
      <p class="plan-label">${tr('partner.membership.plans.0568')}</p>
      <div class="plan-presets">${PRESETS.map((d) => `<button type="button" class="chip" data-plan-days="${d}">${d}${tr('partner.member.pass.0531')}</button>`).join('')}</div>
      <label class="field">${tr('partner.membership.plans.0569')}<input name="days" type="number" inputmode="numeric" min="1" max="3660" value="${draft.days}"></label>
      <label class="field" id="plan-total-field">${tr('partner.membership.plans.0570')}<input name="total" type="number" inputmode="numeric" min="1" max="10000" value="${draft.total ?? 10}"></label>
      <div class="form-row"><label class="field">${tr('partner.membership.plans.0571')}<input name="maxHolds" type="number" inputmode="numeric" min="0" max="100" value="${draft.maxHolds}"></label><label class="field">${tr('partner.membership.plans.0572')}<input name="maxHoldDays" type="number" inputmode="numeric" min="0" max="3660" value="${draft.maxHoldDays}"></label></div>
      <p class="error-message" id="plan-error" role="alert"></p>
      <button class="primary wide" type="submit">${tr('partner.app.0313')}</button>
      ${plan ? `<button type="button" class="text-button wide" id="plan-delete" ${list().length < 2 ? 'disabled' : ''}>${tr('partner.membership.plans.0573')}</button>` : ''}
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
        if (save(list().filter((p) => p.id !== plan.id))) done(tr('partner.membership.plans.0574'));
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
      if (!name) return error(tr('partner.membership.plans.0575'));
      if (!Number.isInteger(days) || days < 1 || days > 3660) return error(tr('partner.membership.plans.0576'));
      if (type === 'count' && (!Number.isInteger(total) || total < 1 || total > 10000)) return error(tr('partner.membership.plans.0577'));
      if (!Number.isInteger(maxHolds) || maxHolds < 0 || maxHolds > 100) return error(tr('partner.membership.plans.0578'));
      if (!Number.isInteger(maxHoldDays) || maxHoldDays < 0 || maxHoldDays > 3660) return error(tr('partner.membership.plans.0579'));
      const next = { id: plan?.id || `plan-${Date.now()}`, name, type, days, total: type === 'count' ? total : null, maxHolds, maxHoldDays };
      if (save(plan ? list().map((p) => (p.id === plan.id ? next : p)) : [...list(), next])) done(tr('partner.membership.plans.0580'));
      return undefined;
    };
  }

  return { list, isCount, options, section, edit };
})();
