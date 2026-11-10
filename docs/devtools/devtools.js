/* 개발용 PC 화면: 디자인 조절 · 아트 기준 · 경제 검토.
   회원·제휴사 화면과 별개인 시안 확인 도구다. 게임 값은 게임 iframe 의 window.landTune 으로만 바꾼다. */
(function () {
  const R = window.LandRules;
  const t = (key, vars) => I18n.t(key, vars);
  const num = (v, digits = 0) => I18n.number(v, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const pct = (v) => num(v * 100, 1) + '%';
  const root = document.getElementById('devtools');
  if (!root || !R) return;

  const ICON = {
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.6-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-7.2-9-7.2Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>',
    coins: '<circle cx="9" cy="9" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.4 18"/><path d="M8 7h2v4"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  };
  const icon = (name) => `<svg class="dev-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;
  const fill = (el, markup) => { el.replaceChildren(); el.insertAdjacentHTML('beforeend', markup); };

  const TABS = [
    { id: 'tune', icon: 'sliders', label: 'dev.tab.tune' },
    { id: 'art', icon: 'palette', label: 'dev.tab.art' },
    { id: 'economy', icon: 'coins', label: 'dev.tab.economy' },
  ];
  let tab = 'tune';
  try { tab = sessionStorage.getItem('my-workout-garden:dev-tab') || 'tune'; } catch { /* 탭 기억은 편의 기능 */ }
  let attendancePoints = 100;
  let flash = '';

  fill(root, `
    <p class="role role-dev">${t('dev.role')}</p>
    <div class="monitor">
      <div class="monitor-screen">
        <header class="dev-bar">
          <span class="dev-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <strong>${t('dev.title')}</strong>
          <small>${t('dev.subtitle')}</small>
        </header>
        <div class="dev-body">
          <nav class="dev-tabs" role="tablist" aria-label="${t('dev.title')}">
            ${TABS.map((x) => `<button type="button" role="tab" id="dev-tab-${x.id}" aria-controls="dev-panel" data-dev-tab="${x.id}">${icon(x.icon)}<span>${t(x.label)}</span></button>`).join('')}
          </nav>
          <section class="dev-panel" id="dev-panel" role="tabpanel"></section>
        </div>
      </div>
    </div>
    <div class="monitor-stand" aria-hidden="true"><i></i></div>`);
  const panel = root.querySelector('#dev-panel');

  const game = () => document.getElementById('game')?.contentWindow;
  const tune = () => { try { return game()?.landTune || null; } catch { return null; } };

  /* ---------- 디자인 조절 ---------- */
  const GROUPS = ['character', 'camera', 'light'];
  const format = (d, v) => d.type === 'color' ? v : num(v, d.step < 1 ? 2 : 0) + (d.unit || '');
  function dirtyCount(api) {
    const now = api.values(), saved = api.saved();
    return Object.keys(now).filter((k) => now[k] !== saved[k]).length;
  }
  function renderTune() {
    const api = tune();
    if (!api) { fill(panel, `<div class="dev-empty">${icon('info')}<p>${t('dev.tune.waiting')}</p></div>`); return; }
    const values = api.values(), defaults = api.defaults();
    const row = (d) => {
      const v = values[d.key];
      const control = d.type === 'color'
        ? `<input type="color" value="${v}" data-tune="${d.key}" aria-label="${t('dev.tune.' + d.key)}">`
        : `<input type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${v}" data-tune="${d.key}" aria-label="${t('dev.tune.' + d.key)}">`;
      return `<div class="tune-row${v !== defaults[d.key] ? ' changed' : ''}">
        <label for="tune-${d.key}"><span>${t('dev.tune.' + d.key)}</span><small>${t('dev.tune.' + d.key + '.hint')}</small></label>
        ${control.replace('data-tune', `id="tune-${d.key}" data-tune`)}
        <output for="tune-${d.key}" data-out="${d.key}">${format(d, v)}</output>
        <button type="button" class="tune-default" data-default="${d.key}" aria-label="${t('dev.tune.default', { name: t('dev.tune.' + d.key) })}" title="${t('dev.tune.defaultShort')}" ${v === defaults[d.key] ? 'disabled' : ''}>${icon('undo')}</button>
      </div>`;
    };
    const dirty = dirtyCount(api);
    fill(panel, `
      <div class="dev-head">
        <div><h2>${t('dev.tab.tune')}</h2><p>${t('dev.tune.lead')}</p></div>
        <div class="dev-actions">
          <span class="dev-status${dirty ? ' warn' : ''}" role="status">${flash || (dirty ? t('dev.tune.dirty', { n: dirty }) : t('dev.tune.clean'))}</span>
          <button type="button" class="dev-btn ghost" data-act="revert" ${dirty ? '' : 'disabled'}>${t('dev.tune.revert')}</button>
          <button type="button" class="dev-btn ghost" data-act="defaults">${t('dev.tune.defaults')}</button>
          <button type="button" class="dev-btn ghost" data-act="copy">${t('dev.tune.copy')}</button>
          <button type="button" class="dev-btn primary" data-act="save" ${dirty ? '' : 'disabled'}>${t('dev.tune.save')}</button>
        </div>
      </div>
      <div class="tune-groups">
        ${GROUPS.map((g) => `<fieldset class="tune-group"><legend>${t('dev.group.' + g)}</legend>${api.defs.filter((d) => d.group === g).map(row).join('')}</fieldset>`).join('')}
      </div>
      <p class="dev-note">${icon('info')}${t('dev.tune.note')}</p>`);
    flash = '';
  }
  function updateTuneRow(key) {
    const api = tune(); if (!api) return;
    const d = api.defs.find((x) => x.key === key), v = api.values()[key], def = api.defaults()[key];
    const out = panel.querySelector(`[data-out="${key}"]`); if (out) out.textContent = format(d, v);
    const rowEl = out?.closest('.tune-row'); rowEl?.classList.toggle('changed', v !== def);
    const reset = panel.querySelector(`[data-default="${key}"]`); if (reset) reset.disabled = v === def;
    const dirty = dirtyCount(api);
    const status = panel.querySelector('.dev-status');
    if (status) { status.textContent = dirty ? t('dev.tune.dirty', { n: dirty }) : t('dev.tune.clean'); status.classList.toggle('warn', !!dirty); }
    panel.querySelector('[data-act="save"]').disabled = !dirty;
    panel.querySelector('[data-act="revert"]').disabled = !dirty;
  }

  /* ---------- 아트 기준 ---------- */
  let artPalette = null;
  import('../land/art-style.js').then((m) => { artPalette = m; if (tab === 'art') render(); }).catch(() => { artPalette = false; if (tab === 'art') render(); });
  const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
  const swatch = (color, name) => `<li class="swatch"><i style="background:${color}"></i><span>${name}</span><code>${color.toUpperCase()}</code></li>`;
  function renderArt() {
    const api = tune(), v = api?.values(), c = api?.constants || { cell: .8, blockStep: R.TERRAIN_STEP, petHeight: .66, maxBlocks: R.TERRAIN_MAX };
    const p = artPalette && artPalette.gardenPalette;
    const material = p ? ['soilTop', 'soilSide', 'soilEdge', 'grass', 'leaf', 'leafTop', 'leafShade', 'bark', 'barkTop'].map((k) => swatch(p[k], t('dev.art.mat.' + k))).join('') : `<li class="dev-muted">${t('dev.art.loadFail')}</li>`;
    const mosaic = artPalette ? artPalette.soilMosaicPalette.map((rgb, i) => swatch(hex(rgb), t('dev.art.mosaic', { n: i + 1 }))).join('') : '';
    const scene = [[v?.sky || '#64cfc1', 'dev.art.sky'], [v?.sea || '#00b5bd', 'dev.art.sea']].map(([col, k]) => swatch(col, t(k))).join('');
    const ui = [['#64CFBD', 'dev.art.uiMint'], ['#FFDC22', 'dev.art.uiYellow'], ['#E4546F', 'dev.art.uiCoral'], ['#F5CDD8', 'dev.art.uiPink'], ['#123D40', 'dev.art.uiInk']].map(([col, k]) => swatch(col, t(k))).join('');
    const pet = c.petHeight * (v?.petScale ?? 1);
    const ratios = [
      [t('dev.art.ratio.cell'), num(c.cell, 2)],
      [t('dev.art.ratio.block'), t('dev.art.ratio.blockValue', { h: num(c.blockStep, 2), max: num(c.maxBlocks) })],
      [t('dev.art.ratio.pet'), t('dev.art.ratio.petValue', { h: num(pet, 2), r: num(pet / c.cell * 100) })],
      [t('dev.art.ratio.fov'), num(v?.fov ?? 40) + '°'],
      [t('dev.art.ratio.tilt'), num(v?.maxTilt ?? 68) + '°'],
    ].map(([k, val]) => `<div><dt>${k}</dt><dd>${val}</dd></div>`).join('');
    const rules = ['sky', 'ground', 'animal', 'menu', 'color'].map((k) => `<li>${icon('check')}${t('dev.art.rule.' + k)}</li>`).join('');
    fill(panel, `
      <div class="dev-head"><div><h2>${t('dev.tab.art')}</h2><p>${t('dev.art.lead')}</p></div></div>
      <div class="art-grid">
        <section class="dev-card"><h3>${t('dev.art.materials')}</h3><ul class="swatches">${material}</ul></section>
        <section class="dev-card"><h3>${t('dev.art.ground')}</h3><ul class="swatches compact">${mosaic}</ul></section>
        <section class="dev-card"><h3>${t('dev.art.scene')}</h3><ul class="swatches">${scene}</ul><h3>${t('dev.art.ui')}</h3><ul class="swatches">${ui}</ul></section>
        <section class="dev-card"><h3>${t('dev.art.ratios')}</h3><dl class="ratios">${ratios}</dl><h3>${t('dev.art.rules')}</h3><ul class="rules">${rules}</ul></section>
      </div>
      <p class="dev-note">${icon('info')}${t('dev.art.note')}</p>`);
  }

  /* ---------- 경제 검토: 게임 규칙(land-rules.js)의 실제 숫자로 계산 ---------- */
  function economy() {
    const crops = Object.entries(R.crops);
    const randomSeedValue = crops.reduce((n, [, c]) => n + c.weight * c.price, 0);
    const seeds = [{ name: t('dev.eco.randomSeed'), cost: R.SEED_PRICE, value: randomSeedValue },
      ...crops.map(([k, c]) => ({ name: tr(c.ko), cost: R.SEED_PRICES[k], value: c.price }))];
    const G = R.GACHA, rarities = ['common', 'uncommon', 'rare', 'legendary'];
    const sell = Object.fromEntries(rarities.map((r) => { const kind = Object.entries(G.pools.building).find(([, x]) => x === r)?.[0]; return [r, kind ? R.sellPrice('building', kind) : 0]; }));
    const single = rarities.reduce((n, r) => n + G.rates[r] * sell[r], 0);
    const topRate = G.rates.rare + G.rates.legendary;
    const guaranteed = (G.rates.rare * sell.rare + G.rates.legendary * sell.legendary) / topRate;
    const eleven = single * 10 + guaranteed;
    const levels = Array.from({ length: R.MAX_EXPANSION }, (_, i) => { const sec = R.unlockSeconds(i); return { level: i + 1, sec, cost: Math.max(10, Math.ceil(sec / 6)) }; });
    return { seeds, sell, rarities, single, eleven, guaranteed, levels, G };
  }
  const duration = (sec) => sec >= 86400 ? t('dev.eco.days', { n: num(sec / 86400, sec % 86400 ? 1 : 0) }) : sec >= 3600 ? t('dev.eco.hours', { n: num(sec / 3600, sec % 3600 ? 1 : 0) }) : sec >= 60 ? t('dev.eco.minutes', { n: num(sec / 60) }) : t('dev.eco.seconds', { n: num(sec) });
  function renderEconomy() {
    const e = economy(), G = e.G, P = (n) => num(n) + 'P';
    const daysFor = (cost) => Math.ceil(cost / Math.max(1, attendancePoints));
    const checks = [
      { ok: e.seeds[0].value < e.seeds[0].cost, text: t('dev.eco.check.seed', { v: num(e.seeds[0].value, 2) + 'P', c: P(e.seeds[0].cost) }) },
      { ok: e.single < G.price && e.eleven < G.tenPrice, text: t('dev.eco.check.gacha', { a: pct(e.single / G.price), b: pct(e.eleven / G.tenPrice) }) },
      { ok: e.eleven / G.tenPrice > e.single / G.price, text: t('dev.eco.check.bulk') },
      { ok: null, text: t('dev.eco.check.legend', { v: P(e.sell.legendary), n: num(Math.floor(e.sell.legendary / G.tenPrice)) }) },
      { ok: null, text: t('dev.eco.check.attend', { p: P(attendancePoints), n: num(daysFor(G.tenPrice)) }) },
    ];
    const badge = (ok) => ok === null ? `<span class="badge info">${icon('info')}${t('dev.eco.info')}</span>` : ok ? `<span class="badge ok">${icon('check')}${t('dev.eco.pass')}</span>` : `<span class="badge warn">${icon('alert')}${t('dev.eco.warn')}</span>`;
    const seedRows = e.seeds.map((s) => `<tr><th scope="row">${s.name}</th><td>${P(s.cost)}</td><td>${num(s.value, s.value % 1 ? 2 : 0)}P</td><td>${pct(s.value / s.cost)}</td></tr>`).join('');
    const rarityRows = e.rarities.map((r) => `<tr><th scope="row">${tr(R.rarities[r].ko)}</th><td>${pct(G.rates[r])}</td><td>${P(e.sell[r])}</td><td>${num(G.rates[r] * e.sell[r], 1)}P</td></tr>`).join('');
    const totalSkip = e.levels.reduce((n, l) => n + l.cost, 0);
    const levelRows = e.levels.map((l) => `<tr><th scope="row">${num(l.level)}</th><td>${duration(l.sec)}</td><td>${P(l.cost)}</td><td>${num(daysFor(l.cost))}</td></tr>`).join('');
    fill(panel, `
      <div class="dev-head">
        <div><h2>${t('dev.tab.economy')}</h2><p>${t('dev.eco.lead')}</p></div>
        <label class="dev-input">${t('dev.eco.attendance')}<input type="number" min="1" max="10000" step="10" value="${attendancePoints}" data-eco="attendance"><span>P</span></label>
      </div>
      <ul class="checks">${checks.map((c) => `<li>${badge(c.ok)}<span>${c.text}</span></li>`).join('')}</ul>
      <div class="eco-grid">
        <section class="dev-card"><h3>${t('dev.eco.seeds')}</h3>
          <table><thead><tr><th scope="col">${t('dev.eco.col.item')}</th><th scope="col">${t('dev.eco.col.cost')}</th><th scope="col">${t('dev.eco.col.sale')}</th><th scope="col">${t('dev.eco.col.return')}</th></tr></thead><tbody>${seedRows}</tbody></table>
          <p class="dev-muted">${t('dev.eco.seedsNote')}</p></section>
        <section class="dev-card"><h3>${t('dev.eco.gacha')}</h3>
          <table><thead><tr><th scope="col">${t('dev.eco.col.rarity')}</th><th scope="col">${t('dev.eco.col.rate')}</th><th scope="col">${t('dev.eco.col.sale')}</th><th scope="col">${t('dev.eco.col.expected')}</th></tr></thead><tbody>${rarityRows}</tbody></table>
          <dl class="ratios"><div><dt>${t('dev.eco.single', { p: P(G.price) })}</dt><dd>${P(Math.round(e.single))} · ${pct(e.single / G.price)}</dd></div><div><dt>${t('dev.eco.eleven', { p: P(G.tenPrice) })}</dt><dd>${P(Math.round(e.eleven))} · ${pct(e.eleven / G.tenPrice)}</dd></div></dl></section>
        <section class="dev-card wide"><h3>${t('dev.eco.expand')}</h3>
          <div class="table-scroll"><table><thead><tr><th scope="col">${t('dev.eco.col.level')}</th><th scope="col">${t('dev.eco.col.wait')}</th><th scope="col">${t('dev.eco.col.skip')}</th><th scope="col">${t('dev.eco.col.days')}</th></tr></thead><tbody>${levelRows}</tbody></table></div>
          <p class="dev-muted">${t('dev.eco.expandNote', { total: P(totalSkip), days: num(daysFor(totalSkip)) })}</p></section>
      </div>
      <p class="dev-note">${icon('info')}${t('dev.eco.note')}</p>`);
  }

  function render() {
    for (const b of root.querySelectorAll('[data-dev-tab]')) {
      const on = b.dataset.devTab === tab;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', 'dev-tab-' + tab);
    if (tab === 'art') renderArt(); else if (tab === 'economy') renderEconomy(); else renderTune();
  }

  root.addEventListener('click', async (e) => {
    const tabBtn = e.target.closest('[data-dev-tab]');
    if (tabBtn) {
      tab = tabBtn.dataset.devTab;
      try { sessionStorage.setItem('my-workout-garden:dev-tab', tab); } catch { /* 무시 */ }
      render();
      return;
    }
    const api = tune();
    const def = e.target.closest('[data-default]');
    if (def && api) {
      const key = def.dataset.default, v = api.defaults()[key];
      api.set(key, v);
      const input = panel.querySelector(`[data-tune="${key}"]`); if (input) input.value = v;
      updateTuneRow(key);
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act || !api) return;
    if (act === 'save') flash = api.save() ? t('dev.tune.saved') : t('dev.tune.saveFail');
    else if (act === 'revert') { const s = api.saved(); for (const k of Object.keys(s)) api.set(k, s[k]); }
    else if (act === 'defaults') { const d = api.defaults(); for (const k of Object.keys(d)) api.set(k, d[k]); }
    else if (act === 'copy') {
      const now = api.values(), d = api.defaults();
      const changed = Object.fromEntries(Object.entries(now).filter(([k, v]) => v !== d[k]));
      try { await navigator.clipboard.writeText(JSON.stringify(changed, null, 2)); flash = t('dev.tune.copied', { n: Object.keys(changed).length }); }
      catch { flash = t('dev.tune.copyFail'); }
    }
    renderTune();
  });
  root.addEventListener('keydown', (e) => {
    const cur = e.target.closest('[data-dev-tab]');
    if (!cur || !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const ids = TABS.map((x) => x.id), step = ['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : -1;
    tab = ids[(ids.indexOf(cur.dataset.devTab) + step + ids.length) % ids.length];
    render();
    root.querySelector(`[data-dev-tab="${tab}"]`).focus();
  });
  root.addEventListener('input', (e) => {
    const key = e.target.dataset.tune;
    if (key) { tune()?.set(key, e.target.type === 'color' ? e.target.value : Number(e.target.value)); updateTuneRow(key); return; }
    if (e.target.dataset.eco === 'attendance') {
      const v = Math.round(Number(e.target.value));
      if (v >= 1 && v <= 10000) { attendancePoints = v; const pos = e.target.selectionStart; renderEconomy(); const again = panel.querySelector('[data-eco="attendance"]'); again.focus(); try { again.setSelectionRange(pos, pos); } catch { /* number 입력은 커서 위치를 지원하지 않을 수 있다 */ } }
    }
  });

  /* 게임이 다시 열리면(언어 변경 등) 조절 패널을 다시 연결한다 */
  document.getElementById('game')?.addEventListener('load', () => setTimeout(render, 600));
  let tries = 0;
  const wait = setInterval(() => { if (tune() || ++tries > 60) { clearInterval(wait); render(); } }, 500);
  render();
})();
